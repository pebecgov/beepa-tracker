import { query } from "./_generated/server";
import { v } from "convex/values";
import {
  reformCountsTowardMdaScore,
  activityCountsTowardMdaScore,
  getScorecardTierForMda,
} from "../lib/beepa-scoring";
import { CLUSTERS } from "../lib/cluster-data";

// Status thresholds and labels (based on PEBEC standards)
// Requires Intervention: 0-30%, Progressing With Difficulty: 31-49%, Progressing: 50-70%, Progressing Well: 71-89%, Successful: 90-100%
const STATUS_THRESHOLDS = [
  { max: 0.30, label: "Requires Intervention", color: "red" },
  { max: 0.49, label: "Progressing With Difficulty", color: "orange" },
  { max: 0.70, label: "In Progress", color: "yellow" },
  { max: 0.89, label: "Progressing Well", color: "blue" },
  { max: 1.01, label: "Successful", color: "green" },
] as const;

// Get status from score
function getStatus(score: number): { label: string; color: string } {
  for (const threshold of STATUS_THRESHOLDS) {
    if (score <= threshold.max) {
      return { label: threshold.label, color: threshold.color };
    }
  }
  return STATUS_THRESHOLDS[STATUS_THRESHOLDS.length - 1];
}

// Get reform performance (weighted score from activities)
export const getReformPerformance = query({
  args: { reformId: v.id("reforms") },
  handler: async (ctx, args) => {
    const reform = await ctx.db.get(args.reformId);
    if (!reform) throw new Error("Reform not found");

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_reform", (q) => q.eq("reformId", args.reformId))
      .collect();

    if (activities.length === 0) {
      return {
        reform,
        score: 0,
        status: getStatus(0),
        activityCount: 0,
        completedCount: 0,
        activities: [],
      };
    }

    // Calculate weighted score
    let weightedScore = 0;
    let completedCount = 0;

    for (const activity of activities) {
      weightedScore += activity.completionLevel * activity.weight;
      if (activity.status === "complete") {
        completedCount++;
      }
    }

    let status = getStatus(weightedScore);
    if (status.label === "Requires Intervention" && completedCount > 0) {
      status = { label: "In Progress", color: "yellow" };
    }

    return {
      reform,
      score: weightedScore,
      status,
      activityCount: activities.length,
      completedCount,
      activities,
    };
  },
});

