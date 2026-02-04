"use client";

import { Status } from "@/lib/types";
import { getStatusColorClasses } from "@/lib/utils";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const colors = getStatusColorClasses(status.color);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${colors.badge} ${sizeClasses[size]}`}
    >
      {status.label}
    </span>
  );
}
