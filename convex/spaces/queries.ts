/**
 * Space Queries
 *
 * Read operations for community spaces in the OpenTribe platform.
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireAuth, requireAdmin } from "../_lib/permissions";

// Shared space validator for return types
const spaceValidator = v.object({
  _id: v.id("spaces"),
  _creationTime: v.number(),
  name: v.string(),
  description: v.optional(v.string()),
  icon: v.optional(v.string()),
  visibility: v.union(
    v.literal("public"),
    v.literal("members"),
    v.literal("paid")
  ),
  postPermission: v.union(
    v.literal("all"),
    v.literal("moderators"),
    v.literal("admin")
  ),
  requiredTier: v.optional(v.string()),
  order: v.number(),
  createdAt: v.number(),
});

/**
 * List all active spaces.
 *
 * Returns all spaces that have not been deleted, sorted by order ascending.
 * Available to all authenticated users.
 *
 * @returns Array of spaces sorted by order
 */
export const listSpaces = query({
  args: {},
  returns: v.array(spaceValidator),
  handler: async (ctx) => {
    const spaces = await ctx.db
      .query("spaces")
      .withIndex("by_order")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    return spaces;
  },
});

/**
 * Get a single space by ID.
 *
 * Returns the space if found and not deleted, otherwise null.
 *
 * @param spaceId - The ID of the space to retrieve
 * @returns The space or null if not found/deleted
 */
export const getSpace = query({
  args: {
    spaceId: v.id("spaces"),
  },
  returns: v.union(spaceValidator, v.null()),
  handler: async (ctx, args) => {
    const space = await ctx.db.get(args.spaceId);

    // Return null if not found or deleted
    if (!space || space.deletedAt) {
      return null;
    }

    return space;
  },
});

// Admin space validator with member count
const adminSpaceValidator = v.object({
  _id: v.id("spaces"),
  _creationTime: v.number(),
  name: v.string(),
  description: v.optional(v.string()),
  icon: v.optional(v.string()),
  visibility: v.union(
    v.literal("public"),
    v.literal("members"),
    v.literal("paid")
  ),
  postPermission: v.union(
    v.literal("all"),
    v.literal("moderators"),
    v.literal("admin")
  ),
  requiredTier: v.optional(v.string()),
  order: v.number(),
  createdAt: v.number(),
  memberCount: v.number(),
});

/**
 * List all spaces for admin management.
 *
 * Requires admin role. Returns all active spaces with member counts.
 * Member count is currently a placeholder (0) - will be derived from
 * spaceVisits or posts in future updates.
 *
 * @returns Array of spaces with member counts, sorted by order
 * @throws ConvexError if not admin
 */
export const listSpacesForAdmin = query({
  args: {},
  returns: v.array(adminSpaceValidator),
  handler: async (ctx) => {
    // 1. Auth check
    const authUser = await requireAuth(ctx);

    // Find user profile by email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      return [];
    }

    // 2. Require admin role
    await requireAdmin(ctx, userProfile._id);

    // 3. Get all active spaces
    const spaces = await ctx.db
      .query("spaces")
      .withIndex("by_order")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    // 4. Add member count placeholder (0 for now)
    // Future: Count from spaceVisits or posts table
    return spaces.map((space) => ({
      ...space,
      memberCount: 0,
    }));
  },
});
