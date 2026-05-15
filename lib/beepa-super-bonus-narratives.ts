/**
 * Bonus-point narratives keyed by MDA abbreviation (shown when on `SUPER_MDA_BONUS_ABBREVIATIONS`).
 */

import { SUPER_MDA_BONUS_ABBREVIATIONS } from "./beepa-scoring";

export type BonusSubmissionRow = {
  activity: string;
  complianceLevel: string;
  evidenceAvailable: string;
};

export type SuperMdaBonusNarrative = {
  /** One-line heading shown above submissions table */
  title?: string;
  /** Short paragraph for tier tooltips / exports */
  tierDescription?: string;
  /** Structured bonus-request rows */
  submissionRows?: BonusSubmissionRow[];
  /** Fallback bullets when no structured rows */
  bullets?: string[];
};

export const SUPER_MDA_BONUS_NARRATIVES: Record<string, SuperMdaBonusNarrative> = {
  NPA: {
    title: "BEEPA bonus points — regulatory simplification (shipping company/agent licensing)",
    tierDescription:
      "Certificate issuance simplification with measurable turnaround reduction and operational compliance report.",
    submissionRows: [
      {
        activity:
          "Reduction in regulatory requirements or documents (Criterion A) and procedure simplification (Criterion C).",
        complianceLevel:
          "Streamlined documentation and coordinated submission for registration of shipping companies/agents; structured approvals and improved transparency.",
        evidenceAvailable:
          "Turnaround reduced from ~6 weeks to 10 working days (~67% reduction); RS(A) fully achieved, RS(B) achieved.",
      },
      {
        activity: "Elimination of redundant approvals or steps within the process (Criterion B).",
        complianceLevel:
          "Repetitive verification and multiple sequential submissions removed from the licensing/certificate issuance process.",
        evidenceAvailable: "Before/after process narrative in PEBEC submission (April 2026).",
      },
      {
        activity: "Operational evidence of simplified service delivery.",
        complianceLevel:
          "MDA EO1 Service Delivery Compliance Report (March 2026) — HQ Annex, Apapa: registration of shipping company/agent with same-day and short-cycle completions on record.",
        evidenceAvailable: "Submission attached to PEBEC BEEPA bonus points request.",
      },
    ],
  },
  NCS: {
    title:
      "BEEPA bonus points — regulatory simplification (12 measures, Annex A; 7 April 2026)",
    tierDescription:
      "Twelve qualifying simplification measures across digital trade, OSS, NII, STR, and licensing; satisfies RS(A), RS(B), and RS(C).",
    submissionRows: [
      {
        activity:
          "Reduction in documentary requirements (RS / Criterion A) — e-Form M, STR, AEO portal, Advance Ruling, AfCFTA CoO, agent licensing Phase 1, bonded warehouse consolidation.",
        complianceLevel:
          "Multiple services moved from multi-document paper processes to fewer digital inputs (e.g. Form M: 6 documents to 2 digital inputs; STR: 11 to 4 documents; warehouse licence: 11 to 6).",
        evidenceAvailable:
          "bodogwu.customs.gov.ng; aeo.nigeriatradehub.gov.ng; advanceruling.nigeriatradehub.gov.ng; coo.nigeriatradehub.gov.ng",
      },
      {
        activity:
          "Elimination of redundant approvals or steps (RS / Criterion B) — PAAR automation, Green Lane, OSS, NII, AfCFTA CoO, TAP extension.",
        complianceLevel:
          "~65% of import cargo on Green Lane without physical examination; OSS replaces 3–5 sequential unit interventions with one coordinated case (T&T/2025/Circular No. 13); NII removes routine physical unstuffing for Red Lane cargo.",
        evidenceAvailable: "T&T/2025/Circular No. 13; OSS SOP; NCS Modernization Project / TRS data.",
      },
      {
        activity:
          "Simplification reducing time or complexity (RS / Criterion C).",
        complianceLevel:
          "PAAR: 7 manual steps to 2 electronic steps; Advance Ruling delivered in ~14 days vs WCO 150-day benchmark; OSS target resolution 48 hours; NII examination under 30 minutes at equipped ports.",
        evidenceAvailable: "Annex A evidence table and NCS-Restructured-SLA submitted to PEBEC.",
      },
    ],
    bullets: [
      "Pillar 1 — Digital trade: e-Form M (RS-01), PAAR automation (RS-02), Green Lane (RS-03), AEO (RS-07), Advance Ruling (RS-08).",
      "Pillar 2 — One-Stop-Shop: single coordinated NCS intervention on B'ODOGWU (RS-04).",
      "Pillar 3 — Non-intrusive inspection scanners (RS-05).",
      "Pillar 4 — AfCFTA CoO online (RS-09), Simplified Trade Regime (RS-06), TAP extension reform (RS-10).",
      "Pillar 5 — Customs agent licensing digitalization Phase 1 (RS-11), bonded warehouse document consolidation (RS-12).",
    ],
  },
};

export function collectSuperMdaBonusNarrativeBlocks(
  mdasByPerformanceTier: Array<{
    mdas: Array<{
      mda: { _id: string; name: string; abbreviation?: string | null };
    }>;
  }>
): Array<{ abbrev: string; name: string; narrative: SuperMdaBonusNarrative }> {
  const mdaByAbbrev = new Map<string, { name: string; _id: string }>();
  for (const tierBlock of mdasByPerformanceTier) {
    for (const item of tierBlock.mdas) {
      const abbrev = item.mda.abbreviation?.trim().toUpperCase();
      if (abbrev) mdaByAbbrev.set(abbrev, item.mda);
    }
  }

  return SUPER_MDA_BONUS_ABBREVIATIONS.flatMap((abbrev) => {
    const narrative = SUPER_MDA_BONUS_NARRATIVES[abbrev];
    if (!narrative) return [];
    const mda = mdaByAbbrev.get(abbrev);
    return [
      {
        abbrev,
        name: mda?.name ?? abbrev,
        narrative,
      },
    ];
  });
}
