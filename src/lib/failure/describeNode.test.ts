import { describe, it, expect } from "vitest";
import { describeExpected, describeActual } from "./describeNode";
import type { ComparableNode, LiteralProps, AnchorProps, EscapeProps, CharClassProps } from "@/types";

function makeNode(
  type: ComparableNode["type"],
  props: ComparableNode["props"],
  text = ""
): ComparableNode {
  return { key: "test", type, text, props, children: [] };
}

describe("describeExpected", () => {
  it("describes a literal character", () => {
    const node = makeNode("literal", { value: "a" } as LiteralProps);
    expect(describeExpected(node)).toBe("the character 'a'");
  });

  it("describes start anchor", () => {
    const node = makeNode("anchor", { kind: "start" } as AnchorProps, "^");
    expect(describeExpected(node)).toBe("start of string");
  });

  it("describes end anchor", () => {
    const node = makeNode("anchor", { kind: "end" } as AnchorProps, "$");
    expect(describeExpected(node)).toBe("end of string");
  });

  it("describes word boundary", () => {
    const node = makeNode("anchor", { kind: "wordBoundary" } as AnchorProps, "\\b");
    expect(describeExpected(node)).toBe("a word boundary");
  });

  it("describes digit escape", () => {
    const node = makeNode("escape", { escapeType: "digit", raw: "\\d" } as EscapeProps);
    expect(describeExpected(node)).toBe("a digit (\\d)");
  });

  it("describes word escape", () => {
    const node = makeNode("escape", { escapeType: "word", raw: "\\w" } as EscapeProps);
    expect(describeExpected(node)).toBe("a word character (\\w)");
  });

  it("describes whitespace escape", () => {
    const node = makeNode("escape", { escapeType: "whitespace", raw: "\\s" } as EscapeProps);
    expect(describeExpected(node)).toBe("a whitespace character (\\s)");
  });

  it("describes non-digit escape", () => {
    const node = makeNode("escape", { escapeType: "nonDigit", raw: "\\D" } as EscapeProps);
    expect(describeExpected(node)).toBe("a non-digit (\\D)");
  });

  it("describes dot", () => {
    const node = makeNode("dot", {} as ComparableNode["props"], ".");
    expect(describeExpected(node)).toBe("any character (.)");
  });

  it("describes character class", () => {
    const node = makeNode("charClass", {
      negated: false,
      members: [{ type: "range", from: "a", to: "z" }],
    } as CharClassProps);
    expect(describeExpected(node)).toBe("a character in [a-z]");
  });

  it("describes negated character class", () => {
    const node = makeNode("charClass", {
      negated: true,
      members: [{ type: "literal", value: "x" }],
    } as CharClassProps);
    expect(describeExpected(node)).toBe("a character not in [x]");
  });

  it("falls back to node text for unknown types", () => {
    const node = makeNode("group", {} as ComparableNode["props"], "(abc)");
    expect(describeExpected(node)).toBe("a match for (abc)");
  });
});

describe("describeActual", () => {
  it("describes end of input", () => {
    expect(describeActual("abc", 3)).toBe("end of input");
  });

  it("describes a space", () => {
    expect(describeActual(" x", 0)).toBe("a space");
  });

  it("describes a tab", () => {
    expect(describeActual("\tx", 0)).toBe("a tab");
  });

  it("describes a newline", () => {
    expect(describeActual("\nx", 0)).toBe("a newline");
  });

  it("describes a digit", () => {
    expect(describeActual("5abc", 0)).toBe("the digit '5'");
  });

  it("describes a letter", () => {
    expect(describeActual("hello", 0)).toBe("the letter 'h'");
  });

  it("describes a special character", () => {
    expect(describeActual("@test", 0)).toBe("the character '@'");
  });
});
