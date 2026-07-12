import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "ai";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={twMerge(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-obsidian-900 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          // Variants
          variant === "primary" &&
            "bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 shadow-lg shadow-cyan-500/20 focus:ring-cyan-500",
          variant === "secondary" &&
            "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus:ring-slate-500",
          variant === "outline" &&
            "border border-[var(--border-color)] bg-transparent hover:bg-slate-800/40 text-slate-200 hover:text-slate-100",
          variant === "ghost" &&
            "hover:bg-slate-800/40 text-slate-400 hover:text-slate-200",
          variant === "danger" &&
            "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 focus:ring-red-500",
          variant === "ai" &&
            "gradient-bg-ai hover:bg-slate-800 text-violet-300 border border-violet-500/30 hover:border-violet-400/50 shadow-lg shadow-violet-500/10 focus:ring-violet-500",
          // Sizes
          size === "sm" && "text-xs px-3 py-1.5 h-8 gap-1.5",
          size === "md" && "text-sm px-4 py-2 h-10 gap-2",
          size === "lg" && "text-base px-6 py-3 h-12 gap-3",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
