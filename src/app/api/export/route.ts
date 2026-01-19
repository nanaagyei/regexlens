import { NextRequest, NextResponse } from "next/server";
import { requirePro, isGuardOk } from "@/lib/entitlements/proGuard";

/**
 * POST /api/export - Export explanation in various formats (Pro only)
 * 
 * Supported formats:
 * - markdown: Markdown document
 * - plain: Plain text
 * - pr_comment: PR comment format
 * - notion: Notion-friendly blocks
 */
export async function POST(request: NextRequest) {
  const guard = await requirePro();
  if (!isGuardOk(guard)) {
    return guard;
  }

  // Pro feature implementation would go here
  // Example export logic:
  // const body = await request.json();
  // const { format, pattern, flags, steps, warnings } = body;
  // const content = generateExport(format, pattern, flags, steps, warnings);
  // return NextResponse.json({ content });

  return NextResponse.json({ error: "unreachable" }, { status: 500 });
}
