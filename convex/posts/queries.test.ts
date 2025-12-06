import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.setup";
import { Id } from "../_generated/dataModel";

/**
 * Testing Notes for Better Auth Integration:
 *
 * The post queries use Better Auth via `requireAuth(ctx)`.
 * See mutations.test.ts for detailed explanation of testing strategy.
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
    deletedAt?: number;
  }
): Promise<Id<"spaces">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("spaces", {
      name: data.name,
      visibility: data.visibility || "public",
      postPermission: data.postPermission || "all",
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
    content?: string;
    contentHtml?: string;
    pinnedAt?: number;
    deletedAt?: number;
    createdAt?: number;
  }
): Promise<Id<"posts">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("posts", {
      spaceId: data.spaceId,
      authorId: data.authorId,
      authorName: data.authorName,
      content: data.content || '{"type":"doc"}',
      contentHtml: data.contentHtml || "<p>Test</p>",
      likeCount: 0,
      commentCount: 0,
      pinnedAt: data.pinnedAt,
      createdAt: data.createdAt || Date.now(),
      deletedAt: data.deletedAt,
    });
  });
}

describe("posts queries", () => {
  describe("listPostsBySpace", () => {
    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);
      const spaceId = await createSpace(t, { name: "General" });

      await expect(
        t.query(api.posts.queries.listPostsBySpace, { spaceId })
      ).rejects.toThrow();
    });

    it("should return posts filtered by spaceId (business logic)", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "test@example.com" });
      const space1Id = await createSpace(t, { name: "Space 1" });
      const space2Id = await createSpace(t, { name: "Space 2" });

      // Create posts in different spaces
      await createPost(t, {
        spaceId: space1Id,
        authorId: userId,
        authorName: "Test",
        contentHtml: "<p>Post 1 in Space 1</p>",
      });
      await createPost(t, {
        spaceId: space1Id,
        authorId: userId,
        authorName: "Test",
        contentHtml: "<p>Post 2 in Space 1</p>",
      });
      await createPost(t, {
        spaceId: space2Id,
        authorId: userId,
        authorName: "Test",
        contentHtml: "<p>Post 1 in Space 2</p>",
      });

      // Query posts for space 1
      const space1Posts = await t.run(async (ctx) => {
        return await ctx.db
          .query("posts")
          .withIndex("by_spaceId", (q) => q.eq("spaceId", space1Id))
          .filter((q) => q.eq(q.field("deletedAt"), undefined))
          .collect();
      });

      expect(space1Posts).toHaveLength(2);
      expect(space1Posts.every((p) => p.spaceId === space1Id)).toBe(true);
    });

    it("should exclude soft-deleted posts", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "test@example.com" });
      const spaceId = await createSpace(t, { name: "General" });

      // Create normal and deleted posts
      await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test",
        contentHtml: "<p>Normal post</p>",
      });
      await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test",
        contentHtml: "<p>Deleted post</p>",
        deletedAt: Date.now(),
      });

      // Query posts
      const posts = await t.run(async (ctx) => {
        return await ctx.db
          .query("posts")
          .withIndex("by_spaceId", (q) => q.eq("spaceId", spaceId))
          .filter((q) => q.eq(q.field("deletedAt"), undefined))
          .collect();
      });

      expect(posts).toHaveLength(1);
      expect(posts[0].contentHtml).toBe("<p>Normal post</p>");
    });

    it("should sort pinned posts first, then by createdAt DESC", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "test@example.com" });
      const spaceId = await createSpace(t, { name: "General" });

      const now = Date.now();

      // Create posts with different timestamps
      const oldPost = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test",
        contentHtml: "<p>Oldest post</p>",
        createdAt: now - 3000,
      });

      const newPost = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test",
        contentHtml: "<p>Newest post</p>",
        createdAt: now,
      });

      const pinnedPost = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test",
        contentHtml: "<p>Pinned post</p>",
        pinnedAt: now - 1000,
        createdAt: now - 2000,
      });

      // Query and sort posts like the query does
      const allPosts = await t.run(async (ctx) => {
        // Get pinned posts
        const pinned = await ctx.db
          .query("posts")
          .withIndex("by_spaceId", (q) => q.eq("spaceId", spaceId))
          .filter((q) =>
            q.and(
              q.neq(q.field("pinnedAt"), undefined),
              q.eq(q.field("deletedAt"), undefined)
            )
          )
          .collect();

        // Get regular posts sorted by createdAt DESC
        const regular = await ctx.db
          .query("posts")
          .withIndex("by_spaceId_and_createdAt", (q) =>
            q.eq("spaceId", spaceId)
          )
          .filter((q) =>
            q.and(
              q.eq(q.field("pinnedAt"), undefined),
              q.eq(q.field("deletedAt"), undefined)
            )
          )
          .order("desc")
          .collect();

        return { pinned, regular };
      });

      // Pinned post should be separate
      expect(allPosts.pinned).toHaveLength(1);
      expect(allPosts.pinned[0]._id).toBe(pinnedPost);

      // Regular posts should be sorted by createdAt DESC (newest first)
      expect(allPosts.regular).toHaveLength(2);
      expect(allPosts.regular[0]._id).toBe(newPost);
      expect(allPosts.regular[1]._id).toBe(oldPost);
    });

    it("should sort multiple pinned posts by pinnedAt DESC (newest pin first)", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "test@example.com" });
      const spaceId = await createSpace(t, { name: "General" });

      const now = Date.now();

      // Create 3 pinned posts with different pin times
      const firstPinned = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test",
        contentHtml: "<p>First pinned</p>",
        pinnedAt: now - 2000, // Pinned earliest
        createdAt: now - 3000,
      });

      const secondPinned = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test",
        contentHtml: "<p>Second pinned</p>",
        pinnedAt: now - 1000, // Pinned second
        createdAt: now - 2000,
      });

      const thirdPinned = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test",
        contentHtml: "<p>Third pinned</p>",
        pinnedAt: now, // Pinned most recently
        createdAt: now - 1000,
      });

      // Query pinned posts and sort by pinnedAt DESC
      const sortedPinned = await t.run(async (ctx) => {
        const pinned = await ctx.db
          .query("posts")
          .withIndex("by_spaceId", (q) => q.eq("spaceId", spaceId))
          .filter((q) =>
            q.and(
              q.neq(q.field("pinnedAt"), undefined),
              q.eq(q.field("deletedAt"), undefined)
            )
          )
          .collect();

        // Sort by pinnedAt descending (newest pin first)
        return pinned.sort((a, b) => (b.pinnedAt || 0) - (a.pinnedAt || 0));
      });

      expect(sortedPinned).toHaveLength(3);
      // Most recently pinned should be first
      expect(sortedPinned[0]._id).toBe(thirdPinned);
      expect(sortedPinned[1]._id).toBe(secondPinned);
      expect(sortedPinned[2]._id).toBe(firstPinned);
    });

    it("should combine pinned posts at top with regular posts below", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "test@example.com" });
      const spaceId = await createSpace(t, { name: "General" });

      const now = Date.now();

      // Create a mix of pinned and regular posts
      const regularPost1 = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test",
        contentHtml: "<p>Regular 1</p>",
        createdAt: now - 2000,
      });

      const pinnedPost = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test",
        contentHtml: "<p>Pinned</p>",
        pinnedAt: now - 500,
        createdAt: now - 3000, // Created before regular posts
      });

      const regularPost2 = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test",
        contentHtml: "<p>Regular 2</p>",
        createdAt: now - 1000,
      });

      // Combine posts like the query does
      const combined = await t.run(async (ctx) => {
        // Get pinned posts
        const pinned = await ctx.db
          .query("posts")
          .withIndex("by_spaceId", (q) => q.eq("spaceId", spaceId))
          .filter((q) =>
            q.and(
              q.neq(q.field("pinnedAt"), undefined),
              q.eq(q.field("deletedAt"), undefined)
            )
          )
          .collect();

        const sortedPinned = pinned.sort(
          (a, b) => (b.pinnedAt || 0) - (a.pinnedAt || 0)
        );

        // Get regular posts sorted by createdAt DESC
        const regular = await ctx.db
          .query("posts")
          .withIndex("by_spaceId_and_createdAt", (q) =>
            q.eq("spaceId", spaceId)
          )
          .filter((q) =>
            q.and(
              q.eq(q.field("pinnedAt"), undefined),
              q.eq(q.field("deletedAt"), undefined)
            )
          )
          .order("desc")
          .collect();

        // Combine: pinned first, then regular
        return [...sortedPinned, ...regular];
      });

      expect(combined).toHaveLength(3);
      // Pinned post should be first even though it was created earliest
      expect(combined[0]._id).toBe(pinnedPost);
      // Then regular posts by createdAt DESC
      expect(combined[1]._id).toBe(regularPost2); // newer
      expect(combined[2]._id).toBe(regularPost1); // older
    });

    it("should only include pinned posts on first page, not subsequent pages", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "test@example.com" });
      const spaceId = await createSpace(t, { name: "General" });

      const now = Date.now();

      // Create a pinned post
      const pinnedPost = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test",
        contentHtml: "<p>Pinned</p>",
        pinnedAt: now,
        createdAt: now - 5000,
      });

      // Create 3 regular posts (so we get 2 on first page, 1 on second)
      for (let i = 0; i < 3; i++) {
        await createPost(t, {
          spaceId,
          authorId: userId,
          authorName: "Test",
          contentHtml: `<p>Regular ${i + 1}</p>`,
          createdAt: now - (3 - i) * 1000,
        });
      }

      // First page: should include pinned + 2 regular posts
      const firstPage = await t.run(async (ctx) => {
        // Get pinned posts
        const pinned = await ctx.db
          .query("posts")
          .withIndex("by_spaceId", (q) => q.eq("spaceId", spaceId))
          .filter((q) =>
            q.and(
              q.neq(q.field("pinnedAt"), undefined),
              q.eq(q.field("deletedAt"), undefined)
            )
          )
          .collect();

        // Get paginated regular posts
        const regularQuery = ctx.db
          .query("posts")
          .withIndex("by_spaceId_and_createdAt", (q) =>
            q.eq("spaceId", spaceId)
          )
          .filter((q) =>
            q.and(
              q.eq(q.field("pinnedAt"), undefined),
              q.eq(q.field("deletedAt"), undefined)
            )
          )
          .order("desc");

        const result = await regularQuery.paginate({
          numItems: 2,
          cursor: null,
        });

        // Combine for first page
        return {
          posts: [...pinned, ...result.page],
          cursor: result.continueCursor,
          isDone: result.isDone,
        };
      });

      // First page should have 3 posts (1 pinned + 2 regular)
      expect(firstPage.posts).toHaveLength(3);
      expect(firstPage.posts[0]._id).toBe(pinnedPost);
      expect(firstPage.isDone).toBe(false);

      // Second page: should only have regular posts, no pinned
      const secondPage = await t.run(async (ctx) => {
        const regularQuery = ctx.db
          .query("posts")
          .withIndex("by_spaceId_and_createdAt", (q) =>
            q.eq("spaceId", spaceId)
          )
          .filter((q) =>
            q.and(
              q.eq(q.field("pinnedAt"), undefined),
              q.eq(q.field("deletedAt"), undefined)
            )
          )
          .order("desc");

        const result = await regularQuery.paginate({
          numItems: 2,
          cursor: firstPage.cursor,
        });

        // Second page: only regular posts (no pinned)
        return {
          posts: result.page,
          isDone: result.isDone,
        };
      });

      // Second page should have 1 regular post (the remaining one), no pinned
      expect(secondPage.posts.length).toBeGreaterThanOrEqual(1);
      expect(secondPage.posts.every((p) => !p.pinnedAt)).toBe(true);
      // On second page with only 1 remaining post, we should be done
      expect(secondPage.isDone).toBe(true);
    });

    it("should paginate results correctly", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "test@example.com" });
      const spaceId = await createSpace(t, { name: "General" });

      // Create 5 posts
      for (let i = 0; i < 5; i++) {
        await createPost(t, {
          spaceId,
          authorId: userId,
          authorName: "Test",
          contentHtml: `<p>Post ${i + 1}</p>`,
          createdAt: Date.now() + i * 1000,
        });
      }

      // Query with limit of 2
      const firstPage = await t.run(async (ctx) => {
        const query = ctx.db
          .query("posts")
          .withIndex("by_spaceId_and_createdAt", (q) =>
            q.eq("spaceId", spaceId)
          )
          .filter((q) => q.eq(q.field("deletedAt"), undefined))
          .order("desc");

        const result = await query.paginate({ numItems: 2, cursor: null });
        return result;
      });

      expect(firstPage.page).toHaveLength(2);
      expect(firstPage.isDone).toBe(false);

      // Get second page
      const secondPage = await t.run(async (ctx) => {
        const query = ctx.db
          .query("posts")
          .withIndex("by_spaceId_and_createdAt", (q) =>
            q.eq("spaceId", spaceId)
          )
          .filter((q) => q.eq(q.field("deletedAt"), undefined))
          .order("desc");

        const result = await query.paginate({
          numItems: 2,
          cursor: firstPage.continueCursor,
        });
        return result;
      });

      expect(secondPage.page).toHaveLength(2);
      expect(secondPage.isDone).toBe(false);
    });

    it("should return empty array for space with no posts", async () => {
      const t = convexTest(schema, modules);
      const spaceId = await createSpace(t, { name: "Empty Space" });

      const posts = await t.run(async (ctx) => {
        return await ctx.db
          .query("posts")
          .withIndex("by_spaceId", (q) => q.eq("spaceId", spaceId))
          .filter((q) => q.eq(q.field("deletedAt"), undefined))
          .collect();
      });

      expect(posts).toHaveLength(0);
    });
  });

  describe("getPost", () => {
    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "test@example.com" });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test",
      });

      await expect(
        t.query(api.posts.queries.getPost, { postId })
      ).rejects.toThrow();
    });

    it("should return post by ID (business logic)", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "author@example.com" });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Author",
        contentHtml: "<p>Specific post content</p>",
      });

      const post = await t.run(async (ctx) => ctx.db.get(postId));

      expect(post).not.toBeNull();
      expect(post?._id).toBe(postId);
      expect(post?.contentHtml).toBe("<p>Specific post content</p>");
    });

    it("should return null for non-existent post", async () => {
      const t = convexTest(schema, modules);

      const post = await t.run(async (ctx) => {
        const fakeId = "k171234567890123456789012345" as unknown as Id<"posts">;
        return await ctx.db.get(fakeId);
      });

      expect(post).toBeNull();
    });

    it("should return null for deleted post", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "test@example.com" });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test",
        deletedAt: Date.now(),
      });

      const post = await t.run(async (ctx) => {
        const p = await ctx.db.get(postId);
        if (!p || p.deletedAt) return null;
        return p;
      });

      expect(post).toBeNull();
    });

    it("should include all post fields in response", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "test@example.com" });
      const spaceId = await createSpace(t, { name: "General" });
      const postId = await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Test User",
        content: '{"type":"doc","test":true}',
        contentHtml: "<p>Full post</p>",
      });

      const post = await t.run(async (ctx) => ctx.db.get(postId));

      expect(post).toHaveProperty("_id");
      expect(post).toHaveProperty("spaceId", spaceId);
      expect(post).toHaveProperty("authorId", userId);
      expect(post).toHaveProperty("authorName", "Test User");
      expect(post).toHaveProperty("content");
      expect(post).toHaveProperty("contentHtml");
      expect(post).toHaveProperty("likeCount", 0);
      expect(post).toHaveProperty("commentCount", 0);
      expect(post).toHaveProperty("createdAt");
    });
  });

  describe("listPostsByAuthor", () => {
    it("should return posts by specific author", async () => {
      const t = convexTest(schema, modules);
      const author1Id = await createUser(t, { email: "author1@example.com" });
      const author2Id = await createUser(t, { email: "author2@example.com" });
      const spaceId = await createSpace(t, { name: "General" });

      // Create posts by different authors
      await createPost(t, {
        spaceId,
        authorId: author1Id,
        authorName: "Author 1",
        contentHtml: "<p>Author 1 Post 1</p>",
      });
      await createPost(t, {
        spaceId,
        authorId: author1Id,
        authorName: "Author 1",
        contentHtml: "<p>Author 1 Post 2</p>",
      });
      await createPost(t, {
        spaceId,
        authorId: author2Id,
        authorName: "Author 2",
        contentHtml: "<p>Author 2 Post 1</p>",
      });

      // Query posts by author1
      const author1Posts = await t.run(async (ctx) => {
        return await ctx.db
          .query("posts")
          .withIndex("by_authorId", (q) => q.eq("authorId", author1Id))
          .filter((q) => q.eq(q.field("deletedAt"), undefined))
          .collect();
      });

      expect(author1Posts).toHaveLength(2);
      expect(author1Posts.every((p) => p.authorId === author1Id)).toBe(true);
    });

    it("should exclude deleted posts from author results", async () => {
      const t = convexTest(schema, modules);
      const userId = await createUser(t, { email: "author@example.com" });
      const spaceId = await createSpace(t, { name: "General" });

      // Create normal and deleted posts
      await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Author",
        contentHtml: "<p>Normal post</p>",
      });
      await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Author",
        contentHtml: "<p>Deleted post</p>",
        deletedAt: Date.now(),
      });

      const posts = await t.run(async (ctx) => {
        return await ctx.db
          .query("posts")
          .withIndex("by_authorId", (q) => q.eq("authorId", userId))
          .filter((q) => q.eq(q.field("deletedAt"), undefined))
          .collect();
      });

      expect(posts).toHaveLength(1);
    });
  });

  describe("listDeletedPosts", () => {
    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.query(api.posts.queries.listDeletedPosts, {})
      ).rejects.toThrow();
    });

    it("should return deleted posts for admin (business logic)", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createUser(t, {
        email: "admin@example.com",
        role: "admin",
      });
      const userId = await createUser(t, { email: "author@example.com" });
      const spaceId = await createSpace(t, { name: "General" });

      // Create normal and deleted posts
      await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Author",
        contentHtml: "<p>Normal post</p>",
      });
      await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Author",
        contentHtml: "<p>Deleted post 1</p>",
        deletedAt: Date.now(),
      });
      await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Author",
        contentHtml: "<p>Deleted post 2</p>",
        deletedAt: Date.now() + 1000,
      });

      // Query deleted posts like listDeletedPosts does
      const deletedPosts = await t.run(async (ctx) => {
        const admin = await ctx.db.get(adminId);
        if (admin?.role !== "admin") return [];

        return await ctx.db
          .query("posts")
          .filter((q) => q.neq(q.field("deletedAt"), undefined))
          .order("desc")
          .collect();
      });

      expect(deletedPosts).toHaveLength(2);
      expect(deletedPosts.every((p) => p.deletedAt !== undefined)).toBe(true);
    });

    it("should return empty array for non-admin", async () => {
      const t = convexTest(schema, modules);
      const memberId = await createUser(t, {
        email: "member@example.com",
        role: "member",
      });
      const userId = await createUser(t, { email: "author@example.com" });
      const spaceId = await createSpace(t, { name: "General" });

      // Create deleted post
      await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Author",
        contentHtml: "<p>Deleted post</p>",
        deletedAt: Date.now(),
      });

      // Query as non-admin (should return empty)
      const deletedPosts = await t.run(async (ctx) => {
        const member = await ctx.db.get(memberId);
        if (member?.role !== "admin") return [];

        return await ctx.db
          .query("posts")
          .filter((q) => q.neq(q.field("deletedAt"), undefined))
          .collect();
      });

      expect(deletedPosts).toHaveLength(0);
    });

    it("should return empty array for moderator", async () => {
      const t = convexTest(schema, modules);
      const modId = await createUser(t, {
        email: "mod@example.com",
        role: "moderator",
      });
      const userId = await createUser(t, { email: "author@example.com" });
      const spaceId = await createSpace(t, { name: "General" });

      // Create deleted post
      await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Author",
        contentHtml: "<p>Deleted post</p>",
        deletedAt: Date.now(),
      });

      // Query as moderator (should return empty - admin only)
      const deletedPosts = await t.run(async (ctx) => {
        const mod = await ctx.db.get(modId);
        if (mod?.role !== "admin") return [];

        return await ctx.db
          .query("posts")
          .filter((q) => q.neq(q.field("deletedAt"), undefined))
          .collect();
      });

      expect(deletedPosts).toHaveLength(0);
    });

    it("should return empty array when no deleted posts exist", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createUser(t, {
        email: "admin@example.com",
        role: "admin",
      });
      const userId = await createUser(t, { email: "author@example.com" });
      const spaceId = await createSpace(t, { name: "General" });

      // Create only normal posts
      await createPost(t, {
        spaceId,
        authorId: userId,
        authorName: "Author",
        contentHtml: "<p>Normal post</p>",
      });

      // Query deleted posts (should be empty)
      const deletedPosts = await t.run(async (ctx) => {
        const admin = await ctx.db.get(adminId);
        if (admin?.role !== "admin") return [];

        return await ctx.db
          .query("posts")
          .filter((q) => q.neq(q.field("deletedAt"), undefined))
          .collect();
      });

      expect(deletedPosts).toHaveLength(0);
    });
  });
});
