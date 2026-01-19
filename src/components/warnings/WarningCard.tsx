"use client";

import { Warning } from "@/types";
import { useHoverSync } from "@/hooks/useHoverSync";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface WarningCardProps {
  warning: Warning;
}

const SEVERITY_CONFIG = {
  danger: {
    icon: AlertCircle,
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    iconColor: "text-red-400",
    titleColor: "text-red-400",
  },
  warn: {
    icon: AlertTriangle,
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    iconColor: "text-amber-400",
    titleColor: "text-amber-400",
  },
  info: {
    icon: Info,
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    iconColor: "text-blue-400",
    titleColor: "text-blue-400",
  },
};

export function WarningCard({ warning }: WarningCardProps) {
  const { setHoveredRange } = useHoverSync();
  const config = SEVERITY_CONFIG[warning.severity];
  const Icon = config.icon;

  const handleMouseEnter = () => {
    if (warning.range) {
      setHoveredRange(warning.range);
    }
  };

  const handleMouseLeave = () => {
    setHoveredRange(null);
  };

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-colors",
        config.bg,
        config.border,
        warning.range && "cursor-pointer hover:opacity-80"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-start gap-2">
        <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.iconColor)} />
        <div className="flex-1 min-w-0">
          <h4 className={cn("text-sm font-medium", config.titleColor)}>
            {warning.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {warning.message}
          </p>
          {warning.hint && (
            <p className="text-xs text-muted-foreground/80 mt-1.5 italic">
              {warning.hint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
