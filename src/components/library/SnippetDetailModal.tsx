"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Snippet } from "./types";
import { History, GitCompare, Loader2, ExternalLink, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SnippetVersion {
  id: string;
  snippet_id: string;
  pattern: string;
  flags: string;
  notes: string | null;
  created_at: string;
}

interface DiffResult {
  from: { id: string; pattern: string; flags: string; created_at: string };
  to: { id: string; pattern: string; flags: string; created_at: string };
  diff: {
    patternChanged: boolean;
    flagsChanged: boolean;
    patternDiff: { added: string[]; removed: string[] };
    flagsDiff: { added: string[]; removed: string[] };
    explanationDiff?: {
      addedSteps: { label: string; kind: string; detail?: string }[];
      removedSteps: { label: string; kind: string; detail?: string }[];
    };
    warningsDiff?: {
      added: { id: string; title: string; message: string; severity: string }[];
      removed: { id: string; title: string; message: string; severity: string }[];
    };
  };
}

interface SnippetDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snippet: Snippet;
  onLoadVersion: (pattern: string, flags: string) => void;
  onRestoreVersion?: (snippetId: string, pattern: string, flags: string) => Promise<void>;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SnippetDetailModal({
  open,
  onOpenChange,
  snippet,
  onLoadVersion,
  onRestoreVersion,
}: SnippetDetailModalProps) {
  const [versions, setVersions] = useState<SnippetVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [diffFrom, setDiffFrom] = useState<string | null>(null);
  const [diffTo, setDiffTo] = useState<string | null>(null);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    if (!open) return;
    setIsLoadingVersions(true);
    try {
      const res = await fetch(`/api/snippets/${snippet.id}/versions`);
      if (!res.ok) throw new Error("Failed to load versions");
      const data = await res.json();
      setVersions(data.items || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load versions");
    } finally {
      setIsLoadingVersions(false);
    }
  }, [open, snippet.id]);

  useEffect(() => {
    if (open) {
      fetchVersions();
      setDiffFrom(null);
      setDiffTo(null);
      setDiffResult(null);
      setDiffError(null);
    }
  }, [open, fetchVersions]);

  const handleLoadVersion = useCallback(
    (v: SnippetVersion) => {
      onLoadVersion(v.pattern, v.flags);
      onOpenChange(false);
      toast.success("Loaded version into editor");
    },
    [onLoadVersion, onOpenChange]
  );

  const handleRestoreVersion = useCallback(
    async (v: SnippetVersion) => {
      if (!onRestoreVersion) return;
      setRestoringId(v.id);
      try {
        await onRestoreVersion(snippet.id, v.pattern, v.flags);
        toast.success("Version restored as current snippet");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to restore version");
      } finally {
        setRestoringId(null);
      }
    },
    [onRestoreVersion, snippet.id]
  );

  const handleFetchDiff = useCallback(async () => {
    if (!diffFrom || !diffTo) return;
    setIsLoadingDiff(true);
    setDiffError(null);
    try {
      const res = await fetch(
        `/api/snippets/${snippet.id}/diff?from=${diffFrom}&to=${diffTo}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to load diff");
      }
      const data = await res.json();
      setDiffResult(data);
    } catch (err) {
      setDiffError(err instanceof Error ? err.message : "Failed to load diff");
    } finally {
      setIsLoadingDiff(false);
    }
  }, [snippet.id, diffFrom, diffTo]);

  const canCompare = diffFrom && diffTo && diffFrom !== diffTo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {snippet.name}
          </DialogTitle>
          <DialogDescription>
            Version history and compare versions for this snippet.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="history" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history" className="gap-1.5">
              <History className="h-3.5 w-3.5" />
              Version history
            </TabsTrigger>
            <TabsTrigger value="diff" className="gap-1.5">
              <GitCompare className="h-3.5 w-3.5" />
              Compare
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="flex-1 mt-4 min-h-0">
            <ScrollArea className="h-[320px]">
              {isLoadingVersions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  <p>No version history yet.</p>
                  <p className="mt-1 text-xs">
                    Use &quot;Save as version&quot; when editing to create snapshots.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className={cn(
                        "flex items-start justify-between gap-4 p-3 rounded-lg border border-border",
                        "hover:bg-muted/50 transition-colors"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs bg-muted/50 rounded px-2 py-1.5 break-all">
                          {v.pattern}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                          {v.flags && <Badge variant="secondary" className="text-[9px] px-1 py-0">/{v.flags}</Badge>}
                          <span>{formatDate(v.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {onRestoreVersion && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={restoringId === v.id}
                            onClick={() => handleRestoreVersion(v)}
                          >
                            {restoringId === v.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            Restore
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleLoadVersion(v)}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Load
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="diff" className="flex-1 mt-4 min-h-0">
            <ScrollArea className="h-[320px] pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Version A (older)
                  </label>
                  <select
                    value={diffFrom ?? ""}
                    onChange={(e) => setDiffFrom(e.target.value || null)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                  >
                    <option value="">Select version...</option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {formatDate(v.created_at)} — {v.pattern.slice(0, 30)}
                        {v.pattern.length > 30 ? "…" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Version B (newer)
                  </label>
                  <select
                    value={diffTo ?? ""}
                    onChange={(e) => setDiffTo(e.target.value || null)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                  >
                    <option value="">Select version...</option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {formatDate(v.created_at)} — {v.pattern.slice(0, 30)}
                        {v.pattern.length > 30 ? "…" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleFetchDiff}
                disabled={!canCompare || isLoadingDiff}
                className="gap-2"
              >
                {isLoadingDiff ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GitCompare className="h-4 w-4" />
                )}
                Compare
              </Button>

              {diffError && (
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                  {diffError}
                </div>
              )}

              {diffResult && (
                <div className="space-y-4 border border-border rounded-lg p-4">
                  <h4 className="text-sm font-medium">Changes</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">From (A)</p>
                      <pre className="font-mono text-xs bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                        {diffResult.from.pattern}
                      </pre>
                      {diffResult.from.flags && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          /{diffResult.from.flags}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">To (B)</p>
                      <pre className="font-mono text-xs bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                        {diffResult.to.pattern}
                      </pre>
                      {diffResult.to.flags && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          /{diffResult.to.flags}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs space-y-2">
                    {diffResult.diff.patternChanged && (
                      <div>
                        <span className="font-medium text-muted-foreground">Pattern: </span>
                        {diffResult.diff.patternDiff.added.length > 0 && (
                          <span className="text-emerald-600">
                            +{diffResult.diff.patternDiff.added.join("") || "(chars)"}
                          </span>
                        )}
                        {diffResult.diff.patternDiff.removed.length > 0 && (
                          <span className="text-red-500 ml-1">
                            -{diffResult.diff.patternDiff.removed.join("") || "(chars)"}
                          </span>
                        )}
                      </div>
                    )}
                    {diffResult.diff.flagsChanged && (
                      <div>
                        <span className="font-medium text-muted-foreground">Flags: </span>
                        {diffResult.diff.flagsDiff.added.length > 0 && (
                          <span className="text-emerald-600">
                            +{diffResult.diff.flagsDiff.added.join("")}
                          </span>
                        )}
                        {diffResult.diff.flagsDiff.removed.length > 0 && (
                          <span className="text-red-500 ml-1">
                            -{diffResult.diff.flagsDiff.removed.join("")}
                          </span>
                        )}
                      </div>
                    )}
                    {!diffResult.diff.patternChanged && !diffResult.diff.flagsChanged && (
                      <p className="text-muted-foreground">No changes.</p>
                    )}
                  </div>

                  {diffResult.diff.explanationDiff &&
                    (diffResult.diff.explanationDiff.addedSteps.length > 0 ||
                      diffResult.diff.explanationDiff.removedSteps.length > 0) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Explanation changes</h4>
                        <div className="space-y-1.5 text-xs">
                          {diffResult.diff.explanationDiff.addedSteps.map((s, i) => (
                            <div
                              key={`add-${i}`}
                              className="flex items-start gap-2 rounded px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/30"
                            >
                              <span className="text-emerald-600 font-medium shrink-0">+</span>
                              <span>{s.label}</span>
                            </div>
                          ))}
                          {diffResult.diff.explanationDiff.removedSteps.map((s, i) => (
                            <div
                              key={`rem-${i}`}
                              className="flex items-start gap-2 rounded px-2 py-1.5 bg-red-500/10 border border-red-500/30"
                            >
                              <span className="text-red-500 font-medium shrink-0">−</span>
                              <span>{s.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {diffResult.diff.warningsDiff &&
                    (diffResult.diff.warningsDiff.added.length > 0 ||
                      diffResult.diff.warningsDiff.removed.length > 0) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Warnings changes</h4>
                        <div className="space-y-1.5 text-xs">
                          {diffResult.diff.warningsDiff.added.map((w, i) => (
                            <div
                              key={`w-add-${i}`}
                              className="flex items-start gap-2 rounded px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/30"
                            >
                              <span className="text-emerald-600 font-medium shrink-0">+</span>
                              <Badge variant="secondary" className="text-[9px] px-1 py-0">
                                {w.severity}
                              </Badge>
                              <span>{w.title}</span>
                            </div>
                          ))}
                          {diffResult.diff.warningsDiff.removed.map((w, i) => (
                            <div
                              key={`w-rem-${i}`}
                              className="flex items-start gap-2 rounded px-2 py-1.5 bg-red-500/10 border border-red-500/30"
                            >
                              <span className="text-red-500 font-medium shrink-0">−</span>
                              <Badge variant="secondary" className="text-[9px] px-1 py-0">
                                {w.severity}
                              </Badge>
                              <span>{w.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
