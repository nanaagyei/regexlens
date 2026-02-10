"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useEntitlement } from "@/hooks/useEntitlement";
import {
  Check,
  X,
  ChevronDown,
  Loader2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

// Feature comparison data
const FEATURES = [
  { name: "Regex testing", free: true, pro: true },
  { name: "Plain-English explanations", free: true, pro: true },
  { name: "AST structure view", free: true, pro: true },
  { name: "Match highlighting", free: true, pro: true },
  { name: "Templates & examples", free: true, pro: true },
  { name: "Shareable links", free: true, pro: true },
  { name: "Basic warnings", free: true, pro: true },
  { name: "Save and organize regexes", free: false, pro: true },
  { name: "Export explanations", free: false, pro: true },
  { name: "Regex diff view", free: false, pro: true },
  { name: "Advanced performance warnings", free: false, pro: true },
];

// FAQ data
const FAQS = [
  {
    question: "Do I need an account to use RegexLens?",
    answer:
      "No. You only need an account if you want to save regexes or export explanations. All core features work without signing in.",
  },
  {
    question: "Is my regex data stored?",
    answer:
      "Only if you choose to save it as a Pro user. Otherwise everything runs locally in your browser. We don't track or store your patterns.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. There are no contracts or commitments. You can cancel your subscription at any time from your account settings.",
  },
  {
    question: "Is this for teams?",
    answer:
      "Not yet. RegexLens Pro is designed for individual developers. Team features may be added in the future.",
  },
];

export default function PricingPage() {
  const { data: session, status: sessionStatus } = useSession();
  const { isPro, isLoading: isEntitlementLoading } = useEntitlement();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleUpgrade = useCallback(async () => {
    if (!session) {
      // Redirect to sign in
      window.location.href = "/api/auth/signin?callbackUrl=/pricing";
      return;
    }

    setIsCheckingOut(true);

    try {
      // Fetch price IDs
      const pricesResponse = await fetch("/api/billing/checkout");
      
      if (!pricesResponse.ok) {
        toast.error("Failed to fetch pricing. Please try again.");
        return;
      }
      
      const pricesData = await pricesResponse.json();

      const priceId =
        billingPeriod === "yearly"
          ? pricesData.prices?.yearly?.id
          : pricesData.prices?.monthly?.id;

      if (!priceId) {
        toast.error("Pricing not configured. Please try again later.");
        return;
      }

      // Create checkout session
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          returnUrl: window.location.origin + "/pricing?checkout=complete",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to start checkout"
      );
    } finally {
      setIsCheckingOut(false);
    }
  }, [session, billingPeriod]);

  const isLoading = sessionStatus === "loading" || isEntitlementLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/regexlens-logo.png"
              alt="RegexLens"
              width={100}
              height={100}
              className="rounded-lg"
            />
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to app
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">
            Simple pricing for developers who use regex at work
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            RegexLens is free to use. Upgrade only if it saves you time in real
            projects.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 p-1 rounded-lg bg-muted">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === "monthly"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                billingPeriod === "yearly"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <Badge variant="secondary" className="text-xs">
                Save ~40%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {/* Free tier */}
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Free</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/forever</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Everything you need to understand and test regex.
              </p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {FEATURES.filter((f) => f.free).map((feature) => (
                <li key={feature.name} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-sm">{feature.name}</span>
                </li>
              ))}
            </ul>

            <Button variant="outline" size="lg" asChild className="w-full">
              <Link href="/">Use for free</Link>
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              No signup, no credit card
            </p>
          </div>

          {/* Pro tier */}
          <div className="rounded-xl border-2 border-primary bg-card p-6 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">
                <Sparkles className="h-3 w-3 mr-1" />
                Pro
              </Badge>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Pro</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  ${billingPeriod === "yearly" ? "49" : "8"}
                </span>
                <span className="text-muted-foreground">
                  /{billingPeriod === "yearly" ? "year" : "month"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                For developers who use regex at work.
              </p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              <li className="text-sm font-medium text-muted-foreground mb-2">
                Everything in Free, plus:
              </li>
              {FEATURES.filter((f) => !f.free && f.pro).map((feature) => (
                <li key={feature.name} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm">{feature.name}</span>
                </li>
              ))}
            </ul>

            {isLoading ? (
              <Button size="lg" disabled className="w-full">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </Button>
            ) : isPro ? (
              <Button size="lg" variant="outline" disabled className="w-full">
                <Check className="h-4 w-4 mr-2" />
                You're on Pro
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleUpgrade}
                disabled={isCheckingOut}
                className="w-full"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting checkout...
                  </>
                ) : session ? (
                  "Upgrade to Pro"
                ) : (
                  "Sign in to upgrade"
                )}
              </Button>
            )}
            <p className="text-xs text-muted-foreground text-center mt-2">
              Individual license. Cancel anytime.
            </p>
          </div>
        </div>

        {/* Feature comparison table */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-semibold text-center mb-6 sm:mb-8">
            Feature comparison
          </h2>
          <div className="rounded-xl border border-border overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[320px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">Feature</th>
                  <th className="text-center p-3 sm:p-4 font-medium text-sm sm:text-base w-16 sm:w-24">Free</th>
                  <th className="text-center p-3 sm:p-4 font-medium text-sm sm:text-base w-16 sm:w-24">Pro</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature, index) => (
                  <tr
                    key={feature.name}
                    className={index !== FEATURES.length - 1 ? "border-b border-border" : ""}
                  >
                    <td className="p-3 sm:p-4 text-xs sm:text-sm">{feature.name}</td>
                    <td className="p-3 sm:p-4 text-center">
                      {feature.free ? (
                        <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="p-3 sm:p-4 text-center">
                      {feature.pro ? (
                        <Check className="h-4 w-4 text-primary mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {FAQS.map((faq) => (
              <Collapsible key={faq.question}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left">
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 pt-2 text-sm text-muted-foreground">
                  {faq.answer}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center py-12 border-t border-border">
          <h2 className="text-2xl font-semibold mb-4">
            Try RegexLens for free
          </h2>
          <p className="text-muted-foreground mb-6">
            Upgrade when it earns its place in your workflow.
          </p>
          <Button size="lg" asChild>
            <Link href="/">Start using RegexLens</Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} RegexLens. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
