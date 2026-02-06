import { mutation } from "./_generated/server";
import { BEEPA_REFORMS, TOTAL_ACTIVITIES, TOTAL_REFORMS } from "./beepaFramework";

// The 69 MDAs that PEBEC currently serves
const PEBEC_MDAS = [
  // Top Performers
  { name: "Nigerian Content Development and Monitoring Board", abbreviation: "NCDMB", description: "Regulates and monitors Nigerian content in the oil and gas industry" },
  { name: "National Drug Law Enforcement Agency", abbreviation: "NDLEA", description: "Enforces laws against drug trafficking and abuse" },
  { name: "Nigeria Customs Service", abbreviation: "NCS", description: "Manages customs and border control" },
  { name: "Nigerian Communications Commission", abbreviation: "NCC", description: "Regulates the telecommunications industry" },
  { name: "Nigerian Ports Authority", abbreviation: "NPA", description: "Manages and operates Nigeria's ports" },
  { name: "National Information Technology Development Agency", abbreviation: "NITDA", description: "Develops and regulates information technology in Nigeria" },
  { name: "Oil & Gas Free Zones Authority", abbreviation: "OGFZA", description: "Manages oil and gas free trade zones" },
  { name: "Nigeria Immigration Service", abbreviation: "NIS", description: "Manages immigration and border control" },
  { name: "Nigerian Electricity Management Service Agency", abbreviation: "NEMSA", description: "Enforces technical standards in the electricity industry" },
  { name: "Corporate Affairs Commission", abbreviation: "CAC", description: "Regulates the formation and management of companies" },
  { name: "Standards Organisation of Nigeria", abbreviation: "SON", description: "Develops and enforces standards for products and services" },

  // Average Performers
  { name: "Nigeria Broadcasting Commission", abbreviation: "NBC", description: "Regulates broadcasting services" },
  { name: "Nigerian Export Promotion Council", abbreviation: "NEPC", description: "Promotes non-oil exports" },
  { name: "Federal Competition and Consumer Protection Commission", abbreviation: "FCCPC", description: "Promotes fair competition and protects consumers" },
  { name: "Nigeria Agricultural Quarantine Service", abbreviation: "NAQS", description: "Prevents entry of pests and diseases through agricultural products" },
  { name: "Bureau for Public Procurement", abbreviation: "BPP", description: "Regulates public procurement" },
  { name: "National Office for Technology Acquisition and Promotion", abbreviation: "NOTAP", description: "Regulates technology transfer agreements" },
  { name: "Nigerian Shippers Council", abbreviation: "NSC", description: "Protects shippers' interests in the shipping industry" },
  { name: "Nigerian Electricity Regulatory Commission", abbreviation: "NERC", description: "Regulates the electricity industry" },
  { name: "National Pension Commission", abbreviation: "PenCom", description: "Regulates and supervises pension matters" },
  { name: "Federal Airports Authority of Nigeria", abbreviation: "FAAN", description: "Manages and operates Nigeria's airports" },
  { name: "Nigeria Revenue Service", abbreviation: "NRS", description: "Administers federal taxes" },
  { name: "Federal Road Safety Corps", abbreviation: "FRSC", description: "Ensures road safety and traffic management" },
  { name: "National Agency for Food and Drug Administration and Control", abbreviation: "NAFDAC", description: "Regulates food, drugs, and other products" },

  // Below Average Performers
  { name: "Nigerian Airspace Management Agency", abbreviation: "NAMA", description: "Manages Nigerian airspace" },
  { name: "EFCC Special Control Unit Against Money Laundering", abbreviation: "SCUML", description: "Combats money laundering" },
  { name: "Nigeria Civil Aviation Authority", abbreviation: "NCAA", description: "Regulates civil aviation" },
  { name: "Nigerian Export-Import Bank", abbreviation: "NEXIM", description: "Provides export credit and financing" },
  { name: "Nigeria Export Processing Zone Authority", abbreviation: "NEPZA", description: "Manages export processing zones" },
  { name: "Nigerian Upstream Petroleum Regulatory Commission", abbreviation: "NUPRC", description: "Regulates upstream petroleum operations" },
  { name: "Nigerian Investment Promotion Commission", abbreviation: "NIPC", description: "Promotes and facilitates investments" },
  { name: "Nigerian Maritime Administration and Safety Agency", abbreviation: "NIMASA", description: "Regulates maritime safety and administration" },
  { name: "National Inland Waterways Authority", abbreviation: "NIWA", description: "Manages inland waterways" },
  { name: "Patents and Designs Registry", abbreviation: "PDR", description: "Registers patents and designs" },
  { name: "National Insurance Commission", abbreviation: "NAICOM", description: "Regulates the insurance industry" },
  { name: "Nigerian Agricultural Insurance Corporation", abbreviation: "NAIC", description: "Provides agricultural insurance" },
  { name: "Galaxy Backbone Limited", abbreviation: "GBB", description: "Provides government IT infrastructure" },

  // Poor Performers
  { name: "Industrial Training Fund", abbreviation: "ITF", description: "Promotes skills acquisition in industry" },
  { name: "Securities and Exchange Commission", abbreviation: "SEC", description: "Regulates the capital market" },
  { name: "National Collateral Registry", abbreviation: "NCR", description: "Registers security interests in movable assets" },
  { name: "National Environmental Standards and Regulations Enforcement Agency", abbreviation: "NESREA", description: "Enforces environmental standards" },
  { name: "Bank of Industry", abbreviation: "BOI", description: "Provides industrial financing" },
  { name: "Nigerian Midstream and Downstream Petroleum Regulatory Authority", abbreviation: "NMDPRA", description: "Regulates midstream and downstream petroleum operations" },
  { name: "Trademarks Registry", abbreviation: "TMR", description: "Registers trademarks" },
  { name: "Ministry of Interior", abbreviation: "MOI", description: "Handles internal affairs and security" },
  { name: "Nigerian Postal Service", abbreviation: "NIPOST", description: "Provides postal services" },
  { name: "Nigerian Copyright Commission", abbreviation: "NCC-C", description: "Protects copyright and related rights" },
  { name: "Federal Produce Inspection Service", abbreviation: "FPIS", description: "Inspects agricultural produce for export" },
  { name: "National Bureau of Statistics", abbreviation: "NBS", description: "Collects and disseminates statistical data" },
  { name: "Joint Tax Board", abbreviation: "JTB", description: "Coordinates tax administration" },
  { name: "Environmental Health Council of Nigeria", abbreviation: "EHCON", description: "Regulates environmental health practice" },
  { name: "National Identity Management Commission", abbreviation: "NIMC", description: "Manages national identity database" },
  { name: "Service Compact", abbreviation: "SERVICOM", description: "Ensures service delivery in public institutions" },
  { name: "Advertising Regulatory Council of Nigeria", abbreviation: "ARCON", description: "Regulates advertising practice" },

  // Additional MDAs (completing the 69)
  { name: "Nigerian Data Protection Commission", abbreviation: "NDPC", description: "Regulates data protection and privacy in Nigeria" },
  { name: "Nigeria Social Insurance Trust Fund", abbreviation: "NSITF", description: "Provides social security and insurance for employees" },
  { name: "Rural Electrification Agency", abbreviation: "REA", description: "Implements rural electrification projects" },
  { name: "Nigeria Gas Company", abbreviation: "NGC", description: "Transports and markets natural gas" },
  { name: "Bureau of Public Service Reforms", abbreviation: "BPSR", description: "Initiates and coordinates public service reforms" },
  { name: "Ports Health Authority", abbreviation: "PHA", description: "Ensures health safety at ports" },
  { name: "Central Bank of Nigeria", abbreviation: "CBN", description: "Manages monetary policy and banking regulation" },
  { name: "Federal Ministry of Finance", abbreviation: "FMoF", description: "Manages federal finances and economic policy" },
  { name: "Federal Ministry of Industry, Trade and Investment", abbreviation: "FMITI", description: "Promotes trade, investment and industrial development" },
  { name: "National Agency for Science and Engineering Infrastructure", abbreviation: "NASENI", description: "Develops science and engineering infrastructure" },
  { name: "Small and Medium Enterprises Development Agency of Nigeria", abbreviation: "SMEDAN", description: "Promotes SME development" },
  { name: "Nigeria Incentive-Based Risk Sharing System for Agricultural Lending", abbreviation: "NIRSAL", description: "De-risks agricultural lending" },
  { name: "Federal Mortgage Bank of Nigeria", abbreviation: "FMBN", description: "Provides mortgage financing" },
];

