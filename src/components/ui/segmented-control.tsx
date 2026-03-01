"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

/**
 * Pill-style segmented control for mobile. Horizontal scrollable, touch-friendly.
 * Drop-in replacement for TabsList on mobile - wrap TabsTrigger children.
 */
const SegmentedControl = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "flex overflow-x-auto gap-1 p-1 rounded-lg bg-muted",
      "min-h-[44px] touch-manipulation scrollbar-thin",
      "[&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20",
      className
    )}
    {...props}
  />
));
SegmentedControl.displayName = "SegmentedControl";

/** Styled TabsTrigger for use inside SegmentedControl (mobile) */
const SegmentedControlTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium shrink-0",
      "min-h-[36px] min-w-[64px] touch-manipulation",
      "ring-offset-background transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      "data-[state=inactive]:text-muted-foreground",
      className
    )}
    {...props}
  />
));
SegmentedControlTrigger.displayName = "SegmentedControlTrigger";

export { SegmentedControl, SegmentedControlTrigger };
