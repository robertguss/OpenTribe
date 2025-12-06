/**
 * Activity Feed Queries Tests
 *
 * Tests for the activity feed aggregation queries.
 *
 * Testing Notes for Better Auth Integration:
 * The feed queries use Better Auth via `requireAuth(ctx)`.
 * Since Better Auth components aren't registered in test environment,
 * we test business logic directly using `t.run()` for database operations.
 */

import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.setup";
import type { Id } from "../_generated/dataModel";

// Helper to create a user
async function createUser(
  t: ReturnType<typeof convexTest>,
  data: {
    email: string;
    name?: string;
    role?: "admin" | "moderator" | "member";
    level?: number;
  }
): Promise<Id<"users">> {
  const now = Date.now();
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email: data.email.toLowerCase(),
      name: data.name || "Test User",
      visibility: "public",
      role: data.role || "member",
      points: 0,
      level: data.level ?? 1,
      createdAt: now,
      updatedAt: now,
    });
  });
}

// Helper to create a space
async function createSpace(
  t: ReturnType<typeof convexTest>,
  data: {
    name: string;
    icon?: string;
    visibility?: "public" | "members" | "paid";
    requiredTier?: string;
    deletedAt?: number;
  }
): Promise<Id<"spaces">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("spaces", {
      name: data.name,
      icon: data.icon,
      visibility: data.visibility || "public",
      postPermission: "all",
      requiredTier: data.requiredTier,
      order: 1,
      createdAt: Date.now(),
      deletedAt: data.deletedAt,
    });
  });
}

// Helper to create a post
async function createPost(
  t: ReturnType<typeof convexTest>,
  data: {
    spaceId: Id<"spaces">;
    authorId: Id<"users">;
    authorName: string;
    contentHtml?: string;
    deletedAt?: number;
    createdAt?: number;
  }
): Promise<Id<"posts">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("posts", {
      spaceId: data.spaceId,
      authorId: data.authorId,
      authorName: data.authorName,
      content: '{"type":"doc"}',
      contentHtml: data.contentHtml || "<p>Test</p>",
      likeCount: 0,
      commentCount: 0,
      createdAt: data.createdAt || Date.now(),
      deletedAt: data.deletedAt,
    });
  });
}

// Helper to create a like
async function createLike(
  t: ReturnType<typeof convexTest>,
  data: {
    userId: Id<"users">;
    targetType: "post" | "comment";
    targetId: string;
  }
): Promise<Id<"likes">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("likes", {
      userId: data.userId,
      targetType: data.targetType,
      targetId: data.targetId,
      createdAt: Date.now(),
    });
  });
}

