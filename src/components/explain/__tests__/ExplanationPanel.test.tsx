// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ExplanationPanel } from "../ExplanationPanel";
import { ParseResult, ExplanationResult } from "@/types";
import { TooltipProvider } from "@/components/ui/tooltip";

function renderWithProviders(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

const mockClearAll = vi.fn();

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
    setHoveredStepId: vi.fn(),
    setHoveredMatchIndex: vi.fn(),
    setSelectedMatchIndex: vi.fn(),
    toggleLockedStep: vi.fn(),
    clearAll: mockClearAll,
  }),
}));

vi.mock("@/hooks/useAIChat", () => ({
  useAIChat: () => ({
    messages: [],
    isStreaming: false,
    sendMessage: vi.fn(),
    clearHistory: vi.fn(),
    stopStreaming: vi.fn(),
    error: null,
  }),
}));

vi.mock("@/hooks/useUser", () => ({
  useUser: () => ({
    isAuthenticated: false,
    user: null,
    isLoading: false,
  }),
}));

beforeEach(() => {
  cleanup();
  mockClearAll.mockReset();
});

const validParseResult: ParseResult = {
  ok: true,
  ast: null as never,
  normalizedPattern: "\\d+$",
  normalized: null as never,
};

const emptyParseResult: ParseResult = {
  ok: false,
  errorMessage: "",
};

const errorParseResult: ParseResult = {
  ok: false,
  errorMessage: "Unterminated group",
};

const explanation: ExplanationResult = {
  steps: [
    { id: "step-1", label: "One or more digits", kind: "quantifier", depth: 0 },
    { id: "step-2", label: "End of input", kind: "anchor", depth: 0 },
  ],
};

const emptyExplanation: ExplanationResult = { steps: [] };

describe("ExplanationPanel", () => {
  it("renders no-pattern empty state when parse has no error", () => {
    renderWithProviders(
      <ExplanationPanel
        explanation={emptyExplanation}
        parseResult={emptyParseResult}
      />
    );
    expect(screen.getByText("Paste a regex to understand what it does")).toBeInTheDocument();
  });

  it("renders error empty state with error message", () => {
    renderWithProviders(
      <ExplanationPanel
        explanation={emptyExplanation}
        parseResult={errorParseResult}
      />
    );
    expect(screen.getByText("Fix the pattern to see its explanation")).toBeInTheDocument();
    expect(screen.getByText("Unterminated group")).toBeInTheDocument();
  });

  it("renders error hint for common parse errors", () => {
    renderWithProviders(
      <ExplanationPanel
        explanation={emptyExplanation}
        parseResult={errorParseResult}
      />
    );
    expect(screen.getByText("Tip: Check for missing closing parentheses.")).toBeInTheDocument();
  });

  it("renders empty pattern state when parse is ok but no steps", () => {
    renderWithProviders(
      <ExplanationPanel
        explanation={emptyExplanation}
        parseResult={validParseResult}
      />
    );
    expect(screen.getByText("No pattern yet")).toBeInTheDocument();
  });

  it("renders explanation steps when pattern is valid", () => {
    renderWithProviders(
      <ExplanationPanel
        explanation={explanation}
        parseResult={validParseResult}
        pattern="\\d+$"
        flags="g"
      />
    );
    expect(screen.getByText("One or more digits")).toBeInTheDocument();
    expect(screen.getByText("End of input")).toBeInTheDocument();
  });

  it("renders mode toggle when onExplanationModeChange is provided", () => {
    renderWithProviders(
      <ExplanationPanel
        explanation={explanation}
        parseResult={validParseResult}
        pattern="\\d+"
        onExplanationModeChange={vi.fn()}
      />
    );
    expect(screen.getByText("Simple")).toBeInTheDocument();
    expect(screen.getByText("Technical")).toBeInTheDocument();
  });

  it("calls onExplanationModeChange when mode button is clicked", () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ExplanationPanel
        explanation={explanation}
        parseResult={validParseResult}
        pattern="\\d+"
        explanationMode="simple"
        onExplanationModeChange={onChange}
      />
    );
    fireEvent.click(screen.getByText("Technical"));
    expect(onChange).toHaveBeenCalledWith("technical");
  });

  it("renders 'What this pattern does' header", () => {
    renderWithProviders(
      <ExplanationPanel
        explanation={explanation}
        parseResult={validParseResult}
        pattern="\\d+"
      />
    );
    expect(screen.getByText("What this pattern does")).toBeInTheDocument();
  });
});
