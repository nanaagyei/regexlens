"use client";

import { ExplanationResult, ParseResult } from "@/types";
import { ExplanationSteps } from "./ExplanationSteps";
import { FileText } from "lucide-react";

interface ExplanationPanelProps {
  explanation: ExplanationResult;
  parseResult: ParseResult;
}

export function ExplanationPanel({
  explanation,
  parseResult,
}: ExplanationPanelProps) {
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
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        What this pattern does
      </h3>
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
