/**
 * Member Queries
 *
 * Read operations for user profiles in the OpenTribe platform.
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get a user profile by email address.
 *
 * Used to link Better Auth users to their extended community profiles.
 * Email is normalized to lowercase for consistent lookups.
 *
 * @param email - The email address to look up
 * @returns The user profile or null if not found
 */
export const getUserProfileByEmail = query({
  args: {
    email: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      email: v.string(),
      name: v.optional(v.string()),
      bio: v.optional(v.string()),
      avatarStorageId: v.optional(v.id("_storage")),
      visibility: v.union(v.literal("public"), v.literal("private")),
      role: v.union(
        v.literal("admin"),
        v.literal("moderator"),
        v.literal("member")
      ),
      points: v.number(),
      level: v.number(),
      notificationPrefs: v.optional(
        v.object({
          emailComments: v.boolean(),
          emailReplies: v.boolean(),
          emailFollowers: v.boolean(),
          emailEvents: v.boolean(),
          emailCourses: v.boolean(),
          emailDMs: v.boolean(),
          digestFrequency: v.union(
            v.literal("immediate"),
            v.literal("daily"),
            v.literal("weekly"),
            v.literal("off")
          ),
        })
      ),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Normalize email to lowercase for consistent lookups
    const normalizedEmail = args.email.toLowerCase().trim();

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();

    return user;
  },
});
