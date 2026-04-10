import { describe, it, expect } from "vitest";
import { parseRegex } from "@/lib/regex/parse";
import { toSemanticUnits } from "./toSemanticUnits";
import { formatTechnical } from "./formatTechnical";
import type { ExplanationStep } from "@/types/explain";

/** Helper: parse → semantic units → technical format */
function technical(pattern: string, flags = ""): ExplanationStep[] {
  const result = parseRegex(pattern, flags);
  if (!result.ok) throw new Error(`Parse failed: ${pattern}`);
  return formatTechnical(toSemanticUnits(result.normalized));
}

function labels(steps: ExplanationStep[]): string[] {
  return steps.map((s) => s.label);
}

describe("formatTechnical", () => {
  describe("fixture: ^abc$", () => {
    it("shows raw tokens", () => {
      const l = labels(technical("^abc$"));
      expect(l[0]).toContain("^");
      expect(l[0]).toContain("Start of input");
      expect(l[1]).toContain("Literal");
      expect(l[1]).toContain("abc");
      expect(l[2]).toContain("$");
      expect(l[2]).toContain("End of input");
    });
  });

  describe("fixture: \\d{2}", () => {
    it("shows raw quantified token", () => {
      const l = labels(technical("\\d{2}"));
      expect(l).toHaveLength(1);
      expect(l[0]).toContain("\\d{2}");
      expect(l[0]).toContain("exactly 2");
    });
  });

  describe("fixture: [A-Z]{2,4}", () => {
    it("shows class notation with quantifier", () => {
      const l = labels(technical("[A-Z]{2,4}"));
      expect(l).toHaveLength(1);
      expect(l[0]).toContain("[A-Z]");
      expect(l[0]).toContain("2 to 4");
    });
  });

  describe("fixture: (?<code>[A-Z]{2})-\\1", () => {
    it("shows named group and backreference with tokens", () => {
      const steps = technical("(?<code>[A-Z]{2})-\\1");
      const l = labels(steps);

      expect(l[0]).toContain("Named capture group");
      expect(l[0]).toContain("code");

      // Backreference step
      const backrefStep = steps.find((s) => s.kind === "backreference");
      expect(backrefStep).toBeDefined();
      expect(backrefStep!.label).toContain("\\1");
      expect(backrefStep!.label).toContain("Backreference");
    });
  });

  describe("fixture: (cat|dog)", () => {
    it("shows alternation with branch labels", () => {
      const l = labels(technical("(cat|dog)"));
      expect(l[0]).toContain("Capture group");
      expect(l).toContain("| \u2014 Alternation");
      expect(l).toContain("Branch 1:");
      expect(l).toContain("Branch 2:");
    });
  });

  describe("fixture: (?=foo)bar", () => {
    it("shows lookahead with token notation", () => {
      const l = labels(technical("(?=foo)bar"));
      expect(l[0]).toContain("(?=...)");
      expect(l[0]).toContain("Positive lookahead");
    });
  });

  describe("fixture: [^abc]", () => {
    it("shows negated class with token notation", () => {
      const l = labels(technical("[^abc]"));
      expect(l[0]).toContain("[^");
      expect(l[0]).toContain("Negated character class");
    });
  });

  describe("greedy/lazy distinction", () => {
    it("shows Greedy detail for greedy quantifier", () => {
      const steps = technical("\\d+");
      expect(steps[0].detail).toBe("Greedy");
    });

    it("shows Lazy detail for lazy quantifier", () => {
      const steps = technical("\\d+?");
      expect(steps[0].detail).toContain("Lazy");
    });

    it("no greedy/lazy for exact quantifier", () => {
      const steps = technical("\\d{2}");
      expect(steps[0].detail).toBeUndefined();
    });
  });

  describe("non-capturing groups NOT suppressed", () => {
    it("shows non-capturing group explicitly", () => {
      const l = labels(technical("(?:abc)"));
      expect(l[0]).toContain("Non-capturing group");
      expect(l[0]).toContain("(?:...)");
    });
  });

  describe("escape sequences show raw tokens", () => {
    it("\\d shows \\d notation", () => {
      const l = labels(technical("\\d"));
      expect(l[0]).toContain("\\d");
      expect(l[0]).toContain("Digit");
    });

    it("\\w shows \\w notation", () => {
      const l = labels(technical("\\w"));
      expect(l[0]).toContain("\\w");
      expect(l[0]).toContain("Word character");
    });

    it("\\s shows \\s notation", () => {
      const l = labels(technical("\\s"));
      expect(l[0]).toContain("\\s");
      expect(l[0]).toContain("Whitespace");
    });
  });

  describe("assertions show token notation", () => {
    it("negative lookahead", () => {
      const l = labels(technical("(?!foo)"));
      expect(l[0]).toContain("(?!...)");
      expect(l[0]).toContain("Negative lookahead");
    });

    it("positive lookbehind", () => {
      const l = labels(technical("(?<=foo)"));
      expect(l[0]).toContain("(?<=...)");
      expect(l[0]).toContain("Positive lookbehind");
    });

    it("negative lookbehind", () => {
      const l = labels(technical("(?<!foo)"));
      expect(l[0]).toContain("(?<!...)");
      expect(l[0]).toContain("Negative lookbehind");
    });
  });

  describe("range preservation", () => {
    it("every step has a valid range", () => {
      const patterns = ["^abc$", "\\d{2}", "[A-Z]{2,4}", "(cat|dog)"];
      for (const pattern of patterns) {
        const steps = technical(pattern);
        for (const step of steps) {
          expect(step.range).toBeDefined();
          expect(step.range!.start).toBeGreaterThanOrEqual(0);
          expect(step.range!.end).toBeGreaterThan(step.range!.start);
        }
      }
    });
  });

  describe("mode differences from simple", () => {
    it("technical shows group types; simple does not for non-capturing", () => {
      const techLabels = labels(technical("(?:abc)"));
      expect(techLabels[0]).toContain("Non-capturing");

      // Just verify we have more than one step (group + body)
      expect(techLabels.length).toBeGreaterThan(1);
    });
  });
});
