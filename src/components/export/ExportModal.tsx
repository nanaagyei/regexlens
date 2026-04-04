"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/hooks/useUser";
import { ExplanationStep, Warning } from "@/types";
import {
  FileText,
  FileCode,
  MessageSquare,
  Blocks,
  Copy,
  Download,
  LogIn,
  Loader2,
  Check,
} from "lucide-react";

type ExportFormat = "markdown" | "plain" | "pr_comment" | "notion";

interface FormatOption {
  id: ExportFormat;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: "markdown",
    name: "Markdown",
    description: "Standard markdown document",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "plain",
    name: "Plain Text",
    description: "Simple text format",
    icon: <FileCode className="h-5 w-5" />,
  },
  {
    id: "pr_comment",
    name: "PR Comment",
    description: "GitHub-friendly collapsible format",
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Notion-friendly blocks",
    icon: <Blocks className="h-5 w-5" />,
  },
];

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pattern: string;
  flags: string;
  steps: ExplanationStep[];
  warnings: Warning[];
}

export function ExportModal({
  open,
  onOpenChange,
  pattern,
  flags,
  steps,
  warnings,
}: ExportModalProps) {
  const { user, isLoading: isUserLoading } = useUser();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("markdown");
  const [isExporting, setIsExporting] = useState(false);
  const [exportedContent, setExportedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExport = useCallback(async () => {
    if (!user) return;

    setIsExporting(true);
    setExportedContent(null);

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: selectedFormat,
          title: "Regex Explanation",
          pattern,
          flags,
          steps: steps.map((step) => ({
            label: step.label,
            detail: step.detail,
            depth: step.depth,
          })),
          warnings: warnings.map((w) => ({
            severity: w.severity,
            title: w.title,
            message: w.message,
            hint: w.hint,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Export failed");
      }

      const data = await response.json();
      setExportedContent(data.content);
      toast.success("Export generated successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to export");
    } finally {
      setIsExporting(false);
    }
  }, [user, selectedFormat, pattern, flags, steps, warnings]);

  const handleCopy = useCallback(async () => {
    if (!exportedContent) return;

    try {
      await navigator.clipboard.writeText(exportedContent);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy");
    }
  }, [exportedContent]);

  const handleDownload = useCallback(() => {
    if (!exportedContent) return;

    const extensions: Record<ExportFormat, string> = {
      markdown: "md",
      plain: "txt",
      pr_comment: "md",
      notion: "md",
    };

    const blob = new Blob([exportedContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `regex-explanation.${extensions[selectedFormat]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Downloaded successfully");
  }, [exportedContent, selectedFormat]);

  const handleClose = useCallback(() => {
    setExportedContent(null);
    setCopied(false);
    onOpenChange(false);
  }, [onOpenChange]);

  // Show sign-in prompt for unauthenticated users
  const showSignInPrompt = !isUserLoading && !user;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Explanation
          </DialogTitle>
          <DialogDescription>
            Export your regex explanation in various formats for documentation or sharing.
          </DialogDescription>
        </DialogHeader>

        {showSignInPrompt ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <LogIn className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Sign in required</h3>
              <p className="text-sm text-muted-foreground">
                Sign in to export explanations to Markdown, PR comments, and more.
              </p>
            </div>
          </div>
        ) : exportedContent ? (
          <div className="space-y-4">
            <ScrollArea className="h-[300px] rounded-md border bg-muted/30 p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {exportedContent}
              </pre>
            </ScrollArea>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setExportedContent(null)}
              >
                Back
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {FORMAT_OPTIONS.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-lg border transition-colors text-left ${
                    selectedFormat === format.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {format.icon}
                    <span className="font-medium text-sm">{format.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format.description}
                  </span>
                </button>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={isExporting || !pattern}>
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Export
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
