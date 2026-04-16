import { describe, it, expect } from "vitest";
import { synthesizeBehaviorSummary } from "../behaviorSummary";
import type {
  RegexDiff,
  FlagChange,
  StructuralChange,
  WarningChange,
  BehaviorSummary,
} from "@/types/diff";
import type { Warning } from "@/types/warnings";

function baseDiff(overrides?: Partial<RegexDiff>): RegexDiff {
  return {
    syntax: { ops: [], hasChanges: false },
    flags: { changes: [], hasChanges: false },
    structural: null,
    explanation: null,
    warnings: null,
    behaviorSummary: { summaries: [], hasSummaries: false },
    ...overrides,
  };
}

function flagChange(
  flag: string,
  changeType: "added" | "removed",
): FlagChange {
  return { flag, label: flag, description: "", changeType };
}

function structuralChange(
  overrides: Partial<StructuralChange>,
): StructuralChange {
  return {
    kind: "added",
    nodeType: "literal",
    path: "/",
    description: "",
    ...overrides,
  };
}

function makeWarning(id: string, severity: "info" | "warn" | "danger"): Warning {
  return {
    id,
    severity,
    category: "correctness",
    title: id,
    message: id,
    score: 50,
  };
}

describe("synthesizeBehaviorSummary", () => {
  it("returns no summaries for empty diff", () => {
    const result = synthesizeBehaviorSummary(baseDiff());
    expect(result.hasSummaries).toBe(false);
    expect(result.summaries).toEqual([]);
  });

  // ── Flag summaries ─────────────────────────────────────

  it("produces case sensitivity summary when i flag added", () => {
    const diff = baseDiff({
      flags: { changes: [flagChange("i", "added")], hasChanges: true },
    });
    const result = synthesizeBehaviorSummary(diff);
    expect(result.hasSummaries).toBe(true);
    expect(result.summaries[0].message).toContain("Case sensitivity disabled");
    expect(result.summaries[0].importance).toBe("high");
    expect(result.summaries[0].source).toBe("flags");
  });

  it("produces multiline summary when m flag added", () => {
    const diff = baseDiff({
      flags: { changes: [flagChange("m", "added")], hasChanges: true },
    });
    const result = synthesizeBehaviorSummary(diff);
    expect(result.summaries[0].message).toContain("Multiline mode enabled");
    expect(result.summaries[0].importance).toBe("high");
  });

  it("produces dotAll summary when s flag enabled", () => {
    const diff = baseDiff({
      flags: { changes: [flagChange("s", "added")], hasChanges: true },
    });
    const result = synthesizeBehaviorSummary(diff);
    expect(result.summaries[0].message).toContain("DotAll mode enabled");
    expect(result.summaries[0].importance).toBe("medium");
  });

  it("produces removed flag summary", () => {
    const diff = baseDiff({
      flags: { changes: [flagChange("i", "removed")], hasChanges: true },
    });
    const result = synthesizeBehaviorSummary(diff);
    expect(result.summaries[0].message).toContain("Case sensitivity enabled");
  });

  // ── Structural summaries ───────────────────────────────

  it("produces position summary for anchor addition", () => {
    const diff = baseDiff({
      structural: {
        changes: [structuralChange({ kind: "added", nodeType: "anchor" })],
        hasChanges: true,
        summary: "1 added",
      },
    });
    const result = synthesizeBehaviorSummary(diff);
    expect(result.hasSummaries).toBe(true);
    const anchor = result.summaries.find((s) =>
      s.message.includes("Anchor added"),
    );
    expect(anchor).toBeDefined();
    expect(anchor!.importance).toBe("high");
    expect(anchor!.source).toBe("structural");
  });

  it("produces repetition bounds summary for quantifier restriction", () => {
    const diff = baseDiff({
      structural: {
        changes: [
          structuralChange({
            kind: "modified",
            nodeType: "quantifier",
            propChanges: [
              { prop: "range", oldValue: "1..Infinity", newValue: "2..2", description: "" },
            ],
          }),
        ],
        hasChanges: true,
        summary: "1 modified",
      },
    });
    const result = synthesizeBehaviorSummary(diff);
    const quant = result.summaries.find((s) =>
      s.message.includes("Repetition bounds"),
    );
    expect(quant).toBeDefined();
    expect(quant!.importance).toBe("medium");
  });

  it("produces broader matching summary for literal-to-wildcard change", () => {
    const diff = baseDiff({
      structural: {
        changes: [
          structuralChange({ kind: "removed", nodeType: "literal" }),
          structuralChange({ kind: "added", nodeType: "dot" }),
        ],
        hasChanges: true,
        summary: "1 removed, 1 added",
      },
    });
    const result = synthesizeBehaviorSummary(diff);
    const wildcard = result.summaries.find(
      (s) =>
        s.message.includes("wildcard") || s.message.includes("Wildcard"),
    );
    expect(wildcard).toBeDefined();
    expect(wildcard!.importance).toBe("high");
  });

  it("produces character class modified summary for class expansion", () => {
    const diff = baseDiff({
      structural: {
        changes: [
          structuralChange({ kind: "modified", nodeType: "charClass" }),
        ],
        hasChanges: true,
        summary: "1 modified",
      },
    });
    const result = synthesizeBehaviorSummary(diff);
    const cc = result.summaries.find((s) =>
      s.message.includes("Character class modified"),
    );
    expect(cc).toBeDefined();
    expect(cc!.importance).toBe("medium");
  });

  // ── Warning summaries ──────────────────────────────────

  it("produces risk summary when danger warning added", () => {
    const diff = baseDiff({
      warnings: {
        changes: [
          {
            kind: "added",
            warningId: "nested-quantifiers",
            newWarning: makeWarning("nested-quantifiers", "danger"),
          },
        ],
        hasChanges: true,
      },
    });
    const result = synthesizeBehaviorSummary(diff);
    const risk = result.summaries.find((s) =>
      s.message.includes("New risk"),
    );
    expect(risk).toBeDefined();
    expect(risk!.importance).toBe("high");
    expect(risk!.source).toBe("warnings");
  });

  it("produces resolved summary when danger warning removed", () => {
    const diff = baseDiff({
      warnings: {
        changes: [
          {
            kind: "removed",
            warningId: "nested-quantifiers",
            oldWarning: makeWarning("nested-quantifiers", "danger"),
          },
        ],
        hasChanges: true,
      },
    });
    const result = synthesizeBehaviorSummary(diff);
    const resolved = result.summaries.find((s) =>
      s.message.includes("Risk resolved"),
    );
    expect(resolved).toBeDefined();
    expect(resolved!.importance).toBe("high");
  });

  it("produces severity escalation summary", () => {
    const diff = baseDiff({
      warnings: {
        changes: [
          {
            kind: "severity_changed",
            warningId: "x",
            oldWarning: makeWarning("x", "warn"),
            newWarning: makeWarning("x", "danger"),
            oldSeverity: "warn",
            newSeverity: "danger",
          },
        ],
        hasChanges: true,
      },
    });
    const result = synthesizeBehaviorSummary(diff);
    const escalated = result.summaries.find((s) =>
      s.message.includes("Severity increased"),
    );
    expect(escalated).toBeDefined();
    expect(escalated!.importance).toBe("high");
  });

  // ── Ranking and capping ────────────────────────────────

  it("caps summaries at 6", () => {
    const changes: WarningChange[] = Array.from({ length: 10 }, (_, i) => ({
      kind: "added" as const,
      warningId: `w-${i}`,
      newWarning: makeWarning(`w-${i}`, "danger"),
    }));
    const diff = baseDiff({
      flags: {
        changes: [flagChange("i", "added"), flagChange("m", "added")],
        hasChanges: true,
      },
      warnings: { changes, hasChanges: true },
    });
    const result = synthesizeBehaviorSummary(diff);
    expect(result.summaries.length).toBeLessThanOrEqual(6);
  });

  it("ranks high importance before medium and low", () => {
    const diff = baseDiff({
      flags: {
        changes: [
          flagChange("u", "added"), // low
          flagChange("i", "added"), // high
          flagChange("s", "added"), // medium
        ],
        hasChanges: true,
      },
    });
    const result = synthesizeBehaviorSummary(diff);
    const importances = result.summaries.map(
      (s: BehaviorSummary) => s.importance,
    );
    expect(importances[0]).toBe("high");
    expect(importances[importances.length - 1]).toBe("low");
  });
});
