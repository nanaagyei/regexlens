import { describe, it, expect } from "vitest";
import { computeMatches } from "./match";

describe("computeMatches", () => {
  it("returns empty when pattern or text is empty", () => {
    expect(computeMatches("", "g", "foo").totalCount).toBe(0);
    expect(computeMatches("\\d+", "g", "").totalCount).toBe(0);
  });

  it("finds digit runs with global flag implied", () => {
    const r = computeMatches("\\d+", "", "a12b3");
    expect(r.totalCount).toBe(2);
    expect(r.matches).toHaveLength(2);
    expect(r.matches[0]?.full.text).toBe("12");
    expect(r.matches[1]?.full.text).toBe("3");
  });
});
