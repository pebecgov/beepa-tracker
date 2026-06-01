import { mutation, query } from "./_generated/server";
import { BEEPA_REFORMS, FRAMEWORK_VERSION } from "./beepaFramework";

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
  { name: "National Bureau of Statistics", abbreviation: "NBS" },

  {
    name: "Citizenship and Business Department (CBD) within the Ministry of Interior",
    abbreviation: "CBD",
  },
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
  {
    name: "Nigerian Content Development and Monitoring Board",
    abbreviation: "NCDMB",
  },
  { name: "Nigerian Midstream and Downstream Petroleum Regulatory Authority", abbreviation: "NMDPRA" },
  { name: "Nigerian Upstream Petroleum Regulatory Commission", abbreviation: "NUPRC" },

  // Public Service Delivery Enablement Committee
  { name: "Service Compact", abbreviation: "SERVICOM" },

  // Intellectual Property Services Harmonisation Committee
  { name: "National Office for Technology Acquisition and Promotion", abbreviation: "NOTAP" },
  { name: "Nigerian Copyright Commission", abbreviation: "NiCC" },

  // Business Finance & Risk Optimisation Committee
  { name: "Bank of Industry", abbreviation: "BOI" },
  { name: "Central Bank of Nigeria", abbreviation: "CBN" },
  { name: "National Insurance Commission", abbreviation: "NAICOM" },
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
  { name: "Port Health (Quarantine) Services", abbreviation: "PHA" },

  // Product Standards & Safety Services Coordination Committee
  { name: "Environmental Health Council of Nigeria", abbreviation: "EHCON" },
  { name: "Federal Produce Inspection Service", abbreviation: "FPIS" },
  { name: "National Environmental Standards and Regulations Enforcement Agency", abbreviation: "NESREA" },

  // Commercial Communications & Consumer Protection Committee
  { name: "Advertising Regulatory Council of Nigeria", abbreviation: "ARCON" },
  { name: "National Broadcasting Commission", abbreviation: "NBC" },
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

    // Set framework version
    const settings = await getOrCreateSettings(ctx);
    await ctx.db.patch(settings._id, {
      frameworkVersion: FRAMEWORK_VERSION,
      updatedAt: now,
    });

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

// Migrate reform 7 activities to the updated version
// This updates reform 7 from 9 activities to 6 activities with new names/weights
export const migrateReform7 = mutation({
  args: {},
  handler: async (ctx) => {
    const reform7Template = BEEPA_REFORMS.find((r) => r.refNumber === 7);
    if (!reform7Template) {
      throw new Error("Reform 7 template not found");
    }

    // Find all reform 7 records
    const reform7s = await ctx.db
      .query("reforms")
      .filter((q) => q.eq(q.field("refNumber"), 7))
      .collect();

    let updatedCount = 0;
    let deletedCount = 0;
    let createdCount = 0;

    const now = Date.now();

    for (const reform of reform7s) {
      // Get all activities for this reform
      const activities = await ctx.db
        .query("activities")
        .withIndex("by_reform", (q) => q.eq("reformId", reform._id))
        .collect();

      // Delete old activities (7.7, 7.8, 7.9)
      const oldRefs = ["7.7", "7.8", "7.9"];
      for (const activity of activities) {
        if (oldRefs.includes(activity.refNumber)) {
          await ctx.db.delete(activity._id);
          deletedCount++;
        }
      }

      // Update or create activities 7.1-7.6
      for (const activityTemplate of reform7Template.activities) {
        const existingActivity = activities.find(
          (a) => a.refNumber === activityTemplate.ref
        );

        if (existingActivity) {
          // Update existing activity
          await ctx.db.patch(existingActivity._id, {
            name: activityTemplate.name,
            weight: activityTemplate.weight,
            updatedAt: now,
          });
          updatedCount++;
        } else {
          // Create new activity
          await ctx.db.insert("activities", {
            reformId: reform._id,
            refNumber: activityTemplate.ref,
            name: activityTemplate.name,
            weight: activityTemplate.weight,
            completionLevel: 0,
            status: "not_started",
            createdAt: now,
            updatedAt: now,
          });
          createdCount++;
        }
      }
    }

    return {
      success: true,
      message: `Migrated reform 7 for ${reform7s.length} MDAs`,
      stats: {
        reformsUpdated: reform7s.length,
        activitiesUpdated: updatedCount,
        activitiesDeleted: deletedCount,
        activitiesCreated: createdCount,
      },
    };
  },
});

// Get or create settings document
async function getOrCreateSettings(ctx: any) {
  let settings = await ctx.db.query("settings").first();
  if (!settings) {
    const now = Date.now();
    settings = await ctx.db.insert("settings", {
      accessCode: "DEFAULT_CODE", // Should be set separately
      frameworkVersion: FRAMEWORK_VERSION,
      createdAt: now,
      updatedAt: now,
    });
  }
  return settings;
}

