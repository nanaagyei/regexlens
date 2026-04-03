/**
 * Core regex state and result types
 */

export type RegexFlavor = "javascript";

export type ExplanationMode = "simple" | "technical";

export interface Range {
  start: number;
  end: number;
}

export interface RegexState {
  pattern: string;
  flags: string;
  text: string;
  flavor: RegexFlavor;
  comparisonPattern: string;
  comparisonFlags: string;
  explanationMode: ExplanationMode;
  selectedTemplate: string | null;
}

import type { ComparableNode } from "./ast";

export type ParseResult =
  | { ok: true; ast: AstNode; normalizedPattern: string; normalized: ComparableNode }
  | { ok: false; errorMessage: string; errorRange?: Range };

export interface MatchSpan {
  start: number;
  end: number;
  matchIndex: number;
}

export interface GroupSpan {
  groupIndex: number;
  name?: string;
  start: number;
  end: number;
  text: string;
}

export interface Match {
  index: number;
  full: GroupSpan;
  groups: GroupSpan[];
  namedGroups?: Record<string, GroupSpan>;
}

export interface MatchResult {
  matches: Match[];
  spans: MatchSpan[];
  truncated: boolean;
  totalCount: number;
  error?: string;
}

// AST Node types from regexp-tree
export type AstNodeType =
  | "RegExp"
  | "Alternative"
  | "Disjunction"
  | "Group"
  | "Backreference"
  | "Assertion"
  | "Repetition"
  | "Quantifier"
  | "CharacterClass"
  | "ClassRange"
  | "Char";

export interface AstNode {
  type: AstNodeType;
  loc?: {
    source: string;
    start: { line: number; column: number; offset: number };
    end: { line: number; column: number; offset: number };
  };
  // Common fields
  body?: AstNode | AstNode[];
  expression?: AstNode;
  expressions?: AstNode[];
  left?: AstNode;
  right?: AstNode;
  // Group specific
  capturing?: boolean;
  number?: number;
  name?: string;
  // Assertion specific
  kind?: string;
  assertion?: AstNode;
  // Quantifier specific (on Quantifier node)
  kind_?: string;
  greedy?: boolean;
  from?: number;
  to?: number;
  // Repetition specific
  quantifier?: AstNode;
  // Character class specific
  negative?: boolean;
  // Char specific
  value?: string;
  symbol?: string;
  escaped?: boolean;
  codePoint?: number;
  // Reference
  reference?: number;
  referenceRaw?: string;
  // Flags (on RegExp node)
  flags?: string;
}

// Configuration constants
export const REGEX_CONFIG = {
  MAX_PATTERN_LENGTH: 2000,
  MAX_TEXT_LENGTH: 50000,
  MAX_MATCHES: 1000,
  DEBOUNCE_MS: 150,
  MATCH_TIMEOUT_MS: 3000,
} as const;