// Get admin report card for one MDA
export const getMDAReportCard = query({
  args: { mdaId: v.id("mdas") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") return null;

    const mda = await ctx.db.get(args.mdaId);
    if (!mda) throw new Error("MDA not found");

    const reforms = await ctx.db
      .query("reforms")
      .withIndex("by_mda", (q) => q.eq("mdaId", args.mdaId))
      .collect();

    const reformRows = await Promise.all(
      reforms.map(async (reform) => {
        const activities = await ctx.db
          .query("activities")
          .withIndex("by_reform", (q) => q.eq("reformId", reform._id))
          .collect();

        const sortedActivities = [...activities].sort((a, b) => {
          const aNum = parseFloat(a.refNumber.split(".")[1] || "0");
          const bNum = parseFloat(b.refNumber.split(".")[1] || "0");
          return aNum - bNum;
        });

        const countsTowardOverall = reformCountsTowardMdaScore(mda, reform.refNumber);
        const applicableActivities = sortedActivities.filter((activity) =>
          activityCountsTowardMdaScore(mda, reform.refNumber, activity.refNumber)
        );

        const totalApplicableWeight = applicableActivities.reduce(
          (sum, activity) => sum + activity.weight,
          0
        );
        const weightedScore = applicableActivities.reduce(
          (sum, activity) => sum + activity.completionLevel * activity.weight,
          0
        );
        const score = totalApplicableWeight > 0 ? weightedScore / totalApplicableWeight : 0;
        const completedCount = applicableActivities.filter(
          (activity) => activity.status === "complete"
        ).length;
        const inProgressCount = applicableActivities.filter(
          (activity) => activity.status === "in_progress"
        ).length;
        const notStartedCount = applicableActivities.filter(
          (activity) => activity.status === "not_started"
        ).length;
        const excludedActivities = sortedActivities.filter(
          (activity) =>
            !activityCountsTowardMdaScore(mda, reform.refNumber, activity.refNumber)
        );

        return {
          reform,
          score,
          status: getStatus(score),
          countsTowardOverall,
          activityCount: sortedActivities.length,
          applicableActivityCount: applicableActivities.length,
          completedCount,
          inProgressCount,
          notStartedCount,
          excludedActivityCount: excludedActivities.length,
          activities: sortedActivities.map((activity) => ({
            _id: activity._id,
            refNumber: activity.refNumber,
            name: activity.name,
            weight: activity.weight,
            completionLevel: activity.completionLevel,
            status: activity.status,
            countsTowardScore: activityCountsTowardMdaScore(
              mda,
              reform.refNumber,
              activity.refNumber
            ),
            updatedAt: activity.updatedAt,
          })),
        };
      })
    );

    reformRows.sort((a, b) => a.reform.refNumber - b.reform.refNumber);

    const scoringReforms = reformRows.filter((row) => row.countsTowardOverall);
    const score =
      scoringReforms.length === 0
        ? 0
        : scoringReforms.reduce((sum, row) => sum + row.score, 0) /
          scoringReforms.length;

    const totalApplicableActivities = scoringReforms.reduce(
      (sum, row) => sum + row.applicableActivityCount,
      0
    );
    const completedActivities = scoringReforms.reduce(
      (sum, row) => sum + row.completedCount,
      0
    );
    const inProgressActivities = scoringReforms.reduce(
      (sum, row) => sum + row.inProgressCount,
      0
    );
    const notStartedActivities = scoringReforms.reduce(
      (sum, row) => sum + row.notStartedCount,
      0
    );
    const excludedReformCount = reformRows.filter((row) => !row.countsTowardOverall).length;
    const excludedActivityCount = reformRows.reduce(
      (sum, row) => sum + row.excludedActivityCount,
      0
    );
    const weakestReforms = scoringReforms
      .filter((row) => row.score < 0.75)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((row) => ({
        refNumber: row.reform.refNumber,
        name: row.reform.name,
        score: row.score,
      }));

    return {
      mda,
      score,
      status: getStatus(score),
      tier: getScorecardTierForMda(mda, score),
      generatedAt: Date.now(),
      summary: {
        reformCount: reformRows.length,
        scoringReformCount: scoringReforms.length,
        excludedReformCount,
        totalApplicableActivities,
        completedActivities,
        inProgressActivities,
        notStartedActivities,
        excludedActivityCount,
        completionRate:
          totalApplicableActivities === 0
            ? 0
            : completedActivities / totalApplicableActivities,
      },
      reformRows,
      weakestReforms,
    };
  },
});

