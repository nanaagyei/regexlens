"use client";

import { AstNode } from "@/types";
import { useHoverSync } from "@/hooks/useHoverSync";
import { getNodeRange } from "@/lib/regex/parse";
import { cn } from "@/lib/utils";

interface AstNodeRowProps {
  node: AstNode;
  depth: number;
  inline?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  RegExp: "text-gray-400",
  Alternative: "text-gray-400",
  Disjunction: "text-yellow-400",
  Group: "text-amber-400",
  Repetition: "text-violet-400",
  Quantifier: "text-violet-400",
  CharacterClass: "text-rose-400",
  ClassRange: "text-rose-400",
  Char: "text-blue-400",
  Assertion: "text-emerald-400",
  Backreference: "text-cyan-400",
};

export function AstNodeRow({ node, depth, inline = false }: AstNodeRowProps) {
  const { setHoveredRange } = useHoverSync();
  const range = getNodeRange(node);

  const handleMouseEnter = () => {
    if (range) {
      setHoveredRange(range);
    }
  };

  const handleMouseLeave = () => {
    setHoveredRange(null);
  };

  const typeColor = TYPE_COLORS[node.type] || "text-gray-300";
  const summary = getNodeSummary(node);

  if (inline) {
    return (
      <span
        className="flex items-center gap-2"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className={cn("font-medium", typeColor)}>{node.type}</span>
        {summary && (
          <span className="text-muted-foreground">{summary}</span>
        )}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 py-1 px-2 rounded hover:bg-accent/50 transition-colors"
      )}
      style={{ paddingLeft: `${depth * 12 + 16}px` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className={cn("font-medium", typeColor)}>{node.type}</span>
      {summary && (
        <span className="text-muted-foreground">{summary}</span>
      )}
    </div>
  );
}

function getNodeSummary(node: AstNode): string | null {
  switch (node.type) {
    case "Char":
      if (node.escaped) {
        return `\\${node.value || node.symbol || ""}`;
      }
      return node.value ? `"${node.value}"` : null;

    case "Quantifier":
      if (node.kind_ === "Range") {
        const from = node.from ?? 0;
        const to = node.to;
        if (to === undefined) return `{${from},}`;
        if (from === to) return `{${from}}`;
        return `{${from},${to}}`;
      }
      return node.kind_ || null;

    case "Group":
      if (node.name) return `(?<${node.name}>)`;
      if (node.capturing === false) return "(?:)";
      if (node.number !== undefined) return `#${node.number}`;
      return null;

    case "CharacterClass":
      return node.negative ? "[^...]" : "[...]";

    case "ClassRange": {
      // ClassRange nodes have from/to as child AstNodes, not numbers
      const fromNode = (node as unknown as { from: AstNode }).from;
      const toNode = (node as unknown as { to: AstNode }).to;
      return `${fromNode?.value || "?"}-${toNode?.value || "?"}`;
    }

    case "Assertion":
      return node.kind || null;

    case "Backreference":
      return `\\${node.reference || node.referenceRaw}`;

    case "Disjunction":
      return "|";

    default:
      return null;
  }
}
