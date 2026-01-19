import { NextRequest, NextResponse } from "next/server";
import { requirePro, isGuardOk } from "@/lib/entitlements/proGuard";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/snippets/:id - Get a specific snippet (Pro only)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const guard = await requirePro();
  if (!isGuardOk(guard)) {
    return guard;
  }

  const { id } = await params;
  // Pro feature implementation would go here
  return NextResponse.json({ error: "unreachable", id }, { status: 500 });
}

/**
 * PATCH /api/snippets/:id - Update a snippet (Pro only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const guard = await requirePro();
  if (!isGuardOk(guard)) {
    return guard;
  }

  const { id } = await params;
  // Pro feature implementation would go here
  return NextResponse.json({ error: "unreachable", id }, { status: 500 });
}

/**
 * DELETE /api/snippets/:id - Delete a snippet (Pro only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const guard = await requirePro();
  if (!isGuardOk(guard)) {
    return guard;
  }

  const { id } = await params;
  // Pro feature implementation would go here
  return NextResponse.json({ error: "unreachable", id }, { status: 500 });
}
