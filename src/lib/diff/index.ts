export { computeSyntaxDiff } from "./syntaxDiff";
export { computeFlagDiff, FLAG_METADATA } from "./flagDiff";
export { computeStructuralDiff } from "./structuralDiff";
export { computeExplanationDiff } from "./explanationDiff";

import { computeSyntaxDiff } from "./syntaxDiff";
import { computeFlagDiff } from "./flagDiff";
import type { RegexDiff } from "@/types";

/**
 * Compute a basic regex diff covering syntax and flag changes.
 * Structural and explanation diffs are orchestrated by the hook.
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
  };
}
