"use client";

export const dynamic = "force-dynamic";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { use, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatScore } from "@/lib/utils";
import { ActivityStatus, Status } from "@/lib/types";
import { useAppUser } from "@/components/UserProvider";
import {
  mdaHasPartialReformScoring,
  reformCountsTowardMdaScore,
  activityCountsTowardMdaScore,
} from "@/lib/beepa-scoring";

interface MDAPageProps {
  params: Promise<{ id: string }>;
}

export default function MDAPage({ params }: MDAPageProps) {
  const { id } = use(params);
  const mdaId = id as Id<"mdas">;
  const { isAdmin } = useAppUser();

  const [expandedReform, setExpandedReform] = useState<Id<"reforms"> | null>(null);

  const mdaPerformance = useQuery(api.performance.getMDAPerformance, { mdaId });

  const partialReformScoreBreakdown = useMemo(() => {
    if (!mdaPerformance) return null;
    const { mda, reforms } = mdaPerformance;
    if (!mdaHasPartialReformScoring(mda) || !reforms?.length) return null;
    const rows = [...reforms].sort((a, b) => a.reform.refNumber - b.reform.refNumber);
    const sumAll = rows.reduce((acc, r) => acc + r.score, 0);
    const averageAllReforms = sumAll / rows.length;
    const scoringRows = rows.filter((r) => reformCountsTowardMdaScore(mda, r.reform.refNumber));
    const sumScoring = scoringRows.reduce((acc, r) => acc + r.score, 0);
    const averageScoringReforms =
      scoringRows.length === 0 ? 0 : sumScoring / scoringRows.length;
    return { rows, averageAllReforms, averageScoringReforms };
  }, [mdaPerformance]);

  if (!mdaPerformance) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }

  const { mda, score, status, reforms, reformCount, scoringReformCount } = mdaPerformance;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        {/* Green accent bar */}
        <div className="h-2 bg-pebec-gradient" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-sm font-medium text-white bg-[#006B3F] rounded-lg hover:bg-[#005432] transition-colors shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          {isAdmin && (
            <Link
              href={`/mda/${mdaId}/scorecard`}
              className="inline-flex items-center gap-2 px-4 py-2 mb-4 ml-3 text-sm font-medium text-[#006B3F] bg-white border border-[#006B3F]/30 rounded-lg hover:bg-[#006B3F]/5 transition-colors shadow-sm"
            >
              View Scorecard
            </Link>
          )}

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                {mda.abbreviation && (
                  <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold text-white bg-[#006B3F] rounded-lg">
                    {mda.abbreviation}
                  </span>
                )}
                <h1 className="text-2xl font-bold text-gray-900">{mda.name}</h1>
              </div>
              {mda.description && (
                <p className="text-gray-500 mt-2">{mda.description}</p>
              )}
            </div>
            <StatusBadge status={status as Status} size="lg" />
          </div>

          <div className="mt-6 bg-linear-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Overall BEEPA Score (Applicable Reforms)
              </span>
              <span className="text-2xl font-bold text-[#006B3F]">{formatScore(score)}</span>
            </div>
            {mda.abbreviation === "NCC" && (
              <p className="text-xs text-gray-600 mb-2">
                Based on reforms 1, 2, 3, 5, and 7 only. Reforms 4 and 6 are not applicable to NCC and
                are excluded from this score.
              </p>
            )}
            {mda.abbreviation === "GBB" && (
              <p className="text-xs text-gray-600 mb-2">
                Based on reforms 1, 2, 3, and 7 only. Reforms 4, 5, and 6 are not applicable to Galaxy
                Backbone Limited and are excluded from this score.
              </p>
            )}
            {mda.abbreviation === "NIS" && (
              <p className="text-xs text-gray-600 mb-2">
                Based on all 7 reforms. Within Reform 6, activities 6.6 and 6.7 are not applicable to
                NIS and are excluded from Reform 6&apos;s weighted score.
              </p>
            )}
            {partialReformScoreBreakdown && (
              <div className="mb-3 rounded-lg border border-gray-200 bg-white/80 p-3 text-sm">
                <p className="font-medium text-gray-800 mb-2">
                  Current scoring method ({mda.abbreviation})
                </p>
                {mda.abbreviation === "NCC" ? (
                  <p className="text-xs text-gray-600 mb-3">
                    The headline score above is the average of the five applicable reforms only. The
                    all-reforms number is shown below as a legacy reference.
                  </p>
                ) : mda.abbreviation === "GBB" ? (
                  <p className="text-xs text-gray-600 mb-3">
                    The headline score above is the average of the four applicable reforms only. The
                    all-reforms number is shown below as a legacy reference.
                  </p>
                ) : null}

                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-500">
                        <th className="py-1 pr-2 font-medium">Reform</th>
                        <th className="py-1 pr-2 font-medium">Score</th>
                        <th className="py-1 font-medium">Counts in current score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partialReformScoreBreakdown.rows.map((r) => {
                        const counts = reformCountsTowardMdaScore(mda, r.reform.refNumber);
                        return (
                          <tr key={r.reform._id} className="border-b border-gray-100">
                            <td className="py-1.5 pr-2">
                              {r.reform.refNumber}. {r.reform.name}
                            </td>
                            <td className="py-1.5 pr-2 tabular-nums">{formatScore(r.score)}</td>
                            <td className="py-1.5">
                              {counts ? <span className="text-green-800">Yes</span> : <span className="text-amber-800">No</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <dl className="mt-3 space-y-1 text-xs border-t border-gray-200 pt-3">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-700 font-medium">
                      Current methodology (average of applicable reforms only)
                    </dt>
                    <dd className="font-semibold tabular-nums text-[#006B3F]">
                      {formatScore(partialReformScoreBreakdown.averageScoringReforms)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Legacy methodology (average of all 7 reforms)</dt>
                    <dd className="font-medium tabular-nums text-gray-700">
                      {formatScore(partialReformScoreBreakdown.averageAllReforms)}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
            {mda.abbreviation === "NIS" && reforms && reforms.length > 0 && (
              <div className="mb-3 rounded-lg border border-gray-200 bg-white/80 p-3 text-sm">
                <p className="font-medium text-gray-800 mb-2">
                  Current scoring method (NIS)
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  The headline score above covers all 7 reforms. Within Reform 6, activities 6.6 and
                  6.7 are excluded from the weighted score — they are not applicable to NIS.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-500">
                        <th className="py-1 pr-2 font-medium">Reform</th>
                        <th className="py-1 pr-2 font-medium">Score</th>
                        <th className="py-1 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...reforms]
                        .sort((a, b) => a.reform.refNumber - b.reform.refNumber)
                        .map((r) => (
                          <tr key={r.reform._id} className="border-b border-gray-100">
                            <td className="py-1.5 pr-2">
                              {r.reform.refNumber}. {r.reform.name}
                            </td>
                            <td className="py-1.5 pr-2 tabular-nums">{formatScore(r.score)}</td>
                            <td className="py-1.5">
                              {r.reform.refNumber === 6 ? (
                                <span className="text-amber-800">Activities 6.6 &amp; 6.7 excluded</span>
                              ) : (
                                <span className="text-green-800">All activities included</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <ProgressBar score={score} color={(status as Status).color} showLabel={false} size="lg" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {`BEEPA Reforms (${reforms?.length || 0}${
              scoringReformCount !== undefined &&
              scoringReformCount !== reformCount
                ? ` — ${scoringReformCount} counted toward overall score`
                : ""
            })`}
          </h2>
          <p className="text-sm text-gray-500">
            Click on a reform to view and update activities
          </p>
        </div>

        {/* Reforms List */}
        {reforms && reforms.length > 0 ? (
          <div className="space-y-4">
            {reforms.map((reformPerf) => {
              const isExpanded = expandedReform === reformPerf.reform._id;

              return (
                <div
                  key={reformPerf.reform._id}
                  className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Reform Header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedReform(isExpanded ? null : reformPerf.reform._id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <button className="text-gray-400 hover:text-gray-600 p-1">
                          <svg
                            className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#006B3F] text-white text-sm font-bold shadow-sm">
                              {reformPerf.reform.refNumber}
                            </span>
                            <h3 className="text-base font-semibold text-gray-900">
                              {reformPerf.reform.name}
                            </h3>
                            {!reformCountsTowardMdaScore(mda, reformPerf.reform.refNumber) && (
                              <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                                Not included in overall score
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={reformPerf.status as Status} size="sm" />
                    </div>

                    <div className="flex items-center gap-4 ml-9">
                      <div className="flex-1 max-w-md">
                        <ProgressBar
                          score={reformPerf.score}
                          color={(reformPerf.status as Status).color}
                          showLabel={false}
                          size="sm"
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 min-w-[48px]">
                        {formatScore(reformPerf.score)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {reformPerf.completedCount}/{reformPerf.activityCount} scoring activities
                        {(reformPerf.exemptActivityCount ?? 0) > 0 ? (
                          <span className="text-amber-800 font-medium">
                            {" "}
                            · {reformPerf.exemptActivityCount} exempt
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </div>

                  {/* Expanded: Activities */}
                  {isExpanded && (
                    <ActivitiesList
                      reformId={reformPerf.reform._id}
                      mda={mda}
                      reformRefNumber={reformPerf.reform.refNumber}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No reforms found for this MDA.</p>
          </div>
        )}
      </main>
    </div>
  );
}

// Activities list component
function ActivitiesList({
  reformId,
  mda,
  reformRefNumber,
}: {
  reformId: Id<"reforms">;
  mda?: { abbreviation?: string | null };
  reformRefNumber?: number;
}) {
  const { canEdit } = useAppUser();
  const activities = useQuery(api.activities.listByReform, { reformId });
  const updateCompletion = useMutation(api.activities.updateCompletion);

  const handleQuickStatus = async (
    activityId: Id<"activities">,
    newStatus: ActivityStatus
  ) => {
    if (!canEdit) {
      toast.error("You don't have permission to update activities");
      return;
    }

    const completionLevel =
      newStatus === "complete" ? 1 : newStatus === "in_progress" ? 0.5 : 0;

    try {
      await updateCompletion({
        id: activityId,
        completionLevel,
        status: newStatus,
      });
      toast.success("Activity updated!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update activity";
      toast.error(message);
    }
  };


  if (!activities) {
    return (
      <div className="p-5 border-t border-gray-200">
        <Skeleton className="h-12 w-full mb-2" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  // Sort by ref number
  const sortedActivities = [...activities].sort((a, b) => {
    const aNum = parseFloat(a.refNumber.split(".")[1] || "0");
    const bNum = parseFloat(b.refNumber.split(".")[1] || "0");
    return aNum - bNum;
  });

  const activityCountsTowardScore = (refNumber: string) =>
    mda && reformRefNumber !== undefined
      ? activityCountsTowardMdaScore(mda, reformRefNumber, refNumber)
      : true;

  const applicableActivities = sortedActivities.filter((a) => activityCountsTowardScore(a.refNumber));
  const exemptActivities = sortedActivities.filter((a) => !activityCountsTowardScore(a.refNumber));
  const scoringActivitiesComplete = applicableActivities.filter((a) => a.status === "complete").length;

  return (
    <div className="border-t border-gray-200">
      {/* Header */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <div className="col-span-1">Ref</div>
        <div className="col-span-4">Activity</div>
        <div className="col-span-1 text-center">Weight</div>
        <div className="col-span-2 text-center">Completion</div>
        <div className="col-span-4 text-center">Status</div>
      </div>

      {/* Activities */}
      <div className="divide-y divide-gray-100">
        {sortedActivities.map((activity) => {
          const isExemptFromScore = !activityCountsTowardScore(activity.refNumber);
          return (
          <div
            key={activity._id}
            className={`px-5 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors ${
              isExemptFromScore ? "bg-amber-50/70 border-l-4 border-amber-400" : ""
            }`}
          >
            {/* Ref Number */}
            <div className="col-span-1">
              <span className="text-sm font-mono text-gray-500">
                {activity.refNumber}
              </span>
            </div>

            {/* Activity Name */}
            <div className="col-span-4">
              <p className="text-sm text-gray-900 leading-tight">{activity.name}</p>
              {isExemptFromScore && (
                  <span className="inline-flex items-center rounded-md bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-950 mt-1.5">
                    Exempted — not counted in BEEPA score
                  </span>
              )}
            </div>

            {/* Weight */}
            <div className="col-span-1 text-center">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                {Math.round(activity.weight * 100)}%
              </span>
            </div>

            {/* Completion Level */}
            <div className="col-span-2">
              <div className="w-full flex items-center justify-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${activity.status === "complete" ? "bg-green-500" :
                      activity.status === "in_progress" ? "bg-amber-500" : "bg-red-400"
                      }`}
                    style={{ width: `${activity.completionLevel * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 min-w-[45px] text-right">
                  {Math.round(activity.completionLevel * 100)}%
                </span>
              </div>
            </div>

            {/* Quick Status Buttons or View-only Status */}
            <div className="col-span-4 flex items-center justify-center gap-1">
              {canEdit ? (
                <select
                  value={activity.status}
                  onChange={(e) => handleQuickStatus(activity._id, e.target.value as ActivityStatus)}
                  className={`px-2 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                    activity.status === "complete"
                      ? "bg-[#006B3F]/10 text-[#006B3F] border-[#006B3F]/30 focus:ring-[#006B3F]"
                      : activity.status === "in_progress"
                      ? "bg-amber-100 text-amber-800 border-amber-300 focus:ring-amber-400"
                      : "bg-red-100 text-red-800 border-red-300 focus:ring-red-400"
                  }`}
                >
                  <option value="not_started">0%</option>
                  <option value="in_progress">50%</option>
                  <option value="complete">100%</option>
                </select>
              ) : (
                <span className={`px-3 py-1.5 text-xs font-medium rounded-lg ${activity.status === "complete"
                  ? "bg-[#006B3F]/10 text-[#006B3F]"
                  : activity.status === "in_progress"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-800"
                  }`}>
                  {activity.status === "complete" ? "Complete" : activity.status === "in_progress" ? "Progressing" : "Not Started"}
                </span>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-gray-500">
            {scoringActivitiesComplete} of {applicableActivities.length} scoring activities complete
            {exemptActivities.length > 0 ? (
              <span className="text-amber-950 font-medium">
                {" "}
                ({exemptActivities.length} exempt{": "}
                {exemptActivities.map((a) => a.refNumber).join(", ")})
              </span>
            ) : null}
          </span>
          {!canEdit && (
            <span className="text-gray-400 text-xs">
              View only
            </span>
          )}
        </div>
        <span className="font-medium text-gray-700">
          Weighted Score:{" "}
          <span className="text-gray-900 font-bold">
            {(() => {
              const applicable = sortedActivities.filter((a) =>
                mda && reformRefNumber !== undefined
                  ? activityCountsTowardMdaScore(mda, reformRefNumber, a.refNumber)
                  : true
              );
              const totalWeight = applicable.reduce((sum, a) => sum + a.weight, 0);
              const weightedSum = applicable.reduce((sum, a) => sum + a.completionLevel * a.weight, 0);
              return formatScore(totalWeight > 0 ? weightedSum / totalWeight : 0);
            })()}
          </span>
        </span>
      </div>
    </div>
  );
}

