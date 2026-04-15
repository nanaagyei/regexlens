import { diffChars } from "diff";
import type { DiffOp, SyntaxDiff } from "@/types";

/**
 * Compute a character-level diff between two regex pattern strings.
 *
 * Operates on raw strings — does not require valid regex syntax on either side.
 */
export function computeSyntaxDiff(
  oldPattern: string,
  newPattern: string,
): SyntaxDiff {
  const changes = diffChars(oldPattern, newPattern);

  const ops: DiffOp[] = changes.map((change) => {
    if (change.added) return { kind: "insert" as const, value: change.value };
    if (change.removed) return { kind: "delete" as const, value: change.value };
    return { kind: "equal" as const, value: change.value };
  });

  const hasChanges = ops.some((op) => op.kind !== "equal");

  return { ops, hasChanges };
}
