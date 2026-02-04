import { query } from "./_generated/server";
import { v } from "convex/values";

// Status thresholds and labels (based on PEBEC standards)
// =IF(score<=0.25,"Requires Intervention",IF(score<0.5,"Progressing With Difficulty",IF(score<0.75,"Progressing",IF(score<0.95,"Progressing Well",IF(score>=0.95,"Successful","")))))
const STATUS_THRESHOLDS = [
  { max: 0.25, label: "Requires Intervention", color: "red" },
  { max: 0.4999, label: "Progressing With Difficulty", color: "orange" },
  { max: 0.7499, label: "Progressing", color: "yellow" },
  { max: 0.9499, label: "Progressing Well", color: "blue" },
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

    return {
      reform,
      score: weightedScore,
      status: getStatus(weightedScore),
      activityCount: activities.length,
      completedCount,
      activities,
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
            completedCount: 0,
          };
        }

        // Calculate weighted score for this reform
        let weightedScore = 0;
        let completedCount = 0;

        for (const activity of activities) {
          weightedScore += activity.completionLevel * activity.weight;
          if (activity.status === "complete") {
            completedCount++;
          }
        }

        return {
          reform,
          score: weightedScore,
          status: getStatus(weightedScore),
          activityCount: activities.length,
          completedCount,
        };
      })
    );

    // Sort reforms by refNumber
    reformPerformances.sort((a, b) => a.reform.refNumber - b.reform.refNumber);

    // MDA score is average of all reform scores
    const mdaScore =
      reformPerformances.reduce((sum, r) => sum + r.score, 0) / reformPerformances.length;

    return {
      mda,
      score: mdaScore,
      status: getStatus(mdaScore),
      reformCount: reforms.length,
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

        // Calculate weighted score for each reform
        const reformScores = await Promise.all(
          reforms.map(async (reform) => {
            const activities = await ctx.db
              .query("activities")
              .withIndex("by_reform", (q) => q.eq("reformId", reform._id))
              .collect();

            if (activities.length === 0) return 0;

            let weightedScore = 0;
            for (const activity of activities) {
              weightedScore += activity.completionLevel * activity.weight;
            }
            return weightedScore;
          })
        );

        const mdaScore = reformScores.reduce((sum, s) => sum + s, 0) / reformScores.length;

        return {
          mda,
          score: mdaScore,
          status: getStatus(mdaScore),
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
            rank: 0,
          };
        }

        const reformScores = await Promise.all(
          reforms.map(async (reform) => {
            const activities = await ctx.db
              .query("activities")
              .withIndex("by_reform", (q) => q.eq("reformId", reform._id))
              .collect();

            if (activities.length === 0) return 0;

            let weightedScore = 0;
            for (const activity of activities) {
              weightedScore += activity.completionLevel * activity.weight;
            }
            return weightedScore;
          })
        );

        const mdaScore = reformScores.reduce((sum, s) => sum + s, 0) / reformScores.length;

        return {
          mda,
          score: mdaScore,
          status: getStatus(mdaScore),
          reformCount: reforms.length,
          rank: 0,
        };
      })
    );

    // Sort by score descending and assign ranks
    const sorted = performances.sort((a, b) => b.score - a.score);
    sorted.forEach((item, index) => {
      item.rank = index + 1;
    });

    return sorted;
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

      let mdaTotalScore = 0;
      for (const reform of mdaReforms) {
        const reformActs = activities.filter((a) => a.reformId === reform._id);
        let reformScore = 0;
        for (const act of reformActs) {
          reformScore += act.completionLevel * act.weight;
        }
        mdaTotalScore += reformScore;
      }

      const mdaScore = mdaTotalScore / mdaReforms.length;
      const status = getStatus(mdaScore);

      if (status.label === "Requires Intervention") statusCounts.requiresIntervention++;
      else if (status.label === "Progressing With Difficulty")
        statusCounts.progressingWithDifficulty++;
      else if (status.label === "Progressing") statusCounts.progressing++;
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
