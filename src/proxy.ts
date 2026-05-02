import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  // Playwright runs `next start` in CI (NODE_ENV=production). Bypass must not depend on dev-only NODE_ENV.
  if (process.env.E2E_BYPASS_AUTH === "true") {
    return NextResponse.next();
  }

  const isProtected = req.nextUrl.pathname.startsWith("/app");
  if (isProtected && !req.auth) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*"],
};
