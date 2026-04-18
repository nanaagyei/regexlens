// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { encodeState, decodeState, buildShareUrl } from "./serialize";
import type { RegexState } from "@/types";

const DEFAULT_STATE: RegexState = {
  pattern: "",
  flags: "g",
  text: "",
  flavor: "javascript",
  comparisonPattern: "",
  comparisonFlags: "",
  explanationMode: "simple",
  selectedTemplate: null,
};

function makeState(overrides: Partial<RegexState> = {}): RegexState {
  return { ...DEFAULT_STATE, ...overrides };
}

describe("encodeState", () => {
  it("encodes pattern as URL-safe base64", () => {
    const params = encodeState(makeState({ pattern: "^hello$" }));
    expect(params.p).toBeDefined();
    // URL-safe base64 should not contain +, /, or trailing =
    expect(params.p).not.toMatch(/[+/=]/);
    // Should roundtrip via decode
    expect(decodeState({ p: params.p }).pattern).toBe("^hello$");
  });

  it("encodes flags as raw string", () => {
    const params = encodeState(makeState({ flags: "gi" }));
    expect(params.f).toBe("gi");
  });

  it("encodes text as URL-safe base64", () => {
    const params = encodeState(makeState({ text: "test input" }));
    expect(params.t).toBeDefined();
    expect(decodeState({ t: params.t }).text).toBe("test input");
  });

  it("encodes comparison pattern and flags", () => {
    const params = encodeState(
      makeState({ comparisonPattern: "abc", comparisonFlags: "im" })
    );
    expect(params.cp).toBeDefined();
    expect(decodeState({ cp: params.cp }).comparisonPattern).toBe("abc");
    expect(params.cf).toBe("im");
  });

  it("encodes explanation mode only when non-default", () => {
    const simple = encodeState(makeState({ explanationMode: "simple" }));
    expect(simple.m).toBeUndefined();

    const technical = encodeState(makeState({ explanationMode: "technical" }));
    expect(technical.m).toBe("technical");
  });

  it("encodes selected template", () => {
    const params = encodeState(makeState({ selectedTemplate: "email-basic" }));
    expect(params.tpl).toBe("email-basic");
  });

  it("omits empty values", () => {
    const params = encodeState(DEFAULT_STATE);
    expect(params.p).toBeUndefined();
    expect(params.t).toBeUndefined();
    expect(params.cp).toBeUndefined();
    expect(params.cf).toBeUndefined();
    expect(params.m).toBeUndefined();
    expect(params.tpl).toBeUndefined();
  });

  it("omits null selectedTemplate", () => {
    const params = encodeState(makeState({ selectedTemplate: null }));
    expect(params.tpl).toBeUndefined();
  });

  it("produces shorter output than legacy encodeURIComponent+btoa for special chars", () => {
    const pattern = "^(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}$";
    const params = encodeState(makeState({ pattern }));
    const legacyEncoded = btoa(encodeURIComponent(pattern));
    expect(params.p.length).toBeLessThan(legacyEncoded.length);
  });
});

describe("decodeState", () => {
  it("decodes pattern from URL-safe base64", () => {
    const encoded = encodeState(makeState({ pattern: "^hello$" }));
    const state = decodeState({ p: encoded.p });
    expect(state.pattern).toBe("^hello$");
  });

  it("decodes legacy encodeURIComponent+btoa format (backward compat)", () => {
    const legacy = btoa(encodeURIComponent("^hello$"));
    const state = decodeState({ p: legacy });
    expect(state.pattern).toBe("^hello$");
  });

  it("falls back to raw string on invalid base64", () => {
    const state = decodeState({ p: "not-valid-base64!!!" });
    expect(state.pattern).toBe("not-valid-base64!!!");
  });

  it("validates flags against gimsuy", () => {
    const state = decodeState({ f: "gixmz" });
    expect(state.flags).toBe("gim");
  });

  it("decodes comparison pattern and flags", () => {
    const encoded = encodeState(
      makeState({ comparisonPattern: "abc", comparisonFlags: "im" })
    );
    const state = decodeState({ cp: encoded.cp, cf: "im" });
    expect(state.comparisonPattern).toBe("abc");
    expect(state.comparisonFlags).toBe("im");
  });

  it("decodes valid explanation mode", () => {
    expect(decodeState({ m: "technical" }).explanationMode).toBe("technical");
    expect(decodeState({ m: "simple" }).explanationMode).toBe("simple");
  });

  it("ignores invalid explanation mode", () => {
    expect(decodeState({ m: "invalid" }).explanationMode).toBeUndefined();
  });

  it("decodes selected template", () => {
    expect(decodeState({ tpl: "email-basic" }).selectedTemplate).toBe(
      "email-basic"
    );
  });

  it("returns empty object for empty params", () => {
    expect(decodeState({})).toEqual({});
  });

  it("ignores undefined values", () => {
    const state = decodeState({
      p: undefined,
      f: undefined,
      t: undefined,
    });
    expect(state).toEqual({});
  });
});

