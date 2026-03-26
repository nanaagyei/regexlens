/**
 * Explanation step types for the deterministic regex explainer
 */

import { Range } from "./regex";

export type ExplanationKind =
  | "anchor"
  | "group"
  | "quantifier"
  | "charclass"
  | "escape"
  | "alternation"
  | "literal"
  | "sequence"
  | "backreference"
  | "lookahead"
  | "lookbehind";

export interface ExplanationStep {
  id: string;
  label: string;
  detail?: string;
  range?: Range;
  kind: ExplanationKind;
  depth: number;
  children?: ExplanationStep[];
}

export interface ExplanationResult {
  steps: ExplanationStep[];
  summary?: string;
}

// Glossary entry for teaching moments
export interface GlossaryEntry {
  term: string;
  description: string;
  example?: string;
  gotcha?: string;
}

// Mapping from regex patterns to explanations
export const ESCAPE_EXPLANATIONS: Record<string, string> = {
  "\\d": "Any digit (0-9)",
  "\\D": "Any non-digit",
  "\\w": "Word character (letter, digit, underscore)",
  "\\W": "Non-word character",
  "\\s": "Whitespace (space, tab, newline)",
  "\\S": "Non-whitespace",
  "\\b": "Word boundary",
  "\\B": "Non-word boundary",
  "\\n": "Newline",
  "\\r": "Carriage return",
  "\\t": "Tab",
  "\\0": "Null character",
  "\\.": "Literal dot",
  "\\^": "Literal caret",
  "\\$": "Literal dollar sign",
  "\\*": "Literal asterisk",
  "\\+": "Literal plus",
  "\\?": "Literal question mark",
  "\\(": "Literal opening parenthesis",
  "\\)": "Literal closing parenthesis",
  "\\[": "Literal opening bracket",
  "\\]": "Literal closing bracket",
  "\\{": "Literal opening brace",
  "\\}": "Literal closing brace",
  "\\|": "Literal pipe",
  "\\\\": "Literal backslash",
  "\\/": "Literal forward slash",
};

export const ANCHOR_EXPLANATIONS: Record<string, string> = {
  "^": "Start of input",
  "$": "End of input",
  "\\b": "Word boundary",
  "\\B": "Non-word boundary",
};

export const QUANTIFIER_EXPLANATIONS = {
  "*": "Zero or more times",
  "+": "One or more times",
  "?": "Zero or one time (optional)",
  "{n}": (n: number) => `Exactly ${n} time${n === 1 ? "" : "s"}`,
  "{n,}": (n: number) => `${n} or more times`,
  "{n,m}": (n: number, m: number) => `Between ${n} and ${m} times`,
} as const;
