import { z } from "zod";

/**
 * Common validation constants
 */
export const LIMITS = {
  PATTERN_MAX_LENGTH: 4000,
  FLAGS_MAX_LENGTH: 16,
  NAME_MAX_LENGTH: 120,
  DESCRIPTION_MAX_LENGTH: 2000,
  TAG_MAX_LENGTH: 32,
  TAGS_MAX_COUNT: 25,
  NOTES_MAX_LENGTH: 500,
  TEXT_SAMPLE_MAX_SIZE: 50000,
} as const;

/**
 * Valid regex flags for JavaScript
 */
const VALID_FLAGS = ["g", "i", "m", "s", "u", "y", "d"] as const;

/**
 * Validate regex flags string
 */
const flagsSchema = z
  .string()
  .max(LIMITS.FLAGS_MAX_LENGTH)
  .refine(
    (flags) => {
      const chars = flags.split("");
      // Check all characters are valid flags
      if (!chars.every((c) => VALID_FLAGS.includes(c as (typeof VALID_FLAGS)[number]))) {
        return false;
      }
      // Check no duplicate flags
      return new Set(chars).size === chars.length;
    },
    { message: "Invalid regex flags" }
  )
  .default("");

/**
 * Validate regex pattern - basic safety checks
 */
const patternSchema = z
  .string()
  .min(1, "Pattern is required")
  .max(LIMITS.PATTERN_MAX_LENGTH, `Pattern must be ${LIMITS.PATTERN_MAX_LENGTH} characters or less`);

/**
 * Tag schema
 */
const tagSchema = z
  .string()
  .min(1)
  .max(LIMITS.TAG_MAX_LENGTH)
  .regex(/^[a-zA-Z0-9_-]+$/, "Tags can only contain letters, numbers, underscores, and hyphens");

/**
 * Tags array schema
 */
const tagsSchema = z.array(tagSchema).max(LIMITS.TAGS_MAX_COUNT).default([]);

// ============================================
// Snippet Schemas
// ============================================

/**
 * Create snippet request schema
 */
export const createSnippetSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(LIMITS.NAME_MAX_LENGTH, `Name must be ${LIMITS.NAME_MAX_LENGTH} characters or less`)
    .trim(),
  pattern: patternSchema,
  flags: flagsSchema,
  description: z
    .string()
    .max(LIMITS.DESCRIPTION_MAX_LENGTH, `Description must be ${LIMITS.DESCRIPTION_MAX_LENGTH} characters or less`)
    .nullable()
    .optional(),
  tags: tagsSchema,
});

export type CreateSnippetInput = z.infer<typeof createSnippetSchema>;

/**
 * Update snippet request schema
 */
export const updateSnippetSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(LIMITS.NAME_MAX_LENGTH)
    .trim()
    .optional(),
  pattern: patternSchema.optional(),
  flags: flagsSchema.optional(),
  description: z
    .string()
    .max(LIMITS.DESCRIPTION_MAX_LENGTH)
    .nullable()
    .optional(),
  tags: tagsSchema.optional(),
});

export type UpdateSnippetInput = z.infer<typeof updateSnippetSchema>;

/**
 * List snippets query schema
 */
export const listSnippetsQuerySchema = z.object({
  query: z.string().max(100).optional(),
  tag: z.string().max(LIMITS.TAG_MAX_LENGTH).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
});

export type ListSnippetsQuery = z.infer<typeof listSnippetsQuerySchema>;

// ============================================
// Version Schemas
// ============================================

/**
 * Create version request schema
 */
export const createVersionSchema = z.object({
  pattern: patternSchema,
  flags: flagsSchema,
  notes: z
    .string()
    .max(LIMITS.NOTES_MAX_LENGTH, `Notes must be ${LIMITS.NOTES_MAX_LENGTH} characters or less`)
    .nullable()
    .optional(),
});

export type CreateVersionInput = z.infer<typeof createVersionSchema>;

/**
 * Diff query schema
 */
export const diffQuerySchema = z.object({
  from: z.string().uuid("Invalid 'from' version ID"),
  to: z.string().uuid("Invalid 'to' version ID"),
});

