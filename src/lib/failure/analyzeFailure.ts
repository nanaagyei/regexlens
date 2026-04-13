/**
 * AST-guided failure analysis engine.
 *
 * Walks the normalized AST sequentially against input text to find
 * the first likely failure point. Does NOT implement backtracking —
 * follows the "first path" and reports where it diverges.
 */

import type {
  ParseResult,
  MatchResult,
  FailureResult,
  FailureConfidence,
  ComparableNode,
  AnchorProps,
  LiteralProps,
  EscapeProps,
  CharClassProps,
  QuantifierProps,
} from "@/types";
import { describeExpected, describeActual } from "./describeNode";

interface SimSuccess {
  matched: true;
  newPos: number;
}

interface SimFailure {
  matched: false;
  failureIndex: number;
  expected: string;
  actual: string;
  reason: string;
  detail: string;
  relatedRange?: { start: number; end: number };
  confidence: FailureConfidence;
}

type SimResult = SimSuccess | SimFailure;

/**
 * Analyze why a regex failed to match input text.
 */
export function analyzeFailure(
  pattern: string,
  flags: string,
  text: string,
  parseResult: ParseResult,
  matchResult: MatchResult,
): FailureResult {
  if (matchResult.matches.length > 0) {
    return { didMatch: true };
  }
  if (!parseResult.ok) {
    return { didMatch: true };
  }
  if (!text) {
    return { didMatch: true };
  }
  if (!pattern) {
    return { didMatch: true };
  }

  const normalized = parseResult.normalized;
  const caseInsensitive = flags.includes("i");
  const multiline = flags.includes("m");
  const dotAll = flags.includes("s");

  const ctx: SimContext = { text, caseInsensitive, multiline, dotAll };

  // For non-global or non-anchored patterns, try from each position
  const hasStartAnchor = patternStartsWithAnchor(normalized);
  const maxStart = hasStartAnchor ? 0 : text.length - 1;

  let bestFailure: SimFailure | null = null;
  let bestProgress = -1;

  for (let startPos = 0; startPos <= maxStart; startPos++) {
    const result = simulateNode(normalized, startPos, ctx);
    if (result.matched) {
      // Shouldn't happen since matchResult says no matches, but be safe
      return { didMatch: true };
    }
    // Track the failure that consumed the most characters from its start
    const progress = result.failureIndex - startPos;
    if (progress > bestProgress) {
      bestProgress = progress;
      bestFailure = result;
    }
  }

  if (!bestFailure) {
    return {
      didMatch: false,
      failureIndex: 0,
      expected: describeExpected(normalized),
      actual: describeActual(text, 0),
      reason: "Pattern could not match",
      detail: "The pattern did not match any position in the input text.",
      confidence: "low",
    };
  }

  return {
    didMatch: false,
    failureIndex: bestFailure.failureIndex,
    expected: bestFailure.expected,
    actual: bestFailure.actual,
    reason: bestFailure.reason,
    detail: bestFailure.detail,
    relatedRange: bestFailure.relatedRange,
    confidence: bestFailure.confidence,
  };
}

interface SimContext {
  text: string;
  caseInsensitive: boolean;
  multiline: boolean;
  dotAll: boolean;
}

function simulateNode(
  node: ComparableNode,
  pos: number,
  ctx: SimContext,
): SimResult {
  switch (node.type) {
    case "pattern":
      return simulateChildren(node.children, pos, ctx);
    case "alternative":
      return simulateChildren(node.children, pos, ctx);
    case "literal":
      return simulateLiteral(node, pos, ctx);
    case "anchor":
      return simulateAnchor(node, pos, ctx);
    case "escape":
      return simulateEscape(node, pos, ctx);
    case "dot":
      return simulateDot(node, pos, ctx);
    case "charClass":
      return simulateCharClass(node, pos, ctx);
    case "quantifier":
      return simulateQuantifier(node, pos, ctx);
    case "group":
      return simulateGroup(node, pos, ctx);
    case "alternation":
      return simulateAlternation(node, pos, ctx);
    case "assertion":
      return makeLowConfidenceFailure(node, pos, ctx);
    case "backreference":
      return makeLowConfidenceFailure(node, pos, ctx);
    default:
      return makeLowConfidenceFailure(node, pos, ctx);
  }
}

function simulateChildren(
  children: ComparableNode[],
  pos: number,
  ctx: SimContext,
): SimResult {
  let currentPos = pos;
  for (const child of children) {
    const result = simulateNode(child, currentPos, ctx);
    if (!result.matched) return result;
    currentPos = result.newPos;
  }
  return { matched: true, newPos: currentPos };
}

