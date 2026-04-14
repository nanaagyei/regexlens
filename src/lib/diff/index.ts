export { computeSyntaxDiff } from "./syntaxDiff";
export { computeFlagDiff, FLAG_METADATA } from "./flagDiff";

import { computeSyntaxDiff } from "./syntaxDiff";
import { computeFlagDiff } from "./flagDiff";
import type { RegexDiff } from "@/types";

/**
 * Compute a full regex diff covering syntax and flag changes.
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
  };
}
