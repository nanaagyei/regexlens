"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Github, Home, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AuthExplainerModal,
  type AuthProvider,
} from "@/components/layout/AuthExplainerModal";
import { safeCallbackUrl } from "@/lib/auth/safeCallbackUrl";

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

const ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "Sign-in isn't configured correctly on this deployment. Check server environment variables.",
  AccessDenied: "Sign-in was cancelled or your account is not allowed.",
  Verification:
    "That sign-in link is invalid or has expired. Request a new magic link.",
  OAuthSignin: "Could not start OAuth sign-in. Try again.",
  OAuthCallback: "OAuth callback failed. Try again.",
  OAuthCreateAccount: "Could not create an account from this OAuth profile.",
  EmailCreateAccount: "Could not create an account with this email.",
  Callback: "Something went wrong during sign-in. Try again.",
  OAuthAccountNotLinked:
    "This email is already linked to another sign-in method.",
  SessionRequired: "You need to be signed in to view that page.",
};

/** Plain-language line about where the user lands after sign-in (no raw paths). */
function afterSignInHint(callbackUrl: string): string {
  if (callbackUrl === "/app" || callbackUrl.startsWith("/app/")) {
    return "After you sign in, we'll take you back to the workbench so you can keep reviewing regex.";
  }
  if (callbackUrl === "/") {
    return "After you sign in, we'll take you back to the homepage.";
  }
  return "After you sign in, we'll bring you back to the page you were on.";
}

function SignInFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">Loading sign-in…</p>
    </div>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const errorCode = searchParams.get("error");
  const errorMessage =
    errorCode &&
    (ERROR_MESSAGES[errorCode] ??
      "Something went wrong. Try signing in again.");

  const [selectedProvider, setSelectedProvider] =
    useState<AuthProvider | null>(null);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            RegexLens
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign in to RegexLens
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {afterSignInHint(callbackUrl)}
          </p>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-left text-sm"
          >
            <p className="font-medium text-destructive">Sign-in error</p>
            <p className="mt-1 text-muted-foreground">{errorMessage}</p>
          </div>
        ) : null}

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-11"
            onClick={() => setSelectedProvider("github")}
          >
            <Github className="h-5 w-5" />
            Continue with GitHub
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-11"
            onClick={() => setSelectedProvider("google")}
          >
            <GoogleIcon className="h-5 w-5" />
            Continue with Google
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-11"
            onClick={() => setSelectedProvider("resend")}
          >
            <Mail className="h-5 w-5" />
            Continue with Email
          </Button>
        </div>

        <div className="space-y-3 pt-2 border-t border-border/60">
          <p className="text-center text-sm text-muted-foreground">
            Not ready to sign in?
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button variant="outline" className="w-full gap-2" asChild>
              <Link href="/">
                <Home className="h-4 w-4 shrink-0" aria-hidden />
                Go to homepage
              </Link>
            </Button>
            <Button variant="secondary" className="w-full gap-2" asChild>
              <Link href="/app">
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                Open without signing in
              </Link>
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            The workbench runs in your browser—you only need an account for saved
            snippets, exports, and features your host enables.
          </p>
        </div>
      </div>

      <AuthExplainerModal
        provider={selectedProvider}
        isOpen={selectedProvider !== null}
        onClose={() => setSelectedProvider(null)}
        callbackUrl={callbackUrl}
      />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInContent />
    </Suspense>
  );
}
