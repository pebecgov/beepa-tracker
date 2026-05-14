"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAppUser } from "@/components/UserProvider";
import { Status } from "@/lib/types";
import { formatDate, formatScore } from "@/lib/utils";
import { downloadGeneralReportPDF } from "@/lib/pdf-export";

function TierBadge({ label }: { label: string }) {
  const className =
    label === "Super MDA"
      ? "bg-green-100 text-green-800"
      : label === "Excellent"
        ? "bg-blue-100 text-blue-800"
        : label === "Moderate"
          ? "bg-yellow-100 text-yellow-800"
          : "bg-red-100 text-red-800";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-gray-500">{message}</p>;
}

export default function GeneralReportPage() {
  const { isAdmin, isLoading } = useAppUser();
  const report = useQuery(api.performance.getGeneralReport);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!report) return;
    setDownloading(true);
    try {
      downloadGeneralReportPDF(report);
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading || report === undefined) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-10 w-96 mb-4" />
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!isAdmin || report === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Admin access required</h1>
            <p className="text-gray-600 mb-6">
              The general BEEPA performance report is restricted to administrators.
            </p>
            <Link
              href="/"
              className="inline-flex items-center rounded-lg bg-[#006B3F] px-4 py-2 text-sm font-medium text-white hover:bg-[#005432]"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const {
    summary,
    top10MDAs,
    reformsDoneFirst,
    leastCompletedReforms,
    mdasByStatus,
    mdasByTier,
    clusterPerformance,
  } = report;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="h-2 bg-pebec-gradient" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-5">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#006B3F] rounded-lg hover:bg-[#005432] transition-colors shadow-md"
            >
              Back to Dashboard
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
                PEBEC General Report
              </p>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                BEEPA Programme Performance Report
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                Generated {formatDate(report.generatedAt)} from current BEEPA reform records.
              </p>
            </div>
            <StatusBadge status={summary.overallStatus as Status} size="lg" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">Overall Score</p>
            <p className="text-3xl font-bold text-[#006B3F] mt-2">
              {formatScore(summary.overallScore)}
            </p>
            <p className="text-sm text-gray-600 mt-1">{summary.overallStatus.label}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">Total MDAs</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalMDAs}</p>
            <p className="text-sm text-gray-600 mt-1">Across BEEPA clusters</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">Top MDA</p>
            {summary.topMDA ? (
              <>
                <p className="text-xl font-bold text-gray-900 mt-2">
                  {summary.topMDA.mda.abbreviation || summary.topMDA.mda.name}
                </p>
                <p className="text-sm text-gray-600 mt-1">{formatScore(summary.topMDA.score)}</p>
              </>
            ) : (
              <EmptyState message="No MDA data yet" />
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">Lowest Cluster</p>
            {summary.lowestCluster ? (
              <>
                <p className="text-base font-bold text-gray-900 mt-2">
                  {summary.lowestCluster.name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {formatScore(summary.lowestCluster.score)}
                </p>
              </>
            ) : (
              <EmptyState message="No cluster data yet" />
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top 10 MDA Performance</h2>
            <p className="text-sm text-gray-500 mt-1">
              Applicable reforms and exemptions apply. Equal scores: earlier settlement of scoring activities ranks higher (same tie-break as the dashboard leaderboard).
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {top10MDAs.map((item) => (
              <div key={item.mda._id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1 text-lg font-bold text-[#006B3F]">#{item.rank}</div>
                <div className="col-span-4">
                  <p className="text-sm font-semibold text-gray-900">{item.mda.name}</p>
                  {item.mda.abbreviation && (
                    <p className="text-xs text-gray-500">{item.mda.abbreviation}</p>
                  )}
                </div>
                <div className="col-span-4">
                  <ProgressBar score={item.score} color={(item.status as Status).color} showLabel={false} size="sm" />
                </div>
                <div className="col-span-1 text-sm font-bold text-gray-900">{formatScore(item.score)}</div>
                <div className="col-span-2 flex justify-end">
                  <TierBadge label={item.tier.label} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Quick-Win Reform Areas</h2>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              Reforms with the highest completion rates across applicable MDAs.
            </p>
            <div className="space-y-4">
              {reformsDoneFirst.map((reform) => (
                <div key={reform.refNumber}>
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Reform {reform.refNumber}: {reform.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {reform.completedMdaCount}/{reform.applicableMdaCount} MDAs complete
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {formatScore(reform.completionRate)}
                    </span>
                  </div>
                  <ProgressBar score={reform.completionRate} color="green" showLabel={false} size="sm" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Implementation Gaps</h2>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              Reforms most MDAs have not fully completed.
            </p>
            <div className="space-y-5">
              {leastCompletedReforms.map((reform) => (
                <div key={reform.refNumber}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Reform {reform.refNumber}: {reform.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {reform.mdasNotDone.length} MDAs not fully complete
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {formatScore(reform.completionRate)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {reform.mdasNotDone.slice(0, 10).map((mda) => (
                      <span
                        key={`${reform.refNumber}-${mda.name}`}
                        className="rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-800"
                      >
                        {mda.abbreviation || mda.name} · {formatScore(mda.score)}
                      </span>
                    ))}
                    {reform.mdasNotDone.length > 10 && (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        +{reform.mdasNotDone.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">MDA Status Distribution</h2>
            <div className="mt-5 space-y-4">
              {mdasByStatus.map((group) => (
                <div key={group.label} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900">{group.label}</p>
                    <span className="text-sm font-bold text-gray-700">{group.mdas.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.mdas.length === 0 ? (
                      <EmptyState message="No MDAs in this status" />
                    ) : (
                      group.mdas.map((item) => (
                        <span key={item.mda._id} className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                          {item.mda.abbreviation || item.mda.name} · {formatScore(item.score)}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">General Scoring Tiers</h2>
            <p className="text-sm text-gray-500 mt-1">
              Admin view: Super MDAs earned bonus points through qualifying submissions; other tiers follow BEEPA score only.
            </p>
            <div className="mt-5 space-y-4">
              {mdasByTier.map((group) => (
                <div key={group.label} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <TierBadge label={group.label} />
                    <span className="text-sm font-bold text-gray-700">{group.mdas.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.mdas.length === 0 ? (
                      <EmptyState message="No MDAs in this tier" />
                    ) : (
                      group.mdas.map((item) => (
                        <span key={item.mda._id} className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                          {item.mda.abbreviation || item.mda.name} · {formatScore(item.score)}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Cluster Performance</h2>
            <p className="text-sm text-gray-500 mt-1">
              Cluster average is based on matched MDAs in each committee.
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {clusterPerformance.map((cluster, index) => (
              <div key={cluster.id} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-center">
                  <div className="lg:col-span-1 text-lg font-bold text-[#006B3F]">#{index + 1}</div>
                  <div className="lg:col-span-5">
                    <h3 className="text-sm font-semibold text-gray-900">{cluster.name}</h3>
                    <p className="text-xs text-gray-500">Cluster Lead: {cluster.lead}</p>
                    <p className="text-xs text-gray-500">
                      {cluster.matchedMdaCount}/{cluster.mdaCount} MDAs matched
                    </p>
                  </div>
                  <div className="lg:col-span-4">
                    <ProgressBar score={cluster.score} color={(cluster.status as Status).color} showLabel={false} size="sm" />
                  </div>
                  <div className="lg:col-span-2 lg:text-right">
                    <p className="text-sm font-bold text-gray-900">{formatScore(cluster.score)}</p>
                    <p className="text-xs text-gray-500">{cluster.status.label}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {cluster.members.map((member) => (
                    <span
                      key={member.name}
                      className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
                    >
                      {member.performance?.mda.abbreviation || member.name}
                      {member.performance ? ` · ${formatScore(member.performance.score)}` : " · No data"}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
