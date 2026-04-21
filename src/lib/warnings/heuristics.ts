import {
  Warning,
  WarningsResult,
  ParseResult,
  MatchResult,
  AstNode,
  WARNING_IDS,
  REGEX_CONFIG,
} from "@/types";
import { walkAst, getNodeRange } from "@/lib/regex/parse";
import { calculateRiskScore } from "./scoring";

/**
 * Find the first occurrence of a character in a pattern,
 * skipping escaped characters and characters inside character classes.
 */
function findUnescapedChar(
  pattern: string,
  target: string
): number {
  let inCharClass = false;
  let escaped = false;

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "[") {
      inCharClass = true;
      continue;
    }

    if (char === "]" && inCharClass) {
      inCharClass = false;
      continue;
    }

    if (char === target && !inCharClass) {
      return i;
    }
  }

  return -1;
}

/**
 * Run all warning heuristics on a regex pattern
 */
export function analyzeWarnings(
  pattern: string,
  flags: string,
  parseResult: ParseResult,
  matchResult: MatchResult
): WarningsResult {
  const warnings: Warning[] = [];

  // Pattern-level checks (don't need AST)
  checkPatternLength(pattern, warnings);
  checkUnescapedDot(pattern, warnings);
  checkPipeInCharClass(pattern, warnings);
  checkEmptyAlternative(pattern, warnings);

  // AST-based checks
  if (parseResult.ok) {
    checkNestedQuantifiers(parseResult.ast, warnings);
    checkAmbiguousDotStar(parseResult.ast, pattern, warnings);
    checkAlternationInRepetition(parseResult.ast, warnings);
  }

  // Flag-aware checks
  checkMultilineAnchors(pattern, flags, warnings);
  checkDotAllDot(pattern, flags, warnings);

  // Match-based checks
  checkExcessiveMatches(matchResult, warnings);

  // Calculate risk score
  const riskScore = calculateRiskScore(warnings);

  // Sort by severity (danger first)
  warnings.sort((a, b) => b.score - a.score);

  return { warnings, riskScore };
}

/**
 * Check for excessively long patterns
 */
function checkPatternLength(pattern: string, warnings: Warning[]): void {
  if (pattern.length > REGEX_CONFIG.MAX_PATTERN_LENGTH * 0.8) {
    warnings.push({
      id: WARNING_IDS.EXCESSIVE_PATTERN_LENGTH,
      severity: pattern.length > REGEX_CONFIG.MAX_PATTERN_LENGTH ? "danger" : "warn",
      category: "maintainability",
      title: "Very long pattern",
      message: `This pattern is ${pattern.length} characters long.`,
      hint: "Very long patterns are harder to maintain and may impact performance. Consider splitting into smaller patterns.",
      score: pattern.length > REGEX_CONFIG.MAX_PATTERN_LENGTH ? 85 : 50,
    });
  }
}

/**
 * Check for unescaped dots (common mistake)
 */
function checkUnescapedDot(pattern: string, warnings: Warning[]): void {
  // Find dots that aren't escaped and aren't in a character class
  let inCharClass = false;
  let escaped = false;
  
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (char === "\\") {
      escaped = true;
      continue;
    }
    
    if (char === "[") {
      inCharClass = true;
      continue;
    }
    
    if (char === "]" && inCharClass) {
      inCharClass = false;
      continue;
    }
    
    if (char === "." && !inCharClass) {
      // Check if this looks like it might be intended as a literal dot
      // e.g., in patterns like "example.com"
      const before = pattern[i - 1] || "";
      const after = pattern[i + 1] || "";
      
      if (/[a-z]/i.test(before) && /[a-z]/i.test(after)) {
        warnings.push({
          id: WARNING_IDS.UNESCAPED_DOT,
          severity: "info",
          category: "correctness",
          title: "Unescaped dot",
          message: "The dot (.) matches any character, not just a literal dot.",
          hint: "Use \\. to match a literal dot. Unescaped . matches any character — foo.bar also matches fooXbar.",
          range: { start: i, end: i + 1 },
          score: 25,
        });
        break; // Only warn once
      }
    }
  }
}

