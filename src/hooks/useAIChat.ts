"use client";

import { useState, useCallback, useRef } from "react";
import { AIAction, AIContext, AIChatMessage } from "@/types";
import { getStoredApiKey } from "@/lib/ai/apiKeyStorage";

interface UseAIChatReturn {
  messages: AIChatMessage[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (
    action: AIAction,
    context: AIContext,
    message?: string
  ) => void;
  clearHistory: () => void;
  stopStreaming: () => void;
}

let messageCounter = 0;
function generateId(): string {
  return `msg-${Date.now()}-${++messageCounter}`;
}

export function useAIChat(): UseAIChatReturn {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (action: AIAction, context: AIContext, message?: string) => {
      // Stop any existing stream
      abortRef.current?.abort();

      setError(null);
      setIsStreaming(true);

      const apiKey = getStoredApiKey();
      if (!apiKey) {
        setError("No API key found. Add your Anthropic API key in the Copilot settings.");
        setIsStreaming(false);
        return;
      }

      // Build user-facing label for the message
      const userLabel = message || ACTION_LABELS[action];

      // Add user message
      const userMsg: AIChatMessage = {
        id: generateId(),
        role: "user",
        content: userLabel,
        action,
        timestamp: Date.now(),
      };

      // Add empty assistant message to fill via streaming
      const assistantMsg: AIChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
        action,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Build conversation history from previous messages (exclude the new ones)
        const history = messages
          .filter((m) => m.content.length > 0)
          .slice(-20)
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Anthropic-Key": apiKey,
          },
          body: JSON.stringify({
            action,
            context,
            message,
            conversationHistory: history.length > 0 ? history : undefined,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || `Request failed (${res.status})`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const chunk = JSON.parse(line);
              if (chunk.error) {
                throw new Error(chunk.error);
              }
              if (chunk.text) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...last,
                      content: last.content + chunk.text,
                    };
                  }
                  return updated;
                });
              }
            } catch (parseErr) {
              if (
                parseErr instanceof Error &&
                parseErr.message !== "Unexpected end of JSON input"
              ) {
                throw parseErr;
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // User cancelled — leave partial content
          return;
        }
        const errorMsg =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMsg);
        // Remove the empty assistant message on error
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "assistant" && last.content === "") {
            updated.pop();
          }
          return updated;
        });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages]
  );

  const clearHistory = useCallback(() => {
    stopStreaming();
    setMessages([]);
    setError(null);
  }, [stopStreaming]);

  return { messages, isStreaming, error, sendMessage, clearHistory, stopStreaming };
}

const ACTION_LABELS: Record<AIAction, string> = {
  polish: "Polish the explanation into natural prose",
  edge_cases: "What strings won't this match?",
  security_review: "Is this pattern safe for production?",
  optimize: "How can I optimize this pattern?",
  explain_simple: "Explain this to a beginner",
  generate_tests: "Generate test cases for this pattern",
  generate_pattern: "Generate a regex pattern",
  fix_suggestions: "How do I fix the warnings?",
  freeform: "Question",
};
