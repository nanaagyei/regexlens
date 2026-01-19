"use client";

import { useState } from "react";
import { AstNode } from "@/types";
import { AstNodeRow } from "./AstNodeRow";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AstTreeProps {
  ast: AstNode;
}

export function AstTree({ ast }: AstTreeProps) {
  return (
    <div className="font-mono text-xs">
      <AstNodeTree node={ast} depth={0} />
    </div>
  );
}

interface AstNodeTreeProps {
  node: AstNode | AstNode[];
  depth: number;
}

function AstNodeTree({ node, depth }: AstNodeTreeProps) {
  if (Array.isArray(node)) {
    return (
      <>
        {node.map((n, i) => (
          <AstNodeTree key={i} node={n} depth={depth} />
        ))}
      </>
    );
  }

  const children = getNodeChildren(node);
  const hasChildren = children.length > 0;

  if (!hasChildren) {
    return <AstNodeRow node={node} depth={depth} />;
  }

  return (
    <CollapsibleNode node={node} depth={depth}>
      {children.map((child, i) => (
        <AstNodeTree key={i} node={child} depth={depth + 1} />
      ))}
    </CollapsibleNode>
  );
}

interface CollapsibleNodeProps {
  node: AstNode;
  depth: number;
  children: React.ReactNode;
}

function CollapsibleNode({ node, depth, children }: CollapsibleNodeProps) {
  const [isOpen, setIsOpen] = useState(depth < 3);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div
          className={cn(
            "flex items-center gap-1 py-1 px-2 rounded hover:bg-accent/50 transition-colors",
            "cursor-pointer"
          )}
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 text-muted-foreground transition-transform",
              isOpen && "rotate-90"
            )}
          />
          <AstNodeRow node={node} depth={0} inline />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}

function getNodeChildren(node: AstNode): (AstNode | AstNode[])[] {
  const children: (AstNode | AstNode[])[] = [];

  if (node.body) {
    if (Array.isArray(node.body)) {
      children.push(...node.body);
    } else {
      children.push(node.body);
    }
  }
  if (node.expression) {
    children.push(node.expression);
  }
  if (node.expressions) {
    children.push(...node.expressions);
  }
  if (node.left) {
    children.push(node.left);
  }
  if (node.right) {
    children.push(node.right);
  }

  return children;
}
