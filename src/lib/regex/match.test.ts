import { describe, it, expect } from "vitest";
import { computeMatches, getMatchColorClass, computeSingleExecWithLastIndex } from "./match";
import { REGEX_CONFIG } from "@/types";

describe("computeMatches", () => {
  describe("empty / early exit", () => {
    it("returns empty when pattern is empty", () => {
      const r = computeMatches("", "g", "foo");
      expect(r.totalCount).toBe(0);
      expect(r.matches).toHaveLength(0);
      expect(r.spans).toHaveLength(0);
    });

    it("returns empty when text is empty", () => {
      const r = computeMatches("\\d+", "g", "");
      expect(r.totalCount).toBe(0);
    });

    it("returns empty when both are empty", () => {
      const r = computeMatches("", "", "");
      expect(r.totalCount).toBe(0);
    });
  });

  describe("global and non-global matching", () => {
    it("finds all matches with explicit global flag", () => {
      const r = computeMatches("\\d+", "g", "a12b3c456");
      expect(r.totalCount).toBe(3);
      expect(r.matches.map((m) => m.full.text)).toEqual(["12", "3", "456"]);
    });

    it("forces global flag when not provided", () => {
      const r = computeMatches("\\d+", "", "a12b3");
      expect(r.totalCount).toBe(2);
      expect(r.matches).toHaveLength(2);
      expect(r.matches[0]?.full.text).toBe("12");
      expect(r.matches[1]?.full.text).toBe("3");
    });

    it("preserves other flags alongside forced global", () => {
      const r = computeMatches("hello", "i", "Hello HELLO hello");
      expect(r.totalCount).toBe(3);
    });

    it("returns no matches when pattern does not match", () => {
      const r = computeMatches("xyz", "g", "abc def");
      expect(r.totalCount).toBe(0);
      expect(r.matches).toHaveLength(0);
    });
  });

  describe("span positions", () => {
    it("reports correct start and end for each match", () => {
      const r = computeMatches("\\w+", "g", "foo bar");
      expect(r.spans).toEqual([
        { start: 0, end: 3, matchIndex: 0 },
        { start: 4, end: 7, matchIndex: 1 },
      ]);
    });

    it("full match span matches spans array", () => {
      const r = computeMatches("\\d+", "g", "x12y34z");
      for (let i = 0; i < r.matches.length; i++) {
        expect(r.matches[i].full.start).toBe(r.spans[i].start);
        expect(r.matches[i].full.end).toBe(r.spans[i].end);
        expect(r.spans[i].matchIndex).toBe(i);
      }
    });
  });

  describe("capture groups", () => {
    it("extracts numbered capture groups", () => {
      const r = computeMatches("(\\d+)-(\\w+)", "g", "123-abc");
      expect(r.matches).toHaveLength(1);
      const m = r.matches[0];
      expect(m.groups).toHaveLength(2);
      expect(m.groups[0].text).toBe("123");
      expect(m.groups[0].groupIndex).toBe(1);
      expect(m.groups[1].text).toBe("abc");
      expect(m.groups[1].groupIndex).toBe(2);
    });

    it("handles non-participating groups", () => {
      // In "a|b", group 2 won't participate when "a" matches
      const r = computeMatches("(a)|(b)", "g", "a");
      expect(r.matches).toHaveLength(1);
      const m = r.matches[0];
      expect(m.groups).toHaveLength(2);
      expect(m.groups[0].text).toBe("a");
      // Group 2 did not participate
      expect(m.groups[1].text).toBe("");
      expect(m.groups[1].start).toBe(-1);
      expect(m.groups[1].end).toBe(-1);
    });

    it("handles nested groups", () => {
      const r = computeMatches("((\\d+)-(\\w+))", "g", "42-hi");
      expect(r.matches).toHaveLength(1);
      const m = r.matches[0];
      expect(m.groups[0].text).toBe("42-hi"); // outer group
      expect(m.groups[1].text).toBe("42"); // inner \d+
      expect(m.groups[2].text).toBe("hi"); // inner \w+
    });

    it("extracts groups from multiple matches", () => {
      const r = computeMatches("(\\d+)", "g", "a1b22c333");
      expect(r.matches).toHaveLength(3);
      expect(r.matches[0].groups[0].text).toBe("1");
      expect(r.matches[1].groups[0].text).toBe("22");
      expect(r.matches[2].groups[0].text).toBe("333");
    });
  });

  describe("named groups", () => {
    it("populates namedGroups map", () => {
      const r = computeMatches("(?<year>\\d{4})-(?<month>\\d{2})", "g", "2024-01");
      expect(r.matches).toHaveLength(1);
      const m = r.matches[0];
      expect(m.namedGroups).toBeDefined();
      expect(m.namedGroups!["year"].text).toBe("2024");
      expect(m.namedGroups!["month"].text).toBe("01");
    });

    it("includes named groups in numbered groups too", () => {
      const r = computeMatches("(?<name>\\w+)", "g", "hello");
      expect(r.matches[0].groups[0].text).toBe("hello");
      expect(r.matches[0].namedGroups!["name"].text).toBe("hello");
    });

    it("handles pattern with no named groups", () => {
      const r = computeMatches("(\\d+)", "g", "42");
      expect(r.matches[0].namedGroups).toBeUndefined();
    });
  });

  describe("text size cap", () => {
    it("truncates text beyond MAX_TEXT_LENGTH", () => {
      const longText = "a".repeat(REGEX_CONFIG.MAX_TEXT_LENGTH + 100);
      const r = computeMatches("a", "g", longText);
      // Should only match up to MAX_TEXT_LENGTH
      expect(r.totalCount).toBe(REGEX_CONFIG.MAX_TEXT_LENGTH);
      expect(r.truncated).toBe(true);
      expect(r.sampleTruncated).toBe(true);
      expect(r.matchLimitReached).toBe(true);
    });

    it("does not truncate text within limit", () => {
      const text = "abc";
      const r = computeMatches(".", "g", text);
      expect(r.totalCount).toBe(3);
      expect(r.truncated).toBe(false);
    });
  });

  describe("match count cap", () => {
    it("caps stored matches at MAX_MATCHES", () => {
      const text = "a".repeat(REGEX_CONFIG.MAX_MATCHES + 500);
      const r = computeMatches("a", "g", text);
      expect(r.matches).toHaveLength(REGEX_CONFIG.MAX_MATCHES);
      expect(r.spans).toHaveLength(REGEX_CONFIG.MAX_MATCHES);
      expect(r.totalCount).toBe(REGEX_CONFIG.MAX_MATCHES + 500);
      expect(r.truncated).toBe(true);
      expect(r.matchLimitReached).toBe(true);
      expect(r.sampleTruncated).toBe(false);
    });

    it("does not set truncated when under limit", () => {
      const r = computeMatches("\\d", "g", "123");
      expect(r.truncated).toBe(false);
      expect(r.sampleTruncated).toBe(false);
      expect(r.matchLimitReached).toBe(false);
      expect(r.totalCount).toBe(3);
    });
  });

  describe("zero-width matches", () => {
    it("handles zero-width lookahead without infinite loop", () => {
      const r = computeMatches("(?=a)", "g", "aaa");
      // Should find positions but not hang
      expect(r.totalCount).toBeGreaterThan(0);
      expect(r.error).toBeUndefined();
    });

    it("handles empty pattern without infinite loop", () => {
      // Empty string matches everywhere - should terminate
      const r = computeMatches("(?:)", "g", "ab");
      expect(r.error).toBeUndefined();
      expect(r.totalCount).toBeGreaterThan(0);
    });
  });

  describe("error handling", () => {
    it("returns error for invalid regex", () => {
      const r = computeMatches("[", "g", "test");
      expect(r.error).toBeDefined();
      expect(r.matches).toHaveLength(0);
      expect(r.totalCount).toBe(0);
    });

    it("does not return error for valid regex with no matches", () => {
      const r = computeMatches("xyz", "g", "abc");
      expect(r.error).toBeUndefined();
    });
  });

  describe("case-insensitive flag", () => {
    it("matches case-insensitively with i flag", () => {
      const r = computeMatches("abc", "gi", "ABC abc Abc");
      expect(r.totalCount).toBe(3);
    });
  });

  describe("multiline flag", () => {
    it("anchors match per-line with m flag", () => {
      const r = computeMatches("^\\w+", "gm", "foo\nbar\nbaz");
      expect(r.totalCount).toBe(3);
      expect(r.matches.map((m) => m.full.text)).toEqual(["foo", "bar", "baz"]);
    });
  });
});

