import type { ExplanationStep, ExplanationKind } from "@/types/explain";
import type {
  SemanticUnit,
  QuantifiedUnit,
  QuantifiedTarget,
  CharClassUnit,
  GroupUnit,
  AlternationUnit,
  AssertionUnit,
} from "@/types/explain";
import type { CharClassMember } from "@/types/ast";

/**
 * Format SemanticUnits into token-aware ExplanationSteps (technical mode).
 *
 * Technical mode prioritises precision:
 * - Shows raw tokens (e.g. "\\d{2}")
 * - Non-capturing groups are NOT suppressed
 * - Greedy/lazy is always shown
 */
export function formatTechnical(units: SemanticUnit[]): ExplanationStep[] {
  let counter = 0;
  const id = () => `step-${++counter}`;

  function formatUnits(
    units: SemanticUnit[],
    depth: number
  ): ExplanationStep[] {
    const steps: ExplanationStep[] = [];
    for (const unit of units) {
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
        return [
          {
            id: id(),
            label: `Literal "${unit.value}"`,
            kind: "literal",
            depth,
            range: unit.range,
          },
        ];

      case "anchor":
        return [
          {
            id: id(),
            label: TECH_ANCHOR[unit.anchorKind],
            kind: "anchor",
            depth,
            range: unit.range,
          },
        ];

      case "dot":
        return [
          {
            id: id(),
            label: ". \u2014 Any character (except newline)",
            kind: "escape",
            depth,
            range: unit.range,
          },
        ];

      case "escape":
        return [
          {
            id: id(),
            label: TECH_ESCAPE[unit.escapeType] ?? `${unit.raw} \u2014 Escaped character`,
            kind: "escape",
            depth,
            range: unit.range,
          },
        ];

      case "charClass":
        return [charClassStep(unit, depth)];

      case "quantified":
        return quantifiedSteps(unit, depth);

      case "group":
        return groupSteps(unit, depth);

      case "alternation":
        return alternationSteps(unit, depth);

      case "assertion":
        return assertionSteps(unit, depth);

      case "backreference": {
        const token = unit.groupName ? `\\k<${unit.groupName}>` : `\\${unit.groupNumber}`;
        const detail = unit.groupName
          ? `References named group "${unit.groupName}"`
          : `References capture group ${unit.groupNumber}`;
        return [
          {
            id: id(),
            label: `${token} \u2014 Backreference`,
            detail,
            kind: "backreference",
            depth,
            range: unit.range,
          },
        ];
      }
    }
  }

  function charClassStep(
    unit: CharClassUnit,
    depth: number
  ): ExplanationStep {
    const membersStr = describeMembersTechnical(unit.members);
    const classNotation = unit.negated ? `[^${membersStr}]` : `[${membersStr}]`;
    const label = unit.negated
      ? `${classNotation} \u2014 Negated character class`
      : `${classNotation} \u2014 Character class`;

    return {
      id: id(),
      label,
      detail: describeMembers(unit.members),
      kind: "charclass",
      depth,
      range: unit.range,
    };
  }

  function quantifiedSteps(
    unit: QuantifiedUnit,
    depth: number
  ): ExplanationStep[] {
    const targetToken = targetSourceToken(unit.target);
    const quantToken = quantifierToken(unit.min, unit.max, unit.greedy);
    const targetDesc = targetDescription(unit.target);
    const quantDesc = quantifierDescription(unit.min, unit.max);

    const label = `${targetToken}${quantToken} \u2014 ${targetDesc}, ${quantDesc}`;
    const detail = greedyDetail(unit.min, unit.max, unit.greedy);

    const steps: ExplanationStep[] = [
      {
        id: id(),
        label,
        detail,
        kind: "quantifier",
        depth,
        range: unit.range,
      },
    ];

    if (unit.target.kind === "group") {
      steps.push(...formatUnits(unit.target.group.body, depth + 1));
    }

    return steps;
  }

  function groupSteps(
    unit: GroupUnit,
    depth: number
  ): ExplanationStep[] {
    let label: string;
    if (unit.name) {
      label = `(?<${unit.name}>...) \u2014 Named capture group "${unit.name}"`;
    } else if (unit.capturing) {
      label = `(...) \u2014 Capture group #${unit.number}`;
    } else {
      label = `(?:...) \u2014 Non-capturing group`;
    }

    const steps: ExplanationStep[] = [
      { id: id(), label, kind: "group", depth, range: unit.range },
    ];

    steps.push(...formatUnits(unit.body, depth + 1));
    return steps;
  }

  function alternationSteps(
    unit: AlternationUnit,
    depth: number
  ): ExplanationStep[] {
    const steps: ExplanationStep[] = [
      {
        id: id(),
        label: "| \u2014 Alternation",
        kind: "alternation",
        depth,
        range: unit.range,
      },
    ];

    unit.branches.forEach((branch, i) => {
      steps.push({
        id: id(),
        label: `Branch ${i + 1}:`,
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
    const key = `${unit.assertionType}:${unit.polarity}`;
    const label = TECH_ASSERTION[key];
    const kind: ExplanationKind =
      unit.assertionType === "lookahead" ? "lookahead" : "lookbehind";

    const steps: ExplanationStep[] = [
      { id: id(), label, kind, depth, range: unit.range },
    ];

    steps.push(...formatUnits(unit.body, depth + 1));
    return steps;
  }

  return formatUnits(units, 0);
}

// ── Quantifier helpers ────────────────────────────────────

function quantifierToken(
  min: number,
  max: number | null,
  greedy: boolean
): string {
  const lazy = greedy ? "" : "?";
  if (min === 0 && max === null) return `*${lazy}`;
  if (min === 1 && max === null) return `+${lazy}`;
  if (min === 0 && max === 1) return `?${lazy}`;
  if (min === max) return `{${min}}`;
  if (max === null) return `{${min},}${lazy}`;
  return `{${min},${max}}${lazy}`;
}

function quantifierDescription(min: number, max: number | null): string {
  if (min === 0 && max === 1) return "zero or one";
  if (min === 0 && max === null) return "zero or more";
  if (min === 1 && max === null) return "one or more";
  if (min === max) return `exactly ${min} time${min === 1 ? "" : "s"}`;
  if (max === null) return `${min} or more times`;
  return `${min} to ${max} times`;
}

function greedyDetail(
  min: number,
  max: number | null,
  greedy: boolean
): string | undefined {
  // Exact quantifiers ({n}) have no greedy/lazy distinction
  if (min === max) return undefined;
  return greedy ? "Greedy" : "Lazy (match as few as possible)";
}

function targetSourceToken(target: QuantifiedTarget): string {
  switch (target.kind) {
    case "escape":
      return target.raw;
    case "charClass": {
      const members = describeMembersTechnical(target.members);
      return target.negated ? `[^${members}]` : `[${members}]`;
    }
    case "dot":
      return ".";
    case "text":
      return target.value;
    case "group":
      return "(...)";
    case "backreference":
      return target.groupName ? `\\k<${target.groupName}>` : `\\${target.groupNumber}`;
  }
}

function targetDescription(target: QuantifiedTarget): string {
  switch (target.kind) {
    case "escape":
      return ESCAPE_DESC[target.escapeType] ?? `${target.raw}`;
    case "charClass": {
      const members = describeMembersTechnical(target.members);
      return target.negated ? `Negated class [^${members}]` : `Class [${members}]`;
    }
    case "dot":
      return "Any character";
    case "text":
      return `"${target.value}"`;
    case "group": {
      const g = target.group;
      if (g.name) return `Named group "${g.name}"`;
      if (g.capturing) return `Capture group #${g.number}`;
      return "Non-capturing group";
    }
    case "backreference":
      return target.groupName
        ? `Backreference to "${target.groupName}"`
        : `Backreference to group ${target.groupNumber}`;
  }
}

// ── Member description ────────────────────────────────────

function describeMembersTechnical(members: CharClassMember[]): string {
  return members
    .map((m) => (m.type === "range" ? `${m.from}-${m.to}` : m.value))
    .join("");
}

function describeMembers(members: CharClassMember[]): string {
  return members
    .map((m) => (m.type === "range" ? `${m.from} to ${m.to}` : m.value))
    .join(", ");
}

// ── Lookup tables ─────────────────────────────────────────

const TECH_ANCHOR: Record<string, string> = {
  start: "^ \u2014 Start of input",
  end: "$ \u2014 End of input",
  wordBoundary: "\\b \u2014 Word boundary",
  nonWordBoundary: "\\B \u2014 Non-word boundary",
};

const TECH_ESCAPE: Record<string, string> = {
  digit: "\\d \u2014 Digit [0-9]",
  nonDigit: "\\D \u2014 Non-digit",
  word: "\\w \u2014 Word character [A-Za-z0-9_]",
  nonWord: "\\W \u2014 Non-word character",
  whitespace: "\\s \u2014 Whitespace",
  nonWhitespace: "\\S \u2014 Non-whitespace",
  tab: "\\t \u2014 Tab",
  newline: "\\n \u2014 Newline",
  return: "\\r \u2014 Carriage return",
};

const ESCAPE_DESC: Record<string, string> = {
  digit: "Digit",
  nonDigit: "Non-digit",
  word: "Word character",
  nonWord: "Non-word character",
  whitespace: "Whitespace",
  nonWhitespace: "Non-whitespace",
  tab: "Tab",
  newline: "Newline",
  return: "Carriage return",
};

const TECH_ASSERTION: Record<string, string> = {
  "lookahead:positive": "(?=...) \u2014 Positive lookahead",
  "lookahead:negative": "(?!...) \u2014 Negative lookahead",
  "lookbehind:positive": "(?<=...) \u2014 Positive lookbehind",
  "lookbehind:negative": "(?<!...) \u2014 Negative lookbehind",
};
