"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEntitlement } from "@/hooks/useEntitlement";
import { Warning, ParseResult } from "@/types";
import { WarningCard } from "@/components/warnings/WarningCard";
import { AlertTriangle, Lock, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AnalysisPanelProps {
  pattern: string;
  flags: string;
  parseResult?: ParseResult;
}

interface SafeRewriteSuggestion {
  id: string;
  title: string;
  description: string;
  caveat?: string;
}

interface AnalysisResult {
  riskScore: number;
  warnings: Array<{
    id: string;
    severity: "info" | "warn" | "danger";
    title: string;
    message: string;
    hint?: string;
    range?: { start: number; end: number };
  }>;
  notes: string[];
  suggestions?: SafeRewriteSuggestion[];
  complexity: {
    level: "low" | "medium" | "high" | "extreme";
    factors: string[];
  };
}

function severityToScore(severity: string): number {
  if (severity === "danger") return 90;
  if (severity === "warn") return 50;
  return 20;
}

function mapToWarning(
  w: AnalysisResult["warnings"][0]
): Warning {
  return {
    ...w,
    score: severityToScore(w.severity),
  };
}

function RiskScoreBadge({
  score,
  level,
}: {
  score: number;
  level: AnalysisResult["complexity"]["level"];
}) {
  const config = {
    low: {
      color: "text-emerald-400",
      bg: "bg-emerald-400/20",
      border: "border-emerald-500/30",
      label: "Low",
    },
    medium: {
      color: "text-amber-400",
      bg: "bg-amber-400/20",
      border: "border-amber-500/30",
      label: "Medium",
    },
    high: {
      color: "text-orange-400",
      bg: "bg-orange-400/20",
      border: "border-orange-500/30",
      label: "High",
    },
    extreme: {
      color: "text-red-400",
      bg: "bg-red-400/20",
      border: "border-red-500/30",
      label: "Extreme",
    },
  }[level];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border",
        config.bg,
        config.border
      )}
    >
      <span className={cn("text-sm font-semibold", config.color)}>{score}</span>
      <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
    </div>
  );
}

export function AnalysisPanel({ pattern, flags, parseResult }: AnalysisPanelProps) {
  const { isPro, isLoading: isEntitlementLoading, user } = useEntitlement();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunAnalysis = useCallback(async () => {
    if (!isPro || !pattern.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern, flags }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data.message || data.error || "Analysis failed";
        throw new Error(typeof msg === "string" ? msg : "Analysis failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run analysis");
    } finally {
      setIsLoading(false);
    }
  }, [isPro, pattern, flags]);

  // Invalid pattern fallback
  if (parseResult && !parseResult.ok && parseResult.errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-red-400 mb-3">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h3 className="text-sm font-medium mb-1">Invalid pattern</h3>
        <p className="text-xs text-red-400 max-w-[250px]">
          Fix the pattern to run analysis
        </p>
      </div>
    );
  }

  const showUpgradePrompt = !isEntitlementLoading && !isPro;

  if (showUpgradePrompt) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Pro Feature</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-[280px]">
          Run advanced regex analysis with risk scoring, backtracking detection, and rewrite suggestions.
        </p>
        <Button asChild>
          <Link href="/pricing">{user ? "Upgrade to Pro" : "Sign in to upgrade"}</Link>
        </Button>
      </div>
    );
  }

  if (!pattern.trim()) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Search className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Enter a regex pattern to run advanced analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border shrink-0">
        <Button
          onClick={handleRunAnalysis}
          disabled={isLoading}
          className="w-full gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Run Analysis
            </>
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}

          {result && !error && (
            <>
              {/* Risk score */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Risk score
                </span>
                <RiskScoreBadge
                  score={result.riskScore}
                  level={result.complexity.level}
                />
              </div>

              {/* Complexity factors */}
              {result.complexity.factors.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">
                    Complexity factors
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {result.complexity.factors.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings / detected issues */}
              {result.warnings.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">
                    Detected issues
                  </h4>
                  <div className="space-y-2">
                    {result.warnings.map((w) => (
                      <WarningCard key={w.id} warning={mapToWarning(w)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Safe rewrite suggestions */}
              {result.suggestions && result.suggestions.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">
                    Safe rewrite suggestions
                  </h4>
                  <p className="text-[10px] text-muted-foreground/80 mb-2">
                    Non-AI, deterministic suggestions. Apply only after verifying correctness.
                  </p>
                  <div className="space-y-3">
                    {result.suggestions.map((s) => (
                      <div
                        key={s.id}
                        className="p-3 rounded-lg border border-border bg-muted/20"
                      >
                        <p className="text-xs font-medium">{s.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {s.description}
                        </p>
                        {s.caveat && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1.5 italic">
                            Caveat: {s.caveat}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mitigations / notes */}
              {result.notes.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">
                    General notes
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-2">
                    {result.notes.map((note, i) => (
                      <li
                        key={i}
                        className="pl-3 border-l-2 border-muted"
                      >
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.warnings.length === 0 &&
                (!result.suggestions || result.suggestions.length === 0) &&
                result.notes.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No significant issues detected.
                  </p>
                )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
