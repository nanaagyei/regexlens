import type {
  ComparableNode,
  ComparableNodeType,
  AnchorProps,
  LiteralProps,
  EscapeProps,
  CharClassProps,
  CharClassMember,
  GroupProps,
  QuantifierProps,
  AssertionProps,
  BackreferenceProps,
} from "@/types/ast";
import type { AstNode } from "@/types/regex";

/**
 * Normalize a regexp-tree AST into a parser-agnostic ComparableNode tree.
 *
 * The returned tree preserves source ranges, generates stable semantic keys,
 * and exposes normalized props that downstream engines (explanation, diff,
 * warnings, failure analysis) can consume without knowing regexp-tree internals.
 */
export function normalizeAst(ast: AstNode): ComparableNode {
  return normalizeNode(ast);
}

function normalizeNode(node: AstNode): ComparableNode {
  switch (node.type) {
    case "RegExp":
      return normalizeRegExp(node);
    case "Alternative":
      return normalizeAlternative(node);
    case "Disjunction":
      return normalizeDisjunction(node);
    case "Char":
      return normalizeChar(node);
    case "Assertion":
      return normalizeAssertion(node);
    case "CharacterClass":
      return normalizeCharacterClass(node);
    case "Repetition":
      return normalizeRepetition(node);
    case "Group":
      return normalizeGroup(node);
    case "Backreference":
      return normalizeBackreference(node);
    case "ClassRange":
      return normalizeClassRangeFallback(node);
    case "Quantifier":
      return normalizeQuantifierFallback(node);
    default:
      return {
        key: `unknown:${node.type}`,
        type: "literal" as ComparableNodeType,
        text: extractText(node),
        range: extractRange(node),
        props: { value: extractText(node) } as LiteralProps,
        children: [],
      };
  }
}

// ── RegExp (root) ──────────────────────────────────────────────

function normalizeRegExp(node: AstNode): ComparableNode {
  const children: ComparableNode[] = [];
  if (node.body) {
    if (Array.isArray(node.body)) {
      for (const child of node.body) {
        children.push(normalizeNode(child));
      }
    } else {
      children.push(normalizeNode(node.body));
    }
  }
  return {
    key: "pattern",
    type: "pattern",
    text: extractText(node),
    range: extractRange(node),
    props: {},
    children,
  };
}

// ── Alternative ────────────────────────────────────────────────

function normalizeAlternative(node: AstNode): ComparableNode {
  const children: ComparableNode[] = [];
  if (node.expressions) {
    for (const expr of node.expressions) {
      children.push(normalizeNode(expr));
    }
  }
  return {
    key: "alternative",
    type: "alternative",
    text: extractText(node),
    range: extractRange(node),
    props: {},
    children,
  };
}

// ── Disjunction (alternation) ──────────────────────────────────

function normalizeDisjunction(node: AstNode): ComparableNode {
  // Flatten the binary Disjunction chain: a|b|c is Disj(a, Disj(b, c))
  const branches: ComparableNode[] = [];
  flattenDisjunction(node, branches);

  return {
    key: "alternation",
    type: "alternation",
    text: extractText(node),
    range: extractRange(node),
    props: {},
    children: branches,
  };
}

function flattenDisjunction(node: AstNode, branches: ComparableNode[]): void {
  // regexp-tree builds left-recursive trees: a|b|c → Disj(Disj(a, b), c)
  if (node.left) {
    if (node.left.type === "Disjunction") {
      flattenDisjunction(node.left, branches);
    } else {
      branches.push(normalizeNode(node.left));
    }
  }
  if (node.right) {
    if (node.right.type === "Disjunction") {
      flattenDisjunction(node.right, branches);
    } else {
      branches.push(normalizeNode(node.right));
    }
  }
}

// ── Char (literal / dot / escape) ──────────────────────────────

