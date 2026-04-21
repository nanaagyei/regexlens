import type { ExplanationMode, RegexState } from "@/types";

export interface ExplanationRegressionFixture {
  name: string;
  pattern: string;
  flags: string;
  mode: ExplanationMode;
  expectedLabels: string[];
}

export interface WarningsRegressionFixture {
  name: string;
  pattern: string;
  flags: string;
  text: string;
  expectedWarningIds: string[];
}

export interface FailureRegressionFixture {
  name: string;
  pattern: string;
  flags: string;
  text: string;
  expectedReasonIncludes: string;
}

export interface DiffRegressionFixture {
  name: string;
  oldPattern: string;
  oldFlags: string;
  newPattern: string;
  newFlags: string;
  expectedSummaryIncludes: string[];
}

export interface UrlRestoreRegressionFixture {
  name: string;
  state: RegexState;
  expectedDecoded: Partial<RegexState>;
}
