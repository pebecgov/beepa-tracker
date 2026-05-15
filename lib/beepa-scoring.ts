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
 * Returns false for activities that are excluded from an MDA's score.
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

/** Abbreviation recorded as first MDA to complete the full BEEPA exercise (report column). */
export const FIRST_BEEPA_COMPLETE_ABBREVIATION = "NAQS";

/** Nigeria Revenue Service — Reform 3 excluded (tax reform statutory extension). Shown on reform summaries / PDF. */
export const NRS_REFORM_THREE_EXEMPTION_NOTE =
  "NRS exempt from Reform 3 scoring: statutory timeline extension under national tax reform implementation.";

/** Programme exemption narratives — general report « Programme exemptions » panel / PDF. */
export const BEEPA_PROGRAMME_EXEMPTION_NOTES: readonly string[] = [
  "Patents & Designs Registry (PDR): exemption — issues with developers delaying compliant tracker delivery.",
  "Trade Marks Registry: exemption — issues with developers delaying compliant tracker delivery.",
  "Bank of Agriculture (BOA): exempt — not originally part of BEEPA; agency is being added now, so reforms treated as exempt pending onboarding.",
  "NAIC: exemption — operational disruption following a fire outbreak affecting offices.",
  "Nigeria Revenue Service (NRS): exemptions reflect ongoing national tax reform.",
];

/** Super MDA bonus roster (empty = no Super MDA tier active). Re-add abbreviations here when re-enabled. */
export const SUPER_MDA_BONUS_ABBREVIATIONS = [] as const;

export type ScorecardTier = {
  label: string;
  description: string;
  color: string;
};

/** Label for the exceptional Super MDA tier row (unused while `SUPER_MDA_BONUS_ABBREVIATIONS` is empty). */
export const EXCEPTIONAL_SUPER_MDA_TIER_LABEL =
  "Exceptional performance (Super MDA) — Submission of evidence for bonus point";

/** Programme milestone row — first agency to complete BEEPA (separate from score bands). */
export const FIRST_BEEPA_COMPLETION_MILESTONE_TIER_LABEL =
  "First BEEPA completion (programme milestone)";

export function mdaHasSuperMdaBonus(mda: { abbreviation?: string | null }): boolean {
  const a = mda.abbreviation?.trim();
  if (!a) return false;
  const upper = a.toUpperCase();
  return (SUPER_MDA_BONUS_ABBREVIATIONS as readonly string[]).includes(upper);
}

export function scoreTierBandOnly(score: number): ScorecardTier {
  if (score >= 0.995) {
    return {
      label: "Excellent",
      description: "100% of applicable BEEPA reform weighted implementation.",
      color: "blue",
    };
  }
  if (score >= 0.8) {
    return {
      label: "Very Good",
      description: "Strong reform implementation with residual gaps.",
      color: "blue",
    };
  }
  if (score >= 0.6) {
    return {
      label: "Good",
      description: "Solid progress across reforms.",
      color: "blue",
    };
  }
  if (score >= 0.5) {
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
  if (score >= 0.995) {
    return {
      label: EXCEPTIONAL_SUPER_MDA_TIER_LABEL,
      description:
        "NAICOM at 100% applicable BEEPA score plus validated programme bonus points (submission on record).",
      color: "green",
    };
  }
  return {
    label: EXCEPTIONAL_SUPER_MDA_TIER_LABEL,
    description:
      "NAICOM — bonus-eligible Super MDA; reform tracker score still building toward full completion.",
    color: "green",
  };
}

/** General report tier tables: full name with abbreviation when present. */
export function generalReportMdaNameWithAbbrev(mda: { name: string; abbreviation?: string | null }) {
  const a = mda.abbreviation?.trim();
  return a ? `${mda.name} (${a})` : mda.name;
}
