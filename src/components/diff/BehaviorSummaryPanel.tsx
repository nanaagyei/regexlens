"use client";

import type { BehaviorSummaryResult, WarningDiff } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Minus,
  ArrowRight,
  FileText,
  Layers,
  AlertTriangle,
} from "lucide-react";

interface BehaviorSummaryPanelProps {
  behaviorSummary: BehaviorSummaryResult;
  warningDiff: WarningDiff | null;
}

const SOURCE_LABELS: Record<string, string> = {
  flags: "Flags",
  structural: "Structure",
  warnings: "Warnings",
  explanation: "Explanation",
};

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  flags: <FileText className="h-3 w-3" />,
  structural: <Layers className="h-3 w-3" />,
  warnings: <AlertTriangle className="h-3 w-3" />,
  explanation: <FileText className="h-3 w-3" />,
};

const IMPORTANCE_STYLES: Record<string, string> = {
  high: "bg-amber-500",
  medium: "bg-blue-500",
  low: "bg-muted-foreground/50",
};

export function BehaviorSummaryPanel({
  behaviorSummary,
  warningDiff,
}: BehaviorSummaryPanelProps) {
  const hasWarningChanges = warningDiff?.hasChanges ?? false;

  if (!behaviorSummary.hasSummaries && !hasWarningChanges) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No behavioral changes detected
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Review Summary
      </h4>

      {/* Behavior summaries */}
      {behaviorSummary.hasSummaries && (
        <div
          className="space-y-1.5 max-h-[250px] overflow-y-auto overflow-x-hidden scrollbar-thin"
          role="list"
          aria-label="Behavior summaries"
        >
          {behaviorSummary.summaries.map((summary, i) => (
            <div
              key={i}
              role="listitem"
              className="flex items-start gap-2 rounded-md border bg-muted/50 px-3 py-2"
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${IMPORTANCE_STYLES[summary.importance]}`}
                aria-label={`${summary.importance} importance`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">{summary.message}</p>
              </div>
              <Badge
                variant="outline"
                className="shrink-0 text-[10px] gap-1 text-muted-foreground"
              >
                {SOURCE_ICONS[summary.source]}
                {SOURCE_LABELS[summary.source]}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Warning diff details */}
      {hasWarningChanges && warningDiff && (
        <div className="space-y-1.5">
          <h5 className="text-xs font-medium text-muted-foreground">
            Warning changes
          </h5>
          <div
            className="space-y-1"
            role="list"
            aria-label="Warning changes"
          >
            {warningDiff.changes.map((change, i) => (
              <div
                key={i}
                role="listitem"
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs ${
                  change.kind === "added"
                    ? "border-l-2 border-l-emerald-500 bg-emerald-500/5"
                    : change.kind === "removed"
                      ? "border-l-2 border-l-red-500 bg-red-500/5"
                      : "border-l-2 border-l-amber-500 bg-amber-500/5"
                }`}
              >
                {change.kind === "added" ? (
                  <Plus className="h-3 w-3 text-emerald-400 shrink-0" />
                ) : change.kind === "removed" ? (
                  <Minus className="h-3 w-3 text-red-400 shrink-0" />
                ) : (
                  <ArrowRight className="h-3 w-3 text-amber-400 shrink-0" />
                )}
                <span className="truncate">
                  {change.kind === "added" && change.newWarning
                    ? change.newWarning.title
                    : change.kind === "removed" && change.oldWarning
                      ? change.oldWarning.title
                      : `${change.oldSeverity} → ${change.newSeverity}: ${change.newWarning?.title ?? change.warningId}`}
                </span>
                {change.kind === "added" && change.newWarning && (
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] ${
                      change.newWarning.severity === "danger"
                        ? "text-red-400 border-red-500/30"
                        : change.newWarning.severity === "warn"
                          ? "text-amber-400 border-amber-500/30"
                          : "text-blue-400 border-blue-500/30"
                    }`}
                  >
                    {change.newWarning.severity}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
