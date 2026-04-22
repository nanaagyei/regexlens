"use client";

import { useCallback } from "react";
import { Warning, WarningCategory } from "@/types";
import { useHoverSync } from "@/hooks/useHoverSync";
import { AlertCircle, AlertTriangle, Info, Pin } from "lucide-react";
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
    ring: "ring-red-500/30",
  },
  warn: {
    icon: AlertTriangle,
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    iconColor: "text-amber-400",
    titleColor: "text-amber-400",
    ring: "ring-amber-500/30",
  },
  info: {
    icon: Info,
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    iconColor: "text-blue-400",
    titleColor: "text-blue-400",
    ring: "ring-blue-500/30",
  },
};

const CATEGORY_CONFIG: Record<WarningCategory, { label: string; className: string }> = {
  performance: { label: "Performance", className: "bg-orange-500/15 text-orange-400" },
  correctness: { label: "Correctness", className: "bg-rose-500/15 text-rose-400" },
  readability: { label: "Readability", className: "bg-sky-500/15 text-sky-400" },
  maintainability: { label: "Maintainability", className: "bg-purple-500/15 text-purple-400" },
};

export function WarningCard({ warning }: WarningCardProps) {
  const { hoverState, setHoveredRange, toggleLockedWarning } = useHoverSync();

  const isLocked = hoverState.lockedWarningId === warning.id;
  const config = SEVERITY_CONFIG[warning.severity];
  const categoryConfig = CATEGORY_CONFIG[warning.category];
  const Icon = config.icon;
  const hasRange = Boolean(warning.range);

  const handleMouseEnter = useCallback(() => {
    if (warning.range) {
      setHoveredRange(warning.range);
    }
  }, [warning.range, setHoveredRange]);

  const handleMouseLeave = useCallback(() => {
    if (!isLocked) {
      setHoveredRange(null);
    }
  }, [isLocked, setHoveredRange]);

  const handleClick = useCallback(() => {
    if (hasRange) {
      toggleLockedWarning(warning.id);
      if (isLocked) {
        setHoveredRange(null);
      } else if (warning.range) {
        setHoveredRange(warning.range);
      }
    }
  }, [hasRange, warning.id, warning.range, isLocked, toggleLockedWarning, setHoveredRange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (hasRange && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        toggleLockedWarning(warning.id);
        if (isLocked) {
          setHoveredRange(null);
        } else if (warning.range) {
          setHoveredRange(warning.range);
        }
      }
    },
    [hasRange, warning.id, warning.range, isLocked, toggleLockedWarning, setHoveredRange]
  );

  return (
    <div
      role={hasRange ? "button" : undefined}
      tabIndex={hasRange ? 0 : undefined}
      aria-pressed={hasRange ? isLocked : undefined}
      aria-label={warning.title}
      className={cn(
        "p-3 rounded-lg border transition-colors",
        config.bg,
        config.border,
        hasRange && "cursor-pointer hover:opacity-80",
        isLocked && `ring-1 ${config.ring}`
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start gap-2">
        <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={cn("text-sm font-medium", config.titleColor)}>
              {warning.title}
            </h4>
            <span
              className={cn(
                "text-[10px] leading-tight px-1.5 py-0.5 rounded font-medium",
                categoryConfig.className
              )}
            >
              {categoryConfig.label}
            </span>
            {isLocked && (
              <Pin
                className={cn("h-3 w-3 shrink-0", config.iconColor)}
                aria-hidden="true"
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {warning.message}
          </p>
          {warning.hint && (
            <p className="text-xs text-muted-foreground/80 mt-1.5 italic break-words">
              {warning.hint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
