/**
 * Activity Feed Queries
 *
 * Queries for aggregating posts across all accessible spaces.
 *
 * PAGINATION NOTE:
 * - listActivityFeed and listActivityFeedFollowing use Convex cursor-based pagination
 *   (cursor is a JSON-serialized Convex cursor)
 * - listActivityFeedPopular uses offset-based pagination (cursor is a numeric string)
 *   because posts must be sorted by computed engagement score, not a database field
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireAuth, canViewSpace } from "../_lib/permissions";
import { activityFeedPaginatedOutput } from "./_validators";
import type { Id } from "../_generated/dataModel";

// =============================================================================
// Constants
// =============================================================================

/**
 * Over-fetch multiplier for cursor-based queries.
 * We fetch extra posts because some will be filtered out due to visibility.
 * Higher value = more reliable page sizes but more data transfer.
 */
const CURSOR_OVERFETCH_MULTIPLIER = 3;

/**
 * Over-fetch multiplier for following filter (needs more due to stricter filtering).
 */
const FOLLOWING_OVERFETCH_MULTIPLIER = 5;

/**
 * Time window for "popular" posts in milliseconds (7 days).
 * Only posts within this window are considered for the popular feed.
 */
const POPULAR_TIME_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * List posts in the aggregated activity feed from all accessible spaces.
 *
 * Requirements (from story 2-8):
 * - Include posts from all spaces user can access
 * - Sort by createdAt DESC (most recent first)
 * - Exclude soft-deleted posts
 * - Paginate with cursor-based pagination
 * - Include space name and icon for each post
 * - Include hasLiked status and authorLevel
 *
 * @param limit - Maximum number of posts to return (default 20)
 * @param cursor - Pagination cursor for next page
 * @returns Paginated list of activity feed posts
 */
export const listActivityFeed = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: activityFeedPaginatedOutput,
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await requireAuth(ctx);

    // Get user profile
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      return { posts: [], nextCursor: undefined, hasMore: false };
    }

    // Get all spaces and filter to accessible ones
    const allSpaces = await ctx.db.query("spaces").collect();
    const accessibleSpaceIds: Id<"spaces">[] = [];

    for (const space of allSpaces) {
      if (
        !space.deletedAt &&
        (await canViewSpace(ctx, userProfile._id, space._id))
      ) {
        accessibleSpaceIds.push(space._id);
      }
    }

    // Build space lookup for names/icons
    const spaceLookup = new Map(
      allSpaces.map((s) => [s._id as string, { name: s.name, icon: s.icon }])
    );

    const limit = args.limit ?? 20;

    // Query posts using by_createdAt index for global ordering
    // Note: We need to filter to accessible spaces client-side since Convex
    // doesn't support OR across multiple index values
    const postsQuery = ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc");

    // Paginate posts - fetch extra to account for filtering
    const paginatedResult = await postsQuery.paginate({
      numItems: limit * CURSOR_OVERFETCH_MULTIPLIER,
      cursor: args.cursor ? JSON.parse(args.cursor) : null,
    });

    // Filter to accessible spaces and non-deleted posts
    const accessibleSpaceIdsSet = new Set(
      accessibleSpaceIds.map((id) => id as string)
    );
    const filteredPosts = paginatedResult.page.filter(
      (post) =>
        accessibleSpaceIdsSet.has(post.spaceId as string) && !post.deletedAt
    );

    // Take only the limit amount
    const accessiblePosts = filteredPosts.slice(0, limit);

    // Get user's likes for these posts in a single query
    const userLikes = await ctx.db
      .query("likes")
      .withIndex("by_userId", (q) => q.eq("userId", userProfile._id))
      .filter((q) => q.eq(q.field("targetType"), "post"))
      .collect();

    const likedPostIds = new Set(userLikes.map((l) => l.targetId));

    // Get author levels for all unique authors
    const authorIds = [...new Set(accessiblePosts.map((p) => p.authorId))];
    const authorLevels: Record<string, number> = {};
    for (const authorId of authorIds) {
      const author = await ctx.db.get(authorId);
      authorLevels[authorId as string] = author?.level ?? 1;
    }

    // Enhance posts with space info, like status, and author level
    const enhancedPosts = accessiblePosts.map((post) => ({
      _id: post._id,
      _creationTime: post._creationTime,
      spaceId: post.spaceId,
      spaceName:
        spaceLookup.get(post.spaceId as string)?.name ?? "Unknown Space",
      spaceIcon: spaceLookup.get(post.spaceId as string)?.icon,
      authorId: post.authorId,
      authorName: post.authorName,
      authorAvatar: post.authorAvatar,
      authorLevel: authorLevels[post.authorId as string] ?? 1,
      title: post.title,
      content: post.content,
      contentHtml: post.contentHtml,
      mediaIds: post.mediaIds,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      pinnedAt: post.pinnedAt,
      editedAt: post.editedAt,
      createdAt: post.createdAt,
      hasLiked: likedPostIds.has(post._id as string),
    }));

    return {
      posts: enhancedPosts,
      nextCursor: paginatedResult.isDone
        ? undefined
        : JSON.stringify(paginatedResult.continueCursor),
      hasMore: !paginatedResult.isDone && accessiblePosts.length === limit,
    };
  },
});

