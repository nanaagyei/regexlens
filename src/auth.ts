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
 * Uses PostgreSQL adapter for persistent sessions and account linking
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Use PostgreSQL adapter for database-backed sessions
  adapter: PostgresAdapter(pool),
  
  providers: [
    // GitHub OAuth
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    
    // Google OAuth
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    
    // Email magic link via Resend
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM || "RegexLens <noreply@regexlens.app>",
    }),
  ],
  
  // Use JWT strategy for better performance (no DB lookup on every request)
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  callbacks: {
    /**
     * JWT callback - runs when JWT is created or updated
     * Add user ID and other data to the token
     */
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      
      // Store the provider used for sign in
      if (account) {
        token.provider = account.provider;
      }
      
      return token;
    },
    
    /**
     * Session callback - runs when session is checked
     * Add user data from token to session
     */
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
    
    /**
     * Sign in callback - runs on every sign in attempt
     * Can be used to block certain users or log sign ins
     */
    async signIn({ user, account, profile }) {
      // Allow all sign ins for now
      // Could add email domain restrictions here
      return true;
    },
  },
  
  events: {
    /**
     * Create user event - runs when a new user is created
     * Create default FREE entitlement for new users
     */
    async createUser({ user }) {
      if (user.id) {
        try {
          // Create default entitlement for new user
          // The trigger in 0002_bootstrap_entitlements.sql should handle this,
          // but we add a fallback here for safety
          await pool.query(
            `INSERT INTO entitlements (user_id, plan, status)
             VALUES ($1, 'FREE', 'inactive')
             ON CONFLICT (user_id) DO NOTHING`,
            [user.id]
          );
        } catch (error) {
          console.error("Failed to create entitlement for user:", error);
        }
      }
    },
  },
  
  pages: {
    signIn: "/",
    error: "/",
    verifyRequest: "/", // Email verification page
  },
  
  // Security settings
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
  
  // Trust the host header in production (for Vercel)
  trustHost: true,
  
  // Debug mode in development
  debug: process.env.NODE_ENV === "development",
});