function simulateLiteral(
  node: ComparableNode,
  pos: number,
  ctx: SimContext,
): SimResult {
  const { value } = node.props as LiteralProps;
  const expected = describeExpected(node);
  const actual = describeActual(ctx.text, pos);

  if (pos >= ctx.text.length) {
    return {
      matched: false,
      failureIndex: pos,
      expected,
      actual,
      reason: `Expected ${expected} but reached end of input`,
      detail: `The pattern expected ${expected} at position ${pos}, but the input text has ended.`,
      relatedRange: node.range,
      confidence: "high",
    };
  }

  const textChar = ctx.text[pos];
  const matches = ctx.caseInsensitive
    ? textChar.toLowerCase() === value.toLowerCase()
    : textChar === value;

  if (!matches) {
    return {
      matched: false,
      failureIndex: pos,
      expected,
      actual,
      reason: `Expected ${expected} but found ${actual}`,
      detail: `At position ${pos}, the pattern expected ${expected} but the input contains ${actual}.`,
      relatedRange: node.range,
      confidence: "high",
    };
  }

  return { matched: true, newPos: pos + 1 };
}

function simulateAnchor(
  node: ComparableNode,
  pos: number,
  ctx: SimContext,
): SimResult {
  const { kind } = node.props as AnchorProps;
  const expected = describeExpected(node);

  switch (kind) {
    case "start": {
      if (pos === 0) return { matched: true, newPos: pos };
      if (ctx.multiline && pos > 0 && ctx.text[pos - 1] === "\n") {
        return { matched: true, newPos: pos };
      }
      return {
        matched: false,
        failureIndex: pos,
        expected,
        actual: `position ${pos} in the string`,
        reason: "Expected start of string",
        detail: ctx.multiline
          ? `The ^ anchor requires the start of a line, but position ${pos} does not follow a newline.`
          : `The ^ anchor requires position 0 (start of string), but the match attempt is at position ${pos}.`,
        relatedRange: node.range,
        confidence: "high",
      };
    }
    case "end": {
      if (pos === ctx.text.length) return { matched: true, newPos: pos };
      if (ctx.multiline && pos < ctx.text.length && ctx.text[pos] === "\n") {
        return { matched: true, newPos: pos };
      }
      const actual = describeActual(ctx.text, pos);
      return {
        matched: false,
        failureIndex: pos,
        expected,
        actual,
        reason: `Expected end of string but found ${actual}`,
        detail: ctx.multiline
          ? `The $ anchor requires the end of a line, but found ${actual} at position ${pos}.`
          : `The $ anchor requires the end of string (position ${ctx.text.length}), but found ${actual} at position ${pos}.`,
        relatedRange: node.range,
        confidence: "high",
      };
    }
    case "wordBoundary": {
      if (isWordBoundary(ctx.text, pos)) return { matched: true, newPos: pos };
      return {
        matched: false,
        failureIndex: pos,
        expected,
        actual: `no word boundary at position ${pos}`,
        reason: "Expected a word boundary",
        detail: `The \\b anchor requires a word boundary at position ${pos}, but neither side transitions between a word and non-word character.`,
        relatedRange: node.range,
        confidence: "high",
      };
    }
    case "nonWordBoundary": {
      if (!isWordBoundary(ctx.text, pos)) return { matched: true, newPos: pos };
      return {
        matched: false,
        failureIndex: pos,
        expected,
        actual: `a word boundary at position ${pos}`,
        reason: "Expected a non-word boundary",
        detail: `The \\B anchor requires no word boundary at position ${pos}, but a word boundary exists here.`,
        relatedRange: node.range,
        confidence: "high",
      };
    }
  }
  return makeLowConfidenceFailure(node, pos, ctx);
}

function simulateEscape(
  node: ComparableNode,
  pos: number,
  ctx: SimContext,
): SimResult {
  const { escapeType } = node.props as EscapeProps;
  const expected = describeExpected(node);
  const actual = describeActual(ctx.text, pos);

  if (pos >= ctx.text.length) {
    return {
      matched: false,
      failureIndex: pos,
      expected,
      actual,
      reason: `Expected ${expected} but reached end of input`,
      detail: `The pattern expected ${expected} at position ${pos}, but the input text has ended.`,
      relatedRange: node.range,
      confidence: "high",
    };
  }

  const ch = ctx.text[pos];
  const matches = charMatchesEscape(ch, escapeType);

  if (!matches) {
    return {
      matched: false,
      failureIndex: pos,
      expected,
      actual,
      reason: `Expected ${expected} but found ${actual}`,
      detail: `At position ${pos}, the pattern expected ${expected} but the input contains ${actual}.`,
      relatedRange: node.range,
      confidence: "high",
    };
  }

  return { matched: true, newPos: pos + 1 };
}

