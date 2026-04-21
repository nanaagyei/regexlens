import type { UrlRestoreRegressionFixture } from "./types";

export const urlRestoreRegressionFixtures: UrlRestoreRegressionFixture[] = [
  {
    name: "round-trip preserves comparison state",
    state: {
      pattern: "\\d+",
      flags: "gi",
      text: "abc 123",
      flavor: "javascript",
      comparisonPattern: "\\w+",
      comparisonFlags: "m",
      explanationMode: "technical",
      selectedTemplate: "basic-email",
    },
    expectedDecoded: {
      pattern: "\\d+",
      flags: "gi",
      text: "abc 123",
      comparisonPattern: "\\w+",
      comparisonFlags: "m",
      explanationMode: "technical",
      selectedTemplate: "basic-email",
    },
  },
];
