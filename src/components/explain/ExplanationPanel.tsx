"use client";

import { useState } from "react";
import { ExplanationResult, ParseResult } from "@/types";
import { ExplanationSteps } from "./ExplanationSteps";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExplanationPanelProps {
  explanation: ExplanationResult;
  parseResult: ParseResult;
}

export function ExplanationPanel({
  explanation,
  parseResult,
}: ExplanationPanelProps) {
  const [useAIPolish, setUseAIPolish] = useState(false);
  // Empty state - no pattern
  if (!parseResult.ok && !parseResult.errorMessage) {
    return (
      <EmptyState
        icon={<FileText className="h-8 w-8" />}
        title="Type a regex to see what it does"
        description="Enter a pattern above to get a plain-English explanation"
      />
    );
  }

  // Error state
  if (!parseResult.ok) {
    return (
      <EmptyState
        icon={<FileText className="h-8 w-8 text-red-400" />}
        title="Fix the pattern to generate an explanation"
        description={parseResult.errorMessage}
        variant="error"
      />
    );
  }

  // No steps (empty pattern)
  if (explanation.steps.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-8 w-8" />}
        title="Empty pattern"
        description="Enter a regex pattern to see its explanation"
      />
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          What this pattern does
        </h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <label
              className={cn(
                "inline-flex items-center gap-1.5 cursor-pointer",
                "text-xs text-muted-foreground hover:text-foreground transition-colors"
              )}
            >
              <input
                type="checkbox"
                checked={useAIPolish}
                onChange={(e) => setUseAIPolish(e.target.checked)}
                className="sr-only peer"
              />
              <span
                className={cn(
                  "relative h-5 w-9 rounded-full bg-muted transition-colors",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
                  useAIPolish && "bg-primary/30"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-muted-foreground/50 transition-transform",
                    useAIPolish && "translate-x-4 bg-primary"
                  )}
                />
              </span>
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>AI polish</span>
            </label>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[200px]">
            Optional: rewrites steps into smoother prose. Requires API key. Coming soon.
          </TooltipContent>
        </Tooltip>
      </div>
      {useAIPolish && (
        <div className="mb-3">
          <Badge variant="secondary" className="text-[10px] font-normal">
            AI polish coming soon — showing deterministic explanation
          </Badge>
        </div>
      )}
      <ExplanationSteps steps={explanation.steps} />
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: "default" | "error";
}

function EmptyState({
  icon,
  title,
  description,
  variant = "default",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="text-muted-foreground mb-3">{icon}</div>
      <h3 className="text-sm font-medium mb-1">{title}</h3>
      <p
        className={`text-xs ${
          variant === "error" ? "text-red-400" : "text-muted-foreground"
        } max-w-[250px]`}
      >
        {description}
      </p>
    </div>
  );
}
