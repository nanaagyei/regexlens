"use client";

import { useMemo } from "react";
import { useDebounce } from "./useDebounce";
import { parseRegex } from "@/lib/regex/parse";
import { ParseResult, REGEX_CONFIG } from "@/types";

/**
 * Parse a regex pattern with debouncing
 * Returns the parse result (AST or error)
 */
export function useRegexParse(
  pattern: string,
  flags: string,
  debounceMs: number = REGEX_CONFIG.DEBOUNCE_MS
): ParseResult {
  // Debounce the pattern to avoid parsing on every keystroke
  const debouncedPattern = useDebounce(pattern, debounceMs);
  const debouncedFlags = useDebounce(flags, debounceMs);

  // Parse the debounced pattern
  const parseResult = useMemo(() => {
    return parseRegex(debouncedPattern, debouncedFlags);
  }, [debouncedPattern, debouncedFlags]);

  return parseResult;
}
