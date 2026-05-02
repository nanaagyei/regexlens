import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hashEmail, logAuditEvent } from "./auditLog";

describe("hashEmail", () => {
  it("returns a 16-char hex string", () => {
    const hash = hashEmail("user@example.com");
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it("normalises case and whitespace", () => {
    expect(hashEmail("  User@Example.com  ")).toBe(hashEmail("user@example.com"));
  });

  it("never returns the plaintext email", () => {
    const email = "leak-test@example.com";
    const hash = hashEmail(email);
    expect(hash.toLowerCase()).not.toContain(email.toLowerCase());
    expect(hash).not.toContain("@");
  });
});

describe("logAuditEvent", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("emits info events to console.log", () => {
    logAuditEvent({ event: "auth.signin_success", userId: "u_1" });
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(payload.audit_event).toBe("auth.signin_success");
    expect(payload.severity).toBe("info");
    expect(payload.user_id).toBe("u_1");
    expect(payload.timestamp).toMatch(/T/);
  });

  it("emits warning events to console.warn", () => {
    logAuditEvent({ event: "ratelimit.exceeded" });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(warnSpy.mock.calls[0][0] as string);
    expect(payload.severity).toBe("warning");
  });

  it("emits security events to console.error", () => {
    logAuditEvent({ event: "csrf.rejected", ip: "1.2.3.4" });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(payload.severity).toBe("security");
    expect(payload.ip).toBe("1.2.3.4");
  });

  it("never serializes plaintext email when only emailHash is supplied", () => {
    logAuditEvent({
      event: "auth.magic_link_sent",
      emailHash: hashEmail("private@example.com"),
    });
    const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(payload.email_hash).toBeDefined();
    expect(JSON.stringify(payload)).not.toContain("private@example.com");
  });

  it("omits absent optional fields rather than serializing nulls", () => {
    logAuditEvent({ event: "auth.signin_success" });
    const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(payload).not.toHaveProperty("user_id");
    expect(payload).not.toHaveProperty("email_hash");
    expect(payload).not.toHaveProperty("ip");
    expect(payload).not.toHaveProperty("path");
    expect(payload).not.toHaveProperty("metadata");
  });
});
