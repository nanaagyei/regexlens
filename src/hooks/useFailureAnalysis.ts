"use client";

import { useMemo } from "react";
import { useDebounce } from "./useDebounce";
import { analyzeFailure } from "@/lib/failure/analyzeFailure";
import type { FailureDiagnosis, ParseResult, MatchResult } from "@/types";
import { REGEX_CONFIG } from "@/types";

const HEAVY_MS = REGEX_CONFIG.HEAVY_ANALYSIS_DEBOUNCE_MS;

/**
 * Analyze why a regex failed to match input text.
 * Returns null when there is no failure to show (empty pattern, match success, etc.)
 * Debounces inputs so failure simulation stays off the hot typing path.
 */
export function useFailureAnalysis(
  pattern: string,
  flags: string,
  text: string,
  parseResult: ParseResult,
  matchResult: MatchResult,
): FailureDiagnosis | null {
  const debouncedPattern = useDebounce(pattern, HEAVY_MS);
  const debouncedFlags = useDebounce(flags, HEAVY_MS);
  const debouncedText = useDebounce(text, HEAVY_MS);
  const debouncedParse = useDebounce(parseResult, HEAVY_MS);
  const debouncedMatch = useDebounce(matchResult, HEAVY_MS);

  return useMemo(() => {
    if (!debouncedPattern || !debouncedText) return null;
    const result = analyzeFailure(
      debouncedPattern,
      debouncedFlags,
      debouncedText,
      debouncedParse,
      debouncedMatch,
    );
    if (result.didMatch) return null;
    return result;
  }, [
    debouncedPattern,
    debouncedFlags,
    debouncedText,
    debouncedParse,
    debouncedMatch,
  ]);
}
