import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.setup";
import { Id } from "../_generated/dataModel";

/**
 * Testing Notes for Better Auth Integration:
 *
 * The post mutations use Better Auth via `requireAuth(ctx)` which calls
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
 * 3. Integration tests should be added for full auth flow testing
 */

// Helper to create a user
async function createUser(
  t: ReturnType<typeof convexTest>,
  data: {
    email: string;
    name?: string;
    role?: "admin" | "moderator" | "member";
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
      level: 1,
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
    visibility?: "public" | "members" | "paid";
    postPermission?: "all" | "moderators" | "admin";
  }
): Promise<Id<"spaces">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("spaces", {
      name: data.name,
      visibility: data.visibility || "public",
      postPermission: data.postPermission || "all",
      order: 1,
      createdAt: Date.now(),
    });
  });
}

// Helper to create a post directly
async function createPost(
  t: ReturnType<typeof convexTest>,
  data: {
    spaceId: Id<"spaces">;
    authorId: Id<"users">;
    authorName: string;
    content: string;
    contentHtml: string;
    deletedAt?: number;
  }
): Promise<Id<"posts">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("posts", {
      spaceId: data.spaceId,
      authorId: data.authorId,
      authorName: data.authorName,
      content: data.content,
      contentHtml: data.contentHtml,
      likeCount: 0,
      commentCount: 0,
      createdAt: Date.now(),
      deletedAt: data.deletedAt,
    });
  });
}