describe("getMatchColorClass", () => {
  it("cycles through 6 colors", () => {
    const classes = new Set<string>();
    for (let i = 0; i < 6; i++) {
      classes.add(getMatchColorClass(i));
    }
    expect(classes.size).toBe(6);
  });

  it("wraps around after 6", () => {
    expect(getMatchColorClass(0)).toBe(getMatchColorClass(6));
    expect(getMatchColorClass(1)).toBe(getMatchColorClass(7));
  });

  it("returns active variant when active=true", () => {
    const base = getMatchColorClass(0);
    const active = getMatchColorClass(0, true);
    expect(active).toBe(`${base}-active`);
  });

  it("returns non-active variant by default", () => {
    const cls = getMatchColorClass(0);
    expect(cls).not.toContain("-active");
  });
});

describe("computeSingleExecWithLastIndex", () => {
  it("matches at given lastIndex with sticky flag", () => {
    const r = computeSingleExecWithLastIndex("\\d+", "gy", "abc123def", 3);
    expect(r.totalCount).toBe(1);
    expect(r.matches[0].full.text).toBe("123");
    expect(r.matches[0].full.start).toBe(3);
  });

  it("returns empty when no match at lastIndex", () => {
    const r = computeSingleExecWithLastIndex("\\d+", "gy", "abc123def", 0);
    expect(r.totalCount).toBe(0);
    expect(r.matches).toHaveLength(0);
  });

  it("returns error for invalid pattern", () => {
    const r = computeSingleExecWithLastIndex("[", "g", "test", 0);
    expect(r.error).toBe("Invalid pattern");
  });
});
