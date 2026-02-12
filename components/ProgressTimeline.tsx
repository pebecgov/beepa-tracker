"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatScore } from "@/lib/utils";

// 90-Day BEEPA cycle periods
const PERIODS = [
  { label: "Day 1-15", start: 1, end: 15 },
  { label: "Day 16-30", start: 16, end: 30 },
  { label: "Day 31-45", start: 31, end: 45 },
  { label: "Day 46-60", start: 46, end: 60 },
  { label: "Day 61-75", start: 61, end: 75 },
  { label: "Day 76-90", start: 76, end: 90 },
];

interface ProgressTimelineProps {
  cycleStartDate?: Date;
}

export function ProgressTimeline({ cycleStartDate }: ProgressTimelineProps) {
  const stats = useQuery(api.performance.getDashboardStats);
  const historicalData = useQuery(api.performance.getProgressHistory);

  // Calculate current day in the cycle
  const startDate = cycleStartDate || new Date("2026-01-26"); // Default: Jan 26, 2026
  const today = new Date();
  const dayInCycle = Math.max(1, Math.min(90, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))));

  // Get current period index
  const currentPeriodIndex = PERIODS.findIndex(p => dayInCycle >= p.start && dayInCycle <= p.end);

  // Use historical data if available, otherwise use current score for visualization
  const periodScores = historicalData || PERIODS.map((_, index) => {
    if (index < currentPeriodIndex) {
      // Past periods - show progression (simulated if no historical data)
      return stats ? (stats.averageScore * (index + 1)) / (currentPeriodIndex + 1) : 0;
    } else if (index === currentPeriodIndex) {
      // Current period - show actual score
      return stats?.averageScore || 0;
    } else {
      // Future periods - no data yet
      return null;
    }
  });

  const maxScore = Math.max(...periodScores.filter((s): s is number => s !== null), 0.01);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg relative overflow-hidden">
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#006B3F] to-[#008B52]" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">90-Day BEEPA Overall Performance</h3>
          <p className="text-sm text-gray-500 mt-1">
            Current: Day {dayInCycle} of 90 ({PERIODS[Math.max(0, currentPeriodIndex)]?.label || "Day 1-15"})
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Current Score</p>
          <p className="text-2xl font-bold text-[#006B3F]">{formatScore(stats?.averageScore || 0)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-gray-500">
          <span>100.00%</span>
          <span>75.00%</span>
          <span>50.00%</span>
          <span>25.00%</span>
          <span>0.00%</span>
        </div>

        {/* Chart area */}
        <div className="ml-16 h-full flex flex-col">
          {/* Grid and bars */}
          <div className="flex-1 relative border-l border-b border-gray-200">
            {/* Horizontal grid lines */}
            {[0, 25, 50, 75, 100].map((pct) => (
              <div
                key={pct}
                className="absolute left-0 right-0 border-t border-gray-100"
                style={{ bottom: `${pct}%` }}
              />
            ))}

            {/* Target line at 95% (Successful threshold) */}
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-[#006B3F]/30"
              style={{ bottom: "95%" }}
            >
              <span className="absolute right-0 -top-5 text-xs text-[#006B3F] font-medium">
                Target: 100%
              </span>
            </div>

            {/* Bars */}
            <div className="absolute inset-0 flex items-end justify-around px-2">
              {PERIODS.map((period, index) => {
                const score = periodScores[index];
                const isCurrentPeriod = index === currentPeriodIndex;
                const isFuture = score === null;
                const heightPercent = isFuture ? 0 : (score || 0) * 100;

                return (
                  <div key={period.label} className="flex flex-col items-center flex-1 max-w-24">
                    {/* Bar */}
                    <div className="w-full px-1 h-full flex items-end">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 relative group ${
                          isFuture
                            ? "bg-gray-100 border-2 border-dashed border-gray-300"
                            : isCurrentPeriod
                            ? "bg-gradient-to-t from-[#006B3F] to-[#008B52] shadow-lg"
                            : "bg-gradient-to-t from-[#006B3F]/70 to-[#008B52]/70"
                        }`}
                        style={{ height: isFuture ? "100%" : `${heightPercent}%`, minHeight: isFuture ? "100%" : "4px" }}
                      >
                        {/* Tooltip */}
                        {!isFuture && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {formatScore(score || 0)}
                          </div>
                        )}
                        
                        {/* Score label on bar */}
                        {!isFuture && heightPercent > 15 && (
                          <span className="absolute top-2 left-1/2 -translate-x-1/2 text-white text-xs font-bold">
                            {formatScore(score || 0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex justify-around mt-2">
            {PERIODS.map((period, index) => (
              <div
                key={period.label}
                className={`text-xs text-center flex-1 max-w-24 ${
                  index === currentPeriodIndex
                    ? "text-[#006B3F] font-bold"
                    : "text-gray-500"
                }`}
              >
                {period.label}
                {index === currentPeriodIndex && (
                  <div className="w-2 h-2 bg-[#006B3F] rounded-full mx-auto mt-1 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-t from-[#006B3F] to-[#008B52]" />
          <span className="text-xs text-gray-600">Current Period</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-t from-[#006B3F]/70 to-[#008B52]/70" />
          <span className="text-xs text-gray-600">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-dashed border-gray-300 bg-gray-100" />
          <span className="text-xs text-gray-600">Upcoming</span>
        </div>
      </div>
    </div>
  );
}
