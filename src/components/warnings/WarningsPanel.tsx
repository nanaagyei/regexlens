"use client";

import { WarningsResult } from "@/types";
import { WarningCard } from "./WarningCard";
import { CheckCircle2 } from "lucide-react";

interface WarningsPanelProps {
  warnings: WarningsResult;
}

export function WarningsPanel({ warnings }: WarningsPanelProps) {
  if (warnings.warnings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-emerald-500 mb-3">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-sm font-medium mb-1">No issues detected</h3>
        <p className="text-xs text-muted-foreground">
          This pattern looks good!
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Potential issues
        </h3>
        <RiskIndicator score={warnings.riskScore} />
      </div>
      <div className="space-y-2">
        {warnings.warnings.map((warning) => (
          <WarningCard key={warning.id} warning={warning} />
        ))}
      </div>
    </div>
  );
}

function RiskIndicator({ score }: { score: number }) {
  let color = "text-emerald-400";
  let bg = "bg-emerald-400/20";
  let label = "Low risk";

  if (score >= 80) {
    color = "text-red-400";
    bg = "bg-red-400/20";
    label = "High risk";
  } else if (score >= 40) {
    color = "text-amber-400";
    bg = "bg-amber-400/20";
    label = "Medium risk";
  }

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${bg}`}>
      <span className={`text-xs font-medium ${color}`}>{label}</span>
      <span className={`text-xs ${color}`}>{score}</span>
    </div>
  );
}
