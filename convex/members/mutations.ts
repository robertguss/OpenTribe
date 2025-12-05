/**
 * Member Mutations
 *
 * Handles user profile creation and updates for the OpenTribe platform.
 * Links Better Auth users to our extended community profiles.
 */

import { ConvexError } from "convex/values";
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { rateLimit } from "../_lib/rateLimits";

/**
 * Create a new user profile in the users table.
 *
 * This mutation is idempotent - if a profile already exists for the email,
 * it returns the existing profile ID instead of creating a duplicate.
 *
 * Called after successful Better Auth signup to create the extended profile.
 *
 * Features:
 * - Rate limited: 10 requests per minute with burst capacity of 3
 * - Email normalized to lowercase for consistent lookups
 * - Idempotent: returns existing profile if email already registered
 *
 * @param email - User's email address (links to Better Auth user)
 * @param name - Optional display name
 * @returns The user's profile ID
 * @throws ConvexError if rate limited
 */
export const createUserProfile = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // Normalize email to lowercase for consistent lookups
    const normalizedEmail = args.email.toLowerCase().trim();

    // Rate limit by email to prevent abuse
    const { ok, retryAt } = await rateLimit(ctx, {
      name: "createProfile",
      key: normalizedEmail,
    });

    if (!ok) {
      throw new ConvexError({
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
        retryAt,
      });
    }

    // Check if profile already exists (idempotent operation)
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();

    if (existing) {
      return existing._id;
    }

    const now = Date.now();

    // Create new user profile with default values
    const userId = await ctx.db.insert("users", {
      email: normalizedEmail,
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
