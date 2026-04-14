// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { StepRow } from "../StepRow";
import { HoverState } from "@/lib/stores/hoverStore";
import { ExplanationStep } from "@/types";
import { TooltipProvider } from "@/components/ui/tooltip";

function renderWithProviders(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

const defaultHoverState: HoverState = {
  hoveredRange: null,
  hoveredStepId: null,
  hoveredMatchIndex: null,
  selectedMatchIndex: null,
  lockedStepId: null,
  lockedWarningId: null,
  lockedFailureId: null,
};

const mockSetHoveredStepId = vi.fn();
const mockSetHoveredRange = vi.fn();
const mockToggleLockedStep = vi.fn();

let currentHoverState = { ...defaultHoverState };

vi.mock("@/hooks/useHoverSync", () => ({
  useHoverSync: () => ({
    hoverState: currentHoverState,
    setHoveredRange: mockSetHoveredRange,
    setHoveredStepId: mockSetHoveredStepId,
    setHoveredMatchIndex: vi.fn(),
    setSelectedMatchIndex: vi.fn(),
    toggleLockedStep: mockToggleLockedStep,
    clearAll: vi.fn(),
  }),
}));

beforeEach(() => {
  cleanup();
  currentHoverState = { ...defaultHoverState };
  mockSetHoveredStepId.mockReset();
  mockSetHoveredRange.mockReset();
  mockToggleLockedStep.mockReset();
});

const makeStep = (overrides: Partial<ExplanationStep> = {}): ExplanationStep => ({
  id: "step-1",
  label: "One or more digits",
  kind: "quantifier",
  depth: 0,
  ...overrides,
});

describe("StepRow", () => {
  it("renders the step label", () => {
    renderWithProviders(<StepRow step={makeStep()} index={0} />);
    expect(screen.getByText("One or more digits")).toBeInTheDocument();
  });

  it("renders the step number when not collapsible", () => {
    renderWithProviders(<StepRow step={makeStep()} index={0} />);
    expect(screen.getByText("1.")).toBeInTheDocument();
  });

  it("applies kind-colored text class", () => {
    renderWithProviders(<StepRow step={makeStep({ kind: "anchor" })} index={0} />);
    const label = screen.getByText("One or more digits");
    expect(label.className).toContain("text-emerald-400");
  });

  it("applies kind-colored left border", () => {
    const { container } = renderWithProviders(<StepRow step={makeStep({ kind: "escape" })} index={0} />);
    const row = container.firstElementChild;
    expect(row?.className).toContain("border-l-blue-400/60");
  });

  it("calls setHoveredStepId and setHoveredRange on mouse enter", () => {
    const step = makeStep({ range: { start: 0, end: 3 } });
    renderWithProviders(<StepRow step={step} index={0} />);
    fireEvent.mouseEnter(screen.getByRole("button"));
    expect(mockSetHoveredStepId).toHaveBeenCalledWith("step-1");
    expect(mockSetHoveredRange).toHaveBeenCalledWith({ start: 0, end: 3 });
  });

  it("clears hover state on mouse leave when not locked", () => {
    renderWithProviders(<StepRow step={makeStep()} index={0} />);
    fireEvent.mouseLeave(screen.getByRole("button"));
    expect(mockSetHoveredStepId).toHaveBeenCalledWith(null);
    expect(mockSetHoveredRange).toHaveBeenCalledWith(null);
  });

  it("does not clear hover state on mouse leave when locked", () => {
    currentHoverState = { ...defaultHoverState, lockedStepId: "step-1" };
    renderWithProviders(<StepRow step={makeStep()} index={0} />);
    fireEvent.mouseLeave(screen.getByRole("button"));
    expect(mockSetHoveredStepId).not.toHaveBeenCalled();
    expect(mockSetHoveredRange).not.toHaveBeenCalled();
  });

  it("calls toggleLockedStep on click", () => {
    renderWithProviders(<StepRow step={makeStep()} index={0} />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockToggleLockedStep).toHaveBeenCalledWith("step-1");
  });

  it("calls toggleLockedStep on Enter key", () => {
    renderWithProviders(<StepRow step={makeStep()} index={0} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(mockToggleLockedStep).toHaveBeenCalledWith("step-1");
  });

  it("calls toggleLockedStep on Space key", () => {
    renderWithProviders(<StepRow step={makeStep()} index={0} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: " " });
    expect(mockToggleLockedStep).toHaveBeenCalledWith("step-1");
  });

  it("renders pin icon when step is locked", () => {
    currentHoverState = { ...defaultHoverState, lockedStepId: "step-1" };
    renderWithProviders(<StepRow step={makeStep()} index={0} />);
    expect(screen.getByLabelText("Locked")).toBeInTheDocument();
  });

  it("does not render pin icon when step is not locked", () => {
    renderWithProviders(<StepRow step={makeStep()} index={0} />);
    expect(screen.queryByLabelText("Locked")).not.toBeInTheDocument();
  });

  it("renders depth connector for nested steps", () => {
    const { container } = renderWithProviders(<StepRow step={makeStep({ depth: 2 })} index={0} />);
    const connector = container.querySelector("[aria-hidden='true']");
    expect(connector).toBeInTheDocument();
    expect(connector?.className).toContain("bg-border/40");
  });

  it("does not render depth connector for depth 0", () => {
    const { container } = renderWithProviders(<StepRow step={makeStep({ depth: 0 })} index={0} />);
    const connector = container.querySelector("[aria-hidden='true']");
    expect(connector).not.toBeInTheDocument();
  });

  it("renders chevron when collapsible", () => {
    render(
      <StepRow
        step={makeStep()}
        index={0}
        collapsible
        collapsed={false}
        onToggleCollapse={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Collapse")).toBeInTheDocument();
  });

  it("renders right chevron when collapsed", () => {
    render(
      <StepRow
        step={makeStep()}
        index={0}
        collapsible
        collapsed
        onToggleCollapse={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Expand")).toBeInTheDocument();
  });

  it("calls onToggleCollapse when chevron is clicked", () => {
    const onToggle = vi.fn();
    render(
      <StepRow
        step={makeStep()}
        index={0}
        collapsible
        collapsed={false}
        onToggleCollapse={onToggle}
      />
    );
    fireEvent.click(screen.getByLabelText("Collapse"));
    expect(onToggle).toHaveBeenCalled();
  });

  it("has accessible role and label", () => {
    renderWithProviders(<StepRow step={makeStep()} index={0} />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-label", "Step 1: One or more digits");
    expect(btn).toHaveAttribute("tabindex", "0");
  });

  it("renders detail text when present", () => {
    renderWithProviders(<StepRow step={makeStep({ detail: "matches 0-9" })} index={0} />);
    expect(screen.getByText("matches 0-9")).toBeInTheDocument();
  });

  it("applies staggered animation delay", () => {
    const { container } = renderWithProviders(<StepRow step={makeStep()} index={3} />);
    const row = container.firstElementChild as HTMLElement;
    expect(row.style.animationDelay).toBe("150ms");
  });

  it("caps animation delay at 500ms", () => {
    const { container } = renderWithProviders(<StepRow step={makeStep()} index={20} />);
    const row = container.firstElementChild as HTMLElement;
    expect(row.style.animationDelay).toBe("500ms");
  });
});
