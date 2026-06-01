// PDF export utilities for BEEPA reports.
// Uses jspdf + jspdf-autotable (already installed).

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JSZip from "jszip";

import {
  generalReportMdaNameWithAbbrev,
  tierLabelWithPercentRange,
  type ProgrammeExceptionNote,
} from "./beepa-scoring";
import { collectSuperMdaBonusNarrativeBlocks } from "./beepa-super-bonus-narratives";
import {
  contactVerificationAttemptSummary,
  contactVerificationClosingNote,
  contactVerificationDetailsSectionTitle,
  contactVerificationFindingRows,
  contactVerificationOutcomeSectionTitle,
  contactVerificationOutcomeNarrative,
  contactVerificationPageTitle,
  filterContactVerificationScorecards,
  resolveMdaContactVerification,
  type MdaContactVerificationRecord,
} from "./mda-contact-verification";
import {
  resolveProgrammeExemptionSupplement,
  type ProgrammeExemptionSupplementRecord,
} from "./mda-programme-exemption-supplement";

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
/** Requires intervention section and table */
const INTERVENTION_RED: [number, number, number] = [185, 28, 28];
const INTERVENTION_RED_LIGHT: [number, number, number] = [254, 242, 242];

function pct(v: number) {
  return `${Math.round(v * 100)}%`;
}

/** Official date shown on BEEPA PDF exports (headers, footers, filenames). */
const BEEPA_PDF_GENERATED_DATE = new Date(2026, 4, 22);

function formatPdfGeneratedDate(): string {
  return BEEPA_PDF_GENERATED_DATE.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function pdfGeneratedDateFilenamePart(): string {
  return formatPdfGeneratedDate().replace(/ /g, "-");
}

/** Page header with wrapped title; returns Y for body content below the header rule. */
function addPageHeader(doc: jsPDF, title: string, subtitle: string, dateStr: string): number {
  const pw = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const titleMaxWidth = pw - marginX * 2;
  const subtitleMaxWidth = pw - marginX * 2 - 48;
  const titleFontSize = 11;
  const titleLineHeight = 4.8;
  const subtitleFontSize = 8;
  const subtitleLineHeight = 4;
  const brandY = 17;
  const titleStartY = 25;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(titleFontSize);
  const titleLines = title
    .split("\n")
    .flatMap((segment) => {
      const trimmed = segment.trim();
      return trimmed ? doc.splitTextToSize(trimmed, titleMaxWidth) : [];
    });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(subtitleFontSize);
  const subtitleLines = doc.splitTextToSize(subtitle, subtitleMaxWidth);

  const subtitleY = titleStartY + titleLines.length * titleLineHeight + 3;
  const headerBottom =
    Math.max(subtitleY + subtitleLines.length * subtitleLineHeight, subtitleY + subtitleLineHeight) + 5;

  doc.setFillColor(...PEBEC_GREEN);
  doc.rect(0, 0, pw, 6, "F");

  doc.setFillColor(...PEBEC_GREEN_LIGHT);
  doc.rect(0, 6, pw, headerBottom - 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...PEBEC_GREEN);
  doc.text("PEBEC  —  BEEPA Reform Tracker", marginX, brandY);

  doc.setFontSize(titleFontSize);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY_DARK);
  titleLines.forEach((line: string, i: number) => {
    doc.text(line, marginX, titleStartY + i * titleLineHeight);
  });

  doc.setFontSize(subtitleFontSize);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY_MID);
  subtitleLines.forEach((line: string, i: number) => {
    doc.text(line, marginX, subtitleY + i * subtitleLineHeight);
  });
  doc.text(dateStr, pw - marginX, subtitleY, { align: "right" });

  doc.setDrawColor(...PEBEC_GREEN);
  doc.setLineWidth(0.4);
  doc.line(0, headerBottom, pw, headerBottom);

  return headerBottom + 8;
}

/** Bold helvetica measures narrower than it renders; wrap below jsPDF’s “fits one line” width. */
const SCORECARD_MDA_NAME_WRAP_MM = 118;

