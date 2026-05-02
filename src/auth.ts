import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import PostgresAdapter from "@auth/pg-adapter";
import { pool } from "@/lib/db/pool";
import { hashEmail, logAuditEvent } from "@/lib/security/auditLog";
import { recordMagicLinkAttempt } from "@/lib/security/accountLockout";

/**
 * Custom magic-link sender that replaces Auth.js's default
 * `sendVerificationRequest`. Adds a per-email lockout check (L7) before
 * issuing the email, then sends via Resend's HTTP API. On lockout we drop
 * silently — never reveal to the requester that a throttle is in effect,
 * to avoid account enumeration. The user-facing UX is identical to a
 * successful send.
 */
async function sendMagicLinkEmail(params: {
  identifier: string;
  url: string;
  provider: { apiKey?: string; from?: string };
}): Promise<void> {
  const { identifier: to, url, provider } = params;
  const apiKey = provider.apiKey;
  if (!apiKey) {
    throw new Error("Resend API key is not configured");
  }

  const lockout = await recordMagicLinkAttempt(to);
  if (!lockout.allowed) {
    return;
  }

  const { host } = new URL(url);
  const escapedHost = host.replace(/\./g, "&#8203;.");
  const htmlBody = `
<body style="background:#f9f9f9;">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background:#fff;max-width:600px;margin:auto;border-radius:10px;">
    <tr><td align="center" style="padding:10px 0px;font-size:22px;font-family:Helvetica,Arial,sans-serif;color:#444;">
      Sign in to <strong>${escapedHost}</strong>
    </td></tr>
    <tr><td align="center" style="padding:20px 0;">
      <a href="${url}" target="_blank"
        style="font-size:18px;font-family:Helvetica,Arial,sans-serif;color:#fff;text-decoration:none;border-radius:5px;padding:10px 20px;background:#346df1;display:inline-block;font-weight:bold;">
        Sign in
      </a>
    </td></tr>
    <tr><td align="center"
      style="padding:0px 0px 10px 0px;font-size:16px;line-height:22px;font-family:Helvetica,Arial,sans-serif;color:#444;">
      If you did not request this email you can safely ignore it.
    </td></tr>
  </table>
</body>`.trim();
  const textBody = `Sign in to ${host}\n${url}\n\n`;

  const resendTimeoutMs = Number.parseInt(
    process.env.RESEND_TIMEOUT_MS ?? "5000",
    10
  );
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), resendTimeoutMs);
  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: provider.from ?? "RegexLens <noreply@regexlens.dev>",
        to,
        subject: `Sign in to ${host}`,
        html: htmlBody,
        text: textBody,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.name === "AbortError") {
      throw new Error("resend_timeout");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    console.error("Resend send failed:", res.status);
    const err = new Error(`resend_error_${res.status}`) as Error & {
      rawResponse?: string;
    };
    err.rawResponse = errorBody;
    throw err;
  }

  logAuditEvent({
    event: "auth.magic_link_sent",
    emailHash: hashEmail(to),
  });
}

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
      sendVerificationRequest: sendMagicLinkEmail,
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

    async redirect({ url, baseUrl }) {
      const isSafeRelativePath =
        url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\");
      if (isSafeRelativePath) {
        return `${baseUrl}${url}`;
      }

      try {
        const targetUrl = new URL(url);
        const baseUrlNormalized = baseUrl.replace(/\/$/, "");
        if (targetUrl.origin === baseUrlNormalized) {
          return targetUrl.toString();
        }
        logAuditEvent({
          event: "auth.redirect_blocked",
          metadata: {
            reason: "cross_origin",
            target_origin: targetUrl.origin,
            base_origin: baseUrlNormalized,
          },
        });
      } catch {
        logAuditEvent({
          event: "auth.redirect_blocked",
          metadata: { reason: "invalid_url" },
        });
      }

      return baseUrl;
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      logAuditEvent({
        event: "auth.signin_success",
        userId: user?.id ?? null,
        emailHash: user?.email ? hashEmail(user.email) : null,
        metadata: {
          provider: account?.provider ?? "unknown",
          new_user: Boolean(isNewUser),
        },
      });
    },
    async signOut(message) {
      const userId =
        "token" in message && message.token?.sub
          ? message.token.sub
          : "session" in message && message.session?.userId
            ? message.session.userId
            : null;
      logAuditEvent({
        event: "auth.signout",
        userId,
      });
    },
  },

  pages: {
    signIn: "/signin",
    error: "/signin",
    verifyRequest: "/signin/verify",
  },

  cookies: {
    sessionToken: {
      // Renamed from `__Secure-authjs.session-token` to a generic, library-agnostic
      // name. `__Host-` prefix is stricter than `__Secure-`: it requires Path=/,
      // forbids Domain attribute, and requires Secure — protecting against
      // subdomain cookie injection.
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-rl-session"
          : "rl-session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  
  trustHost: true,
  
  debug:
    process.env.NODE_ENV === "development" &&
    process.env.AUTH_DEBUG === "true",
});
