"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  actions?: ReactNode;
}

export function Panel({ children, className, title, actions }: PanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col bg-card rounded-lg border border-border overflow-hidden",
        className
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
          {title && (
            <h2 className="text-sm font-medium text-muted-foreground">
              {title}
            </h2>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

interface PanelContentProps {
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
}

export function PanelContent({
  children,
  className,
  scrollable = true,
}: PanelContentProps) {
  return (
    <div
      className={cn(
        "h-full",
        scrollable && "overflow-auto scrollbar-thin",
        className
      )}
    >
      {children}
    </div>
  );
}
