import { describe, it, expect } from "vitest";
import { parseRegex } from "./parse";

describe("parseRegex", () => {
  it("returns ok for empty pattern", () => {
    const r = parseRegex("", "");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.normalizedPattern).toBe("");
    }
  });

  it("parses a simple digit pattern", () => {
    const r = parseRegex("\\d+", "");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.ast.type).toBe("RegExp");
    }
  });

  it("fails on invalid regex", () => {
    const r = parseRegex("[", "");
    expect(r.ok).toBe(false);
  });
});
