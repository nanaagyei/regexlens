import { useMemo } from "react";
import { computeRegexDiff } from "@/lib/diff";
import type { RegexDiff } from "@/types";

/**
 * Compute the diff between old (comparison) and new (current) regex patterns.
 *
 * Returns null when no comparison base is provided (both oldPattern and oldFlags empty).
 */
export function useRegexDiff(
  oldPattern: string,
  oldFlags: string,
  newPattern: string,
  newFlags: string,
): RegexDiff | null {
  return useMemo(() => {
    if (oldPattern === "" && oldFlags === "") return null;
    return computeRegexDiff(oldPattern, oldFlags, newPattern, newFlags);
  }, [oldPattern, oldFlags, newPattern, newFlags]);
}
