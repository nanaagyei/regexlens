import { describe, it, expect } from "vitest";
import { parseRegex } from "./parse";
import type { ComparableNode } from "@/types/ast";

/** Helper: parse pattern and return normalized tree (asserts parse success). */
function norm(pattern: string, flags = ""): ComparableNode {
  const result = parseRegex(pattern, flags);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("parse failed");
  return result.normalized;
}

/** Helper: get the flat children of the root → first alternative. */
function topChildren(pattern: string): ComparableNode[] {
  const tree = norm(pattern);
  expect(tree.type).toBe("pattern");
  // Root typically has one alternative child holding the expressions
  if (tree.children.length === 1 && tree.children[0].type === "alternative") {
    return tree.children[0].children;
  }
  return tree.children;
}

// ── Anchors ────────────────────────────────────────────────────

describe("normalizeAst — anchors", () => {
  it("normalizes ^ to anchor:start", () => {
    const kids = topChildren("^abc$");
    const start = kids[0];
    expect(start.type).toBe("anchor");
    expect(start.key).toBe("anchor:start");
    expect(start.props).toEqual({ kind: "start" });
  });

  it("normalizes $ to anchor:end", () => {
    const kids = topChildren("^abc$");
    const end = kids[kids.length - 1];
    expect(end.type).toBe("anchor");
    expect(end.key).toBe("anchor:end");
    expect(end.props).toEqual({ kind: "end" });
  });

  it("normalizes \\b to anchor:wordBoundary", () => {
    const kids = topChildren("\\bfoo\\b");
    expect(kids[0].type).toBe("anchor");
    expect(kids[0].key).toBe("anchor:wordBoundary");
    expect(kids[0].props).toEqual({ kind: "wordBoundary" });
  });
});

// ── Literals ───────────────────────────────────────────────────

describe("normalizeAst — literals", () => {
  it("normalizes plain characters as literal nodes", () => {
    const kids = topChildren("abc");
    expect(kids).toHaveLength(3);
    expect(kids[0].type).toBe("literal");
    expect(kids[0].key).toBe("literal:a");
    expect(kids[0].props).toEqual({ value: "a" });
    expect(kids[1].key).toBe("literal:b");
    expect(kids[2].key).toBe("literal:c");
  });

  it("preserves source ranges for literals", () => {
    const kids = topChildren("abc");
    expect(kids[0].range).toBeDefined();
    expect(kids[0].range!.start).toBe(0);
    expect(kids[0].range!.end).toBe(1);
    expect(kids[2].range!.start).toBe(2);
    expect(kids[2].range!.end).toBe(3);
  });
});

// ── Dot ────────────────────────────────────────────────────────

describe("normalizeAst — dot", () => {
  it("normalizes . as dot node", () => {
    const kids = topChildren("a.b");
    expect(kids[1].type).toBe("dot");
    expect(kids[1].key).toBe("dot");
  });
});

// ── Escapes ────────────────────────────────────────────────────

describe("normalizeAst — escapes", () => {
  it("normalizes \\d as escape:digit", () => {
    const kids = topChildren("\\d");
    expect(kids[0].type).toBe("escape");
    expect(kids[0].key).toBe("escape:digit");
    expect(kids[0].props).toEqual({ escapeType: "digit", raw: "\\d" });
  });

  it("normalizes \\w as escape:word", () => {
    const kids = topChildren("\\w");
    expect(kids[0].key).toBe("escape:word");
  });

  it("normalizes \\s as escape:whitespace", () => {
    const kids = topChildren("\\s");
    expect(kids[0].key).toBe("escape:whitespace");
  });

  it("normalizes \\t as escape:tab", () => {
    const kids = topChildren("\\t");
    expect(kids[0].key).toBe("escape:tab");
  });

  it("normalizes escaped dot \\. as escape:other with distinct key", () => {
    const kids = topChildren("\\.");
    expect(kids[0].type).toBe("escape");
    expect(kids[0].key).toBe("escape:other:\\.");
  });

  it("keeps distinct keys for different escape:other sequences", () => {
    const dot = topChildren("\\.")[0];
    const plus = topChildren("\\+")[0];
    expect(dot.key).not.toBe(plus.key);
    expect(dot.key).toBe("escape:other:\\.");
    expect(plus.key).toBe("escape:other:\\+");
  });
});

// ── Character classes ──────────────────────────────────────────

