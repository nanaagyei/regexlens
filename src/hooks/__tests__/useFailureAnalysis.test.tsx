// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFailureAnalysis } from "../useFailureAnalysis";
import { parseRegex } from "@/lib/regex/parse";
import type { MatchResult } from "@/types";
import { REGEX_CONFIG } from "@/types";

const EMPTY_MATCH: MatchResult = {
  matches: [],
  spans: [],
  truncated: false,
  sampleTruncated: false,
  matchLimitReached: false,
  totalCount: 0,
};

const HAS_MATCH: MatchResult = {
  matches: [{ index: 0, full: { groupIndex: 0, start: 0, end: 3, text: "abc" }, groups: [] }],
  spans: [{ start: 0, end: 3, matchIndex: 0 }],
  truncated: false,
  sampleTruncated: false,
  matchLimitReached: false,
  totalCount: 1,
};

describe("useFailureAnalysis", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces heavy analysis before running", () => {
    const parseResult = parseRegex("abc", "g");
    const { result, rerender } = renderHook(
      ({ text }: { text: string }) =>
        useFailureAnalysis("abc", "g", text, parseResult, EMPTY_MATCH),
      { initialProps: { text: "" } },
    );
    expect(result.current).toBeNull();
    rerender({ text: "zzz" });
    act(() => {
      vi.advanceTimersByTime(REGEX_CONFIG.HEAVY_ANALYSIS_DEBOUNCE_MS - 1);
    });
    expect(result.current).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).not.toBeNull();
    expect(result.current!.didMatch).toBe(false);
  });

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

  it("debounces match result updates and clears diagnosis when a match appears", () => {
    const parseResult = parseRegex("a", "g");
    const syntheticMatch: MatchResult = {
      matches: [
        {
          index: 0,
          full: { groupIndex: 0, start: 0, end: 1, text: "a" },
          groups: [],
        },
      ],
      spans: [{ start: 0, end: 1, matchIndex: 0 }],
      truncated: false,
      sampleTruncated: false,
      matchLimitReached: false,
      totalCount: 1,
    };
    const { result, rerender } = renderHook(
      ({ match }: { match: MatchResult }) =>
        useFailureAnalysis("a", "g", "b", parseResult, match),
      { initialProps: { match: EMPTY_MATCH } },
    );

    act(() => {
      vi.advanceTimersByTime(REGEX_CONFIG.HEAVY_ANALYSIS_DEBOUNCE_MS);
    });
    expect(result.current).not.toBeNull();
    expect(result.current!.didMatch).toBe(false);

    rerender({ match: syntheticMatch });
    act(() => {
      vi.advanceTimersByTime(REGEX_CONFIG.HEAVY_ANALYSIS_DEBOUNCE_MS - 1);
    });
    expect(result.current).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
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