// Get admin-only general BEEPA report
export const getGeneralReport = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") return null;

    const [mdas, reforms, activities] = await Promise.all([
      ctx.db.query("mdas").collect(),
      ctx.db.query("reforms").collect(),
      ctx.db.query("activities").collect(),
    ]);

    const reformsByMda = new Map<string, typeof reforms>();
    for (const reform of reforms) {
      const existing = reformsByMda.get(reform.mdaId) || [];
      existing.push(reform);
      reformsByMda.set(reform.mdaId, existing);
    }

    const activitiesByReform = new Map<string, typeof activities>();
    for (const activity of activities) {
      const existing = activitiesByReform.get(activity.reformId) || [];
      existing.push(activity);
      activitiesByReform.set(activity.reformId, existing);
    }

    const getReformScore = (
      mda: (typeof mdas)[number],
      reform: (typeof reforms)[number]
    ) => {
      const reformActivities = activitiesByReform.get(reform._id) || [];
      const applicableActivities = reformActivities.filter((activity) =>
        activityCountsTowardMdaScore(mda, reform.refNumber, activity.refNumber)
      );
      const totalApplicableWeight = applicableActivities.reduce(
        (sum, activity) => sum + activity.weight,
        0
      );
      const weightedScore = applicableActivities.reduce(
        (sum, activity) => sum + activity.completionLevel * activity.weight,
        0
      );

      return {
        score: totalApplicableWeight > 0 ? weightedScore / totalApplicableWeight : 0,
        activityCount: applicableActivities.length,
        completedCount: applicableActivities.filter((activity) => activity.status === "complete").length,
        inProgressCount: applicableActivities.filter((activity) => activity.status === "in_progress").length,
        notStartedCount: applicableActivities.filter((activity) => activity.status === "not_started").length,
      };
    };

    const mdaPerformances = mdas.map((mda) => {
      const mdaReforms = (reformsByMda.get(mda._id) || []).sort(
        (a, b) => a.refNumber - b.refNumber
      );
      const reformRows = mdaReforms.map((reform) => {
        const scoreData = getReformScore(mda, reform);
        return {
          refNumber: reform.refNumber,
          name: reform.name,
          countsTowardOverall: reformCountsTowardMdaScore(mda, reform.refNumber),
          ...scoreData,
        };
      });

      // Matches dashboard ranking tie-break (getRankedMDAs): max updatedAt among scoring activities
      let lastApplicableActivityUpdate = 0;
      for (const reform of mdaReforms) {
        if (!reformCountsTowardMdaScore(mda, reform.refNumber)) continue;
        const reformActivities = activitiesByReform.get(reform._id) || [];
        for (const activity of reformActivities) {
          if (!activityCountsTowardMdaScore(mda, reform.refNumber, activity.refNumber)) continue;
          if (activity.updatedAt > lastApplicableActivityUpdate) {
            lastApplicableActivityUpdate = activity.updatedAt;
          }
        }
      }

      const scoringReforms = reformRows.filter((row) => row.countsTowardOverall);
      const score =
        scoringReforms.length === 0
          ? 0
          : scoringReforms.reduce((sum, row) => sum + row.score, 0) /
            scoringReforms.length;
      const activityCount = scoringReforms.reduce((sum, row) => sum + row.activityCount, 0);
      const completedCount = scoringReforms.reduce((sum, row) => sum + row.completedCount, 0);

      return {
        mda: {
          _id: mda._id,
          name: mda.name,
          abbreviation: mda.abbreviation ?? null,
        },
        score,
        status: getStatus(score),
        tier: getScorecardTierForMda(mda, score),
        reformCount: mdaReforms.length,
        scoringReformCount: scoringReforms.length,
        activityCount,
        completedCount,
        completionRate: activityCount === 0 ? 0 : completedCount / activityCount,
        reformRows,
        lastApplicableActivityUpdate,
      };
    });

    const rankedMDAs = [...mdaPerformances].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ta = a.lastApplicableActivityUpdate ?? 0;
      const tb = b.lastApplicableActivityUpdate ?? 0;
      if (ta !== tb) return ta - tb;
      return a.mda.name.localeCompare(b.mda.name);
    });

    const reformMap = new Map<
      number,
      {
        refNumber: number;
        name: string;
        applicableMdaCount: number;
        completedMdaCount: number;
        startedMdaCount: number;
        totalScore: number;
        mdasNotDone: Array<{
          name: string;
          abbreviation: string | null;
          score: number;
          status: string;
        }>;
      }
    >();

    for (const performance of mdaPerformances) {
      for (const reform of performance.reformRows) {
        if (!reform.countsTowardOverall) continue;

        const existing =
          reformMap.get(reform.refNumber) ||
          {
            refNumber: reform.refNumber,
            name: reform.name,
            applicableMdaCount: 0,
            completedMdaCount: 0,
            startedMdaCount: 0,
            totalScore: 0,
            mdasNotDone: [],
          };

        existing.applicableMdaCount++;
        existing.totalScore += reform.score;
        if (reform.score >= 0.999) existing.completedMdaCount++;
        if (reform.score > 0) existing.startedMdaCount++;
        if (reform.score < 0.999) {
          existing.mdasNotDone.push({
            name: performance.mda.name,
            abbreviation: performance.mda.abbreviation,
            score: reform.score,
            status: reform.score === 0 ? "Not Started" : "In Progress",
          });
        }

        reformMap.set(reform.refNumber, existing);
      }
    }

    const reformAnalysis = [...reformMap.values()]
      .map((reform) => ({
        ...reform,
        completionRate:
          reform.applicableMdaCount === 0
            ? 0
            : reform.completedMdaCount / reform.applicableMdaCount,
        startedRate:
          reform.applicableMdaCount === 0
            ? 0
            : reform.startedMdaCount / reform.applicableMdaCount,
        averageScore:
          reform.applicableMdaCount === 0
            ? 0
            : reform.totalScore / reform.applicableMdaCount,
        mdasNotDone: reform.mdasNotDone.sort((a, b) => a.score - b.score),
      }))
      .sort((a, b) => a.refNumber - b.refNumber);

    const reformsDoneFirst = [...reformAnalysis]
      .sort((a, b) => {
        if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
        return b.averageScore - a.averageScore;
      })
      .slice(0, 5);

    const leastCompletedReforms = [...reformAnalysis]
      .sort((a, b) => {
        if (a.completionRate !== b.completionRate) return a.completionRate - b.completionRate;
        return a.averageScore - b.averageScore;
      })
      .slice(0, 5);

    const statusOrder = [
      "Successful",
      "Progressing Well",
      "In Progress",
      "Progressing With Difficulty",
      "Requires Intervention",
    ];
    const mdasByStatus = statusOrder.map((label) => ({
      label,
      mdas: rankedMDAs.filter((performance) => performance.status.label === label),
    }));

    const tierOrder = ["Super MDA", "Excellent", "Moderate", "Lower Tier"];
    const mdasByTier = tierOrder.map((label) => ({
      label,
      mdas: rankedMDAs.filter((performance) => performance.tier.label === label),
    }));

    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
    const getClusterMemberPerformance = (clusterMdaName: string) => {
      const bracketMatch = clusterMdaName.match(/\(([^)]+)\)\s*$/);
      const clusterAbbreviation = bracketMatch ? normalize(bracketMatch[1]) : null;
      const clusterBaseName = normalize(clusterMdaName.replace(/\s*\([^)]+\)\s*$/, ""));

      return mdaPerformances.find((performance) => {
        const mdaName = normalize(performance.mda.name);
        const mdaAbbreviation = performance.mda.abbreviation
          ? normalize(performance.mda.abbreviation)
          : null;

        return (
          mdaName === clusterBaseName ||
          (clusterAbbreviation !== null && clusterAbbreviation === mdaAbbreviation) ||
          mdaName === normalize(clusterMdaName)
        );
      });
    };

    const clusterPerformance = CLUSTERS.map((cluster) => {
      const members = cluster.members.map((member) => ({
        name: member.name,
        performance: getClusterMemberPerformance(member.name) || null,
      }));
      const membersWithData = members.filter((member) => member.performance !== null);
      const score =
        membersWithData.length === 0
          ? 0
          : membersWithData.reduce((sum, member) => sum + member.performance!.score, 0) /
            membersWithData.length;

      return {
        id: cluster.id,
        name: cluster.name,
        lead: cluster.lead,
        score,
        status: getStatus(score),
        mdaCount: cluster.members.length,
        matchedMdaCount: membersWithData.length,
        members,
      };
    }).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });

    const overallScore =
      mdaPerformances.length === 0
        ? 0
        : mdaPerformances.reduce((sum, performance) => sum + performance.score, 0) /
          mdaPerformances.length;

    return {
      generatedAt: Date.now(),
      summary: {
        totalMDAs: mdaPerformances.length,
        totalReforms: reforms.length,
        totalActivities: activities.length,
        overallScore,
        overallStatus: getStatus(overallScore),
        topMDA: rankedMDAs[0] ?? null,
        lowestCluster: clusterPerformance[clusterPerformance.length - 1] ?? null,
      },
      top10MDAs: rankedMDAs.slice(0, 10).map((performance, index) => ({
        ...performance,
        rank: index + 1,
      })),
      reformsDoneFirst,
      leastCompletedReforms,
      mdasByStatus,
      mdasByTier,
      clusterPerformance,
    };
  },
});

