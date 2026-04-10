import { describe, it, expect } from "vitest";
import { parseRegex } from "@/lib/regex/parse";
import { generateExplanation } from "./explain";

describe("generateExplanation", () => {
  it("returns no steps when parse failed", () => {
    const parseResult = parseRegex("[", "");
    const { steps } = generateExplanation(parseResult);
    expect(steps).toEqual([]);
  });

  it("produces steps for a parsed pattern in simple mode", () => {
    const parseResult = parseRegex("\\d+", "i");
    expect(parseResult.ok).toBe(true);
    const { steps } = generateExplanation(parseResult, "simple");
    expect(steps).toHaveLength(1);
    expect(steps[0].label).toContain("digit");
  });

  it("produces steps for a parsed pattern in technical mode", () => {
    const parseResult = parseRegex("\\d+", "i");
    expect(parseResult.ok).toBe(true);
    const { steps } = generateExplanation(parseResult, "technical");
    expect(steps).toHaveLength(1);
    expect(steps[0].label).toContain("\\d+");
  });

  it("defaults to simple mode when mode omitted", () => {
    const parseResult = parseRegex("abc", "");
    const { steps } = generateExplanation(parseResult);
    expect(steps).toHaveLength(1);
    expect(steps[0].label).toContain("text");
  });

  it("produces different output for simple vs technical", () => {
    const parseResult = parseRegex("(?:abc)", "");
    const simple = generateExplanation(parseResult, "simple");
    const technical = generateExplanation(parseResult, "technical");

    // Simple mode suppresses non-capturing groups
    expect(simple.steps.some((s) => s.label.includes("Non-capturing"))).toBe(false);
    // Technical mode shows them
    expect(technical.steps.some((s) => s.label.includes("Non-capturing"))).toBe(true);
  });

  it("returns deterministic output for same input", () => {
    const parseResult = parseRegex("^[A-Z]{2,4}\\d+$", "");
    const a = JSON.stringify(generateExplanation(parseResult, "simple"));
    const b = JSON.stringify(generateExplanation(parseResult, "simple"));
    expect(a).toBe(b);
  });
});
