import { parseRegex } from "@/lib/regex/parse";
import { generateExplanation } from "@/lib/explain/explain";
import { analyzeWarnings } from "@/lib/warnings/heuristics";
import type { ExplanationStep, Warning, MatchResult } from "@/types";

export interface VersionRow {
  id: string;
  pattern: string;
  flags: string;
  notes: string | null;
  created_at: Date;
}

const EMPTY_MATCH_RESULT: MatchResult = {
  matches: [],
  spans: [],
  truncated: false,
  totalCount: 0,
};

export interface ExplanationDiff {
  addedSteps: { label: string; kind: string; detail?: string }[];
  removedSteps: { label: string; kind: string; detail?: string }[];
}

export interface WarningsDiff {
  added: { id: string; title: string; message: string; severity: string }[];
  removed: { id: string; title: string; message: string; severity: string }[];
}

export interface SnippetDiff {
  patternChanged: boolean;
  flagsChanged: boolean;
  patternDiff: { added: string[]; removed: string[] };
  flagsDiff: { added: string[]; removed: string[] };
  explanationDiff?: ExplanationDiff;
  warningsDiff?: WarningsDiff;
}

function stepFingerprint(s: ExplanationStep): string {
  return `${s.label}|${s.kind}|${s.depth}`;
}

function warningFingerprint(w: Warning): string {
  return `${w.id}|${w.title}`;
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

  // Explanation diff
  const fromParse = parseRegex(from.pattern, from.flags);
  const toParse = parseRegex(to.pattern, to.flags);
  const fromSteps = fromParse.ok ? generateExplanation(fromParse).steps : [];
  const toSteps = toParse.ok ? generateExplanation(toParse).steps : [];

  const fromStepFps = new Set(fromSteps.map(stepFingerprint));
  const toStepFps = new Set(toSteps.map(stepFingerprint));

  const addedSteps = toSteps
    .filter((s) => !fromStepFps.has(stepFingerprint(s)))
    .map((s) => ({ label: s.label, kind: s.kind, detail: s.detail }));
  const removedSteps = fromSteps
    .filter((s) => !toStepFps.has(stepFingerprint(s)))
    .map((s) => ({ label: s.label, kind: s.kind, detail: s.detail }));

  // Warnings diff
  const fromWarnings = analyzeWarnings(
    from.pattern,
    from.flags,
    fromParse,
    EMPTY_MATCH_RESULT
  ).warnings;
  const toWarnings = analyzeWarnings(
    to.pattern,
    to.flags,
    toParse,
    EMPTY_MATCH_RESULT
  ).warnings;

  const fromWarningFps = new Set(fromWarnings.map(warningFingerprint));
  const toWarningFps = new Set(toWarnings.map(warningFingerprint));

  const warningsAdded = toWarnings
    .filter((w) => !fromWarningFps.has(warningFingerprint(w)))
    .map((w) => ({ id: w.id, title: w.title, message: w.message, severity: w.severity }));
  const warningsRemoved = fromWarnings
    .filter((w) => !toWarningFps.has(warningFingerprint(w)))
    .map((w) => ({ id: w.id, title: w.title, message: w.message, severity: w.severity }));

  return {
    patternChanged,
    flagsChanged,
    patternDiff,
    flagsDiff,
    explanationDiff: {
      addedSteps,
      removedSteps,
    },
    warningsDiff: {
      added: warningsAdded,
      removed: warningsRemoved,
    },
  };
}
