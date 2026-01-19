import { RegexState } from "@/types";

/**
 * Encode regex state for URL sharing
 * Uses base64 encoding for pattern and text to handle special characters
 */
export function encodeState(state: RegexState): Record<string, string> {
  const params: Record<string, string> = {};

  if (state.pattern) {
    params.p = btoa(encodeURIComponent(state.pattern));
  }

  if (state.flags) {
    params.f = state.flags;
  }

  if (state.text) {
    params.t = btoa(encodeURIComponent(state.text));
  }

  return params;
}

/**
 * Decode regex state from URL params
 */
export function decodeState(
  params: Record<string, string | undefined>
): Partial<RegexState> {
  const state: Partial<RegexState> = {};

  if (params.p) {
    try {
      state.pattern = decodeURIComponent(atob(params.p));
    } catch {
      // Invalid base64, try as-is
      state.pattern = params.p;
    }
  }

  if (params.f) {
    // Validate flags - only allow valid JS regex flags
    const validFlags = params.f
      .split("")
      .filter((f) => "gimsuy".includes(f))
      .join("");
    state.flags = validFlags;
  }

  if (params.t) {
    try {
      state.text = decodeURIComponent(atob(params.t));
    } catch {
      // Invalid base64, try as-is
      state.text = params.t;
    }
  }

  return state;
}

/**
 * Build a shareable URL with the current state
 */
export function buildShareUrl(state: RegexState): string {
  const params = encodeState(state);
  const url = new URL(window.location.href);
  
  // Clear existing params
  url.search = "";
  
  // Add new params
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}
