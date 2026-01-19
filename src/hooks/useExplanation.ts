"use client";

import { useMemo } from "react";
import { generateExplanation } from "@/lib/explain/explain";
import { ExplanationResult, ParseResult } from "@/types";

const EMPTY_RESULT: ExplanationResult = {
  steps: [],
};

/**
 * Generate explanation steps from a parse result
 */
export function useExplanation(parseResult: ParseResult): ExplanationResult {
  const explanation = useMemo(() => {
    if (!parseResult.ok) {
      return EMPTY_RESULT;
    }

    return generateExplanation(parseResult);
  }, [parseResult]);

  return explanation;
}