describe("normalizeAst — character classes", () => {
  it("normalizes [A-Za-z0-9_]", () => {
    const kids = topChildren("[A-Za-z0-9_]");
    expect(kids).toHaveLength(1);
    const cc = kids[0];
    expect(cc.type).toBe("charClass");
    expect(cc.props).toMatchObject({ negated: false });

    const members = (cc.props as { members: unknown[] }).members;
    // 3 ranges + 1 literal
    expect(members).toHaveLength(4);
    expect(members[0]).toEqual({ type: "range", from: "A", to: "Z" });
    expect(members[1]).toEqual({ type: "range", from: "a", to: "z" });
    expect(members[2]).toEqual({ type: "range", from: "0", to: "9" });
    expect(members[3]).toEqual({ type: "literal", value: "_" });
  });

  it("normalizes negated class [^abc]", () => {
    const kids = topChildren("[^abc]");
    const cc = kids[0];
    expect(cc.type).toBe("charClass");
    expect((cc.props as { negated: boolean }).negated).toBe(true);
  });
});

// ── Groups ─────────────────────────────────────────────────────

describe("normalizeAst — groups", () => {
  it("normalizes named group (?<name>abc)", () => {
    const kids = topChildren("(?<name>abc)");
    expect(kids).toHaveLength(1);
    const g = kids[0];
    expect(g.type).toBe("group");
    expect(g.key).toBe("group:named:name");
    expect(g.props).toMatchObject({ capturing: true, name: "name" });
    // Group has children (the body)
    expect(g.children.length).toBeGreaterThan(0);
  });

  it("normalizes capturing group (abc)", () => {
    const kids = topChildren("(abc)");
    const g = kids[0];
    expect(g.type).toBe("group");
    expect(g.key).toMatch(/^group:capture:\d+$/);
    expect(g.props).toMatchObject({ capturing: true, name: null });
  });

  it("normalizes non-capturing group (?:abc)", () => {
    const kids = topChildren("(?:abc)");
    const g = kids[0];
    expect(g.type).toBe("group");
    expect(g.key).toBe("group:noncapture");
    expect(g.props).toMatchObject({ capturing: false });
  });
});

// ── Quantifiers ────────────────────────────────────────────────

describe("normalizeAst — quantifiers", () => {
  it("normalizes \\d{2,4} as quantifier wrapping escape", () => {
    const kids = topChildren("\\d{2,4}");
    expect(kids).toHaveLength(1);
    const q = kids[0];
    expect(q.type).toBe("quantifier");
    expect(q.key).toBe("quantifier:min2-max4-greedy");
    expect(q.props).toEqual({ min: 2, max: 4, greedy: true });
    // Child is the escape:digit
    expect(q.children).toHaveLength(1);
    expect(q.children[0].type).toBe("escape");
    expect(q.children[0].key).toBe("escape:digit");
  });

  it("normalizes + as min1-maxnull-greedy", () => {
    const kids = topChildren("a+");
    const q = kids[0];
    expect(q.type).toBe("quantifier");
    expect(q.props).toEqual({ min: 1, max: null, greedy: true });
  });

  it("normalizes *? as min0-maxnull-lazy", () => {
    const kids = topChildren("a*?");
    const q = kids[0];
    expect(q.type).toBe("quantifier");
    expect(q.key).toBe("quantifier:min0-maxnull-lazy");
    expect(q.props).toEqual({ min: 0, max: null, greedy: false });
  });

  it("normalizes ? as min0-max1-greedy", () => {
    const kids = topChildren("a?");
    const q = kids[0];
    expect(q.props).toEqual({ min: 0, max: 1, greedy: true });
  });

  it("normalizes {3} as exact count", () => {
    const kids = topChildren("a{3}");
    const q = kids[0];
    expect(q.props).toEqual({ min: 3, max: 3, greedy: true });
  });

  it("normalizes {2,} as min-only", () => {
    const kids = topChildren("a{2,}");
    const q = kids[0];
    expect(q.props).toEqual({ min: 2, max: null, greedy: true });
  });
});

// ── Alternation ────────────────────────────────────────────────

describe("normalizeAst — alternation", () => {
  it("normalizes (cat|dog) with alternation child", () => {
    const kids = topChildren("(cat|dog)");
    expect(kids).toHaveLength(1);
    const g = kids[0];
    expect(g.type).toBe("group");

    // Group body should be alternation
    const alt = g.children[0];
    expect(alt.type).toBe("alternation");
    expect(alt.children).toHaveLength(2);

    // Each branch is an alternative
    expect(alt.children[0].type).toBe("alternative");
    expect(alt.children[1].type).toBe("alternative");
  });

  it("flattens three-way alternation a|b|c", () => {
    const tree = norm("a|b|c");
    // Root → alternation with 3 branches
    const alt = tree.children[0];
    expect(alt.type).toBe("alternation");
    expect(alt.children).toHaveLength(3);
  });
});

