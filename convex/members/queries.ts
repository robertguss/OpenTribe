/**
 * Member Queries
 *
 * Read operations for user profiles in the OpenTribe platform.
 */

import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../_lib/permissions";

// Shared user profile validator
const userProfileValidator = v.object({
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
});

/**
 * Get the current user's profile.
 *
 * Requires authentication. Returns the profile for the logged-in user.
 *
 * @returns The user profile or null if profile not yet created
 * @throws ConvexError if not authenticated
 */
export const getMyProfile = query({
  args: {},
  returns: v.union(userProfileValidator, v.null()),
  handler: async (ctx) => {
    const authUser = await requireAuth(ctx);

    // Lookup user profile by email
    const profile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    return profile;
  },
});

/**
 * Get avatar URL from storage ID.
 *
 * Converts a Convex storage ID to a public URL.
 *
 * @param storageId - The storage ID of the avatar
 * @returns The URL string or null if not found
 */
export const getAvatarUrl = query({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});

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

/**
 * Search members by name for @mentions.
 *
 * Returns members whose name contains the search query.
 * Limited to prevent large result sets.
 *
 * @param query - The search query (partial name match)
 * @param limit - Maximum number of results (default 5)
 * @returns Array of matching members with their avatar URLs
 */
export const searchMembers = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    members: v.array(
      v.object({
        _id: v.id("users"),
        name: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
      })
    ),
  }),
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const limit = args.limit ?? 5;

    // Get all users (in a real app with many users, you'd want a search index)
    // For now, we fetch recent users and filter in memory
    const allUsers = await ctx.db.query("users").order("desc").take(100); // Cap at 100 for performance

    // Filter by name if query provided
    let filtered = allUsers;
    if (args.query.trim()) {
      const searchLower = args.query.toLowerCase().trim();
      filtered = allUsers.filter(
        (u) => u.name && u.name.toLowerCase().includes(searchLower)
      );
    }

    // Limit results
    const limited = filtered.slice(0, limit);

    // Get avatar URLs
    const membersWithAvatars = await Promise.all(
      limited.map(async (user) => {
        let avatarUrl: string | undefined;
        if (user.avatarStorageId) {
          avatarUrl =
            (await ctx.storage.getUrl(user.avatarStorageId)) ?? undefined;
        }
        return {
          _id: user._id,
          name: user.name,
          avatarUrl,
        };
      })
    );

    return { members: membersWithAvatars };
  },
});
