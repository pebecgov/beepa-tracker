import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Helper function to check if user can edit
async function canUserEdit(ctx: any, mdaId?: any): Promise<{ canEdit: boolean; userId?: string }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return { canEdit: false };

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();

  if (!user || !user.isActive) return { canEdit: false };

  // Admins can edit everything
  if (user.role === "admin") return { canEdit: true, userId: identity.subject };

  // Editors can edit if no MDA restrictions or assigned to this MDA
  if (user.role === "editor") {
    if (!mdaId) return { canEdit: true, userId: identity.subject };
    if (!user.assignedMDAs || user.assignedMDAs.length === 0) return { canEdit: true, userId: identity.subject };
    return { canEdit: user.assignedMDAs.includes(mdaId), userId: identity.subject };
  }

  return { canEdit: false };
}

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

// Update activity completion level (requires editor or admin role)
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

    // Get the MDA for this activity to check permissions
    const reform = await ctx.db.get(existing.reformId);
    if (!reform) throw new Error("Reform not found");

    // Check if user can edit this MDA
    const { canEdit, userId } = await canUserEdit(ctx, reform.mdaId);
    if (!canEdit) {
      throw new Error("You don't have permission to update this activity. Contact an admin to request editor access.");
    }

    // Validate completion level
    if (args.completionLevel < 0 || args.completionLevel > 1) {
      throw new Error("Completion level must be between 0 and 1");
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      completionLevel: args.completionLevel,
      status: args.status,
      lastUpdatedBy: userId,
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
      userId,
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
