/**
 * Comment Queries
 *
 * Fetch comments with nested structure (2-level max).
 */

import { query } from "../_generated/server";
import { getAuthUser } from "../_lib/permissions";
import {
  listCommentsByPostInput,
  listCommentsOutput,
  getCommentInput,
  commentOutput,
} from "./_validators";

/**
 * List comments for a post with 2-level nested structure.
 *
 * Requirements:
 * - Fetch all comments for the post
 * - Build nested structure (2 levels max)
 * - Include hasLiked for authenticated user
 * - Include authorLevel for badge display
 * - Replace content with "[deleted]" for soft-deleted comments
 * - Sort top-level by newest first, replies by oldest first
 */
export const listCommentsByPost = query({
  args: listCommentsByPostInput,
  returns: listCommentsOutput,
  handler: async (ctx, args) => {
    // Get authenticated user (optional for viewing)
    const authUser = await getAuthUser(ctx);

    // Get user profile if authenticated
    let userProfile = null;
    if (authUser) {
      userProfile = await ctx.db
        .query("users")
        .withIndex("by_email", (q) =>
          q.eq("email", authUser.email.toLowerCase())
        )
        .unique();
    }

    // Get all comments for this post
    const allComments = await ctx.db
      .query("comments")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .collect();

    // Get user's likes for these comments (if authenticated)
    let likedCommentIds = new Set<string>();
    if (userProfile) {
      const userLikes = await ctx.db
        .query("likes")
        .withIndex("by_userId", (q) => q.eq("userId", userProfile._id))
        .filter((q) => q.eq(q.field("targetType"), "comment"))
        .collect();
      likedCommentIds = new Set(userLikes.map((l) => l.targetId));
    }

    // Get author levels in batch
    const authorIds = [...new Set(allComments.map((c) => c.authorId))];
    const authorLevels: Record<string, number> = {};
    for (const authorId of authorIds) {
      const author = await ctx.db.get(authorId);
      authorLevels[authorId] = author?.level ?? 1;
    }

    // Build nested structure (2 levels max)
    // Level 0: comments without parentId
    // Level 1: comments with parentId pointing to level 0

    const topLevelComments = allComments
      .filter((c) => !c.parentId)
      .map((c) => ({
        _id: c._id,
        postId: c.postId,
        authorId: c.authorId,
        authorName: c.authorName,
        authorAvatar: c.authorAvatar,
        authorLevel: authorLevels[c.authorId] ?? 1,
        parentId: c.parentId,
        // Replace content with "[deleted]" if soft-deleted
        content: c.deletedAt ? "[deleted]" : c.content,
        likeCount: c.likeCount,
        hasLiked: likedCommentIds.has(c._id as string),
        isOwn: userProfile?._id === c.authorId,
        createdAt: c.createdAt,
        editedAt: c.editedAt,
        deletedAt: c.deletedAt,
        replies: allComments
          .filter((r) => r.parentId === c._id)
          .map((r) => ({
            _id: r._id,
            postId: r.postId,
            authorId: r.authorId,
            authorName: r.authorName,
            authorAvatar: r.authorAvatar,
            authorLevel: authorLevels[r.authorId] ?? 1,
            parentId: r.parentId,
            content: r.deletedAt ? "[deleted]" : r.content,
            likeCount: r.likeCount,
            hasLiked: likedCommentIds.has(r._id as string),
            isOwn: userProfile?._id === r.authorId,
            createdAt: r.createdAt,
            editedAt: r.editedAt,
            deletedAt: r.deletedAt,
            replies: [] as never[], // Level 2 has no further nesting
          }))
          .sort((a, b) => a.createdAt - b.createdAt), // Oldest first for replies
      }))
      .sort((a, b) => b.createdAt - a.createdAt); // Newest first for top-level

    return topLevelComments;
  },
});

/**
 * Get a single comment by ID.
 *
 * Requirements:
 * - Fetch comment details
 * - Include hasLiked and authorLevel
 * - Return null if not found
 */
export const getComment = query({
  args: getCommentInput,
  returns: commentOutput,
  handler: async (ctx, args) => {
    // Get authenticated user (optional)
    const authUser = await getAuthUser(ctx);

    // Get user profile if authenticated
    let userProfile = null;
    if (authUser) {
      userProfile = await ctx.db
        .query("users")
        .withIndex("by_email", (q) =>
          q.eq("email", authUser.email.toLowerCase())
        )
        .unique();
    }

    // Get comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      return null;
    }

    // Get author level
    const author = await ctx.db.get(comment.authorId);
    const authorLevel = author?.level ?? 1;

    // Check if user has liked
    let hasLiked = false;
    if (userProfile) {
      const like = await ctx.db
        .query("likes")
        .withIndex("by_userId_and_target", (q) =>
          q
            .eq("userId", userProfile._id)
            .eq("targetType", "comment")
            .eq("targetId", args.commentId)
        )
        .unique();
      hasLiked = !!like;
    }

    return {
      _id: comment._id,
      postId: comment.postId,
      authorId: comment.authorId,
      authorName: comment.authorName,
      authorAvatar: comment.authorAvatar,
      authorLevel,
      parentId: comment.parentId,
      content: comment.deletedAt ? "[deleted]" : comment.content,
      likeCount: comment.likeCount,
      hasLiked,
      isOwn: userProfile?._id === comment.authorId,
      createdAt: comment.createdAt,
      editedAt: comment.editedAt,
      deletedAt: comment.deletedAt,
    };
  },
});
