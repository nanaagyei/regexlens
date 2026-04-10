import type { ExplanationStep, ExplanationKind } from "@/types/explain";
import type {
  SemanticUnit,
  QuantifiedUnit,
  QuantifiedTarget,
  CharClassUnit,
  GroupUnit,
  AlternationUnit,
  AssertionUnit,
  TextUnit,
} from "@/types/explain";
import type { CharClassMember } from "@/types/ast";

/**
 * Format SemanticUnits into human-readable ExplanationSteps (simple mode).
 *
 * Simple mode prioritises readability:
 * - Quantifiers fuse with their target ("Exactly 2 digits")
 * - Non-capturing groups are suppressed (contents inlined)
 * - Greedy/lazy is not mentioned
 */
export function formatSimple(units: SemanticUnit[]): ExplanationStep[] {
  let counter = 0;
  const id = () => `step-${++counter}`;

  function formatUnits(
    units: SemanticUnit[],
    depth: number
  ): ExplanationStep[] {
    // Inline non-capturing groups and re-merge adjacent text
    const inlined = inlineNonCapturingGroups(units);
    const merged = mergeAdjacentText(inlined);

    const steps: ExplanationStep[] = [];
    for (const unit of merged) {
      steps.push(...formatUnit(unit, depth));
    }
    return steps;
  }

  function formatUnit(
    unit: SemanticUnit,
    depth: number
  ): ExplanationStep[] {
    switch (unit.type) {
      case "text":
        return [textStep(unit, depth)];

      case "anchor":
        return [
          {
            id: id(),
            label: SIMPLE_ANCHOR[unit.anchorKind],
            kind: "anchor",
            depth,
            range: unit.range,
          },
        ];

      case "dot":
        return [
          {
            id: id(),
            label: "Any character",
            detail: "Matches any character except newline",
            kind: "escape",
            depth,
            range: unit.range,
          },
        ];

      case "escape":
        return [
          {
            id: id(),
            label: SIMPLE_ESCAPE[unit.escapeType] ?? `Literal "${unit.raw.replace("\\", "")}"`,
            detail: SIMPLE_ESCAPE_DETAIL[unit.escapeType],
            kind: "escape",
            depth,
            range: unit.range,
          },
        ];

      case "charClass":
        return [charClassStep(unit, depth)];

      case "quantified":
        return [quantifiedStep(unit, depth)];

      case "group":
        return groupSteps(unit, depth);

      case "alternation":
        return alternationSteps(unit, depth);

      case "assertion":
        return assertionSteps(unit, depth);

      case "backreference": {
        const label = unit.groupName
          ? `Same text as "${unit.groupName}"`
          : `Same text as group ${unit.groupNumber}`;
        return [
          {
            id: id(),
            label,
            kind: "backreference",
            depth,
            range: unit.range,
          },
        ];
      }
    }
  }

  function textStep(unit: TextUnit, depth: number): ExplanationStep {
    const label =
      unit.value.length === 1
        ? `The letter "${unit.value}"`
        : `The text "${unit.value}"`;
    return { id: id(), label, kind: "literal", depth, range: unit.range };
  }

  function charClassStep(
    unit: CharClassUnit,
    depth: number
  ): ExplanationStep {
    const desc = describeMembers(unit.members);
    const label = unit.negated
      ? `Any character except: ${desc}`
      : `One of: ${desc}`;
    return {
      id: id(),
      label,
      kind: "charclass",
      depth,
      range: unit.range,
    };
  }

  function quantifiedStep(
    unit: QuantifiedUnit,
    depth: number
  ): ExplanationStep {
    const { min, max } = unit;
    const [singular, plural] = targetNoun(unit.target);
    const label = fuseQuantity(min, max, singular, plural);

    const steps: ExplanationStep[] = [];
    steps.push({
      id: id(),
      label,
      kind: "quantifier",
      depth,
      range: unit.range,
    });

    // If target is a group, add its body as children
    if (unit.target.kind === "group") {
      const body = formatUnits(unit.target.group.body, depth + 1);
      steps.push(...body);
    }

    return steps.length === 1 ? steps[0] : steps[0];
  }

  // For quantified groups we need all steps
  function quantifiedSteps(
    unit: QuantifiedUnit,
    depth: number
  ): ExplanationStep[] {
    const { min, max } = unit;
    const [singular, plural] = targetNoun(unit.target);
    const label = fuseQuantity(min, max, singular, plural);

    const steps: ExplanationStep[] = [];
    steps.push({
      id: id(),
      label,
      kind: "quantifier",
      depth,
      range: unit.range,
    });

    if (unit.target.kind === "group") {
      steps.push(...formatUnits(unit.target.group.body, depth + 1));
    }

    return steps;
  }

  function groupSteps(
    unit: GroupUnit,
    depth: number
  ): ExplanationStep[] {
    // Non-capturing groups are already inlined by the caller
    // This handles only capturing groups
    const label = unit.name
      ? `Capture as "${unit.name}"`
      : `Capture group #${unit.number}`;

    const steps: ExplanationStep[] = [
      {
        id: id(),
        label,
        kind: "group",
        depth,
        range: unit.range,
      },
    ];

    steps.push(...formatUnits(unit.body, depth + 1));
    return steps;
  }

  function alternationSteps(
    unit: AlternationUnit,
    depth: number
  ): ExplanationStep[] {
    const steps: ExplanationStep[] = [
      { id: id(), label: "Either", kind: "alternation", depth, range: unit.range },
    ];

    unit.branches.forEach((branch, i) => {
      steps.push({
        id: id(),
        label: `Option ${i + 1}:`,
        kind: "sequence",
        depth: depth + 1,
        range:
          branch.length > 0
            ? { start: branch[0].range.start, end: branch[branch.length - 1].range.end }
            : unit.range,
      });
      steps.push(...formatUnits(branch, depth + 2));
    });

    return steps;
  }

  function assertionSteps(
    unit: AssertionUnit,
    depth: number
  ): ExplanationStep[] {
    const label = SIMPLE_ASSERTION[`${unit.assertionType}:${unit.polarity}`];
    const kind: ExplanationKind =
      unit.assertionType === "lookahead" ? "lookahead" : "lookbehind";

    const steps: ExplanationStep[] = [
      { id: id(), label, kind, depth, range: unit.range },
    ];

    steps.push(...formatUnits(unit.body, depth + 1));
    return steps;
  }

  // Override formatUnit for quantified to use quantifiedSteps
  function formatUnitFull(
    unit: SemanticUnit,
    depth: number
  ): ExplanationStep[] {
    if (unit.type === "quantified") {
      return quantifiedSteps(unit, depth);
    }
    return formatUnit(unit, depth);
  }

  // Re-define formatUnits to use formatUnitFull
  function formatUnitsFull(
    units: SemanticUnit[],
    depth: number
  ): ExplanationStep[] {
    const inlined = inlineNonCapturingGroups(units);
    const merged = mergeAdjacentText(inlined);

    const steps: ExplanationStep[] = [];
    for (const u of merged) {
      steps.push(...formatUnitFull(u, depth));
    }
    return steps;
  }

  return formatUnitsFull(units, 0);
}

