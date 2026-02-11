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

  return (
    <div
      className={`${sizeClasses[size]} bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-bold`}
      title={getRankSuffix(rank)}
    >
      {rank}
    </div>
  );
}
