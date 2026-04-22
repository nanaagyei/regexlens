// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRegexDiff } from "../useRegexDiff";
import { parseRegex } from "@/lib/regex/parse";
import { generateExplanation } from "@/lib/explain/explain";

function makeParseAndExplain(pattern: string, flags: string) {
  const parseResult = parseRegex(pattern, flags);
  const explanation = generateExplanation(parseResult);
  return { parseResult, explanation };
}

const emptyWarnings = { warnings: [], riskScore: 0 };

describe("useRegexDiff", () => {
  const current = makeParseAndExplain("[a-z]+", "g");

  it("returns null when both old pattern and old flags are empty", () => {
    const { result } = renderHook(() =>
      useRegexDiff("", "", "[a-z]+", "g", current.parseResult, current.explanation, emptyWarnings),
    );
    expect(result.current).toBeNull();
  });

  it("returns a diff when old pattern is non-empty", () => {
    const { result } = renderHook(() =>
      useRegexDiff("[a-z]+", "g", "[A-Z]*", "gi", current.parseResult, current.explanation, emptyWarnings),
    );
    expect(result.current).not.toBeNull();
    expect(result.current!.syntax.hasChanges).toBe(true);
    expect(result.current!.flags.hasChanges).toBe(true);
  });

  it("returns a diff with no changes for identical inputs", () => {
    const { result } = renderHook(() =>
      useRegexDiff("[a-z]+", "g", "[a-z]+", "g", current.parseResult, current.explanation, emptyWarnings),
    );
    expect(result.current).not.toBeNull();
    expect(result.current!.syntax.hasChanges).toBe(false);
    expect(result.current!.flags.hasChanges).toBe(false);
  });

  it("detects flag-only changes", () => {
    const curDp = makeParseAndExplain("\\d+", "gi");
    const { result } = renderHook(() =>
      useRegexDiff("\\d+", "g", "\\d+", "gi", curDp.parseResult, curDp.explanation, emptyWarnings),
    );
    expect(result.current).not.toBeNull();
    expect(result.current!.syntax.hasChanges).toBe(false);
    expect(result.current!.flags.hasChanges).toBe(true);
    expect(result.current!.flags.changes).toHaveLength(1);
    expect(result.current!.flags.changes[0].flag).toBe("i");
  });

  it("returns diff when old flags are non-empty but old pattern is empty", () => {
    const { result } = renderHook(() =>
      useRegexDiff("", "g", "[a-z]+", "gi", current.parseResult, current.explanation, emptyWarnings),
    );
    expect(result.current).not.toBeNull();
    expect(result.current!.syntax.hasChanges).toBe(true);
  });

  it("is memoized across renders with same inputs", () => {
    const { result, rerender } = renderHook(
      ({ old, oldF, cur, curF }) =>
        useRegexDiff(old, oldF, cur, curF, current.parseResult, current.explanation, emptyWarnings),
      { initialProps: { old: "a", oldF: "g", cur: "b", curF: "g" } },
    );
    const first = result.current;
    rerender({ old: "a", oldF: "g", cur: "b", curF: "g" });
    expect(result.current).toBe(first);
  });

  it("includes structural diff when both patterns parse", () => {
    const curDp = makeParseAndExplain("^abc", "");
    const { result } = renderHook(() =>
      useRegexDiff("abc", "", "^abc", "", curDp.parseResult, curDp.explanation, emptyWarnings),
    );
    expect(result.current).not.toBeNull();
    expect(result.current!.structural).not.toBeNull();
    expect(result.current!.structural!.hasChanges).toBe(true);
  });

  it("includes explanation diff when both patterns parse", () => {
    const curDp = makeParseAndExplain("^abc", "");
    const { result } = renderHook(() =>
      useRegexDiff("abc", "", "^abc", "", curDp.parseResult, curDp.explanation, emptyWarnings),
    );
    expect(result.current).not.toBeNull();
    expect(result.current!.explanation).not.toBeNull();
    expect(result.current!.explanation!.hasChanges).toBe(true);
  });

  it("returns null structural/explanation when comparison pattern is invalid", () => {
    const curDp = makeParseAndExplain("[a-z]+", "g");
    const { result } = renderHook(() =>
      useRegexDiff("[unclosed", "g", "[a-z]+", "g", curDp.parseResult, curDp.explanation, emptyWarnings),
    );
    expect(result.current).not.toBeNull();
    expect(result.current!.structural).toBeNull();
    expect(result.current!.explanation).toBeNull();
    // Syntax diff still works on raw strings
    expect(result.current!.syntax.hasChanges).toBe(true);
  });
});
