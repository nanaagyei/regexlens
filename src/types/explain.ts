/**
 * Explanation step types for the deterministic regex explainer
 */

import { Range } from "./regex";
import type { EscapeProps, CharClassMember } from "./ast";

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

// ── Semantic Unit types ────────────────────────────────────

export interface SemanticRange {
  start: number;
  end: number;
}

interface SemanticUnitBase {
  type: SemanticUnitType;
  range: SemanticRange;
  sourceText: string;
}

export type SemanticUnitType =
  | "text"
  | "anchor"
  | "dot"
  | "escape"
  | "charClass"
  | "quantified"
  | "group"
  | "alternation"
  | "assertion"
  | "backreference";

export interface TextUnit extends SemanticUnitBase {
  type: "text";
  value: string;
}

export interface AnchorUnit extends SemanticUnitBase {
  type: "anchor";
  anchorKind: "start" | "end" | "wordBoundary" | "nonWordBoundary";
}

export interface DotUnit extends SemanticUnitBase {
  type: "dot";
}

export interface EscapeUnit extends SemanticUnitBase {
  type: "escape";
  escapeType: EscapeProps["escapeType"];
  raw: string;
}

export interface CharClassUnit extends SemanticUnitBase {
  type: "charClass";
  negated: boolean;
  members: CharClassMember[];
}

export interface QuantifiedUnit extends SemanticUnitBase {
  type: "quantified";
  min: number;
  max: number | null;
  greedy: boolean;
  target: QuantifiedTarget;
}

export type QuantifiedTarget =
  | { kind: "escape"; escapeType: EscapeProps["escapeType"]; raw: string }
  | { kind: "charClass"; negated: boolean; members: CharClassMember[] }
  | { kind: "dot" }
  | { kind: "text"; value: string }
  | { kind: "group"; group: GroupUnit }
  | { kind: "backreference"; groupNumber: number | null; groupName: string | null };

export interface GroupUnit extends SemanticUnitBase {
  type: "group";
  capturing: boolean;
  name: string | null;
  number: number | null;
  body: SemanticUnit[];
}

export interface AlternationUnit extends SemanticUnitBase {
  type: "alternation";
  branches: SemanticUnit[][];
}

export interface AssertionUnit extends SemanticUnitBase {
  type: "assertion";
  assertionType: "lookahead" | "lookbehind";
  polarity: "positive" | "negative";
  body: SemanticUnit[];
}

export interface BackreferenceUnit extends SemanticUnitBase {
  type: "backreference";
  groupNumber: number | null;
  groupName: string | null;
}

export type SemanticUnit =
  | TextUnit
  | AnchorUnit
  | DotUnit
  | EscapeUnit
  | CharClassUnit
  | QuantifiedUnit
  | GroupUnit
  | AlternationUnit
  | AssertionUnit
  | BackreferenceUnit;
