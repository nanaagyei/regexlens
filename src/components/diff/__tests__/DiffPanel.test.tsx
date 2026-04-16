// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiffPanel } from "../DiffPanel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { parseRegex } from "@/lib/regex/parse";
import { generateExplanation } from "@/lib/explain/explain";

function renderWithProviders(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

beforeEach(() => {
  cleanup();
});

function makeParseAndExplain(pattern: string, flags: string) {
  const parseResult = parseRegex(pattern, flags);
  const explanation = generateExplanation(parseResult);
  return { parseResult, explanation };
}

const { parseResult: defaultParseResult, explanation: defaultExplanation } =
  makeParseAndExplain("[a-z]+", "gi");

const defaults = {
  pattern: "[a-z]+",
  flags: "gi",
  comparisonPattern: "",
  comparisonFlags: "",
  onComparisonPatternChange: vi.fn(),
  onComparisonFlagsChange: vi.fn(),
  parseResult: defaultParseResult,
  explanation: defaultExplanation,
  warnings: { warnings: [], riskScore: 0 },
};

describe("DiffPanel", () => {
  it("renders empty state when no comparison pattern is entered", () => {
    renderWithProviders(<DiffPanel {...defaults} />);
    expect(screen.getByText("Enter a pattern to compare")).toBeInTheDocument();
  });

  it("renders syntax diff for two different valid patterns", () => {
    renderWithProviders(
      <DiffPanel
        {...defaults}
        comparisonPattern="[A-Z]*"
        comparisonFlags="g"
      />,
    );
    expect(screen.getByLabelText("Syntax diff")).toBeInTheDocument();
  });

  it("renders flag diff when flags differ", () => {
    renderWithProviders(
      <DiffPanel
        {...defaults}
        comparisonPattern="[a-z]+"
        comparisonFlags="g"
      />,
    );
    // Flag badge content may be duplicated by tooltip portal
    const addedBadges = screen.getAllByText(/\+i/);
    expect(addedBadges.length).toBeGreaterThanOrEqual(1);
    const labels = screen.getAllByText("Case Insensitive");
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it("renders when comparison pattern is invalid regex", () => {
    renderWithProviders(
      <DiffPanel
        {...defaults}
        comparisonPattern="[unclosed"
        comparisonFlags="g"
      />,
    );
    // Diff operates on raw strings — renders even for invalid regex
    expect(screen.getByLabelText("Syntax diff")).toBeInTheDocument();
  });

  it("renders when current pattern is invalid regex", () => {
    const { parseResult, explanation } = makeParseAndExplain("(unclosed", "gi");
    renderWithProviders(
      <DiffPanel
        {...defaults}
        pattern="(unclosed"
        comparisonPattern="[a-z]+"
        comparisonFlags="g"
        parseResult={parseResult}
        explanation={explanation}
      />,
    );
    expect(screen.getByLabelText("Syntax diff")).toBeInTheDocument();
  });

  it("shows no changes messages when patterns and flags are identical", () => {
    renderWithProviders(
      <DiffPanel
        {...defaults}
        comparisonPattern="[a-z]+"
        comparisonFlags="gi"
      />,
    );
    expect(screen.getByText("No pattern changes")).toBeInTheDocument();
    expect(screen.getByText("No flag changes")).toBeInTheDocument();
  });

  it("calls onComparisonPatternChange when input changes", () => {
    const onChange = vi.fn();
    renderWithProviders(
      <DiffPanel {...defaults} onComparisonPatternChange={onChange} />,
    );
    fireEvent.change(screen.getByPlaceholderText("Enter old pattern..."), {
      target: { value: "abc" },
    });
    expect(onChange).toHaveBeenCalledWith("abc");
  });

  it("has accessible label for comparison input", () => {
    renderWithProviders(<DiffPanel {...defaults} />);
    expect(screen.getByLabelText("Compare against")).toBeInTheDocument();
  });

  it("renders behavior summary panel when comparison produces changes", () => {
    renderWithProviders(
      <DiffPanel
        {...defaults}
        comparisonPattern="abc"
        comparisonFlags=""
      />,
    );
    // The BehaviorSummaryPanel should render (either with summaries or empty state)
    expect(
      screen.getByText(/Review Summary|No behavioral changes detected/),
    ).toBeInTheDocument();
  });

  it("renders behavior summary with flag changes", () => {
    renderWithProviders(
      <DiffPanel
        {...defaults}
        comparisonPattern="[a-z]+"
        comparisonFlags=""
      />,
    );
    // Flags g and i are added (current has "gi", comparison has "")
    expect(screen.getByText("Review Summary")).toBeInTheDocument();
  });
});
