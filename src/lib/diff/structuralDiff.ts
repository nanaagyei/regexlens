import type {
  ComparableNode,
  ComparableNodeType,
  AnchorProps,
  LiteralProps,
  EscapeProps,
  CharClassProps,
  CharClassMember,
  GroupProps,
  QuantifierProps,
  AssertionProps,
  BackreferenceProps,
} from "@/types/ast";
import type {
  StructuralDiff,
  StructuralChange,
  StructuralChangeKind,
  PropChange,
} from "@/types/diff";

/**
 * Compute a structural diff between two normalized AST trees.
 *
 * Uses hybrid key-based + positional matching:
 * 1. Group children by key
 * 2. Match same-key children positionally (handles duplicates)
 * 3. Recurse into matched pairs to detect deep modifications
 */
export function computeStructuralDiff(
  oldTree: ComparableNode,
  newTree: ComparableNode,
): StructuralDiff {
  const changes = diffNode(oldTree, newTree, "");
  const meaningful = flattenMeaningful(changes);
  const counts = { added: 0, removed: 0, modified: 0 };
  for (const c of meaningful) {
    if (c.kind === "added") counts.added++;
    else if (c.kind === "removed") counts.removed++;
    else if (c.kind === "modified") counts.modified++;
  }

  return {
    changes,
    hasChanges: meaningful.length > 0,
    summary: `${counts.added} added, ${counts.removed} removed, ${counts.modified} modified`,
  };
}

/** Collect all non-equal changes from a nested tree. */
function flattenMeaningful(changes: StructuralChange[]): StructuralChange[] {
  const result: StructuralChange[] = [];
  for (const c of changes) {
    if (c.kind !== "equal") result.push(c);
    if (c.children) result.push(...flattenMeaningful(c.children));
  }
  return result;
}

// ── Core recursive diff ──────────────────────────────────────

function diffNode(
  oldNode: ComparableNode,
  newNode: ComparableNode,
  parentPath: string,
): StructuralChange[] {
  const path = parentPath
    ? `${parentPath} > ${nodeLabel(newNode)}`
    : nodeLabel(newNode);

  // Different types → replacement (remove old + add new)
  if (oldNode.type !== newNode.type) {
    return [
      makeChange("removed", oldNode.type, path, oldNode, undefined, describeRemoved(oldNode)),
      makeChange("added", newNode.type, path, undefined, newNode, describeAdded(newNode)),
    ];
  }

  // Same type → compare props and recurse into children
  const propChanges = compareProps(oldNode, newNode);
  const childChanges = diffChildren(oldNode, newNode, path);

  if (propChanges.length === 0 && childChanges.length === 0) {
    return [];
  }

  if (propChanges.length > 0) {
    return [
      {
        kind: "modified",
        nodeType: newNode.type,
        path,
        oldNode,
        newNode,
        description: describeModified(oldNode, newNode, propChanges),
        propChanges,
        children: childChanges.length > 0 ? childChanges : undefined,
      },
    ];
  }

  // Only child changes, no prop changes on this node
  return childChanges;
}

// ── Child matching ───────────────────────────────────────────

function diffChildren(
  oldNode: ComparableNode,
  newNode: ComparableNode,
  parentPath: string,
): StructuralChange[] {
  const oldChildren = oldNode.children;
  const newChildren = newNode.children;

  if (oldChildren.length === 0 && newChildren.length === 0) {
    return [];
  }

  // For alternation nodes, use fingerprint-based matching to handle reordering
  if (oldNode.type === "alternation") {
    return diffAlternationBranches(oldChildren, newChildren, parentPath);
  }

  return matchChildrenByKey(oldChildren, newChildren, parentPath);
}

/**
 * Match children using key-based grouping with positional tiebreaking,
 * then fall back to type-based matching for remaining unmatched nodes.
 */
