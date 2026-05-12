import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { enforceCsrfProtection } from "./csrf";

function makeRequest(opts: {
  method?: string;
  origin?: string | null;
  host?: string | null;
  proto?: string;
  pathname?: string;
}): NextRequest {
  const headers = new Headers();
  if (opts.origin) headers.set("origin", opts.origin);
  if (opts.host) headers.set("host", opts.host);
  if (opts.proto) headers.set("x-forwarded-proto", opts.proto);

  const protocol = opts.proto ?? "http";
  const host = opts.host ?? "localhost:3000";
  const url = `${protocol}://${host}${opts.pathname ?? "/api/snippets"}`;

  return new NextRequest(url, {
    method: opts.method ?? "POST",
    headers,
  });
}

describe("enforceCsrfProtection", () => {
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

  it("allows safe methods (GET) without checks", () => {
    const result = enforceCsrfProtection(
      makeRequest({ method: "GET", origin: null, host: "example.com" })
    );
    expect(result).toBeNull();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("rejects POST when Origin header is missing", async () => {
    const result = enforceCsrfProtection(
      makeRequest({ method: "POST", origin: null, host: "example.com" })
    );
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(payload.audit_event).toBe("csrf.rejected");
    expect(payload.metadata.reason).toBe("missing_origin");
  });

  it("rejects POST when origin does not match host", async () => {
    const result = enforceCsrfProtection(
      makeRequest({
        method: "POST",
        origin: "https://evil.example",
        host: "regexlens.dev",
        proto: "https",
      })
    );
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
    const payload = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(payload.audit_event).toBe("csrf.rejected");
    expect(payload.metadata.reason).toBe("origin_mismatch");
  });

  it("allows POST when origin matches request URL even if SITE_URL canonical differs", () => {
    const result = enforceCsrfProtection(
      makeRequest({
        method: "POST",
        origin: "https://abc123.vercel.app",
        host: "abc123.vercel.app",
        proto: "https",
        pathname: "/api/snippets",
      })
    );
    expect(result).toBeNull();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("emits audit event with method metadata on rejection", () => {
    enforceCsrfProtection(
      makeRequest({
        method: "DELETE",
        origin: "https://attacker.test",
        host: "regexlens.dev",
        proto: "https",
      })
    );
    const payload = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(payload.metadata.method).toBe("DELETE");
  });

  it("rejects POST with missing_host when no trusted origins can be derived", async () => {
    vi.resetModules();
    vi.doMock("@/lib/site", () => ({ SITE_URL: ":::not-a-url" }));
    try {
      const { NextRequest } = await import("next/server");
      const { enforceCsrfProtection: enforceWithBrokenSite } = await import(
        "./csrf"
      );
      const req = new NextRequest("file:///tmp/csrf", {
        method: "POST",
        headers: { origin: "https://evil.example" },
      });
      const result = enforceWithBrokenSite(req);
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
      expect(errorSpy).toHaveBeenCalled();
      const payload = JSON.parse(errorSpy.mock.calls.at(-1)![0] as string);
      expect(payload.audit_event).toBe("csrf.rejected");
      expect(payload.metadata.reason).toBe("missing_host");
    } finally {
      vi.doUnmock("@/lib/site");
      vi.resetModules();
    }
  });
});
