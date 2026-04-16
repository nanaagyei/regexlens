import { describe, it, expect } from "vitest";
import { computeStructuralDiff } from "../structuralDiff";
import { parseRegex } from "@/lib/regex/parse";
import type { ComparableNode } from "@/types/ast";

function normalize(pattern: string, flags = ""): ComparableNode {
  const result = parseRegex(pattern, flags);
  if (!result.ok) throw new Error(`Failed to parse: ${pattern}`);
  return result.normalized;
}

describe("computeStructuralDiff", () => {
  it("returns no changes for identical patterns", () => {
    const tree = normalize("[a-z]+");
    const diff = computeStructuralDiff(tree, tree);
    expect(diff.hasChanges).toBe(false);
    expect(diff.changes).toHaveLength(0);
  });

  it("returns no changes for both empty patterns", () => {
    const oldTree = normalize("");
    const newTree = normalize("");
    const diff = computeStructuralDiff(oldTree, newTree);
    expect(diff.hasChanges).toBe(false);
  });

  it("detects anchor added", () => {
    const oldTree = normalize("abc");
    const newTree = normalize("^abc");
    const diff = computeStructuralDiff(oldTree, newTree);
    expect(diff.hasChanges).toBe(true);
    const added = diff.changes.filter((c) => c.kind === "added");
    expect(added.length).toBeGreaterThanOrEqual(1);
    expect(added.some((c) => c.nodeType === "anchor")).toBe(true);
    expect(added.some((c) => c.description.includes("anchor"))).toBe(true);
  });

  it("detects anchor removed", () => {
    const oldTree = normalize("^abc");
    const newTree = normalize("abc");
    const diff = computeStructuralDiff(oldTree, newTree);
    expect(diff.hasChanges).toBe(true);
    const removed = diff.changes.filter((c) => c.kind === "removed");
    expect(removed.length).toBeGreaterThanOrEqual(1);
    expect(removed.some((c) => c.nodeType === "anchor")).toBe(true);
  });

  it("detects quantifier changed", () => {
    const oldTree = normalize("\\d+");
    const newTree = normalize("\\d{2}");
    const diff = computeStructuralDiff(oldTree, newTree);
    expect(diff.hasChanges).toBe(true);
    const modified = diff.changes.filter((c) => c.kind === "modified");
    expect(modified.length).toBeGreaterThanOrEqual(1);
    expect(modified.some((c) => c.nodeType === "quantifier")).toBe(true);
    const qMod = modified.find((c) => c.nodeType === "quantifier")!;
    expect(qMod.propChanges).toBeDefined();
    expect(qMod.propChanges!.some((p) => p.prop === "range")).toBe(true);
  });

  it("detects literal to wildcard (escape removed, dot added)", () => {
    const oldTree = normalize("\\.");
    const newTree = normalize(".");
    const diff = computeStructuralDiff(oldTree, newTree);
    expect(diff.hasChanges).toBe(true);
    // escape → dot is a type change, so we get removed + added
    const removed = diff.changes.filter((c) => c.kind === "removed");
    const added = diff.changes.filter((c) => c.kind === "added");
    expect(removed.some((c) => c.nodeType === "escape")).toBe(true);
    expect(added.some((c) => c.nodeType === "dot")).toBe(true);
  });

  it("detects class widened (members added)", () => {
    const oldTree = normalize("[A-Z]");
    const newTree = normalize("[A-Za-z]");
    const diff = computeStructuralDiff(oldTree, newTree);
    expect(diff.hasChanges).toBe(true);
    const modified = diff.changes.filter((c) => c.kind === "modified");
    expect(modified.some((c) => c.nodeType === "charClass")).toBe(true);
    const classMod = modified.find((c) => c.nodeType === "charClass")!;
    expect(classMod.propChanges).toBeDefined();
    expect(classMod.propChanges!.some((p) => p.prop === "members")).toBe(true);
    expect(classMod.propChanges!.find((p) => p.prop === "members")!.description)
      .toContain("added");
  });

  it("detects class narrowed (members removed)", () => {
    const oldTree = normalize("[A-Za-z]");
    const newTree = normalize("[A-Z]");
    const diff = computeStructuralDiff(oldTree, newTree);
    expect(diff.hasChanges).toBe(true);
    const modified = diff.changes.filter((c) => c.kind === "modified");
    expect(modified.some((c) => c.nodeType === "charClass")).toBe(true);
    const classMod = modified.find((c) => c.nodeType === "charClass")!;
    expect(classMod.propChanges!.some((p) => p.description.includes("removed"))).toBe(true);
  });

  it("detects capturing to non-capturing group", () => {
    const oldTree = normalize("(abc)");
    const newTree = normalize("(?:abc)");
    const diff = computeStructuralDiff(oldTree, newTree);
    expect(diff.hasChanges).toBe(true);
    const modified = diff.changes.filter((c) => c.kind === "modified");
    expect(modified.some((c) => c.nodeType === "group")).toBe(true);
    const groupMod = modified.find((c) => c.nodeType === "group")!;
    expect(groupMod.propChanges).toBeDefined();
    expect(groupMod.propChanges!.some((p) => p.prop === "capturing")).toBe(true);
  });

  it("detects alternation branch added", () => {
    const oldTree = normalize("(cat|dog)");
    const newTree = normalize("(cat|dog|fox)");
    const diff = computeStructuralDiff(oldTree, newTree);
    expect(diff.hasChanges).toBe(true);
    const added = diff.changes.filter((c) => c.kind === "added");
    expect(added.length).toBeGreaterThanOrEqual(1);
    // The new branch should be detected
    expect(added.some((c) =>
      c.description.includes("fox") || c.nodeType === "alternative",
    )).toBe(true);
  });

  it("does not flag reordered alternation branches as changes", () => {
    // cat|dog vs dog|cat should have no structural changes
    const oldTree = normalize("cat|dog");
    const newTree = normalize("dog|cat");
    const diff = computeStructuralDiff(oldTree, newTree);
    expect(diff.hasChanges).toBe(false);
  });

  it("detects assertion changes", () => {
    const oldTree = normalize("(?=abc)");
    const newTree = normalize("(?!abc)");
    const diff = computeStructuralDiff(oldTree, newTree);
    expect(diff.hasChanges).toBe(true);
    const modified = diff.changes.filter((c) => c.kind === "modified");
    expect(modified.some((c) => c.nodeType === "assertion")).toBe(true);
  });

  it("generates a summary string", () => {
    const oldTree = normalize("abc");
    const newTree = normalize("^abc");
    const diff = computeStructuralDiff(oldTree, newTree);
    expect(diff.summary).toMatch(/\d+ added/);
    expect(diff.summary).toMatch(/\d+ removed/);
    expect(diff.summary).toMatch(/\d+ modified/);
  });
});
