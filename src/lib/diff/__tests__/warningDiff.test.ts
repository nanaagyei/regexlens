import { describe, it, expect } from "vitest";
import { computeWarningDiff } from "../warningDiff";
import type { Warning } from "@/types/warnings";

function makeWarning(
  overrides: Partial<Warning> & { id: string },
): Warning {
  return {
    severity: "warn",
    category: "correctness",
    title: overrides.id,
    message: `Warning: ${overrides.id}`,
    score: 50,
    ...overrides,
  };
}

describe("computeWarningDiff", () => {
  it("returns no changes for empty arrays", () => {
    const result = computeWarningDiff([], []);
    expect(result.hasChanges).toBe(false);
    expect(result.changes).toEqual([]);
  });

  it("returns no changes for identical warning arrays", () => {
    const w = [makeWarning({ id: "a" }), makeWarning({ id: "b" })];
    const result = computeWarningDiff(w, w);
    expect(result.hasChanges).toBe(false);
    expect(result.changes).toEqual([]);
  });

  it("detects a warning added", () => {
    const oldW: Warning[] = [];
    const newW = [makeWarning({ id: "nested-quantifiers", severity: "danger" })];
    const result = computeWarningDiff(oldW, newW);
    expect(result.hasChanges).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toMatchObject({
      kind: "added",
      warningId: "nested-quantifiers",
    });
    expect(result.changes[0].newWarning).toBeDefined();
  });

  it("detects a warning removed", () => {
    const oldW = [makeWarning({ id: "ambiguous-dot-star", severity: "warn" })];
    const newW: Warning[] = [];
    const result = computeWarningDiff(oldW, newW);
    expect(result.hasChanges).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toMatchObject({
      kind: "removed",
      warningId: "ambiguous-dot-star",
    });
    expect(result.changes[0].oldWarning).toBeDefined();
  });

  it("detects severity changed", () => {
    const oldW = [makeWarning({ id: "unescaped-dot", severity: "info" })];
    const newW = [makeWarning({ id: "unescaped-dot", severity: "warn" })];
    const result = computeWarningDiff(oldW, newW);
    expect(result.hasChanges).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toMatchObject({
      kind: "severity_changed",
      warningId: "unescaped-dot",
      oldSeverity: "info",
      newSeverity: "warn",
    });
  });

  it("detects multiple simultaneous changes", () => {
    const oldW = [
      makeWarning({ id: "a", severity: "info" }),
      makeWarning({ id: "b", severity: "warn" }),
    ];
    const newW = [
      makeWarning({ id: "a", severity: "danger" }),
      makeWarning({ id: "c", severity: "warn" }),
    ];
    const result = computeWarningDiff(oldW, newW);
    expect(result.hasChanges).toBe(true);

    const severityChanged = result.changes.filter(
      (c) => c.kind === "severity_changed",
    );
    const removed = result.changes.filter((c) => c.kind === "removed");
    const added = result.changes.filter((c) => c.kind === "added");

    expect(severityChanged).toHaveLength(1);
    expect(severityChanged[0].warningId).toBe("a");
    expect(removed).toHaveLength(1);
    expect(removed[0].warningId).toBe("b");
    expect(added).toHaveLength(1);
    expect(added[0].warningId).toBe("c");
  });

  it("handles warnings with no range", () => {
    const oldW = [makeWarning({ id: "x", range: undefined })];
    const newW: Warning[] = [];
    const result = computeWarningDiff(oldW, newW);
    expect(result.hasChanges).toBe(true);
    expect(result.changes[0].kind).toBe("removed");
  });
});