describe("encodeState/decodeState roundtrip", () => {
  it("roundtrips full state", () => {
    const state = makeState({
      pattern: "^([AB]+)\\d{2}$",
      flags: "gim",
      text: "AB12\nA99\nBBB00",
      comparisonPattern: "[a-z]+",
      comparisonFlags: "i",
      explanationMode: "technical",
      selectedTemplate: "ab-two-digits",
    });

    const encoded = encodeState(state);
    const decoded = decodeState(encoded);

    expect(decoded.pattern).toBe(state.pattern);
    expect(decoded.flags).toBe(state.flags);
    expect(decoded.text).toBe(state.text);
    expect(decoded.comparisonPattern).toBe(state.comparisonPattern);
    expect(decoded.comparisonFlags).toBe(state.comparisonFlags);
    expect(decoded.explanationMode).toBe(state.explanationMode);
    expect(decoded.selectedTemplate).toBe(state.selectedTemplate);
  });

  it("roundtrips partial state (pattern + flags only)", () => {
    const state = makeState({ pattern: "\\d+", flags: "g" });
    const decoded = decodeState(encodeState(state));
    expect(decoded.pattern).toBe("\\d+");
    expect(decoded.flags).toBe("g");
  });

  it("roundtrips unicode characters", () => {
    const state = makeState({
      pattern: "[\\u00C0-\\u024F]",
      text: "cafe\u0301 na\u00EFve r\u00E9sum\u00E9",
    });
    const decoded = decodeState(encodeState(state));
    expect(decoded.pattern).toBe(state.pattern);
    expect(decoded.text).toBe(state.text);
  });

  it("roundtrips special regex metacharacters", () => {
    const state = makeState({
      pattern: "(?:(?<=\\$)\\d+\\.\\d{2})",
      text: "Price: $19.99 and $5.00",
    });
    const decoded = decodeState(encodeState(state));
    expect(decoded.pattern).toBe(state.pattern);
    expect(decoded.text).toBe(state.text);
  });

  it("roundtrips newlines and tabs", () => {
    const state = makeState({
      text: "line1\nline2\ttab\rcarriage",
    });
    const decoded = decodeState(encodeState(state));
    expect(decoded.text).toBe(state.text);
  });

  it("roundtrips large pattern (2000 chars)", () => {
    const pattern = "a".repeat(2000);
    const state = makeState({ pattern });
    const decoded = decodeState(encodeState(state));
    expect(decoded.pattern).toBe(pattern);
  });

  it("roundtrips large text (50000 chars)", () => {
    const text = "test line\n".repeat(5000);
    const state = makeState({ text });
    const decoded = decodeState(encodeState(state));
    expect(decoded.text).toBe(text);
  });

  it("backward compat: old URLs with legacy encoding decode correctly", () => {
    const oldParams = {
      p: btoa(encodeURIComponent("^hello$")),
      f: "gi",
      t: btoa(encodeURIComponent("hello world")),
    };
    const state = decodeState(oldParams);
    expect(state.pattern).toBe("^hello$");
    expect(state.flags).toBe("gi");
    expect(state.text).toBe("hello world");
    expect(state.comparisonPattern).toBeUndefined();
    expect(state.comparisonFlags).toBeUndefined();
    expect(state.explanationMode).toBeUndefined();
    expect(state.selectedTemplate).toBeUndefined();
  });
});

describe("buildShareUrl", () => {
  beforeEach(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: {
        origin: "https://regexlens.com",
        pathname: "/app",
        href: "https://regexlens.com/app",
      },
    });
  });

  it("builds URL with all state params", () => {
    const state = makeState({
      pattern: "^test$",
      flags: "gi",
      text: "test",
      comparisonPattern: "old",
      comparisonFlags: "m",
      explanationMode: "technical",
      selectedTemplate: "email-basic",
    });

    const url = new URL(buildShareUrl(state));
    expect(url.origin).toBe("https://regexlens.com");
    expect(url.pathname).toBe("/app");
    expect(url.searchParams.get("p")).toBeTruthy();
    expect(url.searchParams.get("f")).toBe("gi");
    expect(url.searchParams.get("t")).toBeTruthy();
    expect(url.searchParams.get("cp")).toBeTruthy();
    expect(url.searchParams.get("cf")).toBe("m");
    expect(url.searchParams.get("m")).toBe("technical");
    expect(url.searchParams.get("tpl")).toBe("email-basic");
  });

  it("omits default/empty values from URL", () => {
    const url = new URL(buildShareUrl(DEFAULT_STATE));
    expect(url.searchParams.get("p")).toBeNull();
    expect(url.searchParams.get("t")).toBeNull();
    expect(url.searchParams.get("cp")).toBeNull();
    expect(url.searchParams.get("m")).toBeNull();
    expect(url.searchParams.get("tpl")).toBeNull();
  });

  it("produces URL-safe base64 (no encoding needed in query string)", () => {
    const state = makeState({
      pattern: "^(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}$",
      text: "2001:db8::1",
    });
    const url = buildShareUrl(state);
    // URL-safe base64 chars (-_) should not be percent-encoded
    const pValue = new URL(url).searchParams.get("p")!;
    expect(pValue).not.toContain("%");
  });
});
