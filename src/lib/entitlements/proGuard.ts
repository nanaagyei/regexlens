import { NextResponse } from "next/server";
import { getAuthedUser, AuthedUser } from "@/lib/auth/getUser";
import { queryOne } from "@/lib/db/pool";

type Plan = "FREE" | "PRO";
type Status = "active" | "inactive" | "past_due" | "canceled";

export type Entitlement = {
  plan: Plan;
  status: Status;
  currentPeriodEnd?: string | null;
};

type ProGuardOk = {
  ok: true;
  user: AuthedUser;
  entitlement: Entitlement;
};

type ProGuardFail = NextResponse;

interface EntitlementRow {
  plan: string;
  status: string;
  current_period_end: Date | null;
}

/**
 * Fetch entitlement from database for a user
 */
async function getEntitlementFromDB(userId: string): Promise<Entitlement> {
  try {
    const row = await queryOne<EntitlementRow>(
      `SELECT plan::text, status::text, current_period_end
       FROM entitlements
       WHERE user_id = $1`,
      [userId]
    );

    if (!row) {
      // No entitlement row - return default FREE
      return { plan: "FREE", status: "inactive" };
    }

    return {
      plan: (row.plan as Plan) || "FREE",
      status: (row.status as Status) || "inactive",
      currentPeriodEnd: row.current_period_end?.toISOString() || null,
    };
  } catch (error) {
    console.error("Failed to fetch entitlement:", error);
    // On error, default to FREE for safety
    return { plan: "FREE", status: "inactive" };
  }
}

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

  // Fetch actual entitlement from database
  const entitlement = await getEntitlementFromDB(user.id);

  return {
    ok: true,
    user,
    entitlement,
  };
}

/**
 * Require Pro subscription
 * Checks database for active Pro entitlement
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

  // Fetch actual entitlement from database
  const entitlement = await getEntitlementFromDB(user.id);

  // Check if user has active Pro subscription
  const isProActive = entitlement.plan === "PRO" && entitlement.status === "active";

  if (!isProActive) {
    // Check if subscription is past due (give grace period)
    const isPastDue = entitlement.plan === "PRO" && entitlement.status === "past_due";
    
    if (isPastDue) {
      // Allow access but warn about payment issue
      return {
        ok: true,
        user,
        entitlement,
      };
    }

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

  return { ok: true, user, entitlement };
}

/**
 * Check if a guard result is a success
 */
export function isGuardOk(
  result: ProGuardOk | ProGuardFail
): result is ProGuardOk {
  return "ok" in result && result.ok === true;
}

/**
 * Get entitlement for a user without requiring authentication
 * Useful for /api/me endpoint
 */
export async function getEntitlement(userId: string): Promise<Entitlement> {
  return getEntitlementFromDB(userId);
}