function wrapHeaderLines(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  fontStyle: "normal" | "bold",
  fontSize: number
): string[] {
  doc.setFont("helvetica", fontStyle);
  doc.setFontSize(fontSize);
  return text
    .split("\n")
    .flatMap((segment) => {
      const trimmed = segment.trim();
      return trimmed ? doc.splitTextToSize(trimmed, maxWidth) : [];
    });
}

/** Scorecard header: label + wrapped full MDA name (avoids single-line overflow). */
function addScorecardPageHeader(
  doc: jsPDF,
  mda: { name: string; abbreviation?: string | null },
  subtitle: string,
  dateStr: string
): number {
  const pw = doc.internal.pageSize.getWidth();
  const marginX = PDF_MARGIN_X;
  const contentWidth = pw - marginX * 2;
  const nameWrapWidth = Math.min(contentWidth, SCORECARD_MDA_NAME_WRAP_MM);
  const labelLineHeight = 5.5;
  const nameLineHeight = 5.2;
  const subtitleLineHeight = 4;
  const brandY = 17;
  const labelY = 25;

  const labelLines = wrapHeaderLines(doc, "Individual MDA Scorecard", contentWidth, "bold", 11);
  const nameLines = wrapHeaderLines(doc, mda.name, nameWrapWidth, "bold", 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const subtitleLines = doc.splitTextToSize(subtitle, contentWidth - 50);

  const nameStartY = labelY + labelLines.length * labelLineHeight;
  const subtitleY = nameStartY + nameLines.length * nameLineHeight + 3;
  const headerBottom =
    Math.max(subtitleY + subtitleLines.length * subtitleLineHeight, subtitleY + subtitleLineHeight) + 5;

  doc.setFillColor(...PEBEC_GREEN);
  doc.rect(0, 0, pw, 6, "F");

  doc.setFillColor(...PEBEC_GREEN_LIGHT);
  doc.rect(0, 6, pw, headerBottom - 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...PEBEC_GREEN);
  doc.text("PEBEC  —  BEEPA Reform Tracker", marginX, brandY);

  doc.setFontSize(11);
  doc.setTextColor(...GRAY_DARK);
  labelLines.forEach((line: string, i: number) => {
    doc.text(line, marginX, labelY + i * labelLineHeight);
  });

  doc.setFontSize(10);
  nameLines.forEach((line: string, i: number) => {
    doc.text(line, marginX, nameStartY + i * nameLineHeight);
  });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY_MID);
  subtitleLines.forEach((line: string, i: number) => {
    doc.text(line, marginX, subtitleY + i * subtitleLineHeight);
  });
  doc.text(dateStr, pw - marginX, subtitleY, { align: "right" });

  doc.setDrawColor(...PEBEC_GREEN);
  doc.setLineWidth(0.4);
  doc.line(0, headerBottom, pw, headerBottom);

  return headerBottom + 8;
}

