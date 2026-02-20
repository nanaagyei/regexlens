/**
 * Compute diff between two snippet versions
 */

export interface VersionRow {
  id: string;
  pattern: string;
  flags: string;
  notes: string | null;
  created_at: Date;
}

export interface SnippetDiff {
  patternChanged: boolean;
  flagsChanged: boolean;
  patternDiff: { added: string[]; removed: string[] };
  flagsDiff: { added: string[]; removed: string[] };
}

export function computeDiff(
  from: VersionRow,
  to: VersionRow
): SnippetDiff {
  const patternChanged = from.pattern !== to.pattern;
  const flagsChanged = from.flags !== to.flags;

  const patternDiff = { added: [] as string[], removed: [] as string[] };
  if (patternChanged) {
    const fromChars = new Set(from.pattern.split(""));
    const toChars = new Set(to.pattern.split(""));
    for (const char of toChars) {
      if (!fromChars.has(char)) patternDiff.added.push(char);
    }
    for (const char of fromChars) {
      if (!toChars.has(char)) patternDiff.removed.push(char);
    }
  }

  const flagsDiff = { added: [] as string[], removed: [] as string[] };
  if (flagsChanged) {
    const fromFlags = new Set(from.flags.split(""));
    const toFlags = new Set(to.flags.split(""));
    for (const flag of toFlags) {
      if (!fromFlags.has(flag)) flagsDiff.added.push(flag);
    }
    for (const flag of fromFlags) {
      if (!toFlags.has(flag)) flagsDiff.removed.push(flag);
    }
  }

  return {
    patternChanged,
    flagsChanged,
    patternDiff,
    flagsDiff,
  };
}
