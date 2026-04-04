import { NextResponse } from "next/server";
import { getAuthedUser, AuthedUser } from "@/lib/auth/getUser";

export type AuthGuardOk = {
  ok: true;
  user: AuthedUser;
};

type AuthGuardFail = NextResponse;

/**
 * Require authentication (any signed-in user).
 * Returns the authenticated user or a 401 response.
 */
export async function requireAuth(): Promise<AuthGuardOk | AuthGuardFail> {
  const user = await getAuthedUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message: "You must be signed in to access this endpoint.",
      },
      { status: 401 }
    );
  }

  return { ok: true, user };
}

/**
 * Type guard: check if a guard result is a success
 */
export function isGuardOk(
  result: AuthGuardOk | AuthGuardFail
): result is AuthGuardOk {
  return "ok" in result && result.ok === true;
}
