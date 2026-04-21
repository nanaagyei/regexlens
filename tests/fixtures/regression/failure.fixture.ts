import type { FailureRegressionFixture } from "./types";

export const failureRegressionFixtures: FailureRegressionFixture[] = [
  {
    name: "start anchor fails on leading text",
    pattern: "^abc$",
    flags: "",
    text: "xabc",
    expectedReasonIncludes: "expected the character",
  },
  {
    name: "digit escape fails on alpha",
    pattern: "\\d+",
    flags: "",
    text: "abc",
    expectedReasonIncludes: "Expected",
  },
];
