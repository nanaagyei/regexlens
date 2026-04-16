/**
 * Diff model primitives for regex comparison.
 *
 * Covers character-level syntax diff, flag diff, structural AST diff,
 * and explanation step diff.
 */

import type { ComparableNode, ComparableNodeType } from "./ast";
import type { ExplanationStep } from "./explain";

export type DiffOpKind = "equal" | "insert" | "delete";

export interface DiffOp {
  kind: DiffOpKind;
  value: string;
}

export interface SyntaxDiff {
  ops: DiffOp[];
  hasChanges: boolean;
}

export interface FlagChange {
  flag: string;
  label: string;
  description: string;
  changeType: "added" | "removed";
}

export interface FlagDiff {
  changes: FlagChange[];
  hasChanges: boolean;
}

// ── Structural AST Diff ────────────────────────────────────

export type StructuralChangeKind = "added" | "removed" | "modified" | "equal";

export interface PropChange {
  prop: string;
  oldValue: unknown;
  newValue: unknown;
  description: string;
}

export interface StructuralChange {
  kind: StructuralChangeKind;
  nodeType: ComparableNodeType;
  path: string;
  oldNode?: ComparableNode;
  newNode?: ComparableNode;
  description: string;
  propChanges?: PropChange[];
  children?: StructuralChange[];
}

export interface StructuralDiff {
  changes: StructuralChange[];
  hasChanges: boolean;
  summary: string;
}

// ── Explanation Step Diff ──────────────────────────────────

export type ExplanationChangeKind = "added" | "removed" | "modified" | "equal";

export interface ExplanationChange {
  kind: ExplanationChangeKind;
  oldStep?: ExplanationStep;
  newStep?: ExplanationStep;
  labelChanged: boolean;
  detailChanged: boolean;
}

export interface ExplanationDiff {
  changes: ExplanationChange[];
  hasChanges: boolean;
}

// ── Combined Diff ──────────────────────────────────────────

export interface RegexDiff {
  syntax: SyntaxDiff;
  flags: FlagDiff;
  structural: StructuralDiff | null;
  explanation: ExplanationDiff | null;
}
