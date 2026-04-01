import { auth } from "@/auth";

export type AuthedUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

/**
 * Get the currently authenticated user from the session
 * Returns null if not authenticated
 */
export async function getAuthedUser(): Promise<AuthedUser | null> {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user?.id) {
      return null;
    }

    return {
      id: user.id,
      email: user.email ?? null,
      name: user.name ?? null,
      image: user.image ?? null,
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}
