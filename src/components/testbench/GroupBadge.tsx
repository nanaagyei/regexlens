"use client";

import { Badge } from "@/components/ui/badge";

interface GroupBadgeProps {
  groupIndex: number;
  name?: string;
  text: string;
}

const BADGE_VARIANTS = [
  "match1",
  "match2",
  "match3",
  "match4",
  "match5",
  "match6",
] as const;

export function GroupBadge({ groupIndex, name, text }: GroupBadgeProps) {
  const colorIndex = groupIndex % BADGE_VARIANTS.length;
  const badgeVariant = BADGE_VARIANTS[colorIndex];

  return (
    <Badge variant={badgeVariant} className="gap-1 font-mono text-xs">
      {name ? name : `$${groupIndex}`}
      {text && (
        <>
          <span className="opacity-50">=</span>
          <span className="max-w-[100px] truncate">{text}</span>
        </>
      )}
    </Badge>
  );
}