// Get MDA performance (average of all reform weighted scores)
export const getMDAPerformance = query({
  args: { mdaId: v.id("mdas") },
  handler: async (ctx, args) => {
    const mda = await ctx.db.get(args.mdaId);
    if (!mda) throw new Error("MDA not found");

    const reforms = await ctx.db
      .query("reforms")
      .withIndex("by_mda", (q) => q.eq("mdaId", args.mdaId))
      .collect();

    if (reforms.length === 0) {
      return {
        mda,
        score: 0,
        status: getStatus(0),
        reformCount: 0,
        reforms: [],
      };
    }

    // Calculate score for each reform (weighted by activities)
    const reformPerformances = await Promise.all(
      reforms.map(async (reform) => {
        const activities = await ctx.db
          .query("activities")
          .withIndex("by_reform", (q) => q.eq("reformId", reform._id))
          .collect();

        if (activities.length === 0) {
          return {
            reform,
            score: 0,
            status: getStatus(0),
            activityCount: 0,
            exemptActivityCount: 0,
            completedCount: 0,
          };
        }

        // Calculate weighted score for this reform (excluding activities not applicable to this MDA)
        let weightedScore = 0;
        let totalApplicableWeight = 0;
        let completedCount = 0;
        let applicableActivityCount = 0;

        for (const activity of activities) {
          if (!activityCountsTowardMdaScore(mda, reform.refNumber, activity.refNumber)) continue;
          applicableActivityCount++;
          weightedScore += activity.completionLevel * activity.weight;
          totalApplicableWeight += activity.weight;
          if (activity.status === "complete") {
            completedCount++;
          }
        }

        const normalizedScore = totalApplicableWeight > 0 ? weightedScore / totalApplicableWeight : 0;
        let status = getStatus(normalizedScore);
        if (status.label === "Requires Intervention" && completedCount > 0) {
          status = { label: "In Progress", color: "yellow" };
        }

        const exemptActivityCount = activities.length - applicableActivityCount;

        return {
          reform,
          score: normalizedScore,
          status,
          activityCount: applicableActivityCount,
          exemptActivityCount,
          completedCount,
        };
      })
    );

    // Sort reforms by refNumber
    reformPerformances.sort((a, b) => a.reform.refNumber - b.reform.refNumber);

    const scoringReforms = reformPerformances.filter((r) =>
      reformCountsTowardMdaScore(mda, r.reform.refNumber)
    );

    // MDA score is average of reform scores that count for this MDA (e.g. NCC: 4 & 6; GBB: 4, 5 & 6)
    const mdaScore =
      scoringReforms.length === 0
        ? 0
        : scoringReforms.reduce((sum, r) => sum + r.score, 0) / scoringReforms.length;

    let status = getStatus(mdaScore);
    const hasInProgressReform = scoringReforms.some(
      (r) => r.status.label !== "Requires Intervention"
    );
    if (status.label === "Requires Intervention" && hasInProgressReform) {
      status = { label: "In Progress", color: "yellow" };
    }

    return {
      mda,
      score: mdaScore,
      status,
      reformCount: reforms.length,
      scoringReformCount: scoringReforms.length,
      reforms: reformPerformances,
    };
  },
});

