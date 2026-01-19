"use client";

import { useMemo } from "react";
import { analyzeWarnings } from "@/lib/warnings/heuristics";
import { WarningsResult, ParseResult, MatchResult } from "@/types";

const EMPTY_RESULT: WarningsResult = {
  warnings: [],
  riskScore: 0,
};

/**
 * Analyze a regex pattern for potential issues
 */
export function useWarnings(
  pattern: string,
  flags: string,
  parseResult: ParseResult,
  matchResult: MatchResult
): WarningsResult {
  const warnings = useMemo(() => {
    if (!pattern) {
      return EMPTY_RESULT;
    }

    return analyzeWarnings(pattern, flags, parseResult, matchResult);
  }, [pattern, flags, parseResult, matchResult]);

  return warnings;
}
