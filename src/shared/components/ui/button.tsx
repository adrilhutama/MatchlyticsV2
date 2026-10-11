import React from "react";
import { cn } from "../../../shared/utils/cn.js";

export type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "pro";

export type ButtonSize = "xs" | "sm" | "md" | "icon";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default:
    "bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-500",
  secondary:
    "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700",
  outline:
    "bg-transparent text-zinc-200 hover:bg-zinc-800 border border-zinc-600",
  ghost:
    "bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white border border-transparent",
  destructive:
    "bg-red-900/60 text-red-200 hover:bg-red-900/80 border border-red-700",
  pro:
    "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/50",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: "h-6 px-2 text-xs",
  sm: "h-7 px-3 text-sm",
  md: "h-9 px-4 text-sm",
  icon: "h-9 w-9 p-0 flex items-center justify-center",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-mono font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        disabled={disabled}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