function matchChildrenByKey(
  oldChildren: ComparableNode[],
  newChildren: ComparableNode[],
  parentPath: string,
): StructuralChange[] {
  const changes: StructuralChange[] = [];

  // Group by key
  const oldByKey = groupByKey(oldChildren);
  const newByKey = groupByKey(newChildren);
  const allKeys = new Set([...oldByKey.keys(), ...newByKey.keys()]);

  // Track processed nodes
  const processedOld = new Set<number>();
  const processedNew = new Set<number>();

  // Phase 1: Match by exact key
  for (const key of allKeys) {
    const oldGroup = oldByKey.get(key) ?? [];
    const newGroup = newByKey.get(key) ?? [];
    const matchCount = Math.min(oldGroup.length, newGroup.length);

    for (let i = 0; i < matchCount; i++) {
      processedOld.add(oldGroup[i].index);
      processedNew.add(newGroup[i].index);
      changes.push(...diffNode(oldGroup[i].node, newGroup[i].node, parentPath));
    }

    // Mark excess as unmatched (don't emit yet — Phase 2 may pair them)
    for (let i = matchCount; i < oldGroup.length; i++) processedOld.add(oldGroup[i].index);
    for (let i = matchCount; i < newGroup.length; i++) processedNew.add(newGroup[i].index);
  }

  // Collect truly unmatched nodes (those processed by key but with no pair)
  const unmatchedOld: ComparableNode[] = [];
  const unmatchedNew: ComparableNode[] = [];
  for (let i = 0; i < oldChildren.length; i++) {
    if (!isKeyMatched(oldChildren[i].key, oldByKey, newByKey)) {
      unmatchedOld.push(oldChildren[i]);
    }
  }
  for (let i = 0; i < newChildren.length; i++) {
    if (!isKeyMatched(newChildren[i].key, newByKey, oldByKey)) {
      unmatchedNew.push(newChildren[i]);
    }
  }

  // Phase 2: Match remaining unmatched by type (modification detection)
  const typeMatchedOld = new Set<number>();
  const typeMatchedNew = new Set<number>();

  for (let oi = 0; oi < unmatchedOld.length; oi++) {
    if (typeMatchedOld.has(oi)) continue;
    for (let ni = 0; ni < unmatchedNew.length; ni++) {
      if (typeMatchedNew.has(ni)) continue;
      if (unmatchedOld[oi].type === unmatchedNew[ni].type) {
        typeMatchedOld.add(oi);
        typeMatchedNew.add(ni);
        // Same type, different key → recurse to find prop changes
        changes.push(...diffNode(unmatchedOld[oi], unmatchedNew[ni], parentPath));
        break;
      }
    }
  }

  // Remaining unmatched old → removed
  for (let i = 0; i < unmatchedOld.length; i++) {
    if (typeMatchedOld.has(i)) continue;
    const node = unmatchedOld[i];
    const path = parentPath ? `${parentPath} > ${nodeLabel(node)}` : nodeLabel(node);
    changes.push(makeChange("removed", node.type, path, node, undefined, describeRemoved(node)));
  }

  // Remaining unmatched new → added
  for (let i = 0; i < unmatchedNew.length; i++) {
    if (typeMatchedNew.has(i)) continue;
    const node = unmatchedNew[i];
    const path = parentPath ? `${parentPath} > ${nodeLabel(node)}` : nodeLabel(node);
    changes.push(makeChange("added", node.type, path, undefined, node, describeAdded(node)));
  }

  return changes;
}

/** Check if a key exists in the counterpart grouping (i.e., was matched by key). */
function isKeyMatched(
  key: string,
  _ownGroup: Map<string, IndexedNode[]>,
  otherGroup: Map<string, IndexedNode[]>,
): boolean {
  return otherGroup.has(key);
}

interface IndexedNode {
  node: ComparableNode;
  index: number;
}

function groupByKey(nodes: ComparableNode[]): Map<string, IndexedNode[]> {
  const map = new Map<string, IndexedNode[]>();
  for (let i = 0; i < nodes.length; i++) {
    const key = nodes[i].key;
    const group = map.get(key);
    if (group) {
      group.push({ node: nodes[i], index: i });
    } else {
      map.set(key, [{ node: nodes[i], index: i }]);
    }
  }
  return map;
}

/**
 * For alternation branches, match by content fingerprint rather than position
 * to avoid false positives on reordering.
 */
