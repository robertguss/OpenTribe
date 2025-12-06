/**
 * Activity Feed Validators
 *
 * Type definitions and validators for activity feed queries.
 */

import { v } from "convex/values";

// =============================================================================
// Output Validators
// =============================================================================

/**
 * Activity feed post output - extends enhanced post with space info.
 * Used for displaying posts in the aggregated activity feed.
 */
export const activityFeedPostOutput = v.object({
  _id: v.id("posts"),
  _creationTime: v.number(),
  spaceId: v.id("spaces"),
  spaceName: v.string(),
  spaceIcon: v.optional(v.string()),
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
  // Note: deletedAt is intentionally excluded as deleted posts are filtered out
  hasLiked: v.boolean(),
});

/**
 * Paginated activity feed response.
 */
export const activityFeedPaginatedOutput = v.object({
  posts: v.array(activityFeedPostOutput),
  nextCursor: v.optional(v.string()),
  hasMore: v.boolean(),
});
