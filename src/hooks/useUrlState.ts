"use client";

import { useEffect, useRef } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { RegexState } from "@/types";

/**
 * Sync regex state with URL query parameters
 * Uses nuqs for type-safe URL state management
 */
export function useUrlState(
  state: RegexState,
  actions: Pick<ReturnType<typeof import("./useRegexState").useRegexState>["actions"], "setPattern" | "setFlags" | "setText">
) {
  const [urlPattern, setUrlPattern] = useQueryState(
    "p",
    parseAsString.withDefault("").withOptions({ throttleMs: 500 })
  );
  const [urlFlags, setUrlFlags] = useQueryState(
    "f",
    parseAsString.withDefault("g").withOptions({ throttleMs: 500 })
  );
  const [urlText, setUrlText] = useQueryState(
    "t",
    parseAsString.withDefault("").withOptions({ throttleMs: 500 })
  );

  const isInitialized = useRef(false);
  const isUpdatingFromUrl = useRef(false);

  // Initialize state from URL on mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Decode and apply URL state
    if (urlPattern) {
      try {
        const decoded = decodeURIComponent(atob(urlPattern));
        isUpdatingFromUrl.current = true;
        actions.setPattern(decoded);
      } catch {
        // Invalid encoding, try as-is
        isUpdatingFromUrl.current = true;
        actions.setPattern(urlPattern);
      }
    }

    if (urlFlags && urlFlags !== "g") {
      isUpdatingFromUrl.current = true;
      actions.setFlags(urlFlags);
    }

    if (urlText) {
      try {
        const decoded = decodeURIComponent(atob(urlText));
        isUpdatingFromUrl.current = true;
        actions.setText(decoded);
      } catch {
        isUpdatingFromUrl.current = true;
        actions.setText(urlText);
      }
    }

    // Reset flag after a tick
    setTimeout(() => {
      isUpdatingFromUrl.current = false;
    }, 0);
  }, [urlPattern, urlFlags, urlText, actions]);

  // Update URL when state changes (but not when URL changed state)
  useEffect(() => {
    if (isUpdatingFromUrl.current) return;

    // Encode state for URL
    const encodedPattern = state.pattern
      ? btoa(encodeURIComponent(state.pattern))
      : null;
    const encodedText = state.text
      ? btoa(encodeURIComponent(state.text))
      : null;

    setUrlPattern(encodedPattern);
    setUrlFlags(state.flags || null);
    setUrlText(encodedText);
  }, [state.pattern, state.flags, state.text, setUrlPattern, setUrlFlags, setUrlText]);
}

/**
 * Get the current share URL
 */
export function getShareUrl(state: RegexState): string {
  const url = new URL(window.location.origin + window.location.pathname);

  if (state.pattern) {
    url.searchParams.set("p", btoa(encodeURIComponent(state.pattern)));
  }
  if (state.flags) {
    url.searchParams.set("f", state.flags);
  }
  if (state.text) {
    url.searchParams.set("t", btoa(encodeURIComponent(state.text)));
  }

  return url.toString();
}
