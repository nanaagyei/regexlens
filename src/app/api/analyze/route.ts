import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isGuardOk } from "@/lib/auth/requireAuth";
import { combinedRateLimit } from "@/lib/security/rateLimit";
import {
  analyzeRequestSchema,
  validateInput,
  formatZodError,
} from "@/lib/security/validation";

interface Warning {
  id: string;
  severity: "info" | "warn" | "danger";
  title: string;
  message: string;
  hint?: string;
  range?: { start: number; end: number };
}

interface SafeRewriteSuggestion {
  id: string;
  title: string;
  description: string;
  caveat?: string;
}

interface AnalysisResult {
  riskScore: number;
  warnings: Warning[];
  notes: string[];
  suggestions: SafeRewriteSuggestion[];
  complexity: {
    level: "low" | "medium" | "high" | "extreme";
    factors: string[];
  };
}

/**
 * POST /api/analyze - Run advanced regex analysis
 * 
 * Returns:
 * - riskScore: 0-100 aggregate risk score
 * - warnings: Array of detailed warnings
 * - notes: Array of rewrite suggestions
 * - complexity: Complexity assessment
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResponse = await combinedRateLimit(request, "api_free");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Require authentication
    const guard = await requireAuth();
    if (!isGuardOk(guard)) {
      return guard;
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "invalid_json", message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validation = validateInput(analyzeRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 });
    }

    const { pattern, flags } = validation.data;

    // Validate the regex pattern
    try {
      new RegExp(pattern, flags);
    } catch (regexError) {
      return NextResponse.json(
        {
          error: "invalid_regex",
          message: "The provided pattern is not a valid regular expression",
          details: regexError instanceof Error ? regexError.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    // Run advanced analysis
    const result = analyzePattern(pattern, flags);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to analyze pattern" },
      { status: 500 }
    );
  }
}

/**
 * Analyze a regex pattern for potential issues
 */
