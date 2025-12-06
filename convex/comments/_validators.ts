/**
 * Comment Validators
 *
 * Type definitions and validators for comment-related functions.
 */

import { v } from "convex/values";

// =============================================================================
// Input Validators
// =============================================================================

/**
 * Input for creating a comment.
 */
export const createCommentInput = {
  postId: v.id("posts"),
  content: v.string(),
  parentId: v.optional(v.id("comments")),
};

/**
 * Input for updating a comment.
 */
export const updateCommentInput = {
  commentId: v.id("comments"),
  content: v.string(),
};

/**
 * Input for deleting a comment.
 */
export const deleteCommentInput = {
  commentId: v.id("comments"),
};

/**
 * Input for listing comments by post.
 */
export const listCommentsByPostInput = {
  postId: v.id("posts"),
};

/**
 * Input for getting a single comment.
 */
export const getCommentInput = {
  commentId: v.id("comments"),
};

// =============================================================================
// Output Validators
// =============================================================================

/**
 * Create comment result - returns comment ID.
 */
export const createCommentOutput = v.id("comments");

/**
 * Update comment result - returns success boolean.
 */
export const updateCommentOutput = v.boolean();

/**
 * Delete comment result - returns success boolean.
 */
export const deleteCommentOutput = v.boolean();

/**
 * Single comment output (for getComment query).
 */
export const commentOutput = v.union(
  v.object({
    _id: v.id("comments"),
    postId: v.id("posts"),
    authorId: v.id("users"),
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    authorLevel: v.number(),
    parentId: v.optional(v.id("comments")),
    content: v.string(),
    likeCount: v.number(),
    hasLiked: v.boolean(),
    isOwn: v.boolean(),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  }),
  v.null()
);

/**
 * Reply comment shape (level 2 - no further nesting).
 */
export const replyCommentShape = v.object({
  _id: v.id("comments"),
  postId: v.id("posts"),
  authorId: v.id("users"),
  authorName: v.string(),
  authorAvatar: v.optional(v.string()),
  authorLevel: v.number(),
  parentId: v.optional(v.id("comments")),
  content: v.string(),
  likeCount: v.number(),
  hasLiked: v.boolean(),
  isOwn: v.boolean(),
  createdAt: v.number(),
  editedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
  replies: v.array(v.any()), // Empty array at level 2
});

/**
 * Nested comment output (with replies array).
 */
export const nestedCommentOutput = v.object({
  _id: v.id("comments"),
  postId: v.id("posts"),
  authorId: v.id("users"),
  authorName: v.string(),
  authorAvatar: v.optional(v.string()),
  authorLevel: v.number(),
  parentId: v.optional(v.id("comments")),
  content: v.string(),
  likeCount: v.number(),
  hasLiked: v.boolean(),
  isOwn: v.boolean(),
  createdAt: v.number(),
  editedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
  replies: v.array(replyCommentShape),
});

/**
 * List comments result - array of nested comments.
 */
export const listCommentsOutput = v.array(nestedCommentOutput);
