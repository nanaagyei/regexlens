# RegexLens Security Audit

**Date:** 2026-04-30  
**Scope:** Full application — authentication, API routes, database, client-side code, infrastructure configuration  
**Auditor:** Automated code review  

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 3 | 3 |
| High | 5 | 0 |
| Medium | 6 | 1 |
| Low / Informational | 7 | 0 |

---

## Critical

### C1 — No Middleware for Route Protection

**File:** `src/proxy.ts` (created)  
**Description:** There was no Next.js middleware/proxy file. Route protection was done exclusively at the API level via `requireAuth()`.

**Impact:** Information disclosure, potential for future auth bypass if server-side rendering of protected content is added to the `/app` route.

**Status:** ✅ **FIXED** — Created `src/proxy.ts` (Next.js 16 proxy, runs on Node.js runtime) using Auth.js `auth()` wrapper. Unauthenticated requests to `/app/:path*` are redirected to `/`. Uses `proxy.ts` instead of `middleware.ts` to avoid edge runtime incompatibility with Node.js `crypto` module (required by Auth.js).

---

### C2 — No Security Headers

**File:** `next.config.ts`  
**Description:** Prior to the fix, no HTTP security headers were configured. Missing headers included `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`.

**Impact:** Susceptible to clickjacking, MIME-type sniffing attacks, missing HSTS allows SSL-stripping, no CSP allows unrestricted script injection if an XSS vector is found.

**Status:** ✅ **FIXED** — Full security header suite implemented in `next.config.ts`:
- `X-Frame-Options: DENY` (consistent with `frame-ancestors 'none'`)
- `Strict-Transport-Security` with 2-year max-age, includeSubDomains, preload
- Comprehensive `Content-Security-Policy` with documented exceptions:
  - `unsafe-eval` in `script-src`: required by Monaco Editor (`new Function()`)
  - `unsafe-inline` in `script-src`: required by Next.js inline scripts
  - `unsafe-inline` in `style-src`: required by Monaco Editor dynamic styles
- `upgrade-insecure-requests` directive added
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restricting camera, microphone, geolocation, FLoC

---

### C3 — Anthropic API Key Used Directly Without Gateway or Rotation

**File:** `src/app/api/ai/chat/route.ts`  
**Description:** The `ANTHROPIC_API_KEY` environment variable was read directly and used to construct an Anthropic client on every request. No key rotation strategy, no proxy/gateway, and no spend limit enforced.

**Impact:** If the key leaked, an attacker could run up unlimited API costs. A compromised key could not be rotated without redeployment.

**Status:** ✅ **FIXED — Bring Your Own Key (BYOK)** — The server-side `ANTHROPIC_API_KEY` has been completely removed. Users now provide their own Anthropic API key:
- Keys are entered in the Copilot UI and cached in browser `localStorage` with a 48-hour auto-expiry
- Keys are sent to the server via `X-Anthropic-Key` header per request
- The server validates key format, proxies the request to Anthropic, and discards the key immediately
- Keys are never stored, logged, or persisted on the server
- Error logging sanitized to exclude API key values
- Privacy policy updated to document the BYOK model
- `.env.example` and docs updated to reflect the removal of server-side key
- Files modified: `src/app/api/ai/chat/route.ts`, `src/hooks/useAIChat.ts`, `src/components/ai/RegexCopilot.tsx`, `src/components/explain/ExplanationPanel.tsx`, `src/components/layout/AuthExplainerModal.tsx`, `src/app/privacy/page.tsx`
- Files created: `src/lib/ai/apiKeyStorage.ts`

---

## High

### H1 — No Row Level Security (RLS) in PostgreSQL

**File:** `docker/init.sql`  
**Description:** The database schema has no RLS policies. Authorization is enforced purely at the application level via `WHERE user_id = $1` clauses in queries. If the database connection is compromised (e.g., via SQL injection elsewhere, leaked `DATABASE_URL`, or a supply-chain attack on the `pg` driver), all user data is accessible.

**Impact:** Full data breach of all users' saved regex snippets and account information.

