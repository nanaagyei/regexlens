import { describe, it, expect } from "vitest";
import { parseRegex } from "@/lib/regex/parse";
import { analyzeWarnings } from "./heuristics";
import type { MatchResult } from "@/types";

const emptyMatches: MatchResult = {
  matches: [],
  spans: [],
  truncated: false,
  totalCount: 0,
};

describe("analyzeWarnings", () => {
  it("runs without parse errors on plain pattern", () => {
    const parseResult = parseRegex("a", "");
    const { warnings } = analyzeWarnings("a", "", parseResult, emptyMatches);
    expect(Array.isArray(warnings)).toBe(true);
  });

  it("flags common unescaped-dot pattern when applicable", () => {
    const pattern = "foo.bar";
    const parseResult = parseRegex(pattern, "");
    const { warnings } = analyzeWarnings(pattern, "", parseResult, emptyMatches);
    const dotWarn = warnings.find((w) => w.title.toLowerCase().includes("dot"));
    expect(dotWarn).toBeDefined();
  });
});