// ── Assertions (lookahead/lookbehind) ──────────────────────────

describe("normalizeAst — assertions", () => {
  it("normalizes (?=foo)bar", () => {
    const kids = topChildren("(?=foo)bar");
    const lookahead = kids[0];
    expect(lookahead.type).toBe("assertion");
    expect(lookahead.key).toBe("assertion:lookahead:positive");
    expect(lookahead.props).toEqual({
      assertionType: "lookahead",
      polarity: "positive",
    });
    // Has children (the assertion body)
    expect(lookahead.children.length).toBeGreaterThan(0);
  });

  it("normalizes negative lookahead (?!foo)", () => {
    const kids = topChildren("(?!foo)");
    expect(kids[0].key).toBe("assertion:lookahead:negative");
    expect(kids[0].props).toEqual({
      assertionType: "lookahead",
      polarity: "negative",
    });
  });

  it("normalizes positive lookbehind (?<=foo)", () => {
    const kids = topChildren("(?<=foo)bar");
    expect(kids[0].key).toBe("assertion:lookbehind:positive");
  });
});

// ── Backreferences ─────────────────────────────────────────────

describe("normalizeAst — backreferences", () => {
  it("normalizes \\1 backreference", () => {
    const kids = topChildren("(\\w+)\\1");
    const backref = kids[1];
    expect(backref.type).toBe("backreference");
    expect(backref.key).toBe("backreference:1");
    expect(backref.props).toMatchObject({ groupNumber: 1 });
  });

  it("normalizes \k<_id> as named backreference", () => {
    const kids = topChildren("(?<_id>a)\\k<_id>");
    const backref = kids[1];
    expect(backref.type).toBe("backreference");
    expect(backref.key).toBe("backreference:named:_id");
    expect(backref.props).toMatchObject({ groupName: "_id" });
  });
});

// ── Fixture patterns ───────────────────────────────────────────

describe("normalizeAst — fixture patterns", () => {
  it("handles ^abc$ end-to-end", () => {
    const tree = norm("^abc$");
    expect(tree.type).toBe("pattern");
    const kids = topChildren("^abc$");
    expect(kids[0].type).toBe("anchor");
    expect(kids[1].type).toBe("literal");
    expect(kids[2].type).toBe("literal");
    expect(kids[3].type).toBe("literal");
    expect(kids[4].type).toBe("anchor");
  });

  it("handles \\d{2,4}", () => {
    const kids = topChildren("\\d{2,4}");
    expect(kids).toHaveLength(1);
    expect(kids[0].type).toBe("quantifier");
    expect(kids[0].children[0].type).toBe("escape");
  });

  it("handles [A-Za-z0-9_]", () => {
    const kids = topChildren("[A-Za-z0-9_]");
    expect(kids[0].type).toBe("charClass");
  });

  it("handles (?<name>abc)", () => {
    const kids = topChildren("(?<name>abc)");
    expect(kids[0].type).toBe("group");
    expect(kids[0].key).toBe("group:named:name");
  });

  it("handles (?=foo)bar", () => {
    const kids = topChildren("(?=foo)bar");
    expect(kids[0].type).toBe("assertion");
    expect(kids[1].type).toBe("literal");
  });

  it("handles (cat|dog)", () => {
    const kids = topChildren("(cat|dog)");
    expect(kids[0].type).toBe("group");
    expect(kids[0].children[0].type).toBe("alternation");
  });
});

// ── Key determinism ────────────────────────────────────────────

describe("normalizeAst — key determinism", () => {
  it("produces identical trees for same pattern parsed twice", () => {
    const patterns = ["^abc$", "\\d{2,4}", "[A-Za-z0-9_]", "(?<name>abc)", "(?=foo)bar", "(cat|dog)"];

    for (const p of patterns) {
      const tree1 = norm(p);
      const tree2 = norm(p);
      expect(JSON.stringify(tree1)).toBe(JSON.stringify(tree2));
    }
  });
});

// ── Range preservation ─────────────────────────────────────────

describe("normalizeAst — range preservation", () => {
  it("ranges map back to source substrings for ^abc$", () => {
    const pattern = "^abc$";
    const kids = topChildren(pattern);

    for (const kid of kids) {
      if (kid.range) {
        const slice = pattern.slice(kid.range.start, kid.range.end);
        expect(slice.length).toBeGreaterThan(0);
      }
    }
  });

  it("ranges are correct for character class", () => {
    const pattern = "[A-Z]";
    const kids = topChildren(pattern);
    const cc = kids[0];
    expect(cc.range).toBeDefined();
    expect(cc.range!.start).toBe(0);
    expect(cc.range!.end).toBe(5);
  });
});
