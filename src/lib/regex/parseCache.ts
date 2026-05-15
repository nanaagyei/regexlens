import type { ParseResult } from "@/types";
import { parseRegex } from "./parse";

const MAX_ENTRIES = 96;
const cache = new Map<string, ParseResult>();

function cacheKey(pattern: string, flags: string): string {
  return `${flags}\u0000${pattern}`;
}

/**
 * Bounded LRU cache for parseRegex — used by diff and other paths that may
 * re-parse the same comparison pattern often.
 */
export function parseRegexCached(pattern: string, flags: string): ParseResult {
  const k = cacheKey(pattern, flags);
  const existing = cache.get(k);
  if (existing) {
    cache.delete(k);
    cache.set(k, existing);
    return existing;
  }
  const result = parseRegex(pattern, flags);
  cache.set(k, result);
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
  return result;
}

/** Clear cache — for tests only */
export function resetParseCache(): void {
  cache.clear();
}
