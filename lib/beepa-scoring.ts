/**
 * Rules for which reforms / activities count toward an MDA's overall BEEPA score.
 * Keep in sync with `convex/performance.ts` usage.
 */

export function mdaHasPartialReformScoring(mda: { abbreviation?: string | null }): boolean {
  const a = mda.abbreviation;
  return (
    a === "NCC" || a === "GBB" || a === "SERVICOM" || a === "NEXIM" || a === "BOI" ||
    a === "SEC" || a === "NESREA" || a === "NITDA" || a === "REA" ||
    a === "NCAA" || a === "NUPRC" || a === "NMDPRA" || a === "NOTAP" ||
    a === "NDPC" || a === "NIPC" || a === "SCUML" || a === "ITF" || a === "NBS" ||
    a === "NERC" || a === "NEPZA" || a === "NRS"
  );
}

export function mdaHasPartialActivityScoring(mda: { abbreviation?: string | null }): boolean {
  const a = mda.abbreviation;
  return a === "NIS" || a === "SERVICOM" || a === "NUPRC" || a === "NEXIM";
}

export function reformCountsTowardMdaScore(
  mda: { abbreviation?: string | null },
  refNumber: number
): boolean {
  if (mda.abbreviation === "NCC") {
    return refNumber !== 4 && refNumber !== 6;
  }
  if (mda.abbreviation === "GBB") {
    return refNumber !== 4 && refNumber !== 5 && refNumber !== 6;
  }
  if (mda.abbreviation === "SERVICOM") {
    return refNumber !== 3 && refNumber !== 4 && refNumber !== 5 && refNumber !== 6;
  }
  if (mda.abbreviation === "NEXIM") {
    return refNumber !== 3 && refNumber !== 6;
  }
  if (mda.abbreviation === "BOI") {
    return refNumber !== 3 && refNumber !== 4 && refNumber !== 6;
  }
  if (mda.abbreviation === "SEC") {
    return refNumber !== 4 && refNumber !== 6;
  }
  if (mda.abbreviation === "NESREA") {
    return refNumber !== 4;
  }
  if (mda.abbreviation === "NITDA") {
    return refNumber !== 4 && refNumber !== 6;
  }
  if (mda.abbreviation === "REA") {
    return refNumber !== 6;
  }
  if (mda.abbreviation === "NCAA") {
    return refNumber !== 3;
  }
  if (mda.abbreviation === "NUPRC") {
    return refNumber !== 6;
  }
  if (mda.abbreviation === "NMDPRA") {
    return refNumber !== 4 && refNumber !== 6;
  }
  if (mda.abbreviation === "NOTAP") {
    return refNumber !== 4 && refNumber !== 6;
  }
  if (mda.abbreviation === "NDPC") {
    return refNumber !== 3 && refNumber !== 4 && refNumber !== 6;
  }
  if (mda.abbreviation === "NIPC") {
    return refNumber !== 6;
  }
  if (mda.abbreviation === "SCUML") {
    return refNumber !== 6;
  }
  if (mda.abbreviation === "ITF") {
    return refNumber !== 6;
  }
  if (mda.abbreviation === "NBS") {
    return refNumber !== 6;
  }
  if (mda.abbreviation === "NERC") {
    return refNumber !== 6;
  }
  if (mda.abbreviation === "NEPZA") {
    return refNumber !== 6;
  }
  if (mda.abbreviation === "NRS") {
    return refNumber !== 3;
  }
  return true;
}

/**
 * Returns false for activities that are under scoring exception for an MDA.
 * NIS Reform 6: excludes activities 6.6 and 6.7.
 * SERVICOM Reform 7: excludes activity 7.2.
 * SERVICOM Reform 2: excludes activities 2.9 and 2.10.
 * NUPRC Reform 4: excludes activities 4.2 and 4.4.
 * NERC Reform 4: excludes activities 4.3, 4.4, and 4.5.
 */
export function activityCountsTowardMdaScore(
  mda: { abbreviation?: string | null },
  reformRefNumber: number,
  activityRefNumber: string
): boolean {
  if (mda.abbreviation === "NIS" && reformRefNumber === 6) {
    return activityRefNumber !== "6.6" && activityRefNumber !== "6.7";
  }
  if (mda.abbreviation === "SERVICOM" && reformRefNumber === 7) {
    return activityRefNumber !== "7.2";
  }
  if (mda.abbreviation === "SERVICOM" && reformRefNumber === 2) {
    return activityRefNumber !== "2.9" && activityRefNumber !== "2.10";
  }
  if (mda.abbreviation === "NUPRC" && reformRefNumber === 4) {
    return activityRefNumber !== "4.2" && activityRefNumber !== "4.4";
  }
  if (mda.abbreviation === "NERC" && reformRefNumber === 4) {
    return activityRefNumber !== "4.3" && activityRefNumber !== "4.4" && activityRefNumber !== "4.5";
  }
  if (mda.abbreviation === "NEXIM" && reformRefNumber === 7) {
    return activityRefNumber !== "7.2";
  }
  return true;
}

