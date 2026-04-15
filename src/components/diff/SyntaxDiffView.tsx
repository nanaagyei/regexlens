"use client";

import type { SyntaxDiff } from "@/types";
import { cn } from "@/lib/utils";

interface SyntaxDiffViewProps {
  syntaxDiff: SyntaxDiff;
}

export function SyntaxDiffView({ syntaxDiff }: SyntaxDiffViewProps) {
  if (!syntaxDiff.hasChanges) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No pattern changes
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Pattern changes
      </h4>
      <code
        className="block rounded-md border bg-muted/50 px-3 py-2 font-mono text-sm leading-relaxed break-all"
        aria-label="Syntax diff"
      >
        {syntaxDiff.ops.map((op, i) => (
          <span
            key={i}
            className={cn(
              op.kind === "insert" &&
                "bg-emerald-500/20 text-emerald-400 rounded-sm px-px",
              op.kind === "delete" &&
                "bg-red-500/20 text-red-400 line-through rounded-sm px-px",
            )}
          >
            {op.value}
          </span>
        ))}
      </code>
    </div>
  );
}
