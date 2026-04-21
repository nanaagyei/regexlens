"use client";

import { useRegexDiff } from "@/hooks/useRegexDiff";
import { SyntaxDiffView } from "./SyntaxDiffView";
import { FlagDiffView } from "./FlagDiffView";
import { StructuralDiffPanel } from "./StructuralDiffPanel";
import { ExplanationDiffPanel } from "./ExplanationDiffPanel";
import { BehaviorSummaryPanel } from "./BehaviorSummaryPanel";
import { ArrowLeftRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ParseResult, ExplanationResult, WarningsResult } from "@/types";

const COMPARISON_FLAGS = [
  { flag: "g", name: "global" },
  { flag: "i", name: "ignore case" },
  { flag: "m", name: "multiline" },
  { flag: "s", name: "dotAll" },
  { flag: "u", name: "unicode" },
  { flag: "y", name: "sticky" },
] as const;

interface DiffPanelProps {
  pattern: string;
  flags: string;
  comparisonPattern: string;
  comparisonFlags: string;
  onComparisonPatternChange: (pattern: string) => void;
  onComparisonFlagsChange: (flags: string) => void;
  parseResult: ParseResult;
  explanation: ExplanationResult;
  warnings: WarningsResult;
}

export function DiffPanel({
  pattern,
  flags,
  comparisonPattern,
  comparisonFlags,
  onComparisonPatternChange,
  onComparisonFlagsChange,
  parseResult,
  explanation,
  warnings,
}: DiffPanelProps) {
  const diff = useRegexDiff(
    comparisonPattern,
    comparisonFlags,
    pattern,
    flags,
    parseResult,
    explanation,
    warnings,
  );

  const toggleComparisonFlag = (flag: string) => {
    const hasFlag = comparisonFlags.includes(flag);
    const newFlags = hasFlag
      ? comparisonFlags.replace(flag, "")
      : comparisonFlags + flag;
    onComparisonFlagsChange(newFlags);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Comparison input area */}
      <div className="px-4 pt-4 pb-3 border-b space-y-2">
        <label
          htmlFor="comparison-pattern"
          className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
        >
          Compare against
        </label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono text-sm shrink-0">
            /
          </span>
          <input
            id="comparison-pattern"
            type="text"
            value={comparisonPattern}
            onChange={(e) => onComparisonPatternChange(e.target.value)}
            placeholder="Paste the previous regex..."
            data-testid="comparison-pattern-input"
            className="flex-1 min-w-0 bg-muted/50 border rounded-md px-2 py-1.5 font-mono text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
            spellCheck={false}
            autoComplete="off"
          />
          <span className="text-muted-foreground font-mono text-sm shrink-0">
            /
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <span className="text-xs text-muted-foreground mr-1">Flags:</span>
          {COMPARISON_FLAGS.map(({ flag, name }) => {
            const isActive = comparisonFlags.includes(flag);
            return (
              <Tooltip key={flag}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleComparisonFlag(flag)}
                    data-testid={`comparison-flag-${flag}`}
                    data-active={isActive ? "true" : "false"}
                    className={cn(
                      "h-6 w-6 p-0 font-mono text-xs",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {flag}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">{name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {!diff ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="text-muted-foreground mb-3">
              <ArrowLeftRight className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-medium mb-1">
              Compare two regex versions
            </h3>
            <p className="text-xs text-muted-foreground max-w-[250px]">
              Paste the previous version above to see what changed between
              two regex patterns
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <BehaviorSummaryPanel
              behaviorSummary={diff.behaviorSummary}
              warningDiff={diff.warnings}
            />
            <SyntaxDiffView syntaxDiff={diff.syntax} />
            <FlagDiffView flagDiff={diff.flags} />
            {diff.structural ? (
              <StructuralDiffPanel structuralDiff={diff.structural} />
            ) : diff.syntax.hasChanges ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Structural diff unavailable — one or both patterns could not be parsed</span>
              </div>
            ) : null}
            {diff.explanation ? (
              <ExplanationDiffPanel explanationDiff={diff.explanation} />
            ) : diff.syntax.hasChanges ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Explanation diff unavailable — one or both patterns could not be parsed</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