/** Nigeria Revenue Service — Reform 3 scoring exception (tax reform statutory extension). Shown on reform summaries / PDF. */
export const NRS_REFORM_THREE_EXCEPTION_NOTE =
  "NRS exception from Reform 3 scoring: statutory timeline extension under national tax reform implementation.";

/** MDAs on programme exception roster (excluded from tier bands and requires-intervention listings). */
export const BEEPA_PROGRAMME_EXCEPTION_MDA_ABBREVIATIONS = [
  "BOA",
  "NAIC",
  "NRS",
  "CBN",
] as const;

export function mdaHasProgrammeException(mda: { abbreviation?: string | null }): boolean {
  const a = mda.abbreviation?.trim().toUpperCase();
  if (!a) return false;
  if (a === "CBN-NCR") return true;
  return (BEEPA_PROGRAMME_EXCEPTION_MDA_ABBREVIATIONS as readonly string[]).includes(a);
}

export type ProgrammeExceptionNote = {
  heading: string;
  narrative: string;
};

/** Programme exception narratives — general report « Programme exceptions » panel / PDF. */
export const BEEPA_PROGRAMME_EXCEPTION_NOTES: readonly ProgrammeExceptionNote[] = [
  {
    heading: "Patents & Designs Registry (PDR)",
    narrative:
      "The Patents & Designs Registry (PDR) was granted a temporary exemption from the current BEEPA assessment cycle due to ongoing challenges with its online registration platform and internal operational issues affecting its processes and service delivery. As a result, it was unable to participate effectively during the assessment period.",
  },
  {
    heading: "Trade Marks Registry",
    narrative:
      "The Trade Marks Registry was granted a temporary exemption from the current BEEPA assessment cycle due to ongoing challenges with its online registration platform and internal operational issues affecting its processes and service delivery. As a result, it was unable to participate effectively during the assessment period.",
  },
  {
    heading: "Bank of Agriculture (BOA)",
    narrative:
      "The Bank of Agriculture (BOA) was granted a temporary exemption and will participate in a subsequent BEEPA implementation cycle, having not been included at the commencement of the current programme cycle.",
  },
  {
    heading: "Nigerian Agricultural Insurance Corporation (NAIC)",
    narrative:
      "The Nigerian Agricultural Insurance Corporation (NAIC) was granted a temporary exemption from the current BEEPA assessment cycle following a fire incident that significantly impacted its ICT infrastructure and operational capacity.",
  },
  {
    heading: "Nigeria Revenue Service (NRS)",
    narrative:
      "The Nigeria Revenue Service (NRS) was granted a temporary exemption in light of the ongoing transition from the Federal Inland Revenue Service (FIRS) to the NRS, the restructuring of its internal systems, and the operational demands associated with implementing the new tax law.",
  },
  {
    heading: "Central Bank of Nigeria (CBN)",
    narrative:
      "The Central Bank of Nigeria (CBN) was granted a programme exemption. The National Collateral Registry, which was previously tracked separately, is a unit within a department of the CBN; therefore, BEEPA assessment and reporting now cover the institution as a whole.",
  },
];

/** Super MDA bonus roster — validated regulatory-simplification submissions (bonus points). */
export const SUPER_MDA_BONUS_ABBREVIATIONS = ["NPA", "NCS", "PENCOM", "NITDA"] as const;

export type ScorecardTier = {
  label: string;
  description: string;
  color: string;
};

/** Label for the exceptional Super MDA tier row (unused while `SUPER_MDA_BONUS_ABBREVIATIONS` is empty). */
export const EXCEPTIONAL_SUPER_MDA_TIER_LABEL =
  "Exceptional performance (Super MDAs) — Submission of evidence for bonus point";

export function mdaHasSuperMdaBonus(mda: { abbreviation?: string | null }): boolean {
  const a = mda.abbreviation?.trim();
  if (!a) return false;
  const upper = a.toUpperCase();
  return (SUPER_MDA_BONUS_ABBREVIATIONS as readonly string[]).includes(upper);
}

/** Rounded score percent (0–100), aligned with displayed scores in the UI and reports. */
export function beepaScorePercentRounded(score: number): number {
  return Math.round(score * 100);
}

