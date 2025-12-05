/**
 * Space Visit Queries
 *
 * Queries for retrieving space visits to determine unread status.
 * Used by the sidebar navigation to show which spaces have new content.
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireAuth } from "../_lib/permissions";

// Shared validator for space visit return type
const spaceVisitValidator = v.object({
  _id: v.id("spaceVisits"),
  _creationTime: v.number(),
  userId: v.id("users"),
  spaceId: v.id("spaces"),
  lastVisitedAt: v.number(),
});

/**
 * Get all space visits for the current user.
 *
 * Returns all visit records for the authenticated user, which can be used
 * to determine which spaces have unread content (by comparing lastVisitedAt
 * with the latest post time in each space).
 *
 * @returns Array of space visit records
 * @throws ConvexError if not authenticated
 */
export const getSpaceVisits = query({
  args: {},
  returns: v.array(spaceVisitValidator),
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

    // 3. Get all visits for this user
    const visits = await ctx.db
      .query("spaceVisits")
      .withIndex("by_userId", (q) => q.eq("userId", userProfile._id))
      .collect();

    return visits;
  },
});

/**
 * Get a single space visit for the current user.
 *
 * Returns the visit record for a specific space if it exists,
 * or null if the user has never visited that space.
 *
 * @param spaceId - The ID of the space to check
 * @returns The space visit record or null
 * @throws ConvexError if not authenticated
 */
export const getSpaceVisit = query({
  args: {
    spaceId: v.id("spaces"),
  },
  returns: v.union(spaceVisitValidator, v.null()),
  handler: async (ctx, args) => {
    // 1. Auth check
    const authUser = await requireAuth(ctx);

    // 2. Find user profile by email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      return null;
    }

    // 3. Get the specific visit record
    const visit = await ctx.db
      .query("spaceVisits")
      .withIndex("by_userId_and_spaceId", (q) =>
        q.eq("userId", userProfile._id).eq("spaceId", args.spaceId)
      )
      .unique();

    return visit;
  },
});
