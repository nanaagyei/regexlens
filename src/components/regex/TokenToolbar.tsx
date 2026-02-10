"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TokenToolbarProps {
  onInsert: (newPattern: string) => void;
  currentPattern: string;
}

// All tokens with priority - lower number = shown on smaller screens
const TOKENS = [
  // Priority 1 - Always visible (essential)
  { token: "\\d", label: "\\d", description: "Digit (0-9)", priority: 1 },
  { token: "\\w", label: "\\w", description: "Word character", priority: 1 },
  { token: "\\s", label: "\\s", description: "Whitespace", priority: 1 },
  { token: ".", label: ".", description: "Any character", priority: 1 },
  { token: "+", label: "+", description: "One or more", priority: 1 },
  { token: "*", label: "*", description: "Zero or more", priority: 1 },
  { token: "?", label: "?", description: "Optional", priority: 1 },
  { token: "{n,m}", label: "{}", description: "Quantifier range", priority: 1 },
  { token: "()", label: "()", description: "Capture group", priority: 1 },
  // Priority 2 - Visible on xs+ (480px+)
  { token: "(?:)", label: "(?:)", description: "Non-capturing group", priority: 2 },
  { token: "[]", label: "[]", description: "Character class", priority: 2 },
  { token: "^", label: "^", description: "Start of input", priority: 2 },
  { token: "$", label: "$", description: "End of input", priority: 2 },
  { token: "|", label: "|", description: "Alternation (OR)", priority: 2 },
  { token: "\\b", label: "\\b", description: "Word boundary", priority: 2 },
];

export function TokenToolbar({ onInsert, currentPattern }: TokenToolbarProps) {
  const handleInsert = (token: string) => {
    // For simplicity, append to the end of the pattern
    // In a more advanced implementation, we'd insert at cursor position
    onInsert(currentPattern + token);
  };

  return (
    <div className="flex flex-wrap gap-0.5 sm:gap-1">
      {TOKENS.map(({ token, label, description, priority }) => (
        <Tooltip key={token}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleInsert(token)}
              className={cn(
                "h-6 px-1 sm:px-1.5 text-xs font-mono text-muted-foreground hover:text-foreground touch-manipulation tap-highlight-none",
                priority === 2 && "hidden xs:inline-flex"
              )}
            >
              {label}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{description}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
