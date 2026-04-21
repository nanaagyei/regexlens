import { describe, expect, it } from "vitest";
import { parseRegex } from "@/lib/regex/parse";
import { computeMatches } from "@/lib/regex/match";
import { generateExplanation } from "@/lib/explain/explain";
import { analyzeWarnings } from "@/lib/warnings/heuristics";
import { analyzeFailure } from "@/lib/failure/analyzeFailure";
import {
  computeSyntaxDiff,
  computeFlagDiff,
  computeStructuralDiff,
  computeExplanationDiff,
  computeWarningDiff,
  synthesizeBehaviorSummary,
} from "@/lib/diff";
import { decodeState, encodeState } from "@/lib/regex/serialize";
import { explanationRegressionFixtures } from "../../fixtures/regression/explanation.fixture";
import { warningsRegressionFixtures } from "../../fixtures/regression/warnings.fixture";
import { failureRegressionFixtures } from "../../fixtures/regression/failure.fixture";
import { diffRegressionFixtures } from "../../fixtures/regression/diff.fixture";
import { urlRestoreRegressionFixtures } from "../../fixtures/regression/url-restore.fixture";

describe("regression fixtures (pure libs)", () => {
  it("explanation fixtures remain stable", () => {
    for (const fixture of explanationRegressionFixtures) {
      const parseResult = parseRegex(fixture.pattern, fixture.flags);
      expect(parseResult.ok, fixture.name).toBe(true);
      if (!parseResult.ok) continue;

      const explanation = generateExplanation(parseResult, fixture.mode);
      expect(explanation.steps.length, fixture.name).toBeGreaterThan(0);

      const labels = explanation.steps.map((step) => step.label.toLowerCase()).join(" ");
      for (const expected of fixture.expectedLabels) {
        expect(labels, fixture.name).toContain(expected.toLowerCase());
      }
    }
  });

  it("warning fixtures remain stable", () => {
    for (const fixture of warningsRegressionFixtures) {
      const parseResult = parseRegex(fixture.pattern, fixture.flags);
      const matchResult = computeMatches(fixture.pattern, fixture.flags, fixture.text);
      const warnings = analyzeWarnings(
        fixture.pattern,
        fixture.flags,
        parseResult,
        matchResult,
      );

      const warningIds = warnings.warnings.map((warning) => warning.id);
      for (const id of fixture.expectedWarningIds) {
        expect(warningIds, fixture.name).toContain(id);
      }
    }
  });

  it("failure fixtures remain stable", () => {
    for (const fixture of failureRegressionFixtures) {
      const parseResult = parseRegex(fixture.pattern, fixture.flags);
      const matchResult = computeMatches(fixture.pattern, fixture.flags, fixture.text);
      const failure = analyzeFailure(
        fixture.pattern,
        fixture.flags,
        fixture.text,
        parseResult,
        matchResult,
      );

      expect(failure.didMatch, fixture.name).toBe(false);
      if (failure.didMatch) continue;

      expect(failure.reason.toLowerCase(), fixture.name).toContain(
        fixture.expectedReasonIncludes.toLowerCase(),
      );
    }
  });

  it("diff fixtures remain stable", () => {
    for (const fixture of diffRegressionFixtures) {
      const oldParse = parseRegex(fixture.oldPattern, fixture.oldFlags);
      const newParse = parseRegex(fixture.newPattern, fixture.newFlags);
      expect(newParse.ok, fixture.name).toBe(true);
      if (!newParse.ok) continue;

      const oldExplanation = oldParse.ok ? generateExplanation(oldParse) : { steps: [] };
      const newExplanation = generateExplanation(newParse);

      const oldWarnings = analyzeWarnings(
        fixture.oldPattern,
        fixture.oldFlags,
        oldParse,
        computeMatches(fixture.oldPattern, fixture.oldFlags, ""),
      );
      const newWarnings = analyzeWarnings(
        fixture.newPattern,
        fixture.newFlags,
        newParse,
        computeMatches(fixture.newPattern, fixture.newFlags, ""),
      );

      const diff = {
        syntax: computeSyntaxDiff(fixture.oldPattern, fixture.newPattern),
        flags: computeFlagDiff(fixture.oldFlags, fixture.newFlags),
        structural:
          oldParse.ok && newParse.ok
            ? computeStructuralDiff(oldParse.normalized, newParse.normalized)
            : null,
        explanation: computeExplanationDiff(oldExplanation.steps, newExplanation.steps),
        warnings: computeWarningDiff(oldWarnings.warnings, newWarnings.warnings),
        behaviorSummary: { summaries: [], hasSummaries: false },
      };

      const summary = synthesizeBehaviorSummary(diff);
      expect(summary.hasSummaries, fixture.name).toBe(true);

      const allMessages = summary.summaries.map((item) => item.message).join(" ");
      for (const snippet of fixture.expectedSummaryIncludes) {
        expect(allMessages, fixture.name).toContain(snippet);
      }
    }
  });

  it("url restore fixtures round-trip comparison fields", () => {
    for (const fixture of urlRestoreRegressionFixtures) {
      const encoded = encodeState(fixture.state);
      const decoded = decodeState(encoded);

      expect(decoded, fixture.name).toMatchObject(fixture.expectedDecoded);
      expect(decoded.comparisonPattern, fixture.name).toBe(
        fixture.expectedDecoded.comparisonPattern,
      );
      expect(decoded.comparisonFlags, fixture.name).toBe(
        fixture.expectedDecoded.comparisonFlags,
      );
    }
  });

  it("url restore sanitizes invalid flags", () => {
    const decoded = decodeState({ f: "giz!", cf: "my?" });
    expect(decoded.flags).toBe("gi");
    expect(decoded.comparisonFlags).toBe("my");
  });
});
