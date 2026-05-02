const STORAGE_KEY = "regexlens_anthropic_key";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface StoredKey {
  key: string;
  expiresAt: number;
}

export function isValidKeyFormat(key: string): boolean {
  const normalized = key.trim();
  return normalized.startsWith("sk-ant-") && normalized.length > 20;
}

export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredKey = JSON.parse(raw);
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.key;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function storeApiKey(key: string): void {
  if (typeof window === "undefined") return;
  const normalized = key.trim();
  if (!isValidKeyFormat(normalized)) return;
  const entry: StoredKey = {
    key: normalized,
    expiresAt: Date.now() + TTL_MS,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
}

export function clearApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function isApiKeyStored(): boolean {
  return getStoredApiKey() !== null;
}
