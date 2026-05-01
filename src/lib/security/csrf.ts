import { NextRequest, NextResponse } from "next/server";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getExpectedOrigin(request: NextRequest): string | null {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) {
    return null;
  }

  const protocol =
    request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");

  return `${protocol}://${host}`;
}

/**
 * Enforces same-origin requests for cookie-authenticated, state-changing APIs.
 */
export function enforceCsrfProtection(request: NextRequest): NextResponse | null {
  if (!STATE_CHANGING_METHODS.has(request.method.toUpperCase())) {
    return null;
  }

  const expectedOrigin = getExpectedOrigin(request);
  if (!expectedOrigin) {
    return NextResponse.json(
      { error: "csrf_validation_failed", message: "Unable to validate request origin" },
      { status: 403 }
    );
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return NextResponse.json(
      { error: "csrf_validation_failed", message: "Missing Origin header" },
      { status: 403 }
    );
  }

  if (origin !== expectedOrigin) {
    return NextResponse.json(
      { error: "csrf_validation_failed", message: "Cross-site request blocked" },
      { status: 403 }
    );
  }

  return null;
}
