import Stripe from "stripe";
import { pool } from "@/lib/db/pool";

/**
 * Initialize Stripe client
 */
function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  
  return new Stripe(secretKey, {
    apiVersion: "2025-12-15.clover",
    typescript: true,
  });
}

// Lazy-loaded Stripe client
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = getStripeClient();
  }
  return stripeClient;
}

/**
 * Get Price IDs for Pro subscription (reads env vars at runtime)
 */
export function getPriceIds() {
  return {
    PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "",
    PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID || "",
  };
}

/**
 * Price IDs for Pro subscription (for backwards compatibility)
 * Note: Use getPriceIds() for runtime access to ensure env vars are loaded
 */
export const PRICE_IDS = {
  get PRO_MONTHLY() {
    return process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "";
  },
  get PRO_YEARLY() {
    return process.env.STRIPE_PRO_YEARLY_PRICE_ID || "";
  },
} as const;

/**
 * Validate that a price ID is valid for Pro subscription
 */
export function isValidPriceId(priceId: string): boolean {
  const prices = getPriceIds();
  return priceId === prices.PRO_MONTHLY || priceId === prices.PRO_YEARLY;
}

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string | null
): Promise<string> {
  const stripe = getStripe();
  
  // Check if user already has a Stripe customer ID
  const result = await pool.query(
    `SELECT stripe_customer_id FROM entitlements WHERE user_id = $1`,
    [userId]
  );
  
  const existingCustomerId = result.rows[0]?.stripe_customer_id;
  
  if (existingCustomerId) {
    // Verify customer still exists in Stripe
    try {
      await stripe.customers.retrieve(existingCustomerId);
      return existingCustomerId;
    } catch {
      // Customer was deleted in Stripe, create a new one
    }
  }
  
  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      user_id: userId,
    },
  });
  
  // Store customer ID in database
  await pool.query(
    `UPDATE entitlements 
     SET stripe_customer_id = $1, updated_at = now()
     WHERE user_id = $2`,
    [customer.id, userId]
  );
  
  return customer.id;
}

/**
 * Create a Stripe Checkout session for Pro subscription
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  name: string | null | undefined,
  priceId: string,
  returnUrl?: string | null
): Promise<{ url: string }> {
  const stripe = getStripe();
  
  // Validate price ID
  if (!isValidPriceId(priceId)) {
    throw new Error("Invalid price ID");
  }
  
  // Get or create customer
  const customerId = await getOrCreateCustomer(userId, email, name);
  
  // Determine URLs
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const successUrl = returnUrl || `${baseUrl}/?checkout=success`;
  const cancelUrl = returnUrl || `${baseUrl}/?checkout=cancelled`;
  
  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      user_id: userId,
    },
    subscription_data: {
      metadata: {
        user_id: userId,
      },
    },
    // Allow promotion codes
    allow_promotion_codes: true,
    // Collect billing address for tax purposes
    billing_address_collection: "auto",
  });
  
  if (!session.url) {
    throw new Error("Failed to create checkout session");
  }
  
  return { url: session.url };
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortalSession(
  userId: string
): Promise<{ url: string }> {
  const stripe = getStripe();
  
  // Get customer ID
  const result = await pool.query(
    `SELECT stripe_customer_id FROM entitlements WHERE user_id = $1`,
    [userId]
  );
  
  const customerId = result.rows[0]?.stripe_customer_id;
  
  if (!customerId) {
    throw new Error("No Stripe customer found for user");
  }
  
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/`,
  });
  
  return { url: session.url };
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Update user entitlement based on subscription status
 */
export async function updateEntitlementFromSubscription(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata.user_id;
  
  if (!userId) {
    console.error("No user_id in subscription metadata:", subscription.id);
    return;
  }
  
  // Map Stripe status to our status
  let status: "active" | "inactive" | "past_due" | "canceled";
  let plan: "FREE" | "PRO" = "PRO";
  
  switch (subscription.status) {
    case "active":
    case "trialing":
      status = "active";
      break;
    case "past_due":
      status = "past_due";
      break;
    case "canceled":
    case "unpaid":
      status = "canceled";
      plan = "FREE"; // Downgrade to free
      break;
    case "incomplete":
    case "incomplete_expired":
    case "paused":
    default:
      status = "inactive";
      break;
  }
  
  // Get current period end - handle both old and new API versions
  const periodEnd = (subscription as unknown as { current_period_end?: number; currentPeriodEnd?: number })
    .current_period_end ?? (subscription as unknown as { currentPeriodEnd?: number }).currentPeriodEnd;
  const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : null;
  
  await pool.query(
    `UPDATE entitlements 
     SET plan = $1::plan_type,
         status = $2::entitlement_status,
         stripe_subscription_id = $3,
         current_period_end = $4,
         updated_at = now()
     WHERE user_id = $5`,
    [plan, status, subscription.id, currentPeriodEnd, userId]
  );
}

/**
 * Handle checkout session completed
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.user_id;
  
  if (!userId) {
    console.error("No user_id in checkout session metadata:", session.id);
    return;
  }
  
  // If this is a subscription checkout, the subscription webhook will handle the update
  // But we can set the customer ID here if not already set
  if (session.customer && typeof session.customer === "string") {
    await pool.query(
      `UPDATE entitlements 
       SET stripe_customer_id = $1, updated_at = now()
       WHERE user_id = $2 AND stripe_customer_id IS NULL`,
      [session.customer, userId]
    );
  }
}

/**
 * Handle subscription deleted (canceled)
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata.user_id;
  
  if (!userId) {
    console.error("No user_id in subscription metadata:", subscription.id);
    return;
  }
  
  // Downgrade to free plan
  await pool.query(
    `UPDATE entitlements 
     SET plan = 'FREE',
         status = 'inactive',
         stripe_subscription_id = NULL,
         current_period_end = NULL,
         updated_at = now()
     WHERE user_id = $1`,
    [userId]
  );
}

/**
 * Handle invoice payment failed
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId = invoice.customer;
  
  if (!customerId || typeof customerId !== "string") {
    return;
  }
  
  // Find user by customer ID and set status to past_due
  await pool.query(
    `UPDATE entitlements 
     SET status = 'past_due', updated_at = now()
     WHERE stripe_customer_id = $1`,
    [customerId]
  );
}
