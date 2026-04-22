"use client";

import { ParseResult } from "@/types";
import { AstTree } from "./AstTree";
import { TreeDeciduous } from "lucide-react";

interface AstPanelProps {
  parseResult: ParseResult;
}

export function AstPanel({ parseResult }: AstPanelProps) {
  // Empty state - no pattern
  if (!parseResult.ok && !parseResult.errorMessage) {
    return (
      <EmptyState
        icon={<TreeDeciduous className="h-8 w-8" />}
        title="No structure to inspect"
        description="Paste a pattern to inspect its syntax tree"
      />
    );
  }

  // Error state
  if (!parseResult.ok) {
    return (
      <EmptyState
        icon={<TreeDeciduous className="h-8 w-8 text-red-400" />}
        title="Invalid pattern"
        description="Fix the pattern to inspect its structure"
        variant="error"
      />
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Pattern structure
      </h3>
      <AstTree ast={parseResult.ast} />
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: "default" | "error";
}

function EmptyState({
  icon,
  title,
  description,
  variant = "default",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="text-muted-foreground mb-3">{icon}</div>
      <h3 className="text-sm font-medium mb-1">{title}</h3>
      <p
        className={`text-xs ${
          variant === "error" ? "text-red-400" : "text-muted-foreground"
        }`}
      >
        {description}
      </p>
    </div>
  );
}
