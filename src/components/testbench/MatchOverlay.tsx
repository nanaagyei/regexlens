"use client";

import { useCallback } from "react";
import { useHoverSelector } from "@/hooks/useHoverSync";
import {
  setHoveredMatchIndex,
  setSelectedMatchIndex,
  getSnapshot,
} from "@/lib/stores/hoverStore";
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
  return (
    <div
      className="absolute inset-0 p-4 pointer-events-none font-mono text-sm whitespace-pre-wrap break-words overflow-hidden"
      aria-hidden="true"
    >
      {segments.map((segment, index) => {
        if (!segment.isMatch) {
          return <span key={index}>{segment.text}</span>;
        }
        return (
          <MatchHighlightSpan key={index} segment={segment} />
        );
      })}
    </div>
  );
}

function MatchHighlightSpan({ segment }: { segment: HighlightSegment }) {
  const matchIndex = segment.matchIndex;
  const isHovered = useHoverSelector((s) => s.hoveredMatchIndex === matchIndex);
  const isSelected = useHoverSelector((s) => s.selectedMatchIndex === matchIndex);

  const colorIndex = matchIndex % HIGHLIGHT_CLASSES.length;

  const handleMouseEnter = useCallback(() => {
    setHoveredMatchIndex(matchIndex);
  }, [matchIndex]);

  const handleMouseLeave = useCallback(() => {
    setHoveredMatchIndex(null);
  }, []);

  const handleClick = useCallback(() => {
    const sel = getSnapshot().selectedMatchIndex;
    setSelectedMatchIndex(sel === matchIndex ? null : matchIndex);
  }, [matchIndex]);

  return (
    <span
      className={cn(
        HIGHLIGHT_CLASSES[colorIndex],
        isHovered && `${HIGHLIGHT_CLASSES[colorIndex]}-active`,
        isSelected && `${HIGHLIGHT_CLASSES[colorIndex]}-selected`,
        "rounded-sm transition-colors duration-150 pointer-events-auto cursor-pointer"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {segment.text}
    </span>
  );
}
