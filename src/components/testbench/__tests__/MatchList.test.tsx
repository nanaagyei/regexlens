// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MatchList } from "../MatchList";
import { MatchResult } from "@/types";
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

const emptyResult: MatchResult = {
  matches: [],
  spans: [],
  truncated: false,
  sampleTruncated: false,
  matchLimitReached: false,
  totalCount: 0,
};

const errorResult: MatchResult = {
  ...emptyResult,
  error: "Matching timed out",
};

const singleMatch: MatchResult = {
  matches: [
    {
      index: 0,
      full: { groupIndex: 0, start: 0, end: 3, text: "abc" },
      groups: [],
    },
  ],
  spans: [{ start: 0, end: 3, matchIndex: 0 }],
  truncated: false,
  totalCount: 1,
};

const matchWithGroups: MatchResult = {
  matches: [
    {
      index: 0,
      full: { groupIndex: 0, start: 0, end: 7, text: "123-abc" },
      groups: [
        { groupIndex: 1, start: 0, end: 3, text: "123" },
        { groupIndex: 2, start: 4, end: 7, text: "abc" },
      ],
    },
  ],
  spans: [{ start: 0, end: 7, matchIndex: 0 }],
  truncated: false,
  totalCount: 1,
};

const matchWithNamedGroups: MatchResult = {
  matches: [
    {
      index: 0,
      full: { groupIndex: 0, start: 0, end: 7, text: "2024-01" },
      groups: [
        { groupIndex: 1, start: 0, end: 4, text: "2024" },
        { groupIndex: 2, start: 5, end: 7, text: "01" },
      ],
      namedGroups: {
        year: { groupIndex: -1, name: "year", start: 0, end: 4, text: "2024" },
        month: { groupIndex: -1, name: "month", start: 5, end: 7, text: "01" },
      },
    },
  ],
  spans: [{ start: 0, end: 7, matchIndex: 0 }],
  truncated: false,
  totalCount: 1,
};

const truncatedResult: MatchResult = {
  matches: [
    {
      index: 0,
      full: { groupIndex: 0, start: 0, end: 1, text: "a" },
      groups: [],
    },
  ],
  spans: [{ start: 0, end: 1, matchIndex: 0 }],
  truncated: true,
  totalCount: 1500,
};

describe("MatchList", () => {
  describe("empty and error states", () => {
    it("shows empty state message when no matches", () => {
      render(<MatchList matches={emptyResult} />);
      expect(screen.getByText("No matches to display")).toBeInTheDocument();
    });

    it("shows error message", () => {
      render(<MatchList matches={errorResult} />);
      expect(screen.getByText("Matching timed out")).toBeInTheDocument();
    });
  });

  describe("match rendering", () => {
    it("renders a match item with badge and position", () => {
      render(<MatchList matches={singleMatch} />);
      expect(screen.getByText("Match 1")).toBeInTheDocument();
      expect(screen.getByText(/pos 0–3/)).toBeInTheDocument();
    });

    it("renders numbered groups", () => {
      render(<MatchList matches={matchWithGroups} />);
      expect(screen.getByText(/Group 1/)).toBeInTheDocument();
      expect(screen.getByText(/Group 2/)).toBeInTheDocument();
    });

    it("renders named groups section", () => {
      render(<MatchList matches={matchWithNamedGroups} />);
      expect(screen.getByText("Named groups:")).toBeInTheDocument();
      expect(screen.getByText("year:")).toBeInTheDocument();
      expect(screen.getByText("month:")).toBeInTheDocument();
    });

    it("shows truncation notice", () => {
      render(<MatchList matches={truncatedResult} />);
      expect(
        screen.getByText(/Showing first 1 of 1,?500 matches/)
      ).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onMatchClick with correct args", () => {
      const onClick = vi.fn();
      render(<MatchList matches={singleMatch} onMatchClick={onClick} />);
      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledWith(0, 0, 3);
    });

    it("fires setSelectedMatchIndex on click", () => {
      const onClick = vi.fn();
      render(<MatchList matches={singleMatch} onMatchClick={onClick} />);
      fireEvent.click(screen.getByRole("button"));
      expect(mockSetSelectedMatchIndex).toHaveBeenCalledWith(0);
    });

    it("toggles selection off when clicking already-selected match", () => {
      currentHoverState = { ...defaultHoverState, selectedMatchIndex: 0 };
      const onClick = vi.fn();
      render(<MatchList matches={singleMatch} onMatchClick={onClick} />);
      fireEvent.click(screen.getByRole("button"));
      expect(mockSetSelectedMatchIndex).toHaveBeenCalledWith(null);
    });

    it("fires setHoveredMatchIndex on mouse enter/leave", () => {
      render(<MatchList matches={singleMatch} />);
      const item = screen.getByRole("button");
      fireEvent.mouseEnter(item);
      expect(mockSetHoveredMatchIndex).toHaveBeenCalledWith(0);
      fireEvent.mouseLeave(item);
      expect(mockSetHoveredMatchIndex).toHaveBeenCalledWith(null);
    });

    it("supports keyboard activation with Enter", () => {
      const onClick = vi.fn();
      render(<MatchList matches={singleMatch} onMatchClick={onClick} />);
      const button = screen.getByRole("button");
      fireEvent.keyDown(button, { key: "Enter" });
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe("styling", () => {
    it("applies selected styling when match is selected", () => {
      currentHoverState = { ...defaultHoverState, selectedMatchIndex: 0 };
      render(<MatchList matches={singleMatch} />);
      const item = screen.getByRole("button");
      expect(item.className).toContain("ring-2");
      expect(item.className).toContain("border-primary");
    });

    it("applies hover styling when match is hovered", () => {
      currentHoverState = { ...defaultHoverState, hoveredMatchIndex: 0 };
      render(<MatchList matches={singleMatch} />);
      const item = screen.getByRole("button");
      expect(item.className).toContain("bg-accent");
    });

    it("applies default styling when neither hovered nor selected", () => {
      render(<MatchList matches={singleMatch} />);
      const item = screen.getByRole("button");
      expect(item.className).toContain("bg-card");
      expect(item.className).not.toContain("ring-2");
    });
  });
});
