const STORAGE_KEY = "regexlens_anthropic_key";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface StoredKey {
  key: string;
  expiresAt: number;
}

export function isValidKeyFormat(key: string): boolean {
  return key.startsWith("sk-ant-") && key.length > 20;
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
  const entry: StoredKey = {
    key,
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
