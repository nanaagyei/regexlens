"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { FixtureSuite, FixtureTest } from "@/lib/fixtures/types";

interface FixtureSuitePanelProps {
  suite: FixtureSuite;
  currentTestInput?: string;
  onSelectTest: (test: FixtureTest, suiteRegex?: { source: string; flags: string }) => void;
  onClear: () => void;
}

function behaviorLabel(behavior: string | undefined): string {
  if (!behavior) return "";
  return behavior.replace(/_/g, " ");
}

export function FixtureSuitePanel({
  suite,
  currentTestInput,
  onSelectTest,
  onClear,
}: FixtureSuitePanelProps) {
  return (
    <div className="border-b border-border">
      <div className="flex items-center justify-between px-2 py-1.5 bg-muted/30">
        <span className="text-xs font-medium truncate">{suite.title}</span>
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      </div>
      <ScrollArea className="h-[100px] max-h-[100px]">
        <div className="p-1 space-y-0.5">
          {suite.tests.map((test) => {
            const isActive = currentTestInput === test.input;
            const behavior = test.expected?.behavior;
            return (
              <button
                key={test.id}
                type="button"
                onClick={() => onSelectTest(test, suite.regex)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded text-xs transition-colors",
                  "hover:bg-accent/50",
                  isActive && "bg-accent"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono truncate flex-1" title={test.input}>
                    {test.input.length > 40
                      ? `${test.input.slice(0, 37)}...`
                      : test.input}
                  </span>
                  {behavior && (
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1 py-0 shrink-0"
                    >
                      {behaviorLabel(behavior)}
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