**Remediation:**
```sql
-- Enable RLS on user-owned tables
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippet_versions ENABLE ROW LEVEL SECURITY;

-- Create policies (requires setting current user context per-request)
CREATE POLICY snippets_user_isolation ON snippets
  USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY versions_user_isolation ON snippet_versions
  USING (snippet_id IN (
    SELECT id FROM snippets WHERE user_id = current_setting('app.current_user_id')::uuid
  ));
```
Then set `SET LOCAL app.current_user_id = '<user-id>'` at the start of each request transaction.

---

### H2 — Rate Limiting Fully Disabled Without Redis

**File:** `src/lib/security/rateLimit.ts`  
**Description:** When `REDIS_URL` is not configured, rate limiting is disabled for all endpoint types except `auth` (which denies all requests as a safety measure). If production is deployed without Redis, the AI chat, export, snippet, and analyze endpoints are completely unprotected.

**Impact:** Denial of service via request flooding; API cost abuse on the AI endpoint; brute-force enumeration of snippet IDs.

**Remediation:**
- Make `REDIS_URL` a required environment variable for production builds. Fail the build or log a startup warning if missing.
- Implement an in-memory fallback rate limiter using a `Map<string, number[]>` for single-instance deployments, with clear documentation that it does not work across multiple serverless instances.
- Add monitoring/alerting when Redis is unreachable in production.

---

### H3 — `dangerouslySetInnerHTML` XSS Vector in Railroad Diagram

**File:** `src/components/structure/RailroadDiagramPanel.tsx`  
**Description:** SVG output from the `@prantlf/railroad-diagrams` library is injected into the DOM via `dangerouslySetInnerHTML={{ __html: svgContent }}`. While the library generates SVG from parsed regex AST (not user-supplied HTML), any bug in the library or unexpected input could produce SVG containing `<script>` tags or event handlers like `onload`.

**Impact:** Stored XSS if a malicious regex triggers unexpected SVG output.

**Remediation:**
- Sanitize the SVG string with DOMPurify before injection:
```typescript
import DOMPurify from "dompurify";

const safeSvg = DOMPurify.sanitize(svgContent, {
  USE_PROFILES: { svg: true, svgFilters: true },
  ADD_TAGS: ["use"],
});
```
- Alternatively, render the SVG in a sandboxed `<iframe>` with `sandbox=""`.

---

### H4 — No CSRF Protection on Custom API Routes

**Files:** `src/app/api/snippets/route.ts`, `src/app/api/export/route.ts`, `src/app/api/ai/chat/route.ts`, `src/app/api/analyze/route.ts`  
**Description:** Auth.js protects its own sign-in/sign-out routes with CSRF tokens, but the custom state-changing API routes (POST to snippets, export, AI chat, analyze) have no CSRF validation. A malicious website could trick an authenticated user's browser into making cross-origin requests to these endpoints.

**Impact:** Cross-site request forgery — an attacker could create/modify/delete snippets on behalf of an authenticated user.

**Remediation:**
- Verify the `Origin` or `Referer` header on all state-changing (POST/PATCH/DELETE) API routes:
```typescript
function verifyCsrf(request: Request): boolean {
  const origin = request.headers.get("origin");
  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ].filter(Boolean);
  return !!origin && allowedOrigins.some((allowed) => origin === allowed);
}
```
- Alternatively, require a custom header like `X-Requested-With: XMLHttpRequest` on all API calls (browsers block cross-origin requests with custom headers by default unless CORS permits it).

---

### H5 — ILIKE Wildcard Injection in Snippet Search

**File:** `src/app/api/snippets/route.ts`  
**Description:** The snippet list endpoint constructs an ILIKE filter as `%${searchQuery}%`. While the value is passed as a parameterized query argument (preventing SQL injection), the `%` and `_` wildcard characters within the user's search string are not escaped. A user can craft queries like `%` (match everything) or `___` (match exactly 3-character names) to enumerate data.

**Impact:** Information disclosure — an authenticated user could systematically extract names/patterns of all their own snippets via wildcard abuse. Since snippets are user-scoped this is low practical impact, but the pattern is dangerous if ever applied to cross-user queries.

**Remediation:**
```typescript
function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

// In the query:
queryParams.push(`%${escapeLike(searchQuery)}%`);
```

---

## Medium

### M1 — JWT Strategy with Database Adapter Mismatch