// Smart sync: Updates database to match framework without losing user data
export const syncFramework = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let mdasCreated = 0;
    let mdasUpdated = 0;
    let reformsCreated = 0;
    let activitiesCreated = 0;
    let activitiesUpdated = 0;
    let activitiesDeleted = 0;

    // Get or create settings
    const settings = await getOrCreateSettings(ctx);
    const currentVersion = settings.frameworkVersion || "0.0.0";
    const needsUpdate = currentVersion !== FRAMEWORK_VERSION;

    // Get all existing MDAs
    const existingMDAs = await ctx.db.query("mdas").collect();
    const mdaByName = new Map(existingMDAs.map(m => [m.name, m]));
    const mdaByAbbreviation = new Map(
      existingMDAs
        .filter((m) => m.abbreviation)
        .map((m) => [m.abbreviation!, m])
    );

    // Sync MDAs
    for (const mdaInfo of PEBEC_MDAS) {
      let mda =
        mdaByAbbreviation.get(mdaInfo.abbreviation) ||
        mdaByName.get(mdaInfo.name);
      // Legacy: National Collateral Registry listing merged into plain CBN
      if (
        !mda &&
        mdaInfo.abbreviation === "CBN"
      ) {
        mda =
          mdaByAbbreviation.get("CBN-NCR") ||
          mdaByName.get("Central Bank of Nigeria – National Collateral Registry");
      }
      if (!mda && mdaInfo.abbreviation === "CBD") {
        mda =
          mdaByAbbreviation.get("CBDD") ||
          mdaByName.get(
            "Ministry of Interior - Citizenship and Business Development Department"
          ) ||
          mdaByName.get(
            "Citizenship and Business Development Department (CBDD) within the Ministry of Interior"
          );
      }
      if (!mda && mdaInfo.abbreviation === "NCDMB") {
        mda = mdaByName.get("Nigerian Content Development Management Board");
      }
      if (!mda && mdaInfo.abbreviation === "NBC") {
        mda = mdaByName.get("Nigeria Broadcasting Commission");
      }
      if (!mda) {
        const mdaId = await ctx.db.insert("mdas", {
          name: mdaInfo.name,
          abbreviation: mdaInfo.abbreviation,
          createdAt: now,
          updatedAt: now,
        });
        const newMda = await ctx.db.get(mdaId);
        if (!newMda) throw new Error("Failed to create MDA");
        mda = newMda as unknown as typeof mda;
        mdasCreated++;
      } else if (
        mda.name !== mdaInfo.name ||
        mda.abbreviation !== mdaInfo.abbreviation
      ) {
        await ctx.db.patch(mda._id, {
          name: mdaInfo.name,
          abbreviation: mdaInfo.abbreviation,
          updatedAt: now,
        });
        mda = {
          ...mda,
          name: mdaInfo.name,
          abbreviation: mdaInfo.abbreviation,
          updatedAt: now,
        };
        mdasUpdated++;
      }

      // Get existing reforms for this MDA
      const existingReforms = await ctx.db
        .query("reforms")
        .withIndex("by_mda", (q) => q.eq("mdaId", mda!._id))
        .collect();
      const reformMap = new Map(existingReforms.map(r => [r.refNumber, r]));

      // Sync reforms
      for (const reformTemplate of BEEPA_REFORMS) {
        let reform = reformMap.get(reformTemplate.refNumber);
        if (!reform) {
          const reformId = await ctx.db.insert("reforms", {
            mdaId: mda!._id,
            refNumber: reformTemplate.refNumber,
            name: reformTemplate.name,
            createdAt: now,
            updatedAt: now,
          });
          const newReform = await ctx.db.get(reformId);
          if (!newReform) throw new Error("Failed to create reform");
          reform = newReform;
          reformsCreated++;
        } else if (reform.name !== reformTemplate.name) {
          // Update reform name if changed
          await ctx.db.patch(reform._id, {
            name: reformTemplate.name,
            updatedAt: now,
          });
        }

        // Get existing activities for this reform
        const existingActivities = await ctx.db
          .query("activities")
          .withIndex("by_reform", (q) => q.eq("reformId", reform!._id))
          .collect();
        const activityMap = new Map(existingActivities.map(a => [a.refNumber, a]));

        // Track which activities should exist
        const expectedRefs = new Set(reformTemplate.activities.map(a => a.ref));

        // Update/create activities
        for (const activityTemplate of reformTemplate.activities) {
          const existing = activityMap.get(activityTemplate.ref);
          if (existing) {
            // Update name and weight if changed, but preserve completionLevel and status
            if (existing.name !== activityTemplate.name || existing.weight !== activityTemplate.weight) {
              await ctx.db.patch(existing._id, {
                name: activityTemplate.name,
                weight: activityTemplate.weight,
                updatedAt: now,
              });
              activitiesUpdated++;
            }
          } else {
            // Create missing activity
            await ctx.db.insert("activities", {
              reformId: reform._id,
              refNumber: activityTemplate.ref,
              name: activityTemplate.name,
              weight: activityTemplate.weight,
              completionLevel: 0,
              status: "not_started",
              createdAt: now,
              updatedAt: now,
            });
            activitiesCreated++;
          }
        }

        // Delete obsolete activities (not in framework anymore)
        for (const [ref, activity] of activityMap) {
          if (!expectedRefs.has(ref)) {
            await ctx.db.delete(activity._id);
            activitiesDeleted++;
          }
        }
      }
    }

    // Update framework version
    await ctx.db.patch(settings._id, {
      frameworkVersion: FRAMEWORK_VERSION,
      updatedAt: now,
    });

    return {
      success: true,
      message: `Framework synced to version ${FRAMEWORK_VERSION}`,
      stats: {
        mdasCreated,
        mdasUpdated,
        reformsCreated,
        activitiesCreated,
        activitiesUpdated,
        activitiesDeleted,
        previousVersion: currentVersion,
        newVersion: FRAMEWORK_VERSION,
      },
    };
  },
});

// Check if framework sync is needed
export const checkFrameworkSync = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();
    const currentVersion = settings?.frameworkVersion || "0.0.0";
    const needsSync = currentVersion !== FRAMEWORK_VERSION;

    return {
      currentVersion,
      frameworkVersion: FRAMEWORK_VERSION,
      needsSync,
    };
  },
});
