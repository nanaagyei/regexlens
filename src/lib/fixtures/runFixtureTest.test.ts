import { describe, it, expect } from "vitest";
import { runFixtureTest } from "./runFixtureTest";

describe("runFixtureTest", () => {
  it("matches simple digit pattern", async () => {
    const result = await runFixtureTest({
      pattern: "\\d+",
      flags: "g",
      text: "12",
      timeoutMs: 2000,
    });
    expect(result.status).toBe("match");
    expect(result.matches.length).toBeGreaterThan(0);
  });

  it("reports no_match when pattern does not apply", async () => {
    const result = await runFixtureTest({
      pattern: "z+",
      flags: "g",
      text: "aaa",
      timeoutMs: 2000,
    });
    expect(result.status).toBe("no_match");
  });
});
