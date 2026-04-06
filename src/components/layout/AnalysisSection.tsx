"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SegmentedControl,
  SegmentedControlTrigger,
} from "@/components/ui/segmented-control";
import { Panel, PanelContent } from "./Panel";
import { ExplanationPanel } from "@/components/explain/ExplanationPanel";
import { AstPanel } from "@/components/structure/AstPanel";
import { RailroadDiagramPanel } from "@/components/structure/RailroadDiagramPanel";
import { WarningsPanel } from "@/components/warnings/WarningsPanel";
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel";
import { RegexCopilot } from "@/components/ai/RegexCopilot";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  FileText,
  AlertTriangle,
  TreeDeciduous,
  Search,
  Route,
  Sparkles,
} from "lucide-react";

export function AnalysisSection() {
  const [activeTab, setActiveTab] = useState("explanation");
  const { state, actions, parseResult, matchResult, explanation, warnings } = useWorkspace();

  return (
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
            {warnings.warnings.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-warning-warn text-[10px] font-medium flex items-center justify-center text-black">
                {warnings.warnings.length}
              </span>
            )}
          </SegmentedControlTrigger>
          <SegmentedControlTrigger value="copilot" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>AI</span>
          </SegmentedControlTrigger>
        </SegmentedControl>

        {/* Desktop: grid tabs */}
        <TabsList className="hidden md:grid w-full grid-cols-6 h-9">
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
            {warnings.warnings.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-warning-warn text-[10px] font-medium flex items-center justify-center text-black">
                {warnings.warnings.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="copilot" className="gap-1 text-xs sm:text-sm px-1.5 sm:px-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Copilot</span>
            <span className="sm:hidden">AI</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 mt-2 min-h-0">
          <TabsContent value="explanation" className="h-full m-0">
            <Panel className="h-full">
              <PanelContent>
                <ExplanationPanel
                  explanation={explanation}
                  parseResult={parseResult}
                  pattern={state.pattern}
                  flags={state.flags}
                  explanationMode={state.explanationMode}
                  onExplanationModeChange={actions.setExplanationMode}
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
                <AnalysisPanel
                  pattern={state.pattern}
                  flags={state.flags}
                  parseResult={parseResult}
                />
              </PanelContent>
            </Panel>
          </TabsContent>

          <TabsContent value="warnings" className="h-full m-0">
            <Panel className="h-full">
              <PanelContent>
                <WarningsPanel warnings={warnings} parseResult={parseResult} />
              </PanelContent>
            </Panel>
          </TabsContent>

          <TabsContent value="copilot" className="h-full m-0">
            <Panel className="h-full">
              <RegexCopilot
                pattern={state.pattern}
                flags={state.flags}
                testText={state.text}
                matchCount={matchResult.totalCount}
                matchTruncated={matchResult.truncated}
                warningCount={warnings.warnings.length}
                warnings={warnings.warnings.map((w) => ({
                  severity: w.severity,
                  title: w.title,
                  message: w.message,
                }))}
                explanationSteps={explanation.steps.map((s) => ({
                  label: s.label,
                  kind: s.kind,
                  detail: s.detail ?? undefined,
                }))}
                onApplyPattern={(pattern, flags) => {
                  actions.setPattern(pattern);
                  actions.setFlags(flags);
                }}
              />
            </Panel>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