/**
 * List posts from users the current user follows.
 *
 * Requirements (from story 2-8, AC3: Following filter):
 * - Filter posts to only those from users the current user follows
 * - Apply same visibility, pagination, and enhancement logic as listActivityFeed
 *
 * @param limit - Maximum number of posts to return (default 20)
 * @param cursor - Pagination cursor for next page
 * @returns Paginated list of posts from followed users
 */
export const listActivityFeedFollowing = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: activityFeedPaginatedOutput,
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await requireAuth(ctx);

    // Get user profile
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      return { posts: [], nextCursor: undefined, hasMore: false };
    }

    // Get users that the current user follows
    const following = await ctx.db
      .query("follows")
      .withIndex("by_followerId", (q) => q.eq("followerId", userProfile._id))
      .collect();

    if (following.length === 0) {
      return { posts: [], nextCursor: undefined, hasMore: false };
    }

    const followingIds = new Set(following.map((f) => f.followingId as string));

    // Get all spaces and filter to accessible ones
    const allSpaces = await ctx.db.query("spaces").collect();
    const accessibleSpaceIds: Id<"spaces">[] = [];

    for (const space of allSpaces) {
      if (
        !space.deletedAt &&
        (await canViewSpace(ctx, userProfile._id, space._id))
      ) {
        accessibleSpaceIds.push(space._id);
      }
    }

    // Build space lookup for names/icons
    const spaceLookup = new Map(
      allSpaces.map((s) => [s._id as string, { name: s.name, icon: s.icon }])
    );

    const limit = args.limit ?? 20;

    // Query posts using by_createdAt index for global ordering
    const postsQuery = ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc");

    // Paginate posts - fetch extra to account for filtering by followed users
    const paginatedResult = await postsQuery.paginate({
      numItems: limit * FOLLOWING_OVERFETCH_MULTIPLIER,
      cursor: args.cursor ? JSON.parse(args.cursor) : null,
    });

    // Filter to accessible spaces, non-deleted posts, and followed users
    const accessibleSpaceIdsSet = new Set(
      accessibleSpaceIds.map((id) => id as string)
    );
    const filteredPosts = paginatedResult.page.filter(
      (post) =>
        accessibleSpaceIdsSet.has(post.spaceId as string) &&
        !post.deletedAt &&
        followingIds.has(post.authorId as string)
    );

    // Take only the limit amount
    const accessiblePosts = filteredPosts.slice(0, limit);

    // Get user's likes for these posts in a single query
    const userLikes = await ctx.db
      .query("likes")
      .withIndex("by_userId", (q) => q.eq("userId", userProfile._id))
      .filter((q) => q.eq(q.field("targetType"), "post"))
      .collect();

    const likedPostIds = new Set(userLikes.map((l) => l.targetId));

    // Get author levels for all unique authors
    const authorIds = [...new Set(accessiblePosts.map((p) => p.authorId))];
    const authorLevels: Record<string, number> = {};
    for (const authorId of authorIds) {
      const author = await ctx.db.get(authorId);
      authorLevels[authorId as string] = author?.level ?? 1;
    }

    // Enhance posts with space info, like status, and author level
    const enhancedPosts = accessiblePosts.map((post) => ({
      _id: post._id,
      _creationTime: post._creationTime,
      spaceId: post.spaceId,
      spaceName:
        spaceLookup.get(post.spaceId as string)?.name ?? "Unknown Space",
      spaceIcon: spaceLookup.get(post.spaceId as string)?.icon,
      authorId: post.authorId,
      authorName: post.authorName,
      authorAvatar: post.authorAvatar,
      authorLevel: authorLevels[post.authorId as string] ?? 1,
      title: post.title,
      content: post.content,
      contentHtml: post.contentHtml,
      mediaIds: post.mediaIds,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      pinnedAt: post.pinnedAt,
      editedAt: post.editedAt,
      createdAt: post.createdAt,
      hasLiked: likedPostIds.has(post._id as string),
    }));

    return {
      posts: enhancedPosts,
      nextCursor: paginatedResult.isDone
        ? undefined
        : JSON.stringify(paginatedResult.continueCursor),
      hasMore: !paginatedResult.isDone && accessiblePosts.length === limit,
    };
  },
});

