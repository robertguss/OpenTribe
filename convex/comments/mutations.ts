/**
 * Comment Mutations
 *
 * Create, update, and delete comments with nested reply support.
 * Implements 2-level nesting as per PRD FR17.
 */

import { mutation } from "../_generated/server";
import { ConvexError } from "convex/values";
import {
  requireAuth,
  canEditContent,
  canDeleteContent,
} from "../_lib/permissions";
import { awardPoints } from "../_lib/points";
import {
  createCommentInput,
  createCommentOutput,
  updateCommentInput,
  updateCommentOutput,
  deleteCommentInput,
  deleteCommentOutput,
} from "./_validators";

/**
 * Create a comment or reply on a post.
 *
 * Requirements:
 * - Authenticate user
 * - Validate post exists and not deleted
 * - If replying, validate parent exists and belongs to same post
 * - Enforce 2-level nesting (flatten deeper replies)
 * - Denormalize author info for performance
 * - Update post commentCount
 * - Award 5 points to commenter
 * - Create notification for post author (if not self)
 * - Create notification for parent comment author on reply (if not self)
 */
export const createComment = mutation({
  args: createCommentInput,
  returns: createCommentOutput,
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

    // Validate content length (500 chars per UX spec)
    if (args.content.length === 0) {
      throw new ConvexError("Comment cannot be empty");
    }
    if (args.content.length > 500) {
      throw new ConvexError("Comment exceeds 500 character limit");
    }

    // Validate post exists and not deleted
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new ConvexError("Post not found");
    }
    if (post.deletedAt) {
      throw new ConvexError("Cannot comment on deleted post");
    }

    // Handle reply nesting logic
    let effectiveParentId = args.parentId;

    if (args.parentId) {
      const parentComment = await ctx.db.get(args.parentId);
      if (!parentComment) {
        throw new ConvexError("Parent comment not found");
      }
      if (parentComment.deletedAt) {
        throw new ConvexError("Cannot reply to deleted comment");
      }
      if (parentComment.postId !== args.postId) {
        throw new ConvexError("Parent comment does not belong to this post");
      }

      // Enforce 2-level nesting: if parent has a parent, flatten to level 2
      // by using parent's parentId as the new parentId
      if (parentComment.parentId) {
        effectiveParentId = parentComment.parentId;
      }
    }

    // Get avatar URL if user has one
    let avatarUrl: string | undefined;
    if (userProfile.avatarStorageId) {
      avatarUrl =
        (await ctx.storage.getUrl(userProfile.avatarStorageId)) ?? undefined;
    }

    // Create comment with denormalized author info
    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      authorId: userProfile._id,
      authorName: userProfile.name || authUser.email.split("@")[0],
      authorAvatar: avatarUrl,
      parentId: effectiveParentId,
      content: args.content,
      likeCount: 0,
      createdAt: Date.now(),
    });

    // Update post comment count
    await ctx.db.patch(args.postId, {
      commentCount: post.commentCount + 1,
    });

    // Award 5 points for commenting
    await awardPoints(ctx, {
      userId: userProfile._id,
      action: "comment_added",
      points: 5,
      sourceType: "comment",
      sourceId: commentId,
    });

    // Create notification for post author (if not self)
    if (post.authorId !== userProfile._id) {
      await ctx.db.insert("notifications", {
        userId: post.authorId,
        type: "comment",
        actorId: userProfile._id,
        actorName: userProfile.name || authUser.email.split("@")[0],
        actorAvatar: avatarUrl,
        data: {
          postId: args.postId,
          commentId,
          preview: args.content.slice(0, 100),
        },
        read: false,
        createdAt: Date.now(),
      });
    }

    // If this is a reply, notify parent comment author (if not self and not post author)
    if (effectiveParentId) {
      const parentComment = await ctx.db.get(effectiveParentId);
      if (
        parentComment &&
        parentComment.authorId !== userProfile._id &&
        parentComment.authorId !== post.authorId // Avoid duplicate notification
      ) {
        await ctx.db.insert("notifications", {
          userId: parentComment.authorId,
          type: "reply",
          actorId: userProfile._id,
          actorName: userProfile.name || authUser.email.split("@")[0],
          actorAvatar: avatarUrl,
          data: {
            postId: args.postId,
            commentId,
            parentCommentId: effectiveParentId,
            preview: args.content.slice(0, 100),
          },
          read: false,
          createdAt: Date.now(),
        });
      }
    }

    return commentId;
  },
});

/**
 * Update a comment (edit own comment).
 *
 * Requirements:
 * - Authenticate user
 * - Verify comment exists and not deleted
 * - Check permission (own content or moderator+)
 * - Set editedAt timestamp
 */
export const updateComment = mutation({
  args: updateCommentInput,
  returns: updateCommentOutput,
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await requireAuth(ctx);

    // Get user profile
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }

    // Validate content length
    if (args.content.length === 0) {
      throw new ConvexError("Comment cannot be empty");
    }
    if (args.content.length > 500) {
      throw new ConvexError("Comment exceeds 500 character limit");
    }

    // Get comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new ConvexError("Comment not found");
    }
    if (comment.deletedAt) {
      throw new ConvexError("Cannot edit deleted comment");
    }

    // Check permission (own content or moderator+)
    const canEdit = await canEditContent(
      ctx,
      userProfile._id,
      args.commentId,
      "comment"
    );
    if (!canEdit) {
      throw new ConvexError("You do not have permission to edit this comment");
    }

    // Update comment with editedAt timestamp
    await ctx.db.patch(args.commentId, {
      content: args.content,
      editedAt: Date.now(),
    });

    return true;
  },
});

/**
 * Delete a comment (soft delete).
 *
 * Requirements:
 * - Authenticate user
 * - Verify comment exists and not already deleted
 * - Check permission (own content or moderator+)
 * - Soft delete: set deletedAt, preserve structure
 * - Content will be replaced with "[deleted]" on query
 * - DO NOT decrement commentCount - deleted comments still show in thread
 */
export const deleteComment = mutation({
  args: deleteCommentInput,
  returns: deleteCommentOutput,
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await requireAuth(ctx);

    // Get user profile
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }

    // Get comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new ConvexError("Comment not found");
    }
    if (comment.deletedAt) {
      throw new ConvexError("Comment already deleted");
    }

    // Check permission (own content or moderator+)
    const canDelete = await canDeleteContent(
      ctx,
      userProfile._id,
      args.commentId,
      "comment"
    );
    if (!canDelete) {
      throw new ConvexError(
        "You do not have permission to delete this comment"
      );
    }

    // Soft delete: set deletedAt, preserve structure
    // Content will be replaced with "[deleted]" on query
    await ctx.db.patch(args.commentId, {
      deletedAt: Date.now(),
    });

    // Do NOT decrement post commentCount - deleted comments still show in thread
    // This preserves context for replies

    return true;
  },
});
