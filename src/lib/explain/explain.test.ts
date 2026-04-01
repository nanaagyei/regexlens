import { describe, it, expect } from "vitest";
import { parseRegex } from "@/lib/regex/parse";
import { generateExplanation } from "./explain";

describe("generateExplanation", () => {
  it("returns no steps when parse failed", () => {
    const parseResult = parseRegex("[", "");
    const { steps } = generateExplanation(parseResult);
    expect(steps).toEqual([]);
  });

  it("produces steps for a parsed pattern", () => {
    const parseResult = parseRegex("\\d+", "i");
    expect(parseResult.ok).toBe(true);
    const { steps } = generateExplanation(parseResult);
    expect(steps.length).toBeGreaterThan(0);
  });
});
