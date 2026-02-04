"use client";

import { MDAPerformance } from "@/lib/types";
import { StatusBadge } from "./ui/StatusBadge";
import { ProgressBar } from "./ui/ProgressBar";
import { RankBadge } from "./ui/RankBadge";
import { formatScore, getRankSuffix } from "@/lib/utils";

interface RankingTableProps {
  rankings: MDAPerformance[];
  onRowClick?: (mda: MDAPerformance) => void;
}

export function RankingTable({ rankings, onRowClick }: RankingTableProps) {
  if (rankings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Green header accent */}
      <div className="h-1 bg-gradient-to-r from-[#006B3F] to-[#008B52]" />
      
      <div className="overflow-auto max-h-[600px]">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-[#006B3F] to-[#008B52] text-white">
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                MDA
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                Reforms
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rankings.map((item, index) => (
              <tr
                key={item.mda._id}
                className={`transition-all duration-150 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                } ${onRowClick ? "cursor-pointer hover:bg-[#006B3F]/5 hover:shadow-sm" : ""}`}
                onClick={() => onRowClick?.(item)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <RankBadge rank={item.rank || 0} />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.mda.name}</div>
                    {item.mda.abbreviation && (
                      <div className="text-sm text-gray-500">{item.mda.abbreviation}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatScore(item.score)}
                  </span>
                </td>
                <td className="px-6 py-4 w-40">
                  <ProgressBar score={item.score} color={item.status.color} showLabel={false} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={item.status} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.reformCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
