"use client";

import { useCallback } from "react";
import { ExplanationStep } from "@/types";
import { useHoverSync } from "@/hooks/useHoverSync";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pin, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepRowProps {
  step: ExplanationStep;
  index: number;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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

const KIND_BORDER_COLORS: Record<string, string> = {
  anchor: "border-l-emerald-400/60",
  group: "border-l-amber-400/60",
  quantifier: "border-l-violet-400/60",
  charclass: "border-l-rose-400/60",
  escape: "border-l-blue-400/60",
  alternation: "border-l-yellow-400/60",
  literal: "border-l-gray-300/40",
  sequence: "border-l-gray-400/40",
  backreference: "border-l-cyan-400/60",
  lookahead: "border-l-teal-400/60",
  lookbehind: "border-l-teal-400/60",
};

export function StepRow({ step, index, collapsible, collapsed, onToggleCollapse }: StepRowProps) {
  const { hoverState, setHoveredStepId, setHoveredRange, toggleLockedStep } =
    useHoverSync();

  const isHovered = hoverState.hoveredStepId === step.id;
  const isLocked = hoverState.lockedStepId === step.id;

  const handleMouseEnter = useCallback(() => {
    setHoveredStepId(step.id);
    setHoveredRange(step.range ?? null);
  }, [step.id, step.range, setHoveredStepId, setHoveredRange]);

  const handleMouseLeave = useCallback(() => {
    if (!isLocked) {
      setHoveredStepId(null);
      setHoveredRange(null);
    }
  }, [isLocked, setHoveredStepId, setHoveredRange]);

  const handleClick = useCallback(() => {
    toggleLockedStep(step.id);
  }, [step.id, toggleLockedStep]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleLockedStep(step.id);
      }
    },
    [step.id, toggleLockedStep]
  );

  const handleCollapseClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleCollapse?.();
    },
    [onToggleCollapse]
  );

  const indentPx = step.depth * 16;
  const animDelay = `${Math.min(index * 50, 500)}ms`;

  return (
    <div
      className={cn(
        "group relative flex items-start gap-2 min-h-[44px] py-2 px-2 rounded-md border-l-2",
        "transition-all duration-150 select-none",
        "animate-fade-up opacity-0",
        KIND_BORDER_COLORS[step.kind] || "border-l-gray-400/40",
        isLocked
          ? "bg-accent ring-1 ring-primary/30"
          : isHovered
            ? "bg-accent"
            : "hover:bg-accent/50"
      )}
      style={{
        paddingLeft: `${8 + indentPx}px`,
        animationDelay: animDelay,
        animationFillMode: "forwards",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Depth connector line */}
      {step.depth > 0 && (
        <span
          className="absolute top-0 bottom-0 w-px bg-border/40"
          style={{ left: `${8 + (step.depth - 1) * 16}px` }}
          aria-hidden="true"
        />
      )}

      {/* Collapse chevron or step number */}
      <span className="flex items-center shrink-0 pt-0.5 w-5">
        {collapsible ? (
          <button
            onClick={handleCollapseClick}
            className="text-muted-foreground hover:text-foreground transition-colors p-0"
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">
            {index + 1}.
          </span>
        )}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            aria-pressed={isLocked}
            aria-label={`Step ${index + 1}: ${step.label}`}
            className={cn(
              "text-sm text-left cursor-pointer bg-transparent border-0 p-0",
              KIND_COLORS[step.kind] || "text-foreground"
            )}
          >
            {step.label}
          </button>
          {isLocked && (
            <Pin className="h-3 w-3 text-primary/70 shrink-0" aria-hidden="true" />
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
