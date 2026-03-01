import { Suspense } from "react";
import { LandingPage } from "@/components/landing/LandingPage";

export default function Home() {
  return (
    <Suspense fallback={<LandingSkeleton />}>
      <LandingPage />
    </Suspense>
  );
}

function LandingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 border-b border-border animate-pulse" />
      <div className="max-w-4xl mx-auto px-4 py-24">
        <div className="h-12 w-3/4 bg-muted rounded mb-4 animate-pulse" />
        <div className="h-6 w-1/2 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}
