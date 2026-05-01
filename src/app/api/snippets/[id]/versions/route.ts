import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isGuardOk } from "@/lib/auth/requireAuth";
import { combinedRateLimit } from "@/lib/security/rateLimit";
import { withSnippetRlsContext } from "@/lib/db/pool";
import { enforceCsrfProtection } from "@/lib/security/csrf";
import {
  createVersionSchema,
  diffQuerySchema,
  uuidSchema,
  validateInput,
  formatZodError,
  parseSearchParams,
  getJsonBodyTooLargeError,
  REQUEST_BODY_LIMITS,
} from "@/lib/security/validation";
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

interface SnippetOwnerRow {
  user_id: string;
}

/**
 * Verify snippet ownership
 */
async function verifySnippetOwnership(
  snippetId: string,
  userId: string
): Promise<boolean> {
  const row = await withSnippetRlsContext(userId, async (client) => {
    const result = await client.query<SnippetOwnerRow>(
      `SELECT user_id::text FROM snippets WHERE id = $1::uuid`,
      [snippetId]
    );
    return result.rows[0] ?? null;
  });
  return Boolean(row);
}

/**
 * POST /api/snippets/:id/versions - Create a version snapshot (requires auth)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Check rate limit
    const rateLimitResponse = await combinedRateLimit(request, "api_free");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const csrfError = enforceCsrfProtection(request);
    if (csrfError) {
      return csrfError;
    }

    // Require authentication
    const guard = await requireAuth();
    if (!isGuardOk(guard)) {
      return guard;
    }

    const { id: snippetId } = await params;

    // Validate snippet ID format
    const idValidation = validateInput(uuidSchema, snippetId);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "invalid_id", message: "Invalid snippet ID format" },
        { status: 400 }
      );
    }

    // Verify ownership
    const isOwner = await verifySnippetOwnership(snippetId, guard.user.id);
    if (!isOwner) {
      return NextResponse.json(
        { error: "not_found", message: "Snippet not found" },
        { status: 404 }
      );
    }

    const bodyTooLargeError = getJsonBodyTooLargeError(
      request,
      REQUEST_BODY_LIMITS.VERSION_WRITE_BYTES
    );
    if (bodyTooLargeError) {
      return NextResponse.json(bodyTooLargeError, { status: 413 });
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "invalid_json", message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validation = validateInput(createVersionSchema, body);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 });
    }

    const { pattern, flags, notes } = validation.data;

    // Validate the regex pattern
    try {
      new RegExp(pattern, flags);
    } catch (regexError) {
      return NextResponse.json(
        {
          error: "invalid_regex",
          message: "The provided pattern is not a valid regular expression",
          details: regexError instanceof Error ? regexError.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    // Insert version
    const version = await withSnippetRlsContext(guard.user.id, async (client) => {
      const rows = await client.query<VersionRow>(
        `INSERT INTO snippet_versions (snippet_id, pattern, flags, notes)
         VALUES ($1::uuid, $2, $3, $4)
         RETURNING id::text, snippet_id::text, pattern, flags, notes, created_at`,
        [snippetId, pattern, flags, notes || null]
      );

      return rows.rows[0];
    });

    return NextResponse.json(
      {
        id: version.id,
        snippet_id: version.snippet_id,
        pattern: version.pattern,
        flags: version.flags,
        notes: version.notes,
        created_at: version.created_at.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create version error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to create version" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/snippets/:id/versions - List versions for a snippet (requires auth)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check rate limit
    const rateLimitResponse = await combinedRateLimit(request, "api_free");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Require authentication
    const guard = await requireAuth();
    if (!isGuardOk(guard)) {
      return guard;
    }

    const { id: snippetId } = await params;

    // Validate snippet ID format
    const idValidation = validateInput(uuidSchema, snippetId);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "invalid_id", message: "Invalid snippet ID format" },
        { status: 400 }
      );
    }

    // Verify ownership
    const isOwner = await verifySnippetOwnership(snippetId, guard.user.id);
    if (!isOwner) {
      return NextResponse.json(
        { error: "not_found", message: "Snippet not found" },
        { status: 404 }
      );
    }

    // Check for diff query parameters
    const queryParams = parseSearchParams(request.url);
    
    if (queryParams.from && queryParams.to) {
      // Handle diff request
      const diffValidation = validateInput(diffQuerySchema, queryParams);
      if (!diffValidation.success) {
        return NextResponse.json(formatZodError(diffValidation.error), { status: 400 });
      }

      const { from, to } = diffValidation.data;

      // Fetch both versions
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

      // Compute diff
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
    }

    // List all versions
    const rows = await withSnippetRlsContext(guard.user.id, async (client) => {
      const result = await client.query<VersionRow>(
        `SELECT id::text, snippet_id::text, pattern, flags, notes, created_at
         FROM snippet_versions
         WHERE snippet_id = $1::uuid
         ORDER BY created_at DESC
         LIMIT 100`,
        [snippetId]
      );
      return result.rows;
    });

    return NextResponse.json({
      items: rows.map((row) => ({
        id: row.id,
        snippet_id: row.snippet_id,
        pattern: row.pattern,
        flags: row.flags,
        notes: row.notes,
        created_at: row.created_at.toISOString(),
      })),
    });
  } catch (error) {
    console.error("List versions error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to list versions" },
      { status: 500 }
    );
  }
}

