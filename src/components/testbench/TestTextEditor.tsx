"use client";

import { useMemo, useRef, useImperativeHandle, forwardRef } from "react";
import { MatchResult } from "@/types";
import { MatchOverlay } from "./MatchOverlay";
import { cn } from "@/lib/utils";

export interface TestTextEditorRef {
  scrollToMatch: (start: number, end: number) => void;
}

interface TestTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  matches: MatchResult;
  pattern: string;
  flags: string;
}

export const TestTextEditor = forwardRef<TestTextEditorRef, TestTextEditorProps>(
  function TestTextEditor({ value, onChange, matches, pattern, flags: _flags }, ref) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    scrollToMatch(start: number, end: number) {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(start, end);
      const lineHeight = parseInt(getComputedStyle(el).lineHeight, 10) || 16;
      const textBefore = value.slice(0, start);
      const lineIndex = (textBefore.match(/\n/g) || []).length;
      const targetScrollTop = Math.max(0, lineIndex * lineHeight - el.clientHeight / 2 + lineHeight);
      el.scrollTop = targetScrollTop;
    },
  }), [value]);

  // Build highlighted text segments
  const highlightedSegments = useMemo(() => {
    if (!value || matches.spans.length === 0) {
      return [{ text: value, isMatch: false, matchIndex: -1 }];
    }

    const segments: Array<{
      text: string;
      isMatch: boolean;
      matchIndex: number;
    }> = [];
    
    let lastEnd = 0;
    const sortedSpans = [...matches.spans].sort((a, b) => a.start - b.start);

    for (const span of sortedSpans) {
      // Add non-matching text before this match
      if (span.start > lastEnd) {
        segments.push({
          text: value.slice(lastEnd, span.start),
          isMatch: false,
          matchIndex: -1,
        });
      }

      // Add the match
      segments.push({
        text: value.slice(span.start, span.end),
        isMatch: true,
        matchIndex: span.matchIndex,
      });

      lastEnd = span.end;
    }

    // Add remaining text after last match
    if (lastEnd < value.length) {
      segments.push({
        text: value.slice(lastEnd),
        isMatch: false,
        matchIndex: -1,
      });
    }

    return segments;
  }, [value, matches.spans]);

  return (
    <div className="relative h-full">
      {/* Actual textarea for editing */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste sample text here — matches highlight instantly"
        className={cn(
          "w-full h-full p-4 bg-transparent resize-none font-mono text-sm",
          "focus:outline-none focus:ring-0 border-0",
          "placeholder:text-muted-foreground",
          // Make text transparent when we have highlights
          matches.spans.length > 0 ? "text-transparent caret-foreground" : "text-foreground"
        )}
        spellCheck={false}
      />

      {/* Highlight overlay - positioned behind the text */}
      {matches.spans.length > 0 && (
        <MatchOverlay segments={highlightedSegments} />
      )}

      {/* Empty state */}
      {value && pattern && matches.matches.length === 0 && (
        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-card/80 px-2 py-1 rounded">
          No matches found
        </div>
      )}
    </div>
  );
});
