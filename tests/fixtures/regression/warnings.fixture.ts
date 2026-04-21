import type { WarningsRegressionFixture } from "./types";

export const warningsRegressionFixtures: WarningsRegressionFixture[] = [
  {
    name: "nested quantifier risk",
    pattern: "(a+)+",
    flags: "",
    text: "aaaaaaaaaaaaaaaaaaaaX",
    expectedWarningIds: ["nested-quantifiers"],
  },
  {
    name: "unescaped literal dot risk",
    pattern: "example.com",
    flags: "",
    text: "exampleXcom",
    expectedWarningIds: ["unescaped-dot"],
  },
];
