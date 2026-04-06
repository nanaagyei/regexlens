import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  subscribe,
  getSnapshot,
  setHoveredRange,
  setHoveredStepId,
  setHoveredMatchIndex,
  setSelectedMatchIndex,
  toggleLockedStep,
  clearAll,
  _reset,
} from "./hoverStore";

beforeEach(() => {
  _reset();
});

describe("hoverStore", () => {
  describe("initial state", () => {
    it("starts with all null values", () => {
      const state = getSnapshot();
      expect(state.hoveredRange).toBeNull();
      expect(state.hoveredStepId).toBeNull();
      expect(state.hoveredMatchIndex).toBeNull();
      expect(state.selectedMatchIndex).toBeNull();
      expect(state.lockedStepId).toBeNull();
    });
  });

  describe("setHoveredRange", () => {
    it("updates hoveredRange", () => {
      setHoveredRange({ start: 0, end: 5 });
      expect(getSnapshot().hoveredRange).toEqual({ start: 0, end: 5 });
    });

    it("can be cleared to null", () => {
      setHoveredRange({ start: 0, end: 5 });
      setHoveredRange(null);
      expect(getSnapshot().hoveredRange).toBeNull();
    });

    it("no-ops when setting same range", () => {
      setHoveredRange({ start: 0, end: 5 });
      const snapshot1 = getSnapshot();
      setHoveredRange({ start: 0, end: 5 });
      const snapshot2 = getSnapshot();
      expect(snapshot1).toBe(snapshot2); // same object reference
    });

    it("notifies listeners on change", () => {
      const listener = vi.fn();
      subscribe(listener);
      setHoveredRange({ start: 0, end: 5 });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("does not notify on no-op", () => {
      const listener = vi.fn();
      setHoveredRange(null);
      subscribe(listener);
      setHoveredRange(null);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("setHoveredStepId", () => {
    it("updates hoveredStepId", () => {
      setHoveredStepId("step-1");
      expect(getSnapshot().hoveredStepId).toBe("step-1");
    });

    it("no-ops when setting same value", () => {
      setHoveredStepId("step-1");
      const snapshot1 = getSnapshot();
      setHoveredStepId("step-1");
      expect(getSnapshot()).toBe(snapshot1);
    });
  });

  describe("setHoveredMatchIndex", () => {
    it("updates hoveredMatchIndex", () => {
      setHoveredMatchIndex(3);
      expect(getSnapshot().hoveredMatchIndex).toBe(3);
    });

    it("no-ops when setting same value", () => {
      setHoveredMatchIndex(3);
      const snapshot1 = getSnapshot();
      setHoveredMatchIndex(3);
      expect(getSnapshot()).toBe(snapshot1);
    });
  });

  describe("setSelectedMatchIndex", () => {
    it("updates selectedMatchIndex", () => {
      setSelectedMatchIndex(1);
      expect(getSnapshot().selectedMatchIndex).toBe(1);
    });

    it("can be cleared to null", () => {
      setSelectedMatchIndex(1);
      setSelectedMatchIndex(null);
      expect(getSnapshot().selectedMatchIndex).toBeNull();
    });

    it("no-ops when setting same value", () => {
      setSelectedMatchIndex(1);
      const snapshot1 = getSnapshot();
      setSelectedMatchIndex(1);
      expect(getSnapshot()).toBe(snapshot1);
    });

    it("notifies listeners on change", () => {
      const listener = vi.fn();
      subscribe(listener);
      setSelectedMatchIndex(2);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("does not notify on no-op", () => {
      const listener = vi.fn();
      subscribe(listener);
      setSelectedMatchIndex(null);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("toggleLockedStep", () => {
    it("sets lockedStepId when null", () => {
      toggleLockedStep("step-1");
      expect(getSnapshot().lockedStepId).toBe("step-1");
    });

    it("clears lockedStepId when toggling same step", () => {
      toggleLockedStep("step-1");
      toggleLockedStep("step-1");
      expect(getSnapshot().lockedStepId).toBeNull();
    });

    it("switches to new step when toggling different step", () => {
      toggleLockedStep("step-1");
      toggleLockedStep("step-2");
      expect(getSnapshot().lockedStepId).toBe("step-2");
    });
  });

  describe("clearAll", () => {
    it("resets all fields to null", () => {
      setHoveredRange({ start: 0, end: 5 });
      setHoveredStepId("step-1");
      setHoveredMatchIndex(2);
      setSelectedMatchIndex(3);
      toggleLockedStep("step-3");

      clearAll();

      const state = getSnapshot();
      expect(state.hoveredRange).toBeNull();
      expect(state.hoveredStepId).toBeNull();
      expect(state.hoveredMatchIndex).toBeNull();
      expect(state.selectedMatchIndex).toBeNull();
      expect(state.lockedStepId).toBeNull();
    });

    it("no-ops when already default", () => {
      const listener = vi.fn();
      subscribe(listener);
      clearAll();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("subscribe", () => {
    it("returns unsubscribe function", () => {
      const listener = vi.fn();
      const unsubscribe = subscribe(listener);

      setHoveredStepId("step-1");
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      setHoveredStepId("step-2");
      expect(listener).toHaveBeenCalledTimes(1); // no additional call
    });
  });
});
