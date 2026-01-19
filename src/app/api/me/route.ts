import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth/getUser";

export async function GET() {
  const user = await getAuthedUser();

  if (!user) {
    return NextResponse.json(
      {
        user: null,
        entitlement: null,
      },
      { status: 200 }
    );
  }

  // Return user with FREE entitlement (Pro coming soon)
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    },
    entitlement: {
      plan: "FREE",
      status: "active",
      current_period_end: null,
    },
  });
}
