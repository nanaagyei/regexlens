"use client";

import { useState, useCallback } from "react";
import { Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PatternGeneratorProps {
  onGenerate: (description: string) => void;
  isStreaming: boolean;
}

export function PatternGenerator({
  onGenerate,
  isStreaming,
}: PatternGeneratorProps) {
  const [description, setDescription] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = description.trim();
    if (!trimmed || isStreaming) return;
    onGenerate(trimmed);
    setDescription("");
  }, [description, isStreaming, onGenerate]);

  return (
    <div className="border border-dashed border-border/60 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Wand2 className="h-3.5 w-3.5" />
        <span className="font-medium">Describe what you want to match</span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder='e.g. "US phone numbers with optional country code"'
          className={cn(
            "flex-1 px-2.5 py-1.5 text-xs rounded-md",
            "border border-input bg-background",
            "focus:outline-none focus:ring-1 focus:ring-ring",
            "placeholder:text-muted-foreground/50"
          )}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleSubmit}
          disabled={!description.trim() || isStreaming}
          className="gap-1.5 text-xs h-7"
        >
          {isStreaming ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Wand2 className="h-3 w-3" />
          )}
          Generate
        </Button>
      </div>
    </div>
  );
}
