import { describe, it, expect } from "vitest";
import { computeSyntaxDiff } from "../syntaxDiff";

describe("computeSyntaxDiff", () => {
  it("returns no changes for identical patterns", () => {
    const result = computeSyntaxDiff("[a-z]+", "[a-z]+");
    expect(result.hasChanges).toBe(false);
    expect(result.ops).toEqual([{ kind: "equal", value: "[a-z]+" }]);
  });

  it("detects pure insertion from empty", () => {
    const result = computeSyntaxDiff("", "abc");
    expect(result.hasChanges).toBe(true);
    expect(result.ops).toEqual([{ kind: "insert", value: "abc" }]);
  });

  it("detects pure deletion to empty", () => {
    const result = computeSyntaxDiff("abc", "");
    expect(result.hasChanges).toBe(true);
    expect(result.ops).toEqual([{ kind: "delete", value: "abc" }]);
  });

  it("detects character replacement", () => {
    const result = computeSyntaxDiff("cat", "bat");
    expect(result.hasChanges).toBe(true);

    // "c" deleted, "b" inserted, "at" equal
    const deleteOps = result.ops.filter((op) => op.kind === "delete");
    const insertOps = result.ops.filter((op) => op.kind === "insert");
    const equalOps = result.ops.filter((op) => op.kind === "equal");

    expect(deleteOps.some((op) => op.value.includes("c"))).toBe(true);
    expect(insertOps.some((op) => op.value.includes("b"))).toBe(true);
    expect(equalOps.some((op) => op.value.includes("at"))).toBe(true);
  });

  it("handles complex regex pattern diff", () => {
    const result = computeSyntaxDiff("[a-z]+", "[A-Z]*");
    expect(result.hasChanges).toBe(true);

    // Reconstruct old and new from ops
    const oldText = result.ops
      .filter((op) => op.kind !== "insert")
      .map((op) => op.value)
      .join("");
    const newText = result.ops
      .filter((op) => op.kind !== "delete")
      .map((op) => op.value)
      .join("");

    expect(oldText).toBe("[a-z]+");
    expect(newText).toBe("[A-Z]*");
  });

  it("returns single equal op for both empty", () => {
    const result = computeSyntaxDiff("", "");
    expect(result.hasChanges).toBe(false);
  });

  it("handles partial overlap", () => {
    const result = computeSyntaxDiff("\\d{3}-\\d{4}", "\\d{3,5}-\\d{4}");
    expect(result.hasChanges).toBe(true);

    const newText = result.ops
      .filter((op) => op.kind !== "delete")
      .map((op) => op.value)
      .join("");
    expect(newText).toBe("\\d{3,5}-\\d{4}");
  });
});
