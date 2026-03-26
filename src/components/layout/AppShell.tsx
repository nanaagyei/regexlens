"use client";

import { useState, useRef, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SegmentedControl,
  SegmentedControlTrigger,
} from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Panel, PanelContent } from "./Panel";
import { RegexEditor, RegexEditorRef } from "@/components/regex/RegexEditor";
import { FlagsToggle } from "@/components/regex/FlagsToggle";
import { TokenToolbar } from "@/components/regex/TokenToolbar";
import { ParseStatus } from "@/components/regex/ParseStatus";
import { TestTextEditor, TestTextEditorRef } from "@/components/testbench/TestTextEditor";
import { MatchList } from "@/components/testbench/MatchList";
import { ExplanationPanel } from "@/components/explain/ExplanationPanel";
import { AstPanel } from "@/components/structure/AstPanel";
import { RailroadDiagramPanel } from "@/components/structure/RailroadDiagramPanel";
import { WarningsPanel } from "@/components/warnings/WarningsPanel";
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel";
import { TemplatePicker } from "@/components/templates/TemplatePicker";
import { FixturePicker } from "@/components/fixtures/FixturePicker";
import { FixtureSuitePanel } from "@/components/fixtures/FixtureSuitePanel";
import { ShareBar } from "@/components/share/ShareBar";
import { UserMenu } from "./UserMenu";
import { HoverSyncProvider, useHoverSync } from "@/hooks/useHoverSync";
import { useRegexState } from "@/hooks/useRegexState";
import { useRegexParse } from "@/hooks/useRegexParse";
import { useRegexMatches, FIXTURE_TIMEOUT_MS } from "@/hooks/useRegexMatches";
import { useExplanation } from "@/hooks/useExplanation";
import { useWarnings } from "@/hooks/useWarnings";
import { useUrlState } from "@/hooks/useUrlState";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { getShareUrl } from "@/hooks/useUrlState";
import { SavedLibrary, SaveSnippetModal } from "@/components/library";
import {
  FileText,
  AlertTriangle,
  TreeDeciduous,
  RotateCcw,
  BookText,
  Save,
  FolderOpen,
  Share2,
  MoreHorizontal,
  Search,
  Route,
} from "lucide-react";
import type { FixtureSuite } from "@/lib/fixtures/types";
import Link from "next/link";
import Image from "next/image";

export function AppShell() {
  return (
    <TooltipProvider delayDuration={300}>
      <HoverSyncProvider>
        <AppShellContent />
      </HoverSyncProvider>
    </TooltipProvider>
  );
}

