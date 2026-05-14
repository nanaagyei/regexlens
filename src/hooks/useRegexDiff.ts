import { useMemo } from "react";
import {
  computeSyntaxDiff,
  computeFlagDiff,
  computeStructuralDiff,
  computeExplanationDiff,
  computeWarningDiff,
  synthesizeBehaviorSummary,
} from "@/lib/diff";
import { parseRegexCached } from "@/lib/regex/parseCache";
import { generateExplanation } from "@/lib/explain/explain";
import { analyzeWarnings } from "@/lib/warnings/heuristics";
import type {
  RegexDiff,
  ParseResult,
  ExplanationResult,
  WarningsResult,
  MatchResult,
} from "@/types";

const EMPTY_MATCH_RESULT: MatchResult = {
  matches: [],
  spans: [],
  truncated: false,
  sampleTruncated: false,
  matchLimitReached: false,
  totalCount: 0,
};

/**
 * Compute the diff between old (comparison) and new (current) regex patterns.
 *
 * Includes character-level syntax diff, flag diff, structural AST diff,
 * explanation step diff, warning diff, and synthesized behavior summaries.
 * Structural and explanation diffs require both patterns to parse successfully —
 * they degrade to null on parse failure. Warning diff works regardless of parse success.
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
  newWarnings: WarningsResult,
): RegexDiff | null {
  return useMemo(() => {
    if (oldPattern === "" && oldFlags === "") return null;

    const syntax = computeSyntaxDiff(oldPattern, newPattern);
    const flags = computeFlagDiff(oldFlags, newFlags);

    // Parse comparison pattern for structural + explanation diffs
    const oldParseResult = parseRegexCached(oldPattern, oldFlags);

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

    // Warning diff — works even when structural diff fails
    const oldWarnings = analyzeWarnings(
      oldPattern,
      oldFlags,
      oldParseResult,
      EMPTY_MATCH_RESULT,
    );
    const warnings = computeWarningDiff(
      oldWarnings.warnings,
      newWarnings.warnings,
    );

    // Build partial diff, then synthesize behavior summary
    const partialDiff: RegexDiff = {
      syntax,
      flags,
      structural,
      explanation,
      warnings,
      behaviorSummary: { summaries: [], hasSummaries: false },
    };

    const behaviorSummary = synthesizeBehaviorSummary(partialDiff);

    return { ...partialDiff, behaviorSummary };
  }, [
    oldPattern,
    oldFlags,
    newPattern,
    newFlags,
    newParseResult,
    newExplanation,
    newWarnings,
  ]);
}
