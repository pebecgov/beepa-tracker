import { mutation } from "./_generated/server";
import { BEEPA_REFORMS } from "./beepaFramework";

// Updated MDA list based on cluster assignments
const PEBEC_MDAS = [
  // Transport & Logistics Services Coordination Committee
  { name: "Federal Airports Authority of Nigeria", abbreviation: "FAAN" },
  { name: "Federal Road Safety Corps", abbreviation: "FRSC" },
  { name: "Nigerian Airspace Management Agency", abbreviation: "NAMA" },
  { name: "Nigerian Postal Service", abbreviation: "NIPOST" },
  { name: "Nigeria Civil Aviation Authority", abbreviation: "NCAA" },

  // Digital Infrastructure and Data Governance Facilitation Committee
  { name: "Galaxy Backbone Limited", abbreviation: "GBB" },
  { name: "National Identity Management Commission", abbreviation: "NIMC" },
  { name: "National Information Technology Development Agency", abbreviation: "NITDA" },
  { name: "Nigerian Communications Commission", abbreviation: "NCC" },
  { name: "Nigeria Data Protection Commission", abbreviation: "NDPC" },

  // Business Entry, Formalisation & Growth Facilitation Committee
  { name: "Bureau for Public Procurement", abbreviation: "BPP" },

  { name: "Ministry of Interior - Citizenship and Business Development Department", abbreviation: "CBDD" },
  { name: "Corporate Affairs Commission", abbreviation: "CAC" },
  { name: "EFCC – Special Control Unit for Money Laundering", abbreviation: "SCUML" },
  { name: "Industrial Training Fund", abbreviation: "ITF" },
  { name: "Joint Revenue Board", abbreviation: "JRB" },
  { name: "National Pension Commission", abbreviation: "PENCOM" },
  { name: "Nigeria Export Promotion Council", abbreviation: "NEPC" },
  { name: "Nigeria Revenue Service", abbreviation: "NRS" },
  { name: "Nigeria Social Insurance Trust Fund", abbreviation: "NSITF" },

  // Food and Beverages Optimisation Committee
  { name: "Federal Competition and Consumer Protection Commission", abbreviation: "FCCPC" },
  { name: "National Agency for Food and Drug Administration and Control", abbreviation: "NAFDAC" },
  { name: "Standards Organisation of Nigeria", abbreviation: "SON" },

  // Electricity Access, Regulation & Safety Optimisation Committee
  { name: "Rural Electrification Agency", abbreviation: "REA" },
  { name: "Nigerian Electricity Management Service Agency", abbreviation: "NEMSA" },
  { name: "Nigerian Electricity Regulatory Commission", abbreviation: "NERC" },

  // Petroleum Industry Services Coordination Committee
  { name: "Nigerian Content Development Management Board", abbreviation: "NCDMB" },
  { name: "Nigerian Midstream and Downstream Petroleum Regulatory Authority", abbreviation: "NMDPRA" },
  { name: "Nigerian Upstream Petroleum Regulatory Commission", abbreviation: "NUPRC" },

  // Public Service Delivery Enablement Committee
  { name: "Bureau of Public Service Reforms", abbreviation: "BPSR" },
  { name: "Service Compact", abbreviation: "SERVICOM" },

  // Intellectual Property Services Harmonisation Committee
  { name: "FMITI - Trademarks Registry", abbreviation: "CLTR" },
  { name: "National Office for Technology Acquisition and Promotion", abbreviation: "NOTAP" },
  { name: "Nigerian Copyright Commission", abbreviation: "NiCC" },
  { name: "FMITI - Patent and Design Registry", abbreviation: "PDR" },

  // Business Finance & Risk Optimisation Committee
  { name: "Bank of Industry", abbreviation: "BOI" },
  { name: "Central Bank of Nigeria – National Collateral Registry", abbreviation: "CBN-NCR" },
  { name: "National Insurance Commission", abbreviation: "NAICOM" },
  { name: "Nigerian Agricultural Insurance Corporation", abbreviation: "NAIC" },
  { name: "Nigerian Export-Import Bank", abbreviation: "NEXIM" },
  { name: "Securities and Exchange Commission", abbreviation: "SEC" },

  // Investment Entry, Incentives & Free Zones Facilitation Committee
  { name: "Nigerian Investment Promotion Commission", abbreviation: "NIPC" },
  { name: "Oil & Gas Free Zone Authority", abbreviation: "OGFZA" },
  { name: "Nigeria Export Processing Zone Authority", abbreviation: "NEPZA" },

  // Ports and Customs Efficiency Committee
  { name: "National Drug Law Enforcement Agency", abbreviation: "NDLEA" },
  { name: "National Inland Waterways Authority", abbreviation: "NIWA" },
  { name: "Nigeria Agricultural Quarantine Service", abbreviation: "NAQS" },
  { name: "Nigeria Customs Service", abbreviation: "NCS" },
  { name: "Nigeria Immigration Service", abbreviation: "NIS" },
  { name: "Nigerian Maritime Administration and Safety Agency", abbreviation: "NIMASA" },
  { name: "Nigerian Ports Authority", abbreviation: "NPA" },
  { name: "Nigerian Shippers Council", abbreviation: "NSC" },
  { name: "Ports Health Authority", abbreviation: "PHA" },

  // Product Standards & Safety Services Coordination Committee
  { name: "Environmental Health Council of Nigeria", abbreviation: "EHCON" },
  { name: "Federal Produce Inspection Service", abbreviation: "FPIS" },
  { name: "National Environmental Standards and Regulations Enforcement Agency", abbreviation: "NESREA" },

  // Commercial Communications & Consumer Protection Committee
  { name: "Advertising Regulatory Council of Nigeria", abbreviation: "ARCON" },
  { name: "Nigeria Broadcasting Commission", abbreviation: "NBC" },
];

