"use client";

import type { FlagDiff } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FlagDiffViewProps {
  flagDiff: FlagDiff;
}

export function FlagDiffView({ flagDiff }: FlagDiffViewProps) {
  if (!flagDiff.hasChanges) {
    return (
      <p className="text-xs text-muted-foreground italic">No flag changes</p>
    );
  }

  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Flag changes
      </h4>
      <div className="flex flex-wrap gap-2" role="list" aria-label="Flag changes">
        {flagDiff.changes.map((change) => (
          <Tooltip key={change.flag}>
            <TooltipTrigger asChild>
              <div role="listitem">
                <Badge
                  className={
                    change.changeType === "added"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }
                >
                  <span className="font-mono mr-1">
                    {change.changeType === "added" ? "+" : "-"}
                    {change.flag}
                  </span>
                  <span className="font-sans">{change.label}</span>
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{change.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