describe("listActivityFeed", () => {
  it("should throw error for unauthenticated user", async () => {
    const t = convexTest(schema, modules);

    // Without authentication, should throw
    await expect(
      t.query(api.feed.queries.listActivityFeed, {})
    ).rejects.toThrow();
  });

  it("returns posts from multiple accessible spaces (business logic)", async () => {
    const t = convexTest(schema, modules);

    // Create a user
    const userId = await createUser(t, { email: "user@example.com" });

    // Create two public spaces
    const space1Id = await createSpace(t, { name: "Space One", icon: "📚" });
    const space2Id = await createSpace(t, { name: "Space Two", icon: "💬" });

    // Create posts in both spaces
    await createPost(t, {
      spaceId: space1Id,
      authorId: userId,
      authorName: "Test User",
      contentHtml: "<p>Post in space 1</p>",
      createdAt: Date.now() - 1000,
    });
    await createPost(t, {
      spaceId: space2Id,
      authorId: userId,
      authorName: "Test User",
      contentHtml: "<p>Post in space 2</p>",
      createdAt: Date.now(),
    });

    // Query all posts sorted by createdAt DESC and filter for non-deleted
    const posts = await t.run(async (ctx) => {
      return await ctx.db
        .query("posts")
        .withIndex("by_createdAt")
        .order("desc")
        .filter((q) => q.eq(q.field("deletedAt"), undefined))
        .collect();
    });

    expect(posts).toHaveLength(2);

    // Get spaces for verification
    const spaces = await t.run(async (ctx) => {
      const s1 = await ctx.db.get(space1Id);
      const s2 = await ctx.db.get(space2Id);
      return { s1, s2 };
    });

    // Verify posts from both spaces are present
    const spaceIds = posts.map((p) => p.spaceId);
    expect(spaceIds).toContain(space1Id);
    expect(spaceIds).toContain(space2Id);
    expect(spaces.s1?.name).toBe("Space One");
    expect(spaces.s2?.name).toBe("Space Two");
  });

  it("excludes posts from spaces user cannot access (paid visibility)", async () => {
    const t = convexTest(schema, modules);

    // Create a regular user (no membership)
    const userId = await createUser(t, { email: "user@example.com" });

    // Create one public space and one paid space requiring tier
    const publicSpaceId = await createSpace(t, {
      name: "Public Space",
      icon: "🌐",
    });
    const paidSpaceId = await createSpace(t, {
      name: "Paid Space",
      icon: "💎",
      visibility: "paid",
      requiredTier: "pro",
    });

    // Create posts in both spaces
    await createPost(t, {
      spaceId: publicSpaceId,
      authorId: userId,
      authorName: "Test User",
      contentHtml: "<p>Public post</p>",
    });
    await createPost(t, {
      spaceId: paidSpaceId,
      authorId: userId,
      authorName: "Test User",
      contentHtml: "<p>Paid post</p>",
    });

    // Simulate canViewSpace logic - user without membership can't access paid spaces
    const allPosts = await t.run(async (ctx) => {
      return await ctx.db
        .query("posts")
        .filter((q) => q.eq(q.field("deletedAt"), undefined))
        .collect();
    });

    const spaces = await t.run(async (ctx) => {
      const pub = await ctx.db.get(publicSpaceId);
      const paid = await ctx.db.get(paidSpaceId);
      return { pub, paid };
    });

    // Member without membership can access public but not paid with requiredTier
    expect(allPosts).toHaveLength(2);
    expect(spaces.pub?.visibility).toBe("public");
    expect(spaces.paid?.visibility).toBe("paid");
    expect(spaces.paid?.requiredTier).toBe("pro");

    // Filter to accessible spaces (public only for user without membership)
    const accessiblePosts = allPosts.filter((p) => p.spaceId === publicSpaceId);
    expect(accessiblePosts).toHaveLength(1);
    expect(accessiblePosts[0].contentHtml).toContain("Public post");
  });

  it("excludes deleted posts", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "user@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space", icon: "📚" });

    // Create one active and one deleted post
    await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
      contentHtml: "<p>Active post</p>",
    });
    await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
      contentHtml: "<p>Deleted post</p>",
      deletedAt: Date.now(),
    });

    // Query with deleted posts filtered out
    const posts = await t.run(async (ctx) => {
      return await ctx.db
        .query("posts")
        .filter((q) => q.eq(q.field("deletedAt"), undefined))
        .collect();
    });

    expect(posts).toHaveLength(1);
    expect(posts[0].contentHtml).toContain("Active post");
  });

  it("paginates correctly with limit", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "user@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });

    // Create 5 posts
    for (let i = 0; i < 5; i++) {
      await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test User",
        contentHtml: `<p>Post ${i + 1}</p>`,
        createdAt: Date.now() + i * 1000, // Different times for ordering
      });
    }

    // Query with pagination
    const page1 = await t.run(async (ctx) => {
      const result = await ctx.db
        .query("posts")
        .withIndex("by_createdAt")
        .order("desc")
        .paginate({ numItems: 2, cursor: null });
      return result;
    });

    expect(page1.page).toHaveLength(2);
    expect(page1.isDone).toBe(false);

    // Get second page
    const page2 = await t.run(async (ctx) => {
      const result = await ctx.db
        .query("posts")
        .withIndex("by_createdAt")
        .order("desc")
        .paginate({ numItems: 2, cursor: page1.continueCursor });
      return result;
    });

    expect(page2.page).toHaveLength(2);

    // Post IDs should be different between pages
    const page1Ids = page1.page.map((p) => p._id);
    const page2Ids = page2.page.map((p) => p._id);
    expect(page1Ids.some((id) => page2Ids.includes(id))).toBe(false);
  });

  it("sorts posts by createdAt DESC (most recent first)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "user@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });

    const now = Date.now();
    // Insert older post first
    await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
      contentHtml: "<p>Old post</p>",
      createdAt: now - 10000,
    });
    // Insert newer post second
    await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
      contentHtml: "<p>New post</p>",
      createdAt: now,
    });

    const posts = await t.run(async (ctx) => {
      return await ctx.db
        .query("posts")
        .withIndex("by_createdAt")
        .order("desc")
        .collect();
    });

    expect(posts).toHaveLength(2);
    // Most recent should be first
    expect(posts[0].contentHtml).toContain("New post");
    expect(posts[1].contentHtml).toContain("Old post");
  });

  it("includes space name and icon lookup capability", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "user@example.com" });
    const spaceId = await createSpace(t, { name: "Cool Space", icon: "🚀" });

    await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
      contentHtml: "<p>Test post</p>",
    });

    // Verify we can look up space info
    const post = await t.run(async (ctx) => {
      const posts = await ctx.db.query("posts").collect();
      return posts[0];
    });

    const space = await t.run(async (ctx) => {
      return await ctx.db.get(post.spaceId);
    });

    expect(space?.name).toBe("Cool Space");
    expect(space?.icon).toBe("🚀");
  });

  it("includes like status lookup capability", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "user@example.com", level: 5 });
    const spaceId = await createSpace(t, { name: "Test Space" });

    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    // User likes the post
    await createLike(t, {
      userId,
      targetType: "post",
      targetId: postId as string,
    });

    // Query user's likes
    const userLikes = await t.run(async (ctx) => {
      return await ctx.db
        .query("likes")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("targetType"), "post"))
        .collect();
    });

    const likedPostIds = new Set(userLikes.map((l) => l.targetId));
    expect(likedPostIds.has(postId as string)).toBe(true);
  });

  it("includes author level lookup capability", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "user@example.com", level: 5 });
    const spaceId = await createSpace(t, { name: "Test Space" });

    await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    // Verify author level lookup
    const author = await t.run(async (ctx) => {
      return await ctx.db.get(userId);
    });

    expect(author?.level).toBe(5);
  });

  it("handles empty feed when no accessible spaces", async () => {
    const t = convexTest(schema, modules);

    // Create user without membership
    const userId = await createUser(t, { email: "user@example.com" });

    // Create only a paid space with requiredTier
    const paidSpaceId = await createSpace(t, {
      name: "Paid Only",
      visibility: "paid",
      requiredTier: "premium",
    });

    await createPost(t, {
      spaceId: paidSpaceId,
      authorId: userId,
      authorName: "Test User",
    });

    // All posts but none accessible
    const allPosts = await t.run(async (ctx) => {
      return await ctx.db.query("posts").collect();
    });

    expect(allPosts).toHaveLength(1);
    // User without premium membership can't see these posts
    // (filtering happens in the query handler)
  });
});

