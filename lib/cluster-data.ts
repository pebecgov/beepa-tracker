export interface ClusterMember {
    name: string;
    representative?: string;
}

export interface Cluster {
    id: string;
    name: string;
    meetingTime: string;
    lead: string;
    members: ClusterMember[];
}

export const CLUSTERS: Cluster[] = [
    {
        id: "transport-logistics",
        name: "Transport & Logistics Services Coordination Committee",
        meetingTime: "Monday 2/2/26 – 2:00pm",
        lead: "Oluwaseun Winsala",
        members: [
            { name: "Federal Airports Authority of Nigeria (FAAN)" },
            { name: "Federal Road Safety Corps (FRSC)" },
            { name: "Nigerian Airspace Management Agency (NAMA)" },
            { name: "Nigerian Postal Service (NIPOST)" },
            { name: "Nigeria Civil Aviation Authority (NCAA)" },
        ],
    },
    {
        id: "digital-infrastructure",
        name: "Digital Infrastructure and Data Governance Facilitation Committee",
        meetingTime: "Thursday 29/01/26 – 2:00pm",
        lead: "Oluwaseun Winsala",
        members: [
            { name: "Galaxy Backbone Limited (GBB)" },
            { name: "National Identity Management Commission (NIMC)" },
            { name: "National Information Technology Development Agency (NITDA)" },
            { name: "Nigerian Communications Commission (NCC)" },
            { name: "Nigerian Data Protection Commission" },
        ],
    },
    {
        id: "business-entry",
        name: "Business Entry, Formalisation & Growth Facilitation Committee",
        meetingTime: "Thursday 29/01/26 – 10:00am",
        lead: "Hussaina Abdulkadir",
        members: [
            { name: "Bureau for Public Procurement (BPP)" },
            { name: "Citizenship and Business Development Department (Ministry of Interior)" },
            { name: "Corporate Affairs Commission (CAC)" },
            { name: "EFCC – Special Control Unit for Money Laundering (SCUML)" },
            { name: "Industrial Training Fund (ITF)" },
            { name: "Joint Tax Board (JTB)" },
            { name: "National Identity Management Commission (NIMC)" },
            { name: "National Pension Commission (PENCOM)" },
            { name: "Nigeria Export Promotion Council (NEPC)" },
            { name: "Nigeria Revenue Service (NRS)" },
            { name: "Nigeria Social Insurance Trust Fund (NSITF)" },
        ],
    },
    {
        id: "food-beverages",
        name: "Food and Beverages Optimisation Committee",
        meetingTime: "",
        lead: "Hussaina Abdulkadir",
        members: [
            { name: "Federal Competition and Consumer Protection Commission (FCCPC)" },
            { name: "National Agency for Food and Drug Administration and Control (NAFDAC)" },
            { name: "Standards Organisation of Nigeria (SON)" },
        ],
    },
    {
        id: "electricity-access",
        name: "Electricity Access, Regulation & Safety Optimisation Committee",
        meetingTime: "Monday 2/2/26 – 12:45pm",
        lead: "Adewale Bello",
        members: [
            { name: "Rural Electrification Agency (REA)" },
            { name: "Nigerian Electricity Management Service Agency (NEMSA)" },
            { name: "Nigerian Electricity Regulatory Commission (NERC)" },
        ],
    },
    {
        id: "petroleum-industry",
        name: "Petroleum Industry Services Coordination Committee",
        meetingTime: "Friday 30/01/26 – 1:00pm",
        lead: "Adewale Bello",
        members: [
            { name: "Nigerian Content Development and Monitoring Board (NCDMB)" },
            { name: "Nigeria Gas Company (NGC)" },
            { name: "Nigerian Midstream and Downstream Petroleum Regulatory Authority (NMDPRA)" },
            { name: "Nigerian Upstream Petroleum Regulatory Commission (NUPRC)" },
            { name: "NNPC Ltd" },
        ],
    },
    {
        id: "public-service",
        name: "Public Service Delivery Enablement Committee",
        meetingTime: "Monday 2/2/26 – 11:00am",
        lead: "Jaafar Shuaibu",
        members: [
            { name: "Bureau for Public Procurement (BPP)" },
            { name: "Bureau of Public Service Reforms (BPSR)" },
            { name: "Service Compact (SERVICOM)" },
        ],
    },
    {
        id: "intellectual-property",
        name: "Intellectual Property Services Harmonisation Committee",
        meetingTime: "Thursday 29/01/26 – 3:00pm",
        lead: "Jaafar Shuaibu",
        members: [
            { name: "Trademarks Registry (TMR)" },
            { name: "National Office for Technology Acquisition and Promotion" },
            { name: "Nigerian Copyright Commission" },
            { name: "Patents and Designs Registry (PDR)" },
        ],
    },
    {
        id: "business-finance",
        name: "Business Finance & Risk Optimisation Committee",
        meetingTime: "Friday 30/01/26 – 10:00am",
        lead: "Aimeya Okphebholo",
        members: [
            { name: "Bank of Industry (BOI)" },
            { name: "Central Bank of Nigeria – National Collateral Agency (CBN – NCR)" },
            { name: "National Insurance Commission (NAICOM)" },
            { name: "Nigerian Agricultural Insurance Corporation (NAIC)" },
            { name: "Nigerian Export-Import Bank (NEXIM)" },
            { name: "Securities and Exchange Commission (SEC)" },
        ],
    },
    {
        id: "investment-entry",
        name: "Investment Entry, Incentives & Free Zones Facilitation Committee",
        meetingTime: "Monday 2/2/26 – 10:00am",
        lead: "Aimeya Okphebholo",
        members: [
            { name: "Nigerian Investment Promotion Commission (NIPC)" },
            { name: "Oil & Gas Free Zones Authority (OGFZA)" },
            { name: "Nigeria Export Processing Zone Authority (NEPZA)" },
        ],
    },
    {
        id: "ports-customs",
        name: "Ports and Customs Efficiency Committee",
        meetingTime: "Thursday 29/01/26 11:00am",
        lead: "Jude Okala",
        members: [
            { name: "National Drug Law Enforcement Agency (NDLEA)" },
            { name: "National Inland Waterways Authority (NIWA)" },
            { name: "Nigeria Agricultural Quarantine Service (NAQS)" },
            { name: "Nigeria Customs Service (NCS)" },
            { name: "Nigeria Export Processing Zone Authority (NEPZA)" },
            { name: "Nigeria Immigration Service (NIS)" },
            { name: "Nigerian Maritime Administration and Safety Agency (NIMASA)" },
            { name: "Nigerian Ports Authority (NPA)" },
            { name: "Nigerian Shippers’ Council (NSC)" },
            { name: "Ports Health Authority" },
        ],
    },
    {
        id: "product-standards",
        name: "Product Standards & Safety Services Coordination Committee",
        meetingTime: "Friday 30/01/26 – 12:00pm",
        lead: "Charles Wakji",
        members: [
            { name: "Environmental Health Council of Nigeria (EHCON)" },
            { name: "Federal Produce Inspection Service (FPIS)" },
            { name: "National Environmental Standards and Regulations Enforcement Agency (NESREA)" },
            { name: "National Agency for Food and Drug Administration and Control (NAFDAC)" },
            { name: "Nigeria Agricultural Quarantine Service (NAQS)" },
            { name: "Standards Organisation of Nigeria (SON)" },
        ],
    },
    {
        id: "commercial-communications",
        name: "Commercial Communications & Consumer Protection Committee",
        meetingTime: "Thursday 29/01/26 – 1:00pm",
        lead: "Olufemi Obafemi",
        members: [
            { name: "Advertising Regulatory Council of Nigeria (ARCON)" },
            { name: "Federal Competition and Consumer Protection Commission (FCCPC)" },
            { name: "Nigeria Broadcasting Commission (NBC)" },
        ],
    },
];
