"use client";

import { StatusColor } from "@/lib/types";
import { getStatusColorClasses, formatScore } from "@/lib/utils";

interface ProgressBarProps {
  score: number;
  color: StatusColor;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function ProgressBar({
  score,
  color,
  showLabel = true,
  size = "md",
  animated = true,
}: ProgressBarProps) {
  const colors = getStatusColorClasses(color);
  const percentage = Math.min(Math.max(score * 100, 0), 100);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        {showLabel && (
          <span className="text-sm font-medium text-gray-700">{formatScore(score)}</span>
        )}
      </div>
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${colors.progress} ${sizeClasses[size]} rounded-full ${animated ? "transition-all duration-500 ease-out" : ""}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
