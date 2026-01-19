"use client";

import { ExplanationStep } from "@/types";
import { StepRow } from "./StepRow";

interface ExplanationStepsProps {
  steps: ExplanationStep[];
}

export function ExplanationSteps({ steps }: ExplanationStepsProps) {
  return (
    <div className="space-y-1">
      {steps.map((step, index) => (
        <StepRow key={step.id} step={step} index={index} />
      ))}
    </div>
  );
}