function simulateDot(
  node: ComparableNode,
  pos: number,
  ctx: SimContext,
): SimResult {
  if (pos >= ctx.text.length) {
    return {
      matched: false,
      failureIndex: pos,
      expected: describeExpected(node),
      actual: describeActual(ctx.text, pos),
      reason: "Expected any character but reached end of input",
      detail: `The . metacharacter requires any character at position ${pos}, but the input text has ended.`,
      relatedRange: node.range,
      confidence: "high",
    };
  }

  const ch = ctx.text[pos];
  if (ch === "\n" && !ctx.dotAll) {
    return {
      matched: false,
      failureIndex: pos,
      expected: "any character except newline (.)",
      actual: "a newline",
      reason: "Dot does not match newline without the s (dotAll) flag",
      detail: `At position ${pos}, the . metacharacter found a newline, which it does not match unless the 's' (dotAll) flag is enabled.`,
      relatedRange: node.range,
      confidence: "high",
    };
  }

  return { matched: true, newPos: pos + 1 };
}

function simulateCharClass(
  node: ComparableNode,
  pos: number,
  ctx: SimContext,
): SimResult {
  const { negated, members } = node.props as CharClassProps;
  const expected = describeExpected(node);
  const actual = describeActual(ctx.text, pos);

  if (pos >= ctx.text.length) {
    return {
      matched: false,
      failureIndex: pos,
      expected,
      actual,
      reason: `Expected ${expected} but reached end of input`,
      detail: `The pattern expected ${expected} at position ${pos}, but the input text has ended.`,
      relatedRange: node.range,
      confidence: "high",
    };
  }

  const ch = ctx.text[pos];
  let inClass = false;

  for (const member of members) {
    if (member.type === "range") {
      const chCode = ctx.caseInsensitive ? ch.toLowerCase().charCodeAt(0) : ch.charCodeAt(0);
      const fromCode = ctx.caseInsensitive ? member.from.toLowerCase().charCodeAt(0) : member.from.charCodeAt(0);
      const toCode = ctx.caseInsensitive ? member.to.toLowerCase().charCodeAt(0) : member.to.charCodeAt(0);
      if (chCode >= fromCode && chCode <= toCode) {
        inClass = true;
        break;
      }
    } else {
      const memberVal = member.value;
      // Handle escape sequences within character classes
      if (memberVal.startsWith("\\")) {
        const escType = mapMetaEscape(memberVal);
        if (escType && charMatchesEscape(ch, escType)) {
          inClass = true;
          break;
        }
      } else {
        const matches = ctx.caseInsensitive
          ? ch.toLowerCase() === memberVal.toLowerCase()
          : ch === memberVal;
        if (matches) {
          inClass = true;
          break;
        }
      }
    }
  }

  const matches = negated ? !inClass : inClass;

  if (!matches) {
    return {
      matched: false,
      failureIndex: pos,
      expected,
      actual,
      reason: `Expected ${expected} but found ${actual}`,
      detail: `At position ${pos}, ${actual} is ${negated ? "in" : "not in"} the character class ${node.text}.`,
      relatedRange: node.range,
      confidence: "high",
    };
  }

  return { matched: true, newPos: pos + 1 };
}

function simulateQuantifier(
  node: ComparableNode,
  pos: number,
  ctx: SimContext,
): SimResult {
  const { min, max, greedy } = node.props as QuantifierProps;
  const child = node.children[0];
  if (!child) return makeLowConfidenceFailure(node, pos, ctx);

  let currentPos = pos;
  let count = 0;
  const effectiveMax = max === null ? Infinity : max;

  if (greedy) {
    // Greedy: consume as many as possible
    while (count < effectiveMax) {
      const result = simulateNode(child, currentPos, ctx);
      if (!result.matched) break;
      if (result.newPos === currentPos) break; // prevent infinite loop on zero-width
      count++;
      currentPos = result.newPos;
    }
  } else {
    // Lazy: consume minimum first
    while (count < min) {
      const result = simulateNode(child, currentPos, ctx);
      if (!result.matched) break;
      if (result.newPos === currentPos) break;
      count++;
      currentPos = result.newPos;
    }
  }

  if (count < min) {
    const childExpected = describeExpected(child);
    const actual = describeActual(ctx.text, currentPos);
    return {
      matched: false,
      failureIndex: currentPos,
      expected: `at least ${min} occurrence${min === 1 ? "" : "s"} of ${childExpected}`,
      actual: count === 0 ? actual : `only ${count} occurrence${count === 1 ? "" : "s"}`,
      reason: `Expected at least ${min} of ${childExpected}, found ${count}`,
      detail: `The quantifier ${node.text} requires a minimum of ${min} match${min === 1 ? "" : "es"}, but only ${count} ${count === 1 ? "was" : "were"} found before encountering ${actual} at position ${currentPos}.`,
      relatedRange: node.range,
      confidence: "medium",
    };
  }

  return { matched: true, newPos: currentPos };
}

