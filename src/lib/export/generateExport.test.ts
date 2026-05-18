import { describe, expect, it } from "vitest";
import { generateExport } from "./generateExport";
import type { ExportContentInput } from "./generateExport";

const fixture: ExportContentInput = {
  title: "Email check",
  pattern: "^[\\w.+-]+@[\\w.-]+\\.[a-zA-Z]{2,}$",
  flags: "gi",
  steps: [
    { label: "Start of string", depth: 0 },
    { label: "Local part", depth: 0, detail: "word chars and symbols" },
    { label: "@ symbol", depth: 1, detail: "separator" },
  ],
  warnings: [
    {
      severity: "info",
      title: "Unescaped dot",
      message: "The dot matches any character",
      hint: "Use \\. for a literal dot",
    },
  ],
};

describe("generateExport", () => {
  it("generates markdown with headings and pattern block", () => {
    const content = generateExport("markdown", fixture);
    expect(content).toContain("# Email check");
    expect(content).toContain("```regex");
    expect(content).toContain("## Warnings");
    expect(content).toContain("Unescaped dot");
    expect(content).toContain("RegexLens");
  });

  it("generates plain text with pattern line", () => {
    const content = generateExport("plain", fixture);
    expect(content).toContain("Email check");
    expect(content).toContain("Pattern:");
    expect(content).toContain("Explanation:");
    expect(content).toContain("[INFO] Unescaped dot");
  });

  it("generates PR comment with collapsible details and table", () => {
    const content = generateExport("pr_comment", fixture);
    expect(content).toContain("<details>");
    expect(content).toContain("| Step | Description |");
    expect(content).toContain("Local part");
    expect(content).toContain("</details>");
  });

  it("generates notion-friendly markdown", () => {
    const content = generateExport("notion", fixture);
    expect(content).toContain("# Email check");
    expect(content).toContain("## Explanation");
    expect(content).toContain("ℹ️");
  });

  it.each(["markdown", "plain", "pr_comment", "notion"] as const)(
    "returns non-empty content for %s",
    (format) => {
      const content = generateExport(format, fixture);
      expect(content.trim().length).toBeGreaterThan(0);
    }
  );
});
