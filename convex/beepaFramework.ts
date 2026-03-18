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
      {
        ref: "4.1",
        name: "Identify services delivered by the MDA that require inputs or approvals from other government agencies.",
        weight: 0.15,
      },
      {
        ref: "4.2",
        name: "Document the full internal process for the identified services, including points where external approvals are required.",
        weight: 0.15,
      },
      {
        ref: "4.3",
        name: "Designate a focal officer within the MDA responsible for tracking and coordinating applications that require external approvals.",
        weight: 0.15,
      },
      {
        ref: "4.4",
        name: "Develop a simple internal workflow guide outlining the steps, responsible officers, and expected timelines for processing the service.",
        weight: 0.25,
      },
      {
        ref: "4.5",
        name: "Publish clear service timelines and requirements for the identified services on the MDA’s website or service charter.",
        weight: 0.3,
      },
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
      { ref: "6.1", name: "Map services, approvals, and inspections delivered by the MDA within the cluster.", weight: 0.1 },
      { ref: "6.2", name: "Identify areas where functions appear to overlap with those of other MDAs.", weight: 0.1 },
      { ref: "6.3", name: "Categorize the type of overlap (regulatory, operational, data, or procedural).", weight: 0.1 },
      { ref: "6.4", name: "Document the legal or regulatory basis for the MDA’s role in each identified function.", weight: 0.2 },
      { ref: "6.5", name: "Develop internal proposals for addressing overlaps (e.g., lead agency concept, joint inspection, information sharing, or data reuse).", weight: 0.15 },
      { ref: "6.6", name: "Identify the MDA’s preferred coordination approach for overlapping services.", weight: 0.15 },
      { ref: "6.7", name: "Issue an internal guidance note or protocol outlining the MDA’s roles and responsibilities for the identified services.", weight: 0.1 },
      { ref: "6.8", name: "Publish simplified service and role clarification notes for users on the MDA website or service charter.", weight: 0.1 },
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
      { ref: "7.5", name: "Search Engine Optimization - SEO", weight: 0.25 },
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

// Framework version - increment this when framework structure changes
export const FRAMEWORK_VERSION = "1.1.0";
