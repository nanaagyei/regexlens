import { createClient } from "redis";

/**
 * Shared lazy Redis client singleton.
 *
 * Used by both the rate limiter and account-lockout subsystems to ensure a
 * single TCP connection per process, share back-off state, and avoid the race
 * where two callers each kick off their own `connect()` simultaneously.
 *
 * `getRedisClient()` resolves to a connected client or `null` when
 * `REDIS_URL` is not configured. Callers decide fail-open vs fail-closed.
 */

type RedisClient = ReturnType<typeof createClient>;

const globalForRedis = globalThis as unknown as {
  __redisClient?: RedisClient | null;
  __redisConnectPromise?: Promise<void> | null;
};

function instantiateClient(url: string): RedisClient {
  const client = createClient({ url });
  client.on("error", (err) => {
    console.error("Redis client error:", err);
    globalForRedis.__redisConnectPromise = null;
  });
  return client;
}

/**
 * Returns a connected Redis client or `null` when REDIS_URL is unset.
 * Subsequent calls reuse the same connection. Concurrent connect attempts
 * are deduplicated via a shared in-flight promise (no race).
 */
export async function getRedisClient(): Promise<RedisClient | null> {
  const url = process.env.REDIS_URL;
  if (!url) {
    return null;
  }

  if (!globalForRedis.__redisClient) {
    globalForRedis.__redisClient = instantiateClient(url);
  }

  const client = globalForRedis.__redisClient;

  if (!client.isOpen) {
    if (!globalForRedis.__redisConnectPromise) {
      globalForRedis.__redisConnectPromise = client.connect().then(
        () => {
          globalForRedis.__redisConnectPromise = null;
        },
        (err) => {
          globalForRedis.__redisConnectPromise = null;
          throw err;
        }
      );
    }
    await globalForRedis.__redisConnectPromise;
  }

  return client;
}

/**
 * Test-only: clears the cached client so each test starts fresh.
 */
export function __resetRedisClientForTests(): void {
  globalForRedis.__redisClient = null;
  globalForRedis.__redisConnectPromise = null;
}
