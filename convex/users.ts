import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get the current user's role and info (only if they're in our system)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // First try to find by Clerk ID
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    // If not found by Clerk ID, try by email (for pending invites)
    if (!user && identity.email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email))
        .first();

      // If found by email (pending invite), link the Clerk ID and activate
      if (user && user.status === "pending") {
        await ctx.db.patch(user._id, {
          clerkId: identity.subject,
          status: "active",
          name: identity.name || user.name,
          lastLoginAt: Date.now(),
          updatedAt: Date.now(),
        });
        user = await ctx.db.get(user._id);
      }
    }

    // Update last login if active
    if (user && user.status === "active" && user.clerkId) {
      await ctx.db.patch(user._id, { lastLoginAt: Date.now() });
    }

    return user;
  },
});

// Check if user is authorized (invited and active)
export const isAuthorized = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { authorized: false, reason: "not_signed_in" };

    // Check by Clerk ID first
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    // Then by email for pending invites
    if (!user && identity.email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email))
        .first();
    }

    if (!user) {
      return { authorized: false, reason: "not_invited" };
    }

    if (user.status === "inactive") {
      return { authorized: false, reason: "deactivated" };
    }

    return { authorized: true, reason: null, user };
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

    if (!user || user.status !== "active") return false;
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

    if (!user || user.status !== "active") return false;

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

// Invite a new user (admin only) - creates a pending user record
export const invite = mutation({
  args: {
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

    // Allow first user creation (bootstrap admin) or admin inviting users
    const isFirstUser = (await ctx.db.query("users").first()) === null;
    if (!isFirstUser && (!currentUser || currentUser.role !== "admin")) {
      throw new Error("Only admins can invite users");
    }

    // Normalize email
    const email = args.email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    const now = Date.now();
    const id = await ctx.db.insert("users", {
      email,
      name: args.name,
      role: isFirstUser ? "admin" : args.role, // First user is always admin
      status: isFirstUser ? "active" : "pending",
      clerkId: isFirstUser ? identity.subject : undefined,
      assignedMDAs: args.assignedMDAs,
      invitedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return { id, email, isFirstUser };
  },
});

// Bootstrap: Create the first admin user (self-registration for first user only)
export const bootstrapAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    if (!identity.email) throw new Error("Email required");

    // Check if any users exist
    const existingUsers = await ctx.db.query("users").first();
    if (existingUsers) {
      throw new Error("System already has users. Contact an admin for access.");
    }

    const now = Date.now();
    const id = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email.toLowerCase(),
      name: identity.name,
      role: "admin",
      status: "active",
      lastLoginAt: now,
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
    status: v.optional(v.union(v.literal("pending"), v.literal("active"), v.literal("inactive"))),
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

// Resend invitation (admin only) - returns email for the API route to send
export const getInviteEmail = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can resend invitations");
    }

    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");
    if (user.status !== "pending") throw new Error("User is not pending");

    await ctx.db.patch(args.id, {
      invitedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { email: user.email, name: user.name };
  },
});
