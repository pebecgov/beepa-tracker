"use client";

export const dynamic = "force-dynamic";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAppUser } from "@/components/UserProvider";
import { Status } from "@/lib/types";
import { formatDate, formatScore } from "@/lib/utils";
import { downloadScorecardPDF } from "@/lib/pdf-export";

interface MDAScorecardPageProps {
  params: Promise<{ id: string }>;
}

function TierBadge({ tier }: { tier: { label: string; color: string } }) {
  const className =
    tier.color === "green"
      ? "bg-green-100 text-green-800"
      : tier.color === "blue"
        ? "bg-blue-100 text-blue-800"
        : tier.color === "yellow"
          ? "bg-yellow-100 text-yellow-800"
          : "bg-red-100 text-red-800";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${className}`}>
      {tier.label}
    </span>
  );
}

export default function MDAScorecardPage({ params }: MDAScorecardPageProps) {
  const { id } = use(params);
  const mdaId = id as Id<"mdas">;
  const { isAdmin, isLoading } = useAppUser();
  const scorecard = useQuery(api.performance.getMDAReportCard, { mdaId });
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!scorecard) return;
    setDownloading(true);
    try {
      downloadScorecardPDF(scorecard);
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading || scorecard === undefined) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-10 w-80 mb-4" />
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!isAdmin || scorecard === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Admin access required</h1>
            <p className="text-gray-600 mb-6">
              Individual MDA scorecards are restricted to administrators.
            </p>
            <Link
              href={`/mda/${mdaId}`}
              className="inline-flex items-center rounded-lg bg-[#006B3F] px-4 py-2 text-sm font-medium text-white hover:bg-[#005432]"
            >
              Back to MDA
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { mda, score, status, tier, summary, reformRows, weakestReforms } = scorecard;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="h-2 bg-pebec-gradient" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-5">
            <Link
              href={`/mda/${mdaId}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#006B3F] rounded-lg hover:bg-[#005432] transition-colors shadow-md"
            >
              Back to MDA
            </Link>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#006B3F] bg-white border border-[#006B3F]/30 rounded-lg hover:bg-[#006B3F]/5 transition-colors disabled:opacity-60"
            >
              {downloading ? "Generating PDF…" : "Download PDF"}
            </button>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#006B3F]">
                Individual MDA Scorecard
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {mda.abbreviation && (
                  <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold text-white bg-[#006B3F] rounded-lg">
                    {mda.abbreviation}
                  </span>
                )}
                <h1 className="text-2xl font-bold text-gray-900">{mda.name}</h1>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Generated {formatDate(scorecard.generatedAt)} from current BEEPA reform records.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <TierBadge tier={tier} />
              <StatusBadge status={status as Status} size="lg" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Overall Performance</h2>
                <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
              </div>
              <span className="text-3xl font-bold text-[#006B3F]">{formatScore(score)}</span>
            </div>
            <ProgressBar score={score} color={(status as Status).color} showLabel={false} size="lg" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Applicable Reforms</p>
                <p className="text-xl font-semibold text-gray-900">
                  {summary.scoringReformCount}/{summary.reformCount}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Completion Rate</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatScore(summary.completionRate)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Activities Complete</p>
                <p className="text-xl font-semibold text-gray-900">
                  {summary.completedActivities}/{summary.totalApplicableActivities}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Exceptions</p>
                <p className="text-xl font-semibold text-gray-900">
                  {summary.exceptionReformCount} reforms, {summary.exceptionActivityCount} activities
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">PEBEC Notes</h2>
            {weakestReforms.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Priority follow-up should focus on the lowest-scoring applicable reforms:
                </p>
                <ul className="space-y-2">
                  {weakestReforms.map((reform) => (
                    <li key={reform.refNumber} className="text-sm text-gray-800">
                      <span className="font-semibold">Reform {reform.refNumber}:</span>{" "}
                      {reform.name} ({formatScore(reform.score)})
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                No major reform gaps currently flagged. MDA is tracking strongly across applicable
                reforms.
              </p>
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Reform Score Breakdown</h2>
            <p className="text-sm text-gray-500 mt-1">
              Each reform score is calculated from applicable activities only.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-linear-to-r from-[#006B3F] to-[#008B52] text-white">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Reform</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Activity Position</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Overall Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reformRows.map((row) => (
                  <tr key={row.reform._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        Reform {row.reform.refNumber}
                      </p>
                      <p className="text-sm text-gray-600">{row.reform.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">{formatScore(row.score)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={row.status as Status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {row.completedCount} complete, {row.inProgressCount} in progress,{" "}
                      {row.notStartedCount} not started
                    </td>
                    <td className="px-6 py-4">
                      {row.countsTowardOverall ? (
                        <span className="text-sm font-medium text-green-800">Included</span>
                      ) : (
                        <span className="text-sm font-medium text-amber-800">Exception</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Detailed Activity Evidence</h2>
            <p className="text-sm text-gray-500 mt-1">
              Admin view of activity-level completion used to generate this scorecard.
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {reformRows.map((row) => (
              <div key={row.reform._id} className="p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Reform {row.reform.refNumber}: {row.reform.name}
                    </h3>
                    {!row.countsTowardOverall && (
                      <p className="text-sm text-amber-800 mt-1">
                        This reform is under exception and not included in the MDA&apos;s overall score.
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatScore(row.score)}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                        <th className="py-2 pr-4">Ref</th>
                        <th className="py-2 pr-4">Activity</th>
                        <th className="py-2 pr-4">Weight</th>
                        <th className="py-2 pr-4">Completion</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2">Score Use</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {row.activities.map((activity) => (
                        <tr key={activity._id}>
                          <td className="py-2 pr-4 font-mono text-gray-500">{activity.refNumber}</td>
                          <td className="py-2 pr-4 text-gray-900">{activity.name}</td>
                          <td className="py-2 pr-4 text-gray-700">{Math.round(activity.weight * 100)}%</td>
                          <td className="py-2 pr-4 text-gray-700">
                            {Math.round(activity.completionLevel * 100)}%
                          </td>
                          <td className="py-2 pr-4 text-gray-700">
                            {activity.status === "complete"
                              ? "Complete"
                              : activity.status === "in_progress"
                                ? "In Progress"
                                : "Not Started"}
                          </td>
                          <td className="py-2">
                            {activity.countsTowardScore ? (
                              <span className="text-green-800">Included</span>
                            ) : (
                              <span className="text-amber-800">Exception</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
