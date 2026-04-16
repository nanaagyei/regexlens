import { useMemo } from "react";
import {
  computeSyntaxDiff,
  computeFlagDiff,
  computeStructuralDiff,
  computeExplanationDiff,
} from "@/lib/diff";
import { parseRegex } from "@/lib/regex/parse";
import { generateExplanation } from "@/lib/explain/explain";
import type { RegexDiff, ParseResult, ExplanationResult } from "@/types";

/**
 * Compute the diff between old (comparison) and new (current) regex patterns.
 *
 * Includes character-level syntax diff, flag diff, structural AST diff,
 * and explanation step diff. Structural and explanation diffs require both
 * patterns to parse successfully — they degrade to null on parse failure.
 *
 * Returns null when no comparison base is provided (both oldPattern and oldFlags empty).
 */
export function useRegexDiff(
  oldPattern: string,
  oldFlags: string,
  newPattern: string,
  newFlags: string,
  newParseResult: ParseResult,
  newExplanation: ExplanationResult,
): RegexDiff | null {
  return useMemo(() => {
    if (oldPattern === "" && oldFlags === "") return null;

    const syntax = computeSyntaxDiff(oldPattern, newPattern);
    const flags = computeFlagDiff(oldFlags, newFlags);

    // Parse comparison pattern for structural + explanation diffs
    const oldParseResult = parseRegex(oldPattern, oldFlags);

    let structural: RegexDiff["structural"] = null;
    let explanation: RegexDiff["explanation"] = null;

    if (oldParseResult.ok && newParseResult.ok) {
      structural = computeStructuralDiff(
        oldParseResult.normalized,
        newParseResult.normalized,
      );

      const oldExplanation = generateExplanation(oldParseResult);
      explanation = computeExplanationDiff(
        oldExplanation.steps,
        newExplanation.steps,
      );
    }

    return { syntax, flags, structural, explanation };
  }, [oldPattern, oldFlags, newPattern, newFlags, newParseResult, newExplanation]);
}
