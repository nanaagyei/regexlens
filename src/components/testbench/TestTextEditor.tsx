"use client";

import { useMemo, useCallback, useRef, useImperativeHandle, forwardRef } from "react";
import { MatchResult, MatchSpan } from "@/types";
import { useHoverSync } from "@/hooks/useHoverSync";
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

const HIGHLIGHT_CLASSES = [
  "match-highlight-1",
  "match-highlight-2",
  "match-highlight-3",
  "match-highlight-4",
  "match-highlight-5",
  "match-highlight-6",
];

export const TestTextEditor = forwardRef<TestTextEditorRef, TestTextEditorProps>(
  function TestTextEditor({ value, onChange, matches, pattern, flags }, ref) {
  const { hoverState, setHoveredMatchIndex } = useHoverSync();
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

  const handleMouseEnter = useCallback(
    (matchIndex: number) => {
      setHoveredMatchIndex(matchIndex);
    },
    [setHoveredMatchIndex]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredMatchIndex(null);
  }, [setHoveredMatchIndex]);

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
        <div
          className="absolute inset-0 p-4 pointer-events-none font-mono text-sm whitespace-pre-wrap break-words overflow-hidden"
          aria-hidden="true"
        >
          {highlightedSegments.map((segment, index) => {
            if (!segment.isMatch) {
              return <span key={index}>{segment.text}</span>;
            }

            const colorIndex = segment.matchIndex % HIGHLIGHT_CLASSES.length;
            const isHovered = hoverState.hoveredMatchIndex === segment.matchIndex;
            
            return (
              <span
                key={index}
                className={cn(
                  HIGHLIGHT_CLASSES[colorIndex],
                  isHovered && `${HIGHLIGHT_CLASSES[colorIndex]}-active`,
                  "rounded-sm transition-colors duration-150 pointer-events-auto cursor-pointer"
                )}
                onMouseEnter={() => handleMouseEnter(segment.matchIndex)}
                onMouseLeave={handleMouseLeave}
              >
                {segment.text}
              </span>
            );
          })}
        </div>
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
