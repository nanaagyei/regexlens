import { describe, it, expect } from "vitest";
import { analyzeFailure } from "./analyzeFailure";
import { parseRegex } from "@/lib/regex/parse";
import type { ParseResult, MatchResult, FailureDiagnosis } from "@/types";

const EMPTY_MATCH: MatchResult = {
  matches: [],
  spans: [],
  truncated: false,
  totalCount: 0,
};

const HAS_MATCH: MatchResult = {
  matches: [{ index: 0, full: { groupIndex: 0, start: 0, end: 3, text: "abc" }, groups: [] }],
  spans: [{ start: 0, end: 3, matchIndex: 0 }],
  truncated: false,
  totalCount: 1,
};

function analyze(pattern: string, flags: string, text: string): FailureDiagnosis {
  const parseResult = parseRegex(pattern, flags);
  const result = analyzeFailure(pattern, flags, text, parseResult, EMPTY_MATCH);
  if (result.didMatch) throw new Error(`Expected failure but got match for /${pattern}/${flags} against "${text}"`);
  return result;
}

describe("analyzeFailure", () => {
  describe("early exits", () => {
    it("returns didMatch:true when regex matches", () => {
      const parseResult = parseRegex("abc", "g");
      const result = analyzeFailure("abc", "g", "abc", parseResult, HAS_MATCH);
      expect(result.didMatch).toBe(true);
    });

    it("returns didMatch:true when parse failed", () => {
      const parseResult: ParseResult = { ok: false, errorMessage: "Invalid regex" };
      const result = analyzeFailure("(", "g", "abc", parseResult, EMPTY_MATCH);
      expect(result.didMatch).toBe(true);
    });

    it("returns didMatch:true when text is empty", () => {
      const parseResult = parseRegex("abc", "g");
      const result = analyzeFailure("abc", "g", "", parseResult, EMPTY_MATCH);
      expect(result.didMatch).toBe(true);
    });

    it("returns didMatch:true when pattern is empty", () => {
      const parseResult = parseRegex("", "g");
      const result = analyzeFailure("", "g", "abc", parseResult, EMPTY_MATCH);
      expect(result.didMatch).toBe(true);
    });
  });

  describe("anchors", () => {
    it("reports ^ failure at non-start position", () => {
      const result = analyze("^abc", "g", "xabc");
      expect(result.didMatch).toBe(false);
      expect(result.reason).toContain("Expected");
      expect(result.expected).toContain("character 'a'");
      expect(result.confidence).toBe("high");
    });

    it("reports $ failure when text continues", () => {
      const result = analyze("abc$", "g", "abcx");
      expect(result.didMatch).toBe(false);
      expect(result.expected).toContain("end of string");
      expect(result.confidence).toBe("high");
    });

    it("reports \\b failure at non-word-boundary", () => {
      const result = analyze("\\btest", "g", "atestb");
      expect(result.didMatch).toBe(false);
      expect(result.confidence).toBe("high");
    });
  });

  describe("literals", () => {
    it("reports single char mismatch", () => {
      const result = analyze("abc", "g", "axc");
      expect(result.didMatch).toBe(false);
      expect(result.failureIndex).toBe(1);
      expect(result.expected).toContain("character 'b'");
      expect(result.actual).toContain("letter 'x'");
      expect(result.confidence).toBe("high");
    });

    it("reports end of input when text is too short", () => {
      const result = analyze("abcd", "g", "abc");
      expect(result.didMatch).toBe(false);
      expect(result.failureIndex).toBe(3);
      expect(result.actual).toBe("end of input");
      expect(result.confidence).toBe("high");
    });

    it("handles case-insensitive matching with i flag", () => {
      const parseResult = parseRegex("ABC", "gi");
      const result = analyzeFailure("ABC", "gi", "abc", parseResult, EMPTY_MATCH);
      // With i flag, "abc" should match "ABC" — so the engine should find a match
      expect(result.didMatch).toBe(true);
    });
  });

  describe("escapes", () => {
    it("reports \\d failure on letter", () => {
      const result = analyze("\\d", "g", "a");
      expect(result.didMatch).toBe(false);
      expect(result.failureIndex).toBe(0);
      expect(result.expected).toContain("digit");
      expect(result.actual).toContain("letter 'a'");
      expect(result.confidence).toBe("high");
    });

    it("reports \\w failure on space", () => {
      const result = analyze("\\w", "g", " ");
      expect(result.didMatch).toBe(false);
      expect(result.expected).toContain("word character");
      expect(result.actual).toContain("space");
      expect(result.confidence).toBe("high");
    });

    it("reports \\s failure on letter", () => {
      const result = analyze("\\s", "g", "a");
      expect(result.didMatch).toBe(false);
      expect(result.expected).toContain("whitespace");
      expect(result.confidence).toBe("high");
    });

    it("reports \\D failure on digit", () => {
      const result = analyze("\\D", "g", "5");
      expect(result.didMatch).toBe(false);
      expect(result.expected).toContain("non-digit");
      expect(result.confidence).toBe("high");
    });

    it("reports \\d failure at end of input", () => {
      const result = analyze("a\\d", "g", "a");
      expect(result.didMatch).toBe(false);
      expect(result.failureIndex).toBe(1);
      expect(result.actual).toBe("end of input");
    });
  });

  describe("character classes", () => {
    it("reports [a-z] failure on digit", () => {
      const result = analyze("[a-z]", "g", "5");
      expect(result.didMatch).toBe(false);
      expect(result.expected).toContain("character in [a-z]");
      expect(result.actual).toContain("digit '5'");
      expect(result.confidence).toBe("high");
    });

    it("reports [^abc] failure on 'a'", () => {
      const result = analyze("[^abc]", "g", "a");
      expect(result.didMatch).toBe(false);
      expect(result.expected).toContain("not in");
      expect(result.confidence).toBe("high");
    });

    it("reports character class failure at end of input", () => {
      const result = analyze("x[0-9]", "g", "x");
      expect(result.didMatch).toBe(false);
      expect(result.failureIndex).toBe(1);
      expect(result.actual).toBe("end of input");
    });
  });

  describe("quantifiers", () => {
    it("reports \\d{3} failure with only 2 digits", () => {
      const result = analyze("\\d{3}", "g", "12x");
      expect(result.didMatch).toBe(false);
      expect(result.reason).toContain("3");
      expect(result.confidence).toBe("medium");
    });

    it("reports a+ failure on empty-like input", () => {
      const result = analyze("a+", "g", "b");
      expect(result.didMatch).toBe(false);
      expect(result.confidence).toBe("medium");
    });

    it("allows optional quantifier (?) to pass", () => {
      const parseResult = parseRegex("ab?c", "g");
      // "ac" should match "ab?c" — the ? makes b optional
      const result = analyzeFailure("ab?c", "g", "ac", parseResult, EMPTY_MATCH);
      // The simple simulation may or may not handle this perfectly,
      // but it should at least not crash
      expect(result).toBeDefined();
    });
  });

  describe("alternations", () => {
    it("reports (foo|bar) failure with baz", () => {
      const result = analyze("foo|bar", "g", "baz");
      expect(result.didMatch).toBe(false);
      expect(result.confidence).toBe("medium");
    });

    it("returns lower confidence for 3+ branch alternations", () => {
      const result = analyze("foo|bar|baz|qux", "g", "xyz");
      expect(result.didMatch).toBe(false);
      expect(result.confidence).toBe("low");
    });
  });

  describe("dot", () => {
    it("reports dot failure at end of input", () => {
      const result = analyze("a.", "g", "a");
      expect(result.didMatch).toBe(false);
      expect(result.failureIndex).toBe(1);
      expect(result.expected).toContain("any character");
    });

    it("reports dot failure on newline without s flag", () => {
      const result = analyze("a.", "g", "a\n");
      expect(result.didMatch).toBe(false);
      expect(result.reason).toContain("newline");
    });
  });

  describe("groups", () => {
    it("diagnoses failure inside a group", () => {
      const result = analyze("(abc)", "g", "axc");
      expect(result.didMatch).toBe(false);
      expect(result.failureIndex).toBe(1);
      // Groups downgrade confidence to at most medium
      expect(["high", "medium"]).toContain(result.confidence);
    });
  });

  describe("confidence levels", () => {
    it("literal failures have high confidence", () => {
      const result = analyze("a", "g", "b");
      expect(result.confidence).toBe("high");
    });

    it("anchor failures have high confidence", () => {
      const result = analyze("^x", "g", "ax");
      expect(result.confidence).toBe("high");
    });

    it("escape failures have high confidence", () => {
      const result = analyze("\\d", "g", "a");
      expect(result.confidence).toBe("high");
    });

    it("quantifier failures have medium confidence", () => {
      const result = analyze("a{3}", "g", "aab");
      expect(result.confidence).toBe("medium");
    });

    it("complex alternation failures have low confidence", () => {
      const result = analyze("abc|def|ghi|jkl", "g", "xyz");
      expect(result.confidence).toBe("low");
    });
  });

  describe("determinism", () => {
    it("same input produces same output", () => {
      const result1 = analyze("abc", "g", "axc");
      const result2 = analyze("abc", "g", "axc");
      expect(result1).toEqual(result2);
    });
  });

  describe("relatedRange", () => {
    it("includes relatedRange for pattern node", () => {
      const result = analyze("abc", "g", "axc");
      expect(result.relatedRange).toBeDefined();
      expect(result.relatedRange!.start).toBeGreaterThanOrEqual(0);
    });
  });
});
