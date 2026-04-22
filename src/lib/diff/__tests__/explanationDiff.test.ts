import { describe, it, expect } from "vitest";
import { computeExplanationDiff } from "../explanationDiff";
import { parseRegex } from "@/lib/regex/parse";
import { generateExplanation } from "@/lib/explain/explain";
import type { ExplanationStep } from "@/types/explain";

function getSteps(pattern: string, flags = ""): ExplanationStep[] {
  const result = parseRegex(pattern, flags);
  return generateExplanation(result).steps;
}

describe("computeExplanationDiff", () => {
  it("returns no changes for identical patterns", () => {
    const steps = getSteps("[a-z]+");
    const diff = computeExplanationDiff(steps, steps);
    expect(diff.hasChanges).toBe(false);
    expect(diff.changes.every((c) => c.kind === "equal")).toBe(true);
  });

  it("detects added step (anchor added)", () => {
    const oldSteps = getSteps("abc");
    const newSteps = getSteps("^abc");
    const diff = computeExplanationDiff(oldSteps, newSteps);
    expect(diff.hasChanges).toBe(true);
    const added = diff.changes.filter((c) => c.kind === "added");
    expect(added.length).toBeGreaterThanOrEqual(1);
    expect(added.some((c) => c.newStep?.kind === "anchor")).toBe(true);
  });

  it("detects removed step (anchor removed)", () => {
    const oldSteps = getSteps("^abc");
    const newSteps = getSteps("abc");
    const diff = computeExplanationDiff(oldSteps, newSteps);
    expect(diff.hasChanges).toBe(true);
    const removed = diff.changes.filter((c) => c.kind === "removed");
    expect(removed.length).toBeGreaterThanOrEqual(1);
    expect(removed.some((c) => c.oldStep?.kind === "anchor")).toBe(true);
  });

  it("detects modified step (quantifier label change)", () => {
    const oldSteps = getSteps("\\d+");
    const newSteps = getSteps("\\d{2}");
    const diff = computeExplanationDiff(oldSteps, newSteps);
    expect(diff.hasChanges).toBe(true);
    const nonEqual = diff.changes.filter((c) => c.kind !== "equal");
    expect(nonEqual.length).toBeGreaterThanOrEqual(1);
  });

  it("handles complete replacement (all steps different)", () => {
    const oldSteps = getSteps("abc");
    const newSteps = getSteps("\\d+");
    const diff = computeExplanationDiff(oldSteps, newSteps);
    expect(diff.hasChanges).toBe(true);
    const removed = diff.changes.filter((c) => c.kind === "removed");
    const added = diff.changes.filter((c) => c.kind === "added");
    expect(removed.length).toBeGreaterThanOrEqual(1);
    expect(added.length).toBeGreaterThanOrEqual(1);
  });

  it("handles empty old steps", () => {
    const newSteps = getSteps("abc");
    const diff = computeExplanationDiff([], newSteps);
    expect(diff.hasChanges).toBe(true);
    expect(diff.changes.every((c) => c.kind === "added")).toBe(true);
  });

  it("handles empty new steps", () => {
    const oldSteps = getSteps("abc");
    const diff = computeExplanationDiff(oldSteps, []);
    expect(diff.hasChanges).toBe(true);
    expect(diff.changes.every((c) => c.kind === "removed")).toBe(true);
  });

  it("handles both empty", () => {
    const diff = computeExplanationDiff([], []);
    expect(diff.hasChanges).toBe(false);
    expect(diff.changes).toHaveLength(0);
  });

  it("tracks labelChanged and detailChanged flags", () => {
    const oldSteps = getSteps("\\d+");
    const newSteps = getSteps("\\d{2}");
    const diff = computeExplanationDiff(oldSteps, newSteps);
    const modified = diff.changes.filter((c) => c.kind === "modified");
    for (const m of modified) {
      expect(m.labelChanged || m.detailChanged).toBe(true);
    }
  });
});