// Get overall performance for all MDAs
export const getOverallPerformance = query({
  args: {},
  handler: async (ctx) => {
    const mdas = await ctx.db.query("mdas").collect();

    const performances = await Promise.all(
      mdas.map(async (mda) => {
        const reforms = await ctx.db
          .query("reforms")
          .withIndex("by_mda", (q) => q.eq("mdaId", mda._id))
          .collect();

        if (reforms.length === 0) {
          return {
            mda,
            score: 0,
            status: getStatus(0),
            reformCount: 0,
          };
        }

        const reformsForScore = reforms.filter((r) =>
          reformCountsTowardMdaScore(mda, r.refNumber)
        );

        if (reformsForScore.length === 0) {
          return {
            mda,
            score: 0,
            status: getStatus(0),
            reformCount: reforms.length,
          };
        }

        // Calculate weighted score and status for each reform that counts toward MDA score
        const reformPerformances = await Promise.all(
          reformsForScore.map(async (reform) => {
            const activities = await ctx.db
              .query("activities")
              .withIndex("by_reform", (q) => q.eq("reformId", reform._id))
              .collect();

            if (activities.length === 0) return { score: 0, status: getStatus(0) };

            let weightedScore = 0;
            let totalApplicableWeight = 0;
            let completedCount = 0;
            for (const activity of activities) {
              if (!activityCountsTowardMdaScore(mda, reform.refNumber, activity.refNumber)) continue;
              weightedScore += activity.completionLevel * activity.weight;
              totalApplicableWeight += activity.weight;
              if (activity.status === "complete") completedCount++;
            }

            const normalizedScore = totalApplicableWeight > 0 ? weightedScore / totalApplicableWeight : 0;
            let status = getStatus(normalizedScore);
            if (status.label === "Requires Intervention" && completedCount > 0) {
              status = { label: "In Progress", color: "yellow" };
            }

            return { score: normalizedScore, status };
          })
        );

        const mdaScore = reformPerformances.reduce((sum, p) => sum + p.score, 0) / reformPerformances.length;
        let status = getStatus(mdaScore);
        const hasInProgressReform = reformPerformances.some(
          (p) => p.status.label !== "Requires Intervention"
        );
        if (status.label === "Requires Intervention" && hasInProgressReform) {
          status = { label: "In Progress", color: "yellow" };
        }

        return {
          mda,
          score: mdaScore,
          status,
          reformCount: reforms.length,
        };
      })
    );

    return performances;
  },
});

