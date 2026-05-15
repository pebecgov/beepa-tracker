/**
 * Bonus-point narratives keyed by MDA abbreviation (shown only when that agency is on `SUPER_MDA_BONUS_ABBREVIATIONS`).
 * Roster empty in code for now — entries kept for easy re-enable.
 */

export type BonusSubmissionRow = {
  activity: string;
  complianceLevel: string;
  evidenceAvailable: string;
};

export type SuperMdaBonusNarrative = {
  /** One-line heading shown above submissions table */
  title?: string;
  /** Structured bonus-request rows */
  submissionRows?: BonusSubmissionRow[];
  /** Fallback bullets when no structured rows */
  bullets?: string[];
};

export const SUPER_MDA_BONUS_NARRATIVES: Record<string, SuperMdaBonusNarrative> = {
  NAICOM: {
    title: "REQUEST FOR BONUS POINTS — regulatory simplification (NIIRA 2025 aligned)",
    submissionRows: [
      {
        activity:
          "Reduction in the number of regulatory requirements or documents needed to access a service or incentive.",
        complianceLevel:
          "Prospective insurance agents may complete registration online via the designated portal; licences may be issued electronically with post-issuance verification by the Commission.",
        evidenceAvailable: "https://agent.naicom.gov.ng/auth/register",
      },
      {
        activity: "Elimination of redundant approvals or steps within the process.",
        complianceLevel:
          "Broker licence renewal is processed fully online without mandatory physical presence; renewal validity extended from two (2) years to five (5) years under NIIRA 2025 Section 39(2).",
        evidenceAvailable:
          "NIIRA 2025 — licence renewal every five years or longer duration as the Commission may determine.",
      },
      {
        activity: "Simplification of procedures that reduces time or complexity for applicants.",
        complianceLevel:
          "Measures materially reduce compliance costs and administrative burden while improving efficiency and ease of doing business for regulated entities.",
        evidenceAvailable: "Supporting documentation filed with PEBEC / programme secretariat.",
      },
    ],
  },
};