export type DiffQuery = z.infer<typeof diffQuerySchema>;

// ============================================
// Export Schemas
// ============================================

/**
 * Export format enum
 */
export const exportFormatSchema = z.enum(["markdown", "plain", "pr_comment", "notion"]);

export type ExportFormat = z.infer<typeof exportFormatSchema>;

/**
 * Explanation step schema (for export)
 */
const explanationStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  detail: z.string().nullable().optional(),
  kind: z.enum([
    "anchor",
    "group",
    "quantifier",
    "charclass",
    "escape",
    "alternation",
    "literal",
    "sequence",
  ]),
  depth: z.number().int().min(0),
  range: z
    .object({
      start: z.number().int().min(0),
      end: z.number().int().min(0),
    })
    .nullable()
    .optional(),
});

/**
 * Warning schema (for export)
 */
const warningSchema = z.object({
  id: z.string(),
  severity: z.enum(["info", "warn", "danger"]),
  title: z.string(),
  message: z.string(),
  hint: z.string().nullable().optional(),
  range: z
    .object({
      start: z.number().int().min(0),
      end: z.number().int().min(0),
    })
    .nullable()
    .optional(),
});

/**
 * Export request schema
 */
export const exportRequestSchema = z.object({
  format: exportFormatSchema,
  title: z.string().max(LIMITS.NAME_MAX_LENGTH).nullable().optional(),
  pattern: patternSchema,
  flags: flagsSchema,
  steps: z.array(explanationStepSchema),
  warnings: z.array(warningSchema).optional().default([]),
});

export type ExportRequestInput = z.infer<typeof exportRequestSchema>;

// ============================================
// Analyze Schemas
// ============================================

/**
 * Analyze request schema
 */
export const analyzeRequestSchema = z.object({
  pattern: patternSchema,
  flags: flagsSchema,
  textSampleSize: z.number().int().min(0).max(LIMITS.TEXT_SAMPLE_MAX_SIZE).nullable().optional(),
});

export type AnalyzeRequestInput = z.infer<typeof analyzeRequestSchema>;

// ============================================
// AI Chat Schemas
// ============================================

/**
 * AI chat request schema
 */
export const aiChatRequestSchema = z.object({
  action: z.enum([
    "polish",
    "edge_cases",
    "security_review",
    "optimize",
    "explain_simple",
    "generate_tests",
    "generate_pattern",
    "fix_suggestions",
    "freeform",
  ]),
  context: z.object({
    pattern: z.string().max(LIMITS.PATTERN_MAX_LENGTH),
    flags: z.string().max(LIMITS.FLAGS_MAX_LENGTH),
    testText: z.string().max(LIMITS.TEXT_SAMPLE_MAX_SIZE).optional(),
    matches: z
      .object({
        count: z.number().int().min(0),
        truncated: z.boolean(),
      })
      .optional(),
    warnings: z
      .array(
        z.object({
          severity: z.string(),
          title: z.string(),
          message: z.string(),
        })
      )
      .optional(),
    explanationSteps: z
      .array(
        z.object({
          label: z.string(),
          kind: z.string(),
          detail: z.string().optional(),
        })
      )
      .optional(),
  }),
  message: z.string().max(2000).optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      })
    )
    .max(20)
    .optional(),
});

export type AIChatRequestInput = z.infer<typeof aiChatRequestSchema>;

// ============================================
// UUID Validation
// ============================================

/**
 * UUID schema for path parameters
 */
export const uuidSchema = z.string().uuid("Invalid ID format");

// ============================================
// Helper Functions
// ============================================

/**
 * Safely parse and validate input with Zod schema
 * Returns either the validated data or an error response
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Format Zod errors for API response
 */
export function formatZodError(error: z.ZodError<unknown>): {
  error: string;
  message: string;
  details: Array<{ path: string; message: string }>;
} {
  return {
    error: "validation_error",
    message: "Invalid request data",
    details: error.issues.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    })),
  };
}

/**
 * Parse URL search params into an object
 */
export function parseSearchParams(url: string): Record<string, string> {
  const searchParams = new URL(url).searchParams;
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}
