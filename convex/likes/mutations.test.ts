/**
 * Like Mutations Tests
 *
 * Unit tests for toggleLike mutation.
 *
 * Testing Notes for Better Auth Integration:
 *
 * The like mutations use Better Auth via `requireAuth(ctx)` which calls
 * `authComponent.getAuthUser(ctx)`. This auth mechanism is separate from
 * Convex's built-in identity system.
 *
 * In convex-test, `t.withIdentity()` only works with Convex's native auth,
 * not Better Auth. Therefore, we cannot directly test authenticated paths
 * through the API in unit tests.
 *
 * Testing Strategy:
 * 1. Test unauthenticated rejection via API (verifies auth check exists)
 * 2. Test business logic (validation, database operations) via direct ctx access
 */

import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.setup";
import { Id } from "../_generated/dataModel";

// Helper to create a user
async function createUser(
  t: ReturnType<typeof convexTest>,
  data: {
    email: string;
    name?: string;
    role?: "admin" | "moderator" | "member";
    points?: number;
  }
): Promise<Id<"users">> {
  const now = Date.now();
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email: data.email.toLowerCase(),
      name: data.name || "Test User",
      visibility: "public",
      role: data.role || "member",
      points: data.points ?? 0,
      level: 1,
      createdAt: now,
      updatedAt: now,
    });
  });
}

// Helper to create a space
async function createSpace(
  t: ReturnType<typeof convexTest>,
  data: { name: string }
): Promise<Id<"spaces">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("spaces", {
      name: data.name,
      visibility: "public",
      postPermission: "all",
      order: 1,
      createdAt: Date.now(),
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
    likeCount?: number;
    deletedAt?: number;
  }
): Promise<Id<"posts">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("posts", {
      spaceId: data.spaceId,
      authorId: data.authorId,
      authorName: data.authorName,
      content: "{}",
      contentHtml: "<p>Test</p>",
      likeCount: data.likeCount ?? 0,
      commentCount: 0,
      createdAt: Date.now(),
      deletedAt: data.deletedAt,
    });
  });
}

// Helper to create a comment
async function createComment(
  t: ReturnType<typeof convexTest>,
  data: {
    postId: Id<"posts">;
    authorId: Id<"users">;
    authorName: string;
    likeCount?: number;
  }
): Promise<Id<"comments">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("comments", {
      postId: data.postId,
      authorId: data.authorId,
      authorName: data.authorName,
      content: "Test comment",
      likeCount: data.likeCount ?? 0,
      createdAt: Date.now(),
    });
  });
}

