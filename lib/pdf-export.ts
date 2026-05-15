// PDF export utilities for BEEPA reports.
// Uses jspdf + jspdf-autotable (already installed).

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  generalReportMdaNameWithAbbrev,
  mdaHasSuperMdaBonus,
  tierLabelWithPercentRange,
} from "./beepa-scoring";
import { SUPER_MDA_BONUS_NARRATIVES, type SuperMdaBonusNarrative } from "./beepa-super-bonus-narratives";

// ─── colours ────────────────────────────────────────────────────────────────
const PEBEC_GREEN: [number, number, number] = [0, 107, 63];
const PEBEC_GREEN_LIGHT: [number, number, number] = [230, 245, 238];
const GRAY_DARK: [number, number, number] = [31, 41, 55];
const GRAY_MID: [number, number, number] = [107, 114, 128];
const GRAY_LIGHT: [number, number, number] = [243, 244, 246];
const WHITE: [number, number, number] = [255, 255, 255];
/** Reform table: MDAs with reform in progress */
const ONGOING_CELL_BG: [number, number, number] = [254, 243, 199];
/** Reform table: MDAs under scoring exception for a reform */
const EXCEPTION_CELL_BG: [number, number, number] = [237, 233, 254];
/** Programme exceptions section (distinct from score/report sections). */
const EXCEPTION_VIOLET: [number, number, number] = [91, 33, 182];
const EXCEPTION_VIOLET_PANEL: [number, number, number] = [245, 243, 255];
const EXCEPTION_VIOLET_ACCENT: [number, number, number] = [124, 58, 237];

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

function exceptionSectionHeading(doc: jsPDF, text: string, y: number) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(...EXCEPTION_VIOLET);
  doc.rect(14, y, pw - 28, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text(text.toUpperCase(), 17, y + 5);
  return y + 11;
}

const PDF_MARGIN_X = 14;

/** Draw wrapped text line-by-line; returns the Y position after the last line. */
function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  options: {
    fontSize?: number;
    fontStyle?: "normal" | "bold" | "italic";
    lineHeightMm?: number;
    color?: [number, number, number];
  } = {}
): number {
  const fontSize = options.fontSize ?? 8;
  const lineHeightMm = options.lineHeightMm ?? 4.5;
  doc.setFont("helvetica", options.fontStyle ?? "normal");
  doc.setFontSize(fontSize);
  if (options.color) doc.setTextColor(...options.color);
  const lines = doc.splitTextToSize(text, maxWidth);
  let cy = y;
  for (const line of lines) {
    doc.text(line, x, cy, { maxWidth });
    cy += lineHeightMm;
  }
  return cy;
}

function programmeNotePanels(
  doc: jsPDF,
  y: number,
  pw: number,
  notes: string[],
  panelColor: [number, number, number],
  accentColor: [number, number, number]
) {
  const marginL = PDF_MARGIN_X;
  const marginR = PDF_MARGIN_X;
  const accentW = 2.8;
  const padX = 4;
  const padY = 5;
  const lineHeightMm = 4.5;
  const panelW = pw - marginL - marginR;
  const textX = marginL + accentW + padX;
  const textMaxW = panelW - accentW - padX;
  const pageH = doc.internal.pageSize.getHeight();
  const bottomMargin = 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  for (const note of notes) {
    const lines = doc.splitTextToSize(note, textMaxW);
    const rowH = lines.length * lineHeightMm + padY * 2;

    if (y + rowH > pageH - bottomMargin) {
      doc.addPage();
      y = marginL;
    }

    doc.setFillColor(...panelColor);
    doc.roundedRect(marginL, y, panelW, rowH, 1.5, 1.5, "F");
    doc.setFillColor(...accentColor);
    doc.rect(marginL, y, accentW, rowH, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_DARK);
    let textY = y + padY;
    for (const line of lines) {
      doc.text(line, textX, textY, { maxWidth: textMaxW });
      textY += lineHeightMm;
    }
    y += rowH + 4;
  }
  return y + 2;
}

// ─── General Report PDF ───────────────────────────────────────────────────────

