import type { FlagChange, FlagDiff } from "@/types";

interface FlagMeta {
  label: string;
  description: string;
}

const FLAG_METADATA: Record<string, FlagMeta> = {
  g: { label: "Global", description: "Match all occurrences, not just the first" },
  i: { label: "Case Insensitive", description: "Case-insensitive matching" },
  m: { label: "Multiline", description: "^ and $ match start/end of each line" },
  s: { label: "DotAll", description: "Dot (.) matches newlines too" },
  u: { label: "Unicode", description: "Enable full Unicode support" },
  y: { label: "Sticky", description: "Match only at lastIndex position" },
  d: { label: "Indices", description: "Generate start/end indices for matches" },
  v: { label: "Unicode Sets", description: "Enable set notation in character classes" },
};

/**
 * Compute the difference between two sets of regex flags.
 *
 * Returns human-readable change entries for each flag that was added or removed.
 */
export function computeFlagDiff(
  oldFlags: string,
  newFlags: string,
): FlagDiff {
  const oldSet = new Set(oldFlags.split(""));
  const newSet = new Set(newFlags.split(""));

  const changes: FlagChange[] = [];

  // Flags removed (present in old, absent in new)
  for (const flag of oldSet) {
    if (!newSet.has(flag)) {
      const meta = FLAG_METADATA[flag];
      changes.push({
        flag,
        label: meta?.label ?? flag.toUpperCase(),
        description: meta?.description ?? `Flag "${flag}"`,
        changeType: "removed",
      });
    }
  }

  // Flags added (present in new, absent in old)
  for (const flag of newSet) {
    if (!oldSet.has(flag)) {
      const meta = FLAG_METADATA[flag];
      changes.push({
        flag,
        label: meta?.label ?? flag.toUpperCase(),
        description: meta?.description ?? `Flag "${flag}"`,
        changeType: "added",
      });
    }
  }

  return { changes, hasChanges: changes.length > 0 };
}

export { FLAG_METADATA };
