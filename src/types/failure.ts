/**
 * Failure analysis types for regex match diagnosis
 */

import { Range } from "./regex";

export type FailureConfidence = "high" | "medium" | "low";

export interface FailureSuccess {
  didMatch: true;
}

export interface FailureDiagnosis {
  didMatch: false;
  failureIndex: number;
  expected: string;
  actual: string;
  reason: string;
  detail: string;
  relatedRange?: Range;
  confidence: FailureConfidence;
  /** True when simulation used a bounded text window or start-position cap */
  analysisLimited?: boolean;
  /** Original input length when analysisLimited (for UI copy) */
  analysisTextLength?: number;
  /** Length of text window actually simulated */
  analysisWindowLength?: number;
}

export type FailureResult = FailureSuccess | FailureDiagnosis;
