"use client";

import { useMemo } from "react";
import { useDebounce } from "./useDebounce";
import { computeMatches } from "@/lib/regex/match";
import { MatchResult, REGEX_CONFIG } from "@/types";

const EMPTY_RESULT: MatchResult = {
  matches: [],
  spans: [],
  truncated: false,
  totalCount: 0,
};

/**
 * Compute regex matches with debouncing
 * Only runs if the pattern parsed successfully
 */
export function useRegexMatches(
  pattern: string,
  flags: string,
  text: string,
  parseOk: boolean,
  debounceMs: number = REGEX_CONFIG.DEBOUNCE_MS
): MatchResult {
  // Debounce inputs
  const debouncedPattern = useDebounce(pattern, debounceMs);
  const debouncedFlags = useDebounce(flags, debounceMs);
  const debouncedText = useDebounce(text, debounceMs);

  // Compute matches
  const matchResult = useMemo(() => {
    if (!parseOk || !debouncedPattern) {
      return EMPTY_RESULT;
    }

    return computeMatches(debouncedPattern, debouncedFlags, debouncedText);
  }, [debouncedPattern, debouncedFlags, debouncedText, parseOk]);

  return matchResult;
}
