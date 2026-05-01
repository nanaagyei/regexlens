import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (
    process.env.E2E_BYPASS_AUTH === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
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
