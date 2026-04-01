import { computeMatches } from "@/lib/regex/match";
import type { MatchResult } from "@/types";

export interface MatchWorkerRequest {
  pattern: string;
  flags: string;
  text: string;
  /** For sticky (y) flag tests: run single exec at this lastIndex */
  initialLastIndex?: number;
}

export interface MatchWorkerResponse {
  ok: true;
  result: MatchResult;
}

export interface MatchWorkerErrorResponse {
  ok: false;
  error: string;
}

function runSingleExecWithLastIndex(
  pattern: string,
  flags: string,
  text: string,
  initialLastIndex: number
): MatchResult {
  const regex = new RegExp(pattern, flags);
  regex.lastIndex = initialLastIndex;
  const match = regex.exec(text);
  if (!match) {
    return {
      matches: [],
      spans: [],
      truncated: false,
      totalCount: 0,
    };
  }
  const start = match.index;
  const end = start + match[0].length;
  return {
    matches: [
      {
        index: 0,
        full: {
          groupIndex: 0,
          start,
          end,
          text: match[0],
        },
        groups: [],
      },
    ],
    spans: [{ start, end, matchIndex: 0 }],
    truncated: false,
    totalCount: 1,
  };
}

self.onmessage = (e: MessageEvent<MatchWorkerRequest>) => {
  try {
    const { pattern, flags, text, initialLastIndex } = e.data;
    if (
      typeof initialLastIndex === "number" &&
      (flags.includes("y") || flags.includes("g"))
    ) {
      const result = runSingleExecWithLastIndex(
        pattern,
        flags,
        text,
        initialLastIndex
      );
      self.postMessage({
        ok: true,
        result,
      } satisfies MatchWorkerResponse);
    } else {
      const result = computeMatches(pattern, flags, text);
      self.postMessage({
        ok: true,
        result,
      } satisfies MatchWorkerResponse);
    }
  } catch (err) {
    self.postMessage({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    } satisfies MatchWorkerErrorResponse);
  }
};
