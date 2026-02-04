import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all activities
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("activities").collect();
  },
});

// Get activities by reform
export const listByReform = query({
  args: { reformId: v.id("reforms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_reform", (q) => q.eq("reformId", args.reformId))
      .collect();
  },
});

// Get a single activity by ID
export const get = query({
  args: { id: v.id("activities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update activity completion level
export const updateCompletion = mutation({
  args: {
    id: v.id("activities"),
    completionLevel: v.number(),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("complete")
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Activity not found");

    // Validate completion level
    if (args.completionLevel < 0 || args.completionLevel > 1) {
      throw new Error("Completion level must be between 0 and 1");
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      completionLevel: args.completionLevel,
      status: args.status,
      updatedAt: now,
    });

    // Log the action
    await ctx.db.insert("auditLogs", {
      entityType: "activity",
      entityId: args.id,
      action: "update",
      previousValue: {
        completionLevel: existing.completionLevel,
        status: existing.status,
      },
      newValue: {
        completionLevel: args.completionLevel,
        status: args.status,
      },
      timestamp: now,
    });

    return args.id;
  },
});

// Batch update multiple activities (useful for bulk updates)
export const batchUpdateCompletion = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id("activities"),
        completionLevel: v.number(),
        status: v.union(
          v.literal("not_started"),
          v.literal("in_progress"),
          v.literal("complete")
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    for (const update of args.updates) {
      const existing = await ctx.db.get(update.id);
      if (!existing) continue;

      await ctx.db.patch(update.id, {
        completionLevel: update.completionLevel,
        status: update.status,
        updatedAt: now,
      });
    }

    return { success: true, updated: args.updates.length };
  },
});
