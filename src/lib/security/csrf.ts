import { SITE_URL } from "@/lib/site";
import { NextRequest, NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/security/auditLog";
import { getClientIP } from "@/lib/security/rateLimit";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getCanonicalSiteOrigin(): string | null {
  try {
    return new URL(SITE_URL).origin;
  } catch {
    return null;
  }
}

/**
 * On Vercel, `x-forwarded-*` are set by the platform (not the browser). Using them
 * covers cases where the public host differs from what `nextUrl` was built with.
 */
function getOriginFromForwardedHeaders(request: NextRequest): string | null {
  if (process.env.VERCEL !== "1") {
    return null;
  }
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (!host) {
    return null;
  }
  const rawProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const scheme =
    rawProto === "http" || rawProto === "https" ? rawProto : "https";
  try {
    return new URL(`${scheme}://${host}`).origin;
  } catch {
    return null;
  }
}

function collectAllowedOrigins(request: NextRequest): Set<string> {
  const allowed = new Set<string>();
  const canonical = getCanonicalSiteOrigin();
  if (canonical) {
    allowed.add(canonical);
  }
  try {
    allowed.add(request.nextUrl.origin);
  } catch {
    // ignore malformed request URL
  }
  const forwarded = getOriginFromForwardedHeaders(request);
  if (forwarded) {
    allowed.add(forwarded);
  }
  return allowed;
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
 * The browser sends `Origin` on cross-origin-capable methods. It must match at least
 * one trusted deployment origin: the incoming request URL origin (`nextUrl`),
 * optional Vercel forwarded host/proto, and the canonical `NEXT_PUBLIC_SITE_URL`
 * origin so marketing URL and deployment URL can both be valid when configured.
 *
 * Non-browser HTTP clients that omit `Origin` receive 403. For machine-to-machine
 * access, use a dedicated token-based API — these routes target interactive sessions.
 */
export function enforceCsrfProtection(request: NextRequest): NextResponse | null {
  if (!STATE_CHANGING_METHODS.has(request.method.toUpperCase())) {
    return null;
  }

  const allowedOrigins = collectAllowedOrigins(request);
  if (allowedOrigins.size === 0) {
    return rejectCsrf(
      request,
      "missing_host",
      "Unable to validate request origin"
    );
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return rejectCsrf(request, "missing_origin", "Missing Origin header");
  }

  if (!allowedOrigins.has(origin)) {
    return rejectCsrf(request, "origin_mismatch", "Cross-site request blocked");
  }

  return null;
}
