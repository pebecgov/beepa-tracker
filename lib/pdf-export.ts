// PDF export utilities for BEEPA reports.
// Uses jspdf + jspdf-autotable (already installed).

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── colours ────────────────────────────────────────────────────────────────
const PEBEC_GREEN: [number, number, number] = [0, 107, 63];
const PEBEC_GREEN_LIGHT: [number, number, number] = [230, 245, 238];
const GRAY_DARK: [number, number, number] = [31, 41, 55];
const GRAY_MID: [number, number, number] = [107, 114, 128];
const GRAY_LIGHT: [number, number, number] = [243, 244, 246];
const WHITE: [number, number, number] = [255, 255, 255];

function pct(v: number) {
  return `${Math.round(v * 100)}%`;
}

function addPageHeader(doc: jsPDF, title: string, subtitle: string, dateStr: string) {
  const pw = doc.internal.pageSize.getWidth();

  // green accent bar
  doc.setFillColor(...PEBEC_GREEN);
  doc.rect(0, 0, pw, 6, "F");

  // title block
  doc.setFillColor(...PEBEC_GREEN_LIGHT);
  doc.rect(0, 6, pw, 30, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...PEBEC_GREEN);
  doc.text("PEBEC  —  BEEPA Reform Tracker", 14, 18);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY_DARK);
  doc.text(title, 14, 27);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY_MID);
  doc.text(subtitle, 14, 33);

  // date – right aligned
  doc.text(dateStr, pw - 14, 33, { align: "right" });

  // bottom border of header
  doc.setDrawColor(...PEBEC_GREEN);
  doc.setLineWidth(0.4);
  doc.line(0, 36, pw, 36);
}

function sectionHeading(doc: jsPDF, text: string, y: number) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(...PEBEC_GREEN);
  doc.rect(14, y, pw - 28, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text(text.toUpperCase(), 17, y + 5);
  return y + 11;
}

