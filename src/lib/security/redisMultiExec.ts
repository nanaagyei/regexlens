/**
 * Normalizes `MULTI().incr(...).expire(...).exec()` replies from `redis` v5.
 * Transformed command replies are plain numbers in results[0]; legacy stacks may
 * emit `[error, reply]` tuples — handle both without crashing on unexpected shapes.
 */
export function parseMultiExecIncrCount(results: unknown): number {
  if (!Array.isArray(results) || results.length === 0) {
    return 1;
  }

  const head = results[0];

  if (typeof head === "number" && Number.isFinite(head)) {
    return head;
  }

  // Legacy / defensive: [Error | null, Reply][]
  if (Array.isArray(head) && head.length >= 2) {
    const reply = head[1];
    if (typeof reply === "number" && Number.isFinite(reply)) {
      return reply;
    }
  }

  return 1;
}