function normalizeChar(node: AstNode): ComparableNode {
  const range = extractRange(node);
  const text = extractText(node);
  const kind = (node as unknown as { kind?: string }).kind;

  // Meta characters: regexp-tree sets kind="meta" for both \d-style escapes and unescaped dot
  if (kind === "meta") {
    const raw = node.value ?? "";

    // Unescaped dot: kind="meta", value=".", no backslash
    if (raw === ".") {
      return {
        key: "dot",
        type: "dot",
        text,
        range,
        props: {},
        children: [],
      };
    }

    // Escape sequences: value="\\d", "\\w", etc.
    const escChar = raw.length === 2 ? raw[1] : raw;
    const escapeType = mapEscapeType(escChar);

    return {
      key: `escape:${escapeType}`,
      type: "escape",
      text,
      range,
      props: { escapeType, raw } as EscapeProps,
      children: [],
    };
  }

  // Escaped literal (e.g., \. has escaped=true, kind="simple", value=".")
  if (node.escaped) {
    const val = node.value ?? node.symbol ?? "";
    const escapeType = mapEscapeType(val);
    const raw = `\\${val}`;

    return {
      key: `escape:${escapeType}`,
      type: "escape",
      text,
      range,
      props: { escapeType, raw } as EscapeProps,
      children: [],
    };
  }

  // Unescaped dot
  if (node.value === ".") {
    return {
      key: "dot",
      type: "dot",
      text,
      range,
      props: {},
      children: [],
    };
  }

  // Plain literal
  const value = node.value ?? node.symbol ?? "";
  return {
    key: `literal:${value}`,
    type: "literal",
    text,
    range,
    props: { value } as LiteralProps,
    children: [],
  };
}

function mapEscapeType(
  val: string
): EscapeProps["escapeType"] {
  switch (val) {
    case "d": return "digit";
    case "D": return "nonDigit";
    case "w": return "word";
    case "W": return "nonWord";
    case "s": return "whitespace";
    case "S": return "nonWhitespace";
    case "t": return "tab";
    case "n": return "newline";
    case "r": return "return";
    default:  return "other";
  }
}

// ── Assertion (anchor / lookaround) ────────────────────────────

function normalizeAssertion(node: AstNode): ComparableNode {
  const range = extractRange(node);
  const text = extractText(node);

  switch (node.kind) {
    case "^":
      return {
        key: "anchor:start",
        type: "anchor",
        text,
        range,
        props: { kind: "start" } as AnchorProps,
        children: [],
      };
    case "$":
      return {
        key: "anchor:end",
        type: "anchor",
        text,
        range,
        props: { kind: "end" } as AnchorProps,
        children: [],
      };
    case "\\b":
      return {
        key: "anchor:wordBoundary",
        type: "anchor",
        text,
        range,
        props: { kind: "wordBoundary" } as AnchorProps,
        children: [],
      };
    case "\\B":
      return {
        key: "anchor:nonWordBoundary",
        type: "anchor",
        text,
        range,
        props: { kind: "nonWordBoundary" } as AnchorProps,
        children: [],
      };
    default: {
      // Lookahead / Lookbehind
      const assertionType = node.kind === "Lookbehind" ? "lookbehind" : "lookahead";
      const polarity = node.negative ? "negative" : "positive";

      const children: ComparableNode[] = [];
      if (node.assertion) {
        children.push(normalizeNode(node.assertion as AstNode));
      }

      return {
        key: `assertion:${assertionType}:${polarity}`,
        type: "assertion",
        text,
        range,
        props: { assertionType, polarity } as AssertionProps,
        children,
      };
    }
  }
}

// ── CharacterClass ─────────────────────────────────────────────

function normalizeCharacterClass(node: AstNode): ComparableNode {
  const range = extractRange(node);
  const text = extractText(node);
  const negated = node.negative ?? false;
  const expressions = node.expressions as AstNode[] | undefined;

  const members: CharClassMember[] = [];
  const memberDescriptions: string[] = [];

  if (expressions) {
    for (const expr of expressions) {
      if (expr.type === "ClassRange") {
        const fromNode = (expr as unknown as { from: AstNode }).from;
        const toNode = (expr as unknown as { to: AstNode }).to;
        const from = fromNode.value ?? fromNode.symbol ?? "";
        const to = toNode.value ?? toNode.symbol ?? "";
        members.push({ type: "range", from, to });
        memberDescriptions.push(`${from}-${to}`);
      } else if (expr.type === "Char") {
        const value = charValue(expr);
        members.push({ type: "literal", value });
        memberDescriptions.push(value);
      }
    }
  }

  const membersKey = memberDescriptions.join(",");
  return {
    key: `charclass:${membersKey}-negated:${negated}`,
    type: "charClass",
    text,
    range,
    props: { negated, members } as CharClassProps,
    children: [],
  };
}