// Get ranked MDAs
export const getRankedMDAs = query({
  args: {},
  handler: async (ctx) => {
    const mdas = await ctx.db.query("mdas").collect();

    const performances = await Promise.all(
      mdas.map(async (mda) => {
        const reforms = await ctx.db
          .query("reforms")
          .withIndex("by_mda", (q) => q.eq("mdaId", mda._id))
          .collect();

        if (reforms.length === 0) {
          return {
            mda,
            score: 0,
            status: getStatus(0),
            reformCount: 0,
            activityCount: 0,
            rank: 0,
          };
        }


        const reformsForScore = reforms.filter((r) =>
          reformCountsTowardMdaScore(mda, r.refNumber)
        );

        if (reformsForScore.length === 0) {
          return {
            mda,
            score: 0,
            status: getStatus(0),
            reformCount: reforms.length,
            activityCount: 0,
            rank: 0,
          };
        }

        let totalActivities = 0;
        let lastApplicableActivityUpdate = 0;
        const reformPerformances = await Promise.all(
          reformsForScore.map(async (reform) => {
            const activities = await ctx.db
              .query("activities")
              .withIndex("by_reform", (q) => q.eq("reformId", reform._id))
              .collect();

            totalActivities += activities.length;
            if (activities.length === 0) return { score: 0, status: getStatus(0) };

            let weightedScore = 0;
            let totalApplicableWeight = 0;
            let completedCount = 0;
            for (const activity of activities) {
              if (!activityCountsTowardMdaScore(mda, reform.refNumber, activity.refNumber)) continue;
              weightedScore += activity.completionLevel * activity.weight;
              totalApplicableWeight += activity.weight;
              if (activity.status === "complete") completedCount++;
              if (activity.updatedAt > lastApplicableActivityUpdate) {
                lastApplicableActivityUpdate = activity.updatedAt;
              }
            }

            const normalizedScore = totalApplicableWeight > 0 ? weightedScore / totalApplicableWeight : 0;
            let status = getStatus(normalizedScore);
            if (status.label === "Requires Intervention" && completedCount > 0) {
              status = { label: "In Progress", color: "yellow" };
            }

            return { score: normalizedScore, status };
          })
        );

        const mdaScore =
          reformPerformances.reduce((sum, p) => sum + p.score, 0) /
          reformPerformances.length;
        let status = getStatus(mdaScore);
        const hasInProgressReform = reformPerformances.some(
          (p) => p.status.label !== "Requires Intervention"
        );
        if (status.label === "Requires Intervention" && hasInProgressReform) {
          status = { label: "In Progress", color: "yellow" };
        }

        return {
          mda,
          score: mdaScore,
          status,
          reformCount: reforms.length,
          scoringReformCount: reformsForScore.length,
          activityCount: totalActivities,
          lastApplicableActivityUpdate,
          rank: 0,
        };
      })
    );

    // Separate MDAs with data from those without data
    // An MDA "has data" if it has activities AND score > 0 (meaning some progress has been made)
    const withData: typeof performances = [];
    const withoutData: typeof performances = [];

    for (const perf of performances) {
      // Check if MDA has data: has activities and score > 0
      // If score is 0 but activities exist, it means all activities are not_started (no data yet)
      const hasData = (perf.activityCount ?? 0) > 0 && perf.score > 0;
      if (hasData) {
        withData.push(perf);
      } else {
        withoutData.push(perf);
      }
    }

    // Sort MDAs with data by score descending; break ties by who settled into that score first
    withData.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tie: the MDA whose applicable activities were last updated earlier achieved the score first
      return (a.lastApplicableActivityUpdate ?? 0) - (b.lastApplicableActivityUpdate ?? 0);
    });
    withData.forEach((item, index) => {
      item.rank = index + 1;
    });

    // All MDAs without data get the same rank (next rank after the last MDA with data)
    const nextRank = withData.length > 0 ? withData.length + 1 : 1;
    withoutData.forEach((item) => {
      item.rank = nextRank;
    });

    // Combine and return (with data first, then without data)
    return [...withData, ...withoutData];
  },
});

const DAY_MS = 1000 * 60 * 60 * 24;
const CYCLE_START_DATE = "2026-01-26";
const TIMELINE_PERIODS = [
  { label: "Day 1-15", start: 1, end: 15 },
  { label: "Day 16-30", start: 16, end: 30 },
  { label: "Day 31-45", start: 31, end: 45 },
  { label: "Day 46-60", start: 46, end: 60 },
  { label: "Day 61-75", start: 61, end: 75 },
  { label: "Day 76-90", start: 76, end: 90 },
] as const;

