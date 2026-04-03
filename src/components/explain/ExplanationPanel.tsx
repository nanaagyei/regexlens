"use client";

import { useState, useEffect, useRef } from "react";
import { ExplanationMode, ExplanationResult, ParseResult, AIContext } from "@/types";
import { ExplanationSteps } from "./ExplanationSteps";
import { useAIChat } from "@/hooks/useAIChat";
import { useEntitlement } from "@/hooks/useEntitlement";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ExplanationPanelProps {
  explanation: ExplanationResult;
  parseResult: ParseResult;
  pattern?: string;
  flags?: string;
  explanationMode?: ExplanationMode;
  onExplanationModeChange?: (mode: ExplanationMode) => void;
}

export function ExplanationPanel({
  explanation,
  parseResult,
  pattern,
  flags,
  explanationMode = "simple",
  onExplanationModeChange,
}: ExplanationPanelProps) {
  const [useAIPolish, setUseAIPolish] = useState(false);
  const { isPro } = useEntitlement();
  const { messages, isStreaming, sendMessage, clearHistory } = useAIChat();
  const prevPatternRef = useRef<string>("");

  // Reset AI polish when pattern changes
  useEffect(() => {
    if (pattern !== prevPatternRef.current) {
      prevPatternRef.current = pattern || "";
      if (useAIPolish && messages.length > 0) {
        clearHistory();
      }
    }
  }, [pattern, useAIPolish, messages.length, clearHistory]);

  // Trigger AI polish when toggled on
  useEffect(() => {
    if (
      useAIPolish &&
      isPro &&
      pattern &&
      explanation.steps.length > 0 &&
      messages.length === 0
    ) {
      const context: AIContext = {
        pattern: pattern || "",
        flags: flags || "",
        explanationSteps: explanation.steps.map((s) => ({
          label: s.label,
          kind: s.kind,
          detail: s.detail ?? undefined,
        })),
      };
      sendMessage("polish", context);
    }
  }, [useAIPolish, isPro, pattern, flags, explanation.steps, messages.length, sendMessage]);

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

  // Get polished content from AI messages
  const polishedContent =
    messages.length > 0
      ? messages[messages.length - 1]?.role === "assistant"
        ? messages[messages.length - 1].content
        : null
      : null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            What this pattern does
          </h3>
          {onExplanationModeChange && (
            <div className="flex items-center rounded-md bg-muted p-0.5">
              <button
                onClick={() => onExplanationModeChange("simple")}
                className={cn(
                  "px-2 py-0.5 text-[11px] font-medium rounded transition-colors",
                  explanationMode === "simple"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Simple
              </button>
              <button
                onClick={() => onExplanationModeChange("technical")}
                className={cn(
                  "px-2 py-0.5 text-[11px] font-medium rounded transition-colors",
                  explanationMode === "technical"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Technical
              </button>
            </div>
          )}
        </div>
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
                onChange={(e) => {
                  const checked = e.target.checked;
                  setUseAIPolish(checked);
                  if (!checked) clearHistory();
                }}
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
            {isPro
              ? "Rewrites the explanation into smooth, natural prose using AI."
              : "Upgrade to Pro to unlock AI-polished explanations."}
          </TooltipContent>
        </Tooltip>
      </div>

      {useAIPolish && !isPro && (
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] font-normal gap-1">
            <Lock className="h-2.5 w-2.5" />
            Pro feature
          </Badge>
          <Link
            href="/pricing"
            className="text-[10px] text-primary hover:underline"
          >
            Upgrade
          </Link>
        </div>
      )}

      {useAIPolish && isPro && isStreaming && !polishedContent && (
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Polishing explanation...</span>
        </div>
      )}

      {useAIPolish && isPro && polishedContent ? (
        <div className="text-sm leading-relaxed text-foreground/90 space-y-2">
          {polishedContent.split("\n").map((line, i) =>
            line.trim() ? (
              <p key={i}>{line}</p>
            ) : (
              <div key={i} className="h-1" />
            )
          )}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>
      ) : (
        <ExplanationSteps steps={explanation.steps} />
      )}
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
