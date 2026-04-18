import { describe, it, expect } from "vitest";
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplateById,
  getTemplatesByTag,
  getTemplatesByCategory,
  searchTemplates,
} from "./templates";
import type { TemplateCategoryId } from "@/types";

const VALID_CATEGORIES: TemplateCategoryId[] = [
  "validation",
  "extraction",
  "code",
  "advanced",
  "learning",
];

// IDs known to have patterns that use PCRE features unsupported in JS
const UNSUPPORTED_PATTERN_IDS = ["pcre-recursion-unsupported"];

describe("TEMPLATES data integrity", () => {
  it("all templates have required fields", () => {
    for (const t of TEMPLATES) {
      expect(t.id, `template missing id`).toBeTruthy();
      expect(t.name, `${t.id} missing name`).toBeTruthy();
      expect(t.description, `${t.id} missing description`).toBeTruthy();
      expect(typeof t.pattern, `${t.id} pattern not string`).toBe("string");
      expect(typeof t.flags, `${t.id} flags not string`).toBe("string");
      expect(typeof t.text, `${t.id} text not string`).toBe("string");
      expect(t.category, `${t.id} missing category`).toBeTruthy();
    }
  });

  it("all template IDs are unique", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all categories are valid", () => {
    for (const t of TEMPLATES) {
      expect(
        VALID_CATEGORIES,
        `${t.id} has invalid category: ${t.category}`
      ).toContain(t.category);
    }
  });

  it("every category has at least one template", () => {
    for (const cat of VALID_CATEGORIES) {
      const count = TEMPLATES.filter((t) => t.category === cat).length;
      expect(count, `category "${cat}" has no templates`).toBeGreaterThan(0);
    }
  });

  it("template patterns are valid JS regex (except known unsupported)", () => {
    for (const t of TEMPLATES) {
      if (UNSUPPORTED_PATTERN_IDS.includes(t.id)) continue;
      expect(() => new RegExp(t.pattern, t.flags)).not.toThrow();
    }
  });
});

describe("TEMPLATE_CATEGORIES", () => {
  it("covers all valid category IDs", () => {
    const ids = TEMPLATE_CATEGORIES.map((c) => c.id);
    for (const cat of VALID_CATEGORIES) {
      expect(ids).toContain(cat);
    }
  });

  it("has labels for all categories", () => {
    for (const c of TEMPLATE_CATEGORIES) {
      expect(c.label).toBeTruthy();
    }
  });
});

describe("getTemplateById", () => {
  it("returns correct template", () => {
    const t = getTemplateById("email-basic");
    expect(t).toBeDefined();
    expect(t!.name).toBe("Basic email");
  });

  it("returns undefined for unknown ID", () => {
    expect(getTemplateById("nonexistent")).toBeUndefined();
  });
});

describe("getTemplatesByTag", () => {
  it("returns templates matching tag", () => {
    const results = getTemplatesByTag("validation");
    expect(results.length).toBeGreaterThan(0);
    for (const t of results) {
      expect(t.tags).toContain("validation");
    }
  });

  it("returns empty for unknown tag", () => {
    expect(getTemplatesByTag("nonexistent-tag")).toEqual([]);
  });
});

describe("getTemplatesByCategory", () => {
  it("returns templates matching category", () => {
    const results = getTemplatesByCategory("validation");
    expect(results.length).toBeGreaterThan(0);
    for (const t of results) {
      expect(t.category).toBe("validation");
    }
  });

  it("returns empty for category with no matches", () => {
    // Cast to bypass type check for testing
    expect(getTemplatesByCategory("nonexistent" as TemplateCategoryId)).toEqual([]);
  });
});

describe("searchTemplates", () => {
  it("returns all templates for empty query", () => {
    expect(searchTemplates("")).toEqual(TEMPLATES);
    expect(searchTemplates("  ")).toEqual(TEMPLATES);
  });

  it("finds by name", () => {
    const results = searchTemplates("email");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((t) => t.id === "email-basic")).toBe(true);
  });

  it("finds by description", () => {
    const results = searchTemplates("catastrophic");
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("danger-demo");
  });

  it("finds by tag", () => {
    const results = searchTemplates("lookahead");
    expect(results.some((t) => t.id === "password-policy")).toBe(true);
  });

  it("finds by category", () => {
    const results = searchTemplates("learning");
    expect(results.length).toBeGreaterThan(0);
    for (const t of results) {
      expect(t.category).toBe("learning");
    }
  });

  it("supports multi-word query (all words must match)", () => {
    const results = searchTemplates("email validation");
    expect(results.length).toBeGreaterThan(0);
    for (const t of results) {
      const hay = [t.name, t.description, ...(t.tags ?? []), t.category]
        .join(" ")
        .toLowerCase();
      expect(hay).toContain("email");
      expect(hay).toContain("validation");
    }
  });

  it("is case-insensitive", () => {
    const a = searchTemplates("EMAIL");
    const b = searchTemplates("email");
    expect(a).toEqual(b);
  });

  it("returns empty for no match", () => {
    expect(searchTemplates("zzzznonexistent")).toEqual([]);
  });
});
