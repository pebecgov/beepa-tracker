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
import {
  EXCEPTIONAL_SUPER_MDA_TIER_LABEL,
  generalReportMdaNameWithAbbrev,
} from "@/lib/beepa-scoring";
import {
  collectSuperMdaBonusNarrativeBlocks,
  type SuperMdaBonusNarrative,
} from "@/lib/beepa-super-bonus-narratives";
import { formatDate, formatScore } from "@/lib/utils";
import { downloadGeneralReportPDF } from "@/lib/pdf-export";

function TierBadge({ label }: { label: string }) {
  const className =
    label === EXCEPTIONAL_SUPER_MDA_TIER_LABEL
      ? "bg-green-100 text-green-800"
      : label === "Excellent" || label === "Very Good" || label === "Good"
        ? "bg-blue-100 text-blue-800"
        : label === "Fair"
          ? "bg-yellow-100 text-yellow-800"
          : label === "Poor"
            ? "bg-red-100 text-red-800"
            : "bg-gray-100 text-gray-800";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function BonusNarrativeCard({
  abbrev,
  name,
  narrative,
}: {
  abbrev: string;
  name: string;
  narrative: SuperMdaBonusNarrative;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4">
      <p className="text-sm font-semibold text-gray-900">
        {abbrev} — {name}
      </p>
      {narrative.title && (
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#006B3F]">{narrative.title}</p>
      )}
      {narrative.submissionRows && narrative.submissionRows.length > 0 ? (
        <div className="mt-3 overflow-x-auto rounded-md border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-[#006B3F]/10">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-900">Activity / measure</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-900">Compliance level</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-900">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {narrative.submissionRows.map((row, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-gray-800">{row.activity}</td>
                  <td className="px-3 py-2 text-gray-700">{row.complianceLevel}</td>
                  <td className="px-3 py-2 text-gray-600">{row.evidenceAvailable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {narrative.bullets && narrative.bullets.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {narrative.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
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
    mdasByPerformanceTier,
    reformAreasCompletion,
    exceptionProgramNotes,
  } = report;

  const bonusNarrativeBlocks = collectSuperMdaBonusNarrativeBlocks(mdasByPerformanceTier);

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
        <section className="rounded-xl border border-amber-100 bg-amber-50/70 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold text-amber-900">How to read performance tiers</p>
          <p className="mt-1 text-amber-950/90">
            MDAs are grouped by weighted tracker score: Excellent 100% · Very Good 80–99% · Good 60–79% · Fair 50–59% · Poor
            0–49%. Groupings are not a league table.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">Overall score</p>
            <p className="text-3xl font-bold text-[#006B3F] mt-2">{formatScore(summary.overallScore)}</p>
            <p className="text-sm text-gray-600 mt-1">{summary.overallStatus.label}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">Total MDAs</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalMDAs}</p>
            <p className="text-sm text-gray-600 mt-1">On the BEEPA reform tracker</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">Full implementation</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{summary.fullImplementationCount}</p>
            <p className="text-sm text-gray-600 mt-1">MDAs at ~100% applicable reform score</p>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">MDAs by performance tier</h2>
            <p className="text-sm text-gray-500 mt-1">Bands reflect applicable weighted reform completion only.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {mdasByPerformanceTier.map((tierBlock) =>
              tierBlock.mdas.length === 0 ? null : (
                <div key={tierBlock.label} className="px-6 py-6">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <TierBadge label={tierBlock.label} />
                    <span className="text-sm text-gray-500">
                      {tierBlock.mdas.length} {tierBlock.mdas.length === 1 ? "MDA" : "MDAs"}
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900">MDA</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900">Score</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {tierBlock.mdas.map((item) => (
                          <tr key={item.mda._id}>
                            <td className="px-4 py-3 font-medium text-gray-900 max-w-md">
                              {generalReportMdaNameWithAbbrev(item.mda)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1 max-w-[200px]">
                                <ProgressBar
                                  score={item.score}
                                  color={(item.status as Status).color}
                                  showLabel={false}
                                  size="sm"
                                />
                                <span className="text-xs font-semibold text-gray-900">
                                  {formatScore(item.score)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{item.status.label}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {bonusNarrativeBlocks.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Super MDA — regulatory simplification submissions</h2>
            <p className="text-sm text-gray-500 mt-1">
              NPA and NCS validated bonus-point claims under the BEEPA Weighted Reform Framework (regulatory
              simplification cluster).
            </p>
            <div className="mt-6 space-y-4">
              {bonusNarrativeBlocks.map((block) => (
                <BonusNarrativeCard
                  key={`${block.abbrev}-${block.name}`}
                  abbrev={block.abbrev}
                  name={block.name}
                  narrative={block.narrative}
                />
              ))}
            </div>
          </section>
        )}

        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Reform areas and completion rate</h2>
            <p className="text-sm text-gray-500 mt-1">
              Completion counts applicable MDAs only. Columns{" "}
              <span className="rounded bg-amber-100 px-1 font-medium text-amber-900">Ongoing</span> and{" "}
              <span className="rounded bg-violet-100 px-1 font-medium text-violet-900">Exception</span> use distinct
              styling (matches PDF).
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Ref</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Reform</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Completion</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Complete</th>
                  <th className="px-4 py-3 text-left font-semibold text-amber-950 bg-amber-50">Ongoing</th>
                  <th className="px-4 py-3 text-left font-semibold text-violet-950 bg-violet-50">Exception</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {reformAreasCompletion.map((row) => (
                  <tr key={row.refNumber}>
                    <td className="px-4 py-3 font-medium text-gray-900">R{row.refNumber}</td>
                    <td className="px-4 py-3 text-gray-800">{row.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 max-w-[180px]">
                        <ProgressBar score={row.completionRate} color="green" showLabel={false} size="sm" />
                        <span className="text-xs font-semibold">{formatScore(row.completionRate)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.completedMdaCount}/{row.applicableMdaCount}
                    </td>
                    <td className="px-4 py-3 bg-amber-50/90 font-medium text-amber-950">{row.ongoingMdaCount}</td>
                    <td className="px-4 py-3 bg-violet-50/90 font-medium text-violet-950">{row.exceptionMdaCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {exceptionProgramNotes.length > 0 && (
          <section className="rounded-xl overflow-hidden border-2 border-violet-700 shadow-lg shadow-violet-950/15 ring-1 ring-violet-400/30">
            <div className="bg-linear-to-r from-violet-800 via-violet-700 to-indigo-700 px-6 py-4">
              <h2 className="text-lg font-bold tracking-wide text-white">Programme exceptions</h2>
              <p className="mt-1.5 text-sm leading-snug text-violet-100/95">
                Formal programme exceptions affecting tracker scoring and reform applicability — distinct from standard tier grouping.
              </p>
            </div>
            <div className="space-y-3 bg-linear-to-b from-violet-50 to-indigo-50 px-5 py-5 border-t border-violet-300/60">
              {exceptionProgramNotes.map((note, i) => (
                <div
                  key={i}
                  className="flex gap-0 overflow-hidden rounded-lg border border-violet-200 bg-white shadow-sm"
                >
                  <div className="w-1.5 shrink-0 bg-linear-to-b from-violet-600 to-indigo-600" aria-hidden />
                  <p className="flex-1 py-3.5 pr-4 pl-4 text-sm leading-relaxed text-gray-800">{note}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