**File:** `src/auth.ts`  
**Description:** The configuration uses `PostgresAdapter(pool)` with `session: { strategy: "jwt" }`. The adapter creates rows in the `sessions` table on every sign-in, but these DB sessions are never actually read (JWT is used instead). This wastes DB writes and creates stale session records.

**Impact:** Wasted database I/O; stale session rows accumulate; confusion about the actual session mechanism.

**Remediation:**
- The adapter is still needed for account linking and user creation. The `sessions` table writes are an Auth.js implementation detail. Run the `cleanup_expired_sessions()` function periodically (e.g., via a cron job) to clean up stale rows.
- Consider using `session: { strategy: "database" }` if you want simpler token revocation, or document the JWT+adapter trade-off.

---

### M2 — No `redirect` Callback Validation

**File:** `src/auth.ts`  
**Description:** Auth.js v5 beta does not include a `redirect` callback by default. While the current `callbackUrl` values are hardcoded as relative paths (safe), the absence of explicit validation means a future developer could introduce an open redirect by passing an external URL as `callbackUrl`.

**Impact:** Open redirect vulnerability if `callbackUrl` is ever derived from user input.

**Remediation:**
```typescript
callbacks: {
  async redirect({ url, baseUrl }) {
    if (url.startsWith("/")) return `${baseUrl}${url}`;
    if (new URL(url).origin === baseUrl) return url;
    return baseUrl;
  },
  // ... other callbacks
}
```

---

### M3 — No `authorized` Callback or Middleware Auth Guard

**File:** `src/auth.ts`  
**Description:** There was no `authorized` callback in the Auth.js config and no middleware protecting routes.

**Impact:** Information disclosure; any server-rendered protected content would be exposed.

**Status:** ✅ **FIXED** — Addressed by C1 (`src/proxy.ts` now protects `/app` routes). The `authorized` callback approach was not needed since the proxy provides equivalent protection.

---

### M4 — Image Remote Patterns Missing OAuth Provider Avatars

**File:** `next.config.ts`  
**Description:** Prior to the fix in this session, `remotePatterns` only included `images.unsplash.com`. User avatar images from GitHub (`avatars.githubusercontent.com`) and Google (`lh3.googleusercontent.com`) were loaded with the `unoptimized` prop, bypassing Next.js image optimization and its security checks.

**Impact:** Minor — `unoptimized` images skip size/format optimization but don't introduce a direct vulnerability. However, missing patterns mean `next/image` without `unoptimized` would refuse to load these images.

**Remediation:** Fixed in this session — added `avatars.githubusercontent.com` and `lh3.googleusercontent.com` to `remotePatterns`. Components using these avatars should remove `unoptimized` to benefit from optimization.

**Status:** FIXED in this session.

---

### M5 — Redis Errors Silently Allow All Requests

**File:** `src/lib/security/rateLimit.ts`  
**Description:** When Redis throws an error (connection timeout, OOM, etc.), the `checkRateLimit` function catches the error, logs it, and returns `success: true` — allowing the request through. While this is the correct availability-over-security trade-off for most endpoints, it means a Redis outage completely disables rate limiting.

**Impact:** During Redis failures, all rate limiting is bypassed. An attacker who can trigger Redis downtime (or who happens to attack during an outage) faces no rate limits.

**Remediation:**
- Add monitoring/alerting on the `"Rate limit check failed"` log line.
- For critical endpoints (AI chat, auth), consider failing closed (denying the request) when Redis is unreachable.
- Track Redis health with a circuit breaker pattern.

---

### M6 — No Request Body Size Limits

**Files:** All API route handlers  
**Description:** API routes rely on Zod schema validation for field-level size limits (e.g., pattern max 4000 chars), but there is no global request body size limit. An attacker could send a multi-megabyte JSON payload with valid schema structure but extremely large allowed fields, consuming server memory before validation completes.

**Impact:** Memory exhaustion denial of service.

**Remediation:**
- Add a body size check before parsing JSON:
```typescript
const contentLength = parseInt(request.headers.get("content-length") || "0");
if (contentLength > 100_000) { // 100KB limit
  return NextResponse.json(
    { error: "payload_too_large", message: "Request body too large" },
    { status: 413 }
  );
}
```
- Or configure this at the infrastructure level (Vercel has a 4.5MB body limit by default, but explicit limits are still good practice).

---

## Low / Informational

