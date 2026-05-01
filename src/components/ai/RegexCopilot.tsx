"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAIChat } from "@/hooks/useAIChat";
import { useUser } from "@/hooks/useUser";
import { AIAction, AIContext } from "@/types";
import { SmartPromptBar } from "./SmartPromptBar";
import { StreamingMessage } from "./StreamingMessage";
import { PatternGenerator } from "./PatternGenerator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Send,
  Trash2,
  StopCircle,
  AlertCircle,
  Key,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignInCallout } from "@/components/auth/SignInCallout";
import {
  getStoredApiKey,
  storeApiKey,
  clearApiKey,
  isValidKeyFormat,
} from "@/lib/ai/apiKeyStorage";

interface RegexCopilotProps {
  pattern: string;
  flags: string;
  testText: string;
  matchCount: number;
  matchTruncated: boolean;
  warningCount: number;
  warnings: Array<{ severity: string; title: string; message: string }>;
  explanationSteps: Array<{
    label: string;
    kind: string;
    detail?: string;
  }>;
  onApplyPattern?: (pattern: string, flags: string) => void;
}

export function RegexCopilot({
  pattern,
  flags,
  testText,
  matchCount,
  matchTruncated,
  warningCount,
  warnings,
  explanationSteps,
  onApplyPattern,
}: RegexCopilotProps) {
  const { user, isLoading: isUserLoading } = useUser();
  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearHistory,
    stopStreaming,
  } = useAIChat();
  const [freeformInput, setFreeformInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);

  useEffect(() => {
    setHasApiKey(getStoredApiKey() !== null);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const buildContext = useCallback((): AIContext => {
    return {
      pattern,
      flags,
      testText: testText.slice(0, 2000),
      matches: { count: matchCount, truncated: matchTruncated },
      warnings: warnings.length > 0 ? warnings : undefined,
      explanationSteps:
        explanationSteps.length > 0 ? explanationSteps : undefined,
    };
  }, [
    pattern,
    flags,
    testText,
    matchCount,
    matchTruncated,
    warnings,
    explanationSteps,
  ]);

  const handleAction = useCallback(
    (action: AIAction) => {
      sendMessage(action, buildContext());
    },
    [sendMessage, buildContext]
  );

  const handleFreeform = useCallback(() => {
    const trimmed = freeformInput.trim();
    if (!trimmed || isStreaming) return;
    sendMessage("freeform", buildContext(), trimmed);
    setFreeformInput("");
  }, [freeformInput, isStreaming, sendMessage, buildContext]);

  const handleGenerate = useCallback(
    (description: string) => {
      sendMessage("generate_pattern", buildContext(), description);
    },
    [sendMessage, buildContext]
  );

  const handleSaveKey = useCallback(() => {
    const trimmed = keyInput.trim();
    if (!isValidKeyFormat(trimmed)) {
      setKeyError("Invalid key format. Anthropic keys start with sk-ant-.");
      return;
    }
    storeApiKey(trimmed);
    setHasApiKey(true);
    setKeyInput("");
    setKeyError(null);
  }, [keyInput]);

  const handleClearKey = useCallback(() => {
    clearApiKey();
    setHasApiKey(false);
    setKeyInput("");
    setKeyError(null);
  }, []);

  // Auth gate
  if (!isUserLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <SignInCallout
          title="Review Assistant"
          description="Sign in for AI-powered review assistance — edge case detection, safety checks, optimization suggestions, and plain-English summaries."
        />
      </div>
    );
  }

  // API key gate
  if (!isUserLoading && user && !hasApiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="flex flex-col items-center text-center max-w-[320px]">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">Add your API key</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enter your Anthropic API key to enable AI features. Your key is
            stored only in your browser and auto-expires after 48 hours.
          </p>

          <div className="w-full space-y-3">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                setKeyError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
              placeholder="sk-ant-..."
              className={cn(
                "w-full px-3 py-2 text-sm rounded-lg",
                "border border-input bg-background",
                "focus:outline-none focus:ring-1 focus:ring-ring",
                "placeholder:text-muted-foreground/50"
              )}
            />
            {keyError && (
              <p className="text-xs text-red-400">{keyError}</p>
            )}
            <Button
              onClick={handleSaveKey}
              disabled={!keyInput.trim()}
              className="w-full gap-2"
              size="sm"
            >
              <Key className="h-3.5 w-3.5" />
              Save key
            </Button>
          </div>

          <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-muted/50 text-left">
            <ShieldCheck className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              Your key stays in your browser. We never store, log, or retain
              it on our servers. It is sent only to proxy your request to
              Anthropic, then immediately discarded.
            </p>
          </div>

          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 text-xs text-primary hover:underline"
          >
            Get an API key from Anthropic &rarr;
          </a>
        </div>
      </div>
    );
  }

  const hasPattern = pattern.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Review Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          {hasApiKey && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearKey}
              className="h-7 text-xs gap-1 text-muted-foreground"
              title="Remove stored API key"
            >
              <X className="h-3 w-3" />
              Key
            </Button>
          )}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="h-7 text-xs gap-1 text-muted-foreground"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 min-h-0">
        <div ref={scrollRef} className="p-4 space-y-4">
          {messages.length === 0 ? (
            <EmptyState
              hasPattern={hasPattern}
              onAction={handleAction}
              warningCount={warningCount}
              isStreaming={isStreaming}
              onGenerate={handleGenerate}
              onApplyPattern={onApplyPattern}
            />
          ) : (
            <>
              {messages.map((msg, i) => (
                <StreamingMessage
                  key={msg.id}
                  message={msg}
                  isStreaming={
                    isStreaming &&
                    i === messages.length - 1 &&
                    msg.role === "assistant"
                  }
                />
              ))}
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Smart prompts (shown when there are messages) */}
      {messages.length > 0 && (
        <div className="px-4 py-2 border-t border-border/30">
          <SmartPromptBar
            onAction={handleAction}
            warningCount={warningCount}
            disabled={isStreaming}
            hasPattern={hasPattern}
          />
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-border/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={freeformInput}
            onChange={(e) => setFreeformInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleFreeform()}
            placeholder={
              hasPattern
                ? "Ask a review question..."
                : "Paste a pattern first..."
            }
            disabled={!hasPattern || isStreaming}
            className={cn(
              "flex-1 px-3 py-2 text-sm rounded-lg",
              "border border-input bg-background",
              "focus:outline-none focus:ring-1 focus:ring-ring",
              "placeholder:text-muted-foreground/50",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
          {isStreaming ? (
            <Button
              size="sm"
              variant="outline"
              onClick={stopStreaming}
              className="h-9 w-9 p-0"
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleFreeform}
              disabled={!freeformInput.trim() || !hasPattern}
              className="h-9 w-9 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  hasPattern,
  onAction,
  warningCount,
  isStreaming,
  onGenerate,
}: {
  hasPattern: boolean;
  onAction: (action: AIAction) => void;
  warningCount: number;
  isStreaming: boolean;
  onGenerate: (description: string) => void;
  onApplyPattern?: (pattern: string, flags: string) => void;
}) {
  return (
    <div className="space-y-5 py-2">
      <div className="text-center space-y-2">
        <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-sm font-medium">Review Assistant</h3>
        <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">
          {hasPattern
            ? "Ask anything about this pattern, or use a quick review action below."
            : "Paste a pattern to get started with AI-assisted review."}
        </p>
      </div>

      {hasPattern && (
        <div className="space-y-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1">
            Quick actions
          </p>
          <SmartPromptBar
            onAction={onAction}
            warningCount={warningCount}
            disabled={isStreaming}
            hasPattern={hasPattern}
          />
        </div>
      )}

      <div className="space-y-2.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1">
          Generate a pattern
        </p>
        <PatternGenerator onGenerate={onGenerate} isStreaming={isStreaming} />
      </div>
    </div>
  );
}
