import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth/getUser";
import { combinedRateLimit } from "@/lib/security/rateLimit";

/**
 * GET /api/me - Get current user profile
 *
 * Returns user info for authenticated users, null otherwise.
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await combinedRateLimit(request, "api_free");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const user = await getAuthedUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    },
  });
}