// Total counts for reference
export const TOTAL_MDAS = PEBEC_MDAS.length; // 60 MDAs
export const TOTAL_REFORMS = BEEPA_REFORMS.length; // 7 reforms per MDA
export const TOTAL_ACTIVITIES = BEEPA_REFORMS.reduce((sum, r) => sum + r.activities.length, 0); // 52 activities per MDA

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if database already has data
    const existingMDAs = await ctx.db.query("mdas").first();
    if (existingMDAs) {
      throw new Error("Database already has data. Clear it first to reseed.");
    }

    const now = Date.now();
    let mdaCount = 0;
    let reformCount = 0;
    let activityCount = 0;

    // Create all MDAs with their reforms and activities
    for (const mdaInfo of PEBEC_MDAS) {
      // Create MDA
      const mdaId = await ctx.db.insert("mdas", {
        name: mdaInfo.name,
        abbreviation: mdaInfo.abbreviation,
        createdAt: now,
        updatedAt: now,
      });
      mdaCount++;

      // Create reforms for this MDA
      for (const reformTemplate of BEEPA_REFORMS) {
        const reformId = await ctx.db.insert("reforms", {
          mdaId,
          refNumber: reformTemplate.refNumber,
          name: reformTemplate.name,
          createdAt: now,
          updatedAt: now,
        });
        reformCount++;

        // Create activities for this reform
        for (const activityTemplate of reformTemplate.activities) {
          await ctx.db.insert("activities", {
            reformId,
            refNumber: activityTemplate.ref,
            name: activityTemplate.name,
            weight: activityTemplate.weight,
            completionLevel: 0,
            status: "not_started",
            createdAt: now,
            updatedAt: now,
          });
          activityCount++;
        }
      }
    }

    return {
      success: true,
      message: `Successfully seeded database with ${mdaCount} MDAs`,
      stats: {
        mdas: mdaCount,
        reforms: reformCount,
        activities: activityCount,
      },
    };
  },
});

// Clear one small batch from ONE table only per call
// This keeps reads well under the 4096 limit
export const clearDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    const BATCH_SIZE = 50; // Small batch to stay under read limits
    let deletedCount = 0;

    // Only process ONE table per call to minimize reads
    // Delete in order: activities -> reforms -> mdas -> auditLogs

    // Check activities first
    const activities = await ctx.db.query("activities").take(BATCH_SIZE);
    if (activities.length > 0) {
      for (const activity of activities) {
        await ctx.db.delete(activity._id);
        deletedCount++;
      }
      return {
        success: true,
        done: false,
        deleted: deletedCount,
        table: "activities",
      };
    }

    // Then reforms
    const reforms = await ctx.db.query("reforms").take(BATCH_SIZE);
    if (reforms.length > 0) {
      for (const reform of reforms) {
        await ctx.db.delete(reform._id);
        deletedCount++;
      }
      return {
        success: true,
        done: false,
        deleted: deletedCount,
        table: "reforms",
      };
    }

    // Then MDAs
    const mdas = await ctx.db.query("mdas").take(BATCH_SIZE);
    if (mdas.length > 0) {
      for (const mda of mdas) {
        await ctx.db.delete(mda._id);
        deletedCount++;
      }
      return {
        success: true,
        done: false,
        deleted: deletedCount,
        table: "mdas",
      };
    }

    // Finally audit logs
    const auditLogs = await ctx.db.query("auditLogs").take(BATCH_SIZE);
    if (auditLogs.length > 0) {
      for (const log of auditLogs) {
        await ctx.db.delete(log._id);
        deletedCount++;
      }
      return {
        success: true,
        done: false,
        deleted: deletedCount,
        table: "auditLogs",
      };
    }

    // All tables empty
    return {
      success: true,
      done: true,
      deleted: 0,
      table: null,
    };
  },
});
