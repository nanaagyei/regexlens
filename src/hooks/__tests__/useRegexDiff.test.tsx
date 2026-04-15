// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRegexDiff } from "../useRegexDiff";

describe("useRegexDiff", () => {
  it("returns null when both old pattern and old flags are empty", () => {
    const { result } = renderHook(() => useRegexDiff("", "", "[a-z]+", "g"));
    expect(result.current).toBeNull();
  });

  it("returns a diff when old pattern is non-empty", () => {
    const { result } = renderHook(() =>
      useRegexDiff("[a-z]+", "g", "[A-Z]*", "gi"),
    );
    expect(result.current).not.toBeNull();
    expect(result.current!.syntax.hasChanges).toBe(true);
    expect(result.current!.flags.hasChanges).toBe(true);
  });

  it("returns a diff with no changes for identical inputs", () => {
    const { result } = renderHook(() =>
      useRegexDiff("[a-z]+", "g", "[a-z]+", "g"),
    );
    expect(result.current).not.toBeNull();
    expect(result.current!.syntax.hasChanges).toBe(false);
    expect(result.current!.flags.hasChanges).toBe(false);
  });

  it("detects flag-only changes", () => {
    const { result } = renderHook(() =>
      useRegexDiff("\\d+", "g", "\\d+", "gi"),
    );
    expect(result.current).not.toBeNull();
    expect(result.current!.syntax.hasChanges).toBe(false);
    expect(result.current!.flags.hasChanges).toBe(true);
    expect(result.current!.flags.changes).toHaveLength(1);
    expect(result.current!.flags.changes[0].flag).toBe("i");
  });

  it("returns diff when old flags are non-empty but old pattern is empty", () => {
    const { result } = renderHook(() =>
      useRegexDiff("", "g", "[a-z]+", "gi"),
    );
    expect(result.current).not.toBeNull();
    expect(result.current!.syntax.hasChanges).toBe(true);
  });

  it("is memoized across renders with same inputs", () => {
    const { result, rerender } = renderHook(
      ({ old, oldF, cur, curF }) => useRegexDiff(old, oldF, cur, curF),
      { initialProps: { old: "a", oldF: "g", cur: "b", curF: "g" } },
    );
    const first = result.current;
    rerender({ old: "a", oldF: "g", cur: "b", curF: "g" });
    expect(result.current).toBe(first);
  });
});
