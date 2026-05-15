"use client";

import { useCallback } from "react";
import { MatchResult, Match, REGEX_CONFIG } from "@/types";
import { useHoverSelector } from "@/hooks/useHoverSync";
import {
  setHoveredMatchIndex,
  setSelectedMatchIndex,
  getSnapshot,
} from "@/lib/stores/hoverStore";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MatchListProps {
  matches: MatchResult;
  onMatchClick?: (index: number, start: number, end: number) => void;
}

const BADGE_VARIANTS = [
  "match1",
  "match2",
  "match3",
  "match4",
  "match5",
  "match6",
] as const;

export function MatchList({ matches, onMatchClick }: MatchListProps) {
  if (matches.error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-sm text-amber-600 dark:text-amber-500 text-center">
          {matches.error}
        </p>
      </div>
    );
  }

  if (matches.matches.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4">
        <p>No matches to display</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-2">
      {matches.matches.map((match, index) => (
        <MatchListRow
          key={index}
          match={match}
          index={index}
          onMatchClick={onMatchClick}
        />
      ))}
      {matches.truncated && (
        <TruncationFooter matches={matches} />
      )}
    </div>
  );
}

function TruncationFooter({ matches }: { matches: MatchResult }) {
  const sample = matches.sampleTruncated === true;
  const cap = matches.matchLimitReached === true;
  const parts: string[] = [];
  if (sample) {
    parts.push(
      `Sample text exceeds ${REGEX_CONFIG.MAX_TEXT_LENGTH.toLocaleString()} characters; only the first ${REGEX_CONFIG.MAX_TEXT_LENGTH.toLocaleString()} are used for matching.`,
    );
  }
  if (cap) {
    parts.push(
      `Showing the first ${matches.matches.length.toLocaleString()} of ${matches.totalCount.toLocaleString()} matches (list cap ${REGEX_CONFIG.MAX_MATCHES.toLocaleString()}).`,
    );
  }
  if (parts.length === 0) {
    parts.push(
      `Showing first ${matches.matches.length.toLocaleString()} of ${matches.totalCount.toLocaleString()} matches.`,
    );
  }
  return (
    <p className="text-xs text-muted-foreground text-center py-2">
      {parts.join(" ")}
    </p>
  );
}

interface MatchListRowProps {
  match: Match;
  index: number;
  onMatchClick?: (index: number, start: number, end: number) => void;
}

function MatchListRow({ match, index, onMatchClick }: MatchListRowProps) {
  const isHovered = useHoverSelector((s) => s.hoveredMatchIndex === index);
  const isSelected = useHoverSelector((s) => s.selectedMatchIndex === index);

  const onMouseEnter = useCallback(() => setHoveredMatchIndex(index), [index]);
  const onMouseLeave = useCallback(() => setHoveredMatchIndex(null), []);

  const onClick = useCallback(() => {
    const sel = getSnapshot().selectedMatchIndex;
    setSelectedMatchIndex(sel === index ? null : index);
    onMatchClick?.(index, match.full.start, match.full.end);
  }, [index, match.full.start, match.full.end, onMatchClick]);

  return (
    <MatchItem
      match={match}
      index={index}
      isHovered={isHovered}
      isSelected={isSelected}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    />
  );
}

interface MatchItemProps {
  match: Match;
  index: number;
  isHovered: boolean;
  isSelected: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick?: () => void;
}

function MatchItem({
  match,
  index,
  isHovered,
  isSelected,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: MatchItemProps) {
  const colorIndex = index % BADGE_VARIANTS.length;
  const badgeVariant = BADGE_VARIANTS[colorIndex];

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "p-2 rounded-md border transition-colors duration-150",
        isSelected
          ? "border-primary ring-2 ring-primary/50 bg-accent"
          : isHovered
            ? "border-border bg-accent"
            : "border-border bg-card hover:bg-accent/50",
        onClick && "cursor-pointer"
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      <div className="flex items-center gap-2 mb-1">
        <Badge variant={badgeVariant} className="text-[10px]">
          Match {index + 1}
        </Badge>
        <span className="text-xs text-muted-foreground">
          pos {match.full.start}–{match.full.end}
        </span>
      </div>

      <div className="font-mono text-sm break-all">
        <span className="text-foreground">&quot;{match.full.text}&quot;</span>
      </div>

      {match.groups.length > 0 && (
        <div className="mt-2 space-y-1">
          {match.groups.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span className="shrink-0">
                {group.name ? (
                  <span className="text-primary">{group.name}</span>
                ) : (
                  `Group ${group.groupIndex}`
                )}
                :
              </span>
              <span className="font-mono truncate">
                {group.text ? `"${group.text}"` : "(empty)"}
              </span>
            </div>
          ))}
        </div>
      )}

      {match.namedGroups && Object.keys(match.namedGroups).length > 0 && (
        <div className="mt-2 pt-2 border-t border-border space-y-1">
          <span className="text-xs text-muted-foreground">Named groups:</span>
          {Object.entries(match.namedGroups).map(([name, group]) => (
            <div
              key={name}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span className="text-primary shrink-0">{name}:</span>
              <span className="font-mono truncate">
                {group.text ? `"${group.text}"` : "(empty)"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
