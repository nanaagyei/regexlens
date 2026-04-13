import { describe, it, expect } from "vitest";
import { parseRegex } from "@/lib/regex/parse";
import { analyzeWarnings } from "./heuristics";
import type { MatchResult, Warning } from "@/types";
import { REGEX_CONFIG } from "@/types";

const emptyMatches: MatchResult = {
  matches: [],
  spans: [],
  truncated: false,
  totalCount: 0,
};

function getWarnings(pattern: string, flags = "", matchResult = emptyMatches): Warning[] {
  const parseResult = parseRegex(pattern, flags);
  return analyzeWarnings(pattern, flags, parseResult, matchResult).warnings;
}

function findWarning(warnings: Warning[], id: string): Warning | undefined {
  return warnings.find((w) => w.id === id);
}

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------
describe("determinism", () => {
  it("produces identical output for the same input", () => {
    const a = getWarnings("(a+)+");
    const b = getWarnings("(a+)+");
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// checkPatternLength
// ---------------------------------------------------------------------------
describe("checkPatternLength", () => {
  it("does not warn for short patterns", () => {
    const warnings = getWarnings("abc");
    expect(findWarning(warnings, "excessive-pattern-length")).toBeUndefined();
  });

  it("warns at 80% of MAX_PATTERN_LENGTH", () => {
    const pattern = "a".repeat(Math.ceil(REGEX_CONFIG.MAX_PATTERN_LENGTH * 0.81));
    const warnings = getWarnings(pattern);
    const w = findWarning(warnings, "excessive-pattern-length");
    expect(w).toBeDefined();
    expect(w!.severity).toBe("warn");
    expect(w!.category).toBe("maintainability");
  });

  it("sets danger severity above MAX_PATTERN_LENGTH", () => {
    const pattern = "a".repeat(REGEX_CONFIG.MAX_PATTERN_LENGTH + 1);
    // parse will fail for too-long, but heuristic runs before parse
    const parseResult = parseRegex(pattern, "");
    const { warnings } = analyzeWarnings(pattern, "", parseResult, emptyMatches);
    const w = findWarning(warnings, "excessive-pattern-length");
    expect(w).toBeDefined();
    expect(w!.severity).toBe("danger");
  });
});

// ---------------------------------------------------------------------------
// checkUnescapedDot
// ---------------------------------------------------------------------------
describe("checkUnescapedDot", () => {
  it("warns on foo.bar", () => {
    const warnings = getWarnings("foo.bar");
    const w = findWarning(warnings, "unescaped-dot");
    expect(w).toBeDefined();
    expect(w!.category).toBe("correctness");
    expect(w!.range).toEqual({ start: 3, end: 4 });
  });

  it("does not warn on escaped dot", () => {
    const warnings = getWarnings("foo\\.bar");
    expect(findWarning(warnings, "unescaped-dot")).toBeUndefined();
  });

  it("does not warn on dot inside character class", () => {
    const warnings = getWarnings("[.]");
    expect(findWarning(warnings, "unescaped-dot")).toBeUndefined();
  });

  it("does not warn on .* (not between letters)", () => {
    const warnings = getWarnings(".*");
    expect(findWarning(warnings, "unescaped-dot")).toBeUndefined();
  });

  it("does not warn on standalone dot", () => {
    const warnings = getWarnings(".");
    expect(findWarning(warnings, "unescaped-dot")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// checkPipeInCharClass
// ---------------------------------------------------------------------------
describe("checkPipeInCharClass", () => {
  it("warns on [A|B]", () => {
    const warnings = getWarnings("[A|B]");
    const w = findWarning(warnings, "pipe-in-charclass");
    expect(w).toBeDefined();
    expect(w!.category).toBe("correctness");
    expect(w!.range).toEqual({ start: 0, end: 5 });
  });

  it("does not warn on (A|B)", () => {
    const warnings = getWarnings("(A|B)");
    expect(findWarning(warnings, "pipe-in-charclass")).toBeUndefined();
  });

  it("warns on multiple pipe-in-charclass instances", () => {
    const warnings = getWarnings("[a|b][c|d]");
    const count = warnings.filter((w) => w.id === "pipe-in-charclass").length;
    expect(count).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// checkEmptyAlternative
// ---------------------------------------------------------------------------
describe("checkEmptyAlternative", () => {
  it("warns on (foo|)", () => {
    const warnings = getWarnings("(foo|)");
    const w = findWarning(warnings, "empty-alternative");
    expect(w).toBeDefined();
    expect(w!.severity).toBe("warn");
    expect(w!.category).toBe("correctness");
  });

  it("warns on (|bar)", () => {
    const warnings = getWarnings("(|bar)");
    expect(findWarning(warnings, "empty-alternative")).toBeDefined();
  });

  it("warns on foo||bar", () => {
    const warnings = getWarnings("foo||bar");
    expect(findWarning(warnings, "empty-alternative")).toBeDefined();
  });

  it("does not warn on (foo|bar)", () => {
    const warnings = getWarnings("(foo|bar)");
    expect(findWarning(warnings, "empty-alternative")).toBeUndefined();
  });

  it("provides a range", () => {
    const warnings = getWarnings("(foo|)");
    const w = findWarning(warnings, "empty-alternative");
    expect(w!.range).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// checkNestedQuantifiers
// ---------------------------------------------------------------------------
describe("checkNestedQuantifiers", () => {
  it("warns on (a+)+", () => {
    const warnings = getWarnings("(a+)+");
    const w = warnings.find((w) => w.id === "nested-quantifiers");
    expect(w).toBeDefined();
    expect(w!.severity).toBe("danger");
    expect(w!.category).toBe("performance");
  });

  it("warns on (a*)*", () => {
    const warnings = getWarnings("(a*)*");
    expect(warnings.find((w) => w.id === "nested-quantifiers")).toBeDefined();
  });

  it("does not warn on a+", () => {
    const warnings = getWarnings("a+");
    expect(findWarning(warnings, "nested-quantifiers")).toBeUndefined();
  });

  it("provides range pointing to the nested quantifier", () => {
    const warnings = getWarnings("(a+)+");
    const w = warnings.find((w) => w.id === "nested-quantifiers");
    expect(w!.range).toBeDefined();
  });

  it("does not duplicate warnings for same location", () => {
    const warnings = getWarnings("(a+)+");
    const nested = warnings.filter((w) => w.id === "nested-quantifiers");
    // Should have exactly 1 unique range
    const ranges = new Set(nested.map((w) => `${w.range?.start}-${w.range?.end}`));
    expect(ranges.size).toBe(nested.length);
  });
});

// ---------------------------------------------------------------------------
// checkAmbiguousDotStar
// ---------------------------------------------------------------------------
describe("checkAmbiguousDotStar", () => {
  it("warns on .*foo", () => {
    const warnings = getWarnings(".*foo");
    const w = findWarning(warnings, "ambiguous-dot-star");
    expect(w).toBeDefined();
    expect(w!.category).toBe("performance");
    expect(w!.range).toEqual({ start: 0, end: 2 });
  });

  it("warns on .+bar", () => {
    const warnings = getWarnings(".+bar");
    expect(findWarning(warnings, "ambiguous-dot-star")).toBeDefined();
  });

  it("does not warn on .* at end of pattern", () => {
    const warnings = getWarnings("foo.*");
    expect(findWarning(warnings, "ambiguous-dot-star")).toBeUndefined();
  });

  it("does not warn on .* followed only by closing delimiters", () => {
    const warnings = getWarnings("(foo.*)");
    expect(findWarning(warnings, "ambiguous-dot-star")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// checkAlternationInRepetition
// ---------------------------------------------------------------------------
describe("checkAlternationInRepetition", () => {
  it("warns on (a|b)+", () => {
    const warnings = getWarnings("(a|b)+");
    const w = findWarning(warnings, "alternation-in-repetition");
    expect(w).toBeDefined();
    expect(w!.severity).toBe("warn");
    expect(w!.category).toBe("performance");
  });

  it("does not warn on (a|b) without repetition", () => {
    const warnings = getWarnings("(a|b)");
    expect(findWarning(warnings, "alternation-in-repetition")).toBeUndefined();
  });

  it("provides range for the repeated group", () => {
    const warnings = getWarnings("(a|b)+");
    const w = findWarning(warnings, "alternation-in-repetition");
    expect(w!.range).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// checkMultilineAnchors
// ---------------------------------------------------------------------------
describe("checkMultilineAnchors", () => {
  it("warns when m flag with ^", () => {
    const warnings = getWarnings("^foo", "m");
    const w = findWarning(warnings, "multiline-anchors");
    expect(w).toBeDefined();
    expect(w!.severity).toBe("info");
    expect(w!.category).toBe("readability");
  });

  it("warns when m flag with $", () => {
    const warnings = getWarnings("foo$", "m");
    expect(findWarning(warnings, "multiline-anchors")).toBeDefined();
  });

  it("does not warn without m flag", () => {
    const warnings = getWarnings("^foo$");
    expect(findWarning(warnings, "multiline-anchors")).toBeUndefined();
  });

  it("provides range pointing to the first anchor", () => {
    const warnings = getWarnings("^foo$", "m");
    const w = findWarning(warnings, "multiline-anchors");
    expect(w!.range).toEqual({ start: 0, end: 1 });
  });

  it("points to $ when ^ is absent", () => {
    const warnings = getWarnings("foo$", "m");
    const w = findWarning(warnings, "multiline-anchors");
    expect(w!.range).toEqual({ start: 3, end: 4 });
  });
});

// ---------------------------------------------------------------------------
// checkDotAllDot
// ---------------------------------------------------------------------------
describe("checkDotAllDot", () => {
  it("warns when s flag with .", () => {
    const warnings = getWarnings("a.b", "s");
    const w = findWarning(warnings, "dotall-dot");
    expect(w).toBeDefined();
    expect(w!.severity).toBe("info");
    expect(w!.category).toBe("readability");
  });

  it("does not warn without s flag", () => {
    const warnings = getWarnings("a.b");
    expect(findWarning(warnings, "dotall-dot")).toBeUndefined();
  });

  it("provides range pointing to first dot", () => {
    const warnings = getWarnings("a.b", "s");
    const w = findWarning(warnings, "dotall-dot");
    expect(w!.range).toEqual({ start: 1, end: 2 });
  });
});

// ---------------------------------------------------------------------------
// checkExcessiveMatches
// ---------------------------------------------------------------------------
describe("checkExcessiveMatches", () => {
  it("warns when matches are truncated", () => {
    const truncated: MatchResult = {
      matches: [],
      spans: [],
      truncated: true,
      totalCount: 500,
    };
    const warnings = getWarnings(".", "g", truncated);
    const w = findWarning(warnings, "excessive-matches");
    expect(w).toBeDefined();
    expect(w!.severity).toBe("warn");
    expect(w!.category).toBe("performance");
  });

  it("does not warn when not truncated", () => {
    const warnings = getWarnings("a");
    expect(findWarning(warnings, "excessive-matches")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Risk score integration
// ---------------------------------------------------------------------------
describe("risk score", () => {
  it("returns 0 for a clean pattern", () => {
    const parseResult = parseRegex("abc", "");
    const { riskScore } = analyzeWarnings("abc", "", parseResult, emptyMatches);
    expect(riskScore).toBe(0);
  });

  it("returns high score for dangerous patterns", () => {
    const parseResult = parseRegex("(a+)+", "");
    const { riskScore } = analyzeWarnings("(a+)+", "", parseResult, emptyMatches);
    expect(riskScore).toBeGreaterThanOrEqual(80);
  });
});

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------
describe("sorting", () => {
  it("sorts warnings by score descending", () => {
    const warnings = getWarnings("(a+)+foo.bar");
    for (let i = 1; i < warnings.length; i++) {
      expect(warnings[i - 1].score).toBeGreaterThanOrEqual(warnings[i].score);
    }
  });
});

// ---------------------------------------------------------------------------
// Category assignment
// ---------------------------------------------------------------------------
describe("category assignment", () => {
  it("assigns performance to nested quantifiers", () => {
    const w = getWarnings("(a+)+").find((w) => w.id === "nested-quantifiers");
    expect(w!.category).toBe("performance");
  });

  it("assigns correctness to unescaped dot", () => {
    const w = getWarnings("foo.bar").find((w) => w.id === "unescaped-dot");
    expect(w!.category).toBe("correctness");
  });

  it("assigns readability to multiline anchors", () => {
    const w = getWarnings("^foo", "m").find((w) => w.id === "multiline-anchors");
    expect(w!.category).toBe("readability");
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
describe("edge cases", () => {
  it("handles empty pattern", () => {
    const warnings = getWarnings("");
    expect(warnings).toEqual([]);
  });

  it("handles pattern with only special chars", () => {
    const warnings = getWarnings(".*+?");
    expect(Array.isArray(warnings)).toBe(true);
  });
});
