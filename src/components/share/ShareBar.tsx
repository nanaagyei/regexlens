"use client";

import { useState, useCallback } from "react";
import { RegexState } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Share2, Check, Copy } from "lucide-react";

interface ShareBarProps {
  state: RegexState;
}

export function ShareBar({ state }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

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
      <TooltipContent>
        {canShare
          ? "Copy shareable link"
          : "Enter a pattern to share"}
      </TooltipContent>
    </Tooltip>
  );
}
