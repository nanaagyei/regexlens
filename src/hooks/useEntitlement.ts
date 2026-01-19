"use client";

import { useState, useEffect, useCallback } from "react";

export type Plan = "FREE" | "PRO";
export type Status = "active" | "inactive" | "past_due" | "canceled";

export interface UserInfo {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

export interface EntitlementInfo {
  plan: Plan;
  status: Status;
  current_period_end?: string | null;
}

export interface UseEntitlementReturn {
  user: UserInfo | null;
  entitlement: EntitlementInfo | null;
  isPro: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and cache user entitlement status
 */
export function useEntitlement(): UseEntitlementReturn {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntitlement = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/me");
      const data = await response.json();

      setUser(data.user ?? null);
      setEntitlement(data.entitlement ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch entitlement");
      setUser(null);
      setEntitlement(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntitlement();
  }, [fetchEntitlement]);

  const isPro =
    entitlement?.plan === "PRO" && entitlement?.status === "active";

  return {
    user,
    entitlement,
    isPro,
    isLoading,
    error,
    refresh: fetchEntitlement,
  };
}
