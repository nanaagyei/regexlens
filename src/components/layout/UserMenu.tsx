"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEntitlement } from "@/hooks/useEntitlement";
import { AuthExplainerModal, AuthProvider } from "./AuthExplainerModal";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  User,
  LogOut,
  Crown,
  Sparkles,
  Github,
  Mail,
  CreditCard,
  Loader2,
  ChevronDown,
  Check,
} from "lucide-react";

// Google icon component since lucide doesn't have one
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function UserMenu() {
  const { user, isPro, isLoading } = useEntitlement();
  const [selectedProvider, setSelectedProvider] = useState<AuthProvider | null>(
    null
  );
  const [, setShowPricingModal] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const searchParams = useSearchParams();

  // Check for auth success callback and show pricing
  useEffect(() => {
    const authParam = searchParams.get("auth");
    if (authParam === "success" && user && !isPro) {
      // User just signed in and is on free plan - prompt for upgrade
      setShowPricingModal(true);
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, user, isPro]);

  const handleProviderClick = (provider: AuthProvider) => {
    setSelectedProvider(provider);
  };

  const handleModalClose = () => {
    setSelectedProvider(null);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleUpgrade = () => {
    // Show plan selector modal
    setShowPlanSelector(true);
  };

  const handlePlanCheckout = async () => {
    setIsCheckingOut(true);
    try {
      // First fetch the available prices from the API
      const pricesResponse = await fetch("/api/billing/checkout");
      if (!pricesResponse.ok) {
        console.error("Failed to fetch prices");
        return;
      }
      const pricesData = await pricesResponse.json();
      
      // Use the selected plan
      const priceId = selectedPlan === "yearly" 
        ? pricesData.prices?.yearly?.id 
        : pricesData.prices?.monthly?.id;
      
      if (!priceId) {
        console.error("No price ID available");
        return;
      }

      // Create checkout session
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          returnUrl: window.location.origin + "/?checkout=complete",
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        console.error("Checkout error:", data.message);
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });
      const data = await response.json();
      
      if (!response.ok) {
        console.error("Portal error:", data.message || "Failed to open portal");
        return;
      }
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  // Not signed in - show "Get Pro" button with dropdown
  if (!user) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Get Pro</span>
              <ChevronDown className="h-3 w-3 opacity-70 hidden sm:inline" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)]">
            <div className="px-2 py-2">
              <p className="text-sm font-medium">Unlock Pro Features</p>
              <p className="text-xs text-muted-foreground mt-1">
                Sign in to save patterns, export explanations, and more.
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Choose how to sign in
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => handleProviderClick("github")}
              className="cursor-pointer"
            >
              <Github className="mr-2 h-4 w-4" />
              Continue with GitHub
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleProviderClick("google")}
              className="cursor-pointer"
            >
              <GoogleIcon className="mr-2 h-4 w-4" />
              Continue with Google
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleProviderClick("resend")}
              className="cursor-pointer"
            >
              <Mail className="mr-2 h-4 w-4" />
              Continue with Email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1.5">
                Pro includes:
              </p>
              <ul className="space-y-1">
                <li className="flex items-center gap-1.5">
                  <span className="text-green-500">✓</span> Save regex patterns
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-green-500">✓</span> Export explanations
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-green-500">✓</span> Advanced analysis
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-green-500">✓</span> Pattern diff view
                </li>
              </ul>
              <p className="mt-2 text-amber-500 font-medium">
                $8/month or $49/year
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Auth explainer modal */}
        <AuthExplainerModal
          provider={selectedProvider}
          isOpen={selectedProvider !== null}
          onClose={handleModalClose}
        />
      </>
    );
  }

  // Signed in - show user menu
  return (
    <div className="flex items-center gap-2">
      {/* Upgrade button for free users */}
      {!isPro && (
        <Button
          variant="default"
          size="sm"
          className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
          onClick={handleUpgrade}
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Upgrade to Pro</span>
          <span className="sm:hidden">Pro</span>
        </Button>
      )}

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-full">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || "User avatar"}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full"
                unoptimized
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
            )}
            {isPro && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center">
                <Crown className="h-2.5 w-2.5 text-white" />
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.name || "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              {isPro ? (
                <span className="inline-flex items-center gap-1 text-xs text-amber-500 font-medium mt-1">
                  <Crown className="h-3 w-3" />
                  Pro Member
                </span>
              ) : (
                <span className="text-xs text-muted-foreground mt-1">
                  Free Plan
                </span>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {isPro ? (
            <>
              <DropdownMenuItem
                onClick={handleManageSubscription}
                className="cursor-pointer"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Subscription
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem
                onClick={handleUpgrade}
                className="cursor-pointer text-amber-500 focus:text-amber-500"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </DropdownMenuItem>
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                <p className="font-medium mb-1">Pro features:</p>
                <ul className="space-y-0.5">
                  <li>- Save regex patterns</li>
                  <li>- Export explanations</li>
                  <li>- Advanced analysis</li>
                  <li>- Diff view</li>
                </ul>
              </div>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Plan Selector Modal */}
      <Dialog open={showPlanSelector} onOpenChange={setShowPlanSelector}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Upgrade to Pro
            </DialogTitle>
            <DialogDescription>
              Choose your billing plan. Cancel anytime.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            {/* Yearly Plan */}
            <button
              onClick={() => setSelectedPlan("yearly")}
              className={cn(
                "relative flex flex-col p-4 rounded-lg border-2 text-left transition-all",
                selectedPlan === "yearly"
                  ? "border-amber-500 bg-amber-500/5"
                  : "border-border hover:border-amber-500/50"
              )}
            >
              {selectedPlan === "yearly" && (
                <div className="absolute top-3 right-3">
                  <Check className="h-5 w-5 text-amber-500" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">Yearly</span>
                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-medium">
                  Save ~40%
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">$49</span>
                <span className="text-muted-foreground">/year</span>
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                ~$4.08/month, billed annually
              </span>
            </button>

            {/* Monthly Plan */}
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={cn(
                "relative flex flex-col p-4 rounded-lg border-2 text-left transition-all",
                selectedPlan === "monthly"
                  ? "border-amber-500 bg-amber-500/5"
                  : "border-border hover:border-amber-500/50"
              )}
            >
              {selectedPlan === "monthly" && (
                <div className="absolute top-3 right-3">
                  <Check className="h-5 w-5 text-amber-500" />
                </div>
              )}
              <span className="font-semibold mb-1">Monthly</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">$8</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                Flexible, cancel anytime
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handlePlanCheckout}
              disabled={isCheckingOut}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue to Checkout
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Secure payment via Stripe. Cancel anytime from your account.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
