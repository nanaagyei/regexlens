import { MatchResult, REGEX_CONFIG } from "@/types";
import { computeMatches, computeSingleExecWithLastIndex } from "./match";

const TIMEOUT_ERROR_MESSAGE =
  "Matching timed out — possible catastrophic backtracking. Simplify nested quantifiers (e.g. (a+)+) or reduce test text length.";

function createWorker(): Worker {
  return new Worker(
    new URL("../../workers/regexMatch.worker.ts", import.meta.url),
    { type: "module" }
  );
}

/**
 * Compute matches with timeout protection against catastrophic backtracking.
 * Runs matching in a Web Worker and terminates if it exceeds the timeout.
 * Falls back to sync computeMatches if Workers are not supported.
 * @param initialLastIndex - For sticky (y) flag: run single exec at this lastIndex
 */
export async function matchWithTimeout(
  pattern: string,
  flags: string,
  text: string,
  timeoutMs: number = REGEX_CONFIG.MATCH_TIMEOUT_MS,
  initialLastIndex?: number
): Promise<MatchResult> {
  if (typeof Worker === "undefined") {
    if (typeof initialLastIndex === "number") {
      return computeSingleExecWithLastIndex(pattern, flags, text, initialLastIndex);
    }
    return computeMatches(pattern, flags, text);
  }

  return new Promise<MatchResult>((resolve) => {
    const worker = createWorker();
    let settled = false;

    const cleanup = () => {
      worker.terminate();
    };

    const resolveOnce = (result: MatchResult) => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(result);
      }
    };

    const timeoutId = setTimeout(() => {
      resolveOnce({
        matches: [],
        spans: [],
        truncated: false,
        totalCount: 0,
        error: TIMEOUT_ERROR_MESSAGE,
      });
    }, timeoutMs);

    worker.onmessage = (e: MessageEvent) => {
      clearTimeout(timeoutId);
      const msg = e.data as
        | { ok: true; result: MatchResult }
        | { ok: false; error: string };
      if (msg.ok) {
        resolveOnce(msg.result);
      } else {
        resolveOnce({
          matches: [],
          spans: [],
          truncated: false,
          totalCount: 0,
          error: msg.error,
        });
      }
    };

    worker.onerror = (err) => {
      clearTimeout(timeoutId);
      resolveOnce({
        matches: [],
        spans: [],
        truncated: false,
        totalCount: 0,
        error: err.message || "Worker error",
      });
    };

    const payload =
      typeof initialLastIndex === "number"
        ? { pattern, flags, text, initialLastIndex }
        : { pattern, flags, text };
    worker.postMessage(payload);
  });
}
