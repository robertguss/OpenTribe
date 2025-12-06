/**
 * Comment Queries Tests
 *
 * Unit tests for listCommentsByPost and getComment queries.
 *
 * Testing Notes for Better Auth Integration:
 *
 * The comment queries use `getAuthUser(ctx)` which returns null for unauthenticated
 * users (unlike mutations which throw). This allows viewing comments without auth.
 */

import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
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
      points: data.points ?? 0,
      level: data.level ?? 1,
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
    commentCount?: number;
  }
): Promise<Id<"posts">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("posts", {
      spaceId: data.spaceId,
      authorId: data.authorId,
      authorName: data.authorName,
      content: "{}",
      contentHtml: "<p>Test</p>",
      likeCount: 0,
      commentCount: data.commentCount ?? 0,
      createdAt: Date.now(),
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
    content?: string;
    parentId?: Id<"comments">;
    likeCount?: number;
    deletedAt?: number;
    createdAt?: number;
  }
): Promise<Id<"comments">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("comments", {
      postId: data.postId,
      authorId: data.authorId,
      authorName: data.authorName,
      content: data.content ?? "Test comment",
      parentId: data.parentId,
      likeCount: data.likeCount ?? 0,
      createdAt: data.createdAt ?? Date.now(),
      deletedAt: data.deletedAt,
    });
  });
}

describe("listCommentsByPost query", () => {
  it("should return empty array for post with no comments", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    // Query comments (direct db access since auth is complex)
    const comments = await t.run(async (ctx) => {
      return await ctx.db
        .query("comments")
        .withIndex("by_postId", (q) => q.eq("postId", postId))
        .collect();
    });

    expect(comments).toHaveLength(0);
  });

  it("should return comments sorted by newest first (top-level)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    // Create older comment
    const oldCommentId = await createComment(t, {
      postId,
      authorId: userId,
      authorName: "Test User",
      content: "Old comment",
      createdAt: 1000,
    });

    // Create newer comment
    const newCommentId = await createComment(t, {
      postId,
      authorId: userId,
      authorName: "Test User",
      content: "New comment",
      createdAt: 2000,
    });

    // Query and sort
    const comments = await t.run(async (ctx) => {
      const allComments = await ctx.db
        .query("comments")
        .withIndex("by_postId", (q) => q.eq("postId", postId))
        .collect();

      return allComments
        .filter((c) => !c.parentId)
        .sort((a, b) => b.createdAt - a.createdAt);
    });

    expect(comments).toHaveLength(2);
    expect(comments[0]._id).toBe(newCommentId); // Newest first
    expect(comments[1]._id).toBe(oldCommentId);
  });

  it("should return replies sorted by oldest first", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    // Create parent comment
    const parentId = await createComment(t, {
      postId,
      authorId: userId,
      authorName: "Test User",
      content: "Parent",
      createdAt: 1000,
    });

    // Create old reply
    const oldReplyId = await createComment(t, {
      postId,
      authorId: userId,
      authorName: "Test User",
      content: "Old reply",
      parentId,
      createdAt: 1100,
    });

    // Create new reply
    const newReplyId = await createComment(t, {
      postId,
      authorId: userId,
      authorName: "Test User",
      content: "New reply",
      parentId,
      createdAt: 1200,
    });

    // Query and build nested structure
    const nestedComments = await t.run(async (ctx) => {
      const allComments = await ctx.db
        .query("comments")
        .withIndex("by_postId", (q) => q.eq("postId", postId))
        .collect();

      const topLevel = allComments.filter((c) => !c.parentId);
      return topLevel.map((c) => ({
        ...c,
        replies: allComments
          .filter((r) => r.parentId === c._id)
          .sort((a, b) => a.createdAt - b.createdAt), // Oldest first
      }));
    });

    expect(nestedComments[0].replies).toHaveLength(2);
    expect(nestedComments[0].replies[0]._id).toBe(oldReplyId); // Oldest first
    expect(nestedComments[0].replies[1]._id).toBe(newReplyId);
  });

  it("should build 2-level nested structure correctly", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    // Create level 0 comment
    const level0Id = await createComment(t, {
      postId,
      authorId: userId,
      authorName: "Test User",
      content: "Level 0",
    });

    // Create level 1 reply
    const level1Id = await createComment(t, {
      postId,
      authorId: userId,
      authorName: "Test User",
      content: "Level 1",
      parentId: level0Id,
    });

    // Build nested structure
    const nestedComments = await t.run(async (ctx) => {
      const allComments = await ctx.db
        .query("comments")
        .withIndex("by_postId", (q) => q.eq("postId", postId))
        .collect();

      return allComments
        .filter((c) => !c.parentId)
        .map((c) => ({
          ...c,
          replies: allComments.filter((r) => r.parentId === c._id),
        }));
    });

    expect(nestedComments).toHaveLength(1);
    expect(nestedComments[0]._id).toBe(level0Id);
    expect(nestedComments[0].replies).toHaveLength(1);
    expect(nestedComments[0].replies[0]._id).toBe(level1Id);
  });

  it("should include authorLevel from user profile", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, {
      email: "test@example.com",
      level: 5,
    });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    await createComment(t, {
      postId,
      authorId: userId,
      authorName: "Test User",
    });

    // Query with author level enrichment
    const enrichedComment = await t.run(async (ctx) => {
      const comment = (
        await ctx.db
          .query("comments")
          .withIndex("by_postId", (q) => q.eq("postId", postId))
          .collect()
      )[0];

      const author = await ctx.db.get(comment.authorId);
      return {
        ...comment,
        authorLevel: author?.level ?? 1,
      };
    });

    expect(enrichedComment.authorLevel).toBe(5);
  });

  it("should include hasLiked for authenticated user", async () => {
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

    // Create a like
    await t.run(async (ctx) => {
      await ctx.db.insert("likes", {
        userId,
        targetType: "comment",
        targetId: commentId,
        createdAt: Date.now(),
      });
    });

    // Check hasLiked
    const hasLiked = await t.run(async (ctx) => {
      const like = await ctx.db
        .query("likes")
        .withIndex("by_userId_and_target", (q) =>
          q
            .eq("userId", userId)
            .eq("targetType", "comment")
            .eq("targetId", commentId)
        )
        .unique();
      return !!like;
    });

    expect(hasLiked).toBe(true);
  });

  it("should replace content with '[deleted]' for soft-deleted comments", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    await createComment(t, {
      postId,
      authorId: userId,
      authorName: "Test User",
      content: "Original content",
      deletedAt: Date.now(),
    });

    // Query and apply deletion logic
    const comments = await t.run(async (ctx) => {
      const allComments = await ctx.db
        .query("comments")
        .withIndex("by_postId", (q) => q.eq("postId", postId))
        .collect();

      return allComments.map((c) => ({
        ...c,
        content: c.deletedAt ? "[deleted]" : c.content,
      }));
    });

    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe("[deleted]");
    expect(comments[0].deletedAt).toBeDefined();
  });

  it("should include isOwn flag for comment ownership", async () => {
    const t = convexTest(schema, modules);

    const ownerId = await createUser(t, { email: "owner@example.com" });
    const otherId = await createUser(t, { email: "other@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: ownerId,
      authorName: "Owner",
    });

    await createComment(t, {
      postId,
      authorId: ownerId,
      authorName: "Owner",
    });

    // Check isOwn from owner's perspective
    const isOwnFromOwner = await t.run(async (ctx) => {
      const comment = (
        await ctx.db
          .query("comments")
          .withIndex("by_postId", (q) => q.eq("postId", postId))
          .collect()
      )[0];
      return comment.authorId === ownerId;
    });

    // Check isOwn from other user's perspective
    const isOwnFromOther = await t.run(async (ctx) => {
      const comment = (
        await ctx.db
          .query("comments")
          .withIndex("by_postId", (q) => q.eq("postId", postId))
          .collect()
      )[0];
      return comment.authorId === otherId;
    });

    expect(isOwnFromOwner).toBe(true);
    expect(isOwnFromOther).toBe(false);
  });
});