export function downloadGeneralReportPDF(report: {
  generatedAt: number;
  summary: {
    totalMDAs: number;
    overallScore: number;
    overallStatus: { label: string };
    fullImplementationCount: number;
  };
  mdasByPerformanceTier: Array<{
    label: string;
    mdas: Array<{
      mda: { _id: string; name: string; abbreviation?: string | null };
      score: number;
      status: { label: string };
      tier: { label: string };
    }>;
  }>;
  reformAreasCompletion: Array<{
    refNumber: number;
    name: string;
    applicableMdaCount: number;
    completedMdaCount: number;
    ongoingMdaCount: number;
    exceptionMdaCount: number;
    completionRate: number;
  }>;
  exceptionProgramNotes: string[];
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

  const stats = [
    { label: "Overall score", value: pct(report.summary.overallScore) },
    { label: "Status", value: report.summary.overallStatus.label },
    { label: "Total MDAs", value: String(report.summary.totalMDAs) },
    {
      label: "Full implementation",
      value: String(report.summary.fullImplementationCount),
    },
  ];
  const boxW = (pw - 28) / 3;
  stats.forEach((stat, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const bx = 14 + col * boxW;
    const by = y + row * 20;
    doc.setFillColor(...GRAY_LIGHT);
    doc.roundedRect(bx, by, boxW - 2, 16, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY_MID);
    doc.text(stat.label.toUpperCase(), bx + 3, by + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_DARK);
    doc.text(stat.value, bx + 3, by + 12);
  });
  y += Math.ceil(stats.length / 3) * 20 + 8;

  y = sectionHeading(doc, "MDAs by performance tier", y);

  for (const tierBlock of report.mdasByPerformanceTier) {
    if (tierBlock.mdas.length === 0) continue;
    y = sectionHeading(doc, tierLabelWithPercentRange(tierBlock.label), y + 2);
    autoTable(doc, {
      startY: y,
      head: [["MDA", "Score", "Status"]],
      body: tierBlock.mdas.map((item) => [
        generalReportMdaNameWithAbbrev(item.mda),
        pct(item.score),
        item.status.label,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: PEBEC_GREEN, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 88 },
        1: { cellWidth: 22 },
        2: { cellWidth: 56 },
      },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  const seenBonusMda = new Set<string>();
  const bonusNarrativeBlocks: Array<{ name: string; abbrev: string; narrative: SuperMdaBonusNarrative }> = [];
  for (const tierBlock of report.mdasByPerformanceTier) {
    for (const item of tierBlock.mdas) {
      if (!mdaHasSuperMdaBonus({ abbreviation: item.mda.abbreviation })) continue;
      if (seenBonusMda.has(item.mda._id)) continue;
      seenBonusMda.add(item.mda._id);
      const abbrev = (item.mda.abbreviation || "").trim().toUpperCase();
      const narrative = SUPER_MDA_BONUS_NARRATIVES[abbrev];
      if (!narrative) continue;
      bonusNarrativeBlocks.push({
        name: item.mda.name,
        abbrev: abbrev || item.mda.name,
        narrative,
      });
    }
  }

  if (bonusNarrativeBlocks.length > 0) {
    y = sectionHeading(doc, "NAICOM Super MDA — submission record", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_MID);
    y = drawWrappedText(
      doc,
      "Validated bonus-point submission on record for NAICOM (sole Super MDA on the programme roster).",
      PDF_MARGIN_X,
      y,
      pw - PDF_MARGIN_X * 2,
      { fontSize: 8, color: GRAY_MID, lineHeightMm: 4 }
    ) + 4;

    for (const block of bonusNarrativeBlocks) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...GRAY_DARK);
      doc.text(`${block.abbrev} — ${block.name}`, 14, y);
      y += 5;
      if (block.narrative.title) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...PEBEC_GREEN);
        y =
          drawWrappedText(doc, block.narrative.title, PDF_MARGIN_X, y, pw - PDF_MARGIN_X * 2, {
            fontSize: 8,
            fontStyle: "bold",
            color: PEBEC_GREEN,
            lineHeightMm: 4,
          }) + 2;
      }
      if (block.narrative.submissionRows && block.narrative.submissionRows.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Activity / measure", "Compliance level", "Evidence / reference"]],
          body: block.narrative.submissionRows.map((row) => [
            row.activity,
            row.complianceLevel,
            row.evidenceAvailable,
          ]),
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: PEBEC_GREEN, textColor: WHITE, fontStyle: "bold", fontSize: 7 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: { 0: { cellWidth: 58 }, 1: { cellWidth: 58 } },
          margin: { left: 14, right: 14 },
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      } else if (block.narrative.bullets && block.narrative.bullets.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...GRAY_DARK);
        const bulletText = block.narrative.bullets.map((b) => `• ${b}`).join("\n");
        y =
          drawWrappedText(doc, bulletText, PDF_MARGIN_X, y, pw - PDF_MARGIN_X * 2, {
            fontSize: 8,
            color: GRAY_DARK,
            lineHeightMm: 4,
          }) + 6;
      }
    }
  }

  y = sectionHeading(doc, "Reform areas and completion rate", y);
  autoTable(doc, {
    startY: y,
    head: [["Ref", "Reform", "Completion", "Complete", "Ongoing", "Exception"]],
    body: report.reformAreasCompletion.map((r) => [
      `R${r.refNumber}`,
      r.name,
      pct(r.completionRate),
      `${r.completedMdaCount}/${r.applicableMdaCount}`,
      String(r.ongoingMdaCount),
      String(r.exceptionMdaCount),
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: {
      fillColor: PEBEC_GREEN,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 14 },
      2: { cellWidth: 22 },
      3: { cellWidth: 22 },
      4: { cellWidth: 18 },
      5: { cellWidth: 18 },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === "head") {
        const idx = data.column.index;
        if (idx === 4) {
          data.cell.styles.fillColor = ONGOING_CELL_BG;
          data.cell.styles.textColor = GRAY_DARK;
        }
        if (idx === 5) {
          data.cell.styles.fillColor = EXCEPTION_CELL_BG;
          data.cell.styles.textColor = GRAY_DARK;
        }
        return;
      }
      if (data.section !== "body") return;
      const idx = data.column.index;
      if (idx === 4) data.cell.styles.fillColor = ONGOING_CELL_BG;
      if (idx === 5) data.cell.styles.fillColor = EXCEPTION_CELL_BG;
    },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  const exceptionProgramNotes = report.exceptionProgramNotes ?? [];
  if (exceptionProgramNotes.length > 0) {
    y += 2;
    y = exceptionSectionHeading(doc, "Programme exceptions", y);

    y = programmeNotePanels(
      doc,
      y,
      pw,
      exceptionProgramNotes,
      EXCEPTION_VIOLET_PANEL,
      EXCEPTION_VIOLET_ACCENT
    );
  }

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
    exceptionReformCount: number;
    exceptionActivityCount: number;
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
    `Tier: ${tierLabelWithPercentRange(scorecard.tier.label)}  ·  Status: ${scorecard.status.label}  ·  Score: ${pct(scorecard.score)}`,
    `Generated: ${generatedDate}`
  );

  let y = 44;

  // ── Summary stat boxes ────────────────────────────────────────────────────
  const stats = [
    { label: "Overall Score", value: pct(scorecard.score) },
    { label: "Tier", value: tierLabelWithPercentRange(scorecard.tier.label) },
    { label: "Applicable Reforms", value: `${scorecard.summary.scoringReformCount} / ${scorecard.summary.reformCount}` },
    { label: "Activities Complete", value: `${scorecard.summary.completedActivities} / ${scorecard.summary.totalApplicableActivities}` },
    { label: "Completion Rate", value: pct(scorecard.summary.completionRate) },
    { label: "Exceptions", value: `${scorecard.summary.exceptionReformCount}R / ${scorecard.summary.exceptionActivityCount}A` },
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
      row.countsTowardOverall ? "Yes" : "Exception",
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
    const heading = `Reform ${row.reform.refNumber}: ${row.reform.name}${!row.countsTowardOverall ? "  (Exception — not in overall score)" : ""}`;
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
        act.countsTowardScore ? "Yes" : "Exception",
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