/**
 * Check for pipe inside character class (common mistake)
 */
function checkPipeInCharClass(pattern: string, warnings: Warning[]): void {
  // Find [A|B] patterns
  const charClassRegex = /\[[^\]|]*\|[^\]]*\]/g;
  let match;
  
  while ((match = charClassRegex.exec(pattern)) !== null) {
    warnings.push({
      id: WARNING_IDS.PIPE_IN_CHARCLASS,
      severity: "info",
      category: "correctness",
      title: "Pipe inside character class",
      message: "Inside [...], the | is a literal pipe character, not OR.",
      hint: "Inside [...], pipe is literal. Use (A|B) for alternation, or [AB] for a character class.",
      range: { start: match.index, end: match.index + match[0].length },
      score: 30,
    });
  }
}

/**
 * Check for empty alternatives like (foo|) or (|bar)
 */
function checkEmptyAlternative(pattern: string, warnings: Warning[]): void {
  // Check for patterns like (|, |), or ||
  if (pattern.includes("(|") || pattern.includes("|)") || pattern.includes("||")) {
    const positions: number[] = [];
    
    for (let i = 0; i < pattern.length; i++) {
      if (
        (pattern[i] === "(" && pattern[i + 1] === "|") ||
        (pattern[i] === "|" && pattern[i + 1] === ")") ||
        (pattern[i] === "|" && pattern[i + 1] === "|")
      ) {
        positions.push(i);
      }
    }
    
    if (positions.length > 0) {
      warnings.push({
        id: WARNING_IDS.EMPTY_ALTERNATIVE,
        severity: "warn",
        category: "correctness",
        title: "Empty alternative",
        message: "This alternation includes an empty option.",
        hint: "If optional, use (foo)? instead. Otherwise, remove the extra |.",
        range: { start: positions[0], end: positions[0] + 2 },
        score: 45,
      });
    }
  }
}

/**
 * Check for nested quantifiers (catastrophic backtracking risk)
 */
function checkNestedQuantifiers(ast: AstNode, warnings: Warning[]): void {
  // Pattern: (x+)+ or (x*)+ etc.
  walkAst(ast, (node, parent) => {
    if (node.type === "Repetition" && parent?.type === "Repetition") {
      const range = getNodeRange(node);
      warnings.push({
        id: WARNING_IDS.NESTED_QUANTIFIERS,
        severity: "danger",
        category: "performance",
        title: "Nested quantifiers detected",
        message: "This pattern has a quantifier inside another quantifier.",
        hint: "Rewrite to remove nesting — e.g. (a+)+ can be simplified to a+. Nested quantifiers cause exponential backtracking on non-matching input.",
        range,
        score: 90,
      });
    }
  });

  // Also check for quantified groups containing quantifiers
  walkAst(ast, (node) => {
    if (node.type === "Repetition") {
      const expr = node.expression as AstNode;
      if (expr?.type === "Group") {
        // Check if group body contains a quantifier
        let hasInnerQuantifier = false;
        walkAst(expr.expression, (inner) => {
          if (inner.type === "Repetition") {
            hasInnerQuantifier = true;
          }
        });
        
        if (hasInnerQuantifier) {
          const range = getNodeRange(node);
          // Check if we already added this warning
          const alreadyWarned = warnings.some(
            (w) =>
              w.id === WARNING_IDS.NESTED_QUANTIFIERS &&
              w.range?.start === range?.start
          );
          
          if (!alreadyWarned) {
            warnings.push({
              id: WARNING_IDS.NESTED_QUANTIFIERS,
              severity: "danger",
              category: "performance",
              title: "Nested quantifiers in group",
              message: "A quantified group contains another quantifier.",
              hint: "Rewrite (a+)+ as a+. Nested quantifiers cause O(2^n) backtracking on non-matching input.",
              range,
              score: 95,
            });
          }
        }
      }
    }
  });
}

/**
 * Check for ambiguous .* patterns
 */
