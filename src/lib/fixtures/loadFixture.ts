import { readFile } from "fs/promises";
import { join } from "path";
import type { FixtureRoot } from "./types";

const FIXTURE_PATH = join(
  process.cwd(),
  "data",
  "fixtures",
  "regexlens-fixture-v1.json"
);

/**
 * Load the regex fixture from disk (Node only).
 * Throws on read or parse error.
 */
export async function loadRegexFixture(): Promise<FixtureRoot> {
  const content = await readFile(FIXTURE_PATH, "utf-8");
  return JSON.parse(content) as FixtureRoot;
}
