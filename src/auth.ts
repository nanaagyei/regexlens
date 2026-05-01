import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import PostgresAdapter from "@auth/pg-adapter";
import { pool } from "@/lib/db/pool";

/**
 * Auth.js configuration with multiple providers:
 * - GitHub OAuth
 * - Google OAuth  
 * - Email magic link (via Resend)
 * 
 * Uses PostgreSQL adapter for account linking and user persistence.
 * JWT strategy avoids a DB lookup on every request; token.sub carries
 * the canonical user ID assigned by the adapter.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY ?? process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || "RegexLens <noreply@regexlens.dev>",
    }),
  ],
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      
      if (account) {
        token.provider = account.provider;
      }
      
      return token;
    },
    
    /**
     * Map token claims onto the session object exposed to the client.
     * token.sub is the standard JWT subject — set from user.id on sign-in
     * and persisted automatically across subsequent requests.
     */
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
    
    async signIn({ user: _user, account: _account, profile: _profile }) {
      return true;
    },
  },
  
  events: {},
  
  pages: {
    signIn: "/",
    error: "/",
    verifyRequest: "/",
  },
  
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? "__Secure-authjs.session-token" 
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  
  trustHost: true,
  
  debug: process.env.AUTH_DEBUG === "true",
});