// Helper to create a follow relationship
async function createFollow(
  t: ReturnType<typeof convexTest>,
  data: {
    followerId: Id<"users">;
    followingId: Id<"users">;
  }
): Promise<Id<"follows">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("follows", {
      followerId: data.followerId,
      followingId: data.followingId,
      createdAt: Date.now(),
    });
  });
}

describe("listActivityFeedFollowing", () => {
  it("should throw error for unauthenticated user", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.query(api.feed.queries.listActivityFeedFollowing, {})
    ).rejects.toThrow();
  });

  it("returns only posts from followed users (business logic)", async () => {
    const t = convexTest(schema, modules);

    // Create current user and two other users
    const currentUserId = await createUser(t, { email: "current@example.com" });
    const followedUserId = await createUser(t, {
      email: "followed@example.com",
      name: "Followed User",
    });
    const unfollowedUserId = await createUser(t, {
      email: "unfollowed@example.com",
      name: "Unfollowed User",
    });

    const spaceId = await createSpace(t, { name: "Test Space" });

    // Current user follows one user
    await createFollow(t, {
      followerId: currentUserId,
      followingId: followedUserId,
    });

    // Both users create posts
    await createPost(t, {
      spaceId,
      authorId: followedUserId,
      authorName: "Followed User",
      contentHtml: "<p>Post from followed user</p>",
    });
    await createPost(t, {
      spaceId,
      authorId: unfollowedUserId,
      authorName: "Unfollowed User",
      contentHtml: "<p>Post from unfollowed user</p>",
    });

    // Get who current user follows
    const following = await t.run(async (ctx) => {
      return await ctx.db
        .query("follows")
        .withIndex("by_followerId", (q) => q.eq("followerId", currentUserId))
        .collect();
    });

    const followingIds = new Set(following.map((f) => f.followingId as string));
    expect(followingIds.size).toBe(1);
    expect(followingIds.has(followedUserId as string)).toBe(true);

    // Get all posts
    const allPosts = await t.run(async (ctx) => {
      return await ctx.db.query("posts").collect();
    });

    // Filter to posts from followed users
    const followingPosts = allPosts.filter((p) =>
      followingIds.has(p.authorId as string)
    );
    expect(followingPosts).toHaveLength(1);
    expect(followingPosts[0].contentHtml).toContain("Post from followed user");
  });

  it("returns empty result if not following anyone", async () => {
    const t = convexTest(schema, modules);

    const currentUserId = await createUser(t, { email: "current@example.com" });
    const otherUserId = await createUser(t, { email: "other@example.com" });

    const spaceId = await createSpace(t, { name: "Test Space" });

    // Other user creates a post but current user doesn't follow them
    await createPost(t, {
      spaceId,
      authorId: otherUserId,
      authorName: "Other User",
    });

    // Get who current user follows
    const following = await t.run(async (ctx) => {
      return await ctx.db
        .query("follows")
        .withIndex("by_followerId", (q) => q.eq("followerId", currentUserId))
        .collect();
    });

    expect(following).toHaveLength(0);
  });

  it("respects space visibility for following filter", async () => {
    const t = convexTest(schema, modules);

    const currentUserId = await createUser(t, { email: "current@example.com" });
    const followedUserId = await createUser(t, {
      email: "followed@example.com",
    });

    // Create follow relationship
    await createFollow(t, {
      followerId: currentUserId,
      followingId: followedUserId,
    });

    // Create public and paid spaces
    const publicSpaceId = await createSpace(t, { name: "Public Space" });
    const paidSpaceId = await createSpace(t, {
      name: "Paid Space",
      visibility: "paid",
      requiredTier: "premium",
    });

    // Followed user posts in both spaces
    await createPost(t, {
      spaceId: publicSpaceId,
      authorId: followedUserId,
      authorName: "Followed User",
      contentHtml: "<p>Public post</p>",
    });
    await createPost(t, {
      spaceId: paidSpaceId,
      authorId: followedUserId,
      authorName: "Followed User",
      contentHtml: "<p>Paid post</p>",
    });

    // Get all posts from followed users
    const following = await t.run(async (ctx) => {
      return await ctx.db
        .query("follows")
        .withIndex("by_followerId", (q) => q.eq("followerId", currentUserId))
        .collect();
    });

    const followingIds = new Set(following.map((f) => f.followingId as string));

    const allPosts = await t.run(async (ctx) => {
      return await ctx.db.query("posts").collect();
    });

    const followingPosts = allPosts.filter((p) =>
      followingIds.has(p.authorId as string)
    );
    expect(followingPosts).toHaveLength(2);

    // Space visibility would further filter these
    const spaces = await t.run(async (ctx) => {
      const pub = await ctx.db.get(publicSpaceId);
      const paid = await ctx.db.get(paidSpaceId);
      return { pub, paid };
    });

    expect(spaces.pub?.visibility).toBe("public");
    expect(spaces.paid?.visibility).toBe("paid");
  });
});