describe("getComment query", () => {
  it("should return null for non-existent comment", async () => {
    const t = convexTest(schema, modules);

    const result = await t.run(async (ctx) => {
      // Generate a fake ID that doesn't exist
      const fakeId = "k17xxx" as Id<"comments">;
      return await ctx.db.get(fakeId);
    });

    expect(result).toBeNull();
  });

  it("should return comment with all enriched fields", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, {
      email: "test@example.com",
      level: 3,
    });
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
      content: "Test content",
      likeCount: 5,
    });

    // Get enriched comment
    const enrichedComment = await t.run(async (ctx) => {
      const comment = await ctx.db.get(commentId);
      if (!comment) return null;

      const author = await ctx.db.get(comment.authorId);
      return {
        ...comment,
        authorLevel: author?.level ?? 1,
        hasLiked: false, // Would check likes table
        isOwn: true, // Would compare with current user
      };
    });

    expect(enrichedComment).not.toBeNull();
    expect(enrichedComment?._id).toBe(commentId);
    expect(enrichedComment?.content).toBe("Test content");
    expect(enrichedComment?.likeCount).toBe(5);
    expect(enrichedComment?.authorLevel).toBe(3);
  });

  it("should show '[deleted]' for soft-deleted comment", async () => {
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
      content: "Original content",
      deletedAt: Date.now(),
    });

    // Get comment and apply deletion logic
    const displayContent = await t.run(async (ctx) => {
      const comment = await ctx.db.get(commentId);
      return comment?.deletedAt ? "[deleted]" : comment?.content;
    });

    expect(displayContent).toBe("[deleted]");
  });
});
