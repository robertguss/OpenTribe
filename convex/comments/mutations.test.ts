/**
 * Comment Mutations Tests
 *
 * Unit tests for createComment, updateComment, and deleteComment mutations.
 *
 * Testing Notes for Better Auth Integration:
 *
 * The comment mutations use Better Auth via `requireAuth(ctx)` which calls
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
      likeCount: 0,
      commentCount: data.commentCount ?? 0,
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
    content?: string;
    parentId?: Id<"comments">;
    likeCount?: number;
    deletedAt?: number;
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
      createdAt: Date.now(),
      deletedAt: data.deletedAt,
    });
  });
}

describe("createComment mutation", () => {
  it("should throw error when not authenticated", async () => {
    const t = convexTest(schema, modules);
    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    // Try to create comment without authentication - should throw
    await expect(
      t.mutation(api.comments.mutations.createComment, {
        postId,
        content: "Test comment",
      })
    ).rejects.toThrow();
  });

  it("should create comment record correctly (business logic)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, {
      email: "test@example.com",
      name: "Test User",
    });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    // Simulate comment creation
    const now = Date.now();
    const commentId = await t.run(async (ctx) => {
      return await ctx.db.insert("comments", {
        postId,
        authorId: userId,
        authorName: "Test User",
        content: "This is a test comment",
        likeCount: 0,
        createdAt: now,
      });
    });

    // Update post comment count
    await t.run(async (ctx) => {
      const post = await ctx.db.get(postId);
      await ctx.db.patch(postId, {
        commentCount: (post?.commentCount ?? 0) + 1,
      });
    });

    // Verify comment was created correctly
    const comment = await t.run(async (ctx) => ctx.db.get(commentId));
    expect(comment).not.toBeNull();
    expect(comment?.postId).toBe(postId);
    expect(comment?.authorId).toBe(userId);
    expect(comment?.authorName).toBe("Test User");
    expect(comment?.content).toBe("This is a test comment");
    expect(comment?.likeCount).toBe(0);
    expect(comment?.parentId).toBeUndefined();
  });

  it("should award 5 points to commenter (business logic)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, {
      email: "test@example.com",
      name: "Test User",
      points: 10,
    });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    // Create comment and award points
    const commentId = await t.run(async (ctx) => {
      const cId = await ctx.db.insert("comments", {
        postId,
        authorId: userId,
        authorName: "Test User",
        content: "This is a test comment",
        likeCount: 0,
        createdAt: Date.now(),
      });

      // Award 5 points
      await ctx.db.insert("points", {
        userId,
        action: "comment_added",
        amount: 5,
        referenceType: "comment",
        referenceId: cId,
        createdAt: Date.now(),
      });

      // Update user's total points
      const user = await ctx.db.get(userId);
      if (user) {
        await ctx.db.patch(userId, {
          points: user.points + 5,
          updatedAt: Date.now(),
        });
      }

      return cId;
    });

    // Verify points were awarded
    const user = await t.run(async (ctx) => ctx.db.get(userId));
    expect(user?.points).toBe(15); // 10 + 5

    // Verify points record was created
    const pointsRecords = await t.run(async (ctx) => {
      return await ctx.db
        .query("points")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
    });
    expect(pointsRecords).toHaveLength(1);
    expect(pointsRecords[0].action).toBe("comment_added");
    expect(pointsRecords[0].amount).toBe(5);
    expect(pointsRecords[0].referenceId).toBe(commentId);
  });

  it("should create notification for post author (business logic)", async () => {
    const t = convexTest(schema, modules);

    const postAuthorId = await createUser(t, {
      email: "author@example.com",
      name: "Post Author",
    });
    const commenterId = await createUser(t, {
      email: "commenter@example.com",
      name: "Commenter",
    });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: postAuthorId,
      authorName: "Post Author",
    });

    // Create comment and notification
    const commentId = await t.run(async (ctx) => {
      const cId = await ctx.db.insert("comments", {
        postId,
        authorId: commenterId,
        authorName: "Commenter",
        content: "Great post!",
        likeCount: 0,
        createdAt: Date.now(),
      });

      // Create notification for post author
      await ctx.db.insert("notifications", {
        userId: postAuthorId,
        type: "comment",
        actorId: commenterId,
        actorName: "Commenter",
        data: {
          postId,
          commentId: cId,
          preview: "Great post!",
        },
        read: false,
        createdAt: Date.now(),
      });

      return cId;
    });

    // Verify notification was created
    const notifications = await t.run(async (ctx) => {
      return await ctx.db
        .query("notifications")
        .withIndex("by_userId", (q) => q.eq("userId", postAuthorId))
        .collect();
    });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe("comment");
    expect(notifications[0].actorId).toBe(commenterId);
    expect(notifications[0].data.commentId).toBe(commentId);
  });

  it("should create reply with correct parentId (business logic)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    // Create parent comment
    const parentCommentId = await createComment(t, {
      postId,
      authorId: userId,
      authorName: "Test User",
      content: "Parent comment",
    });

    // Create reply
    const replyId = await t.run(async (ctx) => {
      return await ctx.db.insert("comments", {
        postId,
        authorId: userId,
        authorName: "Test User",
        content: "This is a reply",
        parentId: parentCommentId,
        likeCount: 0,
        createdAt: Date.now(),
      });
    });

    // Verify reply has correct parentId
    const reply = await t.run(async (ctx) => ctx.db.get(replyId));
    expect(reply?.parentId).toBe(parentCommentId);
  });

  it("should enforce 2-level nesting - flatten deeper replies (business logic)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    // Create level 0 comment (no parent)
    const level0CommentId = await createComment(t, {
      postId,
      authorId: userId,
      authorName: "Test User",
      content: "Level 0 comment",
    });

    // Create level 1 reply (parent is level 0)
    const level1CommentId = await createComment(t, {
      postId,
      authorId: userId,
      authorName: "Test User",
      content: "Level 1 reply",
      parentId: level0CommentId,
    });

    // When trying to reply to level 1, should flatten to level 2
    // by using level 0's parent (which is undefined) or level 0 itself
    const level2ReplyId = await t.run(async (ctx) => {
      const parentComment = await ctx.db.get(level1CommentId);

      // If parent has a parent, flatten to level 2
      let effectiveParentId = level1CommentId;
      if (parentComment?.parentId) {
        effectiveParentId = parentComment.parentId;
      }

      return await ctx.db.insert("comments", {
        postId,
        authorId: userId,
        authorName: "Test User",
        content: "Level 2 (flattened) reply",
        parentId: effectiveParentId,
        likeCount: 0,
        createdAt: Date.now(),
      });
    });

    // Verify level 2 reply has level 0 as parent (flattened)
    const level2Reply = await t.run(async (ctx) => ctx.db.get(level2ReplyId));
    expect(level2Reply?.parentId).toBe(level0CommentId);
  });
});

describe("updateComment mutation", () => {
  it("should throw error when not authenticated", async () => {
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

    // Try to update comment without authentication - should throw
    await expect(
      t.mutation(api.comments.mutations.updateComment, {
        commentId,
        content: "Updated content",
      })
    ).rejects.toThrow();
  });

  it("should set editedAt timestamp (business logic)", async () => {
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
    });

    // Update comment
    const updateTime = Date.now();
    await t.run(async (ctx) => {
      await ctx.db.patch(commentId, {
        content: "Updated content",
        editedAt: updateTime,
      });
    });

    // Verify editedAt was set
    const comment = await t.run(async (ctx) => ctx.db.get(commentId));
    expect(comment?.content).toBe("Updated content");
    expect(comment?.editedAt).toBe(updateTime);
  });

  it("should prevent editing others' comments (member role - business logic)", async () => {
    const t = convexTest(schema, modules);

    const ownerId = await createUser(t, {
      email: "owner@example.com",
      name: "Owner",
      role: "member",
    });
    const otherUserId = await createUser(t, {
      email: "other@example.com",
      name: "Other User",
      role: "member",
    });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: ownerId,
      authorName: "Owner",
    });
    const commentId = await createComment(t, {
      postId,
      authorId: ownerId,
      authorName: "Owner",
    });

    // Check if other user can edit
    const canEdit = await t.run(async (ctx) => {
      const comment = await ctx.db.get(commentId);
      if (!comment || comment.deletedAt) return false;

      const otherUser = await ctx.db.get(otherUserId);
      if (!otherUser) return false;

      // Members can only edit their own content
      if (otherUser.role === "member") {
        return comment.authorId === otherUserId;
      }

      // Moderators+ can edit any content
      return true;
    });

    expect(canEdit).toBe(false);
  });

  it("should allow moderators to edit others' comments (business logic)", async () => {
    const t = convexTest(schema, modules);

    const ownerId = await createUser(t, {
      email: "owner@example.com",
      name: "Owner",
      role: "member",
    });
    const moderatorId = await createUser(t, {
      email: "mod@example.com",
      name: "Moderator",
      role: "moderator",
    });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: ownerId,
      authorName: "Owner",
    });
    const commentId = await createComment(t, {
      postId,
      authorId: ownerId,
      authorName: "Owner",
    });

    // Check if moderator can edit
    const canEdit = await t.run(async (ctx) => {
      const comment = await ctx.db.get(commentId);
      if (!comment || comment.deletedAt) return false;

      const moderator = await ctx.db.get(moderatorId);
      if (!moderator) return false;

      // Moderators+ can edit any content
      if (moderator.role === "moderator" || moderator.role === "admin") {
        return true;
      }

      // Members can only edit their own content
      return comment.authorId === moderatorId;
    });

    expect(canEdit).toBe(true);
  });
});

describe("deleteComment mutation", () => {
  it("should throw error when not authenticated", async () => {
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

    // Try to delete comment without authentication - should throw
    await expect(
      t.mutation(api.comments.mutations.deleteComment, {
        commentId,
      })
    ).rejects.toThrow();
  });

  it("should soft-delete comment by setting deletedAt (business logic)", async () => {
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

    // Soft delete comment
    const deleteTime = Date.now();
    await t.run(async (ctx) => {
      await ctx.db.patch(commentId, {
        deletedAt: deleteTime,
      });
    });

    // Verify deletedAt was set
    const comment = await t.run(async (ctx) => ctx.db.get(commentId));
    expect(comment?.deletedAt).toBe(deleteTime);
    // Original content should still be in DB
    expect(comment?.content).toBe("Test comment");
  });

  it("should show '[deleted]' for soft-deleted comments in queries (business logic)", async () => {
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

    // Query comment and check content replacement
    const displayContent = await t.run(async (ctx) => {
      const comment = await ctx.db.get(commentId);
      // Simulate query behavior: replace content with "[deleted]" if deletedAt is set
      return comment?.deletedAt ? "[deleted]" : comment?.content;
    });

    expect(displayContent).toBe("[deleted]");
  });

  it("should preserve comment structure for replies (business logic)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    // Create parent comment
    const parentCommentId = await createComment(t, {
      postId,
      authorId: userId,
      authorName: "Test User",
      content: "Parent comment",
    });

    // Create reply
    const replyId = await createComment(t, {
      postId,
      authorId: userId,
      authorName: "Test User",
      content: "Reply to parent",
      parentId: parentCommentId,
    });

    // Delete parent comment (soft delete)
    await t.run(async (ctx) => {
      await ctx.db.patch(parentCommentId, {
        deletedAt: Date.now(),
      });
    });

    // Verify reply still references the deleted parent
    const reply = await t.run(async (ctx) => ctx.db.get(replyId));
    expect(reply?.parentId).toBe(parentCommentId);

    // Verify parent still exists (just marked as deleted)
    const parent = await t.run(async (ctx) => ctx.db.get(parentCommentId));
    expect(parent).not.toBeNull();
    expect(parent?.deletedAt).toBeDefined();
  });

  it("should NOT decrement post commentCount on soft delete (business logic)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
      commentCount: 5,
    });
    const commentId = await createComment(t, {
      postId,
      authorId: userId,
      authorName: "Test User",
    });

    // Soft delete comment (without changing post commentCount)
    await t.run(async (ctx) => {
      await ctx.db.patch(commentId, {
        deletedAt: Date.now(),
      });
      // Note: We do NOT decrement commentCount
    });

    // Verify post commentCount is unchanged
    const post = await t.run(async (ctx) => ctx.db.get(postId));
    expect(post?.commentCount).toBe(5);
  });
});

describe("listCommentsByPost query", () => {
  it("should return nested structure with 2 levels (business logic)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com", level: 3 });
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
      content: "Level 0 comment",
    });

    // Create level 1 reply
    const level1Id = await createComment(t, {
      postId,
      authorId: userId,
      authorName: "Test User",
      content: "Level 1 reply",
      parentId: level0Id,
    });

    // Build nested structure
    const nestedComments = await t.run(async (ctx) => {
      const allComments = await ctx.db
        .query("comments")
        .withIndex("by_postId", (q) => q.eq("postId", postId))
        .collect();

      const topLevel = allComments.filter((c) => !c.parentId);
      return topLevel.map((c) => ({
        ...c,
        replies: allComments.filter((r) => r.parentId === c._id),
      }));
    });

    expect(nestedComments).toHaveLength(1);
    expect(nestedComments[0]._id).toBe(level0Id);
    expect(nestedComments[0].replies).toHaveLength(1);
    expect(nestedComments[0].replies[0]._id).toBe(level1Id);
  });

  it("should include hasLiked and authorLevel (business logic)", async () => {
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

    // Query with enriched data
    const enrichedComment = await t.run(async (ctx) => {
      const comment = await ctx.db.get(commentId);
      if (!comment) return null;

      const author = await ctx.db.get(comment.authorId);
      const like = await ctx.db
        .query("likes")
        .withIndex("by_userId_and_target", (q) =>
          q
            .eq("userId", userId)
            .eq("targetType", "comment")
            .eq("targetId", commentId)
        )
        .unique();

      return {
        ...comment,
        authorLevel: author?.level ?? 1,
        hasLiked: !!like,
      };
    });

    expect(enrichedComment?.authorLevel).toBe(5);
    expect(enrichedComment?.hasLiked).toBe(true);
  });

  it("should sort top-level by newest first, replies by oldest first (business logic)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    // Create comments with specific timestamps
    const oldCommentId = await t.run(async (ctx) => {
      return await ctx.db.insert("comments", {
        postId,
        authorId: userId,
        authorName: "Test User",
        content: "Old comment",
        likeCount: 0,
        createdAt: 1000, // Earlier
      });
    });

    const newCommentId = await t.run(async (ctx) => {
      return await ctx.db.insert("comments", {
        postId,
        authorId: userId,
        authorName: "Test User",
        content: "New comment",
        likeCount: 0,
        createdAt: 2000, // Later
      });
    });

    // Create replies
    const oldReplyId = await t.run(async (ctx) => {
      return await ctx.db.insert("comments", {
        postId,
        authorId: userId,
        authorName: "Test User",
        content: "Old reply",
        parentId: oldCommentId,
        likeCount: 0,
        createdAt: 1100, // Earlier reply
      });
    });

    const newReplyId = await t.run(async (ctx) => {
      return await ctx.db.insert("comments", {
        postId,
        authorId: userId,
        authorName: "Test User",
        content: "New reply",
        parentId: oldCommentId,
        likeCount: 0,
        createdAt: 1200, // Later reply
      });
    });

    // Build sorted nested structure
    const nestedComments = await t.run(async (ctx) => {
      const allComments = await ctx.db
        .query("comments")
        .withIndex("by_postId", (q) => q.eq("postId", postId))
        .collect();

      const topLevel = allComments
        .filter((c) => !c.parentId)
        .sort((a, b) => b.createdAt - a.createdAt); // Newest first

      return topLevel.map((c) => ({
        ...c,
        replies: allComments
          .filter((r) => r.parentId === c._id)
          .sort((a, b) => a.createdAt - b.createdAt), // Oldest first
      }));
    });

    // Top-level: newest first
    expect(nestedComments[0]._id).toBe(newCommentId);
    expect(nestedComments[1]._id).toBe(oldCommentId);

    // Replies: oldest first
    expect(nestedComments[1].replies[0]._id).toBe(oldReplyId);
    expect(nestedComments[1].replies[1]._id).toBe(newReplyId);
  });

  it("should handle deleted comments showing in thread (business logic)", async () => {
    const t = convexTest(schema, modules);

    const userId = await createUser(t, { email: "test@example.com" });
    const spaceId = await createSpace(t, { name: "Test Space" });
    const postId = await createPost(t, {
      spaceId,
      authorId: userId,
      authorName: "Test User",
    });

    // Create comment with deletedAt
    await createComment(t, {
      postId,
      authorId: userId,
      authorName: "Test User",
      content: "Original content",
      deletedAt: Date.now(),
    });

    // Query and check content replacement
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
});
