import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./redisClient", () => ({
  getRedisClient: vi.fn(),
}));

import { getRedisClient } from "./redisClient";
import {
  __magicLinkLockoutPolicy,
  recordMagicLinkAttempt,
} from "./accountLockout";

const mockGetRedisClient = vi.mocked(getRedisClient);

interface FakeMulti {
  incr: (key: string) => FakeMulti;
  expire: (...args: unknown[]) => FakeMulti;
  exec: () => Promise<unknown[]>;
}

function createFakeRedis(initialCount: number = 0) {
  const counters = new Map<string, number>();
  let returnValue = initialCount;
  return {
    setReturnValue(value: number) {
      returnValue = value;
    },
    getCounters() {
      return counters;
    },
    multi(): FakeMulti {
      const ops: unknown[] = [];
      const chain: FakeMulti = {
        incr(key: string) {
          ops.push(["incr", key]);
          return chain;
        },
        expire(...args: unknown[]) {
          ops.push(["expire", ...args]);
          return chain;
        },
        async exec() {
          const incrOp = ops.find((op): op is [string, string] => Array.isArray(op) && op[0] === "incr");
          if (!incrOp) return [returnValue];
          const key = incrOp[1];
          const next = (counters.get(key) ?? 0) + 1;
          counters.set(key, next);
          returnValue = next;
          return [next];
        },
      };
      return chain;
    },
  };
}

describe("recordMagicLinkAttempt", () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    if (ORIGINAL_NODE_ENV === undefined) {
      vi.unstubAllEnvs();
    } else {
      vi.stubEnv("NODE_ENV", ORIGINAL_NODE_ENV);
    }
  });

  it("allows attempts under the threshold and decrements remaining", async () => {
    const fakeRedis = createFakeRedis();
    mockGetRedisClient.mockResolvedValue(
      fakeRedis as unknown as Awaited<ReturnType<typeof getRedisClient>>
    );

    const r1 = await recordMagicLinkAttempt("user@example.com");
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(__magicLinkLockoutPolicy.maxAttempts - 1);

    const r2 = await recordMagicLinkAttempt("user@example.com");
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(__magicLinkLockoutPolicy.maxAttempts - 2);
  });

  it("blocks the attempt that crosses the threshold", async () => {
    const fakeRedis = createFakeRedis();
    mockGetRedisClient.mockResolvedValue(
      fakeRedis as unknown as Awaited<ReturnType<typeof getRedisClient>>
    );

    const max = __magicLinkLockoutPolicy.maxAttempts;
    let lastAllowed = true;
    for (let i = 0; i < max; i++) {
      const r = await recordMagicLinkAttempt("burst@example.com");
      lastAllowed = r.allowed;
    }
    expect(lastAllowed).toBe(true);

    const blocked = await recordMagicLinkAttempt("burst@example.com");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("uses a hashed key (no plaintext email) — checked indirectly via key shape", async () => {
    const fakeRedis = createFakeRedis();
    mockGetRedisClient.mockResolvedValue(
      fakeRedis as unknown as Awaited<ReturnType<typeof getRedisClient>>
    );

    await recordMagicLinkAttempt("private@example.com");

    const keys = Array.from(fakeRedis.getCounters().keys());
    expect(keys.length).toBe(1);
    expect(keys[0]).toMatch(/^auth:lockout:magic_link:[0-9a-f]{16}:\d+$/);
    expect(keys[0]).not.toContain("private@example.com");
  });

  it("keys are stable for the same email + window", async () => {
    const fakeRedis = createFakeRedis();
    mockGetRedisClient.mockResolvedValue(
      fakeRedis as unknown as Awaited<ReturnType<typeof getRedisClient>>
    );

    await recordMagicLinkAttempt("stable@example.com");
    await recordMagicLinkAttempt("stable@example.com");

    expect(fakeRedis.getCounters().size).toBe(1);
  });

  it("fails closed in production when redis is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mockGetRedisClient.mockResolvedValue(null);

    const result = await recordMagicLinkAttempt("noredis@example.com");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("allows in non-production when redis is unavailable", async () => {
    mockGetRedisClient.mockResolvedValue(null);
    const result = await recordMagicLinkAttempt("noredis-dev@example.com");
    expect(result.allowed).toBe(true);
  });
});
