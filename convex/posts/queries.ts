/**
 * Post Queries
 *
 * List and retrieve posts from community spaces.
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireAuth, canViewSpace } from "../_lib/permissions";
import {
  postOutput,
  paginatedPostsOutput,
  enhancedPaginatedPostsOutput,
  postWithDetailsOutput,
} from "./_validators";

/**
 * List posts in a space with pagination.
 *
 * Requirements (from story 2-3):
 * - Filter by spaceId
 * - Exclude soft-deleted posts (deletedAt != null)
 * - Sort by pinnedAt DESC (pinned first), then createdAt DESC
 * - Paginate results
 *
 * @param spaceId - The space to list posts from
 * @param limit - Maximum number of posts to return (default 20)
 * @param cursor - Pagination cursor for next page
 * @returns Paginated list of posts
 */
export const listPostsBySpace = query({
  args: {
    spaceId: v.id("spaces"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: paginatedPostsOutput,
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

    // Check if user can view the space
    const canView = await canViewSpace(ctx, userProfile._id, args.spaceId);
    if (!canView) {
      return { posts: [], nextCursor: undefined, hasMore: false };
    }

    const limit = args.limit ?? 20;

    // First get pinned posts (pinnedAt is set)
    const pinnedPosts = await ctx.db
      .query("posts")
      .withIndex("by_spaceId", (q) => q.eq("spaceId", args.spaceId))
      .filter((q) =>
        q.and(
          q.neq(q.field("pinnedAt"), undefined),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .order("desc")
      .collect();

    // Sort pinned posts by pinnedAt descending
    const sortedPinnedPosts = pinnedPosts.sort(
      (a, b) => (b.pinnedAt || 0) - (a.pinnedAt || 0)
    );

    // Then get regular posts (not pinned), sorted by createdAt DESC
    const regularPostsQuery = ctx.db
      .query("posts")
      .withIndex("by_spaceId_and_createdAt", (q) =>
        q.eq("spaceId", args.spaceId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("pinnedAt"), undefined),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .order("desc");

    // Paginate regular posts
    const paginatedResult = await regularPostsQuery.paginate({
      numItems: limit,
      cursor: args.cursor ? JSON.parse(args.cursor) : null,
    });

    // Combine pinned posts (always first) with paginated regular posts
    // Only include pinned posts on first page (no cursor)
    const allPosts = args.cursor
      ? paginatedResult.page
      : [...sortedPinnedPosts, ...paginatedResult.page];

    return {
      posts: allPosts,
      nextCursor: paginatedResult.isDone
        ? undefined
        : JSON.stringify(paginatedResult.continueCursor),
      hasMore: !paginatedResult.isDone,
    };
  },
});

/**
 * Get a single post by ID.
 *
 * @param postId - The post ID to retrieve
 * @returns The post or null if not found/deleted
 */
export const getPost = query({
  args: {
    postId: v.id("posts"),
  },
  returns: v.union(postOutput, v.null()),
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await requireAuth(ctx);

    // Get user profile
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      return null;
    }

    // Get the post
    const post = await ctx.db.get(args.postId);
    if (!post || post.deletedAt) {
      return null;
    }

    // Check if user can view the space the post is in
    const canView = await canViewSpace(ctx, userProfile._id, post.spaceId);
    if (!canView) {
      return null;
    }

    return post;
  },
});

/**
 * List posts by a specific author.
 *
 * @param authorId - The author's user ID
 * @param limit - Maximum number of posts to return (default 20)
 * @returns List of posts by the author
 */
export const listPostsByAuthor = query({
  args: {
    authorId: v.id("users"),
    limit: v.optional(v.number()),
  },
  returns: v.array(postOutput),
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await requireAuth(ctx);

    // Get user profile
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      return [];
    }

    const limit = args.limit ?? 20;

    // Get posts by author
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_authorId", (q) => q.eq("authorId", args.authorId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .order("desc")
      .take(limit);

    // Filter to only posts in spaces the user can view
    const viewablePosts = [];
    for (const post of posts) {
      const canView = await canViewSpace(ctx, userProfile._id, post.spaceId);
      if (canView) {
        viewablePosts.push(post);
      }
    }

    return viewablePosts;
  },
});

/**
 * List posts in a space with pagination, including like status and author level.
 *
 * Enhanced version of listPostsBySpace for Story 2-4:
 * - Includes user's like status for each post (hasLiked boolean)
 * - Includes author level for displaying level badges
 * - Sort pinned posts first (by pinnedAt DESC), then by createdAt DESC
 *
 * @param spaceId - The space to list posts from
 * @param limit - Maximum number of posts to return (default 20)
 * @param cursor - Pagination cursor for next page
 * @returns Enhanced paginated list of posts with like status
 */
