import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  createSnippetSchema,
  validateInput,
  formatZodError,
  uuidSchema,
  parseJsonBodyWithinLimit,
  REQUEST_BODY_LIMITS,
  exportRequestSchema,
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

describe("exportRequestSchema", () => {
  const minimalSteps = [
    { label: "Start of string", depth: 0 },
    { label: "One or more word characters", depth: 0, detail: "Local part" },
  ];

  const minimalWarnings = [
    {
      severity: "info" as const,
      title: "Unescaped dot",
      message: "The dot matches any character",
      hint: "Use \\. for literal dot",
    },
  ];

  const basePayload = {
    format: "markdown" as const,
    title: "Regex Review",
    pattern: "\\d+",
    flags: "",
    steps: minimalSteps,
    warnings: minimalWarnings,
  };

  it("accepts the minimal payload documented in api.mdx", () => {
    const parsed = exportRequestSchema.safeParse(basePayload);
    expect(parsed.success).toBe(true);
  });

  it("accepts the stripped payload ExportModal used before the fix", () => {
    const parsed = exportRequestSchema.safeParse({
      format: "markdown",
      title: "Regex Review",
      pattern: "\\d+",
      flags: "",
      steps: [{ label: "digits", detail: "one or more", depth: 0 }],
      warnings: [{ severity: "warn", title: "t", message: "m", hint: "h" }],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts full workspace ExplanationStep and Warning objects", () => {
    const parsed = exportRequestSchema.safeParse({
      ...basePayload,
      steps: [
        {
          id: "step-1",
          label: "Digit",
          detail: "one or more",
          kind: "quantifier",
          depth: 0,
          range: { start: 0, end: 2 },
        },
      ],
      warnings: [
        {
          id: "warn-1",
          severity: "warn",
          category: "syntax",
          title: "Unescaped dot",
          message: "Matches any character",
          score: 10,
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it.each(["markdown", "plain", "pr_comment", "notion"] as const)(
    "accepts format %s",
    (format) => {
      const parsed = exportRequestSchema.safeParse({ ...basePayload, format });
      expect(parsed.success).toBe(true);
    }
  );

  it("rejects invalid format", () => {
    const parsed = exportRequestSchema.safeParse({
      ...basePayload,
      format: "pdf",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects empty pattern", () => {
    const parsed = exportRequestSchema.safeParse({
      ...basePayload,
      pattern: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid warning severity", () => {
    const parsed = exportRequestSchema.safeParse({
      ...basePayload,
      warnings: [{ severity: "critical", title: "t", message: "m" }],
    });
    expect(parsed.success).toBe(false);
  });
});
