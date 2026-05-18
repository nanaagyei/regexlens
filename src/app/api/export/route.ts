import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isGuardOk } from "@/lib/auth/requireAuth";
import { generateExport } from "@/lib/export/generateExport";
import { combinedRateLimit } from "@/lib/security/rateLimit";
import { enforceCsrfProtection } from "@/lib/security/csrf";
import {
  exportRequestSchema,
  validateInput,
  formatZodError,
  parseJsonBodyWithinLimit,
  REQUEST_BODY_LIMITS,
} from "@/lib/security/validation";

/**
 * POST /api/export - Export explanation in various formats
 *
 * Supported formats:
 * - markdown: Markdown document
 * - plain: Plain text
 * - pr_comment: PR comment format (GitHub-friendly)
 * - notion: Notion-friendly blocks
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await combinedRateLimit(request, "export");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const csrfError = enforceCsrfProtection(request);
    if (csrfError) {
      return csrfError;
    }

    const guard = await requireAuth();
    if (!isGuardOk(guard)) {
      return guard;
    }

    const userRateLimitResponse = await combinedRateLimit(request, "export", {
      userId: guard.user.id,
      skipIpCheck: true,
    });
    if (userRateLimitResponse) {
      return userRateLimitResponse;
    }

    const parsedBody = await parseJsonBodyWithinLimit(
      request,
      REQUEST_BODY_LIMITS.EXPORT_BYTES
    );
    if (!parsedBody.ok) {
      return NextResponse.json(parsedBody.body, { status: parsedBody.status });
    }

    const body = parsedBody.data;

    const validation = validateInput(exportRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 });
    }

    const { format, title, pattern, flags, steps, warnings } = validation.data;

    const content = generateExport(format, {
      title,
      pattern,
      flags,
      steps,
      warnings,
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to generate export" },
      { status: 500 }
    );
  }
}
