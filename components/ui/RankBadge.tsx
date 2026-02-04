"use client";

import { getRankSuffix } from "@/lib/utils";

interface RankBadgeProps {
  rank: number;
  size?: "sm" | "md" | "lg";
}

export function RankBadge({ rank, size = "md" }: RankBadgeProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  // Special styling for top 3
  const getBackgroundColor = () => {
    if (rank === 1) return "bg-yellow-400 text-yellow-900";
    if (rank === 2) return "bg-gray-300 text-gray-800";
    if (rank === 3) return "bg-amber-600 text-amber-100";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div
      className={`${sizeClasses[size]} ${getBackgroundColor()} rounded-full flex items-center justify-center font-bold`}
      title={getRankSuffix(rank)}
    >
      {rank}
    </div>
  );
}