// ── Non-capturing group inlining ──────────────────────────

function inlineNonCapturingGroups(units: SemanticUnit[]): SemanticUnit[] {
  const result: SemanticUnit[] = [];
  for (const unit of units) {
    if (unit.type === "group" && !unit.capturing) {
      // Inline body, recursively inlining nested non-capturing groups
      result.push(...inlineNonCapturingGroups(unit.body));
    } else {
      result.push(unit);
    }
  }
  return result;
}

/**
 * Merge adjacent TextUnits that became adjacent after group inlining.
 */
function mergeAdjacentText(units: SemanticUnit[]): SemanticUnit[] {
  const result: SemanticUnit[] = [];
  let textBuf: TextUnit[] = [];

  const flush = () => {
    if (textBuf.length === 0) return;
    if (textBuf.length === 1) {
      result.push(textBuf[0]);
    } else {
      const merged: TextUnit = {
        type: "text",
        value: textBuf.map((t) => t.value).join(""),
        sourceText: textBuf.map((t) => t.sourceText).join(""),
        range: {
          start: textBuf[0].range.start,
          end: textBuf[textBuf.length - 1].range.end,
        },
      };
      result.push(merged);
    }
    textBuf = [];
  };

  for (const unit of units) {
    if (unit.type === "text") {
      textBuf.push(unit);
    } else {
      flush();
      result.push(unit);
    }
  }
  flush();
  return result;
}