export const listPostsBySpaceEnhanced = query({
  args: {
    spaceId: v.id("spaces"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: enhancedPaginatedPostsOutput,
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

    // Check if user can view the space
    const canView = await canViewSpace(ctx, userProfile._id, args.spaceId);
    if (!canView) {
      return { posts: [], nextCursor: undefined, hasMore: false };
    }

    const limit = args.limit ?? 20;

    // First get pinned posts (pinnedAt is set)
    const pinnedPosts = await ctx.db
      .query("posts")
      .withIndex("by_spaceId", (q) => q.eq("spaceId", args.spaceId))
      .filter((q) =>
        q.and(
          q.neq(q.field("pinnedAt"), undefined),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .order("desc")
      .collect();

    // Sort pinned posts by pinnedAt descending
    const sortedPinnedPosts = pinnedPosts.sort(
      (a, b) => (b.pinnedAt || 0) - (a.pinnedAt || 0)
    );

    // Then get regular posts (not pinned), sorted by createdAt DESC
    const regularPostsQuery = ctx.db
      .query("posts")
      .withIndex("by_spaceId_and_createdAt", (q) =>
        q.eq("spaceId", args.spaceId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("pinnedAt"), undefined),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .order("desc");

    // Paginate regular posts
    const paginatedResult = await regularPostsQuery.paginate({
      numItems: limit,
      cursor: args.cursor ? JSON.parse(args.cursor) : null,
    });

    // Combine pinned posts (always first) with paginated regular posts
    // Only include pinned posts on first page (no cursor)
    const allPosts = args.cursor
      ? paginatedResult.page
      : [...sortedPinnedPosts, ...paginatedResult.page];

    // Get user's likes for these posts in a single query
    const userLikes = await ctx.db
      .query("likes")
      .withIndex("by_userId", (q) => q.eq("userId", userProfile._id))
      .filter((q) => q.eq(q.field("targetType"), "post"))
      .collect();

    const likedPostIds = new Set(userLikes.map((l) => l.targetId));

    // Get author levels for all unique authors
    const authorIds = [...new Set(allPosts.map((p) => p.authorId))];
    const authorLevels: Record<string, number> = {};
    for (const authorId of authorIds) {
      const author = await ctx.db.get(authorId);
      authorLevels[authorId] = author?.level ?? 1;
    }

    // Enhance posts with like status and author level
    const enhancedPosts = allPosts.map((post) => ({
      ...post,
      hasLiked: likedPostIds.has(post._id as string),
      authorLevel: authorLevels[post.authorId] ?? 1,
    }));

    return {
      posts: enhancedPosts,
      nextCursor: paginatedResult.isDone
        ? undefined
        : JSON.stringify(paginatedResult.continueCursor),
      hasMore: !paginatedResult.isDone,
    };
  },
});

/**
 * Get a single post with full details including like status and author level.
 *
 * Used for the post detail page (Story 2-4):
 * - Full post with author info
 * - User's like status
 * - Author level badge info
 * - Space name
 *
 * @param postId - The post ID to retrieve
 * @returns The post with details or null if not found/deleted
 */
export const getPostWithDetails = query({
  args: {
    postId: v.id("posts"),
  },
  returns: v.union(postWithDetailsOutput, v.null()),
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await requireAuth(ctx);

    // Get user profile
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      return null;
    }

    // Get the post
    const post = await ctx.db.get(args.postId);
    if (!post || post.deletedAt) {
      return null;
    }

    // Check if user can view the space the post is in
    const canView = await canViewSpace(ctx, userProfile._id, post.spaceId);
    if (!canView) {
      return null;
    }

    // Get the space for the space name
    const space = await ctx.db.get(post.spaceId);
    if (!space || space.deletedAt) {
      return null;
    }

    // Get author for level
    const author = await ctx.db.get(post.authorId);
    const authorLevel = author?.level ?? 1;

    // Check if user has liked this post
    const like = await ctx.db
      .query("likes")
      .withIndex("by_userId_and_target", (q) =>
        q
          .eq("userId", userProfile._id)
          .eq("targetType", "post")
          .eq("targetId", post._id as string)
      )
      .unique();

    return {
      ...post,
      spaceName: space.name,
      authorLevel,
      hasLiked: !!like,
    };
  },
});
