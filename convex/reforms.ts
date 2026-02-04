import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all reforms
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("reforms").collect();
  },
});

// Get reforms by MDA (sorted by refNumber)
export const listByMDA = query({
  args: { mdaId: v.id("mdas") },
  handler: async (ctx, args) => {
    const reforms = await ctx.db
      .query("reforms")
      .withIndex("by_mda", (q) => q.eq("mdaId", args.mdaId))
      .collect();
    
    // Sort by refNumber
    return reforms.sort((a, b) => a.refNumber - b.refNumber);
  },
});

// Get a single reform by ID
export const get = query({
  args: { id: v.id("reforms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get reform with all activities
export const getWithActivities = query({
  args: { id: v.id("reforms") },
  handler: async (ctx, args) => {
    const reform = await ctx.db.get(args.id);
    if (!reform) throw new Error("Reform not found");

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_reform", (q) => q.eq("reformId", args.id))
      .collect();

    // Sort activities by refNumber
    activities.sort((a, b) => {
      const aNum = parseFloat(a.refNumber.split(".")[1] || "0");
      const bNum = parseFloat(b.refNumber.split(".")[1] || "0");
      return aNum - bNum;
    });

    return {
      reform,
      activities,
    };
  },
});
