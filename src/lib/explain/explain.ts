import type { ExplanationResult, ExplanationMode, ParseResult } from "@/types";
import { toSemanticUnits } from "./toSemanticUnits";
import { formatSimple } from "./formatSimple";
import { formatTechnical } from "./formatTechnical";

/**
 * Generate human-readable explanation steps from a parsed regex.
 *
 * Pipeline: ComparableNode → SemanticUnit[] → ExplanationStep[]
 *
 * The intermediate SemanticUnit layer applies merging rules:
 * - Adjacent literals merge into a single text unit
 * - Quantifiers absorb their target into a fused description
 *
 * The formatter then converts to ExplanationSteps with mode-specific phrasing:
 * - "simple": human-readable, concise, non-capturing groups suppressed
 * - "technical": token-aware, precise, greedy/lazy shown
 */
export function generateExplanation(
  parseResult: ParseResult,
  mode: ExplanationMode = "simple"
): ExplanationResult {
  if (!parseResult.ok) {
    return { steps: [] };
  }

  const units = toSemanticUnits(parseResult.normalized);
  const steps =
    mode === "technical" ? formatTechnical(units) : formatSimple(units);

  return { steps };
}
