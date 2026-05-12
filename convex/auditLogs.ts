import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";

async function canViewAuditLogs(ctx: QueryCtx): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return false;
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();
  return user?.role === "admin" || user?.role === "editor";
}

/** Editors/admins: activity completion history for all activities under a reform (newest first). */
export const listActivityChangesForReform = query({
  args: { reformId: v.id("reforms") },
  handler: async (ctx, args) => {
    const ok = await canViewAuditLogs(ctx);
    if (!ok) return null;

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_reform", (q) => q.eq("reformId", args.reformId))
      .collect();

    const rows: Array<{
      timestamp: number;
      activityId: string;
      activityRef: string;
      activityName: string;
      activityWeight: number;
      previousValue?: unknown;
      newValue?: unknown;
      userId?: string;
    }> = [];

    for (const a of activities) {
      const logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_entity", (q) =>
          q.eq("entityType", "activity").eq("entityId", a._id)
        )
        .collect();

      for (const log of logs) {
        if (log.action !== "update") continue;
        rows.push({
          timestamp: log.timestamp,
          activityId: a._id,
          activityRef: a.refNumber,
          activityName: a.name,
          activityWeight: a.weight,
          previousValue: log.previousValue,
          newValue: log.newValue,
          userId: log.userId,
        });
      }
    }

    rows.sort((x, y) => y.timestamp - x.timestamp);
    return rows;
  },
});
