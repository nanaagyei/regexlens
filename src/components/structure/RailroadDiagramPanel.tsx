"use client";

import { useMemo } from "react";
import { ParseResult } from "@/types";
import { astToRailroadSvg } from "@/lib/railroad/astToRailroad";
import { cn } from "@/lib/utils";

interface RailroadDiagramPanelProps {
  parseResult: ParseResult;
  className?: string;
}

export function RailroadDiagramPanel({
  parseResult,
  className,
}: RailroadDiagramPanelProps) {
  const svgContent = useMemo(() => {
    if (!parseResult.ok) return null;
    try {
      return astToRailroadSvg(parseResult.ast);
    } catch {
      return null;
    }
  }, [parseResult]);

  if (!parseResult.ok) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12 px-4 text-center text-sm text-muted-foreground",
          className
        )}
      >
        <p>Enter a valid regex to see the railroad diagram.</p>
        {parseResult.errorMessage && (
          <p className="mt-2 text-xs">{parseResult.errorMessage}</p>
        )}
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12 px-4 text-center text-sm text-muted-foreground",
          className
        )}
      >
        <p>Could not generate diagram for this pattern.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-auto p-4 min-h-0",
        "bg-[hsl(30,20%,95%)] dark:bg-muted/30 rounded-lg",
        className
      )}
    >
      <div
        className="railroad-diagram-wrapper inline-block max-w-full"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
}
