"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Panel, PanelContent } from "./Panel";
import { RegexEditor } from "@/components/regex/RegexEditor";
import { FlagsToggle } from "@/components/regex/FlagsToggle";
import { TokenToolbar } from "@/components/regex/TokenToolbar";
import { ParseStatus } from "@/components/regex/ParseStatus";
import { TestTextEditor } from "@/components/testbench/TestTextEditor";
import { MatchList } from "@/components/testbench/MatchList";
import { ExplanationPanel } from "@/components/explain/ExplanationPanel";
import { AstPanel } from "@/components/structure/AstPanel";
import { WarningsPanel } from "@/components/warnings/WarningsPanel";
import { TemplatePicker } from "@/components/templates/TemplatePicker";
import { ShareBar } from "@/components/share/ShareBar";
import { UserMenu } from "./UserMenu";
import { HoverSyncProvider } from "@/hooks/useHoverSync";
import { useRegexState } from "@/hooks/useRegexState";
import { useRegexParse } from "@/hooks/useRegexParse";
import { useRegexMatches } from "@/hooks/useRegexMatches";
import { useExplanation } from "@/hooks/useExplanation";
import { useWarnings } from "@/hooks/useWarnings";
import { useUrlState } from "@/hooks/useUrlState";
import {
  FileText,
  AlertTriangle,
  TreeDeciduous,
  Share2,
  RotateCcw,
} from "lucide-react";
import Image from "next/image";

export function AppShell() {
  const [activeTab, setActiveTab] = useState("explanation");

  // Core state and hooks
  const { state, actions } = useRegexState();
  const parseResult = useRegexParse(state.pattern, state.flags);
  const matchResult = useRegexMatches(
    state.pattern,
    state.flags,
    state.text,
    parseResult.ok
  );
  const explanationResult = useExplanation(parseResult);
  const warningsResult = useWarnings(state.pattern, state.flags, parseResult, matchResult);

  // URL state sync
  useUrlState(state, actions);

  return (
    <TooltipProvider delayDuration={300}>
      <HoverSyncProvider>
        <div className="h-screen flex flex-col bg-background">
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center">
              <Image
                src="/regexlens-logo.png"
                alt="RegexLens"
                width={120}
                height={120}
                className="rounded-lg"
                priority
              />
            </div>

            <div className="flex items-center gap-2">
              <TemplatePicker onSelect={actions.applyTemplate} />
              <ShareBar state={state} />
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
          </header>

          {/* Main Content */}
          <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_1.2fr] gap-4 p-4 overflow-hidden">
            {/* Left Panel - Regex Editor */}
            <div className="flex flex-col gap-4 min-h-0">
              <Panel title="Pattern" className="flex-1">
                <div className="flex flex-col h-full">
                  <div className="flex-1 min-h-[120px]">
                    <RegexEditor
                      value={state.pattern}
                      onChange={actions.setPattern}
                      parseResult={parseResult}
                    />
                  </div>
                  <div className="border-t border-border p-3 space-y-3">
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

            {/* Center Panel - Test Text & Matches */}
            <div className="flex flex-col gap-4 min-h-0">
              <Panel title="Test Text" className="flex-[2]">
                <PanelContent className="p-0">
                  <TestTextEditor
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
                className="flex-1 min-h-[150px]"
              >
                <PanelContent>
                  <MatchList matches={matchResult} />
                </PanelContent>
              </Panel>
            </div>

            {/* Right Panel - Tabs */}
            <div className="min-h-0">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="h-full flex flex-col"
              >
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="explanation" className="gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Explanation</span>
                  </TabsTrigger>
                  <TabsTrigger value="structure" className="gap-1.5">
                    <TreeDeciduous className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Structure</span>
                  </TabsTrigger>
                  <TabsTrigger value="warnings" className="gap-1.5 relative">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Warnings</span>
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
        </div>
      </HoverSyncProvider>
    </TooltipProvider>
  );
}