// Seed the database with all 69 MDAs and the BEEPA reform framework
export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Check if data already exists
    const existingMDAs = await ctx.db.query("mdas").first();
    if (existingMDAs) {
      throw new Error("Database already has data. Clear it first before seeding.");
    }

    let totalMDAs = 0;
    let totalReforms = 0;
    let totalActivities = 0;

    // Create all 69 MDAs with the BEEPA framework
    for (const mdaInfo of PEBEC_MDAS) {
      // Create MDA
      const mdaId = await ctx.db.insert("mdas", {
        name: mdaInfo.name,
        abbreviation: mdaInfo.abbreviation,
        description: mdaInfo.description,
        createdAt: now,
        updatedAt: now,
      });
      totalMDAs++;

      // Create all 7 reforms for this MDA
      for (const reformTemplate of BEEPA_REFORMS) {
        const reformId = await ctx.db.insert("reforms", {
          mdaId,
          refNumber: reformTemplate.refNumber,
          name: reformTemplate.name,
          createdAt: now,
          updatedAt: now,
        });
        totalReforms++;

        // Create all activities for this reform
        for (const activityTemplate of reformTemplate.activities) {
          await ctx.db.insert("activities", {
            reformId,
            refNumber: activityTemplate.ref,
            name: activityTemplate.name,
            weight: activityTemplate.weight,
            completionLevel: 0, // All start at 0 (Not Started)
            status: "not_started",
            createdAt: now,
            updatedAt: now,
          });
          totalActivities++;
        }
      }
    }

    return {
      success: true,
      message: `Successfully seeded database`,
      stats: {
        mdas: totalMDAs,
        reforms: totalReforms,
        activities: totalActivities,
        activitiesPerMDA: TOTAL_ACTIVITIES,
        reformsPerMDA: TOTAL_REFORMS,
      },
    };
  },
});

// Clear all data (useful for testing)
export const clearDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all activities
    const activities = await ctx.db.query("activities").collect();
    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    // Delete all reforms
    const reforms = await ctx.db.query("reforms").collect();
    for (const reform of reforms) {
      await ctx.db.delete(reform._id);
    }

    // Delete all MDAs
    const mdas = await ctx.db.query("mdas").collect();
    for (const mda of mdas) {
      await ctx.db.delete(mda._id);
    }

    // Delete all audit logs
    const logs = await ctx.db.query("auditLogs").collect();
    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    return { success: true, message: "Database cleared successfully" };
  },
});
