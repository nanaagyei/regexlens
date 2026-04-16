import { describe, it, expect } from "vitest";
import { computeStructuralDiff } from "../structuralDiff";
import { parseRegex } from "@/lib/regex/parse";
import type { ComparableNode } from "@/types/ast";

function normalize(pattern: string, flags = ""): ComparableNode {
  const result = parseRegex(pattern, flags);
  if (!result.ok) throw new Error(`Failed to parse: ${pattern}`);
  return result.normalized;
}

function allChanges(
  changes: import("@/types/diff").StructuralChange[],
): import("@/types/diff").StructuralChange[] {
  const result: import("@/types/diff").StructuralChange[] = [];
  for (const c of changes) {
    result.push(c);
    if (c.children) result.push(...allChanges(c.children));
  }
  return result;
}

describe("Structural diff fixtures", () => {
  it("abc -> ^abc: detects start anchor added", () => {
    const diff = computeStructuralDiff(normalize("abc"), normalize("^abc"));
    expect(diff.hasChanges).toBe(true);
    const all = allChanges(diff.changes);
    const added = all.filter((c) => c.kind === "added" && c.nodeType === "anchor");
    expect(added.length).toBe(1);
    expect(added[0].description).toContain("Start-of-input");
  });

  it("\\d+ -> \\d{2}: detects quantifier range change", () => {
    const diff = computeStructuralDiff(normalize("\\d+"), normalize("\\d{2}"));
    expect(diff.hasChanges).toBe(true);
    const all = allChanges(diff.changes);
    const modified = all.filter((c) => c.kind === "modified" && c.nodeType === "quantifier");
    expect(modified.length).toBe(1);
    expect(modified[0].propChanges).toBeDefined();
    const rangePc = modified[0].propChanges!.find((p) => p.prop === "range");
    expect(rangePc).toBeDefined();
    expect(rangePc!.description).toContain("+ (one or more)");
    expect(rangePc!.description).toContain("{2} (exactly 2)");
  });

  it("\\. -> .: detects escape to wildcard change", () => {
    const diff = computeStructuralDiff(normalize("\\."), normalize("."));
    expect(diff.hasChanges).toBe(true);
    const all = allChanges(diff.changes);
    const removed = all.filter((c) => c.kind === "removed");
    const added = all.filter((c) => c.kind === "added");
    expect(removed.some((c) => c.nodeType === "escape")).toBe(true);
    expect(added.some((c) => c.nodeType === "dot")).toBe(true);
  });

  it("[A-Z] -> [A-Za-z]: detects character class widened", () => {
    const diff = computeStructuralDiff(normalize("[A-Z]"), normalize("[A-Za-z]"));
    expect(diff.hasChanges).toBe(true);
    const all = allChanges(diff.changes);
    const modified = all.filter((c) => c.kind === "modified" && c.nodeType === "charClass");
    expect(modified.length).toBe(1);
    const membersPc = modified[0].propChanges!.find((p) => p.prop === "members");
    expect(membersPc).toBeDefined();
    expect(membersPc!.description).toContain("added");
    expect(membersPc!.description).toContain("a-z");
  });

  it("(abc) -> (?:abc): detects capturing to non-capturing", () => {
    const diff = computeStructuralDiff(normalize("(abc)"), normalize("(?:abc)"));
    expect(diff.hasChanges).toBe(true);
    const all = allChanges(diff.changes);
    const modified = all.filter((c) => c.kind === "modified" && c.nodeType === "group");
    expect(modified.length).toBe(1);
    const capPc = modified[0].propChanges!.find((p) => p.prop === "capturing");
    expect(capPc).toBeDefined();
    expect(capPc!.oldValue).toBe(true);
    expect(capPc!.newValue).toBe(false);
  });

  it("(cat|dog) -> (cat|dog|fox): detects branch added", () => {
    const diff = computeStructuralDiff(
      normalize("(cat|dog)"),
      normalize("(cat|dog|fox)"),
    );
    expect(diff.hasChanges).toBe(true);
    const all = allChanges(diff.changes);
    const added = all.filter((c) => c.kind === "added");
    expect(added.length).toBeGreaterThanOrEqual(1);
    // The new branch containing "fox" should be added
    expect(added.some((c) =>
      c.description.includes("fox") || c.nodeType === "alternative",
    )).toBe(true);
  });
});
