"use client";

import { AIChatMessage } from "@/types";
import { cn } from "@/lib/utils";
import { Copy, Check, User, Sparkles } from "lucide-react";
import { useState, useCallback } from "react";

interface StreamingMessageProps {
  message: AIChatMessage;
  isStreaming?: boolean;
}

export function StreamingMessage({
  message,
  isStreaming,
}: StreamingMessageProps) {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-2.5 text-sm",
        isAssistant ? "items-start" : "items-start justify-end"
      )}
    >
      {isAssistant && (
        <div className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3.5 py-2.5",
          isAssistant
            ? "bg-muted/50 text-foreground"
            : "bg-primary/15 text-foreground ml-auto"
        )}
      >
        {isAssistant ? (
          <MarkdownContent
            content={message.content}
            isStreaming={isStreaming}
          />
        ) : (
          <p className="text-[13px] leading-relaxed">{message.content}</p>
        )}
      </div>
      {!isAssistant && (
        <div className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-muted flex items-center justify-center">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

function MarkdownContent({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  if (!content && isStreaming) {
    return (
      <div className="flex items-center gap-1.5 py-1">
        <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" />
        <div
          className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse"
          style={{ animationDelay: "0.2s" }}
        />
        <div
          className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse"
          style={{ animationDelay: "0.4s" }}
        />
      </div>
    );
  }

  // Split content into code blocks and text
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="text-[13px] leading-relaxed space-y-2">
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          return <CodeBlock key={i} content={part} />;
        }
        return <InlineMarkdown key={i} content={part} />;
      })}
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />
      )}
    </div>
  );
}

function CodeBlock({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  // Extract language and code
  const match = content.match(/^```(\w*)\r?\n([\s\S]*?)```$/);
  const code = match
    ? match[2].trim()
    : content.replace(/^```\w*\r?\n?/, "").replace(/```$/, "").trim();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="relative group rounded-lg overflow-hidden border border-border/50">
      <pre className="bg-background/80 p-3 overflow-x-auto text-xs font-mono">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className={cn(
          "absolute top-2 right-2 p-1 rounded",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "bg-muted hover:bg-muted/80"
        )}
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-500" />
        ) : (
          <Copy className="h-3 w-3 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

function InlineMarkdown({ content }: { content: string }) {
  if (!content.trim()) return null;

  // Process inline markdown
  const lines = content.split("\n");

  return (
    <>
      {lines.map((line, i) => {
        // Headers
        if (line.startsWith("### ")) {
          return (
            <h4 key={i} className="font-semibold text-xs text-foreground mt-3 mb-1">
              {processInline(line.slice(4))}
            </h4>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="font-semibold text-sm text-foreground mt-3 mb-1">
              {processInline(line.slice(3))}
            </h3>
          );
        }

        // List items
        if (line.match(/^[-*] /)) {
          return (
            <div key={i} className="flex gap-1.5 ml-1">
              <span className="text-muted-foreground shrink-0 mt-0.5">-</span>
              <span>{processInline(line.slice(2))}</span>
            </div>
          );
        }

        // Numbered lists
        const numMatch = line.match(/^(\d+)\.\s/);
        if (numMatch) {
          return (
            <div key={i} className="flex gap-1.5 ml-1">
              <span className="text-muted-foreground shrink-0">{numMatch[1]}.</span>
              <span>{processInline(line.slice(numMatch[0].length))}</span>
            </div>
          );
        }

        // Empty lines
        if (!line.trim()) {
          return <div key={i} className="h-1" />;
        }

        // Regular paragraph
        return (
          <p key={i} className="leading-relaxed">
            {processInline(line)}
          </p>
        );
      })}
    </>
  );
}

function processInline(text: string): React.ReactNode {
  // Process bold, italic, and inline code
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Inline code
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code
          key={key++}
          className="px-1 py-0.5 rounded bg-background/80 font-mono text-[11px] text-primary"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      parts.push(
        <strong key={key++} className="font-semibold">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Find next special char
    const nextSpecial = remaining.search(/[`*]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    }
    if (nextSpecial > 0) {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
      continue;
    }

    // No match — consume one character
    parts.push(remaining[0]);
    remaining = remaining.slice(1);
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
