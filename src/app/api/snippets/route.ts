import { NextRequest, NextResponse } from "next/server";
import { requirePro, isGuardOk } from "@/lib/entitlements/proGuard";

/**
 * POST /api/snippets - Create a new regex snippet (Pro only)
 */
export async function POST(request: NextRequest) {
  const guard = await requirePro();
  if (!isGuardOk(guard)) {
    return guard;
  }

  // Pro feature implementation would go here
  // For now, requirePro always returns 402
  return NextResponse.json({ error: "unreachable" }, { status: 500 });
}

/**
 * GET /api/snippets - List user's snippets (Pro only)
 */
export async function GET(request: NextRequest) {
  const guard = await requirePro();
  if (!isGuardOk(guard)) {
    return guard;
  }

  // Pro feature implementation would go here
  return NextResponse.json({ error: "unreachable" }, { status: 500 });
}
