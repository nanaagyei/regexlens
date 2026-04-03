/**
 * Normalized AST types for canonical regex representation.
 *
 * ComparableNode is the app-friendly, parser-agnostic tree that
 * explanation, diff, warnings, and failure-analysis engines consume.
 */

export type ComparableNodeType =
  | "pattern"
  | "alternative"
  | "literal"
  | "anchor"
  | "dot"
  | "escape"
  | "charClass"
  | "group"
  | "quantifier"
  | "alternation"
  | "assertion"
  | "backreference";

export interface ComparableNode {
  key: string;
  type: ComparableNodeType;
  text: string;
  range?: { start: number; end: number };
  props: ComparableNodeProps;
  children: ComparableNode[];
}

export type ComparableNodeProps =
  | AnchorProps
  | LiteralProps
  | EscapeProps
  | DotProps
  | CharClassProps
  | GroupProps
  | QuantifierProps
  | AssertionProps
  | BackreferenceProps
  | AlternationProps
  | AlternativeProps
  | PatternProps;

export interface AnchorProps {
  kind: "start" | "end" | "wordBoundary" | "nonWordBoundary";
}

export interface LiteralProps {
  value: string;
}

export interface EscapeProps {
  escapeType:
    | "digit"
    | "nonDigit"
    | "word"
    | "nonWord"
    | "whitespace"
    | "nonWhitespace"
    | "tab"
    | "newline"
    | "return"
    | "other";
  raw: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DotProps {}

export interface CharClassMemberLiteral {
  type: "literal";
  value: string;
}

export interface CharClassMemberRange {
  type: "range";
  from: string;
  to: string;
}

export type CharClassMember = CharClassMemberLiteral | CharClassMemberRange;

export interface CharClassProps {
  negated: boolean;
  members: CharClassMember[];
}

export interface GroupProps {
  capturing: boolean;
  name: string | null;
  number: number | null;
}

export interface QuantifierProps {
  min: number;
  max: number | null;
  greedy: boolean;
}

export interface AssertionProps {
  assertionType: "lookahead" | "lookbehind";
  polarity: "positive" | "negative";
}

export interface BackreferenceProps {
  groupNumber: number | null;
  groupName: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AlternationProps {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AlternativeProps {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PatternProps {}
