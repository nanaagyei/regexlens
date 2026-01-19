"use client";

import { useCallback, useMemo, useState } from "react";
import { RegexState, RegexTemplate } from "@/types";

const DEFAULT_STATE: RegexState = {
  pattern: "",
  flags: "g",
  text: "",
  flavor: "javascript",
};

export interface RegexStateActions {
  setPattern: (pattern: string) => void;
  setFlags: (flags: string) => void;
  toggleFlag: (flag: string) => void;
  setText: (text: string) => void;
  applyTemplate: (template: RegexTemplate) => void;
  reset: () => void;
}

export interface UseRegexStateReturn {
  state: RegexState;
  actions: RegexStateActions;
}

export function useRegexState(
  initialState: Partial<RegexState> = {}
): UseRegexStateReturn {
  const [state, setState] = useState<RegexState>({
    ...DEFAULT_STATE,
    ...initialState,
  });

  const setPattern = useCallback((pattern: string) => {
    setState((prev) => ({ ...prev, pattern }));
  }, []);

  const setFlags = useCallback((flags: string) => {
    setState((prev) => ({ ...prev, flags }));
  }, []);

  const toggleFlag = useCallback((flag: string) => {
    setState((prev) => {
      const hasFlag = prev.flags.includes(flag);
      const newFlags = hasFlag
        ? prev.flags.replace(flag, "")
        : prev.flags + flag;
      return { ...prev, flags: newFlags };
    });
  }, []);

  const setText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, text }));
  }, []);

  const applyTemplate = useCallback((template: RegexTemplate) => {
    setState((prev) => ({
      ...prev,
      pattern: template.pattern,
      flags: template.flags,
      text: template.text,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const actions = useMemo(
    () => ({
      setPattern,
      setFlags,
      toggleFlag,
      setText,
      applyTemplate,
      reset,
    }),
    [setPattern, setFlags, toggleFlag, setText, applyTemplate, reset]
  );

  return { state, actions };
}
