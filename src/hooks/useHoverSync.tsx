"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";
import { Range } from "@/types";

export interface HoverState {
  hoveredRange: Range | null;
  hoveredStepId: string | null;
  hoveredMatchIndex: number | null;
  lockedStepId: string | null;
}

export interface HoverSyncContextValue {
  hoverState: HoverState;
  setHoveredRange: (range: Range | null) => void;
  setHoveredStepId: (stepId: string | null) => void;
  setHoveredMatchIndex: (index: number | null) => void;
  toggleLockedStep: (stepId: string) => void;
  clearAll: () => void;
}

const DEFAULT_STATE: HoverState = {
  hoveredRange: null,
  hoveredStepId: null,
  hoveredMatchIndex: null,
  lockedStepId: null,
};

const HoverSyncContext = createContext<HoverSyncContextValue | null>(null);

export function HoverSyncProvider({ children }: { children: ReactNode }) {
  const [hoverState, setHoverState] = useState<HoverState>(DEFAULT_STATE);

  const setHoveredRange = useCallback((range: Range | null) => {
    setHoverState((prev) => ({ ...prev, hoveredRange: range }));
  }, []);

  const setHoveredStepId = useCallback((stepId: string | null) => {
    setHoverState((prev) => ({ ...prev, hoveredStepId: stepId }));
  }, []);

  const setHoveredMatchIndex = useCallback((index: number | null) => {
    setHoverState((prev) => ({ ...prev, hoveredMatchIndex: index }));
  }, []);

  const toggleLockedStep = useCallback((stepId: string) => {
    setHoverState((prev) => ({
      ...prev,
      lockedStepId: prev.lockedStepId === stepId ? null : stepId,
    }));
  }, []);

  const clearAll = useCallback(() => {
    setHoverState(DEFAULT_STATE);
  }, []);

  const value = useMemo(
    () => ({
      hoverState,
      setHoveredRange,
      setHoveredStepId,
      setHoveredMatchIndex,
      toggleLockedStep,
      clearAll,
    }),
    [
      hoverState,
      setHoveredRange,
      setHoveredStepId,
      setHoveredMatchIndex,
      toggleLockedStep,
      clearAll,
    ]
  );

  return (
    <HoverSyncContext.Provider value={value}>
      {children}
    </HoverSyncContext.Provider>
  );
}

export function useHoverSync(): HoverSyncContextValue {
  const context = useContext(HoverSyncContext);
  if (!context) {
    throw new Error("useHoverSync must be used within a HoverSyncProvider");
  }
  return context;
}
