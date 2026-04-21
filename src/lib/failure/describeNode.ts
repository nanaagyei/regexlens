/**
 * Human-readable descriptions for failure analysis reporting.
 */

import type { ComparableNode, EscapeProps, CharClassProps, AnchorProps, LiteralProps } from "@/types";

/**
 * Describe what a given AST node expects to match.
 */
export function describeExpected(node: ComparableNode): string {
  switch (node.type) {
    case "literal": {
      const { value } = node.props as LiteralProps;
      return `the character '${value}'`;
    }
    case "anchor": {
      const { kind } = node.props as AnchorProps;
      switch (kind) {
        case "start": return "start of string";
        case "end": return "end of string";
        case "wordBoundary": return "a word boundary";
        case "nonWordBoundary": return "a non-word boundary";
      }
      break;
    }
    case "escape": {
      const { escapeType, raw } = node.props as EscapeProps;
      switch (escapeType) {
        case "digit": return "a digit (\\d)";
        case "nonDigit": return "a non-digit (\\D)";
        case "word": return "a word character (\\w)";
        case "nonWord": return "a non-word character (\\W)";
        case "whitespace": return "a whitespace character (\\s)";
        case "nonWhitespace": return "a non-whitespace character (\\S)";
        case "tab": return "a tab character (\\t)";
        case "newline": return "a newline (\\n)";
        case "return": return "a carriage return (\\r)";
        case "other": return `the escape sequence ${raw}`;
      }
      break;
    }
    case "dot":
      return "any character (.)";
    case "charClass": {
      const { negated, members } = node.props as CharClassProps;
      const desc = members
        .map((m) => (m.type === "range" ? `${m.from}-${m.to}` : m.value))
        .join(", ");
      return negated
        ? `a character not in [${desc}]`
        : `a character in [${desc}]`;
    }
    default:
      return `a match for ${node.text || node.type}`;
  }
  return `a match for ${node.text || node.type}`;
}

/**
 * Describe what was actually found at a position in the input text.
 */
export function describeActual(text: string, pos: number): string {
  if (pos >= text.length) {
    return "end of input";
  }
  const ch = text[pos];
  if (ch === " ") return "a space";
  if (ch === "\t") return "a tab";
  if (ch === "\n") return "a newline";
  if (ch === "\r") return "a carriage return";
  if (/\d/.test(ch)) return `the digit '${ch}'`;
  if (/[a-z]/i.test(ch)) return `the letter '${ch}'`;
  return `the character '${ch}'`;
}
