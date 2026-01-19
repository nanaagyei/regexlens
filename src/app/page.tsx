import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";

function LoadingFallback() {
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-muted rounded mb-2 mx-auto" />
          <div className="h-4 w-48 bg-muted rounded mx-auto" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AppShell />
    </Suspense>
  );
}
