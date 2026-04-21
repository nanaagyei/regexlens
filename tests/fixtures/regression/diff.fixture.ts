import type { DiffRegressionFixture } from "./types";

export const diffRegressionFixtures: DiffRegressionFixture[] = [
  {
    name: "case-insensitive broadening",
    oldPattern: "abc",
    oldFlags: "",
    newPattern: "abc",
    newFlags: "i",
    expectedSummaryIncludes: ["Case sensitivity disabled"],
  },
  {
    name: "literal to wildcard change",
    oldPattern: "foo",
    oldFlags: "",
    newPattern: "f.o",
    newFlags: "",
    expectedSummaryIncludes: ["Wildcard added"],
  },
];
