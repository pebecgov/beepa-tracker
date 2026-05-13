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
    a === "NERC"
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
