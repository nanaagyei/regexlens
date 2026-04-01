"use client";

import { useState, useCallback } from "react";
import { RegexState, ExplanationStep, Warning } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExportModal } from "@/components/export/ExportModal";
import { Kbd } from "@/components/ui/kbd";
import { Share2, Check, FileDown } from "lucide-react";

interface ShareBarProps {
  state: RegexState;
  steps?: ExplanationStep[];
  warnings?: Warning[];
}

export function ShareBar({ state, steps = [], warnings = [] }: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const handleCopyLink = useCallback(async () => {
    try {
      // Build share URL
      const url = new URL(window.location.origin + window.location.pathname);

      if (state.pattern) {
        url.searchParams.set("p", btoa(encodeURIComponent(state.pattern)));
      }
      if (state.flags) {
        url.searchParams.set("f", state.flags);
      }
      if (state.text) {
        url.searchParams.set("t", btoa(encodeURIComponent(state.text)));
      }

      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [state]);

  const canShare = state.pattern || state.text;

  return (
    <>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              disabled={!canShare}
              className="gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-2">
            {canShare ? (
              <>
                Copy shareable link
                <Kbd keys={["mod", "Shift", "C"]} />
              </>
            ) : (
              "Enter a pattern to share"
            )}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportModalOpen(true)}
              disabled={!state.pattern}
              className="gap-1.5"
            >
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {state.pattern
              ? "Export explanation"
              : "Enter a pattern to export"}
          </TooltipContent>
        </Tooltip>
      </div>

      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        pattern={state.pattern}
        flags={state.flags}
        steps={steps}
        warnings={warnings}
      />
    </>
  );
}
