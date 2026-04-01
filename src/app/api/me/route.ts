import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth/getUser";
import { getEntitlement } from "@/lib/entitlements/proGuard";
import { combinedRateLimit } from "@/lib/security/rateLimit";

/**
 * GET /api/me - Get current user and entitlement status
 * 
 * Returns user profile and subscription status.
 * For unauthenticated users, returns null values.
 */
export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await combinedRateLimit(request, "api_free");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const user = await getAuthedUser();

  if (!user) {
    return NextResponse.json(
      {
        user: null,
        entitlement: null,
      },
      { status: 200 }
    );
  }

  // Fetch actual entitlement from database
  const entitlement = await getEntitlement(user.id);

  // Determine if user should see upgrade prompt
  const isPro = entitlement.plan === "PRO" && entitlement.status === "active";
  const isPastDue = entitlement.plan === "PRO" && entitlement.status === "past_due";

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    },
    entitlement: {
      plan: entitlement.plan,
      status: entitlement.status,
      current_period_end: entitlement.currentPeriodEnd,
      is_pro: isPro,
      is_past_due: isPastDue,
    },
    // Include upgrade URL for free users
    ...(isPro ? {} : { upgrade_url: "/pricing" }),
  });
}
