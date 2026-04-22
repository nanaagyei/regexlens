"use client";

import { useState, useCallback } from "react";
import { ExplanationStep } from "@/types";
import { StepRow } from "./StepRow";

interface ExplanationStepsProps {
  steps: ExplanationStep[];
}

/**
 * Determine if a step is a "parent" — i.e. the next step has a higher depth.
 */
function isParentStep(steps: ExplanationStep[], index: number): boolean {
  if (index >= steps.length - 1) return false;
  return steps[index + 1].depth > steps[index].depth;
}

/**
 * Find the index of the next sibling step (same or lower depth) after a parent.
 * Returns steps.length if no sibling found (all remaining are children).
 */
function findChildrenEnd(steps: ExplanationStep[], parentIndex: number): number {
  const parentDepth = steps[parentIndex].depth;
  for (let i = parentIndex + 1; i < steps.length; i++) {
    if (steps[i].depth <= parentDepth) return i;
  }
  return steps.length;
}

export function ExplanationSteps({ steps }: ExplanationStepsProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const toggleCollapse = useCallback((stepId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }, []);

  const visibleSteps: { step: ExplanationStep; originalIndex: number }[] = [];
  let skipUntil = -1;

  for (let i = 0; i < steps.length; i++) {
    if (i < skipUntil) continue;

    const step = steps[i];
    const isParent = isParentStep(steps, i);
    const isCollapsed = isParent && collapsedIds.has(step.id);

    visibleSteps.push({ step, originalIndex: i });

    if (isCollapsed) {
      skipUntil = findChildrenEnd(steps, i);
    }
  }

  return (
    <div className="space-y-1" role="list" aria-label="Explanation steps">
      {visibleSteps.map(({ step, originalIndex }, visibleIndex) => {
        const isParent = isParentStep(steps, originalIndex);
        return (
          <StepRow
            key={step.id}
            step={step}
            index={visibleIndex}
            collapsible={isParent}
            collapsed={collapsedIds.has(step.id)}
            onToggleCollapse={() => toggleCollapse(step.id)}
          />
        );
      })}
    </div>
  );
}