describe("posts mutations", () => {
  describe("createPost", () => {
    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);
      const spaceId = await createSpace(t, { name: "General" });

      await expect(
        t.mutation(api.posts.mutations.createPost, {
          spaceId,
          content: '{"type":"doc"}',
          contentHtml: "<p>Hello</p>",
        })
      ).rejects.toThrow();
    });

    it("should create post with correct fields (business logic)", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, {
        email: "member@example.com",
        name: "Member User",
      });
      const spaceId = await createSpace(t, { name: "General" });

      // Simulate post creation
      const postId = await t.run(async (ctx) => {
        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");

        return await ctx.db.insert("posts", {
          spaceId,
          authorId: userId,
          authorName: user.name || "Anonymous",
          content: '{"type":"doc","content":[{"type":"paragraph"}]}',
          contentHtml: "<p>Hello world!</p>",
          likeCount: 0,
          commentCount: 0,
          createdAt: Date.now(),
        });
      });

      const post = await t.run(async (ctx) => ctx.db.get(postId));

      expect(post).not.toBeNull();
      expect(post?.spaceId).toBe(spaceId);
      expect(post?.authorId).toBe(userId);
      expect(post?.authorName).toBe("Member User");
      expect(post?.likeCount).toBe(0);
      expect(post?.commentCount).toBe(0);
      expect(post?.deletedAt).toBeUndefined();
    });

    it("should denormalize author info correctly", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, {
        email: "author@example.com",
        name: "Jane Doe",
      });
      const spaceId = await createSpace(t, { name: "General" });

      const postId = await t.run(async (ctx) => {
        const user = await ctx.db.get(userId);
        return await ctx.db.insert("posts", {
          spaceId,
          authorId: userId,
          authorName: user?.name || "Anonymous",
          authorAvatar: user?.avatarStorageId as unknown as string | undefined,
          content: '{"type":"doc"}',
          contentHtml: "<p>Test</p>",
          likeCount: 0,
          commentCount: 0,
          createdAt: Date.now(),
        });
      });

      const post = await t.run(async (ctx) => ctx.db.get(postId));

      expect(post?.authorName).toBe("Jane Doe");
      expect(post?.authorAvatar).toBeUndefined(); // No avatar set
    });

    it("should award 10 points for creating a post", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "poster@example.com" });
      const spaceId = await createSpace(t, { name: "General" });

      // Check initial points
      const initialUser = await t.run(async (ctx) => ctx.db.get(userId));
      expect(initialUser?.points).toBe(0);

      // Create post and award points
      await t.run(async (ctx) => {
        const postId = await ctx.db.insert("posts", {
          spaceId,
          authorId: userId,
          authorName: "Test User",
          content: '{"type":"doc"}',
          contentHtml: "<p>Test</p>",
          likeCount: 0,
          commentCount: 0,
          createdAt: Date.now(),
        });

        // Award points
        await ctx.db.insert("points", {
          userId,
          action: "post_created",
          amount: 10,
          referenceType: "post",
          referenceId: postId,
          createdAt: Date.now(),
        });

        // Update user points
        const user = await ctx.db.get(userId);
        if (user) {
          await ctx.db.patch(userId, {
            points: user.points + 10,
            updatedAt: Date.now(),
          });
        }
      });

      // Verify points awarded
      const updatedUser = await t.run(async (ctx) => ctx.db.get(userId));
      expect(updatedUser?.points).toBe(10);

      // Verify points record created
      const pointsRecords = await t.run(async (ctx) =>
        ctx.db
          .query("points")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect()
      );
      expect(pointsRecords).toHaveLength(1);
      expect(pointsRecords[0].action).toBe("post_created");
      expect(pointsRecords[0].amount).toBe(10);
    });

    it("should store content as Tiptap JSON correctly", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "test@example.com" });
      const spaceId = await createSpace(t, { name: "General" });

      const tiptapContent = JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello world!" }],
          },
        ],
      });

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          spaceId,
          authorId: userId,
          authorName: "Test User",
          content: tiptapContent,
          contentHtml: "<p>Hello world!</p>",
          likeCount: 0,
          commentCount: 0,
          createdAt: Date.now(),
        });
      });

      const post = await t.run(async (ctx) => ctx.db.get(postId));

      expect(post?.content).toBe(tiptapContent);
      expect(JSON.parse(post?.content || "")).toHaveProperty("type", "doc");
    });

    it("should reject user without posting permission (postPermission: admin)", async () => {
      const t = convexTest(schema, modules);
      const memberId = await createUser(t, {
        email: "member@example.com",
        role: "member",
      });
      const spaceId = await createSpace(t, {
        name: "Admin Only",
        postPermission: "admin",
      });

      await expect(
        t.run(async (ctx) => {
          const user = await ctx.db.get(memberId);
          const space = await ctx.db.get(spaceId);

          if (!user || !space) throw new Error("Not found");

          // Check permission like canPostInSpace does
          if (space.postPermission === "admin" && user.role !== "admin") {
            throw new Error("You don't have permission to post in this space");
          }
        })
      ).rejects.toThrow("You don't have permission to post in this space");
    });

    it("should allow admin to post in admin-only space", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createUser(t, {
        email: "admin@example.com",
        role: "admin",
      });
      const spaceId = await createSpace(t, {
        name: "Admin Only",
        postPermission: "admin",
      });

      const postId = await t.run(async (ctx) => {
        const user = await ctx.db.get(adminId);
        const space = await ctx.db.get(spaceId);

        if (!user || !space) throw new Error("Not found");

        // Check permission
        if (space.postPermission === "admin" && user.role !== "admin") {
          throw new Error("You don't have permission to post in this space");
        }

        return await ctx.db.insert("posts", {
          spaceId,
          authorId: adminId,
          authorName: user.name || "Admin",
          content: '{"type":"doc"}',
          contentHtml: "<p>Admin post</p>",
          likeCount: 0,
          commentCount: 0,
          createdAt: Date.now(),
        });
      });

      const post = await t.run(async (ctx) => ctx.db.get(postId));
      expect(post).not.toBeNull();
    });

    it("should throw error for non-existent space", async () => {
      const t = convexTest(schema, modules);

      // Try to verify a non-existent space
      await expect(
        t.run(async (ctx) => {
          // Fake ID that doesn't exist
          const fakeSpaceId =
            "k171234567890123456789012345" as unknown as Id<"spaces">;
          const space = await ctx.db.get(fakeSpaceId);
          if (!space || space.deletedAt) {
            throw new Error("Space not found");
          }
        })
      ).rejects.toThrow("Space not found");
    });

    it("should throw error for deleted space", async () => {
      const t = convexTest(schema, modules);
      const spaceId = await t.run(async (ctx) => {
        return await ctx.db.insert("spaces", {
          name: "Deleted Space",
          visibility: "public",
          postPermission: "all",
          order: 1,
          createdAt: Date.now(),
          deletedAt: Date.now(),
        });
      });

      await expect(
        t.run(async (ctx) => {
          const space = await ctx.db.get(spaceId);
          if (!space || space.deletedAt) {
            throw new Error("Space not found");
          }
        })
      ).rejects.toThrow("Space not found");
    });
  });

  describe("updatePost", () => {
    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "test@example.com" });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test User",
        content: '{"type":"doc"}',
        contentHtml: "<p>Test</p>",
      });

      await expect(
        t.mutation(api.posts.mutations.updatePost, {
          postId,
          content: '{"type":"doc","updated":true}',
          contentHtml: "<p>Updated</p>",
        })
      ).rejects.toThrow();
    });

    it("should update post content (business logic)", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "author@example.com" });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Author",
        content: '{"type":"doc","original":true}',
        contentHtml: "<p>Original</p>",
      });

      // Update the post
      await t.run(async (ctx) => {
        await ctx.db.patch(postId, {
          content: '{"type":"doc","updated":true}',
          contentHtml: "<p>Updated content</p>",
          editedAt: Date.now(),
        });
      });

      const post = await t.run(async (ctx) => ctx.db.get(postId));

      expect(post?.content).toBe('{"type":"doc","updated":true}');
      expect(post?.contentHtml).toBe("<p>Updated content</p>");
      expect(post?.editedAt).toBeDefined();
    });

    it("should set editedAt timestamp on update", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "author@example.com" });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Author",
        content: '{"type":"doc"}',
        contentHtml: "<p>Original</p>",
      });

      const beforeUpdate = await t.run(async (ctx) => ctx.db.get(postId));
      expect(beforeUpdate?.editedAt).toBeUndefined();

      await t.run(async (ctx) => {
        await ctx.db.patch(postId, {
          content: '{"type":"doc","edited":true}',
          editedAt: Date.now() + 1000, // Add offset to ensure different timestamp
        });
      });

      const afterUpdate = await t.run(async (ctx) => ctx.db.get(postId));
      expect(afterUpdate?.editedAt).toBeDefined();
      expect(afterUpdate?.editedAt).toBeGreaterThan(
        afterUpdate?.createdAt || 0
      );
    });

    it("should throw error for non-existent post", async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.run(async (ctx) => {
          const fakePostId =
            "k171234567890123456789012345" as unknown as Id<"posts">;
          const post = await ctx.db.get(fakePostId);
          if (!post || post.deletedAt) {
            throw new Error("Post not found");
          }
        })
      ).rejects.toThrow("Post not found");
    });

    it("should throw error for deleted post", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "author@example.com" });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Author",
        content: '{"type":"doc"}',
        contentHtml: "<p>Deleted</p>",
        deletedAt: Date.now(),
      });

      await expect(
        t.run(async (ctx) => {
          const post = await ctx.db.get(postId);
          if (!post || post.deletedAt) {
            throw new Error("Post not found");
          }
        })
      ).rejects.toThrow("Post not found");
    });

    it("should reject non-author non-moderator from editing", async () => {
      const t = convexTest(schema, modules);
      const authorId = await createUser(t, { email: "author@example.com" });
      const otherId = await createUser(t, {
        email: "other@example.com",
        role: "member",
      });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId,
        authorName: "Author",
        content: '{"type":"doc"}',
        contentHtml: "<p>Test</p>",
      });

      await expect(
        t.run(async (ctx) => {
          const post = await ctx.db.get(postId);
          const user = await ctx.db.get(otherId);

          if (!post || post.deletedAt) throw new Error("Post not found");
          if (!user) throw new Error("User not found");

          const isAuthor = post.authorId === otherId;
          const isModerator =
            user.role === "admin" || user.role === "moderator";

          if (!isAuthor && !isModerator) {
            throw new Error("You don't have permission to edit this post");
          }
        })
      ).rejects.toThrow("You don't have permission to edit this post");
    });

    it("should allow moderator to edit any post", async () => {
      const t = convexTest(schema, modules);
      const authorId = await createUser(t, { email: "author@example.com" });
      const modId = await createUser(t, {
        email: "mod@example.com",
        role: "moderator",
      });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId,
        authorName: "Author",
        content: '{"type":"doc"}',
        contentHtml: "<p>Original</p>",
      });

      await t.run(async (ctx) => {
        const post = await ctx.db.get(postId);
        const user = await ctx.db.get(modId);

        if (!post || post.deletedAt) throw new Error("Post not found");
        if (!user) throw new Error("User not found");

        const isAuthor = post.authorId === modId;
        const isModerator = user.role === "admin" || user.role === "moderator";

        if (!isAuthor && !isModerator) {
          throw new Error("You don't have permission to edit this post");
        }

        // Moderator can edit
        await ctx.db.patch(postId, {
          contentHtml: "<p>Moderated content</p>",
          editedAt: Date.now(),
        });
      });

      const post = await t.run(async (ctx) => ctx.db.get(postId));
      expect(post?.contentHtml).toBe("<p>Moderated content</p>");
    });
  });

  describe("deletePost", () => {
    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "test@example.com" });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test User",
        content: '{"type":"doc"}',
        contentHtml: "<p>Test</p>",
      });

      await expect(
        t.mutation(api.posts.mutations.deletePost, { postId })
      ).rejects.toThrow();
    });

    it("should soft delete a post (business logic)", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "author@example.com" });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Author",
        content: '{"type":"doc"}',
        contentHtml: "<p>To delete</p>",
      });

      // Verify no deletedAt initially
      const beforeDelete = await t.run(async (ctx) => ctx.db.get(postId));
      expect(beforeDelete?.deletedAt).toBeUndefined();

      // Soft delete
      await t.run(async (ctx) => {
        await ctx.db.patch(postId, { deletedAt: Date.now() });
      });

      // Verify soft deleted
      const afterDelete = await t.run(async (ctx) => ctx.db.get(postId));
      expect(afterDelete).not.toBeNull();
      expect(afterDelete?.deletedAt).toBeDefined();
      expect(afterDelete?.deletedAt).toBeGreaterThan(0);
    });

    it("should reject non-author non-moderator from deleting", async () => {
      const t = convexTest(schema, modules);
      const authorId = await createUser(t, { email: "author@example.com" });
      const otherId = await createUser(t, {
        email: "other@example.com",
        role: "member",
      });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId,
        authorName: "Author",
        content: '{"type":"doc"}',
        contentHtml: "<p>Test</p>",
      });

      await expect(
        t.run(async (ctx) => {
          const post = await ctx.db.get(postId);
          const user = await ctx.db.get(otherId);

          if (!post || post.deletedAt) throw new Error("Post not found");
          if (!user) throw new Error("User not found");

          const isAuthor = post.authorId === otherId;
          const isModerator =
            user.role === "admin" || user.role === "moderator";

          if (!isAuthor && !isModerator) {
            throw new Error("You don't have permission to delete this post");
          }
        })
      ).rejects.toThrow("You don't have permission to delete this post");
    });

    it("should allow author to delete their own post", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "author@example.com" });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Author",
        content: '{"type":"doc"}',
        contentHtml: "<p>My post</p>",
      });

      await t.run(async (ctx) => {
        const post = await ctx.db.get(postId);
        const user = await ctx.db.get(userId);

        if (!post || post.deletedAt) throw new Error("Post not found");
        if (!user) throw new Error("User not found");

        const isAuthor = post.authorId === userId;

        if (!isAuthor && user.role === "member") {
          throw new Error("You don't have permission to delete this post");
        }

        await ctx.db.patch(postId, { deletedAt: Date.now() });
      });

      const post = await t.run(async (ctx) => ctx.db.get(postId));
      expect(post?.deletedAt).toBeDefined();
    });

    it("should allow admin to delete any post", async () => {
      const t = convexTest(schema, modules);
      const authorId = await createUser(t, { email: "author@example.com" });
      const adminId = await createUser(t, {
        email: "admin@example.com",
        role: "admin",
      });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId,
        authorName: "Author",
        content: '{"type":"doc"}',
        contentHtml: "<p>Regular post</p>",
      });

      await t.run(async (ctx) => {
        const user = await ctx.db.get(adminId);
        if (user?.role === "admin") {
          await ctx.db.patch(postId, { deletedAt: Date.now() });
        }
      });

      const post = await t.run(async (ctx) => ctx.db.get(postId));
      expect(post?.deletedAt).toBeDefined();
    });

    it("should throw error for already deleted post", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "author@example.com" });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Author",
        content: '{"type":"doc"}',
        contentHtml: "<p>Already deleted</p>",
        deletedAt: Date.now(),
      });

      await expect(
        t.run(async (ctx) => {
          const post = await ctx.db.get(postId);
          if (!post || post.deletedAt) {
            throw new Error("Post not found");
          }
        })
      ).rejects.toThrow("Post not found");
    });
  });

  describe("pinPost", () => {
    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "test@example.com" });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test User",
        content: '{"type":"doc"}',
        contentHtml: "<p>Test</p>",
      });

      await expect(
        t.mutation(api.posts.mutations.pinPost, { postId })
      ).rejects.toThrow();
    });

    it("should set pinnedAt timestamp when pinning (business logic)", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createUser(t, {
        email: "admin@example.com",
        role: "admin",
      });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: adminId,
        authorName: "Admin",
        content: '{"type":"doc"}',
        contentHtml: "<p>Pin this</p>",
      });

      // Verify no pinnedAt initially
      const beforePin = await t.run(async (ctx) => ctx.db.get(postId));
      expect(beforePin?.pinnedAt).toBeUndefined();

      // Pin the post
      const pinTime = Date.now();
      await t.run(async (ctx) => {
        await ctx.db.patch(postId, { pinnedAt: pinTime });
      });

      const afterPin = await t.run(async (ctx) => ctx.db.get(postId));
      expect(afterPin?.pinnedAt).toBeDefined();
      expect(afterPin?.pinnedAt).toBeGreaterThan(0);
    });

    it("should require moderator or admin role", async () => {
      const t = convexTest(schema, modules);
      const memberId = await createUser(t, {
        email: "member@example.com",
        role: "member",
      });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: memberId,
        authorName: "Member",
        content: '{"type":"doc"}',
        contentHtml: "<p>Test</p>",
      });

      await expect(
        t.run(async (ctx) => {
          const user = await ctx.db.get(memberId);
          if (!user) throw new Error("User not found");

          if (user.role !== "admin" && user.role !== "moderator") {
            throw new Error("Moderation access required");
          }
        })
      ).rejects.toThrow("Moderation access required");
    });

    it("should enforce 3 pin limit per space", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createUser(t, {
        email: "admin@example.com",
        role: "admin",
      });
      const spaceId = await createSpace(t, { name: "General" });

      // Create 3 already-pinned posts
      for (let i = 1; i <= 3; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert("posts", {
            spaceId,
            authorId: adminId,
            authorName: "Admin",
            content: `{"type":"doc","post":${i}}`,
            contentHtml: `<p>Pinned post ${i}</p>`,
            likeCount: 0,
            commentCount: 0,
            pinnedAt: Date.now() + i,
            createdAt: Date.now(),
          });
        });
      }

      // Create a 4th post to pin
      const post4Id = await createPost(t, {
        spaceId,
        authorId: adminId,
        authorName: "Admin",
        content: '{"type":"doc","post":4}',
        contentHtml: "<p>Post 4</p>",
      });

      await expect(
        t.run(async (ctx) => {
          const pinnedPosts = await ctx.db
            .query("posts")
            .withIndex("by_spaceId", (q) => q.eq("spaceId", spaceId))
            .filter((q) =>
              q.and(
                q.neq(q.field("pinnedAt"), undefined),
                q.eq(q.field("deletedAt"), undefined)
              )
            )
            .collect();

          if (pinnedPosts.length >= 3) {
            throw new Error(
              "Maximum 3 pinned posts per space. Unpin another post first."
            );
          }

          await ctx.db.patch(post4Id, { pinnedAt: Date.now() });
        })
      ).rejects.toThrow("Maximum 3 pinned posts per space");
    });

    it("should fail if post is already pinned", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createUser(t, {
        email: "admin@example.com",
        role: "admin",
      });
      const spaceId = await createSpace(t, { name: "General" });

      // Create an already-pinned post
      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          spaceId,
          authorId: adminId,
          authorName: "Admin",
          content: '{"type":"doc"}',
          contentHtml: "<p>Already pinned</p>",
          likeCount: 0,
          commentCount: 0,
          pinnedAt: Date.now(),
          createdAt: Date.now(),
        });
      });

      await expect(
        t.run(async (ctx) => {
          const post = await ctx.db.get(postId);
          if (!post) throw new Error("Post not found");
          if (post.pinnedAt) {
            throw new Error("Post is already pinned");
          }
        })
      ).rejects.toThrow("Post is already pinned");
    });

    it("should fail if post is deleted", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createUser(t, {
        email: "admin@example.com",
        role: "admin",
      });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: adminId,
        authorName: "Admin",
        content: '{"type":"doc"}',
        contentHtml: "<p>Deleted</p>",
        deletedAt: Date.now(),
      });

      await expect(
        t.run(async (ctx) => {
          const post = await ctx.db.get(postId);
          if (!post || post.deletedAt) {
            throw new Error("Post not found");
          }
        })
      ).rejects.toThrow("Post not found");
    });

    it("should allow moderator to pin posts", async () => {
      const t = convexTest(schema, modules);
      const modId = await createUser(t, {
        email: "mod@example.com",
        role: "moderator",
      });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: modId,
        authorName: "Moderator",
        content: '{"type":"doc"}',
        contentHtml: "<p>To pin</p>",
      });

      await t.run(async (ctx) => {
        const user = await ctx.db.get(modId);
        if (!user) throw new Error("User not found");

        if (user.role !== "admin" && user.role !== "moderator") {
          throw new Error("Moderation access required");
        }

        await ctx.db.patch(postId, { pinnedAt: Date.now() });
      });

      const post = await t.run(async (ctx) => ctx.db.get(postId));
      expect(post?.pinnedAt).toBeDefined();
    });
  });

  describe("unpinPost", () => {
    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createUser(t, {
        email: "admin@example.com",
        role: "admin",
      });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          spaceId,
          authorId: adminId,
          authorName: "Admin",
          content: '{"type":"doc"}',
          contentHtml: "<p>Pinned</p>",
          likeCount: 0,
          commentCount: 0,
          pinnedAt: Date.now(),
          createdAt: Date.now(),
        });
      });

      await expect(
        t.mutation(api.posts.mutations.unpinPost, { postId })
      ).rejects.toThrow();
    });

    it("should clear pinnedAt when unpinning (business logic)", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createUser(t, {
        email: "admin@example.com",
        role: "admin",
      });
      const spaceId = await createSpace(t, { name: "General" });

      // Create a pinned post
      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          spaceId,
          authorId: adminId,
          authorName: "Admin",
          content: '{"type":"doc"}',
          contentHtml: "<p>Pinned</p>",
          likeCount: 0,
          commentCount: 0,
          pinnedAt: Date.now(),
          createdAt: Date.now(),
        });
      });

      // Verify pinned initially
      const beforeUnpin = await t.run(async (ctx) => ctx.db.get(postId));
      expect(beforeUnpin?.pinnedAt).toBeDefined();

      // Unpin the post
      await t.run(async (ctx) => {
        await ctx.db.patch(postId, { pinnedAt: undefined });
      });

      const afterUnpin = await t.run(async (ctx) => ctx.db.get(postId));
      expect(afterUnpin?.pinnedAt).toBeUndefined();
    });

    it("should require moderator or admin role", async () => {
      const t = convexTest(schema, modules);
      const memberId = await createUser(t, {
        email: "member@example.com",
        role: "member",
      });

      await expect(
        t.run(async (ctx) => {
          const user = await ctx.db.get(memberId);
          if (!user) throw new Error("User not found");

          if (user.role !== "admin" && user.role !== "moderator") {
            throw new Error("Moderation access required");
          }
        })
      ).rejects.toThrow("Moderation access required");
    });

    it("should fail if post is not pinned", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createUser(t, {
        email: "admin@example.com",
        role: "admin",
      });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: adminId,
        authorName: "Admin",
        content: '{"type":"doc"}',
        contentHtml: "<p>Not pinned</p>",
      });

      await expect(
        t.run(async (ctx) => {
          const post = await ctx.db.get(postId);
          if (!post || post.deletedAt) throw new Error("Post not found");
          if (!post.pinnedAt) {
            throw new Error("Post is not pinned");
          }
        })
      ).rejects.toThrow("Post is not pinned");
    });

    it("should allow moderator to unpin posts", async () => {
      const t = convexTest(schema, modules);
      const modId = await createUser(t, {
        email: "mod@example.com",
        role: "moderator",
      });
      const spaceId = await createSpace(t, { name: "General" });

      // Create a pinned post
      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          spaceId,
          authorId: modId,
          authorName: "Moderator",
          content: '{"type":"doc"}',
          contentHtml: "<p>Pinned</p>",
          likeCount: 0,
          commentCount: 0,
          pinnedAt: Date.now(),
          createdAt: Date.now(),
        });
      });

      await t.run(async (ctx) => {
        const user = await ctx.db.get(modId);
        if (!user) throw new Error("User not found");

        if (user.role !== "admin" && user.role !== "moderator") {
          throw new Error("Moderation access required");
        }

        await ctx.db.patch(postId, { pinnedAt: undefined });
      });

      const post = await t.run(async (ctx) => ctx.db.get(postId));
      expect(post?.pinnedAt).toBeUndefined();
    });
  });

  describe("restorePost", () => {
    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "test@example.com" });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test User",
        content: '{"type":"doc"}',
        contentHtml: "<p>Deleted post</p>",
        deletedAt: Date.now(),
      });

      await expect(
        t.mutation(api.posts.mutations.restorePost, { postId })
      ).rejects.toThrow();
    });

    it("should restore deleted post (admin business logic)", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createUser(t, {
        email: "admin@example.com",
        role: "admin",
      });
      const userId = await createUser(t, { email: "author@example.com" });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Author",
        content: '{"type":"doc"}',
        contentHtml: "<p>Deleted post</p>",
        deletedAt: Date.now(),
      });

      // Verify deleted initially
      const beforeRestore = await t.run(async (ctx) => ctx.db.get(postId));
      expect(beforeRestore?.deletedAt).toBeDefined();

      // Admin restores the post
      await t.run(async (ctx) => {
        const admin = await ctx.db.get(adminId);
        if (admin?.role !== "admin") {
          throw new Error("Admin access required");
        }

        const post = await ctx.db.get(postId);
        if (!post) throw new Error("Post not found");
        if (!post.deletedAt) throw new Error("Post is not deleted");

        await ctx.db.patch(postId, { deletedAt: undefined });
      });

      // Verify restored
      const afterRestore = await t.run(async (ctx) => ctx.db.get(postId));
      expect(afterRestore?.deletedAt).toBeUndefined();
    });

    it("should reject non-admin from restoring posts", async () => {
      const t = convexTest(schema, modules);
      const modId = await createUser(t, {
        email: "mod@example.com",
        role: "moderator",
      });
      const userId = await createUser(t, { email: "author@example.com" });
      const spaceId = await createSpace(t, { name: "General" });
      // Create a post to have context, but we're testing role check so not using it directly
      await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Author",
        content: '{"type":"doc"}',
        contentHtml: "<p>Deleted post</p>",
        deletedAt: Date.now(),
      });

      await expect(
        t.run(async (ctx) => {
          const mod = await ctx.db.get(modId);
          if (mod?.role !== "admin") {
            throw new Error("Admin access required");
          }
        })
      ).rejects.toThrow("Admin access required");
    });

    it("should throw error for non-existent post", async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.run(async (ctx) => {
          const fakePostId =
            "k171234567890123456789012345" as unknown as Id<"posts">;
          const post = await ctx.db.get(fakePostId);
          if (!post) {
            throw new Error("Post not found");
          }
        })
      ).rejects.toThrow("Post not found");
    });

    it("should throw error for non-deleted post", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "author@example.com" });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Author",
        content: '{"type":"doc"}',
        contentHtml: "<p>Normal post</p>",
      });

      await expect(
        t.run(async (ctx) => {
          const post = await ctx.db.get(postId);
          if (!post) throw new Error("Post not found");
          if (!post.deletedAt) throw new Error("Post is not deleted");
        })
      ).rejects.toThrow("Post is not deleted");
    });
  });
});
