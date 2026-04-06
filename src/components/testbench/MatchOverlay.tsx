"use client";

import { useCallback } from "react";
import { useHoverSync } from "@/hooks/useHoverSync";
import { cn } from "@/lib/utils";

const HIGHLIGHT_CLASSES = [
  "match-highlight-1",
  "match-highlight-2",
  "match-highlight-3",
  "match-highlight-4",
  "match-highlight-5",
  "match-highlight-6",
];

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
  matchIndex: number;
}

interface MatchOverlayProps {
  segments: HighlightSegment[];
}

export function MatchOverlay({ segments }: MatchOverlayProps) {
  const { hoverState, setHoveredMatchIndex, setSelectedMatchIndex } =
    useHoverSync();

  const handleMouseEnter = useCallback(
    (matchIndex: number) => {
      setHoveredMatchIndex(matchIndex);
    },
    [setHoveredMatchIndex]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredMatchIndex(null);
  }, [setHoveredMatchIndex]);

  const handleClick = useCallback(
    (matchIndex: number) => {
      setSelectedMatchIndex(
        hoverState.selectedMatchIndex === matchIndex ? null : matchIndex
      );
    },
    [hoverState.selectedMatchIndex, setSelectedMatchIndex]
  );

  return (
    <div
      className="absolute inset-0 p-4 pointer-events-none font-mono text-sm whitespace-pre-wrap break-words overflow-hidden"
      aria-hidden="true"
    >
      {segments.map((segment, index) => {
        if (!segment.isMatch) {
          return <span key={index}>{segment.text}</span>;
        }

        const colorIndex = segment.matchIndex % HIGHLIGHT_CLASSES.length;
        const isHovered =
          hoverState.hoveredMatchIndex === segment.matchIndex;
        const isSelected =
          hoverState.selectedMatchIndex === segment.matchIndex;

        return (
          <span
            key={index}
            className={cn(
              HIGHLIGHT_CLASSES[colorIndex],
              isHovered && `${HIGHLIGHT_CLASSES[colorIndex]}-active`,
              isSelected && `${HIGHLIGHT_CLASSES[colorIndex]}-selected`,
              "rounded-sm transition-colors duration-150 pointer-events-auto cursor-pointer"
            )}
            onMouseEnter={() => handleMouseEnter(segment.matchIndex)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(segment.matchIndex)}
          >
            {segment.text}
          </span>
        );
      })}
    </div>
  );
}
