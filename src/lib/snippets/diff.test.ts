import { describe, it, expect } from "vitest";
import { computeDiff, type VersionRow } from "./diff";

const baseRow = (overrides: Partial<VersionRow>): VersionRow => ({
  id: "00000000-0000-4000-8000-000000000001",
  pattern: "a",
  flags: "",
  notes: null,
  created_at: new Date(0),
  ...overrides,
});

describe("computeDiff", () => {
  it("detects pattern and flag changes", () => {
    const from = baseRow({ pattern: "a", flags: "" });
    const to = baseRow({
      id: "00000000-0000-4000-8000-000000000002",
      pattern: "ab",
      flags: "i",
    });
    const d = computeDiff(from, to);
    expect(d.patternChanged).toBe(true);
    expect(d.flagsChanged).toBe(true);
    expect(d.flagsDiff.added).toContain("i");
  });

  it("reports no flag diff when flags equal", () => {
    const from = baseRow({ pattern: "x", flags: "g" });
    const to = baseRow({
      id: "00000000-0000-4000-8000-000000000003",
      pattern: "y",
      flags: "g",
    });
    const d = computeDiff(from, to);
    expect(d.flagsChanged).toBe(false);
  });
});
