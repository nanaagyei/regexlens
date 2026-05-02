import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Runs Auth.js on `/app` routes so session state stays coherent with the workbench.
 * Anonymous users are allowed: the regex workspace runs client-side; Sign In lives in
 * the header and gated APIs use `requireAuth` server-side.
 */
export default auth(() => NextResponse.next());

export const config = {
  matcher: ["/app/:path*"],
};
