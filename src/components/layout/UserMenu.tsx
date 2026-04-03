"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/hooks/useUser";
import { AuthExplainerModal, AuthProvider } from "./AuthExplainerModal";
import Image from "next/image";
import {
  User,
  LogOut,
  Github,
  Mail,
  Heart,
  Loader2,
  ChevronDown,
} from "lucide-react";

const SUPPORT_URL =
  process.env.NEXT_PUBLIC_SUPPORT_URL || "https://buymeacoffee.com/regexlens";

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
  const { user, isLoading } = useUser();
  const [selectedProvider, setSelectedProvider] = useState<AuthProvider | null>(
    null
  );

  const handleProviderClick = (provider: AuthProvider) => {
    setSelectedProvider(provider);
  };

  const handleModalClose = () => {
    setSelectedProvider(null);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Loading state
  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  // Not signed in - show "Sign In" button with dropdown
  if (!user) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
              <ChevronDown className="h-3 w-3 opacity-70 hidden sm:inline" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)]">
            <div className="px-2 py-2">
              <p className="text-sm font-medium">Sign in to RegexLens</p>
              <p className="text-xs text-muted-foreground mt-1">
                Save patterns, export explanations, and access all features.
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
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild className="cursor-pointer">
            <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
              <Heart className="mr-2 h-4 w-4 text-pink-500" />
              Support RegexLens
            </a>
          </DropdownMenuItem>

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
    </div>
  );
}
