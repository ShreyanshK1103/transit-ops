import React from "react";
import { twMerge } from "tailwind-merge";

export type StatusType =
  | "available"
  | "active"
  | "maintenance"
  | "suspended"
  | "ai-optimized"
  | "dispatched"
  | "retired";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  children,
  ...props
}) => {
  const normStatus = status.toLowerCase() as StatusType;

  const config = {
    available: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      border: "border-cyan-500/20",
      beacon: "bg-cyan-400 beacon-cyan",
      label: "Available",
    },
    active: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      beacon: "bg-emerald-400 beacon-emerald",
      label: "Active",
    },
    dispatched: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      beacon: "bg-emerald-400 beacon-emerald",
      label: "Dispatched",
    },
    maintenance: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/20",
      beacon: "bg-amber-400 beacon-amber",
      label: "Maintenance",
    },
    suspended: {
      bg: "bg-red-500/10",
      text: "text-red-400",
      border: "border-red-500/20",
      beacon: "bg-red-400 beacon-crimson",
      label: "Suspended",
    },
    retired: {
      bg: "bg-slate-700/20",
      text: "text-slate-400",
      border: "border-slate-700/30",
      beacon: "bg-slate-500",
      label: "Retired",
    },
    "ai-optimized": {
      bg: "bg-violet-500/10",
      text: "text-violet-300",
      border: "border-violet-500/20",
      beacon: "bg-violet-400 beacon-purple animate-pulse",
      label: "AI Optimized",
    },
  };

  const style = config[normStatus] || {
    bg: "bg-slate-700/20",
    text: "text-slate-300",
    border: "border-slate-700/30",
    beacon: "bg-slate-400",
    label: status,
  };

  return (
    <span
      className={twMerge(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm",
        style.bg,
        style.text,
        style.border,
        className
      )}
      {...props}
    >
      <span className={twMerge("w-1.5 h-1.5 rounded-full", style.beacon)} />
      {children || style.label}
    </span>
  );
};
StatusBadge.displayName = "StatusBadge";
