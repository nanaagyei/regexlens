"use client";

import type { FailureDiagnosis, MatchResult } from "@/types";
import { FailureCard } from "./FailureCard";
import { CheckCircle2, FileText, Info } from "lucide-react";

interface FailurePanelProps {
  failureAnalysis: FailureDiagnosis | null;
  matchResult: MatchResult;
  hasText: boolean;
}

export function FailurePanel({ failureAnalysis, matchResult, hasText }: FailurePanelProps) {
  if (!hasText) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-muted-foreground mb-3">
          <FileText className="h-8 w-8" />
        </div>
        <h3 className="text-sm font-medium mb-1">Paste test input</h3>
        <p className="text-xs text-muted-foreground max-w-[250px]">
          Paste the input that should (or shouldn&apos;t) match to diagnose failures
        </p>
      </div>
    );
  }

  if (!failureAnalysis && matchResult.matches.length > 0) {
    const count = matchResult.totalCount;
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-emerald-500 mb-3">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-sm font-medium mb-1">Pattern matches</h3>
        <p className="text-xs text-muted-foreground">
          Found {count} match{count !== 1 ? "es" : ""} in the test text
        </p>
      </div>
    );
  }

  if (!failureAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-muted-foreground mb-3">
          <FileText className="h-8 w-8" />
        </div>
        <h3 className="text-sm font-medium mb-1">No failure data</h3>
        <p className="text-xs text-muted-foreground max-w-[250px]">
          Paste a valid pattern and test input to see failure analysis
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Match failure diagnosis
        </h3>
      </div>
      {failureAnalysis.analysisLimited && (
        <div
          className="mb-3 flex gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
          role="status"
        >
          <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
          <span>
            Failure simulation was limited for performance (first{" "}
            {failureAnalysis.analysisWindowLength?.toLocaleString() ?? "N"} characters
            {typeof failureAnalysis.analysisTextLength === "number"
              ? ` of ${failureAnalysis.analysisTextLength.toLocaleString()} total`
              : ""}
            ).
          </span>
        </div>
      )}
      <div role="region" aria-label="Failure analysis">
        <FailureCard failure={failureAnalysis} />
      </div>
    </div>
  );
}
