// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHoverSync, useHoverSelector } from "../useHoverSync";
import { _reset } from "@/lib/stores/hoverStore";

beforeEach(() => {
  _reset();
});

describe("useHoverSync", () => {
  it("returns default hover state", () => {
    const { result } = renderHook(() => useHoverSync());
    expect(result.current.hoverState).toEqual({
      hoveredRange: null,
      hoveredStepId: null,
      hoveredMatchIndex: null,
      selectedMatchIndex: null,
      lockedStepId: null,
      lockedWarningId: null,
      lockedFailureId: null,
    });
  });

  it("setHoveredRange updates state", () => {
    const { result } = renderHook(() => useHoverSync());
    act(() => result.current.setHoveredRange({ start: 0, end: 5 }));
    expect(result.current.hoverState.hoveredRange).toEqual({ start: 0, end: 5 });
  });

  it("setHoveredStepId updates state", () => {
    const { result } = renderHook(() => useHoverSync());
    act(() => result.current.setHoveredStepId("step-1"));
    expect(result.current.hoverState.hoveredStepId).toBe("step-1");
  });

  it("setHoveredMatchIndex updates state", () => {
    const { result } = renderHook(() => useHoverSync());
    act(() => result.current.setHoveredMatchIndex(2));
    expect(result.current.hoverState.hoveredMatchIndex).toBe(2);
  });

  it("setSelectedMatchIndex updates state", () => {
    const { result } = renderHook(() => useHoverSync());
    act(() => result.current.setSelectedMatchIndex(1));
    expect(result.current.hoverState.selectedMatchIndex).toBe(1);

    act(() => result.current.setSelectedMatchIndex(null));
    expect(result.current.hoverState.selectedMatchIndex).toBeNull();
  });

  it("toggleLockedStep toggles step lock", () => {
    const { result } = renderHook(() => useHoverSync());
    act(() => result.current.toggleLockedStep("step-1"));
    expect(result.current.hoverState.lockedStepId).toBe("step-1");

    act(() => result.current.toggleLockedStep("step-1"));
    expect(result.current.hoverState.lockedStepId).toBeNull();
  });

  it("clearAll resets all hover state", () => {
    const { result } = renderHook(() => useHoverSync());

    act(() => {
      result.current.setHoveredRange({ start: 0, end: 5 });
      result.current.setHoveredStepId("step-1");
      result.current.setHoveredMatchIndex(2);
      result.current.setSelectedMatchIndex(3);
      result.current.toggleLockedStep("step-3");
    });

    act(() => result.current.clearAll());

    expect(result.current.hoverState).toEqual({
      hoveredRange: null,
      hoveredStepId: null,
      hoveredMatchIndex: null,
      selectedMatchIndex: null,
      lockedStepId: null,
      lockedWarningId: null,
      lockedFailureId: null,
    });
  });
});

describe("useHoverSelector", () => {
  it("returns selected slice of state", () => {
    const { result } = renderHook(() => useHoverSync());
    const { result: selectorResult } = renderHook(() =>
      useHoverSelector((s) => s.hoveredMatchIndex)
    );

    expect(selectorResult.current).toBeNull();

    act(() => result.current.setHoveredMatchIndex(5));
    expect(selectorResult.current).toBe(5);
  });

  it("returns selected range", () => {
    const { result: selectorResult } = renderHook(() =>
      useHoverSelector((s) => s.hoveredRange)
    );

    expect(selectorResult.current).toBeNull();
  });
});
