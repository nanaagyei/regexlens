import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import {
  verifyWebhookSignature,
  updateEntitlementFromSubscription,
  handleCheckoutCompleted,
  handleSubscriptionDeleted,
  handleInvoicePaymentFailed,
} from "@/lib/billing/stripe";
import { rateLimit, getClientIP } from "@/lib/security/rateLimit";

/**
 * POST /api/billing/webhook - Stripe webhook receiver
 * 
 * Handles subscription lifecycle events from Stripe.
 * CRITICAL: Verifies webhook signature to prevent spoofing.
 * 
 * Handled events:
 * - checkout.session.completed - Initial subscription
 * - customer.subscription.created - New subscription
 * - customer.subscription.updated - Status changes
 * - customer.subscription.deleted - Cancellation
 * - invoice.payment_failed - Payment issues
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP (webhooks come from Stripe IPs)
    const rateLimitResponse = await rateLimit(request, "webhook", getClientIP(request));
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Check if webhook secret is configured
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "webhook_not_configured" },
        { status: 500 }
      );
    }

    // Get the raw body for signature verification
    const body = await request.text();
    
    // Get the Stripe signature header
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");
    
    if (!signature) {
      console.error("Missing stripe-signature header");
      return NextResponse.json(
        { error: "missing_signature", message: "Missing Stripe signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature (CRITICAL for security)
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "invalid_signature", message: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // Log event for debugging (remove in production if too verbose)
    console.log(`Stripe webhook received: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await updateEntitlementFromSubscription(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case "invoice.paid": {
        // Payment succeeded - subscription update event will handle status
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Invoice paid: ${invoice.id}`);
        break;
      }

      case "customer.subscription.paused": {
        // Handle paused subscriptions
        const subscription = event.data.object as Stripe.Subscription;
        await updateEntitlementFromSubscription(subscription);
        break;
      }

      case "customer.subscription.resumed": {
        // Handle resumed subscriptions
        const subscription = event.data.object as Stripe.Subscription;
        await updateEntitlementFromSubscription(subscription);
        break;
      }

      default:
        // Log unhandled events for monitoring
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    // Return success response
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    
    // Return 500 so Stripe will retry
    return NextResponse.json(
      { error: "webhook_processing_failed" },
      { status: 500 }
    );
  }
}

/**
 * Stripe webhooks should not be cached
 */
export const dynamic = "force-dynamic";
