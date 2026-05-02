import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  createSnippetSchema,
  validateInput,
  formatZodError,
  uuidSchema,
  parseJsonBodyWithinLimit,
  REQUEST_BODY_LIMITS,
} from "./validation";

describe("createSnippetSchema", () => {
  it("accepts valid snippet input", () => {
    const parsed = createSnippetSchema.safeParse({
      name: "Email",
      pattern: "^.+@.+$",
      flags: "i",
      tags: ["email"],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects duplicate flags", () => {
    const parsed = createSnippetSchema.safeParse({
      name: "x",
      pattern: "a",
      flags: "gg",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects empty name", () => {
    const parsed = createSnippetSchema.safeParse({
      name: "",
      pattern: "a",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("validateInput", () => {
  it("returns success for valid uuid", () => {
    const r = validateInput(
      uuidSchema,
      "550e8400-e29b-41d4-a716-446655440000"
    );
    expect(r.success).toBe(true);
  });

  it("returns failure for invalid uuid", () => {
    const r = validateInput(uuidSchema, "not-a-uuid");
    expect(r.success).toBe(false);
  });
});

describe("formatZodError", () => {
  it("formats issues for API responses", () => {
    const err = z.object({ a: z.string() }).safeParse({}).error!;
    const out = formatZodError(err);
    expect(out.error).toBe("validation_error");
    expect(out.details.length).toBeGreaterThan(0);
  });
});

function requestWithJsonBody(
  body: string,
  init?: { contentLength?: string }
): Request {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(enc.encode(body));
      controller.close();
    },
  });

  const headers = new Headers({ "content-type": "application/json" });
  if (init?.contentLength !== undefined) {
    headers.set("content-length", init.contentLength);
  }

  return new Request("https://example.test/api", {
    method: "POST",
    headers,
    body: stream,
    duplex: "half",
  } as RequestInit);
}

describe("parseJsonBodyWithinLimit", () => {
  it("parses small JSON bodies", async () => {
    const req = requestWithJsonBody('{"a":1}');
    const out = await parseJsonBodyWithinLimit(req, 1024);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.data).toEqual({ a: 1 });
    }
  });

  it("rejects when streamed body exceeds the cap without Content-Length", async () => {
    const big = `{"x":"${"a".repeat(REQUEST_BODY_LIMITS.ANALYZE_BYTES)}"}`;
    const req = requestWithJsonBody(big);
    const out = await parseJsonBodyWithinLimit(req, REQUEST_BODY_LIMITS.ANALYZE_BYTES);
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.status).toBe(413);
    }
  });

  it("fast-rejects using Content-Length when present", async () => {
    const req = requestWithJsonBody("{}", { contentLength: "999999" });
    const out = await parseJsonBodyWithinLimit(req, 64);
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.status).toBe(413);
    }
  });
});
