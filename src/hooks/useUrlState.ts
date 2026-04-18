"use client";

import { useEffect, useRef } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { RegexState } from "@/types";
import { buildShareUrl, decodeState, encodeState } from "@/lib/regex/serialize";

/** Actions needed by useUrlState to apply decoded URL state */
export interface UrlStateActions {
  setPattern: (pattern: string) => void;
  setFlags: (flags: string) => void;
  setText: (text: string) => void;
  setComparisonPattern: (pattern: string) => void;
  setComparisonFlags: (flags: string) => void;
  setExplanationMode: (mode: "simple" | "technical") => void;
  setSelectedTemplate: (templateId: string | null) => void;
}

const THROTTLE = { throttleMs: 500 };

/**
 * Sync regex state with URL query parameters.
 * Uses nuqs for type-safe URL state management.
 */
export function useUrlState(state: RegexState, actions: UrlStateActions) {
  // Core params
  const [urlPattern, setUrlPattern] = useQueryState(
    "p",
    parseAsString.withDefault("").withOptions(THROTTLE)
  );
  const [urlFlags, setUrlFlags] = useQueryState(
    "f",
    parseAsString.withDefault("g").withOptions(THROTTLE)
  );
  const [urlText, setUrlText] = useQueryState(
    "t",
    parseAsString.withDefault("").withOptions(THROTTLE)
  );

  // Extended params
  const [urlCompPattern, setUrlCompPattern] = useQueryState(
    "cp",
    parseAsString.withDefault("").withOptions(THROTTLE)
  );
  const [urlCompFlags, setUrlCompFlags] = useQueryState(
    "cf",
    parseAsString.withDefault("").withOptions(THROTTLE)
  );
  const [urlMode, setUrlMode] = useQueryState(
    "m",
    parseAsString.withDefault("").withOptions(THROTTLE)
  );
  const [urlTemplate, setUrlTemplate] = useQueryState(
    "tpl",
    parseAsString.withDefault("").withOptions(THROTTLE)
  );

  const isInitialized = useRef(false);
  const isUpdatingFromUrl = useRef(false);

  // Initialize state from URL on mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Collect raw URL params and decode via centralized logic
    const rawParams: Record<string, string | undefined> = {
      p: urlPattern || undefined,
      f: urlFlags !== "g" ? urlFlags : undefined,
      t: urlText || undefined,
      cp: urlCompPattern || undefined,
      cf: urlCompFlags || undefined,
      m: urlMode || undefined,
      tpl: urlTemplate || undefined,
    };

    const decoded = decodeState(rawParams);

    if (Object.keys(decoded).length === 0) return;

    isUpdatingFromUrl.current = true;

    if (decoded.pattern !== undefined) actions.setPattern(decoded.pattern);
    if (decoded.flags !== undefined) actions.setFlags(decoded.flags);
    if (decoded.text !== undefined) actions.setText(decoded.text);
    if (decoded.comparisonPattern !== undefined) actions.setComparisonPattern(decoded.comparisonPattern);
    if (decoded.comparisonFlags !== undefined) actions.setComparisonFlags(decoded.comparisonFlags);
    if (decoded.explanationMode !== undefined) actions.setExplanationMode(decoded.explanationMode);
    if (decoded.selectedTemplate !== undefined) actions.setSelectedTemplate(decoded.selectedTemplate);

    // Reset flag after a tick
    setTimeout(() => {
      isUpdatingFromUrl.current = false;
    }, 0);
  }, [urlPattern, urlFlags, urlText, urlCompPattern, urlCompFlags, urlMode, urlTemplate, actions]);

  // Update URL when state changes (but not when URL changed state)
  useEffect(() => {
    if (isUpdatingFromUrl.current) return;

    const encoded = encodeState(state);

    setUrlPattern(encoded.p ?? null);
    setUrlFlags(encoded.f ?? null);
    setUrlText(encoded.t ?? null);
    setUrlCompPattern(encoded.cp ?? null);
    setUrlCompFlags(encoded.cf ?? null);
    setUrlMode(encoded.m ?? null);
    setUrlTemplate(encoded.tpl ?? null);
  }, [
    state,
    setUrlPattern,
    setUrlFlags,
    setUrlText,
    setUrlCompPattern,
    setUrlCompFlags,
    setUrlMode,
    setUrlTemplate,
  ]);
}

/**
 * Get the current share URL. Delegates to serialize.ts.
 */
export function getShareUrl(state: RegexState): string {
  return buildShareUrl(state);
}
