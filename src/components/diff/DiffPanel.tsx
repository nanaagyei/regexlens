"use client";

import { useRegexDiff } from "@/hooks/useRegexDiff";
import { SyntaxDiffView } from "./SyntaxDiffView";
import { FlagDiffView } from "./FlagDiffView";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
}

export function DiffPanel({
  pattern,
  flags,
  comparisonPattern,
  comparisonFlags,
  onComparisonPatternChange,
  onComparisonFlagsChange,
}: DiffPanelProps) {
  const diff = useRegexDiff(comparisonPattern, comparisonFlags, pattern, flags);

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
            placeholder="Enter old pattern..."
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
      <div className="flex-1 overflow-y-auto">
        {!diff ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="text-muted-foreground mb-3">
              <ArrowLeftRight className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-medium mb-1">
              Enter a pattern to compare
            </h3>
            <p className="text-xs text-muted-foreground max-w-[250px]">
              Type the old regex pattern above to see a character-level diff
              against the current pattern
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <SyntaxDiffView syntaxDiff={diff.syntax} />
            <FlagDiffView flagDiff={diff.flags} />
          </div>
        )}
      </div>
    </div>
  );
}
