import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  createSnippetSchema,
  validateInput,
  formatZodError,
  uuidSchema,
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
