import { describe, it, expect } from "vitest";
import { parseRegex } from "@/lib/regex/parse";
import { toSemanticUnits } from "./toSemanticUnits";
import { formatSimple } from "./formatSimple";
import type { ExplanationStep } from "@/types/explain";

/** Helper: parse → semantic units → simple format */
function simple(pattern: string, flags = ""): ExplanationStep[] {
  const result = parseRegex(pattern, flags);
  if (!result.ok) throw new Error(`Parse failed: ${pattern}`);
  return formatSimple(toSemanticUnits(result.normalized));
}

function labels(steps: ExplanationStep[]): string[] {
  return steps.map((s) => s.label);
}

describe("formatSimple", () => {
  describe("fixture: ^abc$", () => {
    it("produces anchor + text + anchor", () => {
      const l = labels(simple("^abc$"));
      expect(l).toEqual([
        "Start of text",
        'The text "abc"',
        "End of text",
      ]);
    });
  });

  describe("fixture: \\d{2}", () => {
    it("produces a single fused quantifier step", () => {
      const l = labels(simple("\\d{2}"));
      expect(l).toEqual(["Exactly 2 digits"]);
    });
  });

  describe("fixture: [A-Z]{2,4}", () => {
    it("produces a single fused quantifier step with char class", () => {
      const l = labels(simple("[A-Z]{2,4}"));
      expect(l).toHaveLength(1);
      expect(l[0]).toContain("Between 2 and 4");
      expect(l[0]).toContain("A-Z");
    });
  });

  describe("fixture: (?<code>[A-Z]{2})-\\1", () => {
    it("produces capture group, text, and backreference", () => {
      const steps = simple("(?<code>[A-Z]{2})-\\1");
      const l = labels(steps);

      expect(l[0]).toBe('Capture as "code"');
      // Group body: quantified char class
      expect(l[1]).toContain("Exactly 2");

      // Literal "-"
      expect(l).toContain('The letter "-"');

      // Backreference
      const backref = l.find((s) => s.includes("Same text"));
      expect(backref).toBeDefined();
    });
  });

  describe("fixture: (cat|dog)", () => {
    it("produces group with alternation branches", () => {
      const steps = simple("(cat|dog)");
      const l = labels(steps);

      expect(l[0]).toContain("Capture group");
      expect(l).toContain("Either");
      expect(l).toContain("Option 1:");
      expect(l).toContain("Option 2:");
      expect(l).toContain('The text "cat"');
      expect(l).toContain('The text "dog"');
    });
  });

  describe("fixture: (?=foo)bar", () => {
    it("produces lookahead followed by text", () => {
      const steps = simple("(?=foo)bar");
      const l = labels(steps);

      expect(l[0]).toBe("Followed by");
      expect(l).toContain('The text "foo"');
      expect(l).toContain('The text "bar"');
    });
  });

  describe("fixture: [^abc]", () => {
    it("produces negated character class", () => {
      const l = labels(simple("[^abc]"));
      expect(l).toHaveLength(1);
      expect(l[0]).toContain("Any character except:");
      expect(l[0]).toContain("a");
      expect(l[0]).toContain("b");
      expect(l[0]).toContain("c");
    });
  });

  describe("literal merge", () => {
    it("merges single-char literals to text", () => {
      const l = labels(simple("hello"));
      expect(l).toEqual(['The text "hello"']);
    });

    it("handles single character as letter", () => {
      const l = labels(simple("a"));
      expect(l).toEqual(['The letter "a"']);
    });
  });

  describe("quantifier phrasing", () => {
    it("\\d+ → One or more digits", () => {
      expect(labels(simple("\\d+"))).toEqual(["One or more digits"]);
    });

    it("\\w* → Zero or more word characters", () => {
      expect(labels(simple("\\w*"))).toEqual([
        "Zero or more word characters",
      ]);
    });

    it("a? → Optional \"a\"", () => {
      expect(labels(simple("a?"))).toEqual(['Optional "a"']);
    });

    it("\\d{3,} → 3 or more digits", () => {
      expect(labels(simple("\\d{3,}"))).toEqual(["3 or more digits"]);
    });
  });

  describe("lookahead and lookbehind phrasing", () => {
    it("negative lookahead", () => {
      const l = labels(simple("(?!foo)bar"));
      expect(l[0]).toBe("Not followed by");
    });

    it("positive lookbehind", () => {
      const l = labels(simple("(?<=foo)bar"));
      expect(l[0]).toBe("Preceded by");
    });

    it("negative lookbehind", () => {
      const l = labels(simple("(?<!foo)bar"));
      expect(l[0]).toBe("Not preceded by");
    });
  });

  describe("negated class phrasing", () => {
    it("[^0-9] uses 'except' phrasing", () => {
      const l = labels(simple("[^0-9]"));
      expect(l[0]).toContain("Any character except:");
      expect(l[0]).toContain("0-9");
    });
  });

  describe("backreference phrasing", () => {
    it("named backreference", () => {
      const steps = simple("(?<name>\\w+)-\\k<name>");
      const l = labels(steps);
      const backref = l.find((s) => s.includes("Same text"));
      expect(backref).toContain('"name"');
    });
  });

  describe("non-capturing group suppression", () => {
    it("suppresses non-capturing group in simple mode", () => {
      const l = labels(simple("(?:abc)"));
      expect(l).toEqual(['The text "abc"']);
      // No group step present
      expect(l.some((s) => s.includes("group"))).toBe(false);
    });

    it("re-merges literals after suppression", () => {
      const l = labels(simple("a(?:bc)d"));
      expect(l).toEqual(['The text "abcd"']);
    });
  });

  describe("range preservation", () => {
    it("every step has a valid range", () => {
      const patterns = ["^abc$", "\\d{2}", "[A-Z]{2,4}", "(cat|dog)"];
      for (const pattern of patterns) {
        const steps = simple(pattern);
        for (const step of steps) {
          expect(step.range).toBeDefined();
          expect(step.range!.start).toBeGreaterThanOrEqual(0);
          expect(step.range!.end).toBeGreaterThan(step.range!.start);
        }
      }
    });
  });

  describe("depth correctness", () => {
    it("group children have depth 1", () => {
      const steps = simple("(abc)");
      // First step: group at depth 0
      expect(steps[0].depth).toBe(0);
      // Body step: text at depth 1
      expect(steps[1].depth).toBe(1);
    });

    it("assertion body has depth 1", () => {
      const steps = simple("(?=foo)");
      expect(steps[0].depth).toBe(0);
      expect(steps[1].depth).toBe(1);
    });
  });

  describe("mode-specific: simple does not show greedy/lazy", () => {
    it("lazy quantifier has no lazy note in simple mode", () => {
      const steps = simple("a+?");
      expect(steps[0].detail).toBeUndefined();
      expect(steps[0].label).not.toContain("lazy");
      expect(steps[0].label).not.toContain("Lazy");
    });
  });
});