/** Standalone supplement header (separate page; not the main scorecard header). */
function addScorecardSupplementPageHeader(
  doc: jsPDF,
  mda: { name: string; abbreviation?: string | null },
  dateStr: string,
  pageTitle: string
): number {
  const pw = doc.internal.pageSize.getWidth();
  const marginX = PDF_MARGIN_X;
  const contentWidth = pw - marginX * 2;
  const nameWrapWidth = Math.min(contentWidth, SCORECARD_MDA_NAME_WRAP_MM);
  const labelLineHeight = 5.5;
  const nameLineHeight = 5.2;
  const brandY = 17;
  const labelY = 25;

  const labelLines = wrapHeaderLines(doc, pageTitle, contentWidth, "bold", 11);
  const nameLines = wrapHeaderLines(doc, mda.name, nameWrapWidth, "bold", 10);

  const nameStartY = labelY + labelLines.length * labelLineHeight;
  const headerBottom = nameStartY + nameLines.length * nameLineHeight + 5;

  doc.setFillColor(...PEBEC_GREEN);
  doc.rect(0, 0, pw, 6, "F");

  doc.setFillColor(...PEBEC_GREEN_LIGHT);
  doc.rect(0, 6, pw, headerBottom - 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...PEBEC_GREEN);
  doc.text("PEBEC  —  BEEPA Reform Tracker", marginX, brandY);

  doc.setFontSize(11);
  doc.setTextColor(...GRAY_DARK);
  labelLines.forEach((line: string, i: number) => {
    doc.text(line, marginX, labelY + i * labelLineHeight);
  });

  doc.setFontSize(10);
  nameLines.forEach((line: string, i: number) => {
    doc.text(line, marginX, nameStartY + i * nameLineHeight);
  });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY_MID);
  doc.text(dateStr, pw - marginX, headerBottom - 2, { align: "right" });

  doc.setDrawColor(...PEBEC_GREEN);
  doc.setLineWidth(0.4);
  doc.line(0, headerBottom, pw, headerBottom);

  return headerBottom + 8;
}

function sectionHeading(doc: jsPDF, text: string, y: number) {
  return bandSectionHeading(doc, text, y, PEBEC_GREEN);
}

function exceptionSectionHeading(doc: jsPDF, text: string, y: number) {
  return bandSectionHeading(doc, text, y, EXCEPTION_VIOLET);
}

function interventionSectionHeading(doc: jsPDF, text: string, y: number) {
  const withBreaks = text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
  return bandSectionHeading(doc, withBreaks, y, INTERVENTION_RED);
}

const PDF_MARGIN_X = 14;
/** Reserve space for footer on every page. */
const PDF_BOTTOM_MARGIN = 22;
/** Top Y on continuation pages (no report title block). */
const PDF_CONTINUATION_TOP = 18;
const PDF_TABLE_MARGIN = { left: 14, right: 14, bottom: PDF_BOTTOM_MARGIN };

function pageHeight(doc: jsPDF): number {
  return doc.internal.pageSize.getHeight();
}

/** Start a new page when the remaining vertical space is insufficient. */
function ensureSpace(doc: jsPDF, y: number, requiredMm: number): number {
  if (y + requiredMm <= pageHeight(doc) - PDF_BOTTOM_MARGIN) return y;
  doc.addPage();
  return PDF_CONTINUATION_TOP;
}

/** Cursor after jspdf-autotable — respects page breaks from the table. */
function syncYAfterAutoTable(doc: jsPDF, gap = 8): number {
  const finalY = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
  if (finalY == null || Number.isNaN(finalY)) return PDF_CONTINUATION_TOP;
  return ensureSpace(doc, finalY + gap, 4);
}

/** Estimate wrapped line count before drawing (for page-break planning). */
function wrappedLineCount(doc: jsPDF, text: string, maxWidth: number, fontSize: number): number {
  doc.setFontSize(fontSize);
  return text
    .split("\n")
    .flatMap((segment) => {
      const trimmed = segment.trim();
      return trimmed ? doc.splitTextToSize(trimmed, maxWidth) : [];
    }).length;
}

/** Coloured band heading; wraps long titles and avoids page-bottom clipping. */
function bandSectionHeading(
  doc: jsPDF,
  text: string,
  y: number,
  fillColor: [number, number, number]
): number {
  const pw = doc.internal.pageSize.getWidth();
  const barLeft = PDF_MARGIN_X;
  const barWidth = pw - PDF_MARGIN_X * 2;
  const textX = barLeft + 3;
  const textMaxWidth = barWidth - 6;
  const padTop = 2.5;
  const lineHeight = 4.5;
  const fontSize = 9;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text.trim().toUpperCase(), textMaxWidth);
  const barHeight = padTop * 2 + lines.length * lineHeight;

  y = ensureSpace(doc, y, barHeight + 6);

  doc.setFillColor(...fillColor);
  doc.rect(barLeft, y, barWidth, barHeight, "F");
  doc.setTextColor(...WHITE);
  lines.forEach((line: string, i: number) => {
    doc.text(line, textX, y + padTop + lineHeight * (i + 0.85));
  });
  return y + barHeight + 4;
}

