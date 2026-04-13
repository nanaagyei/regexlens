/**
 * Warning types for regex analysis heuristics
 */

import { Range } from "./regex";

export type WarningSeverity = "info" | "warn" | "danger";

export type WarningCategory =
  | "performance"
  | "correctness"
  | "readability"
  | "maintainability";

export interface Warning {
  id: string;
  severity: WarningSeverity;
  category: WarningCategory;
  title: string;
  message: string;
  hint?: string;
  range?: Range;
  score: number; // 0-100 for sorting
}

export interface WarningsResult {
  warnings: Warning[];
  riskScore: number; // Aggregate 0-100
}

// Warning IDs for consistent identification
export const WARNING_IDS = {
  NESTED_QUANTIFIERS: "nested-quantifiers",
  AMBIGUOUS_DOT_STAR: "ambiguous-dot-star",
  ALTERNATION_IN_REPETITION: "alternation-in-repetition",
  MULTILINE_ANCHORS: "multiline-anchors",
  DOTALL_DOT: "dotall-dot",
  UNESCAPED_DOT: "unescaped-dot",
  PIPE_IN_CHARCLASS: "pipe-in-charclass",
  EMPTY_ALTERNATIVE: "empty-alternative",
  EXCESSIVE_PATTERN_LENGTH: "excessive-pattern-length",
  EXCESSIVE_MATCHES: "excessive-matches",
} as const;

// Severity score ranges
export const SEVERITY_SCORES = {
  danger: { min: 80, max: 100 },
  warn: { min: 40, max: 79 },
  info: { min: 10, max: 39 },
} as const;

// Category display labels
export const CATEGORY_LABELS: Record<WarningCategory, string> = {
  performance: "Performance",
  correctness: "Correctness",
  readability: "Readability",
  maintainability: "Maintainability",
} as const;
