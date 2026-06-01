/** How contact verification was scored at 50% for an MDA. */
export type ContactVerificationChannel =
  | "email"
  | "phone"
  | "both"
  | "no_email_on_website"
  | "no_official_website";

export type MdaContactVerificationRecord = {
  abbreviation: string;
  /** Alternate abbreviations in the database (legacy sync). */
  aliases?: string[];
  /** Match when the MDA name contains this text (case-insensitive). */
  nameIncludes?: string;
  emails?: string[];
  phones?: string[];
  channel: ContactVerificationChannel;
};

type MdaLookup = { abbreviation?: string | null; name?: string | null };

function mdaNameMatches(record: MdaContactVerificationRecord, name: string): boolean {
  if (!record.nameIncludes) return false;
  return name.toLowerCase().includes(record.nameIncludes.toLowerCase());
}

function mdaAbbrevMatches(record: MdaContactVerificationRecord, abbreviation: string): boolean {
  const key = abbreviation.trim().toUpperCase();
  if (record.abbreviation.toUpperCase() === key) return true;
  return (record.aliases ?? []).some((alias) => alias.toUpperCase() === key);
}

function resolveContactVerificationRecord(mda: MdaLookup): MdaContactVerificationRecord | null {
  const abbrev = mda.abbreviation?.trim();
  if (abbrev) {
    const byAbbrev = MDA_CONTACT_VERIFICATION_RECORDS.find((record) =>
      mdaAbbrevMatches(record, abbrev)
    );
    if (byAbbrev) return byAbbrev;
  }
  const name = mda.name?.trim() ?? "";
  if (!name) return null;
  return (
    MDA_CONTACT_VERIFICATION_RECORDS.find((record) => mdaNameMatches(record, name)) ?? null
  );
}

/** MDAs with contact details on record but not reachable (50% on verification). */
export const MDA_CONTACT_VERIFICATION_RECORDS: MdaContactVerificationRecord[] = [
  {
    abbreviation: "SON",
    emails: ["info@son.gov.ng", "customerfeedback.collaboration@son.gov.ng"],
    channel: "email",
  },
  {
    abbreviation: "SCUML",
    emails: ["helpdeskscuml@efcc.gov.ng"],
    phones: ["07079190693", "07054099561"],
    channel: "both",
  },
  {
    abbreviation: "FAAN",
    emails: ["contact@faan.gov.ng"],
    channel: "email",
  },
  {
    abbreviation: "FPIS",
    emails: ["info@fpis.com"],
    channel: "email",
  },
  {
    abbreviation: "JRB",
    emails: ["contactus@jrb.gov.ng"],
    phones: ["08039187289"],
    channel: "both",
  },
  {
    abbreviation: "NEPZA",
    emails: ["enquiries@nepza.gov.ng"],
    channel: "email",
  },
  {
    abbreviation: "NBC",
    phones: ["+234 907 994 8888"],
    channel: "phone",
  },
  {
    abbreviation: "NiCC",
    emails: ["itunitcopyright@gmail.com"],
    channel: "email",
  },
  {
    abbreviation: "NOTAP",
    emails: ["info@notap.gov.ng"],
    phones: ["09034776654"],
    channel: "both",
  },
  {
    abbreviation: "NMDPRA",
    emails: ["authority@nmdpra.gov.ng"],
    channel: "email",
  },
  {
    abbreviation: "NIMC",
    emails: ["nimccustomercare@nimc.gov.ng"],
    channel: "email",
  },
  {
    abbreviation: "NIPC",
    emails: ["infodesk@nipc.gov.ng"],
    channel: "email",
  },
  {
    abbreviation: "NIPOST",
    emails: ["info@nipost.gov.ng"],
    channel: "email",
  },
  {
    abbreviation: "NSC",
    emails: ["nsc@shipperscouncil.gov.ng"],
    channel: "email",
  },
  {
    abbreviation: "NSITF",
    emails: ["corporateaffairs@nsitf.gov.ng", "customersupportcentre@nsitf.gov.ng"],
    channel: "email",
  },
  {
    abbreviation: "ARCON",
    channel: "no_email_on_website",
  },
  {
    abbreviation: "PHA",
    nameIncludes: "port health (quarantine)",
    channel: "no_official_website",
  },
  {
    abbreviation: "CBD",
    emails: ["info@interior.gov.ng"],
    phones: ["+234 (0) 700 009 9999"],
    channel: "both",
  },
  {
    abbreviation: "REA",
    emails: ["Info@rea.gov.ng"],
    phones: ["08112494040"],
    channel: "both",
  },
];

