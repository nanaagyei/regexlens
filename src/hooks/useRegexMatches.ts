"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "./useDebounce";
import { matchWithTimeout } from "@/lib/regex/matchWithTimeout";
import { MatchResult, REGEX_CONFIG } from "@/types";

const EMPTY_RESULT: MatchResult = {
  matches: [],
  spans: [],
  truncated: false,
  sampleTruncated: false,
  matchLimitReached: false,
  totalCount: 0,
};

/** Fixture default timeout for performance_safety suites */
export const FIXTURE_TIMEOUT_MS = 75;

/**
 * Compute regex matches with debouncing and timeout protection
 * Only runs if the pattern parsed successfully
 * @param fixtureTimeoutMs - When set (e.g. for performance_safety suites), use this timeout instead of default
 */
export function useRegexMatches(
  pattern: string,
  flags: string,
  text: string,
  parseOk: boolean,
  debounceMs: number = REGEX_CONFIG.DEBOUNCE_MS,
  fixtureTimeoutMs?: number
): MatchResult {
  const debouncedPattern = useDebounce(pattern, debounceMs);
  const debouncedFlags = useDebounce(flags, debounceMs);
  const debouncedText = useDebounce(text, debounceMs);

  const [matchResult, setMatchResult] = useState<MatchResult>(EMPTY_RESULT);

  useEffect(() => {
    if (!parseOk || !pattern || !debouncedPattern) {
      setMatchResult(EMPTY_RESULT);
      return;
    }

    let cancelled = false;

    const timeout = fixtureTimeoutMs ?? REGEX_CONFIG.MATCH_TIMEOUT_MS;
    void matchWithTimeout(
      debouncedPattern,
      debouncedFlags,
      debouncedText,
      timeout
    ).then((result) => {
      if (!cancelled) {
        setMatchResult(result);
      }
    }).catch(() => {
      if (!cancelled) {
        setMatchResult(EMPTY_RESULT);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pattern, debouncedPattern, debouncedFlags, debouncedText, parseOk, fixtureTimeoutMs]);

  return matchResult;
}
