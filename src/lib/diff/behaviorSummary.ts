/**
 * Behavior summary synthesis — produces ranked, human-readable summaries
 * from all diff layers (flags, structural, warnings, explanation).
 */

import type {
  RegexDiff,
  BehaviorSummary,
  BehaviorSummaryResult,
  BehaviorImportance,
  BehaviorSummarySource,
  StructuralChange,
} from "@/types/diff";

const MAX_SUMMARIES = 6;

const IMPORTANCE_ORDER: Record<BehaviorImportance, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const SOURCE_ORDER: Record<BehaviorSummarySource, number> = {
  warnings: 0,
  flags: 1,
  structural: 2,
  explanation: 3,
};

// ── Flag summaries ───────────────────────────────────────

const FLAG_SUMMARIES: Record<
  string,
  { added: string; removed: string; importance: BehaviorImportance }
> = {
  i: {
    added:
      "Case sensitivity disabled — pattern now matches regardless of letter case",
    removed:
      "Case sensitivity enabled — pattern now distinguishes upper/lowercase",
    importance: "high",
  },
  m: {
    added:
      "Multiline mode enabled — ^ and $ now match per-line boundaries",
    removed:
      "Multiline mode disabled — ^ and $ match only string boundaries",
    importance: "high",
  },
  s: {
    added: "DotAll mode enabled — dot now matches newlines",
    removed: "DotAll mode disabled — dot no longer matches newlines",
    importance: "medium",
  },
  g: {
    added: "Global matching enabled — all occurrences will be matched",
    removed: "Global matching disabled — only first occurrence matched",
    importance: "medium",
  },
  u: {
    added: "Unicode mode enabled — full Unicode matching active",
    removed: "Unicode mode disabled — basic character matching only",
    importance: "low",
  },
  y: {
    added: "Sticky mode enabled — matching anchored to lastIndex",
    removed: "Sticky mode disabled — matching searches entire string",
    importance: "low",
  },
  d: {
    added: "Indices mode enabled — match indices will be captured",
    removed: "Indices mode disabled — match indices no longer captured",
    importance: "low",
  },
  v: {
    added: "Unicode sets mode enabled — extended character class syntax active",
    removed: "Unicode sets mode disabled",
    importance: "low",
  },
};

function collectFlagSummaries(diff: RegexDiff): BehaviorSummary[] {
  const summaries: BehaviorSummary[] = [];
  for (const change of diff.flags.changes) {
    const meta = FLAG_SUMMARIES[change.flag];
    if (!meta) continue;
    summaries.push({
      message: change.changeType === "added" ? meta.added : meta.removed,
      importance: meta.importance,
      source: "flags",
    });
  }
  return summaries;
}

// ── Structural summaries ─────────────────────────────────

function collectStructuralSummaries(diff: RegexDiff): BehaviorSummary[] {
  if (!diff.structural) return [];
  const summaries: BehaviorSummary[] = [];
  const seen = new Set<string>();

  function add(
    key: string,
    message: string,
    importance: BehaviorImportance,
  ) {
    if (seen.has(key)) return;
    seen.add(key);
    summaries.push({ message, importance, source: "structural" });
  }

  const allChanges = diff.structural.changes;

  function visit(change: StructuralChange) {
    if (change.kind === "equal") return;

    if (change.nodeType === "anchor") {
      if (change.kind === "added") {
        add(
          "anchor-added",
          "Anchor added — pattern now requires position match",
          "high",
        );
      } else if (change.kind === "removed") {
        add(
          "anchor-removed",
          "Anchor removed — pattern no longer position-bound",
          "high",
        );
      }
    }

    if (change.nodeType === "quantifier" && change.kind === "modified") {
      const rangeProp = change.propChanges?.find((p) => p.prop === "range");
      if (rangeProp) {
        add(
          "quantifier-range",
          "Repetition bounds changed — matches different count",
          "medium",
        );
      }
      const greedyProp = change.propChanges?.find(
        (p) => p.prop === "greedy",
      );
      if (greedyProp) {
        const wasGreedy = greedyProp.oldValue;
        add(
          "quantifier-greedy",
          wasGreedy
            ? "Quantifier changed from greedy to lazy — matches fewer characters"
            : "Quantifier changed from lazy to greedy — matches more characters",
          "medium",
        );
      }
    }

    if (change.nodeType === "dot") {
      if (change.kind === "added") {
        add(
          "dot-added",
          "Wildcard added — broader matching introduced",
          "high",
        );
      } else if (change.kind === "removed") {
        add(
          "dot-removed",
          "Wildcard removed — matching is more specific",
          "medium",
        );
      }
    }

    if (
      change.nodeType === "literal" &&
      change.kind === "removed" &&
      allChanges.some(
        (c) => c.nodeType === "dot" && c.kind === "added" && c.path === change.path,
      )
    ) {
      add(
        "literal-to-wildcard",
        "Literal replaced with wildcard — pattern matches more broadly",
        "high",
      );
    }

    if (change.nodeType === "charClass" && change.kind === "modified") {
      add(
        "charclass-modified",
        "Character class modified — matching range changed",
        "medium",
      );
    }

    if (change.nodeType === "charClass" && change.kind === "added") {
      add(
        "charclass-added",
        "Character class added — new set of characters matched",
        "medium",
      );
    }

    if (change.nodeType === "group") {
      if (change.kind === "added") {
        add("group-added", "Capture group added", "low");
      } else if (change.kind === "removed") {
        add("group-removed", "Capture group removed", "low");
      }
    }

    if (change.children) {
      for (const child of change.children) {
        visit(child);
      }
    }
  }

  for (const change of allChanges) {
    visit(change);
  }

  return summaries;
}

