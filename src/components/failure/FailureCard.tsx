"use client";

import { useCallback } from "react";
import type { FailureDiagnosis, FailureConfidence } from "@/types";
import { useHoverSync } from "@/hooks/useHoverSync";
import { XCircle, Pin, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FailureCardProps {
  failure: FailureDiagnosis;
}

const CONFIDENCE_CONFIG: Record<FailureConfidence, { label: string; className: string }> = {
  high: { label: "High confidence", className: "bg-emerald-500/15 text-emerald-400" },
  medium: { label: "Medium confidence", className: "bg-amber-500/15 text-amber-400" },
  low: { label: "Low confidence", className: "bg-red-500/15 text-red-400" },
};

const FAILURE_ID = "failure-diagnosis";

export function FailureCard({ failure }: FailureCardProps) {
  const { hoverState, setHoveredRange, toggleLockedFailure } = useHoverSync();

  const isLocked = hoverState.lockedFailureId === FAILURE_ID;
  const confidenceConfig = CONFIDENCE_CONFIG[failure.confidence];
  const hasRange = Boolean(failure.relatedRange);

  const handleMouseEnter = useCallback(() => {
    if (failure.relatedRange) {
      setHoveredRange(failure.relatedRange);
    }
  }, [failure.relatedRange, setHoveredRange]);

  const handleMouseLeave = useCallback(() => {
    if (!isLocked) {
      setHoveredRange(null);
    }
  }, [isLocked, setHoveredRange]);

  const handleClick = useCallback(() => {
    if (hasRange) {
      toggleLockedFailure(FAILURE_ID);
      if (!isLocked && failure.relatedRange) {
        setHoveredRange(failure.relatedRange);
      }
    }
  }, [hasRange, failure.relatedRange, isLocked, toggleLockedFailure, setHoveredRange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (hasRange && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        toggleLockedFailure(FAILURE_ID);
        if (!isLocked && failure.relatedRange) {
          setHoveredRange(failure.relatedRange);
        }
      }
    },
    [hasRange, failure.relatedRange, isLocked, toggleLockedFailure, setHoveredRange],
  );

  return (
    <div
      role={hasRange ? "button" : undefined}
      tabIndex={hasRange ? 0 : undefined}
      aria-pressed={hasRange ? isLocked : undefined}
      aria-label={failure.reason}
      className={cn(
        "p-3 rounded-lg border transition-colors",
        "bg-red-500/10 border-red-500/30",
        hasRange && "cursor-pointer hover:opacity-80",
        isLocked && "ring-1 ring-red-500/30",
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start gap-2">
        <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-medium text-red-400">
              {failure.reason}
            </h4>
            <span
              className={cn(
                "text-[10px] leading-tight px-1.5 py-0.5 rounded font-medium",
                confidenceConfig.className,
              )}
            >
              {confidenceConfig.label}
            </span>
            {isLocked && (
              <Pin
                className="h-3 w-3 shrink-0 text-red-400"
                aria-hidden="true"
              />
            )}
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-muted/50 text-muted-foreground font-mono">
              {failure.expected}
            </span>
            <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="px-2 py-1 rounded bg-red-500/10 text-red-300 font-mono">
              {failure.actual}
            </span>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            {failure.detail}
          </p>

          <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-mono">
            Position {failure.failureIndex} in input
          </p>
        </div>
      </div>
    </div>
  );
}