### L1 — next-auth v5 Beta Dependency

**File:** `package.json`  
**Description:** The project uses `next-auth@5.0.0-beta.25`, a pre-release version. Beta versions may contain undiscovered security bugs, breaking changes, and incomplete features.

**Impact:** Potential for auth-related bugs; no formal security advisory process for beta releases.

**Remediation:** Track the Auth.js stable v5 release and upgrade when available. Pin the exact version to avoid unexpected updates.

---

### L2 — Debug Mode Controllable Via Environment Variable

**File:** `src/auth.ts`  
**Description:** `debug: process.env.AUTH_DEBUG === "true"` allows enabling verbose Auth.js debug logging in production by setting an environment variable. Debug output may include tokens, session data, and internal state.

**Impact:** Information disclosure if an attacker gains access to environment variable configuration.

**Remediation:** Restrict debug mode to development only:
```typescript
debug: process.env.NODE_ENV === "development" && process.env.AUTH_DEBUG === "true",
```

---

### L3 — Error Details Leaked in API Responses

**Files:** `src/app/api/snippets/route.ts`, `src/app/api/ai/chat/route.ts`  
**Description:** Some error responses include raw error messages from internal libraries (e.g., `regexError instanceof Error ? regexError.message : "Unknown error"`). While regex validation errors are benign, this pattern could leak sensitive implementation details if applied to database or system errors.

**Impact:** Minor information disclosure — helps attackers understand internal technology stack.

**Remediation:** Return generic error messages to clients; log detailed errors server-side only:
```typescript
console.error("Regex validation failed:", regexError);
return NextResponse.json(
  { error: "invalid_regex", message: "The provided pattern is not a valid regular expression" },
  { status: 400 }
);
```

---

### L4 — No Audit Logging

**Description:** There is no logging of security-relevant events: sign-ins, failed authentication attempts, snippet deletions, API key usage, rate limit hits, or permission denials.

**Impact:** Inability to detect or investigate security incidents; no forensic trail.

**Remediation:**
- Add structured logging for authentication events (sign-in success/failure, sign-out).
- Log rate limit violations with IP and user context.
- Log all snippet delete operations.
- Use a structured logging library (e.g., `pino`) with JSON output for log aggregation.

---

### L5 — Cookie Name Reveals Technology Stack

**File:** `src/auth.ts`  
**Description:** The session cookie is named `__Secure-authjs.session-token` (production) or `authjs.session-token` (development). This reveals that the application uses Auth.js for authentication.

**Impact:** Minor reconnaissance advantage — helps attackers target Auth.js-specific vulnerabilities.

**Remediation:** Consider using a generic cookie name like `__Secure-session` or `__Host-sid`. Note: changing this will invalidate all existing sessions.

---

### L6 — Development Database Credentials Publicly Documented

**File:** `SETUP.md`, `docker-compose.yml`, `.env.example`  
**Description:** The development database credentials (`regexlens` / `regexlens_dev`) are documented in the setup guide and committed to the repository. This is normal for development, but the pattern should not carry to production.

**Impact:** None for development; risk if developers reuse these credentials in production.

**Remediation:** Document explicitly that production must use unique, strong credentials. Add a startup check that warns if `DATABASE_URL` contains default dev credentials in production.

---

### L7 — No Account Lockout Mechanism

**Description:** There is no mechanism to lock user accounts or throttle sign-in attempts per account after repeated failures. The rate limiting on `auth` type applies per-IP only.

**Impact:** Distributed brute-force attacks from multiple IPs could target a specific email account.

**Remediation:**
- Track failed sign-in attempts per email/account in Redis.
- After N failures (e.g., 10), require a CAPTCHA or impose a cooldown period.
- Send email notification to the account owner after suspicious activity.

---

## Appendix: Files Reviewed

