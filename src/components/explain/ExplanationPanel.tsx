"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ExplanationMode, ExplanationResult, ParseResult, AIContext } from "@/types";
import { ExplanationSteps } from "./ExplanationSteps";
import { useAIChat } from "@/hooks/useAIChat";
import { useUser } from "@/hooks/useUser";
import { useHoverSync } from "@/hooks/useHoverSync";
import { isApiKeyStored } from "@/lib/ai/apiKeyStorage";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const { isAuthenticated } = useUser();
  const { messages, isStreaming, sendMessage, clearHistory } = useAIChat();
  const { clearAll } = useHoverSync();
  const prevPatternRef = useRef<string>("");
  const prevModeRef = useRef<ExplanationMode>(explanationMode);

  const hasKey = isAuthenticated && isApiKeyStored();

  // Reset AI polish when pattern changes
  useEffect(() => {
    if (pattern !== prevPatternRef.current) {
      prevPatternRef.current = pattern || "";
      if (useAIPolish && messages.length > 0) {
        clearHistory();
      }
    }
  }, [pattern, useAIPolish, messages.length, clearHistory]);

  // Clear hover state and AI polish when mode changes (step IDs change between modes)
  useEffect(() => {
    if (explanationMode !== prevModeRef.current) {
      prevModeRef.current = explanationMode;
      clearAll();
      if (useAIPolish && messages.length > 0) {
        clearHistory();
      }
    }
  }, [explanationMode, clearAll, useAIPolish, messages.length, clearHistory]);

  // Trigger AI polish when toggled on
  useEffect(() => {
    if (
      useAIPolish &&
      hasKey &&
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
  }, [useAIPolish, hasKey, pattern, flags, explanation.steps, messages.length, sendMessage]);

  const handleModeChange = useCallback(
    (mode: ExplanationMode) => {
      onExplanationModeChange?.(mode);
    },
    [onExplanationModeChange]
  );

  // Empty state - no pattern
  if (!parseResult.ok && !parseResult.errorMessage) {
    return (
      <EmptyState
        title="Paste a regex to understand what it does"
        description="Drop a pattern above to get a plain-English review"
      />
    );
  }

  // Error state
  if (!parseResult.ok) {
    return (
      <ErrorEmptyState errorMessage={parseResult.errorMessage} />
    );
  }

  // No steps (empty pattern)
  if (explanation.steps.length === 0) {
    return (
      <EmptyState
        title="No pattern yet"
        description="Paste a regex to see its explanation"
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

  const polishTooltip = !isAuthenticated
    ? "Sign in to unlock AI-polished explanations."
    : !isApiKeyStored()
      ? "Add your Anthropic API key in the Copilot tab to enable AI polish."
      : "Rewrites the explanation into smooth, natural prose using AI.";

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            What this pattern does
          </h3>
          {onExplanationModeChange && (
            <div className="flex items-center rounded-md bg-muted p-0.5">
              <button
                onClick={() => handleModeChange("simple")}
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
                onClick={() => handleModeChange("technical")}
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
                disabled={!hasKey}
                className="sr-only peer"
              />
              <span
                className={cn(
                  "relative h-5 w-9 rounded-full bg-muted transition-colors",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
                  useAIPolish && "bg-primary/30",
                  !hasKey && "opacity-50"
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
            {polishTooltip}
          </TooltipContent>
        </Tooltip>
      </div>

      {useAIPolish && !hasKey && (
        <div className="mb-3 text-xs text-muted-foreground">
          {!isAuthenticated
            ? "Sign in to use AI polish."
            : "Add your API key in the Copilot tab to enable AI polish."}
        </div>
      )}

      {useAIPolish && hasKey && isStreaming && !polishedContent && (
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Polishing explanation...</span>
        </div>
      )}

      {useAIPolish && hasKey && polishedContent ? (
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
        <div key={explanationMode}>
          <ExplanationSteps steps={explanation.steps} />
        </div>
      )}
    </div>
  );
}

// ── Empty States ────────────────────────────────────────────

interface EmptyStateProps {
  title: string;
  description: string;
}

function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-up">
      <div className="text-muted-foreground/60 mb-4">
        <RegexIllustration />
      </div>
      <h3 className="text-sm font-medium mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-[250px]">{description}</p>
    </div>
  );
}

function ErrorEmptyState({ errorMessage }: { errorMessage: string }) {
  const hint = getErrorHint(errorMessage);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-up">
      <div className="text-red-400/60 mb-4">
        <RegexIllustration error />
      </div>
      <h3 className="text-sm font-medium mb-1">Fix the pattern to see its explanation</h3>
      <p className="text-xs text-red-400 max-w-[280px] mb-2">{errorMessage}</p>
      {hint && (
        <p className="text-xs text-muted-foreground max-w-[280px] italic">{hint}</p>
      )}
    </div>
  );
}

function getErrorHint(errorMessage: string): string | null {
  const msg = errorMessage.toLowerCase();
  if (msg.includes("unterminated group") || msg.includes("unclosed group") || msg.includes("unmatched '('")) {
    return "Tip: Check for missing closing parentheses.";
  }
  if (msg.includes("unterminated character class") || msg.includes("unmatched '['")) {
    return "Tip: Check for missing closing bracket ']'.";
  }
  if (msg.includes("nothing to repeat") || msg.includes("invalid quantifier")) {
    return "Tip: Quantifiers like *, +, ? need something before them.";
  }
  if (msg.includes("invalid escape") || msg.includes("invalid unicode")) {
    return "Tip: Check your escape sequence — some need specific formats.";
  }
  if (msg.includes("unmatched ')'")) {
    return "Tip: There's an extra closing parenthesis without a match.";
  }
  return null;
}

/** Stylized regex SVG illustration for empty states */
function RegexIllustration({ error }: { error?: boolean }) {
  const color = error ? "currentColor" : "currentColor";
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="14"
        width="40"
        height="20"
        rx="4"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray={error ? "4 3" : "none"}
        opacity={0.5}
      />
      <text
        x="24"
        y="28"
        textAnchor="middle"
        fill={color}
        fontSize="14"
        fontFamily="monospace"
        opacity={0.7}
      >
        /.*?/
      </text>
      {!error && (
        <>
          <circle cx="10" cy="10" r="2" fill={color} opacity={0.2} />
          <circle cx="38" cy="10" r="1.5" fill={color} opacity={0.15} />
          <circle cx="42" cy="38" r="1" fill={color} opacity={0.1} />
        </>
      )}
      {error && (
        <line
          x1="34"
          y1="8"
          x2="40"
          y2="14"
          stroke={color}
          strokeWidth="1.5"
          opacity={0.4}
        />
      )}
    </svg>
  );
}