// Get progress history for timeline chart with MDA attribution
export const getProgressHistory = query({
  args: {},
  handler: async (ctx) => {
    const [mdas, reforms, activities, auditLogs] = await Promise.all([
      ctx.db.query("mdas").collect(),
      ctx.db.query("reforms").collect(),
      ctx.db.query("activities").collect(),
      ctx.db
        .query("auditLogs")
        .withIndex("by_timestamp")
        .filter((q) => q.eq(q.field("entityType"), "activity"))
        .collect(),
    ]);

    const reformActivities = new Map<string, typeof activities>();
    for (const activity of activities) {
      const existing = reformActivities.get(activity.reformId) || [];
      existing.push(activity);
      reformActivities.set(activity.reformId, existing);
    }

    const reformsByMda = new Map<string, typeof reforms>();
    for (const reform of reforms) {
      const existing = reformsByMda.get(reform.mdaId) || [];
      existing.push(reform);
      reformsByMda.set(reform.mdaId, existing);
    }

    const now = Date.now();
    const cycleStart = new Date(CYCLE_START_DATE).getTime();
    const dayInCycle = Math.max(
      1,
      Math.min(90, Math.ceil((now - cycleStart) / DAY_MS))
    );
    const currentPeriodIndex = TIMELINE_PERIODS.findIndex(
      (p) => dayInCycle >= p.start && dayInCycle <= p.end
    );

    const activityCurrentState = new Map<string, number>();
    for (const activity of activities) {
      activityCurrentState.set(activity._id, activity.completionLevel);
    }

    const logsNewestFirst = [...auditLogs].sort((a, b) => b.timestamp - a.timestamp);

    const getActivityStateAt = (cutoffTimestamp: number) => {
      const state = new Map(activityCurrentState);

      for (const activity of activities) {
        if (activity.createdAt > cutoffTimestamp) {
          state.delete(activity._id);
        }
      }

      for (const log of logsNewestFirst) {
        if (log.timestamp <= cutoffTimestamp) continue;
        const previousCompletion = log.previousValue?.completionLevel;
        if (typeof previousCompletion === "number") {
          state.set(log.entityId, previousCompletion);
        }
      }

      return state;
    };

    const calculateScoresAt = (cutoffTimestamp: number) => {
      const activityState = getActivityStateAt(cutoffTimestamp);
      const mdaScores: Array<{
        mdaId: string;
        mdaName: string;
        mdaAbbreviation?: string;
        score: number;
      }> = [];

      for (const mda of mdas) {
        const mdaReforms = reformsByMda.get(mda._id) || [];
        const scoringReforms = mdaReforms.filter((r) =>
          reformCountsTowardMdaScore(mda, r.refNumber)
        );

        if (scoringReforms.length === 0) {
          mdaScores.push({
            mdaId: mda._id,
            mdaName: mda.name,
            mdaAbbreviation: mda.abbreviation,
            score: 0,
          });
          continue;
        }

        const reformScores = scoringReforms.map((reform) => {
          const reformActs = reformActivities.get(reform._id) || [];
          if (reformActs.length === 0) return 0;

          const applicableActs = reformActs.filter((activity) =>
            activityCountsTowardMdaScore(mda, reform.refNumber, activity.refNumber)
          );
          const totalApplicableWeight = applicableActs.reduce((sum, a) => sum + a.weight, 0);
          const weightedSum = applicableActs.reduce((sum, activity) => {
            const completion = activityState.get(activity._id) ?? 0;
            return sum + completion * activity.weight;
          }, 0);
          return totalApplicableWeight > 0 ? weightedSum / totalApplicableWeight : 0;
        });

        const mdaScore =
          reformScores.reduce((sum, value) => sum + value, 0) / reformScores.length;
        mdaScores.push({
          mdaId: mda._id,
          mdaName: mda.name,
          mdaAbbreviation: mda.abbreviation,
          score: mdaScore,
        });
      }

      const overallScore =
        mdaScores.length === 0
          ? 0
          : mdaScores.reduce((sum, item) => sum + item.score, 0) / mdaScores.length;

      return { overallScore, mdaScores };
    };

    const baselineTimestamp = cycleStart - 1;
    let previousSnapshot = calculateScoresAt(baselineTimestamp);

    const periods = TIMELINE_PERIODS.map((period, index) => {
      if (index > currentPeriodIndex) {
        return {
          ...period,
          overallScore: null as number | null,
          deltaFromPrevious: null as number | null,
          mdaContributions: [] as Array<{
            mdaId: string;
            mdaName: string;
            mdaAbbreviation?: string;
            previousScore: number;
            currentScore: number;
            delta: number;
          }>,
        };
      }

      const periodEndTimestamp =
        cycleStart + period.end * DAY_MS - 1;
      // For the current period, always use `now` so scores updated after the
      // nominal period end (e.g. past Day 90) are still reflected.
      const cutoffTimestamp =
        index === currentPeriodIndex ? now : Math.min(now, periodEndTimestamp);
      const currentSnapshot = calculateScoresAt(cutoffTimestamp);

      const previousByMda = new Map(
        previousSnapshot.mdaScores.map((item) => [item.mdaId, item.score])
      );
      const contributions = currentSnapshot.mdaScores
        .map((item) => {
          const previousScore = previousByMda.get(item.mdaId) ?? 0;
          const delta = item.score - previousScore;
          return {
            mdaId: item.mdaId,
            mdaName: item.mdaName,
            mdaAbbreviation: item.mdaAbbreviation,
            previousScore,
            currentScore: item.score,
            delta,
          };
        })
        .filter((item) => Math.abs(item.delta) > 0.0001)
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

      const result = {
        ...period,
        overallScore: currentSnapshot.overallScore,
        deltaFromPrevious: currentSnapshot.overallScore - previousSnapshot.overallScore,
        mdaContributions: contributions,
      };

      previousSnapshot = currentSnapshot;
      return result;
    });

    return {
      periodScores: periods.map((p) => p.overallScore),
      periods,
      currentScore:
        periods[Math.max(0, currentPeriodIndex)]?.overallScore ??
        previousSnapshot.overallScore,
      currentPeriodIndex,
      dayInCycle,
    };
  },
});

