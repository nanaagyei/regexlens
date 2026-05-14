// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MatchOverlay, HighlightSegment } from "../MatchOverlay";
import { HoverState } from "@/lib/stores/hoverStore";

const defaultHoverState: HoverState = {
  hoveredRange: null,
  hoveredStepId: null,
  hoveredMatchIndex: null,
  selectedMatchIndex: null,
  lockedStepId: null,
  lockedWarningId: null,
  lockedFailureId: null,
};

const mockSetHoveredMatchIndex = vi.fn();
const mockSetSelectedMatchIndex = vi.fn();

let currentHoverState = { ...defaultHoverState };

vi.mock("@/hooks/useHoverSync", () => ({
  useHoverSelector: <T,>(selector: (s: HoverState) => T) => selector(currentHoverState),
}));

vi.mock("@/lib/stores/hoverStore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stores/hoverStore")>();
  return {
    ...actual,
    setHoveredMatchIndex: (i: number | null) => {
      mockSetHoveredMatchIndex(i);
    },
    setSelectedMatchIndex: (i: number | null) => {
      mockSetSelectedMatchIndex(i);
    },
    getSnapshot: () => currentHoverState,
  };
});

beforeEach(() => {
  cleanup();
  currentHoverState = { ...defaultHoverState };
  mockSetHoveredMatchIndex.mockReset();
  mockSetSelectedMatchIndex.mockReset();
});

const plainSegments: HighlightSegment[] = [
  { text: "hello world", isMatch: false, matchIndex: -1 },
];

const matchSegments: HighlightSegment[] = [
  { text: "abc ", isMatch: false, matchIndex: -1 },
  { text: "123", isMatch: true, matchIndex: 0 },
  { text: " def ", isMatch: false, matchIndex: -1 },
  { text: "456", isMatch: true, matchIndex: 1 },
];

describe("MatchOverlay", () => {
  it("renders plain text for non-match segments", () => {
    render(<MatchOverlay segments={plainSegments} />);
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });

  it("renders all segments including matches", () => {
    const { container } = render(<MatchOverlay segments={matchSegments} />);
    const spans = container.querySelectorAll("span");
    // 4 segments: "abc ", "123", " def ", "456"
    expect(spans).toHaveLength(4);
    expect(spans[0].textContent).toBe("abc ");
    expect(spans[1].textContent).toBe("123");
    expect(spans[2].textContent).toBe(" def ");
    expect(spans[3].textContent).toBe("456");
  });

  it("applies highlight class to match segments", () => {
    render(<MatchOverlay segments={matchSegments} />);
    const matchSpan = screen.getByText("123");
    expect(matchSpan.className).toContain("match-highlight-1");
  });

  it("applies different highlight classes for different match indices", () => {
    render(<MatchOverlay segments={matchSegments} />);
    const first = screen.getByText("123");
    const second = screen.getByText("456");
    expect(first.className).toContain("match-highlight-1");
    expect(second.className).toContain("match-highlight-2");
  });

  it("applies active class when match is hovered", () => {
    currentHoverState = { ...defaultHoverState, hoveredMatchIndex: 0 };
    render(<MatchOverlay segments={matchSegments} />);
    const matchSpan = screen.getByText("123");
    expect(matchSpan.className).toContain("match-highlight-1-active");
  });

  it("does not apply active class to non-hovered matches", () => {
    currentHoverState = { ...defaultHoverState, hoveredMatchIndex: 0 };
    render(<MatchOverlay segments={matchSegments} />);
    const other = screen.getByText("456");
    expect(other.className).not.toContain("-active");
  });

  it("applies selected class when match is selected", () => {
    currentHoverState = { ...defaultHoverState, selectedMatchIndex: 0 };
    render(<MatchOverlay segments={matchSegments} />);
    const matchSpan = screen.getByText("123");
    expect(matchSpan.className).toContain("match-highlight-1-selected");
  });

  it("fires setHoveredMatchIndex on mouse enter", () => {
    render(<MatchOverlay segments={matchSegments} />);
    fireEvent.mouseEnter(screen.getByText("123"));
    expect(mockSetHoveredMatchIndex).toHaveBeenCalledWith(0);
  });

  it("fires setHoveredMatchIndex(null) on mouse leave", () => {
    render(<MatchOverlay segments={matchSegments} />);
    fireEvent.mouseLeave(screen.getByText("123"));
    expect(mockSetHoveredMatchIndex).toHaveBeenCalledWith(null);
  });

  it("fires setSelectedMatchIndex on click", () => {
    render(<MatchOverlay segments={matchSegments} />);
    fireEvent.click(screen.getByText("123"));
    expect(mockSetSelectedMatchIndex).toHaveBeenCalledWith(0);
  });

  it("toggles off selection when clicking already-selected match", () => {
    currentHoverState = { ...defaultHoverState, selectedMatchIndex: 0 };
    render(<MatchOverlay segments={matchSegments} />);
    fireEvent.click(screen.getByText("123"));
    expect(mockSetSelectedMatchIndex).toHaveBeenCalledWith(null);
  });

  it("has aria-hidden on the overlay container", () => {
    const { container } = render(<MatchOverlay segments={matchSegments} />);
    const overlay = container.firstElementChild;
    expect(overlay?.getAttribute("aria-hidden")).toBe("true");
  });

  it("match spans have pointer-events-auto for interactivity", () => {
    render(<MatchOverlay segments={matchSegments} />);
    const matchSpan = screen.getByText("123");
    expect(matchSpan.className).toContain("pointer-events-auto");
  });
});
