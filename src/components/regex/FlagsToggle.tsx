"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FlagsToggleProps {
  flags: string;
  onToggle: (flag: string) => void;
}

const FLAG_INFO = [
  {
    flag: "g",
    name: "global",
    description: "Match all occurrences, not just the first",
  },
  {
    flag: "i",
    name: "ignore case",
    description: "Case-insensitive matching",
  },
  {
    flag: "m",
    name: "multiline",
    description: "^ and $ match start/end of each line",
  },
  {
    flag: "s",
    name: "dotAll",
    description: "Dot (.) matches newlines too",
  },
  {
    flag: "u",
    name: "unicode",
    description: "Enable full Unicode support",
  },
  {
    flag: "y",
    name: "sticky",
    description: "Match only at lastIndex position",
  },
];

export function FlagsToggle({ flags, onToggle }: FlagsToggleProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-xs text-muted-foreground mr-1">Flags:</span>
      <div className="flex items-center gap-0.5 sm:gap-1">
        {FLAG_INFO.map(({ flag, name, description }) => {
          const isActive = flags.includes(flag);
          return (
            <Tooltip key={flag}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => onToggle(flag)}
                  className={cn(
                    "h-7 w-7 p-0 font-mono text-xs touch-manipulation tap-highlight-none select-none-touch",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {flag}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
