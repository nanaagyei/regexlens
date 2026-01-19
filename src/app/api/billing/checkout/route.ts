import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isGuardOk } from "@/lib/entitlements/proGuard";

/**
 * POST /api/billing/checkout - Create a Stripe checkout session
 * 
 * This endpoint will be enabled when Pro features launch.
 * For now, returns a "coming soon" message.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAuth();
  if (!isGuardOk(guard)) {
    return guard;
  }

  // Pro billing is coming soon
  return NextResponse.json(
    {
      error: "coming_soon",
      message: "RegexLens Pro is coming soon. Stay tuned!",
    },
    { status: 503 }
  );

  // When ready, implementation would be:
  // const body = await request.json();
  // const { priceId, returnUrl } = body;
  // 
  // const session = await stripe.checkout.sessions.create({
  //   mode: "subscription",
  //   payment_method_types: ["card"],
  //   line_items: [{ price: priceId, quantity: 1 }],
  //   success_url: returnUrl || `${origin}/success`,
  //   cancel_url: returnUrl || `${origin}/`,
  //   customer_email: guard.user.email,
  //   metadata: { user_id: guard.user.id },
  // });
  // 
  // return NextResponse.json({ url: session.url });
}
