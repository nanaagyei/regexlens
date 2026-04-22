import type { ExplanationRegressionFixture } from "./types";

export const explanationRegressionFixtures: ExplanationRegressionFixture[] = [
  {
    name: "digits with quantifier",
    pattern: "\\d+",
    flags: "g",
    mode: "simple",
    expectedLabels: ["digit", "one or more"],
  },
  {
    name: "anchored technical breakdown",
    pattern: "^[A-Z]{2}\\d{3}$",
    flags: "",
    mode: "technical",
    expectedLabels: ["start of input", "class [a-z]", "exactly", "end of input"],
  },
];
