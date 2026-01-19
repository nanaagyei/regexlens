import { NextResponse } from "next/server";
import { getAuthedUser, AuthedUser } from "@/lib/auth/getUser";

type Plan = "FREE" | "PRO";
type Status = "active" | "inactive" | "past_due" | "canceled";

export type Entitlement = {
  plan: Plan;
  status: Status;
  currentPeriodEnd?: string;
};

type ProGuardOk = {
  ok: true;
  user: AuthedUser;
  entitlement: Entitlement;
};

type ProGuardFail = NextResponse;

/**
 * Require authentication only (any user)
 */
export async function requireAuth(): Promise<ProGuardOk | ProGuardFail> {
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

  return {
    ok: true,
    user,
    entitlement: { plan: "FREE", status: "inactive" },
  };
}

/**
 * Require Pro subscription
 * Currently returns 402 for all users since Pro is not implemented
 */
export async function requirePro(): Promise<ProGuardOk | ProGuardFail> {
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

  // For now, all users are FREE
  // In production, this would query the entitlements table
  const entitlement: Entitlement = {
    plan: "FREE",
    status: "inactive",
  };

  // Pro features are coming soon - always return 402
  return NextResponse.json(
    {
      error: "pro_required",
      message: "Upgrade to RegexLens Pro to access this feature.",
      details: {
        plan: entitlement.plan,
        status: entitlement.status,
        upgrade_url: "/pricing",
      },
    },
    { status: 402 }
  );
}

/**
 * Check if a guard result is a success
 */
export function isGuardOk(
  result: ProGuardOk | ProGuardFail
): result is ProGuardOk {
  return "ok" in result && result.ok === true;
}
