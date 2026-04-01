import { describe, it, expect } from "vitest";
import { loadRegexFixture } from "./loadFixture";

describe("loadRegexFixture", () => {
  it("loads bundled fixture JSON from disk", async () => {
    const root = await loadRegexFixture();
    expect(root.fixture_version).toBeDefined();
    expect(Array.isArray(root.suites)).toBe(true);
    expect(root.suites.length).toBeGreaterThan(0);
  });
});
