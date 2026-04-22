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
}

export type FailureResult = FailureSuccess | FailureDiagnosis;
