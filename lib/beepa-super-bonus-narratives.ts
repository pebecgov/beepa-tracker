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
  PENCOM: {
    title:
      "BEEPA bonus points — regulatory simplification (data recapture documents + pay-out approval ceding)",
    tierDescription:
      "Two Commission circulars evidencing document reduction for RSA data recapture and delegation of pay-out approvals to Licensed PFAs with timeline reduction; satisfies RS Criteria A, B, and C.",
    submissionRows: [
      {
        activity:
          "Reduction in regulatory requirements or documents (Criterion A) — RSA data recapture exercise.",
        complianceLevel:
          "Commission streamlined documents PFAs must obtain from RSA holders (active contributors, retirees, and holders with name/date-of-birth changes) following deployment of the Enhanced Contributor Registration System (ECRS).",
        evidenceAvailable:
          "PenCom/TECH/NDM/2026/48 to all Licensed Pension Fund Administrators, 16 February 2026 (Commission website; Appendix 1).",
      },
      {
        activity:
          "Elimination of redundant approvals or steps within process (Criterion B) — ceding of pay-out approvals to PFAs.",
        complianceLevel:
          "Commission ceased central validation and No-Objection approval for eleven pay-out categories (programmed withdrawal, retiree life annuity, temporary loss of employment, en bloc, pre-PRA benefits, voluntary contributions, mortgage equity, NSITF transfers, periodicity changes, employer remittance error resolution, refunds for persons exempted under PRA 2014); Licensed PFAs process pay-outs without Commission No-Objection on each case.",
        evidenceAvailable:
          "PenCom/INSP/Surv/Aut/451 to all Licensed Pension Fund Administrators, 12 March 2025 (Commission website; Appendix 2).",
      },
      {
        activity:
          "Simplification of procedures that reduces time or complexity for applicants (Criterion C).",
        complianceLevel:
          "Pay-out approval cycle reduced from 3–5 working days to 2 working days; data recapture enables RSA holders to correct legacy CRS records and complete NIN-authenticated identity updates.",
        evidenceAvailable:
          "Same circulars; pay-out ceding measure aligns Criterion B and C on a single published reform.",
      },
    ],
    bullets: [
      "Data recapture: complete and accurate RSA holder details, NIN authentication via NIMC, correction of legacy CRS data, and isolation of duplicate RSA registrations.",
      "Pay-out types covered: programmed withdrawal, life annuity, temporary loss of employment, en bloc, pre-PRA benefits, voluntary contributions, mortgage equity, NSITF transfers, periodicity changes, employer error resolution, exempt-person refunds.",
    ],
  },
  NITDA: {
    title:
      "BEEPA bonus points — regulatory simplification (IT Project Clearance + IICP registration; 5 May 2026)",
    tierDescription:
      "Two published service simplifications (IT Project Clearance Guideline and IT Company/Service Providers registration) in Service Charter 6th Edition 2026 and on nitda.gov.ng; satisfies RS Criteria A, B, and C.",
    submissionRows: [
      {
        activity:
          "Reduction in regulatory requirements or documents (Criterion A) — IT Project Clearance.",
        complianceLevel:
          "2018 manual FORM ITC.1 and written correspondence replaced by public guideline on nitda.gov.ng, electronic portal workflow, standardized checklist, and threshold: only IT projects from N10,000,000 and above require clearance.",
        evidenceAvailable:
          "IT Project Clearance Guideline; Service Charter 6th Edition 2026 (nitda.gov.ng). PEBEC letter 5 May 2026.",
      },
      {
        activity:
          "Elimination of redundant approvals or steps (Criterion B) — risk-based processing and default approval.",
        complianceLevel:
          "Risk/threshold categorization avoids over-processing minor requests; explicit default approval on day 5 after verification when no acknowledgement or request for information; IICP default approval within one working day after complete submission if no MDA action.",
        evidenceAvailable:
          "Before/after comparison tables in NITDA submission to PEBEC DG; BFA monthly reports March–April 2026 cited as supplementary evidence.",
      },
      {
        activity:
          "Simplification of procedures that reduces time or complexity (Criterion C).",
        complianceLevel:
          "IT Project Clearance SLA reduced from 20 working days (2018) to 10 working days (2026); digital notifications and clearance letter posted to FPI; IICP registration SLA reduced from 3 working days to 2 working days with decomposed stages in Service Charter.",
        evidenceAvailable:
          "Service Charter 6th Edition 2026; IT Project Clearance Guideline (published simplifications per NITDA letter).",
      },
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