| File | Category |
|------|----------|
| `src/auth.ts` | Authentication configuration |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth route handler |
| `src/app/api/me/route.ts` | User profile API |
| `src/app/api/snippets/route.ts` | Snippet CRUD API |
| `src/app/api/snippets/[id]/route.ts` | Snippet by ID API |
| `src/app/api/snippets/[id]/versions/route.ts` | Snippet versioning API |
| `src/app/api/snippets/[id]/diff/route.ts` | Version diff API |
| `src/app/api/ai/chat/route.ts` | AI chat API |
| `src/app/api/analyze/route.ts` | Regex analysis API |
| `src/app/api/export/route.ts` | Export API |
| `src/app/api/fixtures/regexlens/route.ts` | Fixtures API |
| `src/lib/auth/getUser.ts` | Auth utility |
| `src/lib/auth/requireAuth.ts` | Auth guard |
| `src/lib/security/rateLimit.ts` | Rate limiting |
| `src/lib/security/validation.ts` | Input validation |
| `src/lib/db/pool.ts` | Database connection |
| `src/components/layout/AuthExplainerModal.tsx` | Auth UI |
| `src/components/layout/UserMenu.tsx` | User menu |
| `src/components/auth/SignInCallout.tsx` | Sign-in CTA |
| `src/components/providers/AuthProvider.tsx` | Session provider |
| `src/components/structure/RailroadDiagramPanel.tsx` | SVG rendering |
| `src/hooks/useUser.ts` | Client auth hook |
| `src/types/next-auth.d.ts` | Type augmentation |
| `next.config.ts` | Next.js configuration |
| `docker/init.sql` | Database schema |
| `package.json` | Dependencies |
| `.env.example` | Environment template |

## Remediated (2026-05-01)

- **H1**: Enabled PostgreSQL RLS for `snippets`/`snippet_versions` and aligned app request context handling for tenant-scoped access in snippet routes; primary files: `docker/init.sql`, `docker/migrations/enable_rls_snippets.sql`, `src/app/api/snippets/route.ts`, `src/app/api/snippets/[id]/route.ts`, `src/app/api/snippets/[id]/versions/route.ts`, `src/app/api/snippets/[id]/diff/route.ts`, `src/lib/db/pool.ts`.
- **H2**: Hardened rate limiting for Redis-missing/error paths with fail-closed production behavior and explicit environment defaults; primary files: `src/lib/security/rateLimit.ts`, `.env.example`.
- **H3**: Sanitized SVG rendered via `dangerouslySetInnerHTML` to mitigate XSS risk in railroad diagram rendering; primary files: `src/components/structure/RailroadDiagramPanel.tsx`, `package.json`, `package-lock.json`.
- **H4**: Added CSRF verification for state-changing API routes using a shared helper and route-level enforcement; primary files: `src/lib/security/csrf.ts`, `src/app/api/snippets/route.ts`, `src/app/api/snippets/[id]/route.ts`, `src/app/api/snippets/[id]/versions/route.ts`, `src/app/api/snippets/[id]/diff/route.ts`, `src/app/api/export/route.ts`, `src/app/api/ai/chat/route.ts`, `src/app/api/analyze/route.ts`.
- **H5**: Escaped ILIKE wildcard input in snippet search to prevent uncontrolled pattern matching; primary files: `src/lib/security/validation.ts`, `src/app/api/snippets/route.ts`.
- **M1**: Added stale-session cleanup endpoint and cron wiring for periodic maintenance; primary files: `src/app/api/cron/cleanup-sessions/route.ts`, `vercel.json`.
- **M2**: Hardened NextAuth redirect callback validation to prevent unsafe redirect targets; primary files: `src/auth.ts`.
- **M5**: Applied production fail-closed handling on Redis error paths for critical rate-limit tiers; primary file: `src/lib/security/rateLimit.ts`.
- **M6**: Enforced request body size limits before JSON parsing on mutation routes via shared validation and route updates; primary files: `src/lib/security/validation.ts`, `src/app/api/snippets/route.ts`, `src/app/api/snippets/[id]/route.ts`, `src/app/api/export/route.ts`, `src/app/api/ai/chat/route.ts`, `src/app/api/analyze/route.ts`.

### Operational Notes

- **RLS rollout order**: Deploy app code that sets tenant context via `set_config(...)` before enabling RLS on existing databases, or previously valid requests can be denied.
- **Cleanup endpoint secret**: `CRON_SECRET` is required to invoke the cleanup route in non-local environments.
- **Rate-limit fallback behavior**: In non-production, the limiter can use a safe fallback path if Redis is missing; in production, missing Redis is treated fail-closed to avoid silent protection bypass.

### Verification Status

- **M3/M4**: Remain verified fixed in current implementation state (no regression observed in this update).
