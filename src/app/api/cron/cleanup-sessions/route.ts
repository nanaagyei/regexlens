import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db/pool";

export const runtime = "nodejs";

/**
 * GET /api/cron/cleanup-sessions
 *
 * Secured cron endpoint (Vercel Cron uses GET). Requires Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "server_misconfigured", message: "CRON_SECRET is not configured" },
      { status: 500 }
    );
  }

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "unauthorized", message: "Invalid cron authorization" },
      { status: 401 }
    );
  }

  try {
    const result = await queryOne<{ deleted_count: number }>(
      "SELECT cleanup_expired_sessions() AS deleted_count"
    );

    return NextResponse.json({
      ok: true,
      deleted_sessions: result?.deleted_count ?? 0,
    });
  } catch (error) {
    console.error("Cleanup sessions cron error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to clean up sessions" },
      { status: 500 }
    );
  }
}
