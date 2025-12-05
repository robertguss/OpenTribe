/**
 * Member Mutations
 *
 * Handles user profile creation and updates for the OpenTribe platform.
 * Links Better Auth users to our extended community profiles.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Create a new user profile in the users table.
 *
 * This mutation is idempotent - if a profile already exists for the email,
 * it returns the existing profile ID instead of creating a duplicate.
 *
 * Called after successful Better Auth signup to create the extended profile.
 *
 * @param email - User's email address (links to Better Auth user)
 * @param name - Optional display name
 * @returns The user's profile ID
 */
export const createUserProfile = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // Check if profile already exists (idempotent operation)
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      return existing._id;
    }

    const now = Date.now();

    // Create new user profile with default values
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      visibility: "public",
      role: "member",
      points: 0,
      level: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Create default membership record for the user
    await ctx.db.insert("memberships", {
      userId,
      tier: "free",
      status: "none",
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});