/** Draw wrapped text line-by-line with page breaks; returns Y after the last line. */
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
  const lines = text
    .split("\n")
    .flatMap((segment) => {
      const trimmed = segment.trim();
      return trimmed ? doc.splitTextToSize(trimmed, maxWidth) : [];
    });
  let cy = y;
  for (const line of lines) {
    cy = ensureSpace(doc, cy, lineHeightMm + 1);
    doc.setFont("helvetica", options.fontStyle ?? "normal");
    doc.setFontSize(fontSize);
    if (options.color) doc.setTextColor(...options.color);
    // Lines are pre-wrapped — do not pass maxWidth here or jsPDF squeezes glyphs horizontally.
    doc.text(line, x, cy);
    cy += lineHeightMm;
  }
  return cy;
}

/** Bulleted list with comfortable line spacing (PDF only). */
function drawBulletList(
  doc: jsPDF,
  bullets: string[],
  x: number,
  y: number,
  maxWidth: number,
  options: {
    fontSize?: number;
    lineHeightMm?: number;
    color?: [number, number, number];
    afterGapMm?: number;
  } = {}
): number {
  const fontSize = options.fontSize ?? 8;
  const lineHeightMm = options.lineHeightMm ?? 5;
  const afterGapMm = options.afterGapMm ?? 10;
  const text = bullets.map((b) => `• ${b}`).join("\n");
  const lineCount = wrappedLineCount(doc, text, maxWidth, fontSize);
  y = ensureSpace(doc, y, lineCount * lineHeightMm + afterGapMm);
  y =
    drawWrappedText(doc, text, x, y, maxWidth, {
      fontSize,
      color: options.color ?? GRAY_DARK,
      lineHeightMm,
    }) + afterGapMm;
  return y;
}

function programmeNotePanels(
  doc: jsPDF,
  y: number,
  pw: number,
  notes: ProgrammeExceptionNote[],
  panelColor: [number, number, number],
  accentColor: [number, number, number]
) {
  const marginL = PDF_MARGIN_X;
  const marginR = PDF_MARGIN_X;
  const accentW = 2.8;
  const padX = 4;
  const padY = 5;
  const headingLineMm = 5;
  const bodyLineMm = 4.5;
  const panelW = pw - marginL - marginR;
  const textX = marginL + accentW + padX;
  const textMaxW = panelW - accentW - padX;

  for (const note of notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const headingLines = doc.splitTextToSize(note.heading, textMaxW);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const bodyLines = doc.splitTextToSize(note.narrative, textMaxW);
    const rowH =
      padY * 2 +
      headingLines.length * headingLineMm +
      2 +
      bodyLines.length * bodyLineMm;

    y = ensureSpace(doc, y, rowH + 4);

    doc.setFillColor(...panelColor);
    doc.roundedRect(marginL, y, panelW, rowH, 1.5, 1.5, "F");
    doc.setFillColor(...accentColor);
    doc.rect(marginL, y, accentW, rowH, "F");

    let textY = y + padY;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY_DARK);
    for (const line of headingLines) {
      doc.text(line, textX, textY);
      textY += headingLineMm;
    }
    textY += 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    for (const line of bodyLines) {
      doc.text(line, textX, textY);
      textY += bodyLineMm;
    }
    y += rowH + 4;
  }
  return y + 2;
}

// ─── General Report PDF ───────────────────────────────────────────────────────

