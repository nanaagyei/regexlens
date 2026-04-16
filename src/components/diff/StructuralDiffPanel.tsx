"use client";

import { useState } from "react";
import type { StructuralDiff, StructuralChange, PropChange } from "@/types/diff";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Minus,
  Pencil,
  ChevronRight,
  ChevronDown,
  GitCompareArrows,
} from "lucide-react";

const CHANGE_STYLES: Record<string, { bg: string; text: string; icon: typeof Plus }> = {
  added: { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: Plus },
  removed: { bg: "bg-red-500/10", text: "text-red-400", icon: Minus },
  modified: { bg: "bg-amber-500/10", text: "text-amber-400", icon: Pencil },
};

const NODE_TYPE_LABELS: Record<string, string> = {
  anchor: "Anchor",
  literal: "Literal",
  escape: "Escape",
  charClass: "Class",
  group: "Group",
  quantifier: "Quantifier",
  alternation: "Alternation",
  alternative: "Branch",
  assertion: "Assertion",
  backreference: "Backref",
  dot: "Dot",
  pattern: "Pattern",
};

interface StructuralDiffPanelProps {
  structuralDiff: StructuralDiff;
}

export function StructuralDiffPanel({ structuralDiff }: StructuralDiffPanelProps) {
  if (!structuralDiff.hasChanges) {
    return (
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Structural Changes
        </h4>
        <p className="text-xs text-muted-foreground italic">
          No structural changes
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Structural Changes
        </h4>
        <span className="text-[10px] text-muted-foreground">
          {structuralDiff.summary}
        </span>
      </div>
      <div className="space-y-1" role="list" aria-label="Structural changes">
        {structuralDiff.changes.map((change, i) => (
          <ChangeRow key={`${change.kind}-${change.path}-${i}`} change={change} depth={0} />
        ))}
      </div>
    </div>
  );
}

function ChangeRow({ change, depth }: { change: StructuralChange; depth: number }) {
  const [expanded, setExpanded] = useState(false);
  const style = CHANGE_STYLES[change.kind];

  if (!style) return null;

  const Icon = style.icon;
  const hasDetails = (change.propChanges && change.propChanges.length > 0) ||
    (change.children && change.children.length > 0);
  const typeLabel = NODE_TYPE_LABELS[change.nodeType] ?? change.nodeType;

  return (
    <div role="listitem">
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={cn(
          "w-full flex items-start gap-2 px-2 py-1.5 rounded-md text-left transition-colors",
          style.bg,
          hasDetails && "cursor-pointer hover:brightness-110",
          !hasDetails && "cursor-default",
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        aria-expanded={hasDetails ? expanded : undefined}
        tabIndex={hasDetails ? 0 : -1}
      >
        {/* Expand chevron or change icon */}
        <span className={cn("shrink-0 mt-0.5", style.text)}>
          {hasDetails ? (
            expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <Icon className="h-3.5 w-3.5" />
          )}
        </span>

        {/* Node type badge */}
        <span className={cn(
          "shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded",
          change.kind === "added" && "bg-emerald-500/20 text-emerald-400",
          change.kind === "removed" && "bg-red-500/20 text-red-400",
          change.kind === "modified" && "bg-amber-500/20 text-amber-400",
        )}>
          {typeLabel}
        </span>

        {/* Description */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-foreground/90 truncate min-w-0">
              {change.description}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[350px]">
            <p className="text-xs">{change.description}</p>
          </TooltipContent>
        </Tooltip>
      </button>

      {/* Expanded details */}
      {expanded && change.propChanges && change.propChanges.length > 0 && (
        <div
          className="ml-6 mt-1 space-y-0.5"
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          {change.propChanges.map((pc, i) => (
            <PropChangeRow key={`${pc.prop}-${i}`} propChange={pc} />
          ))}
        </div>
      )}

      {/* Child changes */}
      {expanded && change.children && change.children.length > 0 && (
        <div className="mt-1">
          {change.children.map((child, i) => (
            <ChangeRow
              key={`${child.kind}-${child.path}-${i}`}
              change={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PropChangeRow({ propChange }: { propChange: PropChange }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded text-xs bg-muted/30">
      <GitCompareArrows className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground truncate">
        {propChange.description}
      </span>
    </div>
  );
}
