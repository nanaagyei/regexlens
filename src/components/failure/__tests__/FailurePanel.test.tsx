// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FailurePanel } from "../FailurePanel";
import type { FailureDiagnosis, MatchResult } from "@/types";

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
    toggleLockedFailure: vi.fn(),
  }),
}));

const EMPTY_MATCH: MatchResult = {
  matches: [],
  spans: [],
  truncated: false,
  totalCount: 0,
};

const HAS_MATCHES: MatchResult = {
  matches: [{ index: 0, full: { groupIndex: 0, start: 0, end: 3, text: "abc" }, groups: [] }],
  spans: [{ start: 0, end: 3, matchIndex: 0 }],
  truncated: false,
  totalCount: 1,
};

const sampleFailure: FailureDiagnosis = {
  didMatch: false,
  failureIndex: 3,
  expected: "the character 'd'",
  actual: "end of input",
  reason: "Expected the character 'd' but reached end of input",
  detail: "The pattern expected the character 'd' at position 3.",
  relatedRange: { start: 3, end: 4 },
  confidence: "high",
};

describe("FailurePanel", () => {
  it("renders 'Enter test text' when hasText is false", () => {
    render(
      <FailurePanel failureAnalysis={null} matchResult={EMPTY_MATCH} hasText={false} />,
    );
    expect(screen.getByText("Enter test text")).toBeInTheDocument();
  });

  it("renders 'Pattern matches' when match succeeds", () => {
    render(
      <FailurePanel failureAnalysis={null} matchResult={HAS_MATCHES} hasText={true} />,
    );
    expect(screen.getByText("Pattern matches")).toBeInTheDocument();
    expect(screen.getByText("Found 1 match in the test text")).toBeInTheDocument();
  });

  it("renders plural match count", () => {
    const multiMatch: MatchResult = { ...HAS_MATCHES, totalCount: 5 };
    render(
      <FailurePanel failureAnalysis={null} matchResult={multiMatch} hasText={true} />,
    );
    expect(screen.getByText("Found 5 matches in the test text")).toBeInTheDocument();
  });

  it("renders FailureCard when failure detected", () => {
    render(
      <FailurePanel failureAnalysis={sampleFailure} matchResult={EMPTY_MATCH} hasText={true} />,
    );
    expect(screen.getByText(sampleFailure.reason)).toBeInTheDocument();
    expect(screen.getByText("Match failure diagnosis")).toBeInTheDocument();
  });

  it("renders fallback state when no text and no failure", () => {
    render(
      <FailurePanel failureAnalysis={null} matchResult={EMPTY_MATCH} hasText={true} />,
    );
    expect(screen.getByText("No failure data")).toBeInTheDocument();
  });
});