export function buildGeneralReportPDFDoc(report: {
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
  exceptionProgramNotes: ProgrammeExceptionNote[];
}): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const generatedDate = formatPdfGeneratedDate();

  let y = addPageHeader(
    doc,
    "BEEPA Programme Performance Report",
    "General Report  ·  Admin View",
    `Generated: ${generatedDate}`
  );

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

  const tableContentWidth = pw - PDF_MARGIN_X * 2;

  for (const tierBlock of report.mdasByPerformanceTier) {
    if (tierBlock.mdas.length === 0) continue;
    const isPoorTier = tierBlock.label === "Poor";
    y = ensureSpace(doc, y + 2, 14);
    y = isPoorTier
      ? interventionSectionHeading(doc, tierLabelWithPercentRange(tierBlock.label), y)
      : sectionHeading(doc, tierLabelWithPercentRange(tierBlock.label), y);
    autoTable(doc, {
      startY: y,
      head: [["MDA", "Score", "Status"]],
      body: tierBlock.mdas.map((item) => [
        generalReportMdaNameWithAbbrev(item.mda),
        pct(item.score),
        isPoorTier ? "Requires Intervention" : item.status.label,
      ]),
      styles: isPoorTier
        ? { fontSize: 8, cellPadding: 3, textColor: INTERVENTION_RED, fontStyle: "bold" }
        : { fontSize: 8, cellPadding: 3 },
      headStyles: isPoorTier
        ? { fillColor: INTERVENTION_RED, textColor: WHITE, fontStyle: "bold", fontSize: 8 }
        : { fillColor: PEBEC_GREEN, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: isPoorTier
        ? { fillColor: INTERVENTION_RED_LIGHT }
        : { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 88 },
        1: { cellWidth: 22 },
        2: { cellWidth: 56 },
      },
      margin: PDF_TABLE_MARGIN,
      rowPageBreak: "avoid",
    });
    y = syncYAfterAutoTable(doc);
  }

  const bonusNarrativeBlocks = collectSuperMdaBonusNarrativeBlocks(report.mdasByPerformanceTier);

  if (bonusNarrativeBlocks.length > 0) {
    y = syncYAfterAutoTable(doc, 12);
    y = ensureSpace(doc, y, 20);
    y = sectionHeading(doc, "Super MDA — regulatory simplification submissions", y);
    y += 4;

    for (let i = 0; i < bonusNarrativeBlocks.length; i++) {
      const block = bonusNarrativeBlocks[i];
      y = ensureSpace(doc, y, 20);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...GRAY_DARK);
      doc.text(`${block.abbrev} — ${block.name}`, PDF_MARGIN_X, y);
      y += 7;

      if (block.narrative.title) {
        y =
          drawWrappedText(doc, block.narrative.title, PDF_MARGIN_X, y, tableContentWidth, {
            fontSize: 8,
            fontStyle: "bold",
            color: PEBEC_GREEN,
            lineHeightMm: 5,
          }) + 5;
      }

      if (block.narrative.submissionRows && block.narrative.submissionRows.length > 0) {
        y = ensureSpace(doc, y, 28);
        autoTable(doc, {
          startY: y,
          head: [["Activity / measure", "Compliance level", "Evidence / reference"]],
          body: block.narrative.submissionRows.map((row) => [
            row.activity,
            row.complianceLevel,
            row.evidenceAvailable,
          ]),
          styles: {
            fontSize: 7,
            cellPadding: 3,
            overflow: "linebreak",
            valign: "top",
          },
          headStyles: { fillColor: PEBEC_GREEN, textColor: WHITE, fontStyle: "bold", fontSize: 7 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          tableWidth: tableContentWidth,
          columnStyles: {
            0: { cellWidth: tableContentWidth * 0.32 },
            1: { cellWidth: tableContentWidth * 0.36 },
            2: { cellWidth: tableContentWidth * 0.32 },
          },
          margin: PDF_TABLE_MARGIN,
          rowPageBreak: "avoid",
        });
        y = syncYAfterAutoTable(doc, 12);
      }

      if (block.narrative.bullets && block.narrative.bullets.length > 0) {
        y = drawBulletList(doc, block.narrative.bullets, PDF_MARGIN_X, y, tableContentWidth, {
          lineHeightMm: 5,
          afterGapMm: 10,
        });
      }

      if (i < bonusNarrativeBlocks.length - 1) {
        y += 4;
        doc.setDrawColor(...GRAY_LIGHT);
        doc.setLineWidth(0.2);
        doc.line(PDF_MARGIN_X, y, pw - PDF_MARGIN_X, y);
        y += 8;
      } else {
        y += 6;
      }
    }
  }

  y = syncYAfterAutoTable(doc, 14);
  y += 10;
  y = ensureSpace(doc, y, 22);
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
    margin: PDF_TABLE_MARGIN,
    rowPageBreak: "avoid",
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
  y = syncYAfterAutoTable(doc);

  const exceptionProgramNotes = report.exceptionProgramNotes ?? [];
  if (exceptionProgramNotes.length > 0) {
    y = ensureSpace(doc, y + 2, 14);
    y = exceptionSectionHeading(doc, "Programme Exemptions", y);

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

  return doc;
}

