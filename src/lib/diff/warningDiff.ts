/**
 * Warning diff — compares two warning arrays by id to detect
 * additions, removals, and severity changes.
 */

import type { Warning } from "@/types/warnings";
import type { WarningChange, WarningDiff } from "@/types/diff";

export function computeWarningDiff(
  oldWarnings: Warning[],
  newWarnings: Warning[],
): WarningDiff {
  const oldMap = new Map<string, Warning>();
  for (const w of oldWarnings) oldMap.set(w.id, w);

  const newMap = new Map<string, Warning>();
  for (const w of newWarnings) newMap.set(w.id, w);

  const changes: WarningChange[] = [];

  // Removed or severity-changed
  for (const [id, oldW] of oldMap) {
    const newW = newMap.get(id);
    if (!newW) {
      changes.push({ kind: "removed", warningId: id, oldWarning: oldW });
    } else if (oldW.severity !== newW.severity) {
      changes.push({
        kind: "severity_changed",
        warningId: id,
        oldWarning: oldW,
        newWarning: newW,
        oldSeverity: oldW.severity,
        newSeverity: newW.severity,
      });
    }
  }

  // Added
  for (const [id, newW] of newMap) {
    if (!oldMap.has(id)) {
      changes.push({ kind: "added", warningId: id, newWarning: newW });
    }
  }

  return { changes, hasChanges: changes.length > 0 };
}
