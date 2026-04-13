import { describe, it, expect } from "vitest";
import { calculateRiskScore } from "./scoring";
import type { Warning } from "@/types";

function makeWarning(score: number): Warning {
  return {
    id: "test",
    severity: "info",
    category: "correctness",
    title: "test",
    message: "test",
    score,
  };
}

describe("calculateRiskScore", () => {
  it("returns 0 for empty warnings array", () => {
    expect(calculateRiskScore([])).toBe(0);
  });

  it("returns the score of a single warning", () => {
    expect(calculateRiskScore([makeWarning(50)])).toBe(52);
  });

  it("uses max score as primary factor", () => {
    const warnings = [makeWarning(30), makeWarning(80), makeWarning(10)];
    const result = calculateRiskScore(warnings);
    // max=80, bonus=min(3*2, 10)=6 → 86
    expect(result).toBe(86);
  });

  it("adds bonus for multiple warnings capped at 10", () => {
    const warnings = Array.from({ length: 8 }, () => makeWarning(50));
    const result = calculateRiskScore(warnings);
    // max=50, bonus=min(8*2, 10)=10 → 60
    expect(result).toBe(60);
  });

  it("caps total at 100", () => {
    const warnings = [makeWarning(98), makeWarning(95), makeWarning(90)];
    const result = calculateRiskScore(warnings);
    // max=98, bonus=6 → 104 → capped at 100
    expect(result).toBe(100);
  });
});
