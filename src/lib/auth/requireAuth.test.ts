import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { requireAuth, isGuardOk, AuthGuardOk } from "./requireAuth";

// Mock getAuthedUser
vi.mock("@/lib/auth/getUser", () => ({
  getAuthedUser: vi.fn(),
}));

import { getAuthedUser } from "@/lib/auth/getUser";

const mockGetAuthedUser = vi.mocked(getAuthedUser);

const fakeUser = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  image: null,
};

describe("requireAuth", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns ok with user when authenticated", async () => {
    mockGetAuthedUser.mockResolvedValue(fakeUser);

    const result = await requireAuth();

    expect(isGuardOk(result)).toBe(true);
    const ok = result as AuthGuardOk;
    expect(ok.user).toEqual(fakeUser);
  });

  it("returns 401 response when not authenticated", async () => {
    mockGetAuthedUser.mockResolvedValue(null);

    const result = await requireAuth();

    expect(isGuardOk(result)).toBe(false);
    expect(result).toBeInstanceOf(NextResponse);

    const response = result as NextResponse;
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe("unauthorized");
  });
});

describe("isGuardOk", () => {
  it("returns true for success result", () => {
    const ok: AuthGuardOk = { ok: true, user: fakeUser };
    expect(isGuardOk(ok)).toBe(true);
  });

  it("returns false for NextResponse", () => {
    const fail = NextResponse.json({ error: "unauthorized" }, { status: 401 });
    expect(isGuardOk(fail)).toBe(false);
  });
});
