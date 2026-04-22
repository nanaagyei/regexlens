export { computeSyntaxDiff } from "./syntaxDiff";
export { computeFlagDiff, FLAG_METADATA } from "./flagDiff";
export { computeStructuralDiff } from "./structuralDiff";
export { computeExplanationDiff } from "./explanationDiff";
export { computeWarningDiff } from "./warningDiff";
export { synthesizeBehaviorSummary } from "./behaviorSummary";

import { computeSyntaxDiff } from "./syntaxDiff";
import { computeFlagDiff } from "./flagDiff";
import type { RegexDiff } from "@/types";

/**
 * Compute a basic regex diff covering syntax and flag changes.
 * Structural, explanation, warning, and behavior diffs are orchestrated by the hook.
 */
export function computeRegexDiff(
  oldPattern: string,
  oldFlags: string,
  newPattern: string,
  newFlags: string,
): RegexDiff {
  return {
    syntax: computeSyntaxDiff(oldPattern, newPattern),
    flags: computeFlagDiff(oldFlags, newFlags),
    structural: null,
    explanation: null,
    warnings: null,
    behaviorSummary: { summaries: [], hasSummaries: false },
  };
}