export function isContactVerificationMda(mda: MdaLookup): boolean {
  return resolveContactVerificationRecord(mda) !== null;
}

export function filterContactVerificationScorecards<
  T extends { mda: { abbreviation?: string | null; name?: string | null } },
>(scorecards: T[]): T[] {
  return scorecards.filter((scorecard) => isContactVerificationMda(scorecard.mda));
}

export function resolveMdaContactVerification(
  mda: MdaLookup
): MdaContactVerificationRecord | null {
  return resolveContactVerificationRecord(mda);
}

export function contactVerificationOutcomeNarrative(
  channel: ContactVerificationChannel
): string {
  switch (channel) {
    case "email":
      return (
        "This MDA was scored 50% on contact verification because email address(es) were on record " +
        "but no response was received within the 72-hour verification window."
      );
    case "phone":
      return (
        "This MDA was scored 50% on contact verification because telephone number(s) were on record " +
        "but calls to those numbers were not answered."
      );
    case "both":
      return (
        "This MDA was scored 50% on contact verification because email address(es) and telephone number(s) " +
        "were on record but there was no response to email within the 72-hour verification window and " +
        "calls to the listed numbers were not answered."
      );
    case "no_email_on_website":
      return (
        "The MDA's website was reviewed as part of contact verification. No email address was published " +
        "on the website, so verification outreach by email could not be completed."
      );
    case "no_official_website":
      return (
        "No official website was identified for this MDA during contact verification. Email addresses " +
        "and telephone numbers could not be verified from an official online source."
      );
  }
}

export function contactVerificationAttemptSummary(
  channel: ContactVerificationChannel
): string[] {
  switch (channel) {
    case "email":
      return [
        "Email(s) listed below were used for verification outreach.",
        "No reply was received within 72 hours of sending.",
      ];
    case "phone":
      return [
        "Telephone number(s) listed below were called during verification.",
        "No answer was received on the listed numbers.",
      ];
    case "both":
      return [
        "Email(s) listed below were used for verification outreach; no reply within 72 hours.",
        "Telephone number(s) listed below were called; no answer was received.",
      ];
    case "no_email_on_website":
      return [
        "PEBEC reviewed the MDA's website as part of contact verification.",
        "No email address was listed on the website for verification outreach.",
      ];
    case "no_official_website":
      return [
        "No official website was identified for this MDA during verification.",
        "Email addresses and telephone numbers could not be confirmed from an official online source.",
      ];
  }
}

export function contactVerificationShowsFiftyPercentScore(
  channel: ContactVerificationChannel
): boolean {
  return channel !== "no_email_on_website" && channel !== "no_official_website";
}

export function contactVerificationPageTitle(channel: ContactVerificationChannel): string {
  return contactVerificationShowsFiftyPercentScore(channel)
    ? "Contact Verification Record (50%)"
    : "Contact Verification Record";
}

export function contactVerificationOutcomeSectionTitle(
  channel: ContactVerificationChannel
): string {
  return contactVerificationShowsFiftyPercentScore(channel)
    ? "Contact verification outcome"
    : "Verification summary";
}

export function contactVerificationDetailsSectionTitle(
  channel: ContactVerificationChannel
): string {
  return channel === "no_email_on_website" || channel === "no_official_website"
    ? "Verification findings"
    : "Contact information on record";
}

export function contactVerificationClosingNote(
  channel: ContactVerificationChannel
): string | null {
  if (!contactVerificationShowsFiftyPercentScore(channel)) return null;

  return (
    "Contact details were available for this MDA but could not be reached using the channels above. " +
    "The 50% score reflects partial credit for providing contact information that was not responsive " +
    "or answerable during verification."
  );
}

export function contactVerificationFindingRows(
  record: MdaContactVerificationRecord
): string[][] {
  if (record.channel === "no_email_on_website") {
    return [["Website review", "No email address published on the MDA's website"]];
  }
  if (record.channel === "no_official_website") {
    return [
      [
        "Website review",
        "No official website identified for Port Health (Quarantine) Services; phone and email could not be verified online",
      ],
    ];
  }
  const rows: string[][] = [];
  for (const email of record.emails ?? []) {
    rows.push(["Email", email]);
  }
  for (const phone of record.phones ?? []) {
    rows.push(["Telephone", phone]);
  }
  return rows;
}
