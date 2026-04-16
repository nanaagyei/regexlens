"use client";

import type { ExplanationDiff, ExplanationChange } from "@/types/diff";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Minus, Pencil } from "lucide-react";

const KIND_COLORS: Record<string, string> = {
  anchor: "text-emerald-400",
  group: "text-amber-400",
  quantifier: "text-violet-400",
  charclass: "text-rose-400",
  escape: "text-blue-400",
  alternation: "text-yellow-400",
  literal: "text-gray-300",
  sequence: "text-gray-400",
  backreference: "text-cyan-400",
  lookahead: "text-teal-400",
  lookbehind: "text-teal-400",
};

interface ExplanationDiffPanelProps {
  explanationDiff: ExplanationDiff;
}

export function ExplanationDiffPanel({ explanationDiff }: ExplanationDiffPanelProps) {
  if (!explanationDiff.hasChanges) {
    return (
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Explanation Changes
        </h4>
        <p className="text-xs text-muted-foreground italic">
          No explanation changes
        </p>
      </div>
    );
  }

  const meaningful = explanationDiff.changes.filter((c) => c.kind !== "equal");

  return (
    <div>
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Explanation Changes
      </h4>
      <div className="space-y-1" role="list" aria-label="Explanation changes">
        {meaningful.map((change, i) => (
          <ExplanationChangeRow key={i} change={change} />
        ))}
      </div>
    </div>
  );
}

function ExplanationChangeRow({ change }: { change: ExplanationChange }) {
  const step = change.newStep ?? change.oldStep;
  if (!step) return null;

  const kindColor = KIND_COLORS[step.kind] ?? "text-foreground";

  if (change.kind === "added") {
    return (
      <div
        className="flex items-start gap-2 px-2 py-1.5 rounded-md bg-emerald-500/10"
        role="listitem"
      >
        <Plus className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
        <span className={cn(
          "text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/20 shrink-0",
          kindColor,
        )}>
          {step.kind}
        </span>
        <div className="min-w-0">
          <span className="text-xs text-foreground/90">{step.label}</span>
          {step.detail && (
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs text-muted-foreground truncate cursor-help">
                  {step.detail}
                </p>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[300px]">
                {step.detail}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    );
  }

  if (change.kind === "removed") {
    return (
      <div
        className="flex items-start gap-2 px-2 py-1.5 rounded-md bg-red-500/10"
        role="listitem"
      >
        <Minus className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
        <span className={cn(
          "text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-500/20 shrink-0",
          kindColor,
        )}>
          {step.kind}
        </span>
        <div className="min-w-0">
          <span className="text-xs text-foreground/60 line-through">{step.label}</span>
          {step.detail && (
            <p className="text-xs text-muted-foreground/50 truncate line-through">
              {step.detail}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Modified
  const oldStep = change.oldStep;
  const newStep = change.newStep;

  return (
    <div
      className="flex items-start gap-2 px-2 py-1.5 rounded-md bg-amber-500/10"
      role="listitem"
    >
      <Pencil className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
      <span className={cn(
        "text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/20 shrink-0",
        kindColor,
      )}>
        {step.kind}
      </span>
      <div className="min-w-0 space-y-0.5">
        {change.labelChanged && oldStep && newStep ? (
          <div className="text-xs">
            <span className="text-red-400/70 line-through">{oldStep.label}</span>
            <span className="text-muted-foreground mx-1">&rarr;</span>
            <span className="text-foreground/90">{newStep.label}</span>
          </div>
        ) : (
          <span className="text-xs text-foreground/90">{step.label}</span>
        )}
        {change.detailChanged && oldStep && newStep && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-xs cursor-help">
                <span className="text-red-400/50 line-through truncate">
                  {oldStep.detail ?? "(none)"}
                </span>
                <span className="text-muted-foreground mx-1">&rarr;</span>
                <span className="text-muted-foreground truncate">
                  {newStep.detail ?? "(none)"}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[350px]">
              <p className="text-xs"><strong>Before:</strong> {oldStep.detail ?? "(none)"}</p>
              <p className="text-xs"><strong>After:</strong> {newStep.detail ?? "(none)"}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
