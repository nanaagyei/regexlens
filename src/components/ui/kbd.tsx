"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Detect if user is on Mac for modifier key display (client-only)
 */
function getModLabel(): string {
  if (typeof navigator === "undefined") return "Ctrl";
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";
}

function getKeyLabel(key: string): string {
  if (key === "mod" || key === "Mod") return getModLabel();
  const staticLabels: Record<string, string> = {
    ctrl: "Ctrl",
    meta: "⌘",
    shift: "Shift",
    Shift: "Shift",
    alt: "Alt",
    Alt: "Alt",
    Enter: "Enter",
    Escape: "Esc",
    "/": "/",
  };
  return staticLabels[key] ?? key;
}

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** Single key or compound keys like ["mod", "Shift", "C"] */
  keys?: string[];
  /** Raw children for custom content (e.g. <Kbd>Cmd</Kbd>+<Kbd>Enter</Kbd>) */
  children?: React.ReactNode;
}

/**
 * Display keyboard shortcut. Use either `keys` prop or children.
 * Examples:
 *   <Kbd keys={["mod", "Enter"]} />
 *   <Kbd keys={["/"]} />
 *   <Kbd><Kbd>Cmd</Kbd>+<Kbd>Enter</Kbd></Kbd>
 */
const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, keys, children, ...props }, ref) => {
    if (keys && keys.length > 0) {
      return (
        <kbd
          ref={ref as React.Ref<HTMLUnknownElement>}
          className={cn(
            "inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground",
            className
          )}
          {...props}
        >
          {keys.map((key, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-muted-foreground/70">+</span>}
              <span>{getKeyLabel(key)}</span>
            </React.Fragment>
          ))}
        </kbd>
      );
    }

    return (
      <kbd
        ref={ref as React.Ref<HTMLUnknownElement>}
        className={cn(
          "inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground",
          className
        )}
        {...props}
      >
        {children}
      </kbd>
    );
  }
);
Kbd.displayName = "Kbd";

export { Kbd };
