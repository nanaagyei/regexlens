"use client";

import { useState, useRef, useCallback } from "react";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { WorkspaceProvider, useWorkspace } from "@/contexts/WorkspaceContext";
import { HoverSyncProvider } from "@/hooks/useHoverSync";
import { useHoverSync } from "@/hooks/useHoverSync";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { getShareUrl } from "@/hooks/useUrlState";
import { AppHeader } from "./AppHeader";
import { PatternSection, PatternSectionRef } from "./PatternSection";
import { TestSection } from "./TestSection";
import { AnalysisSection } from "./AnalysisSection";
import { WorkspaceModals } from "./WorkspaceModals";
import type { FixtureSuite } from "@/lib/fixtures/types";

export function AppShell() {
  return (
    <TooltipProvider delayDuration={300}>
      <HoverSyncProvider>
        <WorkspaceProvider>
          <AppShellLayout />
        </WorkspaceProvider>
      </HoverSyncProvider>
    </TooltipProvider>
  );
}

function AppShellLayout() {
  const patternSectionRef = useRef<PatternSectionRef>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedFixtureSuite, setSelectedFixtureSuite] = useState<FixtureSuite | null>(null);

  const { state, actions } = useWorkspace();
  const { clearAll } = useHoverSync();

  const handleFocusEditor = useCallback(() => {
    patternSectionRef.current?.focusEditor();
  }, []);

  const handleSelectFixtureSuite = useCallback(
    (suite: FixtureSuite) => {
      actions.applyFixtureSuite({
        regex: suite.regex,
        tests: suite.tests.map((t) => ({ input: t.input, regex: t.regex })),
      });
      setSelectedFixtureSuite(suite);
    },
    [actions]
  );

  const handleSelectFixtureTest = useCallback(
    (
      test: { input: string; regex?: { source: string; flags: string } },
      fallbackRegex?: { source: string; flags: string }
    ) => {
      actions.applyFixtureTest(test, fallbackRegex);
    },
    [actions]
  );

  const handleClearFixtureSuite = useCallback(() => {
    setSelectedFixtureSuite(null);
  }, []);

  // Keyboard shortcuts
  const handleClearSelection = useCallback(() => {
    clearAll();
  }, [clearAll]);

  const handleCopyShareLink = useCallback(async () => {
    try {
      const url = getShareUrl(state);
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.error("Failed to copy share link:", error);
    }
  }, [state]);

  const handleReparse = useCallback(() => {
    actions.setPattern(state.pattern);
  }, [actions, state.pattern]);

  useKeyboardShortcuts({
    onFocusEditor: handleFocusEditor,
    onReparse: handleReparse,
    onClearSelection: handleClearSelection,
    onCopyShareLink: handleCopyShareLink,
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      <AppHeader
        onSaveClick={() => setSaveModalOpen(true)}
        onLibraryClick={() => setLibraryOpen(true)}
        onSelectFixtureSuite={handleSelectFixtureSuite}
        onFocusEditor={handleFocusEditor}
      />

      <main className="flex-1 flex flex-col md:grid md:grid-cols-2 xl:grid-cols-[1fr_1.5fr_1.2fr] gap-3 sm:gap-4 p-3 sm:p-4 overflow-auto xl:overflow-hidden">
        <PatternSection ref={patternSectionRef} />
        <TestSection
          selectedFixtureSuite={selectedFixtureSuite}
          onSelectFixtureTest={handleSelectFixtureTest}
          onClearFixtureSuite={handleClearFixtureSuite}
        />
        <AnalysisSection />
      </main>

      <WorkspaceModals
        saveModalOpen={saveModalOpen}
        onSaveModalChange={setSaveModalOpen}
        libraryOpen={libraryOpen}
        onLibraryChange={setLibraryOpen}
        onFocusEditor={handleFocusEditor}
      />
    </div>
  );
}
