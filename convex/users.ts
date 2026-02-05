import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Generate a random access code
function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars like 0, O, 1, I
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Check if system has any users
export const hasAnyUsers = query({
  args: {},
  handler: async (ctx) => {
    const firstUser = await ctx.db.query("users").first();
    return firstUser !== null;
  },
});

// Get the current user
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

// Check if user needs to select a role (just signed up)
export const needsRoleSelection = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    // User exists - no need for role selection
    return user === null;
  },
});

// Register a new user (called on first sign-in)
export const registerUser = mutation({
  args: {
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
    accessCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (existingUser) {
      throw new Error("User already registered");
    }

    // Check if this is the first user
    const isFirstUser = (await ctx.db.query("users").first()) === null;
    const now = Date.now();

    let role = args.role;

    if (isFirstUser) {
      // First user is always admin
      role = "admin";
      
      // Create system settings with access code
      const newAccessCode = generateAccessCode();
      await ctx.db.insert("settings", {
        accessCode: newAccessCode,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // For subsequent users, validate access code if requesting editor/admin
      if (args.role !== "viewer") {
        const settings = await ctx.db.query("settings").first();
        if (!settings) {
          throw new Error("System not configured");
        }
        
        if (!args.accessCode || args.accessCode.toUpperCase() !== settings.accessCode) {
          throw new Error("Invalid access code. Contact an admin to get the code.");
        }
      }
    }

    // Create user
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email?.toLowerCase() || "",
      name: identity.name,
      role,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return { userId, role, isFirstUser };
  },
});

// Update last login time
export const updateLastLogin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (user) {
      await ctx.db.patch(user._id, { lastLoginAt: Date.now() });
    }

    return user;
  },
});

// Get access code (admin only)
export const getAccessCode = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "admin") return null;

    const settings = await ctx.db.query("settings").first();
    return settings?.accessCode || null;
  },
});

// Regenerate access code (admin only)
export const regenerateAccessCode = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Only admins can regenerate the access code");
    }

    const settings = await ctx.db.query("settings").first();
    if (!settings) {
      throw new Error("System not configured");
    }

    const newCode = generateAccessCode();
    await ctx.db.patch(settings._id, {
      accessCode: newCode,
      updatedAt: Date.now(),
    });

    return newCode;
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

// Update a user's role (admin only)
export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can update user roles");
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });

    return args.userId;
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
