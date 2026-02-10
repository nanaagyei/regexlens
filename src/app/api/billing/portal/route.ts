import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isGuardOk } from "@/lib/entitlements/proGuard";
import { combinedRateLimit } from "@/lib/security/rateLimit";
import { createPortalSession } from "@/lib/billing/stripe";

/**
 * POST /api/billing/portal - Create a Stripe Customer Portal session
 * 
 * Requires authentication. Creates a portal session for managing subscription.
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit first
    const rateLimitResponse = await combinedRateLimit(request, "api_free");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Require authentication
    const guard = await requireAuth();
    if (!isGuardOk(guard)) {
      return guard;
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          error: "stripe_not_configured",
          message: "Stripe is not configured.",
        },
        { status: 503 }
      );
    }

    // Create portal session
    const session = await createPortalSession(guard.user.id);

    return NextResponse.json(session);
  } catch (error) {
    console.error("Portal error:", error);
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message === "No Stripe customer found for user") {
        return NextResponse.json(
          {
            error: "no_subscription",
            message: "You don't have an active subscription to manage.",
          },
          { status: 400 }
        );
      }
    }
    
    // Don't expose internal errors
    return NextResponse.json(
      {
        error: "portal_failed",
        message: "Failed to create portal session. Please try again.",
      },
      { status: 500 }
    );
  }
}
