"use client";

import type { FailureDiagnosis } from "@/types";

interface FailureHighlightProps {
  failure: FailureDiagnosis;
  text: string;
}

/**
 * Overlay that highlights the failure position in the test text
 * with a red underline marker. Only renders when confidence is not "low".
 */
export function FailureHighlight({ failure, text }: FailureHighlightProps) {
  if (failure.confidence === "low") return null;
  if (failure.failureIndex > text.length) return null;

  const before = text.slice(0, failure.failureIndex);
  // Highlight at least 1 character (or show marker at end of input)
  const failureChar = failure.failureIndex < text.length
    ? text.slice(failure.failureIndex, failure.failureIndex + 1)
    : " "; // space placeholder for end-of-input
  const after = failure.failureIndex < text.length
    ? text.slice(failure.failureIndex + 1)
    : "";

  return (
    <div
      className="absolute inset-0 p-4 pointer-events-none font-mono text-sm whitespace-pre-wrap break-words overflow-hidden"
      aria-hidden="true"
    >
      <span>{before}</span>
      <span className="failure-highlight-marker rounded-sm">{failureChar}</span>
      <span>{after}</span>
    </div>
  );
}