function diffAlternationBranches(
  oldBranches: ComparableNode[],
  newBranches: ComparableNode[],
  parentPath: string,
): StructuralChange[] {
  const changes: StructuralChange[] = [];

  const oldFingerprints = oldBranches.map(fingerprint);
  const newFingerprints = newBranches.map(fingerprint);

  const matchedOld = new Set<number>();
  const matchedNew = new Set<number>();

  // Match by fingerprint
  for (let oi = 0; oi < oldFingerprints.length; oi++) {
    for (let ni = 0; ni < newFingerprints.length; ni++) {
      if (matchedNew.has(ni)) continue;
      if (oldFingerprints[oi] === newFingerprints[ni]) {
        matchedOld.add(oi);
        matchedNew.add(ni);
        // Recurse for deep changes
        changes.push(...diffNode(oldBranches[oi], newBranches[ni], parentPath));
        break;
      }
    }
  }

  // Unmatched old → removed
  for (let i = 0; i < oldBranches.length; i++) {
    if (!matchedOld.has(i)) {
      const node = oldBranches[i];
      const path = parentPath
        ? `${parentPath} > ${nodeLabel(node)}`
        : nodeLabel(node);
      changes.push(
        makeChange("removed", node.type, path, node, undefined, describeRemoved(node)),
      );
    }
  }

  // Unmatched new → added
  for (let i = 0; i < newBranches.length; i++) {
    if (!matchedNew.has(i)) {
      const node = newBranches[i];
      const path = parentPath
        ? `${parentPath} > ${nodeLabel(node)}`
        : nodeLabel(node);
      changes.push(
        makeChange("added", node.type, path, undefined, node, describeAdded(node)),
      );
    }
  }

  return changes;
}

/** Build a content fingerprint by concatenating descendant keys. */
function fingerprint(node: ComparableNode): string {
  const parts: string[] = [node.key];
  for (const child of node.children) {
    parts.push(fingerprint(child));
  }
  return parts.join("|");
}

// ── Prop comparison ──────────────────────────────────────────

function compareProps(
  oldNode: ComparableNode,
  newNode: ComparableNode,
): PropChange[] {
  switch (oldNode.type) {
    case "anchor":
      return compareAnchorProps(
        oldNode.props as AnchorProps,
        newNode.props as AnchorProps,
      );
    case "literal":
      return compareLiteralProps(
        oldNode.props as LiteralProps,
        newNode.props as LiteralProps,
      );
    case "escape":
      return compareEscapeProps(
        oldNode.props as EscapeProps,
        newNode.props as EscapeProps,
      );
    case "charClass":
      return compareCharClassProps(
        oldNode.props as CharClassProps,
        newNode.props as CharClassProps,
      );
    case "group":
      return compareGroupProps(
        oldNode.props as GroupProps,
        newNode.props as GroupProps,
      );
    case "quantifier":
      return compareQuantifierProps(
        oldNode.props as QuantifierProps,
        newNode.props as QuantifierProps,
      );
    case "assertion":
      return compareAssertionProps(
        oldNode.props as AssertionProps,
        newNode.props as AssertionProps,
      );
    case "backreference":
      return compareBackreferenceProps(
        oldNode.props as BackreferenceProps,
        newNode.props as BackreferenceProps,
      );
    default:
      return [];
  }
}

function compareAnchorProps(oldP: AnchorProps, newP: AnchorProps): PropChange[] {
  if (oldP.kind !== newP.kind) {
    return [{
      prop: "kind",
      oldValue: oldP.kind,
      newValue: newP.kind,
      description: `Anchor changed from ${anchorLabel(oldP.kind)} to ${anchorLabel(newP.kind)}`,
    }];
  }
  return [];
}

function compareLiteralProps(oldP: LiteralProps, newP: LiteralProps): PropChange[] {
  if (oldP.value !== newP.value) {
    return [{
      prop: "value",
      oldValue: oldP.value,
      newValue: newP.value,
      description: `Literal changed from "${oldP.value}" to "${newP.value}"`,
    }];
  }
  return [];
}

function compareEscapeProps(oldP: EscapeProps, newP: EscapeProps): PropChange[] {
  const changes: PropChange[] = [];
  if (oldP.escapeType !== newP.escapeType) {
    changes.push({
      prop: "escapeType",
      oldValue: oldP.escapeType,
      newValue: newP.escapeType,
      description: `Escape type changed from ${oldP.escapeType} to ${newP.escapeType}`,
    });
  }
  if (oldP.raw !== newP.raw) {
    changes.push({
      prop: "raw",
      oldValue: oldP.raw,
      newValue: newP.raw,
      description: `Escape changed from ${oldP.raw} to ${newP.raw}`,
    });
  }
  return changes;
}

