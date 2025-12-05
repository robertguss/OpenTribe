/**
 * Space Visit Mutations
 *
 * Mutations for recording space visits to track unread indicators.
 * Used by the sidebar navigation to show which spaces have new content.
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAuth } from "../_lib/permissions";

/**
 * Record a space visit for the current user.
 *
 * Creates a new visit record or updates the existing one with current timestamp.
 * This is called when a user navigates to a space to clear the unread indicator.
 *
 * @param spaceId - The ID of the space being visited
 * @returns The visit record ID
 * @throws ConvexError if not authenticated
 */
export const recordSpaceVisit = mutation({
  args: {
    spaceId: v.id("spaces"),
  },
  returns: v.id("spaceVisits"),
  handler: async (ctx, args) => {
    // 1. Auth check
    const authUser = await requireAuth(ctx);

    // 2. Find user profile by email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      // If no profile, this shouldn't happen but handle gracefully
      // Create the visit record using the auth user's subject as a fallback
      // In practice, users should always have a profile after registration
      throw new Error("User profile not found");
    }

    // 3. Check if visit record already exists
    const existingVisit = await ctx.db
      .query("spaceVisits")
      .withIndex("by_userId_and_spaceId", (q) =>
        q.eq("userId", userProfile._id).eq("spaceId", args.spaceId)
      )
      .unique();

    const now = Date.now();

    if (existingVisit) {
      // 4a. Update existing visit record
      await ctx.db.patch(existingVisit._id, {
        lastVisitedAt: now,
      });
      return existingVisit._id;
    } else {
      // 4b. Create new visit record
      return await ctx.db.insert("spaceVisits", {
        userId: userProfile._id,
        spaceId: args.spaceId,
        lastVisitedAt: now,
      });
    }
  },
});
