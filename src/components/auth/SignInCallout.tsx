"use client";

import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SignInCalloutProps {
  title: string;
  description: string;
  className?: string;
}

export function SignInCallout({
  title,
  description,
  className,
}: SignInCalloutProps) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <LogIn className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[260px] mb-4">
        {description}
      </p>
      <Button variant="outline" asChild>
        <Link href="/signin?callbackUrl=%2Fapp">Sign in</Link>
      </Button>
    </div>
  );
}