function compareCharClassProps(oldP: CharClassProps, newP: CharClassProps): PropChange[] {
  const changes: PropChange[] = [];

  if (oldP.negated !== newP.negated) {
    changes.push({
      prop: "negated",
      oldValue: oldP.negated,
      newValue: newP.negated,
      description: newP.negated
        ? "Character class changed to negated"
        : "Character class changed to non-negated",
    });
  }

  const oldMembers = new Set(oldP.members.map(memberKey));
  const newMembers = new Set(newP.members.map(memberKey));

  const added = [...newMembers].filter((m) => !oldMembers.has(m));
  const removed = [...oldMembers].filter((m) => !newMembers.has(m));

  if (added.length > 0 || removed.length > 0) {
    const parts: string[] = [];
    if (added.length > 0) parts.push(`added ${added.join(", ")}`);
    if (removed.length > 0) parts.push(`removed ${removed.join(", ")}`);

    changes.push({
      prop: "members",
      oldValue: [...oldMembers],
      newValue: [...newMembers],
      description: `Character class ${parts.join("; ")}`,
    });
  }

  return changes;
}

function memberKey(m: CharClassMember): string {
  return m.type === "range" ? `${m.from}-${m.to}` : m.value;
}

function compareGroupProps(oldP: GroupProps, newP: GroupProps): PropChange[] {
  const changes: PropChange[] = [];

  if (oldP.capturing !== newP.capturing) {
    changes.push({
      prop: "capturing",
      oldValue: oldP.capturing,
      newValue: newP.capturing,
      description: newP.capturing
        ? "Group changed from non-capturing to capturing"
        : "Group changed from capturing to non-capturing",
    });
  }

  if (oldP.name !== newP.name) {
    changes.push({
      prop: "name",
      oldValue: oldP.name,
      newValue: newP.name,
      description: `Group name changed from "${oldP.name ?? "none"}" to "${newP.name ?? "none"}"`,
    });
  }

  return changes;
}

function compareQuantifierProps(oldP: QuantifierProps, newP: QuantifierProps): PropChange[] {
  const changes: PropChange[] = [];

  if (oldP.min !== newP.min || oldP.max !== newP.max) {
    changes.push({
      prop: "range",
      oldValue: { min: oldP.min, max: oldP.max },
      newValue: { min: newP.min, max: newP.max },
      description: `Quantifier changed from ${quantifierLabel(oldP.min, oldP.max)} to ${quantifierLabel(newP.min, newP.max)}`,
    });
  }

  if (oldP.greedy !== newP.greedy) {
    changes.push({
      prop: "greedy",
      oldValue: oldP.greedy,
      newValue: newP.greedy,
      description: newP.greedy
        ? "Quantifier changed from lazy to greedy"
        : "Quantifier changed from greedy to lazy",
    });
  }

  return changes;
}

function compareAssertionProps(oldP: AssertionProps, newP: AssertionProps): PropChange[] {
  const changes: PropChange[] = [];

  if (oldP.assertionType !== newP.assertionType) {
    changes.push({
      prop: "assertionType",
      oldValue: oldP.assertionType,
      newValue: newP.assertionType,
      description: `Assertion type changed from ${oldP.assertionType} to ${newP.assertionType}`,
    });
  }

  if (oldP.polarity !== newP.polarity) {
    changes.push({
      prop: "polarity",
      oldValue: oldP.polarity,
      newValue: newP.polarity,
      description: `Assertion polarity changed from ${oldP.polarity} to ${newP.polarity}`,
    });
  }

  return changes;
}

function compareBackreferenceProps(oldP: BackreferenceProps, newP: BackreferenceProps): PropChange[] {
  const changes: PropChange[] = [];

  if (oldP.groupNumber !== newP.groupNumber) {
    changes.push({
      prop: "groupNumber",
      oldValue: oldP.groupNumber,
      newValue: newP.groupNumber,
      description: `Backreference target changed from group ${oldP.groupNumber} to group ${newP.groupNumber}`,
    });
  }

  if (oldP.groupName !== newP.groupName) {
    changes.push({
      prop: "groupName",
      oldValue: oldP.groupName,
      newValue: newP.groupName,
      description: `Backreference name changed from "${oldP.groupName ?? "none"}" to "${newP.groupName ?? "none"}"`,
    });
  }

  return changes;
}

// ── Human-readable descriptions ──────────────────────────────

