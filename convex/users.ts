import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get the current user's role and info
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    return user;
  },
});

// Check if current user has a specific role
export const hasRole = query({
  args: { roles: v.array(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || !user.isActive) return false;
    return args.roles.includes(user.role);
  },
});

// Check if user can edit a specific MDA
export const canEditMDA = query({
  args: { mdaId: v.id("mdas") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || !user.isActive) return false;

    // Admins can edit everything
    if (user.role === "admin") return true;

    // Editors can edit if no MDA restrictions or assigned to this MDA
    if (user.role === "editor") {
      if (!user.assignedMDAs || user.assignedMDAs.length === 0) return true;
      return user.assignedMDAs.includes(args.mdaId);
    }

    return false;
  },
});

// List all users (admin only)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") return [];

    return await ctx.db.query("users").collect();
  },
});

// Create a new user (admin only)
export const create = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
    assignedMDAs: v.optional(v.array(v.id("mdas"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    // Allow first user creation (bootstrap admin) or admin creating users
    const isFirstUser = (await ctx.db.query("users").first()) === null;
    if (!isFirstUser && (!currentUser || currentUser.role !== "admin")) {
      throw new Error("Only admins can create users");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      throw new Error("User already exists");
    }

    const now = Date.now();
    const id = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      role: isFirstUser ? "admin" : args.role, // First user is always admin
      assignedMDAs: args.assignedMDAs,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

// Update a user (admin only)
export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer"))),
    assignedMDAs: v.optional(v.array(v.id("mdas"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can update users");
    }

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Delete a user (admin only)
export const remove = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can delete users");
    }

    // Prevent deleting yourself
    const targetUser = await ctx.db.get(args.id);
    if (targetUser?.clerkId === identity.subject) {
      throw new Error("Cannot delete your own account");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Register current user (called on first sign-in)
export const registerCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    // Check if this is the first user (make them admin)
    const isFirstUser = (await ctx.db.query("users").first()) === null;

    const now = Date.now();
    const id = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email || "",
      name: identity.name,
      role: isFirstUser ? "admin" : "viewer", // First user is admin, others are viewers
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});
