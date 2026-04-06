import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isGuardOk } from "@/lib/auth/requireAuth";
import { combinedRateLimit } from "@/lib/security/rateLimit";
import { query, queryOne } from "@/lib/db/pool";
import {
  updateSnippetSchema,
  uuidSchema,
  validateInput,
  formatZodError,
} from "@/lib/security/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface SnippetRow {
  id: string;
  user_id: string;
  name: string;
  pattern: string;
  flags: string;
  description: string | null;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

/**
 * GET /api/snippets/:id - Get a specific snippet (requires auth)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    // Validate ID format
    const idValidation = validateInput(uuidSchema, id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "invalid_id", message: "Invalid snippet ID format" },
        { status: 400 }
      );
    }

    // Fetch snippet
    const snippet = await queryOne<SnippetRow>(
      `SELECT id::text, user_id::text, name, pattern, flags, description, tags, created_at, updated_at
       FROM snippets
       WHERE id = $1`,
      [id]
    );

    if (!snippet) {
      return NextResponse.json(
        { error: "not_found", message: "Snippet not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (snippet.user_id !== guard.user.id) {
      return NextResponse.json(
        { error: "forbidden", message: "You do not have access to this snippet" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: snippet.id,
      name: snippet.name,
      pattern: snippet.pattern,
      flags: snippet.flags,
      description: snippet.description,
      tags: snippet.tags,
      created_at: snippet.created_at.toISOString(),
      updated_at: snippet.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Get snippet error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to get snippet" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/snippets/:id - Update a snippet (requires auth)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    // Validate ID format
    const idValidation = validateInput(uuidSchema, id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "invalid_id", message: "Invalid snippet ID format" },
        { status: 400 }
      );
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

    const validation = validateInput(updateSnippetSchema, body);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 });
    }

    const updates = validation.data;

    // Check if there's anything to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "no_updates", message: "No fields to update" },
        { status: 400 }
      );
    }

    // Validate regex if pattern or flags are being updated
    if (updates.pattern !== undefined || updates.flags !== undefined) {
      // Fetch current values if needed
      const current = await queryOne<{ pattern: string; flags: string }>(
        `SELECT pattern, flags FROM snippets WHERE id = $1 AND user_id = $2`,
        [id, guard.user.id]
      );

      if (!current) {
        return NextResponse.json(
          { error: "not_found", message: "Snippet not found" },
          { status: 404 }
        );
      }

      const newPattern = updates.pattern ?? current.pattern;
      const newFlags = updates.flags ?? current.flags;

      try {
        new RegExp(newPattern, newFlags);
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
    }

    // Build dynamic update query
    const setClauses: string[] = [];
    const queryParams: (string | null)[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex}`);
      queryParams.push(updates.name);
      paramIndex++;
    }

    if (updates.pattern !== undefined) {
      setClauses.push(`pattern = $${paramIndex}`);
      queryParams.push(updates.pattern);
      paramIndex++;
    }

    if (updates.flags !== undefined) {
      setClauses.push(`flags = $${paramIndex}`);
      queryParams.push(updates.flags);
      paramIndex++;
    }

    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex}`);
      queryParams.push(updates.description);
      paramIndex++;
    }

    if (updates.tags !== undefined) {
      setClauses.push(`tags = $${paramIndex}::jsonb`);
      queryParams.push(JSON.stringify(updates.tags));
      paramIndex++;
    }

    // Add ID and user_id for WHERE clause
    queryParams.push(id);
    const idParamIndex = paramIndex;
    paramIndex++;

    queryParams.push(guard.user.id);
    const userIdParamIndex = paramIndex;

    // Execute update
    const rows = await query<SnippetRow>(
      `UPDATE snippets
       SET ${setClauses.join(", ")}, updated_at = now()
       WHERE id = $${idParamIndex}::uuid AND user_id = $${userIdParamIndex}::uuid
       RETURNING id::text, name, pattern, flags, description, tags, created_at, updated_at`,
      queryParams
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "not_found", message: "Snippet not found" },
        { status: 404 }
      );
    }

    const snippet = rows[0];

    return NextResponse.json({
      id: snippet.id,
      name: snippet.name,
      pattern: snippet.pattern,
      flags: snippet.flags,
      description: snippet.description,
      tags: snippet.tags,
      created_at: snippet.created_at.toISOString(),
      updated_at: snippet.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Update snippet error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to update snippet" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/snippets/:id - Delete a snippet (requires auth)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    // Validate ID format
    const idValidation = validateInput(uuidSchema, id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "invalid_id", message: "Invalid snippet ID format" },
        { status: 400 }
      );
    }

    // Delete snippet (only if owned by user)
    const rows = await query<{ id: string }>(
      `DELETE FROM snippets
       WHERE id = $1::uuid AND user_id = $2::uuid
       RETURNING id::text`,
      [id, guard.user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "not_found", message: "Snippet not found" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete snippet error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to delete snippet" },
      { status: 500 }
    );
  }
}