function describeAdded(node: ComparableNode): string {
  switch (node.type) {
    case "anchor":
      return `${anchorLabel((node.props as AnchorProps).kind)} anchor added`;
    case "literal":
      return `Literal "${(node.props as LiteralProps).value}" added`;
    case "escape":
      return `Escape ${(node.props as EscapeProps).raw} added`;
    case "charClass": {
      const p = node.props as CharClassProps;
      return `Character class [${p.members.map(memberKey).join("")}]${p.negated ? " (negated)" : ""} added`;
    }
    case "group": {
      const p = node.props as GroupProps;
      return p.capturing
        ? `Capturing group${p.name ? ` "${p.name}"` : ""} added`
        : "Non-capturing group added";
    }
    case "quantifier": {
      const p = node.props as QuantifierProps;
      return `Quantifier ${quantifierLabel(p.min, p.max)} added`;
    }
    case "dot":
      return "Wildcard dot (.) added";
    case "alternation":
      return "Alternation added";
    case "alternative":
      return `Branch "${truncateText(node.text, 30)}" added`;
    case "assertion": {
      const p = node.props as AssertionProps;
      return `${p.polarity} ${p.assertionType} assertion added`;
    }
    case "backreference": {
      const p = node.props as BackreferenceProps;
      return p.groupName
        ? `Backreference to "${p.groupName}" added`
        : `Backreference to group ${p.groupNumber} added`;
    }
    default:
      return `${node.type} added`;
  }
}

function describeRemoved(node: ComparableNode): string {
  switch (node.type) {
    case "anchor":
      return `${anchorLabel((node.props as AnchorProps).kind)} anchor removed`;
    case "literal":
      return `Literal "${(node.props as LiteralProps).value}" removed`;
    case "escape":
      return `Escape ${(node.props as EscapeProps).raw} removed`;
    case "charClass": {
      const p = node.props as CharClassProps;
      return `Character class [${p.members.map(memberKey).join("")}]${p.negated ? " (negated)" : ""} removed`;
    }
    case "group": {
      const p = node.props as GroupProps;
      return p.capturing
        ? `Capturing group${p.name ? ` "${p.name}"` : ""} removed`
        : "Non-capturing group removed";
    }
    case "quantifier": {
      const p = node.props as QuantifierProps;
      return `Quantifier ${quantifierLabel(p.min, p.max)} removed`;
    }
    case "dot":
      return "Wildcard dot (.) removed";
    case "alternation":
      return "Alternation removed";
    case "alternative":
      return `Branch "${truncateText(node.text, 30)}" removed`;
    case "assertion": {
      const p = node.props as AssertionProps;
      return `${p.polarity} ${p.assertionType} assertion removed`;
    }
    case "backreference": {
      const p = node.props as BackreferenceProps;
      return p.groupName
        ? `Backreference to "${p.groupName}" removed`
        : `Backreference to group ${p.groupNumber} removed`;
    }
    default:
      return `${node.type} removed`;
  }
}

function describeModified(
  _oldNode: ComparableNode,
  _newNode: ComparableNode,
  propChanges: PropChange[],
): string {
  return propChanges.map((c) => c.description).join("; ");
}

// ── Helpers ──────────────────────────────────────────────────

function makeChange(
  kind: StructuralChangeKind,
  nodeType: ComparableNodeType,
  path: string,
  oldNode: ComparableNode | undefined,
  newNode: ComparableNode | undefined,
  description: string,
): StructuralChange {
  return { kind, nodeType, path, oldNode, newNode, description };
}

function nodeLabel(node: ComparableNode): string {
  if (node.type === "literal") return `literal:${(node.props as LiteralProps).value}`;
  if (node.type === "anchor") return `anchor:${(node.props as AnchorProps).kind}`;
  return node.type;
}

function anchorLabel(kind: AnchorProps["kind"]): string {
  switch (kind) {
    case "start": return "Start-of-input (^)";
    case "end": return "End-of-input ($)";
    case "wordBoundary": return "Word boundary (\\b)";
    case "nonWordBoundary": return "Non-word boundary (\\B)";
  }
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "…";
}

function quantifierLabel(min: number, max: number | null): string {
  if (min === 0 && max === null) return "* (zero or more)";
  if (min === 1 && max === null) return "+ (one or more)";
  if (min === 0 && max === 1) return "? (optional)";
  if (max === null) return `{${min},} (${min} or more)`;
  if (min === max) return `{${min}} (exactly ${min})`;
  return `{${min},${max}} (${min} to ${max})`;
}
