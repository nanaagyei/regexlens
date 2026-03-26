"use client";

import { ExplanationStep } from "@/types";
import { useHoverSync } from "@/hooks/useHoverSync";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface StepRowProps {
  step: ExplanationStep;
  index: number;
}

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

export function StepRow({ step, index }: StepRowProps) {
  const { hoverState, setHoveredStepId, setHoveredRange, toggleLockedStep } =
    useHoverSync();

  const isHovered = hoverState.hoveredStepId === step.id;
  const isLocked = hoverState.lockedStepId === step.id;

  const handleMouseEnter = () => {
    setHoveredStepId(step.id);
    if (step.range) {
      setHoveredRange(step.range);
    }
  };

  const handleMouseLeave = () => {
    if (!isLocked) {
      setHoveredStepId(null);
      setHoveredRange(null);
    }
  };

  const handleClick = () => {
    toggleLockedStep(step.id);
  };

  const indentPx = step.depth * 16;

  return (
    <div
      className={cn(
        "flex items-start gap-2 py-1.5 px-2 rounded-md transition-colors duration-150 cursor-pointer",
        isHovered || isLocked
          ? "bg-accent"
          : "hover:bg-accent/50"
      )}
      style={{ paddingLeft: `${8 + indentPx}px` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <span className="text-xs text-muted-foreground w-5 shrink-0 pt-0.5">
        {index + 1}.
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm", KIND_COLORS[step.kind] || "text-foreground")}>
            {step.label}
          </span>
          {isLocked && (
            <Badge variant="secondary" className="text-[10px] h-4">
              locked
            </Badge>
          )}
        </div>
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
