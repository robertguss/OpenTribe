/**
 * Post Validators
 *
 * Type definitions and validators for post-related functions.
 */

import { v } from "convex/values";

// =============================================================================
// Input Validators
// =============================================================================

/**
 * Input for creating a new post.
 */
export const createPostInput = {
  spaceId: v.id("spaces"),
  content: v.string(), // Tiptap JSON string
  contentHtml: v.string(), // Rendered HTML
  title: v.optional(v.string()),
  mediaIds: v.optional(v.array(v.id("_storage"))),
};

/**
 * Input for updating a post.
 */
export const updatePostInput = {
  postId: v.id("posts"),
  content: v.optional(v.string()),
  contentHtml: v.optional(v.string()),
  title: v.optional(v.string()),
  mediaIds: v.optional(v.array(v.id("_storage"))),
};

// =============================================================================
// Output Validators
// =============================================================================

/**
 * Post output with author info for feed display.
 */
export const postOutput = v.object({
  _id: v.id("posts"),
  _creationTime: v.number(),
  spaceId: v.id("spaces"),
  authorId: v.id("users"),
  authorName: v.string(),
  authorAvatar: v.optional(v.string()),
  title: v.optional(v.string()),
  content: v.string(),
  contentHtml: v.string(),
  mediaIds: v.optional(v.array(v.id("_storage"))),
  likeCount: v.number(),
  commentCount: v.number(),
  pinnedAt: v.optional(v.number()),
  editedAt: v.optional(v.number()),
  createdAt: v.number(),
  deletedAt: v.optional(v.number()),
});

/**
 * Enhanced post output with user's like status and author level.
 * Used for feed display with engagement features.
 */
export const enhancedPostOutput = v.object({
  _id: v.id("posts"),
  _creationTime: v.number(),
  spaceId: v.id("spaces"),
  authorId: v.id("users"),
  authorName: v.string(),
  authorAvatar: v.optional(v.string()),
  authorLevel: v.number(),
  title: v.optional(v.string()),
  content: v.string(),
  contentHtml: v.string(),
  mediaIds: v.optional(v.array(v.id("_storage"))),
  likeCount: v.number(),
  commentCount: v.number(),
  pinnedAt: v.optional(v.number()),
  editedAt: v.optional(v.number()),
  createdAt: v.number(),
  deletedAt: v.optional(v.number()),
  hasLiked: v.boolean(),
});

/**
 * Paginated posts response.
 */
export const paginatedPostsOutput = v.object({
  posts: v.array(postOutput),
  nextCursor: v.optional(v.string()),
  hasMore: v.boolean(),
});

/**
 * Enhanced paginated posts response with like status and author level.
 */
export const enhancedPaginatedPostsOutput = v.object({
  posts: v.array(enhancedPostOutput),
  nextCursor: v.optional(v.string()),
  hasMore: v.boolean(),
});

/**
 * Post with full details for detail page.
 */
export const postWithDetailsOutput = v.object({
  _id: v.id("posts"),
  _creationTime: v.number(),
  spaceId: v.id("spaces"),
  spaceName: v.string(),
  authorId: v.id("users"),
  authorName: v.string(),
  authorAvatar: v.optional(v.string()),
  authorLevel: v.number(),
  title: v.optional(v.string()),
  content: v.string(),
  contentHtml: v.string(),
  mediaIds: v.optional(v.array(v.id("_storage"))),
  likeCount: v.number(),
  commentCount: v.number(),
  pinnedAt: v.optional(v.number()),
  editedAt: v.optional(v.number()),
  createdAt: v.number(),
  deletedAt: v.optional(v.number()),
  hasLiked: v.boolean(),
});
