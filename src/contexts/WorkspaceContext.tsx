"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { useRegexState, RegexStateActions } from "@/hooks/useRegexState";
import { useRegexParse } from "@/hooks/useRegexParse";
import { useRegexMatches } from "@/hooks/useRegexMatches";
import { useExplanation } from "@/hooks/useExplanation";
import { useWarnings } from "@/hooks/useWarnings";
import { useUrlState } from "@/hooks/useUrlState";
import {
  RegexState,
  ParseResult,
  MatchResult,
  ExplanationResult,
  WarningsResult,
} from "@/types";

export interface WorkspaceContextValue {
  state: RegexState;
  actions: RegexStateActions;
  parseResult: ParseResult;
  matchResult: MatchResult;
  explanation: ExplanationResult;
  warnings: WarningsResult;
  isPatternValid: boolean;
  hasPattern: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { state, actions } = useRegexState();
  const parseResult = useRegexParse(state.pattern, state.flags);
  const matchResult = useRegexMatches(
    state.pattern,
    state.flags,
    state.text,
    parseResult.ok
  );
  const explanation = useExplanation(parseResult);
  const warnings = useWarnings(state.pattern, state.flags, parseResult, matchResult);

  // URL state sync
  useUrlState(state, actions);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      state,
      actions,
      parseResult,
      matchResult,
      explanation,
      warnings,
      isPatternValid: parseResult.ok,
      hasPattern: state.pattern.length > 0,
    }),
    [state, actions, parseResult, matchResult, explanation, warnings]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
