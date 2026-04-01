import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        info: "border-transparent bg-blue-500/20 text-blue-400",
        warn: "border-transparent bg-amber-500/20 text-amber-400",
        danger: "border-transparent bg-red-500/20 text-red-400",
        match1: "border-transparent bg-[hsl(var(--match-1)/0.2)] text-[hsl(var(--match-1))]",
        match2: "border-transparent bg-[hsl(var(--match-2)/0.2)] text-[hsl(var(--match-2))]",
        match3: "border-transparent bg-[hsl(var(--match-3)/0.2)] text-[hsl(var(--match-3))]",
        match4: "border-transparent bg-[hsl(var(--match-4)/0.2)] text-[hsl(var(--match-4))]",
        match5: "border-transparent bg-[hsl(var(--match-5)/0.2)] text-[hsl(var(--match-5))]",
        match6: "border-transparent bg-[hsl(var(--match-6)/0.2)] text-[hsl(var(--match-6))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
