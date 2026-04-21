import { ExplanationMode, RegexState } from "@/types";

const VALID_FLAGS = "gimsuy";
const VALID_MODES: ExplanationMode[] = ["simple", "technical"];

/**
 * URL-safe base64 encode a UTF-8 string.
 * Uses +/= → -/_ replacement and strips padding for shorter URLs.
 */
const ENCODING_MARKER = "1:";

function toUrlSafeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return ENCODING_MARKER + btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decode a URL-safe base64 string back to UTF-8.
 * Also handles legacy encodeURIComponent+btoa format for backward compat.
 */
function fromUrlSafeBase64(encoded: string): string {
  try {
    let raw = encoded;
    let isMarked = false;

    if (raw.startsWith(ENCODING_MARKER)) {
      raw = raw.slice(ENCODING_MARKER.length);
      isMarked = true;
    }

    // Restore standard base64 chars and padding
    const standard = raw.replace(/-/g, "+").replace(/_/g, "/");
    const padded = standard + "=".repeat((4 - (standard.length % 4)) % 4);
    const binary = atob(padded);

    // Only try legacy decodeURIComponent for unmarked (pre-marker) payloads
    if (!isMarked && /%[0-9A-Fa-f]{2}/.test(binary)) {
      try {
        return decodeURIComponent(binary);
      } catch {
        // Not valid URI-encoded, fall through to UTF-8 decode
      }
    }

    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    // Last resort: return raw string
    return encoded;
  }
}

/**
 * Validate and sanitize regex flags.
 */
function sanitizeFlags(flags: string): string {
  return VALID_FLAGS.split("")
    .filter((f) => flags.includes(f))
    .join("");
}

/**
 * URL parameter keys for workspace state.
 *
 * p  — pattern (URL-safe base64)
 * f  — flags (raw)
 * t  — test text (URL-safe base64)
 * cp — comparison pattern (URL-safe base64)
 * cf — comparison flags (raw)
 * m  — explanation mode (raw: "simple" | "technical")
 * tpl — selected template ID (raw)
 */

/**
 * Encode regex state for URL sharing.
 * Only includes non-empty, non-default values to keep URLs short.
 */
export function encodeState(state: RegexState): Record<string, string> {
  const params: Record<string, string> = {};

  if (state.pattern) {
    params.p = toUrlSafeBase64(state.pattern);
  }

  if (state.flags) {
    params.f = state.flags;
  }

  if (state.text) {
    params.t = toUrlSafeBase64(state.text);
  }

  if (state.comparisonPattern) {
    params.cp = toUrlSafeBase64(state.comparisonPattern);
  }

  if (state.comparisonFlags) {
    params.cf = state.comparisonFlags;
  }

  if (state.explanationMode && state.explanationMode !== "simple") {
    params.m = state.explanationMode;
  }

  if (state.selectedTemplate) {
    params.tpl = state.selectedTemplate;
  }

  return params;
}

/**
 * Decode regex state from URL params.
 * Gracefully handles missing, malformed, or invalid values.
 * Backward-compatible with legacy encodeURIComponent+btoa URLs.
 */
export function decodeState(
  params: Record<string, string | undefined>
): Partial<RegexState> {
  const state: Partial<RegexState> = {};

  if (params.p) {
    state.pattern = fromUrlSafeBase64(params.p);
  }

  if (params.f) {
    state.flags = sanitizeFlags(params.f);
  }

  if (params.t) {
    state.text = fromUrlSafeBase64(params.t);
  }

  if (params.cp) {
    state.comparisonPattern = fromUrlSafeBase64(params.cp);
  }

  if (params.cf) {
    state.comparisonFlags = sanitizeFlags(params.cf);
  }

  if (params.m && VALID_MODES.includes(params.m as ExplanationMode)) {
    state.explanationMode = params.m as ExplanationMode;
  }

  if (params.tpl) {
    state.selectedTemplate = params.tpl;
  }

  return state;
}

/**
 * Build a shareable URL with the current state.
 */
export function buildShareUrl(state: RegexState): string {
  const params = encodeState(state);
  const url = new URL(window.location.origin + window.location.pathname);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
}
