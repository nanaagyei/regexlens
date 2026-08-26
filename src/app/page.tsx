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
      <div className="h-14 border-b border-border/40" />
      <div className="mx-auto grid max-w-7xl gap-0 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,0.88fr)_clamp(5.5rem,14vw,12rem)_minmax(0,1.12fr)] lg:py-32">
        <div>
          <div className="mb-6 h-4 w-40 rounded bg-muted" />
          <div className="mb-4 h-16 w-5/6 rounded bg-muted" />
          <div className="mb-8 h-16 w-4/6 rounded bg-muted" />
          <div className="h-12 w-40 rounded bg-muted" />
        </div>
        <div className="hidden lg:block" />
        <div className="h-72 rounded-lg border border-border bg-card" />
      </div>
    </div>
  );
}
