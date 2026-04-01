import { matchWithTimeout } from "@/lib/regex/matchWithTimeout";
import type { MatchResult } from "@/types";

const FIXTURE_TIMEOUT_MS = 75;

export type FixtureTestStatus = "match" | "no_match" | "timeout" | "error";

export interface FixtureTestMatch {
  start: number;
  end: number;
  text: string;
}

export interface FixtureTestResult {
  status: FixtureTestStatus;
  matches: FixtureTestMatch[];
  elapsedMs: number;
  error?: { name: string; message: string };
  /** For sticky tests: per-lastIndex results */
  sequenceResults?: FixtureTestStatus[];
}

function mapMatchResultToStatus(result: MatchResult): FixtureTestStatus {
  if (result.error) {
    if (
      result.error.includes("timed out") ||
      result.error.includes("timeout") ||
      result.error.includes("Timing out")
    ) {
      return "timeout";
    }
    return "error";
  }
  return result.totalCount > 0 ? "match" : "no_match";
}

function mapMatchResultToMatches(result: MatchResult): FixtureTestMatch[] {
  return result.matches.map((m) => ({
    start: m.full.start,
    end: m.full.end,
    text: m.full.text,
  }));
}

export interface RunFixtureTestParams {
  pattern: string;
  flags: string;
  text: string;
  timeoutMs?: number;
  lastIndexSequence?: number[];
}

/**
 * Run a single fixture test through the worker with timeout.
 * For sticky tests with lastIndexSequence, runs N times and returns the first result's shape
 * (sequence results are handled by runFixtureTestWithSequence).
 */
export async function runFixtureTest(
  params: RunFixtureTestParams
): Promise<FixtureTestResult> {
  const {
    pattern,
    flags,
    text,
    timeoutMs = FIXTURE_TIMEOUT_MS,
    lastIndexSequence,
  } = params;

  if (lastIndexSequence && lastIndexSequence.length > 0) {
    return runFixtureTestWithSequence({
      pattern,
      flags,
      text,
      lastIndexSequence,
      timeoutMs,
    });
  }

  const start = performance.now();
  const result = await matchWithTimeout(
    pattern,
    flags,
    text,
    timeoutMs
  );
  const elapsedMs = Math.round(performance.now() - start);

  const status = mapMatchResultToStatus(result);
  const matches = mapMatchResultToMatches(result);

  const fixtureResult: FixtureTestResult = {
    status,
    matches,
    elapsedMs,
  };

  if (result.error && status === "error") {
    fixtureResult.error = {
      name: "Error",
      message: result.error,
    };
  }

  return fixtureResult;
}

/**
 * Run sticky-flag test with lastIndex sequence; returns combined result
 * with sequenceResults for UI display.
 */
async function runFixtureTestWithSequence(params: {
  pattern: string;
  flags: string;
  text: string;
  lastIndexSequence: number[];
  timeoutMs?: number;
}): Promise<FixtureTestResult> {
  const {
    pattern,
    flags,
    text,
    lastIndexSequence,
    timeoutMs = FIXTURE_TIMEOUT_MS,
  } = params;

  const start = performance.now();
  const statuses: FixtureTestStatus[] = [];

  for (const lastIndex of lastIndexSequence) {
    const result = await matchWithTimeout(
      pattern,
      flags,
      text,
      timeoutMs,
      lastIndex
    );
    statuses.push(mapMatchResultToStatus(result));
  }

  const elapsedMs = Math.round(performance.now() - start);

  return {
    status: statuses[0] ?? "no_match",
    matches: [],
    elapsedMs,
    sequenceResults: statuses,
  };
}
