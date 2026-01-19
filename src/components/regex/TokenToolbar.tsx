"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TokenToolbarProps {
  onInsert: (newPattern: string) => void;
  currentPattern: string;
}

const TOKENS = [
  { token: "\\d", label: "\\d", description: "Digit (0-9)" },
  { token: "\\w", label: "\\w", description: "Word character" },
  { token: "\\s", label: "\\s", description: "Whitespace" },
  { token: ".", label: ".", description: "Any character" },
  { token: "+", label: "+", description: "One or more" },
  { token: "*", label: "*", description: "Zero or more" },
  { token: "?", label: "?", description: "Optional" },
  { token: "{n,m}", label: "{}", description: "Quantifier range" },
  { token: "()", label: "()", description: "Capture group" },
  { token: "(?:)", label: "(?:)", description: "Non-capturing group" },
  { token: "[]", label: "[]", description: "Character class" },
  { token: "^", label: "^", description: "Start of input" },
  { token: "$", label: "$", description: "End of input" },
  { token: "|", label: "|", description: "Alternation (OR)" },
  { token: "\\b", label: "\\b", description: "Word boundary" },
];

export function TokenToolbar({ onInsert, currentPattern }: TokenToolbarProps) {
  const handleInsert = (token: string) => {
    // For simplicity, append to the end of the pattern
    // In a more advanced implementation, we'd insert at cursor position
    onInsert(currentPattern + token);
  };

  return (
    <div className="flex flex-wrap gap-1">
      {TOKENS.map(({ token, label, description }) => (
        <Tooltip key={token}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleInsert(token)}
              className="h-6 px-1.5 text-xs font-mono text-muted-foreground hover:text-foreground"
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
