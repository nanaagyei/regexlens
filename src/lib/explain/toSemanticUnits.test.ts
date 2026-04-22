import { describe, it, expect } from "vitest";
import { parseRegex } from "@/lib/regex/parse";
import { toSemanticUnits } from "./toSemanticUnits";
import type { SemanticUnit } from "@/types/explain";

/** Helper: parse a pattern and convert to semantic units */
function units(pattern: string, flags = ""): SemanticUnit[] {
  const result = parseRegex(pattern, flags);
  if (!result.ok) throw new Error(`Parse failed: ${pattern}`);
  return toSemanticUnits(result.normalized);
}

describe("toSemanticUnits", () => {
  describe("literal merging", () => {
    it("merges adjacent literals into a single TextUnit", () => {
      const u = units("abc");
      expect(u).toHaveLength(1);
      expect(u[0].type).toBe("text");
      if (u[0].type === "text") {
        expect(u[0].value).toBe("abc");
      }
    });

    it("preserves merged range spanning all characters", () => {
      const u = units("abc");
      expect(u[0].range.start).toBe(0);
      expect(u[0].range.end).toBe(3);
    });

    it("produces a single TextUnit for a single literal", () => {
      const u = units("a");
      expect(u).toHaveLength(1);
      expect(u[0].type).toBe("text");
    });
  });

  describe("anchors", () => {
    it("converts ^ and $ to AnchorUnits", () => {
      const u = units("^abc$");
      expect(u).toHaveLength(3);
      expect(u[0].type).toBe("anchor");
      if (u[0].type === "anchor") {
        expect(u[0].anchorKind).toBe("start");
      }
      expect(u[1].type).toBe("text");
      expect(u[2].type).toBe("anchor");
      if (u[2].type === "anchor") {
        expect(u[2].anchorKind).toBe("end");
      }
    });

    it("converts word boundary anchors", () => {
      const u = units("\\b");
      expect(u).toHaveLength(1);
      expect(u[0].type).toBe("anchor");
      if (u[0].type === "anchor") {
        expect(u[0].anchorKind).toBe("wordBoundary");
      }
    });
  });

  describe("quantifier absorption", () => {
    it("absorbs escape into QuantifiedUnit for \\d{2}", () => {
      const u = units("\\d{2}");
      expect(u).toHaveLength(1);
      expect(u[0].type).toBe("quantified");
      if (u[0].type === "quantified") {
        expect(u[0].min).toBe(2);
        expect(u[0].max).toBe(2);
        expect(u[0].target.kind).toBe("escape");
        if (u[0].target.kind === "escape") {
          expect(u[0].target.escapeType).toBe("digit");
        }
      }
    });

    it("absorbs character class into QuantifiedUnit for [A-Z]{2,4}", () => {
      const u = units("[A-Z]{2,4}");
      expect(u).toHaveLength(1);
      expect(u[0].type).toBe("quantified");
      if (u[0].type === "quantified") {
        expect(u[0].min).toBe(2);
        expect(u[0].max).toBe(4);
        expect(u[0].target.kind).toBe("charClass");
      }
    });

    it("absorbs literal into QuantifiedUnit for a+", () => {
      const u = units("a+");
      expect(u).toHaveLength(1);
      expect(u[0].type).toBe("quantified");
      if (u[0].type === "quantified") {
        expect(u[0].min).toBe(1);
        expect(u[0].max).toBe(null);
        expect(u[0].target.kind).toBe("text");
      }
    });

    it("preserves greedy=false for lazy quantifiers", () => {
      const u = units("a*?");
      expect(u).toHaveLength(1);
      if (u[0].type === "quantified") {
        expect(u[0].greedy).toBe(false);
        expect(u[0].min).toBe(0);
        expect(u[0].max).toBe(null);
      }
    });

    it("absorbs dot into QuantifiedUnit for .+", () => {
      const u = units(".+");
      expect(u).toHaveLength(1);
      if (u[0].type === "quantified") {
        expect(u[0].target.kind).toBe("dot");
      }
    });
  });

  describe("groups", () => {
    it("converts named capture group with body", () => {
      const u = units("(?<code>[A-Z]{2})-\\1");
      expect(u).toHaveLength(3);

      // Named group
      expect(u[0].type).toBe("group");
      if (u[0].type === "group") {
        expect(u[0].name).toBe("code");
        expect(u[0].capturing).toBe(true);
        expect(u[0].body).toHaveLength(1);
        expect(u[0].body[0].type).toBe("quantified");
      }

      // Literal "-"
      expect(u[1].type).toBe("text");
      if (u[1].type === "text") {
        expect(u[1].value).toBe("-");
      }

      // Backreference
      expect(u[2].type).toBe("backreference");
    });

    it("converts non-capturing group", () => {
      const u = units("(?:abc)");
      expect(u).toHaveLength(1);
      expect(u[0].type).toBe("group");
      if (u[0].type === "group") {
        expect(u[0].capturing).toBe(false);
        expect(u[0].body).toHaveLength(1);
        expect(u[0].body[0].type).toBe("text");
      }
    });
  });

  describe("alternation", () => {
    it("converts (cat|dog) into group containing alternation", () => {
      const u = units("(cat|dog)");
      expect(u).toHaveLength(1);
      expect(u[0].type).toBe("group");
      if (u[0].type === "group") {
        expect(u[0].body).toHaveLength(1);
        expect(u[0].body[0].type).toBe("alternation");
        if (u[0].body[0].type === "alternation") {
          expect(u[0].body[0].branches).toHaveLength(2);
          expect(u[0].body[0].branches[0]).toHaveLength(1);
          expect(u[0].body[0].branches[0][0].type).toBe("text");
          if (u[0].body[0].branches[0][0].type === "text") {
            expect(u[0].body[0].branches[0][0].value).toBe("cat");
          }
        }
      }
    });
  });

  describe("assertions", () => {
    it("converts (?=foo)bar into assertion + text", () => {
      const u = units("(?=foo)bar");
      expect(u).toHaveLength(2);

      expect(u[0].type).toBe("assertion");
      if (u[0].type === "assertion") {
        expect(u[0].assertionType).toBe("lookahead");
        expect(u[0].polarity).toBe("positive");
        expect(u[0].body).toHaveLength(1);
        if (u[0].body[0].type === "text") {
          expect(u[0].body[0].value).toBe("foo");
        }
      }

      expect(u[1].type).toBe("text");
      if (u[1].type === "text") {
        expect(u[1].value).toBe("bar");
      }
    });

    it("converts negative lookbehind", () => {
      const u = units("(?<!foo)bar");
      expect(u[0].type).toBe("assertion");
      if (u[0].type === "assertion") {
        expect(u[0].assertionType).toBe("lookbehind");
        expect(u[0].polarity).toBe("negative");
      }
    });
  });

  describe("negated character class", () => {
    it("converts [^abc] to negated CharClassUnit", () => {
      const u = units("[^abc]");
      expect(u).toHaveLength(1);
      expect(u[0].type).toBe("charClass");
      if (u[0].type === "charClass") {
        expect(u[0].negated).toBe(true);
        expect(u[0].members).toHaveLength(3);
      }
    });
  });

  describe("dot", () => {
    it("converts standalone dot", () => {
      const u = units("a.b");
      expect(u).toHaveLength(3);
      expect(u[0].type).toBe("text");
      expect(u[1].type).toBe("dot");
      expect(u[2].type).toBe("text");
    });
  });

  describe("escape sequences", () => {
    it("converts \\d to EscapeUnit", () => {
      const u = units("\\d");
      expect(u).toHaveLength(1);
      expect(u[0].type).toBe("escape");
      if (u[0].type === "escape") {
        expect(u[0].escapeType).toBe("digit");
      }
    });

    it("converts \\w to EscapeUnit", () => {
      const u = units("\\w");
      expect(u[0].type).toBe("escape");
      if (u[0].type === "escape") {
        expect(u[0].escapeType).toBe("word");
      }
    });
  });

  describe("backreferences", () => {
    it("converts numeric backreference", () => {
      const u = units("(a)\\1");
      expect(u).toHaveLength(2);
      expect(u[1].type).toBe("backreference");
      if (u[1].type === "backreference") {
        expect(u[1].groupNumber).toBe(1);
      }
    });
  });

  describe("determinism", () => {
    const fixtures = [
      "^abc$",
      "\\d{2}",
      "[A-Z]{2,4}",
      "(?<code>[A-Z]{2})-\\1",
      "(cat|dog)",
      "(?=foo)bar",
      "[^abc]",
    ];

    for (const pattern of fixtures) {
      it(`produces identical output for "${pattern}" across two runs`, () => {
        const a = JSON.stringify(units(pattern));
        const b = JSON.stringify(units(pattern));
        expect(a).toBe(b);
      });
    }
  });
});
