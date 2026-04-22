import regexpTree from "regexp-tree";
import { ParseResult, AstNode, REGEX_CONFIG } from "@/types";
import { normalizeAst } from "./normalizeAst";

/**
 * Detect PCRE recursion constructs (?R) or (?n) for n=0..9
 */
function detectPcreRecursion(
  pattern: string
): { found: boolean; range?: { start: number; end: number } } {
  const match = pattern.match(/\(\?[R0-9]\)/);
  if (match && match.index !== undefined) {
    return {
      found: true,
      range: { start: match.index, end: match.index + match[0].length },
    };
  }
  return { found: false };
}

/**
 * Parse a regex pattern into an AST using regexp-tree
 */
export function parseRegex(pattern: string, flags: string): ParseResult {
  // Handle empty pattern
  if (!pattern) {
    const ast = {
      type: "RegExp",
      body: { type: "Alternative", expressions: [] } as AstNode,
      flags,
    } as AstNode;
    return {
      ok: true,
      ast,
      normalizedPattern: "",
      normalized: { key: "pattern", type: "pattern" as const, text: "", props: { flags }, children: [] },
    };
  }

  // Check pattern length limit
  if (pattern.length > REGEX_CONFIG.MAX_PATTERN_LENGTH) {
    return {
      ok: false,
      errorMessage: `Pattern exceeds maximum length of ${REGEX_CONFIG.MAX_PATTERN_LENGTH} characters`,
    };
  }

  // Detect PCRE recursion - JavaScript does not support (?R) or (?n)
  const pcreRecursion = detectPcreRecursion(pattern);
  if (pcreRecursion.found) {
    return {
      ok: false,
      errorMessage:
        "This pattern uses PCRE recursion (?R), which JavaScript regex does not support. Use a PCRE-compatible tool (e.g. PHP, Perl, PCRE2) or rewrite without recursion.",
      errorRange: pcreRecursion.range,
    };
  }

  try {
    // Parse with location info
    const ast = regexpTree.parse(`/${pattern}/${flags}`, {
      captureLocations: true,
    }) as unknown as AstNode;

    const normalized = normalizeAst(ast);

    return {
      ok: true,
      ast,
      normalizedPattern: pattern,
      normalized,
    };
  } catch (error) {
    return {
      ok: false,
      errorMessage: formatParseError(error),
      errorRange: extractErrorRange(error),
    };
  }
}

/**
 * Format parse errors into user-friendly messages
 */
function formatParseError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // Clean up common error messages
    if (message.includes("Invalid regular expression")) {
      return message.replace("Invalid regular expression: ", "");
    }
    
    if (message.includes("Unexpected token")) {
      return `Syntax error: ${message}`;
    }
    
    if (message.includes("Unterminated")) {
      return message;
    }
    
    if (message.includes("Nothing to repeat")) {
      return "Nothing to repeat - quantifier needs something to match";
    }
    
    if (message.includes("Invalid escape")) {
      return message;
    }

    return message;
  }
  
  return "Invalid regex pattern";
}

/**
 * Extract error position from parse error if available
 */
function extractErrorRange(error: unknown): { start: number; end: number } | undefined {
  if (error instanceof Error) {
    // regexp-tree errors sometimes include position info
    const posMatch = error.message.match(/at position (\d+)/);
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      return { start: pos, end: pos + 1 };
    }
    
    // Try to extract column info
    const colMatch = error.message.match(/column (\d+)/);
    if (colMatch) {
      const col = parseInt(colMatch[1], 10) - 1; // 0-indexed
      return { start: col, end: col + 1 };
    }
  }
  
  return undefined;
}

/**
 * Get the source range for an AST node
 */
export function getNodeRange(node: AstNode): { start: number; end: number } | undefined {
  if (node.loc) {
    // Adjust for the leading /
    return {
      start: node.loc.start.offset - 1,
      end: node.loc.end.offset - 1,
    };
  }
  return undefined;
}

/**
 * Walk the AST and call visitor for each node
 */
export function walkAst(
  node: AstNode | AstNode[] | undefined,
  visitor: (node: AstNode, parent: AstNode | null) => void,
  parent: AstNode | null = null
): void {
  if (!node) return;

  if (Array.isArray(node)) {
    node.forEach((n) => walkAst(n, visitor, parent));
    return;
  }

  visitor(node, parent);

  // Walk children based on node type
  if (node.body) {
    walkAst(node.body, visitor, node);
  }
  if (node.expression) {
    walkAst(node.expression, visitor, node);
  }
  if (node.expressions) {
    walkAst(node.expressions, visitor, node);
  }
  if (node.left) {
    walkAst(node.left, visitor, node);
  }
  if (node.right) {
    walkAst(node.right, visitor, node);
  }
}
