"use client";

import { useCallback, useMemo, useState } from "react";
import { RegexState, RegexTemplate } from "@/types";

const DEFAULT_STATE: RegexState = {
  pattern: "",
  flags: "g",
  text: "",
  flavor: "javascript",
};

/** Minimal shape for fixture suite/test application */
export interface FixtureApplySuite {
  regex?: { source: string; flags: string };
  tests: Array<{ input: string; regex?: { source: string; flags: string } }>;
}

export interface FixtureApplyTest {
  input: string;
  regex?: { source: string; flags: string };
}

export interface RegexStateActions {
  setPattern: (pattern: string) => void;
  setFlags: (flags: string) => void;
  toggleFlag: (flag: string) => void;
  setText: (text: string) => void;
  applyTemplate: (template: RegexTemplate) => void;
  applyFixtureSuite: (suite: FixtureApplySuite) => void;
  applyFixtureTest: (test: FixtureApplyTest, fallbackRegex?: { source: string; flags: string }) => void;
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

  const applyFixtureSuite = useCallback((suite: FixtureApplySuite) => {
    const regex = suite.regex ?? suite.tests[0]?.regex;
    const pattern = regex?.source ?? "";
    const flags = regex?.flags ?? "";
    const text = suite.tests[0]?.input ?? "";
    setState((prev) => ({ ...prev, pattern, flags, text }));
  }, []);

  const applyFixtureTest = useCallback(
    (test: FixtureApplyTest, fallbackRegex?: { source: string; flags: string }) => {
      const regex = test.regex ?? fallbackRegex;
      setState((prev) => ({
        ...prev,
        text: test.input,
        ...(regex && { pattern: regex.source, flags: regex.flags }),
      }));
    },
    []
  );

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
      applyFixtureSuite,
      applyFixtureTest,
      reset,
    }),
    [
      setPattern,
      setFlags,
      toggleFlag,
      setText,
      applyTemplate,
      applyFixtureSuite,
      applyFixtureTest,
      reset,
    ]
  );

  return { state, actions };
}
