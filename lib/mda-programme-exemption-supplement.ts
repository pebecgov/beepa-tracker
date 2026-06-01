/** Scorecard PDF supplement for MDAs on programme exemption (separate trailing page). */

export type ProgrammeExemptionSupplementRecord = {
  abbreviation: string;
  nameIncludes?: string;
  pageTitle: string;
  summaryNarrative: string;
  basisBullets: string[];
  findingRows: Array<[label: string, detail: string]>;
};

type MdaLookup = { abbreviation?: string | null; name?: string | null };

const NRS_EXEMPTION_SUPPLEMENT: ProgrammeExemptionSupplementRecord = {
  abbreviation: "NRS",
  nameIncludes: "nigeria revenue service",
  pageTitle: "Programme Exemption Record",
  summaryNarrative:
    "The Nigeria Revenue Service (NRS) has been exempted from the current BEEPA assessment cycle. " +
    "In light of the transition from the Federal Inland Revenue Service (FIRS) to the NRS, restructuring of " +
    "internal systems, and operational demands associated with implementing the new tax law, NRS was granted " +
    "a temporary programme exemption and a one-month extension from the official end of the BEEPA programme period.",
  basisBullets: [
    "NRS was exempted from the standard BEEPA assessment and scoring cycle for this reporting period.",
    "A one-month extension was granted from the end of the BEEPA programme period to allow completion of transitional and implementation requirements.",
    "This exemption and extension were approved in recognition of the institution's ongoing national tax reform transition.",
  ],
  findingRows: [
    ["Exemption status", "Temporary programme exemption — Nigeria Revenue Service (NRS)"],
    ["Extension granted", "One-month extension from the end of the BEEPA programme period"],
  ],
};

const PROGRAMME_EXEMPTION_SUPPLEMENTS: ProgrammeExemptionSupplementRecord[] = [
  NRS_EXEMPTION_SUPPLEMENT,
];

function mdaAbbrevMatches(record: ProgrammeExemptionSupplementRecord, abbreviation: string): boolean {
  return record.abbreviation.toUpperCase() === abbreviation.trim().toUpperCase();
}

function mdaNameMatches(record: ProgrammeExemptionSupplementRecord, name: string): boolean {
  if (!record.nameIncludes) return false;
  return name.toLowerCase().includes(record.nameIncludes.toLowerCase());
}

export function resolveProgrammeExemptionSupplement(
  mda: MdaLookup
): ProgrammeExemptionSupplementRecord | null {
  const abbrev = mda.abbreviation?.trim();
  if (abbrev) {
    const byAbbrev = PROGRAMME_EXEMPTION_SUPPLEMENTS.find((record) =>
      mdaAbbrevMatches(record, abbrev)
    );
    if (byAbbrev) return byAbbrev;
  }
  const name = mda.name?.trim() ?? "";
  if (!name) return null;
  return (
    PROGRAMME_EXEMPTION_SUPPLEMENTS.find((record) => mdaNameMatches(record, name)) ?? null
  );
}
