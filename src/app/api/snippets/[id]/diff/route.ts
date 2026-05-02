import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isGuardOk } from "@/lib/auth/requireAuth";
import { combinedRateLimit } from "@/lib/security/rateLimit";
import { withSnippetRlsContext } from "@/lib/db/pool";
import { diffQuerySchema, uuidSchema, validateInput, formatZodError, parseSearchParams } from "@/lib/security/validation";
import { computeDiff } from "@/lib/snippets/diff";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface VersionRow {
  id: string;
  snippet_id: string;
  pattern: string;
  flags: string;
  notes: string | null;
  created_at: Date;
}

async function verifySnippetOwnership(snippetId: string, userId: string): Promise<boolean> {
  const row = await withSnippetRlsContext(userId, async (client) => {
    const result = await client.query<{ user_id: string }>(
      `SELECT user_id::text FROM snippets WHERE id = $1::uuid`,
      [snippetId]
    );
    return result.rows[0] ?? null;
  });

  return Boolean(row);
}

/**
 * GET /api/snippets/:id/diff?from=&to= - Compute diff between two versions (requires auth)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResponse = await combinedRateLimit(request, "api_free");
    if (rateLimitResponse) return rateLimitResponse;

    const guard = await requireAuth();
    if (!isGuardOk(guard)) return guard;

    const userRateLimitResponse = await combinedRateLimit(request, "api_free", {
      userId: guard.user.id,
      skipIpCheck: true,
    });
    if (userRateLimitResponse) return userRateLimitResponse;

    const { id: snippetId } = await params;

    const idValidation = validateInput(uuidSchema, snippetId);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "invalid_id", message: "Invalid snippet ID format" },
        { status: 400 }
      );
    }

    const isOwner = await verifySnippetOwnership(snippetId, guard.user.id);
    if (!isOwner) {
      return NextResponse.json(
        { error: "not_found", message: "Snippet not found" },
        { status: 404 }
      );
    }

    const queryParams = parseSearchParams(request.url);
    const diffValidation = validateInput(diffQuerySchema, queryParams);
    if (!diffValidation.success) {
      return NextResponse.json(formatZodError(diffValidation.error), { status: 400 });
    }

    const { from, to } = diffValidation.data;

    const versions = await withSnippetRlsContext(guard.user.id, async (client) => {
      const result = await client.query<VersionRow>(
        `SELECT id::text, snippet_id::text, pattern, flags, notes, created_at
         FROM snippet_versions
         WHERE snippet_id = $1::uuid AND id IN ($2::uuid, $3::uuid)`,
        [snippetId, from, to]
      );
      return result.rows;
    });

    if (versions.length !== 2) {
      return NextResponse.json(
        { error: "not_found", message: "One or both versions not found" },
        { status: 404 }
      );
    }

    const fromVersion = versions.find((v) => v.id === from);
    const toVersion = versions.find((v) => v.id === to);
    if (!fromVersion || !toVersion) {
      return NextResponse.json(
        { error: "not_found", message: "One or both versions not found" },
        { status: 404 }
      );
    }

    const diff = computeDiff(fromVersion, toVersion);

    return NextResponse.json({
      from: {
        id: fromVersion.id,
        pattern: fromVersion.pattern,
        flags: fromVersion.flags,
        created_at: fromVersion.created_at.toISOString(),
      },
      to: {
        id: toVersion.id,
        pattern: toVersion.pattern,
        flags: toVersion.flags,
        created_at: toVersion.created_at.toISOString(),
      },
      diff,
    });
  } catch (error) {
    console.error("Diff error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to compute diff" },
      { status: 500 }
    );
  }
}
