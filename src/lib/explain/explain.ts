import {
  ExplanationStep,
  ExplanationResult,
  ParseResult,
  AstNode,
  ExplanationKind,
} from "@/types";
import { getNodeRange } from "@/lib/regex/parse";

let stepCounter = 0;

function generateStepId(): string {
  return `step-${++stepCounter}`;
}

/**
 * Generate human-readable explanation steps from a parsed regex AST
 */
export function generateExplanation(parseResult: ParseResult): ExplanationResult {
  stepCounter = 0;

  if (!parseResult.ok) {
    return { steps: [] };
  }

  const steps: ExplanationStep[] = [];
  walkAndExplain(parseResult.ast, steps, 0);

  return { steps };
}

/**
 * Walk the AST and generate explanation steps
 */
function walkAndExplain(
  node: AstNode | AstNode[] | undefined,
  steps: ExplanationStep[],
  depth: number
): void {
  if (!node) return;

  if (Array.isArray(node)) {
    node.forEach((n) => walkAndExplain(n, steps, depth));
    return;
  }

  const handler = nodeHandlers[node.type];
  if (handler) {
    handler(node, steps, depth);
  } else {
    // Fallback: walk children
    walkChildren(node, steps, depth);
  }
}

function walkChildren(node: AstNode, steps: ExplanationStep[], depth: number): void {
  if (node.body) {
    walkAndExplain(node.body, steps, depth);
  }
  if (node.expression) {
    walkAndExplain(node.expression, steps, depth);
  }
  if (node.expressions) {
    walkAndExplain(node.expressions, steps, depth);
  }
  if (node.left) {
    walkAndExplain(node.left, steps, depth);
  }
  if (node.right) {
    walkAndExplain(node.right, steps, depth);
  }
}

type NodeHandler = (
  node: AstNode,
  steps: ExplanationStep[],
  depth: number
) => void;

const nodeHandlers: Record<string, NodeHandler> = {
  RegExp: handleRegExp,
  Alternative: handleAlternative,
  Disjunction: handleDisjunction,
  Group: handleGroup,
  Repetition: handleRepetition,
  Quantifier: handleQuantifier,
  CharacterClass: handleCharacterClass,
  ClassRange: handleClassRange,
  Char: handleChar,
  Assertion: handleAssertion,
  Backreference: handleBackreference,
};

function handleRegExp(
  node: AstNode,
  steps: ExplanationStep[],
  depth: number
): void {
  // Just process the body
  if (node.body) {
    walkAndExplain(node.body, steps, depth);
  }
}

function handleAlternative(
  node: AstNode,
  steps: ExplanationStep[],
  depth: number
): void {
  // Process each expression in sequence
  if (node.expressions) {
    for (const expr of node.expressions as AstNode[]) {
      walkAndExplain(expr, steps, depth);
    }
  }
}

function handleDisjunction(
  node: AstNode,
  steps: ExplanationStep[],
  depth: number
): void {
  const range = getNodeRange(node);
  
  steps.push({
    id: generateStepId(),
    label: "Either:",
    kind: "alternation",
    depth,
    range,
  });

  if (node.left) {
    steps.push({
      id: generateStepId(),
      label: "Option 1:",
      kind: "sequence",
      depth: depth + 1,
      range: getNodeRange(node.left),
    });
    walkAndExplain(node.left, steps, depth + 2);
  }

  if (node.right) {
    steps.push({
      id: generateStepId(),
      label: "Or option 2:",
      kind: "sequence",
      depth: depth + 1,
      range: getNodeRange(node.right),
    });
    walkAndExplain(node.right, steps, depth + 2);
  }
}

function handleGroup(
  node: AstNode,
  steps: ExplanationStep[],
  depth: number
): void {
  const range = getNodeRange(node);
  let label: string;
  const kind: ExplanationKind = "group";
  let detail: string | undefined;

  if (node.capturing === false) {
    label = "Non-capturing group";
    detail = "Groups without capturing the match";
  } else if (node.name) {
    label = `Named capture group "${node.name}"`;
    detail = `Captures match as "${node.name}"`;
  } else if (node.number !== undefined) {
    label = `Capture group #${node.number}`;
    detail = `Captures match as group ${node.number}`;
  } else {
    label = "Group";
  }

  steps.push({
    id: generateStepId(),
    label,
    detail,
    kind,
    depth,
    range,
  });

  // Process group contents
  if (node.expression) {
    walkAndExplain(node.expression, steps, depth + 1);
  }
}