// ── Warning summaries ────────────────────────────────────

function collectWarningSummaries(diff: RegexDiff): BehaviorSummary[] {
  if (!diff.warnings) return [];
  const summaries: BehaviorSummary[] = [];

  for (const change of diff.warnings.changes) {
    if (change.kind === "added" && change.newWarning) {
      const importance =
        change.newWarning.severity === "danger" ? "high" : "medium";
      summaries.push({
        message: `New risk: ${change.newWarning.title}`,
        importance,
        source: "warnings",
      });
    } else if (change.kind === "removed" && change.oldWarning) {
      const importance =
        change.oldWarning.severity === "danger" ? "high" : "medium";
      summaries.push({
        message: `Risk resolved: ${change.oldWarning.title}`,
        importance,
        source: "warnings",
      });
    } else if (change.kind === "severity_changed") {
      const escalated =
        change.oldSeverity === "info" ||
        (change.oldSeverity === "warn" && change.newSeverity === "danger");
      summaries.push({
        message: escalated
          ? `Severity increased: ${change.newWarning?.title ?? change.warningId}`
          : `Severity decreased: ${change.newWarning?.title ?? change.warningId}`,
        importance: escalated ? "high" : "low",
        source: "warnings",
      });
    }
  }

  return summaries;
}

// ── Explanation summaries (fallback only) ────────────────

function collectExplanationSummaries(diff: RegexDiff): BehaviorSummary[] {
  // Only use explanation as fallback when structural diff is unavailable
  if (diff.structural || !diff.explanation) return [];

  const added = diff.explanation.changes.filter(
    (c) => c.kind === "added",
  ).length;
  const removed = diff.explanation.changes.filter(
    (c) => c.kind === "removed",
  ).length;

  const summaries: BehaviorSummary[] = [];
  if (added > 0) {
    summaries.push({
      message: `${added} new explanation step${added > 1 ? "s" : ""} — pattern has additional components`,
      importance: "low",
      source: "explanation",
    });
  }
  if (removed > 0) {
    summaries.push({
      message: `${removed} explanation step${removed > 1 ? "s" : ""} removed — pattern simplified`,
      importance: "low",
      source: "explanation",
    });
  }
  return summaries;
}

// ── Synthesis ────────────────────────────────────────────

export function synthesizeBehaviorSummary(
  diff: RegexDiff,
): BehaviorSummaryResult {
  const all: BehaviorSummary[] = [
    ...collectFlagSummaries(diff),
    ...collectStructuralSummaries(diff),
    ...collectWarningSummaries(diff),
    ...collectExplanationSummaries(diff),
  ];

  // Sort: importance first, then source priority
  all.sort((a, b) => {
    const impDiff = IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance];
    if (impDiff !== 0) return impDiff;
    return SOURCE_ORDER[a.source] - SOURCE_ORDER[b.source];
  });

  const summaries = all.slice(0, MAX_SUMMARIES);
  return { summaries, hasSummaries: summaries.length > 0 };
}
