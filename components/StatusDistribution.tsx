"use client";

import { DashboardStats } from "@/lib/types";
import { getStatusColorClasses } from "@/lib/utils";

interface StatusDistributionProps {
  stats: DashboardStats;
}

export function StatusDistribution({ stats }: StatusDistributionProps) {
  const { statusCounts, totalMDAs } = stats;

  const items = [
    {
      label: "Successful",
      count: statusCounts.successful,
      color: "green" as const,
      range: "90% - 100%",
    },
    {
      label: "Progressing Well",
      count: statusCounts.progressingWell,
      color: "blue" as const,
      range: "71% - 89%",
    },
    {
      label: "Progressing",
      count: statusCounts.progressing,
      color: "yellow" as const,
      range: "50% - 70%",
    },
    {
      label: "Progressing With Difficulty",
      count: statusCounts.progressingWithDifficulty,
      color: "orange" as const,
      range: "31% - 49%",
    },
    {
      label: "Requires Intervention",
      count: statusCounts.requiresIntervention,
      color: "red" as const,
      range: "0% - 30%",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg relative overflow-hidden">
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#006B3F] to-[#008B52]" />

      <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>

      {/* Stacked bar */}
      <div className="h-8 rounded-full overflow-hidden flex mb-6">
        {items.map((item) => {
          const percentage = totalMDAs > 0 ? (item.count / totalMDAs) * 100 : 0;
          if (percentage === 0) return null;

          const colors = getStatusColorClasses(item.color);
          return (
            <div
              key={item.label}
              className={`${colors.progress} transition-all duration-500`}
              style={{ width: `${percentage}%` }}
              title={`${item.label}: ${item.count} (${Math.round(percentage)}%)`}
            />
          );
        })}
        {totalMDAs === 0 && <div className="w-full bg-gray-200" />}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const colors = getStatusColorClasses(item.color);
          const percentage = totalMDAs > 0 ? (item.count / totalMDAs) * 100 : 0;

          return (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors.progress}`} />
              <div className="flex-1">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-xs text-gray-400 ml-2">({item.range})</span>
              </div>
              <span className="text-sm font-medium text-gray-900 ml-auto">
                {item.count} ({Math.round(percentage)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
