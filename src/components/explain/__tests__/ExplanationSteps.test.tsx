// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ExplanationSteps } from "../ExplanationSteps";
import { HoverState } from "@/lib/stores/hoverStore";
import { ExplanationStep } from "@/types";

const defaultHoverState: HoverState = {
  hoveredRange: null,
  hoveredStepId: null,
  hoveredMatchIndex: null,
  selectedMatchIndex: null,
  lockedStepId: null,
  lockedWarningId: null,
};

vi.mock("@/hooks/useHoverSync", () => ({
  useHoverSync: () => ({
    hoverState: { ...defaultHoverState },
    setHoveredRange: vi.fn(),
    setHoveredStepId: vi.fn(),
    setHoveredMatchIndex: vi.fn(),
    setSelectedMatchIndex: vi.fn(),
    toggleLockedStep: vi.fn(),
    clearAll: vi.fn(),
  }),
}));

beforeEach(() => {
  cleanup();
});

const flatSteps: ExplanationStep[] = [
  { id: "step-1", label: "Start of input", kind: "anchor", depth: 0 },
  { id: "step-2", label: "One or more digits", kind: "quantifier", depth: 0 },
  { id: "step-3", label: "End of input", kind: "anchor", depth: 0 },
];

const nestedSteps: ExplanationStep[] = [
  { id: "step-1", label: "Capture group #1", kind: "group", depth: 0 },
  { id: "step-2", label: "One or more digits", kind: "quantifier", depth: 1 },
  { id: "step-3", label: 'The letter "-"', kind: "literal", depth: 1 },
  { id: "step-4", label: "End of input", kind: "anchor", depth: 0 },
];

describe("ExplanationSteps", () => {
  it("renders all flat steps", () => {
    render(<ExplanationSteps steps={flatSteps} />);
    expect(screen.getByText("Start of input")).toBeInTheDocument();
    expect(screen.getByText("One or more digits")).toBeInTheDocument();
    expect(screen.getByText("End of input")).toBeInTheDocument();
  });

  it("has list role and label", () => {
    render(<ExplanationSteps steps={flatSteps} />);
    expect(screen.getByRole("list")).toHaveAttribute("aria-label", "Explanation steps");
  });

  it("renders parent step with collapse chevron", () => {
    render(<ExplanationSteps steps={nestedSteps} />);
    // step-1 is a parent (next step has higher depth)
    expect(screen.getByLabelText("Collapse")).toBeInTheDocument();
  });

  it("does not render chevron on non-parent steps", () => {
    render(<ExplanationSteps steps={flatSteps} />);
    expect(screen.queryByLabelText("Collapse")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Expand")).not.toBeInTheDocument();
  });

  it("hides children when parent is collapsed", () => {
    render(<ExplanationSteps steps={nestedSteps} />);

    // All steps visible initially
    expect(screen.getByText("Capture group #1")).toBeInTheDocument();
    expect(screen.getByText("One or more digits")).toBeInTheDocument();
    expect(screen.getByText('The letter "-"')).toBeInTheDocument();
    expect(screen.getByText("End of input")).toBeInTheDocument();

    // Collapse the parent
    fireEvent.click(screen.getByLabelText("Collapse"));

    // Children hidden
    expect(screen.queryByText("One or more digits")).not.toBeInTheDocument();
    expect(screen.queryByText('The letter "-"')).not.toBeInTheDocument();

    // Parent and sibling still visible
    expect(screen.getByText("Capture group #1")).toBeInTheDocument();
    expect(screen.getByText("End of input")).toBeInTheDocument();
  });

  it("shows children again when parent is expanded", () => {
    render(<ExplanationSteps steps={nestedSteps} />);

    // Collapse then expand
    fireEvent.click(screen.getByLabelText("Collapse"));
    fireEvent.click(screen.getByLabelText("Expand"));

    // Children visible again
    expect(screen.getByText("One or more digits")).toBeInTheDocument();
    expect(screen.getByText('The letter "-"')).toBeInTheDocument();
  });

  it("renders empty when no steps", () => {
    const { container } = render(<ExplanationSteps steps={[]} />);
    const list = container.querySelector("[role='list']");
    expect(list?.children).toHaveLength(0);
  });
});
