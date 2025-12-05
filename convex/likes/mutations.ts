/**
 * Like Mutations
 *
 * Toggle likes on posts and comments.
 */

import { mutation } from "../_generated/server";
import { ConvexError } from "convex/values";
import { Id } from "../_generated/dataModel";
import { requireAuth } from "../_lib/permissions";
import { awardPoints } from "../_lib/points";
import { toggleLikeInput, toggleLikeOutput } from "./_validators";

/**
 * Toggle a like on a post or comment.
 *
 * Requirements (from story 2-4):
 * - Check if user has already liked the target
 * - If liked, remove like (unlike)
 * - If not liked, add like
 * - Update likeCount on post/comment (increment/decrement)
 * - Award 2 points to content author when liked (not on unlike)
 *
 * @param targetType - "post" or "comment"
 * @param targetId - The ID of the post or comment
 * @returns Object with liked status and new count
 */
export const toggleLike = mutation({
  args: toggleLikeInput,
  returns: toggleLikeOutput,
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await requireAuth(ctx);

    // Get user profile by email (established pattern)
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }

    // Get the target document to validate it exists and get author
    let targetDoc: {
      _id: Id<"posts"> | Id<"comments">;
      authorId: Id<"users">;
      likeCount: number;
      deletedAt?: number;
    } | null = null;

    if (args.targetType === "post") {
      targetDoc = await ctx.db.get(args.targetId as Id<"posts">);
    } else if (args.targetType === "comment") {
      targetDoc = await ctx.db.get(args.targetId as Id<"comments">);
    }

    if (!targetDoc) {
      throw new ConvexError("Target not found");
    }

    if (targetDoc.deletedAt) {
      throw new ConvexError("Cannot like deleted content");
    }

    // Check for existing like
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_userId_and_target", (q) =>
        q
          .eq("userId", userProfile._id)
          .eq("targetType", args.targetType)
          .eq("targetId", args.targetId)
      )
      .unique();

    if (existingLike) {
      // Unlike: remove record and decrement count
      await ctx.db.delete(existingLike._id);

      const newCount = Math.max(0, targetDoc.likeCount - 1);

      if (args.targetType === "post") {
        await ctx.db.patch(args.targetId as Id<"posts">, {
          likeCount: newCount,
        });
      } else {
        await ctx.db.patch(args.targetId as Id<"comments">, {
          likeCount: newCount,
        });
      }

      return { liked: false, newCount };
    } else {
      // Like: create record, increment count, award points
      await ctx.db.insert("likes", {
        userId: userProfile._id,
        targetType: args.targetType,
        targetId: args.targetId,
        createdAt: Date.now(),
      });

      const newCount = targetDoc.likeCount + 1;

      if (args.targetType === "post") {
        await ctx.db.patch(args.targetId as Id<"posts">, {
          likeCount: newCount,
        });
      } else {
        await ctx.db.patch(args.targetId as Id<"comments">, {
          likeCount: newCount,
        });
      }

      // Award 2 points to content author for receiving a like
      await awardPoints(ctx, {
        userId: targetDoc.authorId,
        action: "like_received",
        points: 2,
        sourceType: args.targetType,
        sourceId: args.targetId,
      });

      return { liked: true, newCount };
    }
  },
});
