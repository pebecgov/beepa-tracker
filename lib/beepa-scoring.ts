/**
 * Rules for which reforms / activities count toward an MDA's overall BEEPA score.
 * Keep in sync with `convex/performance.ts` usage.
 */

export function mdaHasPartialReformScoring(mda: { abbreviation?: string | null }): boolean {
  const a = mda.abbreviation;
  return a === "NCC" || a === "GBB" || a === "SERVICOM" || a === "NEXIM" || a === "BOI" || a === "SEC" || a === "NESREA";
}

export function mdaHasPartialActivityScoring(mda: { abbreviation?: string | null }): boolean {
  const a = mda.abbreviation;
  return a === "NIS" || a === "SERVICOM";
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
    return refNumber !== 6;
  }
  if (mda.abbreviation === "BOI") {
    return refNumber !== 3 && refNumber !== 4 && refNumber !== 6;
  }
  if (mda.abbreviation === "SEC") {
    return refNumber !== 4;
  }
  if (mda.abbreviation === "NESREA") {
    return refNumber !== 4;
  }
  return true;
}

/**
 * Returns false for activities that are excluded from an MDA's score.
 * NIS Reform 6: excludes activities 6.6 and 6.7.
 * SERVICOM Reform 7: excludes activity 7.2.
 * SERVICOM Reform 2: excludes activities 2.9 and 2.10.
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
  return true;
}