export function downloadGeneralReportPDF(
  report: Parameters<typeof buildGeneralReportPDFDoc>[0]
): void {
  const doc = buildGeneralReportPDFDoc(report);
  doc.save(`BEEPA-General-Report-${pdfGeneratedDateFilenamePart()}.pdf`);
}

// ─── Individual MDA Scorecard PDF ────────────────────────────────────────────
export type ScorecardPDFInput = {
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
};

/** Appends one standalone page after the scorecard (any page count); contact verification only. */
function appendContactVerificationPage(
  doc: jsPDF,
  scorecard: ScorecardPDFInput,
  record: MdaContactVerificationRecord,
  generatedDate: string
): void {
  doc.addPage();
  const pw = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const contentWidth = pw - marginX * 2;

  let y = addScorecardSupplementPageHeader(
    doc,
    scorecard.mda,
    `Generated: ${generatedDate}`,
    contactVerificationPageTitle(record.channel)
  );

  y = sectionHeading(doc, contactVerificationOutcomeSectionTitle(record.channel), y);
  y =
    drawWrappedText(
      doc,
      contactVerificationOutcomeNarrative(record.channel),
      marginX,
      y,
      contentWidth,
      { fontSize: 9, lineHeightMm: 5, color: GRAY_DARK }
    ) + 4;

  y = sectionHeading(doc, "Assessment basis", y);
  y = drawBulletList(
    doc,
    contactVerificationAttemptSummary(record.channel),
    marginX,
    y,
    contentWidth,
    { fontSize: 8, lineHeightMm: 5, afterGapMm: 6 }
  );

  y = sectionHeading(doc, contactVerificationDetailsSectionTitle(record.channel), y);
  const contactRows = contactVerificationFindingRows(record);

  autoTable(doc, {
    startY: y,
    head: [["Item", "Detail"]],
    body: contactRows,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: PEBEC_GREEN, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 28 },
    },
    margin: { left: marginX, right: marginX },
  });

  y = (doc as any).lastAutoTable.finalY + 8;
  const closingNote = contactVerificationClosingNote(record.channel);
  if (closingNote) {
    drawWrappedText(doc, closingNote, marginX, y, contentWidth, {
      fontSize: 8,
      lineHeightMm: 4.5,
      color: GRAY_MID,
    });
  }
}

function appendProgrammeExemptionPage(
  doc: jsPDF,
  scorecard: ScorecardPDFInput,
  record: ProgrammeExemptionSupplementRecord,
  generatedDate: string
): void {
  doc.addPage();
  const marginX = 14;
  const contentWidth = doc.internal.pageSize.getWidth() - marginX * 2;

  let y = addScorecardSupplementPageHeader(
    doc,
    scorecard.mda,
    `Generated: ${generatedDate}`,
    record.pageTitle
  );

  y = sectionHeading(doc, "Exemption summary", y);
  y =
    drawWrappedText(doc, record.summaryNarrative, marginX, y, contentWidth, {
      fontSize: 9,
      lineHeightMm: 5,
      color: GRAY_DARK,
    }) + 4;

  y = sectionHeading(doc, "Assessment basis", y);
  y = drawBulletList(doc, record.basisBullets, marginX, y, contentWidth, {
    fontSize: 8,
    lineHeightMm: 5,
    afterGapMm: 6,
  });

  y = sectionHeading(doc, "Exemption details", y);
  autoTable(doc, {
    startY: y,
    head: [["Item", "Detail"]],
    body: record.findingRows.map(([label, detail]) => [label, detail]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: PEBEC_GREEN, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 28 },
    },
    margin: { left: marginX, right: marginX },
  });
}

