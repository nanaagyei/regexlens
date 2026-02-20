import { MatchResult, Match, MatchSpan, GroupSpan, REGEX_CONFIG } from "@/types";

/**
 * Compute matches for a regex pattern against test text
 */
export function computeMatches(
  pattern: string,
  flags: string,
  text: string
): MatchResult {
  const emptyResult: MatchResult = {
    matches: [],
    spans: [],
    truncated: false,
    totalCount: 0,
  };

  // Early exit conditions
  if (!pattern || !text) {
    return emptyResult;
  }

  // Enforce text length limit
  const limitedText = text.slice(0, REGEX_CONFIG.MAX_TEXT_LENGTH);
  const textTruncated = text.length > REGEX_CONFIG.MAX_TEXT_LENGTH;

  try {
    // Ensure global flag for findAll behavior
    const effectiveFlags = flags.includes("g") ? flags : flags + "g";
    const regex = new RegExp(pattern, effectiveFlags);

    const matches: Match[] = [];
    const spans: MatchSpan[] = [];
    let match: RegExpExecArray | null;
    let lastIndex = -1;
    let matchCount = 0;

    while ((match = regex.exec(limitedText)) !== null) {
      // Prevent infinite loop on zero-width matches
      if (regex.lastIndex === lastIndex) {
        regex.lastIndex++;
        continue;
      }
      lastIndex = regex.lastIndex;

      matchCount++;

      // Check match limit
      if (matches.length >= REGEX_CONFIG.MAX_MATCHES) {
        continue; // Keep counting but don't store
      }

      const matchIndex = matches.length;
      const fullMatch = match[0];
      const start = match.index;
      const end = start + fullMatch.length;

      // Build groups
      const groups: GroupSpan[] = [];
      for (let i = 1; i < match.length; i++) {
        const groupText = match[i];
        if (groupText !== undefined) {
          // Find group position in the full match
          const groupStart = findGroupStart(limitedText, start, groupText, match, i);
          groups.push({
            groupIndex: i,
            start: groupStart,
            end: groupStart + groupText.length,
            text: groupText,
          });
        } else {
          groups.push({
            groupIndex: i,
            start: -1,
            end: -1,
            text: "",
          });
        }
      }

      // Build named groups
      let namedGroups: Record<string, GroupSpan> | undefined;
      if (match.groups) {
        namedGroups = {};
        for (const [name, value] of Object.entries(match.groups)) {
          if (value !== undefined) {
            const groupStart = limitedText.indexOf(value, start);
            namedGroups[name] = {
              groupIndex: -1, // Named groups don't have numeric index in this map
              name,
              start: groupStart >= 0 ? groupStart : start,
              end: groupStart >= 0 ? groupStart + value.length : start,
              text: value,
            };
          }
        }
      }

      matches.push({
        index: matchIndex,
        full: {
          groupIndex: 0,
          start,
          end,
          text: fullMatch,
        },
        groups,
        namedGroups,
      });

      spans.push({
        start,
        end,
        matchIndex,
      });
    }

    return {
      matches,
      spans,
      truncated: matchCount > REGEX_CONFIG.MAX_MATCHES || textTruncated,
      totalCount: matchCount,
    };
  } catch (error) {
    console.warn("Match error:", error);
    return {
      ...emptyResult,
      error:
        error instanceof Error ? error.message : "Invalid pattern or matching error",
    };
  }
}

/**
 * Find the start position of a capture group in the text
 * This is a best-effort approximation since JS doesn't provide group indices
 */
function findGroupStart(
  text: string,
  matchStart: number,
  groupText: string,
  match: RegExpExecArray,
  groupIndex: number
): number {
  if (!groupText) return matchStart;

  // Try to find the group text within the match
  const matchText = match[0];
  const relativePos = matchText.indexOf(groupText);
  
  if (relativePos >= 0) {
    return matchStart + relativePos;
  }

  // Fallback to searching in the text from match start
  const absPos = text.indexOf(groupText, matchStart);
  if (absPos >= 0 && absPos < matchStart + matchText.length) {
    return absPos;
  }

  return matchStart;
}

/**
 * Run single exec at given lastIndex (for sticky y flag tests).
 * Used when Worker is unavailable; prefer worker path for fixture runs.
 */
export function computeSingleExecWithLastIndex(
  pattern: string,
  flags: string,
  text: string,
  initialLastIndex: number
): MatchResult {
  const emptyResult: MatchResult = {
    matches: [],
    spans: [],
    truncated: false,
    totalCount: 0,
  };
  try {
    const regex = new RegExp(pattern, flags);
    regex.lastIndex = initialLastIndex;
    const match = regex.exec(text);
    if (!match) return emptyResult;
    const start = match.index;
    const end = start + match[0].length;
    return {
      matches: [
        {
          index: 0,
          full: { groupIndex: 0, start, end, text: match[0] },
          groups: [],
        },
      ],
      spans: [{ start, end, matchIndex: 0 }],
      truncated: false,
      totalCount: 1,
    };
  } catch {
    return { ...emptyResult, error: "Invalid pattern" };
  }
}

/**
 * Get a color class for a match index (cycles through available colors)
 */
export function getMatchColorClass(matchIndex: number, active = false): string {
  const colors = [
    "match-highlight-1",
    "match-highlight-2",
    "match-highlight-3",
    "match-highlight-4",
    "match-highlight-5",
    "match-highlight-6",
  ];
  const baseClass = colors[matchIndex % colors.length];
  return active ? `${baseClass}-active` : baseClass;
}