/** MDA status aligned with score tier bands (Poor → Requires Intervention, red). */
export function getMdaApplicableStatus(score: number): { label: string; color: string } {
  const tierLabel = scoreTierBandOnly(score).label;
  if (tierLabel === "Poor") {
    return { label: "Requires Intervention", color: "red" };
  }
  const pct = beepaScorePercentRounded(score);
  if (pct >= 100) return { label: "Successful", color: "green" };
  if (pct >= 80) return { label: "Progressing Well", color: "blue" };
  if (pct >= 60) return { label: "In Progress", color: "yellow" };
  if (pct >= 50) return { label: "Progressing With Difficulty", color: "orange" };
  return { label: "Requires Intervention", color: "red" };
}

export function isPoorTierScore(score: number): boolean {
  return scoreTierBandOnly(score).label === "Poor";
}

export function scoreTierBandOnly(score: number): ScorecardTier {
  const pct = beepaScorePercentRounded(score);
  if (pct >= 100) {
    return {
      label: "Excellent",
      description: "100% of applicable BEEPA reform weighted implementation.",
      color: "blue",
    };
  }
  if (pct >= 80) {
    return {
      label: "Very Good",
      description: "Strong reform implementation with residual gaps.",
      color: "blue",
    };
  }
  if (pct >= 60) {
    return {
      label: "Good",
      description: "Solid progress across reforms.",
      color: "blue",
    };
  }
  if (pct >= 50) {
    return {
      label: "Fair",
      description: "Meaningful but uneven implementation.",
      color: "yellow",
    };
  }
  return {
    label: "Poor",
    description: "Requires focused implementation support.",
    color: "red",
  };
}

/**
 * MDAs on `SUPER_MDA_BONUS_ABBREVIATIONS`: exceptional tier labels when roster non-empty.
 * Otherwise all MDAs use score bands Excellent → Poor only.
 */
export function getScorecardTierForMda(
  mda: { abbreviation?: string | null },
  score: number
): ScorecardTier {
  if (!mdaHasSuperMdaBonus(mda)) {
    return scoreTierBandOnly(score);
  }
  const abbrev = mda.abbreviation?.trim().toUpperCase() ?? "MDA";
  const bonusNote =
    abbrev === "NPA"
      ? "Regulatory simplification for shipping company/agent licensing (certificate issuance); turnaround reduced from ~6 weeks to 10 working days, with March 2026 service-delivery evidence on record."
      : abbrev === "NCS"
        ? "Twelve qualifying regulatory simplification measures (digital trade, OSS, NII, STR, AfCFTA CoO, licensing) meeting BEEPA RS(A)–RS(C); ten live on public portals per Annex A submission."
        : abbrev === "PENCOM"
          ? "Data recapture document reduction and pay-out approval ceding to Licensed PFAs (PenCom/TECH/NDM/2026/48; PenCom/INSP/Surv/Aut/451) meeting BEEPA RS(A)–RS(C)."
          : abbrev === "NITDA"
            ? "IT Project Clearance and IICP registration simplifications published in Service Charter 6th Edition 2026 and IT Project Clearance Guideline (PEBEC submission, 5 May 2026) meeting BEEPA RS(A)–RS(C)."
            : "Validated regulatory simplification bonus submission on record.";
  const scoreNote =
    score >= 0.995
      ? " Applicable BEEPA reform score at full implementation."
      : " Reform tracker score reflects ongoing BEEPA implementation alongside validated bonus claim.";
  return {
    label: EXCEPTIONAL_SUPER_MDA_TIER_LABEL,
    description: `${abbrev}: ${bonusNote}${scoreNote}`,
    color: "green",
  };
}

/** Percent ranges for standard score bands (matches rounded `scoreTierBandOnly` thresholds). */
const SCORE_TIER_PERCENT_RANGES: Record<string, string> = {
  Excellent: "100%",
  "Very Good": "80–99%",
  Good: "60–79%",
  Fair: "50–59%",
  Poor: "0–49%",
};

/** Tier label with percent range in brackets — for PDF and other formal exports. */
export function tierLabelWithPercentRange(label: string): string {
  const range = SCORE_TIER_PERCENT_RANGES[label];
  return range ? `${label} (${range})` : label;
}

/** General report tier tables: full name with abbreviation when present. */
export function generalReportMdaNameWithAbbrev(mda: { name: string; abbreviation?: string | null }) {
  const a = mda.abbreviation?.trim();
  if (!a) return mda.name;
  if (mda.name.includes(`(${a})`)) return mda.name;
  return `${mda.name} (${a})`;
}
