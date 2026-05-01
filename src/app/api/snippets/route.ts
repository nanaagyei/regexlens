import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isGuardOk } from "@/lib/auth/requireAuth";
import { combinedRateLimit } from "@/lib/security/rateLimit";
import { withSnippetRlsContext } from "@/lib/db/pool";
import { enforceCsrfProtection } from "@/lib/security/csrf";
import {
  createSnippetSchema,
  listSnippetsQuerySchema,
  validateInput,
  formatZodError,
  parseSearchParams,
  escapeLikePattern,
  getJsonBodyTooLargeError,
  REQUEST_BODY_LIMITS,
} from "@/lib/security/validation";

interface SnippetRow {
  id: string;
  name: string;
  pattern: string;
  flags: string;
  description: string | null;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

/**
 * POST /api/snippets - Create a new regex snippet
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResponse = await combinedRateLimit(request, "api_free");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const csrfError = enforceCsrfProtection(request);
    if (csrfError) {
      return csrfError;
    }

    // Require authentication
    const guard = await requireAuth();
    if (!isGuardOk(guard)) {
      return guard;
    }

    const bodyTooLargeError = getJsonBodyTooLargeError(
      request,
      REQUEST_BODY_LIMITS.SNIPPET_WRITE_BYTES
    );
    if (bodyTooLargeError) {
      return NextResponse.json(bodyTooLargeError, { status: 413 });
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "invalid_json", message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validation = validateInput(createSnippetSchema, body);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 });
    }

    const { name, pattern, flags, description, tags } = validation.data;

    // Validate the regex pattern is actually valid
    try {
      new RegExp(pattern, flags);
    } catch (regexError) {
      return NextResponse.json(
        {
          error: "invalid_regex",
          message: "The provided pattern is not a valid regular expression",
          details: regexError instanceof Error ? regexError.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    // Insert snippet into database
    const snippet = await withSnippetRlsContext(guard.user.id, async (client) => {
      const rows = await client.query<SnippetRow>(
        `INSERT INTO snippets (user_id, name, pattern, flags, description, tags)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)
         RETURNING
           id::text, name, pattern, flags, description,
           tags, created_at, updated_at`,
        [guard.user.id, name, pattern, flags, description || null, JSON.stringify(tags)]
      );
      return rows.rows[0];
    });

    return NextResponse.json(
      {
        id: snippet.id,
        name: snippet.name,
        pattern: snippet.pattern,
        flags: snippet.flags,
        description: snippet.description,
        tags: snippet.tags,
        created_at: snippet.created_at.toISOString(),
        updated_at: snippet.updated_at.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create snippet error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to create snippet" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/snippets - List user's snippets
 * 
 * Query parameters:
 * - query: Search by name (optional)
 * - tag: Filter by tag (optional)
 * - limit: Number of results (default 20, max 100)
 * - cursor: Pagination cursor (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResponse = await combinedRateLimit(request, "api_free");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Require authentication
    const guard = await requireAuth();
    if (!isGuardOk(guard)) {
      return guard;
    }

    // Parse and validate query parameters
    const params = parseSearchParams(request.url);
    const validation = validateInput(listSnippetsQuerySchema, params);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 });
    }

    const { query: searchQuery, tag, limit, cursor } = validation.data;

    // Build query dynamically
    const queryParams: (string | number)[] = [guard.user.id, limit + 1]; // +1 to check for next page
    let whereClause = "WHERE user_id = $1";
    let paramIndex = 3;

    // Add cursor filter for pagination
    if (cursor) {
      whereClause += ` AND (updated_at, id) < (
        SELECT updated_at, id FROM snippets WHERE id = $${paramIndex}::uuid
      )`;
      queryParams.push(cursor);
      paramIndex++;
    }

    // Add tag filter
    if (tag) {
      whereClause += ` AND tags @> $${paramIndex}::jsonb`;
      queryParams.push(JSON.stringify([tag]));
      paramIndex++;
    }

    // Add search filter
    if (searchQuery) {
      whereClause += ` AND (name ILIKE $${paramIndex} ESCAPE '\\' OR pattern ILIKE $${paramIndex} ESCAPE '\\')`;
      queryParams.push(`%${escapeLikePattern(searchQuery)}%`);
      paramIndex++;
    }

    const rows = await withSnippetRlsContext(guard.user.id, async (client) => {
      const result = await client.query<SnippetRow>(
        `SELECT id::text, name, pattern, flags, description, tags, created_at, updated_at
         FROM snippets
         ${whereClause}
         ORDER BY updated_at DESC, id DESC
         LIMIT $2`,
        queryParams
      );
      return result.rows;
    });

    // Check if there are more results
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, -1) : rows;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({
      items: items.map((row) => ({
        id: row.id,
        name: row.name,
        pattern: row.pattern,
        flags: row.flags,
        description: row.description,
        tags: row.tags,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      })),
      next_cursor: nextCursor,
    });
  } catch (error) {
    console.error("List snippets error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to list snippets" },
      { status: 500 }
    );
  }
}
