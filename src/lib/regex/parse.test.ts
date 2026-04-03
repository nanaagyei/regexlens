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

  it("returns normalized tree on success", () => {
    const r = parseRegex("^abc$", "");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.normalized).toBeDefined();
      expect(r.normalized.type).toBe("pattern");
      expect(r.normalized.children.length).toBeGreaterThan(0);
    }
  });

  it("returns normalized tree for empty pattern", () => {
    const r = parseRegex("", "");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.normalized).toBeDefined();
      expect(r.normalized.type).toBe("pattern");
      expect(r.normalized.children).toEqual([]);
    }
  });

  it("does not include normalized on failure", () => {
    const r = parseRegex("[", "");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect((r as Record<string, unknown>).normalized).toBeUndefined();
    }
  });
});
