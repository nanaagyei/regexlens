/**
 * Diff model primitives for regex comparison.
 *
 * Designed to be extended with structural and semantic layers later.
 */

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

export interface RegexDiff {
  syntax: SyntaxDiff;
  flags: FlagDiff;
}