// ─── General Report PDF ───────────────────────────────────────────────────────
export function downloadGeneralReportPDF(report: {
  generatedAt: number;
  summary: {
    totalMDAs: number;
    overallScore: number;
    overallStatus: { label: string };
    topMDA: { mda: { name: string; abbreviation?: string | null }; score: number } | null;
    lowestCluster: { name: string; score: number } | null;
  };
  top10MDAs: Array<{
    rank: number;
    mda: { name: string; abbreviation?: string | null };
    score: number;
    status: { label: string };
    tier: { label: string };
  }>;
  reformsDoneFirst: Array<{
    refNumber: number;
    name: string;
    completedMdaCount: number;
    applicableMdaCount: number;
    completionRate: number;
  }>;
  leastCompletedReforms: Array<{
    refNumber: number;
    name: string;
    completionRate: number;
    mdasNotDone: Array<{ name: string; abbreviation: string | null; score: number }>;
  }>;
  mdasByStatus: Array<{
    label: string;
    mdas: Array<{ mda: { name: string; abbreviation?: string | null }; score: number }>;
  }>;
  mdasByTier: Array<{
    label: string;
    mdas: Array<{ mda: { name: string; abbreviation?: string | null }; score: number }>;
  }>;
  clusterPerformance: Array<{
    name: string;
    lead: string;
    score: number;
    status: { label: string };
    mdaCount: number;
    matchedMdaCount: number;
    members: Array<{
      name: string;
      performance: { mda: { abbreviation?: string | null }; score: number } | null;
    }>;
  }>;
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const generatedDate = new Date(report.generatedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  addPageHeader(
    doc,
    "BEEPA Programme Performance Report",
    "General Report  ·  Admin View",
    `Generated: ${generatedDate}`
  );

  let y = 44;

  // ── Summary stat boxes ────────────────────────────────────────────────────
  const stats = [
    { label: "Overall Score", value: pct(report.summary.overallScore) },
    { label: "Status", value: report.summary.overallStatus.label },
    { label: "Total MDAs", value: String(report.summary.totalMDAs) },
    {
      label: "Top MDA",
      value: report.summary.topMDA
        ? `${report.summary.topMDA.mda.abbreviation || report.summary.topMDA.mda.name} (${pct(report.summary.topMDA.score)})`
        : "—",
    },
  ];
  const boxW = (pw - 28) / 4;
  stats.forEach((stat, i) => {
    const bx = 14 + i * boxW;
    doc.setFillColor(...GRAY_LIGHT);
    doc.roundedRect(bx, y, boxW - 2, 16, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY_MID);
    doc.text(stat.label.toUpperCase(), bx + 3, y + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY_DARK);
    doc.text(stat.value, bx + 3, y + 12);
  });
  y += 22;

  // ── Top 10 ────────────────────────────────────────────────────────────────
  y = sectionHeading(doc, "Top 10 MDA Performance", y);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY_MID);
  y += 5;
  autoTable(doc, {
    startY: y,
    head: [["Rank", "MDA", "Abbreviation", "Score", "Status", "Tier"]],
    body: report.top10MDAs.map((item) => [
      `#${item.rank}`,
      item.mda.name,
      item.mda.abbreviation || "—",
      pct(item.score),
      item.status.label,
      item.tier.label,
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: PEBEC_GREEN, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 12 }, 2: { cellWidth: 22 }, 3: { cellWidth: 16 }, 5: { cellWidth: 22 } },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Quick-Win Reforms ─────────────────────────────────────────────────────
  y = sectionHeading(doc, "Quick-Win Reform Areas", y);
  autoTable(doc, {
    startY: y,
    head: [["Reform", "Name", "MDAs Complete", "Completion Rate"]],
    body: report.reformsDoneFirst.map((r) => [
      `Reform ${r.refNumber}`,
      r.name,
      `${r.completedMdaCount} / ${r.applicableMdaCount}`,
      pct(r.completionRate),
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: PEBEC_GREEN, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 22 }, 3: { cellWidth: 28 } },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Implementation Gaps ───────────────────────────────────────────────────
  y = sectionHeading(doc, "Implementation Gaps", y);
  autoTable(doc, {
    startY: y,
    head: [["Reform", "Name", "Completion Rate", "MDAs Not Complete"]],
    body: report.leastCompletedReforms.map((r) => [
      `Reform ${r.refNumber}`,
      r.name,
      pct(r.completionRate),
      r.mdasNotDone
        .slice(0, 12)
        .map((m) => `${m.abbreviation || m.name} (${pct(m.score)})`)
        .join(", ") + (r.mdasNotDone.length > 12 ? ` +${r.mdasNotDone.length - 12} more` : ""),
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: PEBEC_GREEN, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 22 }, 2: { cellWidth: 24 } },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── MDA Status Distribution ───────────────────────────────────────────────
  y = sectionHeading(doc, "MDA Status Distribution", y);
  autoTable(doc, {
    startY: y,
    head: [["Status", "Count", "MDAs"]],
    body: report.mdasByStatus.map((group) => [
      group.label,
      String(group.mdas.length),
      group.mdas.map((m) => m.mda.abbreviation || m.mda.name).join(", ") || "—",
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: PEBEC_GREEN, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 44 }, 1: { cellWidth: 14 } },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Scoring Tiers ─────────────────────────────────────────────────────────
  y = sectionHeading(doc, "General Scoring Tiers", y);
  autoTable(doc, {
    startY: y,
    head: [["Tier", "Count", "MDAs"]],
    body: report.mdasByTier.map((group) => [
      group.label,
      String(group.mdas.length),
      group.mdas.map((m) => m.mda.abbreviation || m.mda.name).join(", ") || "—",
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: PEBEC_GREEN, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 14 } },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Cluster Performance ───────────────────────────────────────────────────
  y = sectionHeading(doc, "Cluster Performance", y);
  autoTable(doc, {
    startY: y,
    head: [["#", "Cluster", "Lead", "Score", "Status", "MDAs"]],
    body: report.clusterPerformance.map((cluster, i) => [
      String(i + 1),
      cluster.name,
      cluster.lead,
      pct(cluster.score),
      cluster.status.label,
      cluster.members
        .map((m) => m.performance?.mda.abbreviation || m.name.replace(/\s*\([^)]+\)$/, ""))
        .join(", "),
    ]),
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: PEBEC_GREEN, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 8 }, 3: { cellWidth: 14 }, 4: { cellWidth: 30 } },
    margin: { left: 14, right: 14 },
  });

  // ── Page numbers ──────────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY_MID);
    doc.text(
      `Page ${i} of ${totalPages}  ·  BEEPA Reform Tracker  ·  PEBEC — Confidential`,
      pw / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: "center" }
    );
  }

  doc.save(`BEEPA-General-Report-${generatedDate.replace(/ /g, "-")}.pdf`);
}

// ─── Individual MDA Scorecard PDF ────────────────────────────────────────────
export function downloadScorecardPDF(scorecard: {
  generatedAt: number;
  mda: { name: string; abbreviation?: string | null };
  score: number;
  status: { label: string };
  tier: { label: string; description: string };
  summary: {
    reformCount: number;
    scoringReformCount: number;
    totalApplicableActivities: number;
    completedActivities: number;
    inProgressActivities: number;
    notStartedActivities: number;
    completionRate: number;
    excludedReformCount: number;
    excludedActivityCount: number;
  };
  weakestReforms: Array<{ refNumber: number; name: string; score: number }>;
  reformRows: Array<{
    reform: { refNumber: number; name: string };
    score: number;
    status: { label: string };
    countsTowardOverall: boolean;
    completedCount: number;
    inProgressCount: number;
    notStartedCount: number;
    activities: Array<{
      refNumber: string;
      name: string;
      weight: number;
      completionLevel: number;
      status: string;
      countsTowardScore: boolean;
    }>;
  }>;
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const generatedDate = new Date(scorecard.generatedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const mdaLabel = [scorecard.mda.abbreviation, scorecard.mda.name]
    .filter(Boolean)
    .join("  ·  ");

  addPageHeader(
    doc,
    `Individual MDA Scorecard: ${mdaLabel}`,
    `Tier: ${scorecard.tier.label}  ·  Status: ${scorecard.status.label}  ·  Score: ${pct(scorecard.score)}`,
    `Generated: ${generatedDate}`
  );

  let y = 44;

  // ── Summary stat boxes ────────────────────────────────────────────────────
  const stats = [
    { label: "Overall Score", value: pct(scorecard.score) },
    { label: "Tier", value: scorecard.tier.label },
    { label: "Applicable Reforms", value: `${scorecard.summary.scoringReformCount} / ${scorecard.summary.reformCount}` },
    { label: "Activities Complete", value: `${scorecard.summary.completedActivities} / ${scorecard.summary.totalApplicableActivities}` },
    { label: "Completion Rate", value: pct(scorecard.summary.completionRate) },
    { label: "Exclusions", value: `${scorecard.summary.excludedReformCount}R / ${scorecard.summary.excludedActivityCount}A` },
  ];
  const boxW = (pw - 28) / 6;
  stats.forEach((stat, i) => {
    const bx = 14 + i * boxW;
    doc.setFillColor(...GRAY_LIGHT);
    doc.roundedRect(bx, y, boxW - 2, 16, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY_MID);
    doc.text(stat.label.toUpperCase(), bx + 2, y + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY_DARK);
    doc.text(stat.value, bx + 2, y + 12);
  });
  y += 22;

  // ── PEBEC Notes ───────────────────────────────────────────────────────────
  if (scorecard.weakestReforms.length > 0) {
    y = sectionHeading(doc, "PEBEC Follow-up Notes", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_MID);
    doc.text("Priority reforms requiring attention:", 14, y);
    y += 5;
    scorecard.weakestReforms.forEach((r) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...GRAY_DARK);
      doc.text(`  Reform ${r.refNumber}:`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${r.name}  (${pct(r.score)})`, 36, y);
      y += 5;
    });
    y += 4;
  }

  // ── Reform Score Breakdown ─────────────────────────────────────────────────
  y = sectionHeading(doc, "Reform Score Breakdown", y);
  autoTable(doc, {
    startY: y,
    head: [["Reform", "Name", "Score", "Status", "Complete", "In Progress", "Not Started", "Counts"]],
    body: scorecard.reformRows.map((row) => [
      `R${row.reform.refNumber}`,
      row.reform.name,
      pct(row.score),
      row.status.label,
      String(row.completedCount),
      String(row.inProgressCount),
      String(row.notStartedCount),
      row.countsTowardOverall ? "Yes" : "Exempt",
    ]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: PEBEC_GREEN, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { cellWidth: 14 },
      4: { cellWidth: 16 },
      5: { cellWidth: 18 },
      6: { cellWidth: 18 },
      7: { cellWidth: 14 },
    },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Activity Evidence (one table per reform) ───────────────────────────────
  for (const row of scorecard.reformRows) {
    const heading = `Reform ${row.reform.refNumber}: ${row.reform.name}${!row.countsTowardOverall ? "  (Exempted from overall score)" : ""}`;
    y = sectionHeading(doc, heading, y);
    autoTable(doc, {
      startY: y,
      head: [["Ref", "Activity", "Weight", "Completion", "Status", "Counts"]],
      body: row.activities.map((act) => [
        act.refNumber,
        act.name,
        `${Math.round(act.weight * 100)}%`,
        `${Math.round(act.completionLevel * 100)}%`,
        act.status === "complete"
          ? "Complete"
          : act.status === "in_progress"
            ? "In Progress"
            : "Not Started",
        act.countsTowardScore ? "Yes" : "Exempt",
      ]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [40, 90, 60], textColor: WHITE, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 14 },
        2: { cellWidth: 16 },
        3: { cellWidth: 20 },
        4: { cellWidth: 22 },
        5: { cellWidth: 14 },
      },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── Page numbers ──────────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY_MID);
    doc.text(
      `Page ${i} of ${totalPages}  ·  ${scorecard.mda.abbreviation || scorecard.mda.name}  ·  PEBEC — Confidential`,
      pw / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: "center" }
    );
  }

  const safeName = (scorecard.mda.abbreviation || scorecard.mda.name).replace(/[^a-z0-9]/gi, "-");
  doc.save(`BEEPA-Scorecard-${safeName}-${generatedDate.replace(/ /g, "-")}.pdf`);
}
