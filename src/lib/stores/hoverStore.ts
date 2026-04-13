import { Range } from "@/types";

export interface HoverState {
  hoveredRange: Range | null;
  hoveredStepId: string | null;
  hoveredMatchIndex: number | null;
  selectedMatchIndex: number | null;
  lockedStepId: string | null;
  lockedWarningId: string | null;
  lockedFailureId: string | null;
}

type Listener = () => void;

const DEFAULT_STATE: HoverState = {
  hoveredRange: null,
  hoveredStepId: null,
  hoveredMatchIndex: null,
  selectedMatchIndex: null,
  lockedStepId: null,
  lockedWarningId: null,
  lockedFailureId: null,
};

let state: HoverState = { ...DEFAULT_STATE };
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): HoverState {
  return state;
}

export function setHoveredRange(range: Range | null) {
  if (state.hoveredRange === range) return;
  if (
    range !== null &&
    state.hoveredRange !== null &&
    range.start === state.hoveredRange.start &&
    range.end === state.hoveredRange.end
  ) {
    return;
  }
  state = { ...state, hoveredRange: range };
  notify();
}

export function setHoveredStepId(stepId: string | null) {
  if (state.hoveredStepId === stepId) return;
  state = { ...state, hoveredStepId: stepId };
  notify();
}

export function setHoveredMatchIndex(index: number | null) {
  if (state.hoveredMatchIndex === index) return;
  state = { ...state, hoveredMatchIndex: index };
  notify();
}

export function setSelectedMatchIndex(index: number | null) {
  if (state.selectedMatchIndex === index) return;
  state = { ...state, selectedMatchIndex: index };
  notify();
}

export function toggleLockedStep(stepId: string) {
  state = {
    ...state,
    lockedStepId: state.lockedStepId === stepId ? null : stepId,
    lockedWarningId: null,
    lockedFailureId: null,
  };
  notify();
}

export function toggleLockedWarning(warningId: string) {
  state = {
    ...state,
    lockedWarningId: state.lockedWarningId === warningId ? null : warningId,
    lockedStepId: null,
    lockedFailureId: null,
  };
  notify();
}

export function toggleLockedFailure(failureId: string) {
  state = {
    ...state,
    lockedFailureId: state.lockedFailureId === failureId ? null : failureId,
    lockedStepId: null,
    lockedWarningId: null,
  };
  notify();
}

export function clearAll() {
  const isAlreadyDefault =
    state.hoveredRange === null &&
    state.hoveredStepId === null &&
    state.hoveredMatchIndex === null &&
    state.selectedMatchIndex === null &&
    state.lockedStepId === null &&
    state.lockedWarningId === null &&
    state.lockedFailureId === null;
  if (isAlreadyDefault) return;
  state = { ...DEFAULT_STATE };
  notify();
}

/** Reset store to default state (for testing) */
export function _reset() {
  state = { ...DEFAULT_STATE };
}