function handleRepetition(
  node: AstNode,
  steps: ExplanationStep[],
  depth: number
): void {
  const range = getNodeRange(node);
  const quantifier = node.quantifier as AstNode | undefined;
  
  let label = "";
  let detail: string | undefined;

  if (quantifier) {
    const greedy = quantifier.greedy !== false;
    const greedyNote = greedy ? "" : " (lazy - match as few as possible)";

    if (quantifier.kind_ === "*") {
      label = `Zero or more times${greedyNote}`;
    } else if (quantifier.kind_ === "+") {
      label = `One or more times${greedyNote}`;
    } else if (quantifier.kind_ === "?") {
      label = `Optional (zero or one)${greedyNote}`;
    } else if (quantifier.kind_ === "Range") {
      const from = quantifier.from ?? 0;
      const to = quantifier.to;

      if (to === undefined) {
        label = `${from} or more times${greedyNote}`;
      } else if (from === to) {
        label = `Exactly ${from} time${from === 1 ? "" : "s"}`;
      } else {
        label = `Between ${from} and ${to} times${greedyNote}`;
      }
    }
  }

  if (label) {
    steps.push({
      id: generateStepId(),
      label,
      detail,
      kind: "quantifier",
      depth,
      range,
    });
  }

  // Process the repeated expression
  if (node.expression) {
    walkAndExplain(node.expression, steps, depth + 1);
  }
}

function handleQuantifier(
  node: AstNode,
  steps: ExplanationStep[],
  depth: number
): void {
  // Quantifiers are usually handled as part of Repetition
  // This is a fallback
  const range = getNodeRange(node);
  
  steps.push({
    id: generateStepId(),
    label: "Quantifier",
    kind: "quantifier",
    depth,
    range,
  });
}

function handleCharacterClass(
  node: AstNode,
  steps: ExplanationStep[],
  depth: number
): void {
  const range = getNodeRange(node);
  const negative = node.negative;
  const expressions = node.expressions as AstNode[] | undefined;

  let label: string;
  let detail: string | undefined;

  // Build a description of the character class
  const chars: string[] = [];
  
  if (expressions) {
    for (const expr of expressions) {
      if (expr.type === "Char") {
        chars.push(describeChar(expr));
      } else if (expr.type === "ClassRange") {
        // ClassRange nodes have from/to as child AstNodes
        const from = (expr as unknown as { from: AstNode }).from;
        const to = (expr as unknown as { to: AstNode }).to;
        chars.push(`${describeChar(from)} to ${describeChar(to)}`);
      }
    }
  }

  if (chars.length === 0) {
    label = negative ? "No characters (negated empty class)" : "Any character in class";
  } else if (chars.length <= 3) {
    label = negative
      ? `Any character except: ${chars.join(", ")}`
      : `One of: ${chars.join(", ")}`;
  } else {
    label = negative
      ? `Any character except ${chars.length} specified`
      : `One of ${chars.length} characters`;
    detail = chars.join(", ");
  }

  steps.push({
    id: generateStepId(),
    label,
    detail,
    kind: "charclass",
    depth,
    range,
  });
}

function handleClassRange(
  node: AstNode,
  steps: ExplanationStep[],
  depth: number
): void {
  // Usually handled within CharacterClass
  const range = getNodeRange(node);
  // ClassRange nodes have from/to as child AstNodes
  const from = (node as unknown as { from: AstNode }).from;
  const to = (node as unknown as { to: AstNode }).to;

  steps.push({
    id: generateStepId(),
    label: `Range: ${describeChar(from)} to ${describeChar(to)}`,
    kind: "charclass",
    depth,
    range,
  });
}

function handleChar(
  node: AstNode,
  steps: ExplanationStep[],
  depth: number
): void {
  const range = getNodeRange(node);
  const { label, kind, detail } = describeCharNode(node);

  steps.push({
    id: generateStepId(),
    label,
    detail,
    kind,
    depth,
    range,
  });
}

