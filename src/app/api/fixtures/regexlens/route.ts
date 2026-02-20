import { NextResponse } from "next/server";
import { loadRegexFixture } from "@/lib/fixtures/loadFixture";

export async function GET() {
  try {
    const fixture = await loadRegexFixture();
    return NextResponse.json(fixture, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load fixture";
    return NextResponse.json(
      {
        error: "fixture_unavailable",
        message,
      },
      { status: 500 }
    );
  }
}
