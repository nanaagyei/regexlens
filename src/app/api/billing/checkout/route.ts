import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isGuardOk } from "@/lib/entitlements/proGuard";
import { combinedRateLimit } from "@/lib/security/rateLimit";
import { checkoutRequestSchema, validateInput, formatZodError } from "@/lib/security/validation";
import { createCheckoutSession, isValidPriceId, PRICE_IDS } from "@/lib/billing/stripe";

/**
 * POST /api/billing/checkout - Create a Stripe checkout session
 * 
 * Requires authentication. Creates a checkout session for Pro subscription.
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

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "invalid_json", message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validation = validateInput(checkoutRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 });
    }

    const { priceId, returnUrl } = validation.data;

    // Validate price ID
    if (!isValidPriceId(priceId)) {
      return NextResponse.json(
        {
          error: "invalid_price",
          message: "Invalid price ID. Use a valid Pro subscription price.",
          valid_prices: {
            monthly: PRICE_IDS.PRO_MONTHLY,
            yearly: PRICE_IDS.PRO_YEARLY,
          },
        },
        { status: 400 }
      );
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          error: "stripe_not_configured",
          message: "Stripe is not configured. Pro features are coming soon.",
        },
        { status: 503 }
      );
    }

    // Ensure user has an email
    if (!guard.user.email) {
      return NextResponse.json(
        {
          error: "email_required",
          message: "An email address is required to subscribe. Please update your profile.",
        },
        { status: 400 }
      );
    }

    // Create checkout session
    const session = await createCheckoutSession(
      guard.user.id,
      guard.user.email,
      guard.user.name,
      priceId,
      returnUrl
    );

    return NextResponse.json(session);
  } catch (error) {
    console.error("Checkout error:", error);
    
    // Don't expose internal errors
    return NextResponse.json(
      {
        error: "checkout_failed",
        message: "Failed to create checkout session. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/checkout - Get available prices
 * 
 * Returns the available Pro subscription prices.
 */
export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await combinedRateLimit(request, "api_free");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Return available prices (public endpoint)
  return NextResponse.json({
    prices: {
      monthly: {
        id: PRICE_IDS.PRO_MONTHLY,
        amount: 800, // $8.00 in cents
        currency: "usd",
        interval: "month",
      },
      yearly: {
        id: PRICE_IDS.PRO_YEARLY,
        amount: 4900, // $49.00 in cents
        currency: "usd",
        interval: "year",
        savings: "Save ~40%",
      },
    },
  });
}