/**
 * List popular posts sorted by engagement score.
 *
 * Requirements (from story 2-8, AC3: Popular filter):
 * - Calculate engagement score: likeCount + (commentCount * 2)
 * - Sort by engagement score DESC
 * - Apply same visibility, pagination, and enhancement logic as listActivityFeed
 *
 * @param limit - Maximum number of posts to return (default 20)
 * @param cursor - Pagination cursor for next page
 * @returns Paginated list of posts sorted by engagement
 */
export const listActivityFeedPopular = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: activityFeedPaginatedOutput,
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await requireAuth(ctx);

    // Get user profile
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      return { posts: [], nextCursor: undefined, hasMore: false };
    }

    // Get all spaces and filter to accessible ones
    const allSpaces = await ctx.db.query("spaces").collect();
    const accessibleSpaceIds: Id<"spaces">[] = [];

    for (const space of allSpaces) {
      if (
        !space.deletedAt &&
        (await canViewSpace(ctx, userProfile._id, space._id))
      ) {
        accessibleSpaceIds.push(space._id);
      }
    }

    // Build space lookup for names/icons
    const spaceLookup = new Map(
      allSpaces.map((s) => [s._id as string, { name: s.name, icon: s.icon }])
    );

    const limit = args.limit ?? 20;

    // For popular posts, we need to fetch all accessible posts and sort by engagement
    // This is less efficient but necessary since we can't sort by a computed field in Convex
    // Future optimization: Add an engagementScore field and index
    const accessibleSpaceIdsSet = new Set(
      accessibleSpaceIds.map((id) => id as string)
    );

    // Get recent posts within the popular time window
    const timeWindowStart = Date.now() - POPULAR_TIME_WINDOW_MS;

    const allPosts = await ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc")
      .filter((q) =>
        q.and(
          q.eq(q.field("deletedAt"), undefined),
          q.gte(q.field("createdAt"), timeWindowStart)
        )
      )
      .collect();

    // Filter to accessible spaces and calculate engagement scores
    const filteredPosts = allPosts
      .filter((post) => accessibleSpaceIdsSet.has(post.spaceId as string))
      .map((post) => ({
        ...post,
        engagementScore: post.likeCount + post.commentCount * 2,
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore);

    // Apply simple offset-based pagination using cursor as offset
    const offset = args.cursor ? parseInt(args.cursor, 10) : 0;
    const paginatedPosts = filteredPosts.slice(offset, offset + limit);
    const hasMore = offset + limit < filteredPosts.length;

    // Get user's likes for these posts in a single query
    const userLikes = await ctx.db
      .query("likes")
      .withIndex("by_userId", (q) => q.eq("userId", userProfile._id))
      .filter((q) => q.eq(q.field("targetType"), "post"))
      .collect();

    const likedPostIds = new Set(userLikes.map((l) => l.targetId));

    // Get author levels for all unique authors
    const authorIds = [...new Set(paginatedPosts.map((p) => p.authorId))];
    const authorLevels: Record<string, number> = {};
    for (const authorId of authorIds) {
      const author = await ctx.db.get(authorId);
      authorLevels[authorId as string] = author?.level ?? 1;
    }

    // Enhance posts with space info, like status, and author level
    const enhancedPosts = paginatedPosts.map((post) => ({
      _id: post._id,
      _creationTime: post._creationTime,
      spaceId: post.spaceId,
      spaceName:
        spaceLookup.get(post.spaceId as string)?.name ?? "Unknown Space",
      spaceIcon: spaceLookup.get(post.spaceId as string)?.icon,
      authorId: post.authorId,
      authorName: post.authorName,
      authorAvatar: post.authorAvatar,
      authorLevel: authorLevels[post.authorId as string] ?? 1,
      title: post.title,
      content: post.content,
      contentHtml: post.contentHtml,
      mediaIds: post.mediaIds,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      pinnedAt: post.pinnedAt,
      editedAt: post.editedAt,
      createdAt: post.createdAt,
      hasLiked: likedPostIds.has(post._id as string),
    }));

    return {
      posts: enhancedPosts,
      nextCursor: hasMore ? String(offset + limit) : undefined,
      hasMore,
    };
  },
});