// ── Quantifier + target fusion ────────────────────────────

function fuseQuantity(
  min: number,
  max: number | null,
  singular: string,
  plural: string
): string {
  if (min === 0 && max === 1) return `Optional ${singular}`;
  if (min === 0 && max === null) return `Zero or more ${plural}`;
  if (min === 1 && max === null) return `One or more ${plural}`;
  if (min === max) {
    if (min === 1) return `Exactly 1 ${singular}`;
    return `Exactly ${min} ${plural}`;
  }
  if (max === null) return `${min} or more ${plural}`;
  return `Between ${min} and ${max} ${plural}`;
}

function targetNoun(target: QuantifiedTarget): [string, string] {
  switch (target.kind) {
    case "escape":
      return ESCAPE_NOUNS[target.escapeType] ?? [`"${target.raw}"`, `"${target.raw}"`];
    case "charClass": {
      const desc = describeMembers(target.members);
      const prefix = target.negated ? "not " : "";
      return [
        `character ${prefix}matching ${desc}`,
        `characters ${prefix}matching ${desc}`,
      ];
    }
    case "dot":
      return ["character", "characters"];
    case "text":
      return [`"${target.value}"`, `"${target.value}"`];
    case "group": {
      const g = target.group;
      const name = g.name
        ? `"${g.name}"`
        : g.number
          ? `group #${g.number}`
          : "group";
      return [`of ${name}`, `of ${name}`];
    }
    case "backreference": {
      const ref = target.groupName
        ? `"${target.groupName}"`
        : `group ${target.groupNumber}`;
      return [`match of ${ref}`, `matches of ${ref}`];
    }
  }
}

function describeMembers(members: CharClassMember[]): string {
  return members
    .map((m) => {
      if (m.type === "range") return `${m.from}-${m.to}`;
      return m.value;
    })
    .join(", ");
}

// ── Lookup tables ─────────────────────────────────────────

const SIMPLE_ANCHOR: Record<string, string> = {
  start: "Start of text",
  end: "End of text",
  wordBoundary: "Word boundary",
  nonWordBoundary: "Non-word boundary",
};

const SIMPLE_ESCAPE: Record<string, string> = {
  digit: "A digit",
  nonDigit: "A non-digit",
  word: "A word character",
  nonWord: "A non-word character",
  whitespace: "A whitespace character",
  nonWhitespace: "A non-whitespace character",
  tab: "A tab",
  newline: "A newline",
  return: "A carriage return",
};

const SIMPLE_ESCAPE_DETAIL: Record<string, string | undefined> = {
  digit: "0 through 9",
  word: "Letter, digit, or underscore",
  whitespace: "Space, tab, newline, etc.",
};

const ESCAPE_NOUNS: Record<string, [string, string]> = {
  digit: ["digit", "digits"],
  nonDigit: ["non-digit", "non-digits"],
  word: ["word character", "word characters"],
  nonWord: ["non-word character", "non-word characters"],
  whitespace: ["whitespace character", "whitespace characters"],
  nonWhitespace: ["non-whitespace character", "non-whitespace characters"],
  tab: ["tab", "tabs"],
  newline: ["newline", "newlines"],
  return: ["carriage return", "carriage returns"],
};

const SIMPLE_ASSERTION: Record<string, string> = {
  "lookahead:positive": "Followed by",
  "lookahead:negative": "Not followed by",
  "lookbehind:positive": "Preceded by",
  "lookbehind:negative": "Not preceded by",
};
