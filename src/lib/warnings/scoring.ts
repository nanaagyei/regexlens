import { Warning } from "@/types";

/**
 * Calculate aggregate risk score from a list of warnings.
 * Uses the maximum individual score as primary factor,
 * with a small bonus for multiple warnings.
 */
export function calculateRiskScore(warnings: Warning[]): number {
  if (warnings.length === 0) return 0;

  const maxScore = Math.max(...warnings.map((w) => w.score));
  const bonus = Math.min(warnings.length * 2, 10);

  return Math.min(maxScore + bonus, 100);
}
