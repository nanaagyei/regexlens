"use client";

import { useMemo } from "react";
import { analyzeFailure } from "@/lib/failure/analyzeFailure";
import type { FailureDiagnosis, ParseResult, MatchResult } from "@/types";

/**
 * Analyze why a regex failed to match input text.
 * Returns null when there is no failure to show (empty pattern, match success, etc.)
 */
export function useFailureAnalysis(
  pattern: string,
  flags: string,
  text: string,
  parseResult: ParseResult,
  matchResult: MatchResult,
): FailureDiagnosis | null {
  return useMemo(() => {
    if (!pattern || !text) return null;
    const result = analyzeFailure(pattern, flags, text, parseResult, matchResult);
    if (result.didMatch) return null;
    return result;
  }, [pattern, flags, text, parseResult, matchResult]);
}
