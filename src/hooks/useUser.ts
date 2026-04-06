"use client";

import { useState, useEffect, useCallback } from "react";

export interface UserInfo {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

export interface UseUserReturn {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and cache current user status.
 * Fetches current user from /api/me.
 */
export function useUser(): UseUserReturn {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/me");
      if (!response.ok) {
        setError(`Failed to fetch user (${response.status})`);
        setUser(null);
        return;
      }

      const data = await response.json();
      setUser(data.user ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    refresh: fetchUser,
  };
}
