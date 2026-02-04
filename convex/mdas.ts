import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all MDAs
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mdas").order("asc").collect();
  },
});

// Get a single MDA by ID
export const get = query({
  args: { id: v.id("mdas") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new MDA
export const create = mutation({
  args: {
    name: v.string(),
    abbreviation: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("mdas", {
      name: args.name,
      abbreviation: args.abbreviation,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });

    // Log the action
    await ctx.db.insert("auditLogs", {
      entityType: "mda",
      entityId: id,
      action: "create",
      newValue: args,
      timestamp: now,
    });

    return id;
  },
});

// Update an MDA
export const update = mutation({
  args: {
    id: v.id("mdas"),
    name: v.optional(v.string()),
    abbreviation: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("MDA not found");

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    // Log the action
    await ctx.db.insert("auditLogs", {
      entityType: "mda",
      entityId: id,
      action: "update",
      previousValue: existing,
      newValue: filteredUpdates,
      timestamp: Date.now(),
    });

    return id;
  },
});

// Delete an MDA (and all its reforms/activities)
export const remove = mutation({
  args: { id: v.id("mdas") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("MDA not found");

    // Get all reforms under this MDA
    const reforms = await ctx.db
      .query("reforms")
      .withIndex("by_mda", (q) => q.eq("mdaId", args.id))
      .collect();

    // Delete all activities under each reform
    for (const reform of reforms) {
      const activities = await ctx.db
        .query("activities")
        .withIndex("by_reform", (q) => q.eq("reformId", reform._id))
        .collect();

      for (const activity of activities) {
        await ctx.db.delete(activity._id);
      }
      await ctx.db.delete(reform._id);
    }

    // Delete the MDA
    await ctx.db.delete(args.id);

    // Log the action
    await ctx.db.insert("auditLogs", {
      entityType: "mda",
      entityId: args.id,
      action: "delete",
      previousValue: existing,
      timestamp: Date.now(),
    });

    return args.id;
  },
});
