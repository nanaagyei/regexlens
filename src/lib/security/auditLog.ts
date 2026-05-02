import { createHash } from "node:crypto";

/**
 * Structured audit logging for security-relevant events.
 *
 * Single sink for sign-ins, magic-link issuance, rate-limit hits, CSRF
 * rejections, snippet deletions, and similar trace events. Output is a
 * single-line JSON object on stdout/stderr — Vercel and most log
 * aggregators ingest this format natively.
 *
 * Design notes:
 * - No external dependencies (DRY w.r.t. existing infra).
 * - Email is never logged in plaintext; callers pass `emailHash` from `hashEmail`.
 * - This module imports nothing from auth or route code, preventing
 *   circular dependencies (auth/routes → auditLog only).
 */

export type AuditEventName =
  | "auth.signin_success"
  | "auth.signin_failure"
  | "auth.signout"
  | "auth.magic_link_sent"
  | "auth.magic_link_throttled"
  | "auth.lockout_triggered"
  | "auth.redirect_blocked"
  | "ratelimit.exceeded"
  | "ratelimit.redis_unavailable"
  | "csrf.rejected"
  | "snippet.deleted"
  | "validation.invalid_regex";

export type AuditEventSeverity = "info" | "warning" | "security";

export interface AuditEventInput {
  event: AuditEventName;
  userId?: string | null;
  emailHash?: string | null;
  ip?: string | null;
  path?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

/**
 * Map event names to severity buckets. Security events go to stderr so
 * Vercel/Cloud platforms surface them with elevated visibility.
 */
const SEVERITY_BY_EVENT: Record<AuditEventName, AuditEventSeverity> = {
  "auth.signin_success": "info",
  "auth.signin_failure": "security",
  "auth.signout": "info",
  "auth.magic_link_sent": "info",
  "auth.magic_link_throttled": "warning",
  "auth.lockout_triggered": "security",
  "auth.redirect_blocked": "security",
  "ratelimit.exceeded": "warning",
  "ratelimit.redis_unavailable": "warning",
  "csrf.rejected": "security",
  "snippet.deleted": "info",
  "validation.invalid_regex": "info",
};

/**
 * Hash an email address for log correlation without storing PII.
 * Returns a 16-char prefix of SHA-256 hex (sufficient for correlation,
 * resistant to reversal for non-trivial inputs).
 */
export function hashEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

/**
 * Emit a structured audit event. Never throws.
 */
export function logAuditEvent(input: AuditEventInput): void {
  const severity = SEVERITY_BY_EVENT[input.event] ?? "info";

  const payload = {
    timestamp: new Date().toISOString(),
    severity,
    audit_event: input.event,
    ...(input.userId ? { user_id: input.userId } : {}),
    ...(input.emailHash ? { email_hash: input.emailHash } : {}),
    ...(input.ip ? { ip: input.ip } : {}),
    ...(input.path ? { path: input.path } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
  };

  let serialized: string;
  try {
    serialized = JSON.stringify(payload);
  } catch {
    serialized = JSON.stringify({
      timestamp: new Date().toISOString(),
      severity: "warning",
      audit_event: input.event,
      error: "audit_payload_unserializable",
    });
  }

  if (severity === "security") {
    console.error(serialized);
  } else if (severity === "warning") {
    console.warn(serialized);
  } else {
    console.log(serialized);
  }
}
