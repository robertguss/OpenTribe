/**
 * Like Queries
 *
 * Check like status and counts.
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthUser } from "../_lib/permissions";
import {
  hasUserLikedInput,
  getLikeCountInput,
  targetTypeValidator,
} from "./_validators";
import { Id } from "../_generated/dataModel";

/**
 * Check if the current user has liked a target.
 *
 * Returns false if not authenticated or like doesn't exist.
 *
 * @param targetType - "post" or "comment"
 * @param targetId - The ID of the post or comment
 * @returns boolean indicating if user has liked
 */
export const hasUserLiked = query({
  args: hasUserLikedInput,
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get authenticated user (don't throw if not logged in)
    const authUser = await getAuthUser(ctx);
    if (!authUser) {
      return false;
    }

    // Get user profile by email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      return false;
    }

    // Check for existing like
    const like = await ctx.db
      .query("likes")
      .withIndex("by_userId_and_target", (q) =>
        q
          .eq("userId", userProfile._id)
          .eq("targetType", args.targetType)
          .eq("targetId", args.targetId)
      )
      .unique();

    return !!like;
  },
});

/**
 * Get the like count for a target.
 *
 * Note: This is primarily useful for cases where you need the count
 * without the full document. Normally, likeCount is denormalized on
 * the post/comment document.
 *
 * @param targetType - "post" or "comment"
 * @param targetId - The ID of the post or comment
 * @returns The like count
 */
export const getLikeCount = query({
  args: getLikeCountInput,
  returns: v.number(),
  handler: async (ctx, args) => {
    // Get the target document to return its likeCount
    let targetDoc: { likeCount: number } | null = null;

    if (args.targetType === "post") {
      targetDoc = await ctx.db.get(args.targetId as Id<"posts">);
    } else if (args.targetType === "comment") {
      targetDoc = await ctx.db.get(args.targetId as Id<"comments">);
    }

    if (!targetDoc) {
      return 0;
    }

    return targetDoc.likeCount;
  },
});

/**
 * Get likes for multiple targets at once.
 *
 * Useful for fetching like status for a list of posts/comments efficiently.
 *
 * @param targetType - "post" or "comment"
 * @param targetIds - Array of target IDs to check
 * @returns Record mapping targetId to boolean (true if liked)
 */
export const getUserLikesForTargets = query({
  args: {
    targetType: targetTypeValidator,
    targetIds: v.array(v.string()),
  },
  returns: v.record(v.string(), v.boolean()),
  handler: async (ctx, args) => {
    // Get authenticated user (don't throw if not logged in)
    const authUser = await getAuthUser(ctx);
    if (!authUser) {
      // Return empty record if not logged in
      return Object.fromEntries(args.targetIds.map((id) => [id, false]));
    }

    // Get user profile by email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      return Object.fromEntries(args.targetIds.map((id) => [id, false]));
    }

    // Get all likes by this user for the given target type
    const userLikes = await ctx.db
      .query("likes")
      .withIndex("by_userId", (q) => q.eq("userId", userProfile._id))
      .filter((q) => q.eq(q.field("targetType"), args.targetType))
      .collect();

    // Create a set of liked target IDs for O(1) lookup
    const likedIds = new Set(userLikes.map((like) => like.targetId));

    // Return record mapping each targetId to whether it's liked
    return Object.fromEntries(
      args.targetIds.map((id) => [id, likedIds.has(id)])
    );
  },
});