function handleAssertion(
  node: AstNode,
  steps: ExplanationStep[],
  depth: number
): void {
  const range = getNodeRange(node);
  let label: string;
  let detail: string | undefined;
  let kind: ExplanationKind = "anchor";

  switch (node.kind) {
    case "^":
      label = "Start of input";
      detail = "Matches the position at the start of the string";
      break;
    case "$":
      label = "End of input";
      detail = "Matches the position at the end of the string";
      break;
    case "\\b":
      label = "Word boundary";
      detail = "Matches between a word character and non-word character";
      break;
    case "\\B":
      label = "Non-word boundary";
      detail = "Matches where \\b does not match";
      break;
    case "Lookahead":
      label = node.negative ? "Negative lookahead" : "Positive lookahead";
      detail = node.negative
        ? "Assert what follows does NOT match"
        : "Assert what follows matches (without consuming)";
      kind = "lookahead";
      break;
    case "Lookbehind":
      label = node.negative ? "Negative lookbehind" : "Positive lookbehind";
      detail = node.negative
        ? "Assert what precedes does NOT match"
        : "Assert what precedes matches (without consuming)";
      kind = "lookbehind";
      break;
    default:
      label = `Assertion: ${node.kind}`;
  }

  steps.push({
    id: generateStepId(),
    label,
    detail,
    kind,
    depth,
    range,
  });

  // Process assertion body for lookahead/lookbehind
  if (node.assertion) {
    walkAndExplain(node.assertion as AstNode, steps, depth + 1);
  }
}

function handleBackreference(
  node: AstNode,
  steps: ExplanationStep[],
  depth: number
): void {
  const range = getNodeRange(node);
  const ref = node.reference ?? node.referenceRaw;

  steps.push({
    id: generateStepId(),
    label: `Back-reference to group ${ref}`,
    detail: "Matches the same text as previously matched by the group",
    kind: "backreference",
    depth,
    range,
  });
}

// Helper functions

function describeChar(node: AstNode): string {
  if (node.escaped) {
    return describeEscape(node);
  }
  
  if (node.value !== undefined) {
    // Handle special characters
    if (node.value === " ") return "space";
    if (node.value === "\t") return "tab";
    if (node.value === "\n") return "newline";
    if (node.value === "\r") return "carriage return";
    return `"${node.value}"`;
  }

  if (node.symbol) {
    return node.symbol;
  }

  return "character";
}

function describeEscape(node: AstNode): string {
  const val = node.value ?? node.symbol ?? "";
  
  switch (val) {
    case "d": return "digit";
    case "D": return "non-digit";
    case "w": return "word char";
    case "W": return "non-word char";
    case "s": return "whitespace";
    case "S": return "non-whitespace";
    case "n": return "newline";
    case "r": return "carriage return";
    case "t": return "tab";
    case "0": return "null";
    default:
      if (node.codePoint !== undefined) {
        return `U+${node.codePoint.toString(16).toUpperCase()}`;
      }
      return `\\${val}`;
  }
}

function describeCharNode(node: AstNode): {
  label: string;
  kind: ExplanationKind;
  detail?: string;
} {
  if (node.escaped) {
    const val = node.value ?? node.symbol ?? "";
    
    switch (val) {
      case "d":
        return { label: "Any digit (0-9)", kind: "escape" };
      case "D":
        return { label: "Any non-digit", kind: "escape" };
      case "w":
        return {
          label: "Word character",
          kind: "escape",
          detail: "Letter, digit, or underscore",
        };
      case "W":
        return { label: "Non-word character", kind: "escape" };
      case "s":
        return {
          label: "Whitespace",
          kind: "escape",
          detail: "Space, tab, newline, etc.",
        };
      case "S":
        return { label: "Non-whitespace", kind: "escape" };
      case "n":
        return { label: "Newline", kind: "escape" };
      case "r":
        return { label: "Carriage return", kind: "escape" };
      case "t":
        return { label: "Tab", kind: "escape" };
      case "0":
        return { label: "Null character", kind: "escape" };
      default:
        if (node.codePoint !== undefined) {
          return {
            label: `Unicode character U+${node.codePoint.toString(16).toUpperCase()}`,
            kind: "escape",
          };
        }
        return { label: `Literal "${val}"`, kind: "literal" };
    }
  }

  // Non-escaped characters
  const val = node.value ?? node.symbol ?? "";

  if (val === ".") {
    return {
      label: "Any character",
      kind: "escape",
      detail: "Matches any character except newline (unless 's' flag is set)",
    };
  }

  // Regular literal
  return {
    label: `Literal "${val}"`,
    kind: "literal",
  };
}