function analyzePattern(pattern: string, flags: string): AnalysisResult {
  const warnings: Warning[] = [];
  const notes: string[] = [];
  const suggestions: SafeRewriteSuggestion[] = [];
  const complexityFactors: string[] = [];
  let riskScore = 0;

  // ============================================
  // Catastrophic Backtracking Detection
  // ============================================

  // Nested quantifiers (DANGER)
  const nestedQuantifierPatterns = [
    /\([^)*+]*[*+][^)]*\)[+*]/,
    /\([^)*+]*[*+][^)]*\)\{/,
    /\([^){]*\{(?:[^)}]*\}[^){]*\{)*(?:\)[^}]*|[^)}]+(?:\)[^}]*)?)\}[^)]*\)[+*]/,
  ];

  for (const testPattern of nestedQuantifierPatterns) {
    if (testPattern.test(pattern)) {
      warnings.push({
        id: "nested-quantifiers",
        severity: "danger",
        title: "Nested quantifiers detected",
        message:
          "This pattern contains nested quantifiers (e.g., (a+)+) which can cause catastrophic backtracking on certain inputs.",
        hint: "Consider rewriting to avoid nested repetition, or use atomic groups if available.",
      });
      suggestions.push({
        id: "nested-quantifiers",
        title: "Flatten nested repetition",
        description: "Rewrite (a+)+ as a+ with a single quantifier where possible. Or replace the inner group with a non-capturing (?:...) and limit the outer quantifier.",
        caveat: "JavaScript has no atomic groups. For complex cases, consider splitting validation into multiple passes.",
      });
      riskScore += 40;
      complexityFactors.push("Nested quantifiers");
      break;
    }
  }

  // Overlapping alternation in repetition (DANGER)
  if (/\((?:[^|)]+\|)+[^)]+\)[+*]/.test(pattern)) { // eslint-disable-line regexp/optimal-quantifier-concatenation -- readable as-is
    const hasOverlap = checkAlternationOverlap(pattern);
    if (hasOverlap) {
      warnings.push({
        id: "overlapping-alternation",
        severity: "danger",
        title: "Overlapping alternation in repetition",
        message:
          "Alternation with potentially overlapping branches inside a quantifier can cause exponential backtracking.",
        hint: "Make alternation branches mutually exclusive or anchor them.",
      });
      suggestions.push({
        id: "overlapping-alternation",
        title: "Reorder or constrain alternation",
        description: "Place longer/more specific branches first (e.g. (aa|a) instead of (a|aa)). Or use anchors and more specific character classes to make branches mutually exclusive.",
        caveat: "These are heuristic suggestions; correctness depends on your use case.",
      });
      riskScore += 35;
      complexityFactors.push("Overlapping alternation");
    }
  }

  // Ambiguous .* or .+ (WARN)
  if (/\.\*(?!\?)/.test(pattern) || /\.\+(?!\?)/.test(pattern)) {
    warnings.push({
      id: "greedy-dot-star",
      severity: "warn",
      title: "Greedy .* or .+ detected",
      message:
        "Greedy dot-star (.*) or dot-plus (.+) can match more than intended and cause backtracking.",
      hint: "Consider using lazy quantifiers (.*? or .+?) or more specific character classes.",
    });
    riskScore += 15;
    notes.push("Consider replacing .* with a more specific pattern like [^\\n]* or .*?");
  }

  // Multiple .* in sequence (WARN)
  if ((pattern.match(/\.\*/g) || []).length > 1) {
    warnings.push({
      id: "multiple-dot-star",
      severity: "warn",
      title: "Multiple .* patterns",
      message:
        "Multiple greedy .* patterns can interact badly, causing excessive backtracking.",
      hint: "Try to anchor patterns or use more specific character classes.",
    });
    riskScore += 20;
    complexityFactors.push("Multiple greedy patterns");
  }

  // ============================================
  // Correctness Checks
  // ============================================

  // Unescaped dot outside character class (INFO)
  const unescapedDots = findUnescapedDots(pattern);
  if (unescapedDots.length > 0) {
    warnings.push({
      id: "unescaped-dot",
      severity: "info",
      title: "Unescaped dots detected",
      message: `Found ${unescapedDots.length} unescaped dot(s). Each matches any character, not just a literal period.`,
      hint: "Use \\. if you want to match a literal period.",
    });
    riskScore += 5;
  }

  // Pipe in character class (INFO)
  if (/\[[^\]|]*\|[^\]]*\]/.test(pattern)) {
    warnings.push({
      id: "pipe-in-class",
      severity: "info",
      title: "Pipe character in character class",
      message:
        "The | character inside [] is a literal pipe, not alternation. Use (a|b) for alternation.",
      hint: "Remove | from character class or use alternation syntax outside [].",
    });
    riskScore += 5;
  }

  // Empty alternatives (WARN)
  if (/\(\||\|\)|\|\|/.test(pattern)) {
    warnings.push({
      id: "empty-alternative",
      severity: "warn",
      title: "Empty alternative detected",
      message:
        "This pattern has an empty alternative (e.g., (foo|) or (|bar)), which matches empty strings.",
      hint: "Use (foo)? instead of (foo|) if you want optional matching.",
    });
    riskScore += 10;
  }

  // ============================================
  // Flag-specific checks
  // ============================================

  // Multiline flag with anchors (INFO)
  if (flags.includes("m") && /[\^$]/.test(pattern)) {
    warnings.push({
      id: "multiline-anchors",
      severity: "info",
      title: "Multiline mode with anchors",
      message:
        "With the 'm' flag, ^ and $ match start/end of lines, not just the entire string.",
      hint: "Use \\A and \\z (if supported) for string boundaries, or remove 'm' flag.",
    });
  }

  // dotAll flag with dot (INFO)
  if (flags.includes("s") && pattern.includes(".")) {
    warnings.push({
      id: "dotall-mode",
      severity: "info",
      title: "dotAll mode enabled",
      message: "With the 's' flag, . matches newlines as well as other characters.",
      hint: "Be aware that .* will match across lines.",
    });
  }

  // ============================================
  // Complexity Assessment
  // ============================================

  // Count quantifiers
  const quantifierCount = (pattern.match(/[+*?]|\{[\d,]+\}/g) || []).length;
  if (quantifierCount > 5) {
    complexityFactors.push(`${quantifierCount} quantifiers`);
    riskScore += Math.min(quantifierCount * 2, 20);
  }

  // Count groups
  const groupCount = (pattern.match(/\(/g) || []).length;
  if (groupCount > 5) {
    complexityFactors.push(`${groupCount} groups`);
    riskScore += Math.min(groupCount, 15);
  }

  // Count alternations
  const alternationCount = (pattern.match(/\|/g) || []).length;
  if (alternationCount > 3) {
    complexityFactors.push(`${alternationCount} alternations`);
    riskScore += Math.min(alternationCount * 2, 15);
  }

  // Pattern length
  if (pattern.length > 200) {
    complexityFactors.push("Long pattern");
    riskScore += 10;
    notes.push("Consider breaking this pattern into smaller, more maintainable parts.");
  }

  // Lookaheads/lookbehinds
  if (/\(\?[=!<]/.test(pattern)) {
    complexityFactors.push("Lookaround assertions");
    riskScore += 5;
  }

  // Backreferences
  if (/\\[1-9]/.test(pattern)) {
    complexityFactors.push("Backreferences");
    riskScore += 5;
  }

  // ============================================
  // Determine complexity level
  // ============================================

  let complexityLevel: "low" | "medium" | "high" | "extreme";
  if (riskScore < 20) {
    complexityLevel = "low";
  } else if (riskScore < 40) {
    complexityLevel = "medium";
  } else if (riskScore < 70) {
    complexityLevel = "high";
  } else {
    complexityLevel = "extreme";
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  // Add general notes based on analysis
  if (riskScore >= 40) {
    notes.push(
      "This pattern has elevated risk. Consider testing with various inputs before production use."
    );
  }

  if (warnings.some((w) => w.severity === "danger")) {
    notes.push(
      "CRITICAL: This pattern may cause severe performance issues. Review and refactor before use."
    );
  }

  return {
    riskScore,
    warnings,
    notes,
    suggestions,
    complexity: {
      level: complexityLevel,
      factors: complexityFactors,
    },
  };
}

/**
 * Find unescaped dots outside character classes
 */
function findUnescapedDots(pattern: string): number[] {
  const positions: number[] = [];
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

    if (char === "[" && !inCharClass) {
      inCharClass = true;
      continue;
    }

    if (char === "]" && inCharClass) {
      inCharClass = false;
      continue;
    }

    if (char === "." && !inCharClass) {
      positions.push(i);
    }
  }

  return positions;
}

/**
 * Check if alternation branches might overlap
 */
function checkAlternationOverlap(pattern: string): boolean {
  // Simple heuristic: check for common patterns that indicate overlap
  // This is a simplified check - full analysis would require parsing

  // Common overlapping patterns
  const overlappingPatterns = [
    /\(a\+?\|aa\+?\)/i, // (a|aa)
    /\(\w\+?\|\w\w\+?\)/, // Similar patterns
    /\([^|]+\*\|[^|]+\*\)/, // Both branches have *
  ];

  return overlappingPatterns.some((p) => p.test(pattern));
}