function scorecardPdfFooterLabel(mda: { name: string; abbreviation?: string | null }): string {
  return mda.name.trim() || mda.abbreviation?.trim() || "MDA";
}

function scorecardPdfFilename(scorecard: ScorecardPDFInput): string {
  const safeName = (scorecard.mda.abbreviation || scorecard.mda.name).replace(/[^a-z0-9]/gi, "-");
  return `BEEPA-Scorecard-${safeName}-${pdfGeneratedDateFilenamePart()}.pdf`;
}

export function buildScorecardPDFDoc(scorecard: ScorecardPDFInput): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const generatedDate = formatPdfGeneratedDate();

  let y = addScorecardPageHeader(
    doc,
    scorecard.mda,
    `Tier: ${tierLabelWithPercentRange(scorecard.tier.label)}  ·  Status: ${scorecard.status.label}  ·  Score: ${pct(scorecard.score)}`,
    `Generated: ${generatedDate}`
  );

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

  const contactVerification = resolveMdaContactVerification(scorecard.mda);
  const programmeExemption = resolveProgrammeExemptionSupplement(scorecard.mda);
  if (contactVerification) {
    appendContactVerificationPage(doc, scorecard, contactVerification, generatedDate);
  } else if (programmeExemption) {
    appendProgrammeExemptionPage(doc, scorecard, programmeExemption, generatedDate);
  }

  const supplementFooterTag = contactVerification
    ? "Contact verification"
    : programmeExemption
      ? "Programme exemption"
      : null;

  // ── Page numbers ──────────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  const supplementPage = supplementFooterTag ? totalPages : null;
  const footerMdaLabel = scorecardPdfFooterLabel(scorecard.mda);
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY_MID);
    const pageLabel =
      i === supplementPage && supplementFooterTag
        ? `Page ${i} of ${totalPages}  ·  ${footerMdaLabel}  ·  ${supplementFooterTag}  ·  PEBEC — Confidential`
        : `Page ${i} of ${totalPages}  ·  ${footerMdaLabel}  ·  PEBEC — Confidential`;
    doc.text(pageLabel, pw / 2, doc.internal.pageSize.getHeight() - 6, { align: "center" });
  }

  return doc;
}

export function downloadScorecardPDF(scorecard: ScorecardPDFInput): void {
  buildScorecardPDFDoc(scorecard).save(scorecardPdfFilename(scorecard));
}

export async function downloadAllScorecardsZip(
  scorecards: ScorecardPDFInput[],
  options?: { zipFilenamePrefix?: string }
): Promise<void> {
  if (scorecards.length === 0) return;

  const zip = new JSZip();
  for (const scorecard of scorecards) {
    const doc = buildScorecardPDFDoc(scorecard);
    zip.file(scorecardPdfFilename(scorecard), doc.output("arraybuffer"));
  }

  const zipPrefix = options?.zipFilenamePrefix ?? "BEEPA-All-Scorecards";
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${zipPrefix}-${pdfGeneratedDateFilenamePart()}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function downloadContactVerificationScorecardsZip(
  scorecards: ScorecardPDFInput[]
): Promise<number> {
  const filtered = filterContactVerificationScorecards(scorecards);
  if (filtered.length === 0) return 0;
  await downloadAllScorecardsZip(filtered, {
    zipFilenamePrefix: "BEEPA-Contact-Verification-MDAs",
  });
  return filtered.length;
}