function AppShellContent() {
  const [activeTab, setActiveTab] = useState("explanation");
  const regexEditorRef = useRef<RegexEditorRef>(null);
  const testTextEditorRef = useRef<TestTextEditorRef>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedFixtureSuite, setSelectedFixtureSuite] =
    useState<FixtureSuite | null>(null);

  // Core state and hooks
  const { state, actions } = useRegexState();
  const parseResult = useRegexParse(state.pattern, state.flags);
  const matchResult = useRegexMatches(
    state.pattern,
    state.flags,
    state.text,
    parseResult.ok,
    undefined,
    selectedFixtureSuite?.category === "performance_safety"
      ? FIXTURE_TIMEOUT_MS
      : undefined
  );
  const explanationResult = useExplanation(parseResult);
  const warningsResult = useWarnings(state.pattern, state.flags, parseResult, matchResult);
  const { clearAll, setHoveredMatchIndex } = useHoverSync();

  // URL state sync
  useUrlState(state, actions);

  // Keyboard shortcut handlers
  const handleFocusEditor = useCallback(() => {
    regexEditorRef.current?.focus();
  }, []);

  const handleReparse = useCallback(() => {
    // Force re-render by setting the same pattern (triggers debounced parse)
    actions.setPattern(state.pattern);
  }, [actions, state.pattern]);

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

  // Wire up keyboard shortcuts
  useKeyboardShortcuts({
    onFocusEditor: handleFocusEditor,
    onReparse: handleReparse,
    onClearSelection: handleClearSelection,
    onCopyShareLink: handleCopyShareLink,
  });

  // Handler for loading a snippet from the library
  const handleLoadSnippet = useCallback(
    (pattern: string, flags: string) => {
      actions.setPattern(pattern);
      actions.setFlags(flags);
      handleFocusEditor();
    },
    [actions, handleFocusEditor]
  );

  // Handler for when a snippet is saved
  const handleSnippetSaved = useCallback(() => {
    // Could refresh library or show notification
  }, []);

  const handleSelectFixtureSuite = useCallback(
    (suite: FixtureSuite) => {
      actions.applyFixtureSuite({
        regex: suite.regex,
        tests: suite.tests.map((t) => ({ input: t.input, regex: t.regex })),
      });
      setSelectedFixtureSuite(suite);
      handleFocusEditor();
    },
    [actions, handleFocusEditor]
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

  const handleMatchClick = useCallback(
    (index: number, start: number, end: number) => {
      setHoveredMatchIndex(index);
      testTextEditorRef.current?.scrollToMatch(start, end);
    },
    [setHoveredMatchIndex]
  );

  return (
        <div className="h-screen flex flex-col bg-background">
          {/* Header */}
          <header className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-border">
            <div className="flex items-center">
              <Link href="/app" className="flex items-center">
                <Image
                  src="/regexlens-logo.png"
                  alt="RegexLens"
                  width={100}
                  height={100}
                  className="rounded-lg w-[80px] sm:w-[100px]"
                  priority
                />
              </Link>
            </div>

            {/* Desktop/Tablet Navigation - Show on md (768px+) */}
            <div className="hidden md:flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5" asChild>
                    <Link href="/docs" target="_blank">
                      <BookText className="h-4 w-4" />
                      <span className="hidden lg:inline">Docs</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View documentation</TooltipContent>
              </Tooltip>
              <TemplatePicker onSelect={actions.applyTemplate} onAfterSelect={handleFocusEditor} />
              <FixturePicker onSelectSuite={handleSelectFixtureSuite} onAfterSelect={handleFocusEditor} />
              
              {/* Library buttons */}
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSaveModalOpen(true)}
                      disabled={!state.pattern}
                      className="gap-1.5"
                    >
                      <Save className="h-4 w-4" />
                      <span className="hidden lg:inline">Save</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {state.pattern ? "Save to library" : "Enter a pattern to save"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLibraryOpen(true)}
                      className="gap-1.5"
                    >
                      <FolderOpen className="h-4 w-4" />
                      <span className="hidden lg:inline">Library</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open saved library</TooltipContent>
                </Tooltip>
              </div>

              <ShareBar 
                state={state} 
                steps={explanationResult.steps} 
                warnings={warningsResult.warnings} 
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={actions.reset}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset all</TooltipContent>
              </Tooltip>
              <div className="w-px h-6 bg-border mx-1" />
              <UserMenu />
            </div>

            {/* Mobile Navigation - Show below md (768px) */}
            <div className="flex md:hidden items-center gap-2">
              {/* Quick actions visible on mobile */}
              <TemplatePicker onSelect={actions.applyTemplate} onAfterSelect={handleFocusEditor} />
              <FixturePicker onSelectSuite={handleSelectFixtureSuite} onAfterSelect={handleFocusEditor} />
              
              {/* More menu for other actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/docs" target="_blank" className="flex items-center">
                      <BookText className="mr-2 h-4 w-4" />
                      Documentation
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setSaveModalOpen(true)}
                    disabled={!state.pattern}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Pattern
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLibraryOpen(true)}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    My Library
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={async () => {
                      const url = getShareUrl(state);
                      await navigator.clipboard.writeText(url);
                    }}
                    disabled={!state.pattern && !state.text}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Copy Share Link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={actions.reset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset All
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <UserMenu />
            </div>
          </header>

          {/* Main Content 
              - Mobile (< 768px): Single column stacked layout
              - Tablet (768px - 1279px): Two column layout with Pattern on left, Test/Results on right
              - Desktop (>= 1280px): Three column layout
          */}
          <main className="flex-1 flex flex-col md:grid md:grid-cols-2 xl:grid-cols-[1fr_1.5fr_1.2fr] gap-3 sm:gap-4 p-3 sm:p-4 overflow-auto xl:overflow-hidden">
            {/* Left Panel - Regex Editor (full width on mobile, left column on tablet, first column on desktop) */}
            <div className="flex flex-col gap-3 sm:gap-4 min-h-0 shrink-0 md:row-span-2 xl:row-span-1">
              <Panel title="Pattern" className="flex-1 min-h-[180px] sm:min-h-[200px] xl:min-h-0">
                <div className="flex flex-col h-full">
                  <div className="flex-1 min-h-[80px] sm:min-h-[100px]">
                    <RegexEditor
                      ref={regexEditorRef}
                      value={state.pattern}
                      onChange={actions.setPattern}
                      parseResult={parseResult}
                    />
                  </div>
                  <div className="border-t border-border p-2 sm:p-3 space-y-2">
                    <FlagsToggle
                      flags={state.flags}
                      onToggle={actions.toggleFlag}
                    />
                    <TokenToolbar onInsert={actions.setPattern} currentPattern={state.pattern} />
                    <ParseStatus parseResult={parseResult} />
                  </div>
                </div>
              </Panel>
            </div>

            {/* Center Panel - Test Text & Matches (stacks with Pattern on mobile, right column on tablet) */}
            <div className="flex flex-col gap-3 sm:gap-4 min-h-0 shrink-0">
              <Panel title="Test Text" className="flex-[2] min-h-[120px] sm:min-h-[150px] xl:min-h-0">
                <PanelContent className="p-0">
                  {selectedFixtureSuite && (
                    <FixtureSuitePanel
                      suite={selectedFixtureSuite}
                      currentTestInput={state.text}
                      onSelectTest={handleSelectFixtureTest}
                      onClear={handleClearFixtureSuite}
                    />
                  )}
                  <TestTextEditor
                    ref={testTextEditorRef}
                    value={state.text}
                    onChange={actions.setText}
                    matches={matchResult}
                    pattern={state.pattern}
                    flags={state.flags}
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
                      {matchResult.truncated && " (truncated)"}
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

            {/* Right Panel - Tabs (spans full width on tablet [2 cols], third column on desktop [3 cols]) */}
            <div className="min-h-[200px] sm:min-h-[250px] xl:min-h-0 shrink-0 col-span-full xl:col-span-1">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="h-full flex flex-col"
              >
                {/* Mobile: pill-style segmented control */}
                <SegmentedControl className="md:hidden w-full">
                  <SegmentedControlTrigger value="explanation" className="gap-1.5">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span>Explain</span>
                  </SegmentedControlTrigger>
                  <SegmentedControlTrigger value="structure" className="gap-1.5">
                    <TreeDeciduous className="h-3.5 w-3.5 shrink-0" />
                    <span>Structure</span>
                  </SegmentedControlTrigger>
                  <SegmentedControlTrigger value="railroad" className="gap-1.5">
                    <Route className="h-3.5 w-3.5 shrink-0" />
                    <span>Railroad</span>
                  </SegmentedControlTrigger>
                  <SegmentedControlTrigger value="analysis" className="gap-1.5">
                    <Search className="h-3.5 w-3.5 shrink-0" />
                    <span>Analysis</span>
                  </SegmentedControlTrigger>
                  <SegmentedControlTrigger value="warnings" className="gap-1.5 relative">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>Warnings</span>
                    {warningsResult.warnings.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-warning-warn text-[10px] font-medium flex items-center justify-center text-black">
                        {warningsResult.warnings.length}
                      </span>
                    )}
                  </SegmentedControlTrigger>
                </SegmentedControl>
                {/* Desktop: grid tabs */}
                <TabsList className="hidden md:grid w-full grid-cols-5 h-9">
                  <TabsTrigger value="explanation" className="gap-1 text-xs sm:text-sm px-1.5 sm:px-2">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Explain</span>
                    <span className="sm:hidden">Exp</span>
                  </TabsTrigger>
                  <TabsTrigger value="structure" className="gap-1 text-xs sm:text-sm px-1.5 sm:px-2">
                    <TreeDeciduous className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Structure</span>
                    <span className="sm:hidden">AST</span>
                  </TabsTrigger>
                  <TabsTrigger value="railroad" className="gap-1 text-xs sm:text-sm px-1.5 sm:px-2">
                    <Route className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Railroad</span>
                    <span className="sm:hidden">RR</span>
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="gap-1 text-xs sm:text-sm px-1.5 sm:px-2">
                    <Search className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Analysis</span>
                    <span className="sm:hidden">Analyze</span>
                  </TabsTrigger>
                  <TabsTrigger value="warnings" className="gap-1 text-xs sm:text-sm px-1.5 sm:px-2 relative">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Warnings</span>
                    <span className="sm:hidden">Warn</span>
                    {warningsResult.warnings.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-warning-warn text-[10px] font-medium flex items-center justify-center text-black">
                        {warningsResult.warnings.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 mt-2 min-h-0">
                  <TabsContent value="explanation" className="h-full m-0">
                    <Panel className="h-full">
                      <PanelContent>
                        <ExplanationPanel
                          explanation={explanationResult}
                          parseResult={parseResult}
                        />
                      </PanelContent>
                    </Panel>
                  </TabsContent>

                  <TabsContent value="structure" className="h-full m-0">
                    <Panel className="h-full">
                      <PanelContent>
                        <AstPanel parseResult={parseResult} />
                      </PanelContent>
                    </Panel>
                  </TabsContent>

                  <TabsContent value="railroad" className="h-full m-0">
                    <Panel className="h-full">
                      <PanelContent className="p-0">
                        <RailroadDiagramPanel parseResult={parseResult} className="h-full" />
                      </PanelContent>
                    </Panel>
                  </TabsContent>

                  <TabsContent value="analysis" className="h-full m-0">
                    <Panel className="h-full">
                      <PanelContent>
                        <AnalysisPanel pattern={state.pattern} flags={state.flags} />
                      </PanelContent>
                    </Panel>
                  </TabsContent>
                  <TabsContent value="warnings" className="h-full m-0">
                    <Panel className="h-full">
                      <PanelContent>
                        <WarningsPanel warnings={warningsResult} />
                      </PanelContent>
                    </Panel>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </main>

          {/* Save Modal */}
          <SaveSnippetModal
            open={saveModalOpen}
            onOpenChange={setSaveModalOpen}
            pattern={state.pattern}
            flags={state.flags}
            onSaved={handleSnippetSaved}
          />

          {/* Library Modal */}
          <SavedLibrary
            open={libraryOpen}
            onOpenChange={setLibraryOpen}
            onLoadSnippet={handleLoadSnippet}
          />
        </div>
  );
}
