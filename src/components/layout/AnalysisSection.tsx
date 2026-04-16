"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SegmentedControl,
  SegmentedControlTrigger,
} from "@/components/ui/segmented-control";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Panel, PanelContent } from "./Panel";
import { ExplanationPanel } from "@/components/explain/ExplanationPanel";
import { AstPanel } from "@/components/structure/AstPanel";
import { RailroadDiagramPanel } from "@/components/structure/RailroadDiagramPanel";
import { WarningsPanel } from "@/components/warnings/WarningsPanel";
import { FailurePanel } from "@/components/failure/FailurePanel";
import { DiffPanel } from "@/components/diff/DiffPanel";
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel";
import { RegexCopilot } from "@/components/ai/RegexCopilot";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";
import {
  FileText,
  AlertTriangle,
  TreeDeciduous,
  Search,
  Route,
  Sparkles,
  XCircle,
  ArrowLeftRight,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

interface TabDef {
  value: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

const PRIMARY_TABS: TabDef[] = [
  { value: "explanation", label: "Explain", shortLabel: "Exp", icon: FileText },
  { value: "analysis", label: "Analysis", shortLabel: "Analyze", icon: Search },
  { value: "warnings", label: "Warnings", shortLabel: "Warn", icon: AlertTriangle },
  { value: "failure", label: "Failure", shortLabel: "Fail", icon: XCircle },
  { value: "copilot", label: "Copilot", shortLabel: "AI", icon: Sparkles },
];

const OVERFLOW_TABS: TabDef[] = [
  { value: "structure", label: "Structure", shortLabel: "AST", icon: TreeDeciduous },
  { value: "railroad", label: "Railroad", shortLabel: "RR", icon: Route },
  { value: "diff", label: "Diff", shortLabel: "Diff", icon: ArrowLeftRight },
];

const OVERFLOW_VALUES = new Set(OVERFLOW_TABS.map((t) => t.value));

export function AnalysisSection() {
  const [activeTab, setActiveTab] = useState("explanation");
  const { state, actions, parseResult, matchResult, explanation, warnings, failureAnalysis } = useWorkspace();

  const activeOverflow = OVERFLOW_TABS.find((t) => t.value === activeTab);
  const isOverflowActive = OVERFLOW_VALUES.has(activeTab);

  const renderBadge = (tabValue: string, position: "mobile" | "desktop") => {
    const offset = position === "mobile" ? "-top-0.5 -right-0.5" : "-top-1 -right-1";
    if (tabValue === "warnings" && warnings.warnings.length > 0) {
      return (
        <span className={cn("absolute h-4 w-4 rounded-full bg-warning-warn text-[10px] font-medium flex items-center justify-center text-black", offset)}>
          {warnings.warnings.length}
        </span>
      );
    }
    if (tabValue === "failure" && failureAnalysis) {
      return (
        <span className={cn("absolute h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium flex items-center justify-center text-white", offset)}>
          !
        </span>
      );
    }
    return null;
  };

  const overflowDropdown = (variant: "mobile" | "desktop") => {
    const ActiveIcon = activeOverflow?.icon ?? ChevronDown;
    const triggerLabel = activeOverflow?.label ?? "More";

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center justify-center gap-1 whitespace-nowrap font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              variant === "mobile"
                ? cn(
                    "rounded-md px-3 py-2 text-sm shrink-0 min-h-[36px] min-w-[64px] touch-manipulation",
                    "ring-offset-background",
                    isOverflowActive
                      ? "bg-background text-foreground shadow"
                      : "text-muted-foreground",
                  )
                : cn(
                    "rounded-md px-1.5 sm:px-2 text-xs sm:text-sm h-full",
                    isOverflowActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  ),
            )}
            aria-label={isOverflowActive ? `${activeOverflow!.label} tab (active)` : "More tabs"}
          >
            <ActiveIcon className="h-3.5 w-3.5 shrink-0" />
            {variant === "mobile" ? (
              <span>{triggerLabel}</span>
            ) : (
              <>
                <span className="hidden sm:inline">{triggerLabel}</span>
                <span className="sm:hidden">{activeOverflow?.shortLabel ?? "More"}</span>
              </>
            )}
            {!isOverflowActive && <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          {OVERFLOW_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <DropdownMenuItem
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn("gap-2", isActive && "bg-accent")}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="min-h-[200px] sm:min-h-[250px] xl:min-h-0 shrink-0 col-span-full xl:col-span-1">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="h-full flex flex-col"
      >
        {/* Mobile: pill-style segmented control */}
        <SegmentedControl className="md:hidden w-full">
          {PRIMARY_TABS.map((tab) => {
            const Icon = tab.icon;
            const badge = renderBadge(tab.value, "mobile");
            return (
              <SegmentedControlTrigger
                key={tab.value}
                value={tab.value}
                className={cn("gap-1.5", badge && "relative")}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{tab.label}</span>
                {badge}
              </SegmentedControlTrigger>
            );
          })}
          {overflowDropdown("mobile")}
        </SegmentedControl>

        {/* Desktop: grid tabs */}
        <TabsList className="hidden md:grid w-full grid-cols-6 h-9">
          {PRIMARY_TABS.map((tab) => {
            const Icon = tab.icon;
            const badge = renderBadge(tab.value, "desktop");
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn("gap-1 text-xs sm:text-sm px-1.5 sm:px-2", badge && "relative")}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
                {badge}
              </TabsTrigger>
            );
          })}
          {overflowDropdown("desktop")}
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

          <TabsContent value="failure" className="h-full m-0">
            <Panel className="h-full">
              <PanelContent>
                <FailurePanel
                  failureAnalysis={failureAnalysis}
                  matchResult={matchResult}
                  hasText={state.text.length > 0}
                />
              </PanelContent>
            </Panel>
          </TabsContent>

          <TabsContent value="diff" className="h-full m-0">
            <Panel className="h-full">
              <PanelContent className="p-0">
                <DiffPanel
                  pattern={state.pattern}
                  flags={state.flags}
                  comparisonPattern={state.comparisonPattern}
                  comparisonFlags={state.comparisonFlags}
                  onComparisonPatternChange={actions.setComparisonPattern}
                  onComparisonFlagsChange={actions.setComparisonFlags}
                  parseResult={parseResult}
                  explanation={explanation}
                />
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
