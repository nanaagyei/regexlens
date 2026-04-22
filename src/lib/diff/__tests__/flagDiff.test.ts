import { describe, it, expect } from "vitest";
import { computeFlagDiff, FLAG_METADATA } from "../flagDiff";

describe("computeFlagDiff", () => {
  it("returns no changes for identical flags", () => {
    const result = computeFlagDiff("gi", "gi");
    expect(result.hasChanges).toBe(false);
    expect(result.changes).toEqual([]);
  });

  it("detects a single added flag", () => {
    const result = computeFlagDiff("g", "gi");
    expect(result.hasChanges).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toMatchObject({
      flag: "i",
      changeType: "added",
      label: "Case Insensitive",
    });
  });

  it("detects a single removed flag", () => {
    const result = computeFlagDiff("gi", "g");
    expect(result.hasChanges).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toMatchObject({
      flag: "i",
      changeType: "removed",
      label: "Case Insensitive",
    });
  });

  it("detects multiple simultaneous changes", () => {
    const result = computeFlagDiff("gim", "gsu");
    expect(result.hasChanges).toBe(true);

    const removed = result.changes.filter((c) => c.changeType === "removed");
    const added = result.changes.filter((c) => c.changeType === "added");

    expect(removed.map((c) => c.flag).sort()).toEqual(["i", "m"]);
    expect(added.map((c) => c.flag).sort()).toEqual(["s", "u"]);
  });

  it("handles empty old flags (all added)", () => {
    const result = computeFlagDiff("", "gi");
    expect(result.hasChanges).toBe(true);
    expect(result.changes).toHaveLength(2);
    expect(result.changes.every((c) => c.changeType === "added")).toBe(true);
  });

  it("handles empty new flags (all removed)", () => {
    const result = computeFlagDiff("gi", "");
    expect(result.hasChanges).toBe(true);
    expect(result.changes).toHaveLength(2);
    expect(result.changes.every((c) => c.changeType === "removed")).toBe(true);
  });

  it("produces correct labels and descriptions for all known flags", () => {
    for (const [flag, meta] of Object.entries(FLAG_METADATA)) {
      const result = computeFlagDiff("", flag);
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].label).toBe(meta.label);
      expect(result.changes[0].description).toBe(meta.description);
    }
  });

  it("handles enable/disable summaries for i, m, s, g, u", () => {
    const flags = ["i", "m", "s", "g", "u"];
    for (const flag of flags) {
      const added = computeFlagDiff("", flag);
      expect(added.changes[0].changeType).toBe("added");
      expect(added.changes[0].description.length).toBeGreaterThan(0);

      const removed = computeFlagDiff(flag, "");
      expect(removed.changes[0].changeType).toBe("removed");
      expect(removed.changes[0].description.length).toBeGreaterThan(0);
    }
  });

  it("both empty returns no changes", () => {
    const result = computeFlagDiff("", "");
    expect(result.hasChanges).toBe(false);
    expect(result.changes).toEqual([]);
  });
});