// Get dashboard summary statistics
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const mdas = await ctx.db.query("mdas").collect();
    const reforms = await ctx.db.query("reforms").collect();
    const activities = await ctx.db.query("activities").collect();

    // Count activities by status
    const activityStats = {
      notStarted: activities.filter((a) => a.status === "not_started").length,
      inProgress: activities.filter((a) => a.status === "in_progress").length,
      complete: activities.filter((a) => a.status === "complete").length,
    };

    // Calculate overall average score
    let totalWeightedScore = 0;
    let reformCount = 0;

    // Group activities by reform and calculate weighted scores
    const reformActivities = new Map<string, typeof activities>();
    for (const activity of activities) {
      const existing = reformActivities.get(activity.reformId) || [];
      existing.push(activity);
      reformActivities.set(activity.reformId, existing);
    }

    for (const [, reformActs] of reformActivities) {
      let reformScore = 0;
      for (const act of reformActs) {
        reformScore += act.completionLevel * act.weight;
      }
      totalWeightedScore += reformScore;
      reformCount++;
    }

    const averageScore = reformCount > 0 ? totalWeightedScore / reformCount : 0;

    // Count MDAs by status
    const statusCounts = {
      requiresIntervention: 0,
      progressingWithDifficulty: 0,
      progressing: 0,
      progressingWell: 0,
      successful: 0,
    };

    // Calculate each MDA's score and categorize
    for (const mda of mdas) {
      const mdaReforms = reforms.filter((r) => r.mdaId === mda._id);
      if (mdaReforms.length === 0) {
        statusCounts.requiresIntervention++;
        continue;
      }

      const mdaReformsForScore = mdaReforms.filter((r) =>
        reformCountsTowardMdaScore(mda, r.refNumber)
      );

      if (mdaReformsForScore.length === 0) {
        statusCounts.requiresIntervention++;
        continue;
      }

      const reformStatuses = mdaReformsForScore.map((reform) => {
        const reformActs = activities.filter((a) => a.reformId === reform._id);
        let reformScore = 0;
        let totalApplicableWeight = 0;
        let completedCount = 0;
        for (const act of reformActs) {
          if (!activityCountsTowardMdaScore(mda, reform.refNumber, act.refNumber)) continue;
          reformScore += act.completionLevel * act.weight;
          totalApplicableWeight += act.weight;
          if (act.status === "complete") completedCount++;
        }
        const normalizedScore = totalApplicableWeight > 0 ? reformScore / totalApplicableWeight : 0;
        let status = getStatus(normalizedScore);
        if (status.label === "Requires Intervention" && completedCount > 0) {
          status = { label: "In Progress", color: "yellow" };
        }
        return { score: normalizedScore, status };
      });

      const mdaScore = reformStatuses.reduce((sum, s) => sum + s.score, 0) / mdaReformsForScore.length;
      let status = getStatus(mdaScore);
      const hasInProgressReform = reformStatuses.some((s) => s.status.label !== "Requires Intervention");

      if (status.label === "Requires Intervention" && hasInProgressReform) {
        status = { label: "In Progress", color: "yellow" };
      }

      if (status.label === "Requires Intervention") statusCounts.requiresIntervention++;
      else if (status.label === "Progressing With Difficulty")
        statusCounts.progressingWithDifficulty++;
      else if (status.label === "In Progress") statusCounts.progressing++;
      else if (status.label === "Progressing Well") statusCounts.progressingWell++;
      else if (status.label === "Successful") statusCounts.successful++;
    }

    return {
      totalMDAs: mdas.length,
      totalReforms: reforms.length,
      totalActivities: activities.length,
      activityStats,
      averageScore,
      overallStatus: getStatus(averageScore),
      statusCounts,
    };
  },
});
