// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useRegexMatches, FIXTURE_TIMEOUT_MS } from "../useRegexMatches";
import { REGEX_CONFIG, MatchResult } from "@/types";

const mockMatchResult: MatchResult = {
  matches: [
    {
      index: 0,
      full: { groupIndex: 0, start: 0, end: 3, text: "123" },
      groups: [],
    },
  ],
  spans: [{ start: 0, end: 3, matchIndex: 0 }],
  truncated: false,
  sampleTruncated: false,
  matchLimitReached: false,
  totalCount: 1,
};

const emptyResult: MatchResult = {
  matches: [],
  spans: [],
  truncated: false,
  sampleTruncated: false,
  matchLimitReached: false,
  totalCount: 0,
};

const mockMatchWithTimeout = vi.fn<
  (
    pattern: string,
    flags: string,
    text: string,
    timeoutMs?: number
  ) => Promise<MatchResult>
>();

vi.mock("@/lib/regex/matchWithTimeout", () => ({
  matchWithTimeout: (...args: unknown[]) =>
    mockMatchWithTimeout(...(args as [string, string, string, number?])),
}));

beforeEach(() => {
  mockMatchWithTimeout.mockReset();
  mockMatchWithTimeout.mockResolvedValue(mockMatchResult);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useRegexMatches", () => {
  it("returns empty result when parseOk is false", async () => {
    const { result } = renderHook(() =>
      useRegexMatches("\\d+", "g", "123", false, 0)
    );

    // Even with 0 debounce, should not call because parseOk is false
    await waitFor(() => {
      expect(result.current).toEqual(emptyResult);
    });
    expect(mockMatchWithTimeout).not.toHaveBeenCalled();
  });

  it("returns empty result when pattern is empty", async () => {
    const { result } = renderHook(() =>
      useRegexMatches("", "g", "123", true, 0)
    );

    await waitFor(() => {
      expect(result.current).toEqual(emptyResult);
    });
    expect(mockMatchWithTimeout).not.toHaveBeenCalled();
  });

  it("calls matchWithTimeout with correct args", async () => {
    renderHook(() =>
      useRegexMatches("\\d+", "g", "abc123", true, 0)
    );

    await waitFor(() => {
      expect(mockMatchWithTimeout).toHaveBeenCalledWith(
        "\\d+",
        "g",
        "abc123",
        REGEX_CONFIG.MATCH_TIMEOUT_MS
      );
    });
  });

  it("returns match result once resolved", async () => {
    const { result } = renderHook(() =>
      useRegexMatches("\\d+", "g", "123", true, 0)
    );

    await waitFor(() => {
      expect(result.current.totalCount).toBe(1);
      expect(result.current.matches[0].full.text).toBe("123");
    });
  });

  it("passes fixtureTimeoutMs when provided", async () => {
    renderHook(() =>
      useRegexMatches("\\d+", "g", "123", true, 0, FIXTURE_TIMEOUT_MS)
    );

    await waitFor(() => {
      expect(mockMatchWithTimeout).toHaveBeenCalledWith(
        "\\d+",
        "g",
        "123",
        FIXTURE_TIMEOUT_MS
      );
    });
  });

  it("resets to empty when parseOk changes to false", async () => {
    const { result, rerender } = renderHook(
      ({ parseOk }: { parseOk: boolean }) =>
        useRegexMatches("\\d+", "g", "123", parseOk, 0),
      { initialProps: { parseOk: true } }
    );

    await waitFor(() => {
      expect(result.current.totalCount).toBe(1);
    });

    rerender({ parseOk: false });

    await waitFor(() => {
      expect(result.current).toEqual(emptyResult);
    });
  });

  it("cancels stale results when inputs change", async () => {
    let resolveFirst!: (value: MatchResult) => void;
    let resolveSecond!: (value: MatchResult) => void;

    const firstResult: MatchResult = {
      ...emptyResult,
      totalCount: 1,
      matches: [
        {
          index: 0,
          full: { groupIndex: 0, start: 0, end: 1, text: "a" },
          groups: [],
        },
      ],
    };
    const secondResult: MatchResult = {
      ...emptyResult,
      totalCount: 2,
      matches: [
        {
          index: 0,
          full: { groupIndex: 0, start: 0, end: 1, text: "b" },
          groups: [],
        },
        {
          index: 1,
          full: { groupIndex: 0, start: 1, end: 2, text: "b" },
          groups: [],
        },
      ],
    };

    mockMatchWithTimeout
      .mockImplementationOnce(
        () => new Promise<MatchResult>((r) => { resolveFirst = r; })
      )
      .mockImplementationOnce(
        () => new Promise<MatchResult>((r) => { resolveSecond = r; })
      );

    const { result, rerender } = renderHook(
      ({ pattern }: { pattern: string }) =>
        useRegexMatches(pattern, "g", "test", true, 0),
      { initialProps: { pattern: "a" } }
    );

    // Wait for first call
    await waitFor(() => {
      expect(mockMatchWithTimeout).toHaveBeenCalledTimes(1);
    });

    // Change pattern — triggers cleanup (cancelled=true) and new effect
    rerender({ pattern: "b" });

    await waitFor(() => {
      expect(mockMatchWithTimeout).toHaveBeenCalledTimes(2);
    });

    // Resolve first (stale) — should be ignored due to cancelled flag
    await act(async () => { resolveFirst(firstResult); });

    // Resolve second (current)
    await act(async () => { resolveSecond(secondResult); });

    await waitFor(() => {
      // Should have the second result, not the first
      expect(result.current.totalCount).toBe(2);
    });
  });
});