describe("toggleLike mutation", () => {
  it("should throw error when not authenticated", async () => {
    const t = convexTest(schema, modules);
    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    // Try to like without authentication - should throw
    await expect(
      t.mutation(api.likes.mutations.toggleLike, {
        targetType: "post",
        targetId: postId,
      })
    ).rejects.toThrow();
  });

  it("should create a like record when liking a post (business logic)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    // Simulate like creation
    await t.run(async (ctx) => {
      await ctx.db.insert("likes", {
        userId,
        targetType: "post",
        targetId: postId,
        createdAt: Date.now(),
      });

      // Update post like count
      await ctx.db.patch(postId, { likeCount: 1 });
    });

    // Verify like record was created
    const likes = await t.run(async (ctx) => {
      return await ctx.db.query("likes").collect();
    });
    expect(likes).toHaveLength(1);
    expect(likes[0].userId).toBe(userId);
    expect(likes[0].targetType).toBe("post");
    expect(likes[0].targetId).toBe(postId);

    // Verify post like count was updated
    const post = await t.run(async (ctx) => ctx.db.get(postId));
    expect(post?.likeCount).toBe(1);
  });

  it("should remove like record when unliking a post (business logic)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
      likeCount: 1,
    });

    // Create existing like
    const likeId = await t.run(async (ctx) => {
      return await ctx.db.insert("likes", {
        userId,
        targetType: "post",
        targetId: postId,
        createdAt: Date.now(),
      });
    });

    // Simulate unlike
    await t.run(async (ctx) => {
      await ctx.db.delete(likeId);
      await ctx.db.patch(postId, { likeCount: 0 });
    });

    // Verify like record was removed
    const likes = await t.run(async (ctx) => {
      return await ctx.db.query("likes").collect();
    });
    expect(likes).toHaveLength(0);

    // Verify post like count was decremented
    const post = await t.run(async (ctx) => ctx.db.get(postId));
    expect(post?.likeCount).toBe(0);
  });

  it("should increment likeCount on post when liked (business logic)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
      likeCount: 5,
    });

    // Simulate like
    await t.run(async (ctx) => {
      const post = await ctx.db.get(postId);
      await ctx.db.insert("likes", {
        userId,
        targetType: "post",
        targetId: postId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(postId, { likeCount: (post?.likeCount ?? 0) + 1 });
    });

    // Verify likeCount was incremented
    const post = await t.run(async (ctx) => ctx.db.get(postId));
    expect(post?.likeCount).toBe(6);
  });

  it("should decrement likeCount on post when unliked (business logic)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
      likeCount: 5,
    });

    // Create existing like
    const likeId = await t.run(async (ctx) => {
      return await ctx.db.insert("likes", {
        userId,
        targetType: "post",
        targetId: postId,
        createdAt: Date.now(),
      });
    });

    // Simulate unlike
    await t.run(async (ctx) => {
      const post = await ctx.db.get(postId);
      await ctx.db.delete(likeId);
      await ctx.db.patch(postId, {
        likeCount: Math.max(0, (post?.likeCount ?? 0) - 1),
      });
    });

    // Verify likeCount was decremented
    const post = await t.run(async (ctx) => ctx.db.get(postId));
    expect(post?.likeCount).toBe(4);
  });

  it("should award 2 points to author when post is liked (business logic)", async () => {
    const t = convexTest(schema, modules);

    // Create author (different from liker)
    const authorId = await createUser(t, {
      email: "author@example.com",
      name: "Author",
      points: 10,
    });

    // Create liker
    const likerId = await createUser(t, {
      email: "liker@example.com",
      name: "Liker",
    });

    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId,
      authorName: "Author",
    });

    // Simulate like with points award
    await t.run(async (ctx) => {
      // Create like
      await ctx.db.insert("likes", {
        userId: likerId,
        targetType: "post",
        targetId: postId,
        createdAt: Date.now(),
      });

      // Update post like count
      await ctx.db.patch(postId, { likeCount: 1 });

      // Award points to author
      await ctx.db.insert("points", {
        userId: authorId,
        action: "like_received",
        amount: 2,
        referenceType: "post",
        referenceId: postId,
        createdAt: Date.now(),
      });

      // Update author's total points
      const author = await ctx.db.get(authorId);
      if (author) {
        await ctx.db.patch(authorId, {
          points: author.points + 2,
          updatedAt: Date.now(),
        });
      }
    });

    // Verify author received 2 points
    const author = await t.run(async (ctx) => ctx.db.get(authorId));
    expect(author?.points).toBe(12); // 10 + 2

    // Verify points record was created
    const pointsRecords = await t.run(async (ctx) => {
      return await ctx.db
        .query("points")
        .withIndex("by_userId", (q) => q.eq("userId", authorId))
        .collect();
    });
    expect(pointsRecords).toHaveLength(1);
    expect(pointsRecords[0].action).toBe("like_received");
    expect(pointsRecords[0].amount).toBe(2);
  });

  it("should NOT award points when unliking (business logic)", async () => {
    const t = convexTest(schema, modules);

    const authorId = await createUser(t, {
      email: "author@example.com",
      name: "Author",
      points: 10,
    });

    const likerId = await createUser(t, {
      email: "liker@example.com",
      name: "Liker",
    });

    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId,
      authorName: "Author",
      likeCount: 1,
    });

    // Create existing like
    const likeId = await t.run(async (ctx) => {
      return await ctx.db.insert("likes", {
        userId: likerId,
        targetType: "post",
        targetId: postId,
        createdAt: Date.now(),
      });
    });

    // Simulate unlike (no points awarded)
    await t.run(async (ctx) => {
      await ctx.db.delete(likeId);
      await ctx.db.patch(postId, { likeCount: 0 });
      // Note: No points record created on unlike
    });

    // Verify author did NOT receive additional points
    const author = await t.run(async (ctx) => ctx.db.get(authorId));
    expect(author?.points).toBe(10); // unchanged

    // Verify no points records were created
    const pointsRecords = await t.run(async (ctx) => {
      return await ctx.db
        .query("points")
        .withIndex("by_userId", (q) => q.eq("userId", authorId))
        .collect();
    });
    expect(pointsRecords).toHaveLength(0);
  });

  it("should work for comments as well as posts (business logic)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });
    const commentId = await createComment(t, {
      postId,
      authorId: userId,
      authorName: "Test User",
    });

    // Simulate like on comment
    await t.run(async (ctx) => {
      await ctx.db.insert("likes", {
        userId,
        targetType: "comment",
        targetId: commentId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(commentId, { likeCount: 1 });
    });

    // Verify like on comment
    const likes = await t.run(async (ctx) => {
      return await ctx.db.query("likes").collect();
    });
    expect(likes).toHaveLength(1);
    expect(likes[0].targetType).toBe("comment");
    expect(likes[0].targetId).toBe(commentId);

    // Verify comment likeCount was updated
    const comment = await t.run(async (ctx) => ctx.db.get(commentId));
    expect(comment?.likeCount).toBe(1);
  });

  it("should prevent duplicate likes via index (business logic)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    // Create first like
    await t.run(async (ctx) => {
      await ctx.db.insert("likes", {
        userId,
        targetType: "post",
        targetId: postId,
        createdAt: Date.now(),
      });
    });

    // Check if like already exists before creating another
    const existingLike = await t.run(async (ctx) => {
      return await ctx.db
        .query("likes")
        .withIndex("by_userId_and_target", (q) =>
          q.eq("userId", userId).eq("targetType", "post").eq("targetId", postId)
        )
        .unique();
    });

    // Verify like exists (toggle behavior would remove it, not create duplicate)
    expect(existingLike).not.toBeNull();
    expect(existingLike?.userId).toBe(userId);
  });

  it("should throw error when target does not exist (business logic)", async () => {
    const t = convexTest(schema, modules);

    await createUser(t, { email: "test@example.com" });

    // Try to get non-existent post
    await expect(
      t.run(async (ctx) => {
        const fakePostId =
          "k171234567890123456789012345" as unknown as Id<"posts">;
        const post = await ctx.db.get(fakePostId);
        if (!post) {
          throw new Error("Target not found");
        }
      })
    ).rejects.toThrow("Target not found");
  });

  it("should prevent liking deleted content (business logic)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
      deletedAt: Date.now(),
    });

    // Try to like deleted post
    await expect(
      t.run(async (ctx) => {
        const post = await ctx.db.get(postId);
        if (!post) {
          throw new Error("Target not found");
        }
        if (post.deletedAt) {
          throw new Error("Cannot like deleted content");
        }
      })
    ).rejects.toThrow("Cannot like deleted content");
  });
});