function simulateGroup(
  node: ComparableNode,
  pos: number,
  ctx: SimContext,
): SimResult {
  if (node.children.length === 0) return { matched: true, newPos: pos };

  const result = simulateChildren(node.children, pos, ctx);
  if (!result.matched) {
    // Downgrade confidence for groups
    return { ...result, confidence: clampConfidence(result.confidence, "medium") };
  }
  return result;
}

function simulateAlternation(
  node: ComparableNode,
  pos: number,
  ctx: SimContext,
): SimResult {
  if (node.children.length === 0) return { matched: true, newPos: pos };

  let bestFailure: SimFailure | null = null;

  for (const branch of node.children) {
    const result = simulateNode(branch, pos, ctx);
    if (result.matched) return result;
    // Track the branch that got furthest
    if (!bestFailure || result.failureIndex > bestFailure.failureIndex) {
      bestFailure = result;
    }
  }

  if (!bestFailure) {
    return makeLowConfidenceFailure(node, pos, ctx);
  }

  const confidence: FailureConfidence = node.children.length > 2 ? "low" : "medium";
  return { ...bestFailure, confidence };
}

// ── Helpers ──────────────────────────────────────────────────────

function charMatchesEscape(ch: string, escapeType: EscapeProps["escapeType"]): boolean {
  switch (escapeType) {
    case "digit": return /[0-9]/.test(ch);
    case "nonDigit": return !/[0-9]/.test(ch);
    case "word": return /[a-zA-Z0-9_]/.test(ch);
    case "nonWord": return !/[a-zA-Z0-9_]/.test(ch);
    case "whitespace": return /\s/.test(ch);
    case "nonWhitespace": return !/\s/.test(ch);
    case "tab": return ch === "\t";
    case "newline": return ch === "\n";
    case "return": return ch === "\r";
    case "other": return false; // Conservative: can't determine
  }
}

function mapMetaEscape(raw: string): EscapeProps["escapeType"] | null {
  if (raw.length !== 2 || raw[0] !== "\\") return null;
  const ch = raw[1];
  switch (ch) {
    case "d": return "digit";
    case "D": return "nonDigit";
    case "w": return "word";
    case "W": return "nonWord";
    case "s": return "whitespace";
    case "S": return "nonWhitespace";
    case "t": return "tab";
    case "n": return "newline";
    case "r": return "return";
    default: return null;
  }
}

function isWordBoundary(text: string, pos: number): boolean {
  const before = pos > 0 ? isWordChar(text[pos - 1]) : false;
  const after = pos < text.length ? isWordChar(text[pos]) : false;
  return before !== after;
}

function isWordChar(ch: string): boolean {
  return /[a-zA-Z0-9_]/.test(ch);
}

function patternStartsWithAnchor(node: ComparableNode): boolean {
  if (node.type === "anchor" && (node.props as AnchorProps).kind === "start") return true;
  if (node.type === "pattern" || node.type === "alternative") {
    return node.children.length > 0 && patternStartsWithAnchor(node.children[0]);
  }
  return false;
}

function clampConfidence(current: FailureConfidence, max: FailureConfidence): FailureConfidence {
  const order: FailureConfidence[] = ["low", "medium", "high"];
  const currentIdx = order.indexOf(current);
  const maxIdx = order.indexOf(max);
  return order[Math.min(currentIdx, maxIdx)];
}

function makeLowConfidenceFailure(
  node: ComparableNode,
  pos: number,
  ctx: SimContext,
): SimResult {
  return {
    matched: false,
    failureIndex: pos,
    expected: describeExpected(node),
    actual: describeActual(ctx.text, pos),
    reason: `Could not match ${node.text || node.type}`,
    detail: `The pattern construct "${node.text || node.type}" could not be fully analyzed. The failure may be approximate.`,
    relatedRange: node.range,
    confidence: "low",
  };
}
