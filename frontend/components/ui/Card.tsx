import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "panel" | "outline";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "glass", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          variant === "glass" && "glass-card rounded-xl p-6",
          variant === "panel" && "glass-panel rounded-xl p-6",
          variant === "outline" && "border border-[var(--border-color)] rounded-xl p-6",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export const CardHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={twMerge("flex flex-col space-y-1.5 pb-4", className)} {...props} />
);
CardHeader.displayName = "CardHeader";

export const CardTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={twMerge(
      "text-lg font-semibold leading-none tracking-tight text-slate-100",
      className
    )}
    {...props}
  />
);
CardTitle.displayName = "CardTitle";

export const CardDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={twMerge("text-sm text-slate-400", className)} {...props} />
);
CardDescription.displayName = "CardDescription";

export const CardContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={twMerge("pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";
