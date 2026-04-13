// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { WarningsPanel } from "../WarningsPanel";
import type { WarningsResult, ParseResult, Warning } from "@/types";

vi.mock("@/hooks/useHoverSync", () => ({
  useHoverSync: () => ({
    hoverState: {
      hoveredRange: null,
      hoveredStepId: null,
      hoveredMatchIndex: null,
      selectedMatchIndex: null,
      lockedStepId: null,
      lockedWarningId: null,
      lockedFailureId: null,
    },
    setHoveredRange: vi.fn(),
    toggleLockedWarning: vi.fn(),
  }),
}));

beforeEach(() => {
  cleanup();
});

const emptyWarnings: WarningsResult = { warnings: [], riskScore: 0 };

const singleWarning: Warning = {
  id: "unescaped-dot",
  severity: "info",
  category: "correctness",
  title: "Unescaped dot",
  message: "The dot matches any character.",
  hint: "Use \\. for a literal dot.",
  range: { start: 3, end: 4 },
  score: 25,
};

const multipleWarnings: WarningsResult = {
  warnings: [
    {
      id: "nested-quantifiers",
      severity: "danger",
      category: "performance",
      title: "Nested quantifiers",
      message: "Quantifier inside quantifier.",
      score: 95,
      range: { start: 0, end: 5 },
    },
    {
      id: "ambiguous-dot-star",
      severity: "warn",
      category: "performance",
      title: "Greedy dot-star",
      message: "Dot-star before more pattern.",
      score: 55,
      range: { start: 6, end: 8 },
    },
    singleWarning,
  ],
  riskScore: 91,
};

const validParse: ParseResult = {
  ok: true,
  ast: null as never,
  normalizedPattern: "test",
  normalized: null as never,
};

const errorParse: ParseResult = {
  ok: false,
  errorMessage: "Unterminated group",
};

describe("WarningsPanel", () => {
  // -- Empty states --
  it("shows 'No issues detected' when there are no warnings", () => {
    render(<WarningsPanel warnings={emptyWarnings} parseResult={validParse} />);
    expect(screen.getByText("No issues detected")).toBeInTheDocument();
    expect(screen.getByText("This pattern looks good!")).toBeInTheDocument();
  });

  it("shows 'Invalid pattern' for failed parseResult", () => {
    render(<WarningsPanel warnings={emptyWarnings} parseResult={errorParse} />);
    expect(screen.getByText("Invalid pattern")).toBeInTheDocument();
    expect(screen.getByText("Fix the pattern to check for warnings")).toBeInTheDocument();
  });

  // -- Normal rendering --
  it("renders correct number of warning cards", () => {
    render(<WarningsPanel warnings={multipleWarnings} parseResult={validParse} />);
    expect(screen.getByText("Nested quantifiers")).toBeInTheDocument();
    expect(screen.getByText("Greedy dot-star")).toBeInTheDocument();
    expect(screen.getByText("Unescaped dot")).toBeInTheDocument();
  });

  it("shows Potential issues header", () => {
    render(<WarningsPanel warnings={multipleWarnings} parseResult={validParse} />);
    expect(screen.getByText("Potential issues")).toBeInTheDocument();
  });

  // -- Risk indicator --
  it("shows High risk for score >= 80", () => {
    render(<WarningsPanel warnings={multipleWarnings} parseResult={validParse} />);
    expect(screen.getByText("High risk")).toBeInTheDocument();
    expect(screen.getByText("91")).toBeInTheDocument();
  });

  it("shows Medium risk for score 40-79", () => {
    const mediumWarnings: WarningsResult = {
      warnings: [singleWarning],
      riskScore: 50,
    };
    render(<WarningsPanel warnings={mediumWarnings} parseResult={validParse} />);
    expect(screen.getByText("Medium risk")).toBeInTheDocument();
  });

  it("shows Low risk for score < 40", () => {
    const lowWarnings: WarningsResult = {
      warnings: [singleWarning],
      riskScore: 20,
    };
    render(<WarningsPanel warnings={lowWarnings} parseResult={validParse} />);
    expect(screen.getByText("Low risk")).toBeInTheDocument();
  });

  // -- Accessibility --
  it("renders warning list with ARIA list role", () => {
    render(<WarningsPanel warnings={multipleWarnings} parseResult={validParse} />);
    expect(screen.getByRole("list", { name: "Pattern warnings" })).toBeInTheDocument();
  });

  it("renders list items with listitem role", () => {
    render(<WarningsPanel warnings={multipleWarnings} parseResult={validParse} />);
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(3);
  });
});
