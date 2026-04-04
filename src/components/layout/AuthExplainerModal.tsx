"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Github,
  Mail,
  Shield,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";

// Google icon component
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

export type AuthProvider = "github" | "google" | "resend";

interface ProviderConfig {
  id: AuthProvider;
  name: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  permissions: string[];
  securityNote: string;
  buttonText: string;
}

const PROVIDER_CONFIGS: Record<AuthProvider, ProviderConfig> = {
  github: {
    id: "github",
    name: "GitHub",
    icon: <Github className="h-8 w-8" />,
    title: "Continue with GitHub",
    description:
      "You'll be securely redirected to GitHub to authorize RegexLens. This is the standard OAuth flow used by millions of apps.",
    permissions: [
      "Read your public profile information",
      "Access your email address",
    ],
    securityNote:
      "We never see your GitHub password. GitHub handles all authentication securely.",
    buttonText: "Continue to GitHub",
  },
  google: {
    id: "google",
    name: "Google",
    icon: <GoogleIcon className="h-8 w-8" />,
    title: "Continue with Google",
    description:
      "You'll be securely redirected to Google to sign in. This uses Google's secure OAuth 2.0 authentication.",
    permissions: [
      "View your basic profile info (name, profile picture)",
      "View your email address",
    ],
    securityNote:
      "We never see your Google password. Google handles all authentication securely.",
    buttonText: "Continue to Google",
  },
  resend: {
    id: "resend",
    name: "Email",
    icon: <Mail className="h-8 w-8" />,
    title: "Sign in with Email",
    description:
      "We'll send you a secure magic link to your email. Click the link to sign in instantly — no password needed.",
    permissions: [
      "Your email address (to send the magic link)",
      "No password required or stored",
    ],
    securityNote:
      "Magic links expire after 24 hours and can only be used once for maximum security.",
    buttonText: "Send Magic Link",
  },
};

interface AuthExplainerModalProps {
  provider: AuthProvider | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AuthExplainerModal({
  provider,
  isOpen,
  onClose,
}: AuthExplainerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  if (!provider) return null;

  const config = PROVIDER_CONFIGS[provider];

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      if (provider === "resend") {
        // For email, we need to pass the email address
        if (!email) {
          setIsLoading(false);
          return;
        }
        await signIn("resend", {
          email,
          callbackUrl: "/?auth=success",
        });
        setEmailSent(true);
      } else {
        // For OAuth providers, redirect immediately
        await signIn(provider, { callbackUrl: "/?auth=success" });
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setEmailSent(false);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {config.icon}
            </div>
            <DialogTitle className="text-xl">{config.title}</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email input for magic link */}
          {provider === "resend" && !emailSent && (
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Email sent confirmation */}
          {provider === "resend" && emailSent && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 text-green-500 mb-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Magic link sent!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Check your inbox at <strong>{email}</strong> and click the link
                to sign in. The link expires in 24 hours.
              </p>
            </div>
          )}

          {/* Permissions list */}
          {!emailSent && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                What we access:
              </p>
              <ul className="space-y-1.5">
                {config.permissions.map((permission, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Security note */}
          {!emailSent && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {config.securityNote}
              </p>
            </div>
          )}

          {/* Account benefits */}
          {!emailSent && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/60">
              <div className="flex items-center gap-2 text-foreground mb-1.5">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm font-medium">
                  Why sign in?
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Signing in unlocks saving patterns, exports, deeper analysis, and Copilot when your environment provides the required API keys. RegexLens remains free and open source — no tiers or paywalls.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {emailSent ? (
            <Button variant="outline" onClick={handleClose} className="w-full">
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleContinue}
                disabled={isLoading || (provider === "resend" && !email)}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {provider === "resend" ? "Sending..." : "Redirecting..."}
                  </>
                ) : (
                  <>
                    {config.buttonText}
                    {provider !== "resend" && (
                      <ExternalLink className="h-4 w-4" />
                    )}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
