import { describe, it, expect, beforeEach } from "vitest";
import { parseRegexCached, resetParseCache } from "./parseCache";

describe("parseRegexCached", () => {
  beforeEach(() => {
    resetParseCache();
  });

  it("returns same reference on cache hit", () => {
    const a = parseRegexCached("\\d+", "g");
    const b = parseRegexCached("\\d+", "g");
    expect(a).toBe(b);
  });

  it("different flags are separate entries", () => {
    const a = parseRegexCached("a", "g");
    const b = parseRegexCached("a", "i");
    expect(a).not.toBe(b);
  });

  it("evicts oldest when over capacity", () => {
    resetParseCache();
    const first = parseRegexCached("pat0", "g");
    for (let i = 1; i < 97; i++) {
      parseRegexCached(`pat${i}`, "g");
    }
    const again0 = parseRegexCached("pat0", "g");
    expect(again0).not.toBe(first);
  });
});
