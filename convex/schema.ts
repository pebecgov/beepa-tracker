import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users with roles for access control
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(
      v.literal("admin"),      // Can manage everything including users
      v.literal("editor"),     // Can update activity statuses
      v.literal("viewer")      // Read-only access
    ),
    // Optional: Restrict editor to specific MDAs
    assignedMDAs: v.optional(v.array(v.id("mdas"))),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // MDAs (Ministries/Departments/Agencies)
  mdas: defineTable({
    name: v.string(),
    abbreviation: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  // Reforms under each MDA (standardized BEEPA reforms)
  reforms: defineTable({
    mdaId: v.id("mdas"),
    // Reference number (e.g., "1", "2", "3"...)
    refNumber: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_mda", ["mdaId"])
    .index("by_mda_ref", ["mdaId", "refNumber"])
    .index("by_name", ["name"]),

  // Activities under each Reform (with weights for scoring)
  activities: defineTable({
    reformId: v.id("reforms"),
    // Reference number (e.g., "1.1", "1.2", "2.1"...)
    refNumber: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    // Weight as decimal (e.g., 0.10 for 10%, 0.15 for 15%)
    weight: v.number(),
    // Completion level: 0 = Not Started, 0.5 = In Progress, 1 = Complete
    completionLevel: v.number(),
    // Status text
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("complete")
    ),
    // For audit trail
    lastUpdatedBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_reform", ["reformId"])
    .index("by_ref", ["refNumber"]),

  // Audit log for tracking changes
  auditLogs: defineTable({
    entityType: v.union(
      v.literal("mda"),
      v.literal("reform"),
      v.literal("activity")
    ),
    entityId: v.string(),
    action: v.union(v.literal("create"), v.literal("update"), v.literal("delete")),
    previousValue: v.optional(v.any()),
    newValue: v.optional(v.any()),
    userId: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_timestamp", ["timestamp"]),
});
