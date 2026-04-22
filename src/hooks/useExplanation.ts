"use client";

import { useMemo } from "react";
import { generateExplanation } from "@/lib/explain/explain";
import { ExplanationResult, ExplanationMode, ParseResult } from "@/types";

const EMPTY_RESULT: ExplanationResult = {
  steps: [],
};

/**
 * Generate explanation steps from a parse result.
 *
 * @param parseResult - The parsed regex AST
 * @param mode - "simple" (human-readable) or "technical" (token-aware)
 */
export function useExplanation(
  parseResult: ParseResult,
  mode: ExplanationMode = "simple"
): ExplanationResult {
  const explanation = useMemo(() => {
    if (!parseResult.ok) {
      return EMPTY_RESULT;
    }

    return generateExplanation(parseResult, mode);
  }, [parseResult, mode]);

  return explanation;
}