function checkAmbiguousDotStar(
  ast: AstNode,
  pattern: string,
  warnings: Warning[]
): void {
  // Simple heuristic: .* or .+ not at the end of the pattern
  const dotStarRegex = /\.[*+]/g;
  let match;
  
  while ((match = dotStarRegex.exec(pattern)) !== null) {
    // Check if there's more pattern after this
    const afterMatch = pattern.slice(match.index + 2);
    if (afterMatch.length > 0 && !/^[)\]}]*$/.test(afterMatch)) {
      warnings.push({
        id: WARNING_IDS.AMBIGUOUS_DOT_STAR,
        severity: "warn",
        category: "performance",
        title: "Greedy .* or .+ before more pattern",
        message: "This pattern uses .* or .+ followed by more characters.",
        hint: "Replace .* with a specific class like [^\\n]* or make it lazy: .*? — greedy dot-star backtracks over every character.",
        range: { start: match.index, end: match.index + 2 },
        score: 55,
      });
      break; // Only warn once
    }
  }
}

/**
 * Check for alternation inside repetition
 */
function checkAlternationInRepetition(ast: AstNode, warnings: Warning[]): void {
  walkAst(ast, (node) => {
    if (node.type === "Repetition") {
      const expr = node.expression as AstNode;
      if (expr?.type === "Group") {
        // Check if group contains alternation
        walkAst(expr.expression, (inner) => {
          if (inner.type === "Disjunction") {
            const range = getNodeRange(node);
            warnings.push({
              id: WARNING_IDS.ALTERNATION_IN_REPETITION,
              severity: "warn",
              category: "performance",
              title: "Alternation in repeated group",
              message: "A repeated group contains alternation (|).",
              hint: "If alternatives can match overlapping text, this may backtrack heavily. Ensure each branch matches distinct characters.",
              range,
              score: 50,
            });
          }
        });
      }
    }
  });
}

/**
 * Check for ^ or $ with multiline flag
 */
function checkMultilineAnchors(
  pattern: string,
  flags: string,
  warnings: Warning[]
): void {
  if (flags.includes("m") && (pattern.includes("^") || pattern.includes("$"))) {
    const caretPos = findUnescapedChar(pattern, "^");
    const dollarPos = findUnescapedChar(pattern, "$");
    const anchorPos = caretPos >= 0 ? caretPos : dollarPos;
    const range = anchorPos >= 0 ? { start: anchorPos, end: anchorPos + 1 } : undefined;

    warnings.push({
      id: WARNING_IDS.MULTILINE_ANCHORS,
      severity: "info",
      category: "readability",
      title: "Multiline mode affects anchors",
      message: "With the 'm' flag, ^ and $ match start/end of each line, not the entire string.",
      hint: "Remove the m flag if you only want to match start/end of the entire string.",
      range,
      score: 20,
    });
  }
}

/**
 * Check for . with dotAll flag
 */
function checkDotAllDot(
  pattern: string,
  flags: string,
  warnings: Warning[]
): void {
  if (flags.includes("s") && pattern.includes(".")) {
    const dotPos = findUnescapedChar(pattern, ".");
    const range = dotPos >= 0 ? { start: dotPos, end: dotPos + 1 } : undefined;

    warnings.push({
      id: WARNING_IDS.DOTALL_DOT,
      severity: "info",
      category: "readability",
      title: "dotAll mode affects dot",
      message: "With the 's' flag, dot (.) also matches newlines.",
      hint: "Use [^\\n] instead of . if you want to exclude newlines.",
      range,
      score: 15,
    });
  }
}

/**
 * Check for too many matches
 */
function checkExcessiveMatches(
  matchResult: MatchResult,
  warnings: Warning[]
): void {
  if (matchResult.truncated) {
    warnings.push({
      id: WARNING_IDS.EXCESSIVE_MATCHES,
      severity: "warn",
      category: "performance",
      title: "Many matches",
      message: `Found ${matchResult.totalCount} matches (showing first ${REGEX_CONFIG.MAX_MATCHES}).`,
      hint: "Consider using a more specific pattern to reduce matches.",
      score: 40,
    });
  }
}