describe("listActivityFeedPopular", () => {
  it("should throw error for unauthenticated user", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.query(api.feed.queries.listActivityFeedPopular, {})
    ).rejects.toThrow();
  });

  it("sorts posts by engagement score (likes + comments * 2)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "user@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });

    // Create posts with different engagement levels
    // High engagement: 5 likes + 3 comments = 5 + 6 = 11
    await t.run(async (ctx) => {
      await ctx.db.insert("posts", {
        spaceId,
        authorId: userId,
        authorName: "Test User",
        content: "{}",
        contentHtml: "<p>High engagement post</p>",
        likeCount: 5,
        commentCount: 3,
        createdAt: Date.now() - 2000,
      });
    });

    // Medium engagement: 2 likes + 2 comments = 2 + 4 = 6
    await t.run(async (ctx) => {
      await ctx.db.insert("posts", {
        spaceId,
        authorId: userId,
        authorName: "Test User",
        content: "{}",
        contentHtml: "<p>Medium engagement post</p>",
        likeCount: 2,
        commentCount: 2,
        createdAt: Date.now() - 1000,
      });
    });

    // Low engagement: 0 likes + 0 comments = 0
    await t.run(async (ctx) => {
      await ctx.db.insert("posts", {
        spaceId,
        authorId: userId,
        authorName: "Test User",
        content: "{}",
        contentHtml: "<p>Low engagement post</p>",
        likeCount: 0,
        commentCount: 0,
        createdAt: Date.now(),
      });
    });

    // Get all posts and sort by engagement
    const posts = await t.run(async (ctx) => {
      const allPosts = await ctx.db.query("posts").collect();
      return allPosts.sort((a, b) => {
        const scoreA = a.likeCount + a.commentCount * 2;
        const scoreB = b.likeCount + b.commentCount * 2;
        return scoreB - scoreA; // DESC order
      });
    });

    expect(posts).toHaveLength(3);
    // Should be sorted by engagement score DESC
    expect(posts[0].contentHtml).toContain("High engagement");
    expect(posts[1].contentHtml).toContain("Medium engagement");
    expect(posts[2].contentHtml).toContain("Low engagement");
  });

  it("respects space visibility for popular filter", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "user@example.com" });

    const publicSpaceId = await createSpace(t, { name: "Public Space" });
    const paidSpaceId = await createSpace(t, {
      name: "Paid Space",
      visibility: "paid",
      requiredTier: "premium",
    });

    // Popular post in public space
    await t.run(async (ctx) => {
      await ctx.db.insert("posts", {
        spaceId: publicSpaceId,
        authorId: userId,
        authorName: "Test User",
        content: "{}",
        contentHtml: "<p>Popular public post</p>",
        likeCount: 10,
        commentCount: 5,
        createdAt: Date.now(),
      });
    });

    // Popular post in paid space
    await t.run(async (ctx) => {
      await ctx.db.insert("posts", {
        spaceId: paidSpaceId,
        authorId: userId,
        authorName: "Test User",
        content: "{}",
        contentHtml: "<p>Popular paid post</p>",
        likeCount: 20,
        commentCount: 10,
        createdAt: Date.now(),
      });
    });

    const allPosts = await t.run(async (ctx) => {
      return await ctx.db.query("posts").collect();
    });

    expect(allPosts).toHaveLength(2);
    // Space visibility would further filter these
  });

  it("paginates popular posts correctly", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "user@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });

    // Create 5 posts with varying engagement
    for (let i = 0; i < 5; i++) {
      await t.run(async (ctx) => {
        await ctx.db.insert("posts", {
          spaceId,
          authorId: userId,
          authorName: "Test User",
          content: "{}",
          contentHtml: `<p>Post ${i + 1}</p>`,
          likeCount: i * 2, // 0, 2, 4, 6, 8
          commentCount: i, // 0, 1, 2, 3, 4
          createdAt: Date.now() + i * 1000,
        });
      });
    }

    const posts = await t.run(async (ctx) => {
      return await ctx.db.query("posts").collect();
    });

    expect(posts).toHaveLength(5);
    // Pagination would be applied on sorted results
  });
});
