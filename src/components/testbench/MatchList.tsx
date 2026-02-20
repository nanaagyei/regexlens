"use client";

import { MatchResult, Match } from "@/types";
import { useHoverSync } from "@/hooks/useHoverSync";
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
  const { hoverState, setHoveredMatchIndex } = useHoverSync();

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
        <MatchItem
          key={index}
          match={match}
          index={index}
          isHovered={hoverState.hoveredMatchIndex === index}
          onMouseEnter={() => setHoveredMatchIndex(index)}
          onMouseLeave={() => setHoveredMatchIndex(null)}
          onClick={() => onMatchClick?.(index, match.full.start, match.full.end)}
        />
      ))}
      {matches.truncated && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Showing first {matches.matches.length} of {matches.totalCount} matches
        </p>
      )}
    </div>
  );
}

interface MatchItemProps {
  match: Match;
  index: number;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick?: () => void;
}

function MatchItem({
  match,
  index,
  isHovered,
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
        "p-2 rounded-md border border-border transition-colors duration-150",
        isHovered ? "bg-accent" : "bg-card hover:bg-accent/50",
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