function charValue(node: AstNode): string {
  const kind = (node as unknown as { kind?: string }).kind;
  // Meta escapes like \d have kind="meta" and value="\\d"
  if (kind === "meta") {
    return node.value ?? "";
  }
  if (node.escaped) {
    return `\\${node.value ?? node.symbol ?? ""}`;
  }
  return node.value ?? node.symbol ?? "";
}

// ── Repetition (quantifier) ────────────────────────────────────

function normalizeRepetition(node: AstNode): ComparableNode {
  const range = extractRange(node);
  const text = extractText(node);
  const quantifier = node.quantifier as AstNode | undefined;

  let min = 0;
  let max: number | null = null;
  let greedy = true;

  if (quantifier) {
    greedy = quantifier.greedy !== false;
    const qKind = quantifier.kind ?? quantifier.kind_;

    switch (qKind) {
      case "*":
        min = 0;
        max = null;
        break;
      case "+":
        min = 1;
        max = null;
        break;
      case "?":
        min = 0;
        max = 1;
        break;
      case "Range":
        min = quantifier.from ?? 0;
        max = quantifier.to !== undefined ? quantifier.to : null;
        break;
    }
  }

  const greedyLabel = greedy ? "greedy" : "lazy";
  const children: ComparableNode[] = [];
  if (node.expression) {
    children.push(normalizeNode(node.expression));
  }

  return {
    key: `quantifier:min${min}-max${max}-${greedyLabel}`,
    type: "quantifier",
    text,
    range,
    props: { min, max, greedy } as QuantifierProps,
    children,
  };
}

// ── Group ──────────────────────────────────────────────────────

function normalizeGroup(node: AstNode): ComparableNode {
  const range = extractRange(node);
  const text = extractText(node);
  const capturing = node.capturing !== false;
  const name = node.name ?? null;
  const number = node.number ?? null;

  let key: string;
  if (name) {
    key = `group:named:${name}`;
  } else if (capturing && number !== null) {
    key = `group:capture:${number}`;
  } else {
    key = "group:noncapture";
  }

  const children: ComparableNode[] = [];
  if (node.expression) {
    children.push(normalizeNode(node.expression));
  }

  return {
    key,
    type: "group",
    text,
    range,
    props: { capturing, name, number } as GroupProps,
    children,
  };
}

// ── Backreference ──────────────────────────────────────────────

function normalizeBackreference(node: AstNode): ComparableNode {
  const range = extractRange(node);
  const text = extractText(node);
  const groupNumber = node.reference ?? null;
  const groupName = typeof node.referenceRaw === "string" && /^[a-zA-Z]/.test(node.referenceRaw)
    ? node.referenceRaw
    : null;

  const key = groupName
    ? `backreference:named:${groupName}`
    : `backreference:${groupNumber}`;

  return {
    key,
    type: "backreference",
    text,
    range,
    props: { groupNumber, groupName } as BackreferenceProps,
    children: [],
  };
}

// ── Fallbacks for nodes that shouldn't appear standalone ───────

function normalizeClassRangeFallback(node: AstNode): ComparableNode {
  const fromNode = (node as unknown as { from: AstNode }).from;
  const toNode = (node as unknown as { to: AstNode }).to;
  const from = fromNode?.value ?? fromNode?.symbol ?? "";
  const to = toNode?.value ?? toNode?.symbol ?? "";

  return {
    key: `charclass:${from}-${to}`,
    type: "charClass",
    text: extractText(node),
    range: extractRange(node),
    props: {
      negated: false,
      members: [{ type: "range", from, to }],
    } as CharClassProps,
    children: [],
  };
}

function normalizeQuantifierFallback(node: AstNode): ComparableNode {
  return {
    key: "quantifier:fallback",
    type: "quantifier",
    text: extractText(node),
    range: extractRange(node),
    props: { min: 0, max: null, greedy: true } as QuantifierProps,
    children: [],
  };
}

// ── Utilities ──────────────────────────────────────────────────

function extractRange(node: AstNode): { start: number; end: number } | undefined {
  if (!node.loc) return undefined;
  // regexp-tree offsets include the leading `/`, so subtract 1
  return {
    start: node.loc.start.offset - 1,
    end: node.loc.end.offset - 1,
  };
}

function extractText(node: AstNode): string {
  if (node.loc) {
    // loc.source contains the matched source substring
    return node.loc.source;
  }
  return "";
}
