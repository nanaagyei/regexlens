/**
 * Convert regex AST (regexp-tree) to railroad diagram
 */

import {
  Diagram,
  Sequence,
  Stack,
  Choice,
  Optional,
  OneOrMore,
  ZeroOrMore,
  Group as RailroadGroup,
  Terminal,
} from "@prantlf/railroad-diagrams";
import type { AstNode } from "@/types";

function toNode(node: AstNode | AstNode[] | undefined): unknown[] {
  if (!node) return [];
  if (Array.isArray(node)) {
    return node.flatMap((n) => toNode(n));
  }

  switch (node.type) {
    case "RegExp":
      return toNode(node.body);

    case "Alternative":
      if (node.expressions) {
        const items = (node.expressions as AstNode[]).flatMap((e) => toNode(e));
        if (items.length === 0) return [];
        if (items.length <= STACK_THRESHOLD) {
          return [new Sequence(...items)];
        }
        return [chunkIntoStack(items)];
      }
      return [];

    case "Disjunction":
      if (node.left && node.right) {
        const leftItems = toNode(node.left);
        const rightItems = toNode(node.right);
        const left = leftItems.length === 1 ? leftItems[0] : new Sequence(...leftItems);
        const right = rightItems.length === 1 ? rightItems[0] : new Sequence(...rightItems);
        return [new Choice(0, left, right)];
      }
      if (node.left) return toNode(node.left);
      if (node.right) return toNode(node.right);
      return [];

    case "Group": {
      const inner = toNode(node.expression);
      if (inner.length === 0) return [new Terminal("()")];
      const seq = inner.length === 1 ? inner[0] : new Sequence(...inner);
      const label = node.capturing === false ? "(?:)" : node.name ? `(?<${node.name}>)` : "()";
      return [new RailroadGroup(seq, label)];
    }

    case "Repetition": {
      const expr = toNode(node.expression);
      if (expr.length === 0) return [];
      const item = expr.length === 1 ? expr[0] : new Sequence(...expr);
      const quantifier = node.quantifier as AstNode | undefined;

      if (!quantifier) return [item];

      const kind = quantifier.kind ?? quantifier.kind_;
      if (kind === "*") return [new ZeroOrMore(item)];
      if (kind === "+") return [new OneOrMore(item)];
      if (kind === "?") return [new Optional(item)];

      if (kind === "Range") {
        const from = (quantifier.from ?? 0) as number;
        const to = quantifier.to as number | undefined;

        if (to === undefined) {
          return [new OneOrMore(item)];
        }
        if (from === to) {
          return [new RailroadGroup(item, `exactly ${from}`)];
        }
        if (from === 0 && to === 1) {
          return [new Optional(item)];
        }
        return [new RailroadGroup(item, `${from}..${to}`)];
      }

      return [item];
    }

    case "CharacterClass": {
      const neg = node.negative ? "^" : "";
      const exprs = node.expressions as AstNode[] | undefined;
      const parts = exprs ? exprs.map(classExprToText).join("") : "";
      return [new Terminal(`[${neg}${parts || "."}]`)];
    }

    case "ClassRange": {
      const from = node.from as AstNode | undefined;
      const to = node.to as AstNode | undefined;
      const fromStr = from ? charToText(from) : "";
      const toStr = to ? charToText(to) : "";
      return [new Terminal(`${fromStr}-${toStr}`)];
    }

    case "Char":
      return [new Terminal(escapeForDisplay(node.value ?? node.symbol ?? ""))];

    case "Assertion": {
      const k = node.kind ?? "";
      const labels: Record<string, string> = {
        "^": "^",
        $: "$",
        "\\b": "\\b",
        "\\B": "\\B",
        lookahead: "(?=...)",
        lookbehind: "(?<=...)",
        "negative lookahead": "(?!...)",
        "negative lookbehind": "(?<!...)",
      };
      return [new Terminal(labels[k] ?? `(${k})`)];
    }

    case "Backreference":
      return [new Terminal(`\\${node.reference ?? node.referenceRaw ?? ""}`)];

    default:
      return [];
  }
}

function charToText(node: AstNode): string {
  if (node.type === "Char") {
    return escapeForDisplay(node.value ?? node.symbol ?? "");
  }
  return "";
}

function classExprToText(node: AstNode): string {
  if (node.type === "Char") {
    return escapeForDisplay(node.value ?? node.symbol ?? "");
  }
  if (node.type === "ClassRange") {
    const from = node.from as AstNode | undefined;
    const to = node.to as AstNode | undefined;
    const fromStr = from ? escapeForDisplay((from as AstNode).value ?? (from as AstNode).symbol ?? "") : "";
    const toStr = to ? escapeForDisplay((to as AstNode).value ?? (to as AstNode).symbol ?? "") : "";
    return `${fromStr}-${toStr}`;
  }
  return "";
}

function escapeForDisplay(s: string): string {
  if (s.length === 0) return "ε";
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

/** Maximum items per row before stacking vertically */
const STACK_THRESHOLD = 4;

/** Chunk items into rows of STACK_THRESHOLD and wrap in a Stack */
function chunkIntoStack(items: unknown[]): unknown {
  const chunks: unknown[] = [];
  for (let i = 0; i < items.length; i += STACK_THRESHOLD) {
    const chunk = items.slice(i, i + STACK_THRESHOLD);
    chunks.push(chunk.length === 1 ? chunk[0] : new Sequence(...chunk));
  }
  return new Stack(...chunks);
}

/**
 * Convert regex AST to railroad diagram SVG string
 */
export function astToRailroadSvg(ast: AstNode): string {
  const items = toNode(ast);
  if (items.length === 0) {
    return "";
  }

  const content =
    items.length <= STACK_THRESHOLD
      ? items
      : [chunkIntoStack(items)];

  const diagram = new Diagram(...content);
  return diagram.toString();
}
