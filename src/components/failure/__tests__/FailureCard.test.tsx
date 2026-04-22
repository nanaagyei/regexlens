// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { FailureCard } from "../FailureCard";
import { HoverState } from "@/lib/stores/hoverStore";
import type { FailureDiagnosis } from "@/types";

const defaultHoverState: HoverState = {
  hoveredRange: null,
  hoveredStepId: null,
  hoveredMatchIndex: null,
  selectedMatchIndex: null,
  lockedStepId: null,
  lockedWarningId: null,
  lockedFailureId: null,
};

let currentHoverState = { ...defaultHoverState };

const mockSetHoveredRange = vi.fn();
const mockToggleLockedFailure = vi.fn();

vi.mock("@/hooks/useHoverSync", () => ({
  useHoverSync: () => ({
    hoverState: currentHoverState,
    setHoveredRange: mockSetHoveredRange,
    toggleLockedFailure: mockToggleLockedFailure,
  }),
}));

beforeEach(() => {
  cleanup();
  currentHoverState = { ...defaultHoverState };
  mockSetHoveredRange.mockReset();
  mockToggleLockedFailure.mockReset();
});

const failureWithRange: FailureDiagnosis = {
  didMatch: false,
  failureIndex: 3,
  expected: "the character 'd'",
  actual: "end of input",
  reason: "Expected the character 'd' but reached end of input",
  detail: "The pattern expected the character 'd' at position 3, but the input text has ended.",
  relatedRange: { start: 3, end: 4 },
  confidence: "high",
};

const failureNoRange: FailureDiagnosis = {
  didMatch: false,
  failureIndex: 0,
  expected: "a digit (\\d)",
  actual: "the letter 'x'",
  reason: "Expected a digit but found a letter",
  detail: "At position 0, the pattern expected a digit but the input contains the letter 'x'.",
  confidence: "medium",
};

const lowConfidence: FailureDiagnosis = {
  didMatch: false,
  failureIndex: 0,
  expected: "a match for foo|bar|baz|qux",
  actual: "the letter 'x'",
  reason: "Could not match alternation",
  detail: "The pattern construct could not be fully analyzed.",
  relatedRange: { start: 0, end: 15 },
  confidence: "low",
};

describe("FailureCard", () => {
  // -- Rendering --
  it("renders reason, expected, actual, and detail", () => {
    render(<FailureCard failure={failureWithRange} />);
    expect(screen.getByText(failureWithRange.reason)).toBeInTheDocument();
    expect(screen.getByText(failureWithRange.expected)).toBeInTheDocument();
    expect(screen.getByText(failureWithRange.actual)).toBeInTheDocument();
    expect(screen.getByText(failureWithRange.detail)).toBeInTheDocument();
  });

  it("renders high confidence badge as emerald", () => {
    render(<FailureCard failure={failureWithRange} />);
    const badge = screen.getByText("High confidence");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("text-emerald-400");
  });

  it("renders medium confidence badge as amber", () => {
    render(<FailureCard failure={failureNoRange} />);
    const badge = screen.getByText("Medium confidence");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("text-amber-400");
  });

  it("renders low confidence badge as red", () => {
    render(<FailureCard failure={lowConfidence} />);
    const badge = screen.getByText("Low confidence");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("text-red-400");
  });

  it("shows position in input", () => {
    render(<FailureCard failure={failureWithRange} />);
    expect(screen.getByText("Position 3 in input")).toBeInTheDocument();
  });

  // -- Hover --
  it("calls setHoveredRange on mouse enter when failure has relatedRange", () => {
    render(<FailureCard failure={failureWithRange} />);
    fireEvent.mouseEnter(screen.getByRole("button"));
    expect(mockSetHoveredRange).toHaveBeenCalledWith({ start: 3, end: 4 });
  });

  it("clears hovered range on mouse leave when not locked", () => {
    render(<FailureCard failure={failureWithRange} />);
    fireEvent.mouseLeave(screen.getByRole("button"));
    expect(mockSetHoveredRange).toHaveBeenCalledWith(null);
  });

  it("does not clear hovered range on mouse leave when locked", () => {
    currentHoverState = { ...defaultHoverState, lockedFailureId: "failure-diagnosis" };
    render(<FailureCard failure={failureWithRange} />);
    fireEvent.mouseLeave(screen.getByRole("button"));
    expect(mockSetHoveredRange).not.toHaveBeenCalledWith(null);
  });

  // -- Click --
  it("calls toggleLockedFailure on click", () => {
    render(<FailureCard failure={failureWithRange} />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockToggleLockedFailure).toHaveBeenCalledWith("failure-diagnosis");
  });

  it("does not call toggleLockedFailure for failure without relatedRange", () => {
    render(<FailureCard failure={failureNoRange} />);
    const card = screen.getByText(failureNoRange.reason).closest("div[class]")!;
    fireEvent.click(card);
    expect(mockToggleLockedFailure).not.toHaveBeenCalled();
  });

  // -- Keyboard --
  it("toggles lock on Enter key", () => {
    render(<FailureCard failure={failureWithRange} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(mockToggleLockedFailure).toHaveBeenCalledWith("failure-diagnosis");
  });

  it("toggles lock on Space key", () => {
    render(<FailureCard failure={failureWithRange} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: " " });
    expect(mockToggleLockedFailure).toHaveBeenCalledWith("failure-diagnosis");
  });

  // -- Locked state --
  it("shows pin icon when locked", () => {
    currentHoverState = { ...defaultHoverState, lockedFailureId: "failure-diagnosis" };
    render(<FailureCard failure={failureWithRange} />);
    const pin = document.querySelector("[aria-hidden='true']");
    expect(pin).toBeInTheDocument();
  });

  // -- Accessibility --
  it("has role=button and tabIndex=0 when failure has relatedRange", () => {
    render(<FailureCard failure={failureWithRange} />);
    const el = screen.getByRole("button");
    expect(el).toHaveAttribute("tabindex", "0");
  });

  it("has aria-pressed when failure has relatedRange", () => {
    render(<FailureCard failure={failureWithRange} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("sets aria-pressed=true when locked", () => {
    currentHoverState = { ...defaultHoverState, lockedFailureId: "failure-diagnosis" };
    render(<FailureCard failure={failureWithRange} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("has aria-label with failure reason", () => {
    render(<FailureCard failure={failureWithRange} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", failureWithRange.reason);
  });

  it("does not have role=button for failure without relatedRange", () => {
    render(<FailureCard failure={failureNoRange} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
