import React from "react";
import { cn } from "../../../shared/utils/cn.js";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "emerald"
  | "rose"
  | "sky"
  | "amber";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-zinc-800 text-zinc-200 border-zinc-700",
  secondary: "bg-zinc-900 text-zinc-400 border-zinc-800",
  outline: "bg-transparent text-zinc-300 border-zinc-600",
  emerald: "bg-emerald-950/60 text-emerald-400 border-emerald-700/60",
  rose: "bg-rose-950/60 text-rose-400 border-rose-700/60",
  sky: "bg-sky-950/60 text-sky-400 border-sky-700/60",
  amber: "bg-amber-950/60 text-amber-400 border-amber-700/60",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded border px-2 py-0.5 text-xs font-mono font-medium",
          VARIANT_CLASSES[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";
