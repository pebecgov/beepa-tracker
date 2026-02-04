"use client";

import { MDAPerformance } from "@/lib/types";
import { StatusBadge } from "./ui/StatusBadge";
import { ProgressBar } from "./ui/ProgressBar";
import { RankBadge } from "./ui/RankBadge";
import { formatScore } from "@/lib/utils";

interface MDACardProps {
  performance: MDAPerformance;
  onClick?: () => void;
  showRank?: boolean;
}

export function MDACard({ performance, onClick, showRank = false }: MDACardProps) {
  const { mda, score, status, reformCount, rank } = performance;

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-200 relative overflow-hidden ${onClick ? "cursor-pointer hover:-translate-y-1 hover:border-[#006B3F]/30" : ""}`}
      onClick={onClick}
    >
      {/* Rank badge accent */}
      {showRank && rank && rank <= 3 && (
        <div className={`absolute top-0 right-0 w-16 h-16 ${
          rank === 1 ? "bg-yellow-400" : rank === 2 ? "bg-gray-300" : "bg-amber-600"
        } opacity-10 rounded-bl-full`} />
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {showRank && rank && <RankBadge rank={rank} />}
          <div>
            {mda.abbreviation && (
              <span className="inline-flex px-2 py-0.5 text-xs font-bold text-[#006B3F] bg-[#006B3F]/10 rounded mb-1">
                {mda.abbreviation}
              </span>
            )}
            <h3 className="text-base font-semibold text-gray-900 leading-tight">{mda.name}</h3>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <ProgressBar score={score} color={status.color} />
      </div>

      <div className="flex items-center justify-between">
        <StatusBadge status={status} size="sm" />
        <span className="text-lg font-bold text-[#006B3F]">{formatScore(score)}</span>
      </div>
    </div>
  );
}
