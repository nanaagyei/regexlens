"use client";

import { ParseResult } from "@/types";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ParseStatusProps {
  parseResult: ParseResult;
}

export function ParseStatus({ parseResult }: ParseStatusProps) {
  if (parseResult.ok) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-500">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Valid pattern</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-1.5 text-xs text-red-400">
      <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <span className="break-words">{parseResult.errorMessage}</span>
    </div>
  );
}
