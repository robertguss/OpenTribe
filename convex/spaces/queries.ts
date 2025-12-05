/**
 * Space Queries
 *
 * Read operations for community spaces in the OpenTribe platform.
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireAuth, requireAdmin, hasRole } from "../_lib/permissions";

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

// Member space validator with unread indicator
const memberSpaceValidator = v.object({
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
  hasUnread: v.boolean(),
});

/**
 * List spaces for member navigation sidebar.
 *
 * Returns spaces the user can access based on visibility permissions:
 * - Public spaces: visible to all authenticated users
 * - Members-only spaces: visible to all authenticated users
 * - Paid spaces: visible only if user has matching tier membership
 *
 * Each space includes a hasUnread flag based on comparing the latest
 * post time with the user's last visit time.
 *
 * Admins and moderators can see all spaces regardless of visibility.
 *
 * @returns Array of spaces with unread indicators, sorted by order
 * @throws ConvexError if not authenticated
 */
export const listSpacesForMember = query({
  args: {},
  returns: v.array(memberSpaceValidator),
  handler: async (ctx) => {
    // 1. Auth check
    const authUser = await requireAuth(ctx);

    // 2. Find user profile by email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      return [];
    }

    // 3. Get all active spaces
    const spaces = await ctx.db
      .query("spaces")
      .withIndex("by_order")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    // 4. Get user's membership for tier checking
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", userProfile._id))
      .unique();

    // 5. Get all user's space visits for unread calculation
    const visits = await ctx.db
      .query("spaceVisits")
      .withIndex("by_userId", (q) => q.eq("userId", userProfile._id))
      .collect();

    // Create a map of spaceId -> lastVisitedAt for quick lookup
    const visitMap = new Map(visits.map((v) => [v.spaceId, v.lastVisitedAt]));

    // 6. Filter spaces by visibility and add unread indicator
    const accessibleSpaces = [];

    for (const space of spaces) {
      // Check visibility access
      let canAccess = false;

      // Admins and moderators can see all spaces
      if (hasRole(userProfile.role, "moderator")) {
        canAccess = true;
      } else if (
        space.visibility === "public" ||
        space.visibility === "members"
      ) {
        // Public and members-only are accessible to all authenticated users
        canAccess = true;
      } else if (space.visibility === "paid") {
        // Paid spaces require matching tier
        if (space.requiredTier) {
          if (
            membership &&
            (membership.status === "active" ||
              membership.status === "trialing") &&
            membership.tier === space.requiredTier
          ) {
            canAccess = true;
          }
        } else {
          // If no requiredTier specified, any member can access
          canAccess = true;
        }
      }

      if (!canAccess) {
        continue;
      }

      // Get latest post time for this space
      const latestPost = await ctx.db
        .query("posts")
        .withIndex("by_spaceId", (q) => q.eq("spaceId", space._id))
        .order("desc")
        .first();

      const latestPostTime = latestPost?.createdAt ?? 0;
      const lastVisitTime = visitMap.get(space._id) ?? 0;

      // Space is unread if there's a post newer than the last visit
      // or if user has never visited and there are posts
      const hasUnread = latestPostTime > 0 && latestPostTime > lastVisitTime;

      accessibleSpaces.push({
        ...space,
        hasUnread,
      });
    }

    return accessibleSpaces;
  },
});
