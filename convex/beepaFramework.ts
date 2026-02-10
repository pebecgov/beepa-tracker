// BEEPA Weighted Reform Framework
// All MDAs have the same 7 reforms with standardized activities and weights

export interface ActivityTemplate {
  ref: string;
  name: string;
  weight: number; // Decimal (0.10 = 10%)
}

export interface ReformTemplate {
  refNumber: number;
  name: string;
  activities: ActivityTemplate[];
}

export const BEEPA_REFORMS: ReformTemplate[] = [
  {
    refNumber: 1,
    name: "Clear, Competitive & Public Service Level Agreements (SLAs)",
    activities: [
      { ref: "1.1", name: "Compile comprehensive list of MDA services with SLAs", weight: 0.10 },
      { ref: "1.2", name: "Decompose SLAs (timelines, cost, documents, process)", weight: 0.15 },
      { ref: "1.3", name: "Map user journey & identify friction points", weight: 0.15 },
      { ref: "1.4", name: "Conduct SLA vs practice gap analysis", weight: 0.20 },
      { ref: "1.5", name: "Benchmark SLAs against comparator countries", weight: 0.15 },
      { ref: "1.6", name: "Redesign SLAs for competitiveness", weight: 0.10 },
      { ref: "1.7", name: "Management approval of revised SLAs", weight: 0.10 },
      { ref: "1.8", name: "Public publication of approved SLAs", weight: 0.05 },
    ],
  },
  {
    refNumber: 2,
    name: "End-to-End Transparency in Government Services",
    activities: [
      { ref: "2.1", name: "Functional official website exists and is publicly accessible", weight: 0.05 },
      { ref: "2.2", name: "Services and scope of the MDA clearly listed on the website", weight: 0.05 },
      { ref: "2.3", name: "Requirements and eligibility criteria for each service clearly stated", weight: 0.10 },
      { ref: "2.4", name: "Step-by-step procedures for each service clearly outlined", weight: 0.10 },
      { ref: "2.5", name: "Very detailed and service-specific FAQ publicly available", weight: 0.05 },
      { ref: "2.6", name: "Costs for each service clearly indicated with no hidden charges", weight: 0.15 },
      { ref: "2.7", name: "Functional customer service email address publicly listed", weight: 0.05 },
      { ref: "2.8", name: "Functional customer service phone numbers publicly listed (multiple where applicable)", weight: 0.10 },
      { ref: "2.9", name: "Online application process available for all applicable services", weight: 0.10 },
      { ref: "2.10", name: "Approvals / facilities granted online without mandatory physical visits", weight: 0.15 },
      { ref: "2.11", name: "ReportGov.ng linked on the MDA website for complaints and feedback", weight: 0.10 },
    ],
  },
  {
    refNumber: 3,
    name: "Default Approval for Service Timelines",
    activities: [
      { ref: "3.1", name: "Define Default Approval trigger points and embed in SLAs", weight: 0.15 },
      { ref: "3.2", name: "Establish applicant notification process", weight: 0.15 },
      { ref: "3.3", name: "Internal notification & escalation to Head of Agency", weight: 0.15 },
      { ref: "3.4", name: "Define Default Approval authority, SOP & responsible unit", weight: 0.20 },
      { ref: "3.5", name: "Execute and evidence Default Approval (test/live cases)", weight: 0.20 },
      { ref: "3.6", name: "Monthly Default Approval reporting to PEBEC", weight: 0.15 },
    ],
  },
  {
    refNumber: 4,
    name: "One Government Service Delivery Model",
    activities: [
      { ref: "4.1", name: "Identify inter-agency approval dependencies", weight: 0.15 },
      { ref: "4.2", name: "Develop inter-agency dependency maps", weight: 0.15 },
      { ref: "4.3", name: "Designate Lead MDA for dependent services", weight: 0.15 },
      { ref: "4.4", name: "Agree inter-agency workflow", weight: 0.15 },
      { ref: "4.5", name: "Align inter-agency SLAs (timelines, escalation, default approval)", weight: 0.20 },
      { ref: "4.6", name: "Execute inter-agency MoUs", weight: 0.20 },
    ],
  },
  {
    refNumber: 5,
    name: "Regulatory Impact Analysis Implementation",
    activities: [
      { ref: "5.1", name: "Comprehensive Regulatory Baseline of all existing regulatory instruments", weight: 0.30 },
      { ref: "5.2", name: "Submission of all regulatory instruments and validation by PEBEC", weight: 0.15 },
      { ref: "5.3", name: "A Four-Tier Regulatory Prioritization of existing regulatory instruments", weight: 0.25 },
      { ref: "5.4", name: "Identification of Regulations for Ex-Post RIA", weight: 0.30 },
    ],
  },
  {
    refNumber: 6,
    name: "Regulatory Overlap Reduction & Role Clarity",
    activities: [
      { ref: "6.1", name: "Map services, approvals, inspections within each cluster", weight: 0.10 },
      { ref: "6.2", name: "Identify overlapping functions by service", weight: 0.10 },
      { ref: "6.3", name: "Categorize overlap type (regulatory / operational / data / procedural)", weight: 0.10 },
      { ref: "6.4", name: "Identify legal basis for each overlapping function", weight: 0.20 },
      { ref: "6.5", name: "Propose resolution option per overlap (lead agency, joint inspection, mutual recognition, data reuse)", weight: 0.15 },
      { ref: "6.6", name: "Agree lead MDA or coordination model", weight: 0.15 },
      { ref: "6.7", name: "Issue inter-agency MoUs or circulars formalizing resolutions", weight: 0.10 },
      { ref: "6.8", name: "Publish role clarity notes for users", weight: 0.10 },
    ],
  },
  {
    refNumber: 7,
    name: "Digital Service Transparency & Online Access",
    activities: [
      { ref: "7.1", name: "Responsive design across Mobile, Tablet, and Desktop", weight: 0.25 },
      { ref: "7.2", name: "Payment integration where applicable", weight: 0.15 },
      { ref: "7.3", name: "Social media integration", weight: 0.10 },
      { ref: "7.4", name: "Multilingual support where applicable", weight: 0.10 },
      { ref: "7.5", name: "SEO Optimization", weight: 0.25 },
      { ref: "7.6", name: "Clear mandate, leadership information, organogram must be publicly available on the website", weight: 0.15 },
    ],
  },
];

// Total activities count
export const TOTAL_ACTIVITIES = BEEPA_REFORMS.reduce(
  (sum, reform) => sum + reform.activities.length,
  0
);

// Total reforms count
export const TOTAL_REFORMS = BEEPA_REFORMS.length;
