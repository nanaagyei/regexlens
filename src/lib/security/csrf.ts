import { SITE_URL } from "@/lib/site";
import { NextRequest, NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/security/auditLog";
import { getClientIP } from "@/lib/security/rateLimit";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getExpectedOrigin(): string | null {
  try {
    return new URL(SITE_URL).origin;
  } catch {
    return null;
  }
}

function rejectCsrf(
  request: NextRequest,
  reason: "missing_host" | "missing_origin" | "origin_mismatch",
  message: string
): NextResponse {
  logAuditEvent({
    event: "csrf.rejected",
    ip: getClientIP(request),
    path: request.nextUrl.pathname,
    metadata: { reason, method: request.method.toUpperCase() },
  });
  return NextResponse.json(
    { error: "csrf_validation_failed", message },
    { status: 403 }
  );
}

/**
 * Enforces same-origin requests for cookie-authenticated, state-changing APIs.
 *
 * **Browser-first contract:** `fetch` from the RegexLens web app sends `Origin`,
 * which this check compares to `NEXT_PUBLIC_SITE_URL` (see `SITE_URL` in `src/lib/site.ts`). Non-browser
 * HTTP clients, curl scripts, or integrations that omit `Origin` will receive 403.
 * For machine-to-machine access, use a dedicated token-based API design — these
 * routes are intended for interactive browser sessions with session cookies.
 */
export function enforceCsrfProtection(request: NextRequest): NextResponse | null {
  if (!STATE_CHANGING_METHODS.has(request.method.toUpperCase())) {
    return null;
  }

  const expectedOrigin = getExpectedOrigin();
  if (!expectedOrigin) {
    return rejectCsrf(request, "missing_host", "Unable to validate request origin");
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return rejectCsrf(request, "missing_origin", "Missing Origin header");
  }

  if (origin !== expectedOrigin) {
    return rejectCsrf(request, "origin_mismatch", "Cross-site request blocked");
  }

  return null;
}
