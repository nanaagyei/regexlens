import { describe, expect, it } from "vitest";
import { parseMultiExecIncrCount } from "./redisMultiExec";

describe("parseMultiExecIncrCount", () => {
  it("reads node-redis v5 transformed incr reply", () => {
    expect(parseMultiExecIncrCount([3, 1])).toBe(3);
  });

  it("reads legacy [err, reply] tuple shape", () => {
    expect(parseMultiExecIncrCount([[null, 7] as unknown])).toBe(7);
  });

  it("falls back when exec returns an empty or unexpected shape", () => {
    expect(parseMultiExecIncrCount(null)).toBe(1);
    expect(parseMultiExecIncrCount([])).toBe(1);
    expect(parseMultiExecIncrCount([["x"] as unknown])).toBe(1);
  });
});
