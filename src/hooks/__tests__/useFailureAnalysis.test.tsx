// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFailureAnalysis } from "../useFailureAnalysis";
import { parseRegex } from "@/lib/regex/parse";
import type { MatchResult } from "@/types";

const EMPTY_MATCH: MatchResult = {
  matches: [],
  spans: [],
  truncated: false,
  totalCount: 0,
};

const HAS_MATCH: MatchResult = {
  matches: [{ index: 0, full: { groupIndex: 0, start: 0, end: 3, text: "abc" }, groups: [] }],
  spans: [{ start: 0, end: 3, matchIndex: 0 }],
  truncated: false,
  totalCount: 1,
};

describe("useFailureAnalysis", () => {
  it("returns null for empty pattern", () => {
    const parseResult = parseRegex("", "g");
    const { result } = renderHook(() =>
      useFailureAnalysis("", "g", "test", parseResult, EMPTY_MATCH),
    );
    expect(result.current).toBeNull();
  });

  it("returns null for empty text", () => {
    const parseResult = parseRegex("abc", "g");
    const { result } = renderHook(() =>
      useFailureAnalysis("abc", "g", "", parseResult, EMPTY_MATCH),
    );
    expect(result.current).toBeNull();
  });

  it("returns null when match succeeds", () => {
    const parseResult = parseRegex("abc", "g");
    const { result } = renderHook(() =>
      useFailureAnalysis("abc", "g", "abc", parseResult, HAS_MATCH),
    );
    expect(result.current).toBeNull();
  });

  it("returns FailureDiagnosis when match fails", () => {
    const parseResult = parseRegex("abc", "g");
    const { result } = renderHook(() =>
      useFailureAnalysis("abc", "g", "xyz", parseResult, EMPTY_MATCH),
    );
    expect(result.current).not.toBeNull();
    expect(result.current!.didMatch).toBe(false);
    expect(result.current!.expected).toBeDefined();
    expect(result.current!.actual).toBeDefined();
    expect(result.current!.reason).toBeDefined();
  });

  it("memoizes result for same inputs", () => {
    const parseResult = parseRegex("abc", "g");
    const { result, rerender } = renderHook(() =>
      useFailureAnalysis("abc", "g", "xyz", parseResult, EMPTY_MATCH),
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
