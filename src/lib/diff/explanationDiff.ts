import type { ExplanationStep } from "@/types/explain";
import type { ExplanationDiff, ExplanationChange } from "@/types/diff";

/**
 * Diff two arrays of explanation steps using LCS on composite keys.
 *
 * Each step's identity is derived from `kind:label` (not the positional `id`).
 * The LCS algorithm finds the longest common subsequence, then marks:
 * - Steps in LCS with unchanged labels/details → equal
 * - Steps in LCS with changed details → modified
 * - Steps only in old → removed
 * - Steps only in new → added
 */
export function computeExplanationDiff(
  oldSteps: ExplanationStep[],
  newSteps: ExplanationStep[],
): ExplanationDiff {
  const oldKeys = oldSteps.map(compositeKey);
  const newKeys = newSteps.map(compositeKey);

  const lcs = computeLCS(oldKeys, newKeys);
  const changes = buildChanges(oldSteps, newSteps, oldKeys, newKeys, lcs);
  const hasChanges = changes.some((c) => c.kind !== "equal");

  return { changes, hasChanges };
}

/** Composite key for matching: kind + normalized label. */
function compositeKey(step: ExplanationStep): string {
  return `${step.kind}:${step.label.trim().toLowerCase()}`;
}

/**
 * Standard LCS using dynamic programming.
 * Returns the indices of matched pairs: [oldIndex, newIndex][].
 */
function computeLCS(
  oldKeys: string[],
  newKeys: string[],
): Array<[number, number]> {
  const m = oldKeys.length;
  const n = newKeys.length;

  // Build DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldKeys[i - 1] === newKeys[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find matched pairs
  const pairs: Array<[number, number]> = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (oldKeys[i - 1] === newKeys[j - 1]) {
      pairs.push([i - 1, j - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  pairs.reverse();
  return pairs;
}

/**
 * Build the change list from the LCS alignment.
 */
function buildChanges(
  oldSteps: ExplanationStep[],
  newSteps: ExplanationStep[],
  _oldKeys: string[],
  _newKeys: string[],
  lcs: Array<[number, number]>,
): ExplanationChange[] {
  const changes: ExplanationChange[] = [];

  let oldIdx = 0;
  let newIdx = 0;

  for (const [lcsOld, lcsNew] of lcs) {
    // Emit removed steps before this LCS match
    while (oldIdx < lcsOld) {
      changes.push({
        kind: "removed",
        oldStep: oldSteps[oldIdx],
        labelChanged: false,
        detailChanged: false,
      });
      oldIdx++;
    }

    // Emit added steps before this LCS match
    while (newIdx < lcsNew) {
      changes.push({
        kind: "added",
        newStep: newSteps[newIdx],
        labelChanged: false,
        detailChanged: false,
      });
      newIdx++;
    }

    // Matched pair — check if modified
    const oldStep = oldSteps[oldIdx];
    const newStep = newSteps[newIdx];
    const labelChanged = oldStep.label !== newStep.label;
    const detailChanged = (oldStep.detail ?? "") !== (newStep.detail ?? "");

    if (labelChanged || detailChanged) {
      changes.push({
        kind: "modified",
        oldStep,
        newStep,
        labelChanged,
        detailChanged,
      });
    } else {
      changes.push({
        kind: "equal",
        oldStep,
        newStep,
        labelChanged: false,
        detailChanged: false,
      });
    }

    oldIdx++;
    newIdx++;
  }

  // Remaining old steps → removed
  while (oldIdx < oldSteps.length) {
    changes.push({
      kind: "removed",
      oldStep: oldSteps[oldIdx],
      labelChanged: false,
      detailChanged: false,
    });
    oldIdx++;
  }

  // Remaining new steps → added
  while (newIdx < newSteps.length) {
    changes.push({
      kind: "added",
      newStep: newSteps[newIdx],
      labelChanged: false,
      detailChanged: false,
    });
    newIdx++;
  }

  return changes;
}
