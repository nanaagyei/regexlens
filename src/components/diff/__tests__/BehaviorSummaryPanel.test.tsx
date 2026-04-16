// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BehaviorSummaryPanel } from "../BehaviorSummaryPanel";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { BehaviorSummaryResult, WarningDiff } from "@/types";

function renderPanel(
  behaviorSummary: BehaviorSummaryResult,
  warningDiff: WarningDiff | null = null,
) {
  return render(
    <TooltipProvider>
      <BehaviorSummaryPanel
        behaviorSummary={behaviorSummary}
        warningDiff={warningDiff}
      />
    </TooltipProvider>,
  );
}

describe("BehaviorSummaryPanel", () => {
  it("renders empty state when no summaries and no warning changes", () => {
    renderPanel({ summaries: [], hasSummaries: false });
    expect(
      screen.getByText("No behavioral changes detected"),
    ).toBeInTheDocument();
  });

  it("renders summary messages", () => {
    renderPanel({
      summaries: [
        {
          message: "Case sensitivity disabled",
          importance: "high",
          source: "flags",
        },
      ],
      hasSummaries: true,
    });
    expect(
      screen.getByText("Case sensitivity disabled"),
    ).toBeInTheDocument();
    expect(screen.getByText("Review Summary")).toBeInTheDocument();
  });

  it("renders importance indicators", () => {
    renderPanel({
      summaries: [
        {
          message: "High importance item",
          importance: "high",
          source: "flags",
        },
        {
          message: "Low importance item",
          importance: "low",
          source: "structural",
        },
      ],
      hasSummaries: true,
    });
    const highIndicators = screen.getAllByLabelText("high importance");
    expect(highIndicators.length).toBeGreaterThanOrEqual(1);
    const lowIndicators = screen.getAllByLabelText("low importance");
    expect(lowIndicators.length).toBeGreaterThanOrEqual(1);
  });

  it("renders source badges", () => {
    renderPanel({
      summaries: [
        {
          message: "A flag change",
          importance: "high",
          source: "flags",
        },
        {
          message: "A structural change",
          importance: "medium",
          source: "structural",
        },
      ],
      hasSummaries: true,
    });
    const flagBadges = screen.getAllByText("Flags");
    expect(flagBadges.length).toBeGreaterThanOrEqual(1);
    const structBadges = screen.getAllByText("Structure");
    expect(structBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("renders warning additions with correct styling", () => {
    renderPanel(
      { summaries: [], hasSummaries: false },
      {
        changes: [
          {
            kind: "added",
            warningId: "nested-quantifiers",
            newWarning: {
              id: "nested-quantifiers",
              severity: "danger",
              category: "performance",
              title: "Nested quantifiers",
              message: "Risk of catastrophic backtracking",
              score: 90,
            },
          },
        ],
        hasChanges: true,
      },
    );
    expect(screen.getByText("Nested quantifiers")).toBeInTheDocument();
    expect(screen.getByText("Warning changes")).toBeInTheDocument();
  });

  it("renders warning removals", () => {
    renderPanel(
      { summaries: [], hasSummaries: false },
      {
        changes: [
          {
            kind: "removed",
            warningId: "ambiguous-dot-star",
            oldWarning: {
              id: "ambiguous-dot-star",
              severity: "warn",
              category: "performance",
              title: "Ambiguous dot-star",
              message: "Greedy .* may cause backtracking",
              score: 60,
            },
          },
        ],
        hasChanges: true,
      },
    );
    expect(screen.getByText("Ambiguous dot-star")).toBeInTheDocument();
  });

  it("renders severity changes", () => {
    renderPanel(
      { summaries: [], hasSummaries: false },
      {
        changes: [
          {
            kind: "severity_changed",
            warningId: "x",
            oldWarning: {
              id: "x",
              severity: "info",
              category: "correctness",
              title: "Some warning",
              message: "",
              score: 20,
            },
            newWarning: {
              id: "x",
              severity: "danger",
              category: "correctness",
              title: "Some warning",
              message: "",
              score: 90,
            },
            oldSeverity: "info",
            newSeverity: "danger",
          },
        ],
        hasChanges: true,
      },
    );
    expect(screen.getByText(/info → danger/)).toBeInTheDocument();
  });

  it("has accessible list structure", () => {
    renderPanel({
      summaries: [
        {
          message: "A change",
          importance: "high",
          source: "flags",
        },
      ],
      hasSummaries: true,
    });
    const lists = screen.getAllByRole("list", { name: "Behavior summaries" });
    expect(lists.length).toBeGreaterThanOrEqual(1);
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBeGreaterThanOrEqual(1);
  });
});
