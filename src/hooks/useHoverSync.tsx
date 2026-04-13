"use client";

import { useMemo, useRef, useSyncExternalStore } from "react";
import {
  HoverState,
  subscribe,
  getSnapshot,
  setHoveredRange,
  setHoveredStepId,
  setHoveredMatchIndex,
  setSelectedMatchIndex,
  toggleLockedStep,
  toggleLockedWarning,
  clearAll,
} from "@/lib/stores/hoverStore";
import { Range } from "@/types";

export type { HoverState };

export interface HoverSyncContextValue {
  hoverState: HoverState;
  setHoveredRange: (range: Range | null) => void;
  setHoveredStepId: (stepId: string | null) => void;
  setHoveredMatchIndex: (index: number | null) => void;
  setSelectedMatchIndex: (index: number | null) => void;
  toggleLockedStep: (stepId: string) => void;
  toggleLockedWarning: (warningId: string) => void;
  clearAll: () => void;
}

/**
 * Primary hook for accessing hover sync state.
 * No provider needed — backed by useSyncExternalStore.
 */
export function useHoverSync(): HoverSyncContextValue {
  const hoverState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const value = useMemo(
    () => ({
      hoverState,
      setHoveredRange,
      setHoveredStepId,
      setHoveredMatchIndex,
      setSelectedMatchIndex,
      toggleLockedStep,
      toggleLockedWarning,
      clearAll,
    }),
    [hoverState]
  );

  return value;
}

/**
 * Fine-grained selector hook — only rerenders when the selected slice changes.
 * Use this in performance-sensitive components that only need one piece of hover state.
 *
 * Example: const matchIndex = useHoverSelector(s => s.hoveredMatchIndex);
 */
export function useHoverSelector<T>(selector: (state: HoverState) => T): T {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const snapshotRef = useRef<T | undefined>(undefined);

  const getSelected = () => {
    const nextState = getSnapshot();
    const nextSelected = selectorRef.current(nextState);

    if (snapshotRef.current !== undefined && Object.is(snapshotRef.current, nextSelected)) {
      return snapshotRef.current as T;
    }

    snapshotRef.current = nextSelected;
    return nextSelected;
  };

  return useSyncExternalStore(subscribe, getSelected, getSelected);
}

/**
 * Backwards-compat passthrough — no longer needed but kept so existing
 * JSX trees don't break. Can be removed once all usages are cleaned up.
 */
export function HoverSyncProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
