"use client";

import { useRef, useCallback } from "react";
import { Panel, PanelContent } from "./Panel";
import { TestTextEditor, TestTextEditorRef } from "@/components/testbench/TestTextEditor";
import { MatchList } from "@/components/testbench/MatchList";
import { FixtureSuitePanel } from "@/components/fixtures/FixtureSuitePanel";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { REGEX_CONFIG } from "@/types";
import { setHoveredMatchIndex } from "@/lib/stores/hoverStore";
import type { FixtureSuite } from "@/lib/fixtures/types";

interface TestSectionProps {
  selectedFixtureSuite: FixtureSuite | null;
  onSelectFixtureTest: (
    test: { input: string; regex?: { source: string; flags: string } },
    fallbackRegex?: { source: string; flags: string }
  ) => void;
  onClearFixtureSuite: () => void;
}

export function TestSection({
  selectedFixtureSuite,
  onSelectFixtureTest,
  onClearFixtureSuite,
}: TestSectionProps) {
  const testTextEditorRef = useRef<TestTextEditorRef>(null);
  const { state, actions, matchResult, failureAnalysis } = useWorkspace();
  const handleMatchClick = useCallback(
    (index: number, start: number, end: number) => {
      setHoveredMatchIndex(index);
      testTextEditorRef.current?.scrollToMatch(start, end);
    },
    []
  );

  return (
    <div className="flex flex-col gap-3 sm:gap-4 min-h-0 shrink-0">
      <Panel title="Test Text" className="flex-[2] min-h-[120px] sm:min-h-[150px] xl:min-h-0">
        <PanelContent className="p-0">
          {state.text.length > REGEX_CONFIG.MAX_TEXT_LENGTH && (
            <div
              className="border-b border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
              role="status"
            >
              Sample text is longer than{" "}
              {REGEX_CONFIG.MAX_TEXT_LENGTH.toLocaleString()} characters. Matching,
              highlights, and related checks use only the first{" "}
              {REGEX_CONFIG.MAX_TEXT_LENGTH.toLocaleString()} characters for performance.
            </div>
          )}
          {selectedFixtureSuite && (
            <FixtureSuitePanel
              suite={selectedFixtureSuite}
              currentTestInput={state.text}
              onSelectTest={onSelectFixtureTest}
              onClear={onClearFixtureSuite}
            />
          )}
          <TestTextEditor
            ref={testTextEditorRef}
            value={state.text}
            onChange={actions.setText}
            matches={matchResult}
            pattern={state.pattern}
            flags={state.flags}
            failureAnalysis={failureAnalysis}
          />
        </PanelContent>
      </Panel>

      <Panel
        title="Matches"
        actions={
          matchResult.matches.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {matchResult.totalCount} match
              {matchResult.totalCount !== 1 ? "es" : ""}
              {matchResult.matchLimitReached === true && " (match cap)"}
              {matchResult.sampleTruncated === true && " (sample cap)"}
            </span>
          )
        }
        className="flex-1 min-h-[80px] sm:min-h-[100px]"
      >
        <PanelContent>
          <MatchList matches={matchResult} onMatchClick={handleMatchClick} />
        </PanelContent>
      </Panel>
    </div>
  );
}
