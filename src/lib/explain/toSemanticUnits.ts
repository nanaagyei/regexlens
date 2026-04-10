import type { ComparableNode } from "@/types/ast";
import type {
  AnchorProps,
  LiteralProps,
  EscapeProps,
  CharClassProps,
  GroupProps,
  QuantifierProps,
  AssertionProps,
  BackreferenceProps,
} from "@/types/ast";
import type {
  SemanticUnit,
  SemanticRange,
  QuantifiedTarget,
} from "@/types/explain";

/**
 * Convert a normalized ComparableNode tree into a flat list of SemanticUnits.
 *
 * This is the first stage of the explanation pipeline:
 *   ComparableNode → SemanticUnit[] → ExplanationStep[]
 *
 * Key transformations:
 * - Adjacent literals are merged into a single TextUnit
 * - Quantifier nodes absorb their child into a QuantifiedUnit
 * - Groups, alternations, and assertions recurse into nested SemanticUnit[]
 */
export function toSemanticUnits(root: ComparableNode): SemanticUnit[] {
  if (root.type === "pattern") {
    return unwrapChildren(root.children);
  }
  return convertNodeList(root.children.length > 0 ? root.children : [root]);
}

/**
 * Unwrap the children of a pattern or group node.
 * Handles the common case where the only child is an alternative or alternation.
 */
function unwrapChildren(children: ComparableNode[]): SemanticUnit[] {
  if (children.length === 1) {
    const only = children[0];
    if (only.type === "alternative") {
      return convertNodeList(only.children);
    }
    if (only.type === "alternation") {
      return [convertAlternation(only)];
    }
    return convertNodeList([only]);
  }
  return convertNodeList(children);
}

/**
 * Convert a list of sibling ComparableNodes, merging adjacent literals.
 */
function convertNodeList(nodes: ComparableNode[]): SemanticUnit[] {
  const result: SemanticUnit[] = [];
  const literalBuf: ComparableNode[] = [];

  for (const node of nodes) {
    if (node.type === "literal") {
      literalBuf.push(node);
    } else {
      flushLiterals(literalBuf, result);
      result.push(convertNode(node));
    }
  }

  flushLiterals(literalBuf, result);
  return result;
}

/**
 * Flush the literal buffer into a single merged TextUnit.
 */
function flushLiterals(buf: ComparableNode[], out: SemanticUnit[]): void {
  if (buf.length === 0) return;

  const value = buf.map((n) => (n.props as LiteralProps).value).join("");
  const sourceText = buf.map((n) => n.text).join("");
  const range = mergeRanges(buf);

  out.push({ type: "text", value, sourceText, range });
  buf.length = 0;
}

/**
 * Convert a single ComparableNode into a SemanticUnit.
 */
function convertNode(node: ComparableNode): SemanticUnit {
  const range = nodeRange(node);
  const sourceText = node.text;

  switch (node.type) {
    case "anchor": {
      const props = node.props as AnchorProps;
      return { type: "anchor", anchorKind: props.kind, range, sourceText };
    }

    case "dot":
      return { type: "dot", range, sourceText };

    case "escape": {
      const props = node.props as EscapeProps;
      return {
        type: "escape",
        escapeType: props.escapeType,
        raw: props.raw,
        range,
        sourceText,
      };
    }

    case "charClass": {
      const props = node.props as CharClassProps;
      return {
        type: "charClass",
        negated: props.negated,
        members: props.members,
        range,
        sourceText,
      };
    }

    case "backreference": {
      const props = node.props as BackreferenceProps;
      return {
        type: "backreference",
        groupNumber: props.groupNumber,
        groupName: props.groupName,
        range,
        sourceText,
      };
    }

    case "quantifier": {
      const props = node.props as QuantifierProps;
      const child = node.children[0];
      const target = buildQuantifiedTarget(child);
      return {
        type: "quantified",
        min: props.min,
        max: props.max,
        greedy: props.greedy,
        target,
        range,
        sourceText,
      };
    }

    case "group": {
      const props = node.props as GroupProps;
      const body = unwrapChildren(node.children);
      return {
        type: "group",
        capturing: props.capturing,
        name: props.name,
        number: props.number,
        body,
        range,
        sourceText,
      };
    }

    case "alternation":
      return convertAlternation(node);

    case "assertion": {
      const props = node.props as AssertionProps;
      const body = unwrapChildren(node.children);
      return {
        type: "assertion",
        assertionType: props.assertionType,
        polarity: props.polarity,
        body,
        range,
        sourceText,
      };
    }

    case "alternative": {
      // Should not appear standalone at this level normally,
      // but handle gracefully by converting children inline
      const units = convertNodeList(node.children);
      if (units.length === 1) return units[0];
      // Wrap multiple units — this shouldn't happen in practice
      return {
        type: "text",
        value: node.text,
        range,
        sourceText,
      };
    }

    case "literal": {
      const props = node.props as LiteralProps;
      return { type: "text", value: props.value, range, sourceText };
    }

    default:
      return { type: "text", value: node.text, range, sourceText };
  }
}

/**
 * Build a QuantifiedTarget from the child node of a quantifier.
 */
function buildQuantifiedTarget(child: ComparableNode): QuantifiedTarget {
  switch (child.type) {
    case "escape": {
      const props = child.props as EscapeProps;
      return { kind: "escape", escapeType: props.escapeType, raw: props.raw };
    }
    case "charClass": {
      const props = child.props as CharClassProps;
      return { kind: "charClass", negated: props.negated, members: props.members };
    }
    case "dot":
      return { kind: "dot" };
    case "literal": {
      const props = child.props as LiteralProps;
      return { kind: "text", value: props.value };
    }
    case "group": {
      const props = child.props as GroupProps;
      const body = unwrapChildren(child.children);
      return {
        kind: "group",
        group: {
          type: "group",
          capturing: props.capturing,
          name: props.name,
          number: props.number,
          body,
          range: nodeRange(child),
          sourceText: child.text,
        },
      };
    }
    case "backreference": {
      const props = child.props as BackreferenceProps;
      return {
        kind: "backreference",
        groupNumber: props.groupNumber,
        groupName: props.groupName,
      };
    }
    default:
      return { kind: "text", value: child.text };
  }
}

/**
 * Convert an alternation ComparableNode into an AlternationUnit.
 */
function convertAlternation(node: ComparableNode): SemanticUnit {
  const branches = node.children.map((branch) => {
    if (branch.type === "alternative") {
      return convertNodeList(branch.children);
    }
    return [convertNode(branch)];
  });

  return {
    type: "alternation",
    branches,
    range: nodeRange(node),
    sourceText: node.text,
  };
}

// ── Utilities ──────────────────────────────────────────────

function nodeRange(node: ComparableNode): SemanticRange {
  return node.range ?? { start: 0, end: 0 };
}

function mergeRanges(nodes: ComparableNode[]): SemanticRange {
  if (nodes.length === 0) return { start: 0, end: 0 };

  const first = nodes[0].range;
  const last = nodes[nodes.length - 1].range;

  return {
    start: first?.start ?? 0,
    end: last?.end ?? 0,
  };
}
