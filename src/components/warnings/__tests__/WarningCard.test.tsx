// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { WarningCard } from "../WarningCard";
import { HoverState } from "@/lib/stores/hoverStore";
import type { Warning } from "@/types";

const defaultHoverState: HoverState = {
  hoveredRange: null,
  hoveredStepId: null,
  hoveredMatchIndex: null,
  selectedMatchIndex: null,
  lockedStepId: null,
  lockedWarningId: null,
};

let currentHoverState = { ...defaultHoverState };

const mockSetHoveredRange = vi.fn();
const mockToggleLockedWarning = vi.fn();

vi.mock("@/hooks/useHoverSync", () => ({
  useHoverSync: () => ({
    hoverState: currentHoverState,
    setHoveredRange: mockSetHoveredRange,
    toggleLockedWarning: mockToggleLockedWarning,
  }),
}));

beforeEach(() => {
  cleanup();
  currentHoverState = { ...defaultHoverState };
  mockSetHoveredRange.mockReset();
  mockToggleLockedWarning.mockReset();
});

const dangerWarning: Warning = {
  id: "nested-quantifiers",
  severity: "danger",
  category: "performance",
  title: "Nested quantifiers detected",
  message: "This pattern has a quantifier inside another quantifier.",
  hint: "Rewrite to remove nesting.",
  range: { start: 0, end: 5 },
  score: 90,
};

const infoWarning: Warning = {
  id: "multiline-anchors",
  severity: "info",
  category: "readability",
  title: "Multiline mode affects anchors",
  message: "With the m flag, ^ and $ match start/end of each line.",
  score: 20,
};

const noRangeWarning: Warning = {
  id: "excessive-matches",
  severity: "warn",
  category: "performance",
  title: "Many matches",
  message: "Found 500 matches.",
  score: 40,
};

describe("WarningCard", () => {
  // -- Rendering --
  it("renders title, message, and hint", () => {
    render(<WarningCard warning={dangerWarning} />);
    expect(screen.getByText("Nested quantifiers detected")).toBeInTheDocument();
    expect(screen.getByText(dangerWarning.message)).toBeInTheDocument();
    expect(screen.getByText("Rewrite to remove nesting.")).toBeInTheDocument();
  });

  it("renders category badge", () => {
    render(<WarningCard warning={dangerWarning} />);
    expect(screen.getByText("Performance")).toBeInTheDocument();
  });

  it("renders readability badge for info warning", () => {
    render(<WarningCard warning={infoWarning} />);
    expect(screen.getByText("Readability")).toBeInTheDocument();
  });

  it("does not render hint when absent", () => {
    render(<WarningCard warning={infoWarning} />);
    // infoWarning has no hint
    const italics = document.querySelectorAll("p.italic");
    expect(italics.length).toBe(0);
  });

  // -- Hover --
  it("calls setHoveredRange on mouse enter when warning has range", () => {
    render(<WarningCard warning={dangerWarning} />);
    fireEvent.mouseEnter(screen.getByRole("button"));
    expect(mockSetHoveredRange).toHaveBeenCalledWith({ start: 0, end: 5 });
  });

  it("clears hovered range on mouse leave when not locked", () => {
    render(<WarningCard warning={dangerWarning} />);
    fireEvent.mouseLeave(screen.getByRole("button"));
    expect(mockSetHoveredRange).toHaveBeenCalledWith(null);
  });

  it("does not clear hovered range on mouse leave when locked", () => {
    currentHoverState = { ...defaultHoverState, lockedWarningId: "nested-quantifiers" };
    render(<WarningCard warning={dangerWarning} />);
    fireEvent.mouseLeave(screen.getByRole("button"));
    expect(mockSetHoveredRange).not.toHaveBeenCalledWith(null);
  });

  // -- Click --
  it("calls toggleLockedWarning on click", () => {
    render(<WarningCard warning={dangerWarning} />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockToggleLockedWarning).toHaveBeenCalledWith("nested-quantifiers");
  });

  it("does not call toggleLockedWarning for warning without range", () => {
    render(<WarningCard warning={noRangeWarning} />);
    // No role="button" element for no-range
    const card = screen.getByText("Many matches").closest("div[class]")!;
    fireEvent.click(card);
    expect(mockToggleLockedWarning).not.toHaveBeenCalled();
  });

  // -- Keyboard --
  it("toggles lock on Enter key", () => {
    render(<WarningCard warning={dangerWarning} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(mockToggleLockedWarning).toHaveBeenCalledWith("nested-quantifiers");
  });

  it("toggles lock on Space key", () => {
    render(<WarningCard warning={dangerWarning} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: " " });
    expect(mockToggleLockedWarning).toHaveBeenCalledWith("nested-quantifiers");
  });

  // -- Locked state --
  it("shows pin icon when locked", () => {
    currentHoverState = { ...defaultHoverState, lockedWarningId: "nested-quantifiers" };
    render(<WarningCard warning={dangerWarning} />);
    // Pin icon is rendered with aria-hidden
    const pin = document.querySelector("[aria-hidden='true']");
    expect(pin).toBeInTheDocument();
  });

  // -- Accessibility --
  it("has role=button and tabIndex=0 when warning has range", () => {
    render(<WarningCard warning={dangerWarning} />);
    const el = screen.getByRole("button");
    expect(el).toHaveAttribute("tabindex", "0");
  });

  it("has aria-pressed when warning has range", () => {
    render(<WarningCard warning={dangerWarning} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("sets aria-pressed=true when locked", () => {
    currentHoverState = { ...defaultHoverState, lockedWarningId: "nested-quantifiers" };
    render(<WarningCard warning={dangerWarning} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("has aria-label with warning title", () => {
    render(<WarningCard warning={dangerWarning} />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Nested quantifiers detected"
    );
  });

  it("does not have role=button for warning without range", () => {
    render(<WarningCard warning={noRangeWarning} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  // -- No cursor-pointer for no-range --
  it("does not apply cursor-pointer class for warning without range", () => {
    render(<WarningCard warning={noRangeWarning} />);
    const card = screen.getByText("Many matches").closest("div[class*='rounded-lg']")!;
    expect(card.className).not.toContain("cursor-pointer");
  });
});
