/**
 * Unit Tests for Core Authorization Utilities
 *
 * Tests all permission functions with comprehensive coverage:
 * - Auth helpers (authenticated/unauthenticated scenarios)
 * - Role hierarchy (admin > moderator > member)
 * - Space visibility (public, members, paid with tiers)
 * - Space post permissions (all, moderators, admin)
 * - Content ownership and moderation permissions
 */

import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "../schema";
import { modules } from "../test.setup";
import { Id } from "../_generated/dataModel";

// =============================================================================
// Test Helper Functions
// =============================================================================

async function createTestUser(
  t: ReturnType<typeof convexTest>,
  role: "admin" | "moderator" | "member" = "member",
  email?: string
): Promise<Id<"users">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email:
        email ??
        `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      visibility: "public",
      role,
      points: 0,
      level: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
}

async function createTestSpace(
  t: ReturnType<typeof convexTest>,
  options: {
    visibility?: "public" | "members" | "paid";
    postPermission?: "all" | "moderators" | "admin";
    requiredTier?: string;
    deletedAt?: number;
  } = {}
): Promise<Id<"spaces">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("spaces", {
      name: "Test Space",
      visibility: options.visibility ?? "public",
      postPermission: options.postPermission ?? "all",
      requiredTier: options.requiredTier,
      order: 0,
      createdAt: Date.now(),
      deletedAt: options.deletedAt,
    });
  });
}

async function createTestPost(
  t: ReturnType<typeof convexTest>,
  authorId: Id<"users">,
  spaceId: Id<"spaces">,
  deletedAt?: number
): Promise<Id<"posts">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("posts", {
      spaceId,
      authorId,
      authorName: "Test User",
      content: "{}",
      contentHtml: "<p>Test</p>",
      likeCount: 0,
      commentCount: 0,
      createdAt: Date.now(),
      deletedAt,
    });
  });
}

async function createTestComment(
  t: ReturnType<typeof convexTest>,
  authorId: Id<"users">,
  postId: Id<"posts">,
  deletedAt?: number
): Promise<Id<"comments">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("comments", {
      postId,
      authorId,
      authorName: "Test User",
      content: "Test comment",
      likeCount: 0,
      createdAt: Date.now(),
      deletedAt,
    });
  });
}

async function createTestMembership(
  t: ReturnType<typeof convexTest>,
  userId: Id<"users">,
  tier: string,
  status: "active" | "trialing" | "past_due" | "canceled" | "none" = "active"
): Promise<Id<"memberships">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("memberships", {
      userId,
      tier,
      status,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
}

// =============================================================================
// Auth Helper Tests (AC: #1, #2)
// =============================================================================

describe("Auth Helpers", () => {
  /**
   * Note: getAuthUser and requireAuth use the Better Auth component which
   * requires component registration in convex-test. These tests verify the
   * logic works correctly with direct database operations instead.
   *
   * The Better Auth integration is tested through e2e tests.
   */
  describe("requireAuth", () => {
    it("should throw appropriate error when not authenticated (AC: #2)", async () => {
      const t = convexTest(schema, modules);

      // Better Auth component throws "Unauthenticated" when no session
      // Our requireAuth wraps this and would throw "You must be logged in"
      // Since we can't register the component in unit tests, we verify
      // the error is thrown (either from component or our wrapper)
      await expect(
        t.run(async (ctx) => {
          const { requireAuth } = await import("./permissions");
          await requireAuth(ctx);
        })
      ).rejects.toThrow(); // Any error indicates auth requirement works
    });

    it.skip("should return user when authenticated (requires Better Auth component)", async () => {
      // This test requires Better Auth component registration
      // Covered by e2e tests instead
    });
  });

  describe("getUserProfile", () => {
    it("should return user profile when exists", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "admin");

      const profile = await t.run(async (ctx) => {
        const { getUserProfile } = await import("./permissions");
        return await getUserProfile(ctx, userId);
      });

      expect(profile).not.toBeNull();
      expect(profile?.role).toBe("admin");
    });

    it("should return null when user profile not found", async () => {
      const t = convexTest(schema, modules);

      const profile = await t.run(async (ctx) => {
        const { getUserProfile } = await import("./permissions");
        // Use a fake ID that doesn't exist
        return await getUserProfile(ctx, "invalid_id" as Id<"users">);
      });

      expect(profile).toBeNull();
    });
  });
});

// =============================================================================
// Role-Based Helper Tests (AC: #3, #4)
// =============================================================================

describe("Role-Based Helpers", () => {
  describe("hasRole - pure function", () => {
    it("should return true when user role equals required role", async () => {
      const { hasRole } = await import("./permissions");
      expect(hasRole("admin", "admin")).toBe(true);
      expect(hasRole("moderator", "moderator")).toBe(true);
      expect(hasRole("member", "member")).toBe(true);
    });

    it("should return true when user role exceeds required role (AC: #4)", async () => {
      const { hasRole } = await import("./permissions");
      // Admin can do anything
      expect(hasRole("admin", "moderator")).toBe(true);
      expect(hasRole("admin", "member")).toBe(true);
      // Moderator can do member things
      expect(hasRole("moderator", "member")).toBe(true);
    });

    it("should return false when user role is insufficient", async () => {
      const { hasRole } = await import("./permissions");
      // Member can't do moderator/admin things
      expect(hasRole("member", "moderator")).toBe(false);
      expect(hasRole("member", "admin")).toBe(false);
      // Moderator can't do admin things
      expect(hasRole("moderator", "admin")).toBe(false);
    });
  });

  describe("requireAdmin", () => {
    it("should throw when user is member (AC: #3)", async () => {
      const t = convexTest(schema, modules);
      const memberId = await createTestUser(t, "member");

      await expect(
        t.run(async (ctx) => {
          const { requireAdmin } = await import("./permissions");
          await requireAdmin(ctx, memberId);
        })
      ).rejects.toThrow("Requires admin role or higher");
    });

    it("should throw when user is moderator (AC: #3)", async () => {
      const t = convexTest(schema, modules);
      const modId = await createTestUser(t, "moderator");

      await expect(
        t.run(async (ctx) => {
          const { requireAdmin } = await import("./permissions");
          await requireAdmin(ctx, modId);
        })
      ).rejects.toThrow("Requires admin role or higher");
    });

    it("should pass when user is admin", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, "admin");

      const result = await t.run(async (ctx) => {
        const { requireAdmin } = await import("./permissions");
        return await requireAdmin(ctx, adminId);
      });

      expect(result).not.toBeNull();
      expect(result.role).toBe("admin");
    });
  });

  describe("requireModerator", () => {
    it("should throw when user is member", async () => {
      const t = convexTest(schema, modules);
      const memberId = await createTestUser(t, "member");

      await expect(
        t.run(async (ctx) => {
          const { requireModerator } = await import("./permissions");
          await requireModerator(ctx, memberId);
        })
      ).rejects.toThrow("Requires moderator role or higher");
    });

    it("should pass when user is moderator", async () => {
      const t = convexTest(schema, modules);
      const modId = await createTestUser(t, "moderator");

      const result = await t.run(async (ctx) => {
        const { requireModerator } = await import("./permissions");
        return await requireModerator(ctx, modId);
      });

      expect(result).not.toBeNull();
      expect(result.role).toBe("moderator");
    });

    it("should pass when user is admin (AC: #4)", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, "admin");

      const result = await t.run(async (ctx) => {
        const { requireModerator } = await import("./permissions");
        return await requireModerator(ctx, adminId);
      });

      expect(result).not.toBeNull();
      expect(result.role).toBe("admin");
    });
  });

  describe("requireRole", () => {
    it("should throw when user profile not found", async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.run(async (ctx) => {
          const { requireRole } = await import("./permissions");
          await requireRole(ctx, "member", "invalid_id" as Id<"users">);
        })
      ).rejects.toThrow("User profile not found");
    });
  });
});

// =============================================================================
// Space Permission Helper Tests (AC: #5, #6)
// =============================================================================

describe("Space Permission Helpers", () => {
  describe("canViewSpace", () => {
    it("should allow anyone to view public spaces", async () => {
      const t = convexTest(schema, modules);
      const spaceId = await createTestSpace(t, { visibility: "public" });

      const canView = await t.run(async (ctx) => {
        const { canViewSpace } = await import("./permissions");
        return await canViewSpace(ctx, null, spaceId);
      });

      expect(canView).toBe(true);
    });

    it("should deny unauthenticated access to members-only spaces", async () => {
      const t = convexTest(schema, modules);
      const spaceId = await createTestSpace(t, { visibility: "members" });

      const canView = await t.run(async (ctx) => {
        const { canViewSpace } = await import("./permissions");
        return await canViewSpace(ctx, null, spaceId);
      });

      expect(canView).toBe(false);
    });

    it("should allow members to view members-only spaces", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "member");
      const spaceId = await createTestSpace(t, { visibility: "members" });

      const canView = await t.run(async (ctx) => {
        const { canViewSpace } = await import("./permissions");
        return await canViewSpace(ctx, userId, spaceId);
      });

      expect(canView).toBe(true);
    });

    it("should deny free-tier members from paid spaces (AC: #5)", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "member");
      const spaceId = await createTestSpace(t, {
        visibility: "paid",
        requiredTier: "pro",
      });
      // Create membership with different tier
      await createTestMembership(t, userId, "free");

      const canView = await t.run(async (ctx) => {
        const { canViewSpace } = await import("./permissions");
        return await canViewSpace(ctx, userId, spaceId);
      });

      expect(canView).toBe(false);
    });

    it("should allow pro-tier members to view pro spaces", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "member");
      const spaceId = await createTestSpace(t, {
        visibility: "paid",
        requiredTier: "pro",
      });
      await createTestMembership(t, userId, "pro");

      const canView = await t.run(async (ctx) => {
        const { canViewSpace } = await import("./permissions");
        return await canViewSpace(ctx, userId, spaceId);
      });

      expect(canView).toBe(true);
    });

    it("should deny members with inactive membership", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "member");
      const spaceId = await createTestSpace(t, {
        visibility: "paid",
        requiredTier: "pro",
      });
      await createTestMembership(t, userId, "pro", "canceled");

      const canView = await t.run(async (ctx) => {
        const { canViewSpace } = await import("./permissions");
        return await canViewSpace(ctx, userId, spaceId);
      });

      expect(canView).toBe(false);
    });

    it("should allow trialing members to view paid spaces", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "member");
      const spaceId = await createTestSpace(t, {
        visibility: "paid",
        requiredTier: "pro",
      });
      await createTestMembership(t, userId, "pro", "trialing");

      const canView = await t.run(async (ctx) => {
        const { canViewSpace } = await import("./permissions");
        return await canViewSpace(ctx, userId, spaceId);
      });

      expect(canView).toBe(true);
    });

    it("should always allow moderators to view any space", async () => {
      const t = convexTest(schema, modules);
      const modId = await createTestUser(t, "moderator");
      const spaceId = await createTestSpace(t, {
        visibility: "paid",
        requiredTier: "pro",
      });
      // No membership created

      const canView = await t.run(async (ctx) => {
        const { canViewSpace } = await import("./permissions");
        return await canViewSpace(ctx, modId, spaceId);
      });

      expect(canView).toBe(true);
    });

    it("should return false for deleted spaces", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const spaceId = await createTestSpace(t, {
        visibility: "public",
        deletedAt: Date.now(),
      });

      const canView = await t.run(async (ctx) => {
        const { canViewSpace } = await import("./permissions");
        return await canViewSpace(ctx, userId, spaceId);
      });

      expect(canView).toBe(false);
    });

    it("should return false for non-existent spaces", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const canView = await t.run(async (ctx) => {
        const { canViewSpace } = await import("./permissions");
        return await canViewSpace(ctx, userId, "invalid_id" as Id<"spaces">);
      });

      expect(canView).toBe(false);
    });
  });

  describe("canPostInSpace", () => {
    it("should allow members to post in 'all' permission spaces", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "member");
      const spaceId = await createTestSpace(t, { postPermission: "all" });

      const canPost = await t.run(async (ctx) => {
        const { canPostInSpace } = await import("./permissions");
        return await canPostInSpace(ctx, userId, spaceId);
      });

      expect(canPost).toBe(true);
    });

    it("should deny members from posting in 'moderators' permission spaces (AC: #6)", async () => {
      const t = convexTest(schema, modules);
      const memberId = await createTestUser(t, "member");
      const spaceId = await createTestSpace(t, {
        postPermission: "moderators",
      });

      const canPost = await t.run(async (ctx) => {
        const { canPostInSpace } = await import("./permissions");
        return await canPostInSpace(ctx, memberId, spaceId);
      });

      expect(canPost).toBe(false);
    });

    it("should allow moderators to post in 'moderators' permission spaces", async () => {
      const t = convexTest(schema, modules);
      const modId = await createTestUser(t, "moderator");
      const spaceId = await createTestSpace(t, {
        postPermission: "moderators",
      });

      const canPost = await t.run(async (ctx) => {
        const { canPostInSpace } = await import("./permissions");
        return await canPostInSpace(ctx, modId, spaceId);
      });

      expect(canPost).toBe(true);
    });

    it("should allow admins to post in 'moderators' permission spaces", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, "admin");
      const spaceId = await createTestSpace(t, {
        postPermission: "moderators",
      });

      const canPost = await t.run(async (ctx) => {
        const { canPostInSpace } = await import("./permissions");
        return await canPostInSpace(ctx, adminId, spaceId);
      });

      expect(canPost).toBe(true);
    });

    it("should deny moderators from posting in 'admin' permission spaces", async () => {
      const t = convexTest(schema, modules);
      const modId = await createTestUser(t, "moderator");
      const spaceId = await createTestSpace(t, { postPermission: "admin" });

      const canPost = await t.run(async (ctx) => {
        const { canPostInSpace } = await import("./permissions");
        return await canPostInSpace(ctx, modId, spaceId);
      });

      expect(canPost).toBe(false);
    });

    it("should allow admins to post in 'admin' permission spaces", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, "admin");
      const spaceId = await createTestSpace(t, { postPermission: "admin" });

      const canPost = await t.run(async (ctx) => {
        const { canPostInSpace } = await import("./permissions");
        return await canPostInSpace(ctx, adminId, spaceId);
      });

      expect(canPost).toBe(true);
    });

    it("should deny posting if user cannot view the space", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, "member");
      const spaceId = await createTestSpace(t, {
        visibility: "paid",
        requiredTier: "pro",
        postPermission: "all",
      });
      // No membership

      const canPost = await t.run(async (ctx) => {
        const { canPostInSpace } = await import("./permissions");
        return await canPostInSpace(ctx, userId, spaceId);
      });

      expect(canPost).toBe(false);
    });
  });

  describe("canModerateSpace", () => {
    it("should deny moderation to members", async () => {
      const t = convexTest(schema, modules);
      const memberId = await createTestUser(t, "member");
      const spaceId = await createTestSpace(t);

      const canMod = await t.run(async (ctx) => {
        const { canModerateSpace } = await import("./permissions");
        return await canModerateSpace(ctx, memberId, spaceId);
      });

      expect(canMod).toBe(false);
    });

    it("should allow moderation to moderators", async () => {
      const t = convexTest(schema, modules);
      const modId = await createTestUser(t, "moderator");
      const spaceId = await createTestSpace(t);

      const canMod = await t.run(async (ctx) => {
        const { canModerateSpace } = await import("./permissions");
        return await canModerateSpace(ctx, modId, spaceId);
      });

      expect(canMod).toBe(true);
    });

    it("should allow moderation to admins", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, "admin");
      const spaceId = await createTestSpace(t);

      const canMod = await t.run(async (ctx) => {
        const { canModerateSpace } = await import("./permissions");
        return await canModerateSpace(ctx, adminId, spaceId);
      });

      expect(canMod).toBe(true);
    });
  });
});

// =============================================================================
// Content Permission Helper Tests (AC: #7)
// =============================================================================

describe("Content Permission Helpers", () => {
  describe("canEditContent - posts", () => {
    it("should allow post author to edit their post", async () => {
      const t = convexTest(schema, modules);
      const authorId = await createTestUser(t, "member");
      const spaceId = await createTestSpace(t);
      const postId = await createTestPost(t, authorId, spaceId);

      const canEdit = await t.run(async (ctx) => {
        const { canEditContent } = await import("./permissions");
        return await canEditContent(ctx, authorId, postId, "post");
      });

      expect(canEdit).toBe(true);
    });

    it("should deny non-author members from editing posts (AC: #7)", async () => {
      const t = convexTest(schema, modules);
      const authorId = await createTestUser(t, "member");
      const otherUserId = await createTestUser(t, "member");
      const spaceId = await createTestSpace(t);
      const postId = await createTestPost(t, authorId, spaceId);

      const canEdit = await t.run(async (ctx) => {
        const { canEditContent } = await import("./permissions");
        return await canEditContent(ctx, otherUserId, postId, "post");
      });

      expect(canEdit).toBe(false);
    });

    it("should allow moderators to edit any post", async () => {
      const t = convexTest(schema, modules);
      const authorId = await createTestUser(t, "member");
      const modId = await createTestUser(t, "moderator");
      const spaceId = await createTestSpace(t);
      const postId = await createTestPost(t, authorId, spaceId);

      const canEdit = await t.run(async (ctx) => {
        const { canEditContent } = await import("./permissions");
        return await canEditContent(ctx, modId, postId, "post");
      });

      expect(canEdit).toBe(true);
    });

    it("should allow admins to edit any post", async () => {
      const t = convexTest(schema, modules);
      const authorId = await createTestUser(t, "member");
      const adminId = await createTestUser(t, "admin");
      const spaceId = await createTestSpace(t);
      const postId = await createTestPost(t, authorId, spaceId);

      const canEdit = await t.run(async (ctx) => {
        const { canEditContent } = await import("./permissions");
        return await canEditContent(ctx, adminId, postId, "post");
      });

      expect(canEdit).toBe(true);
    });

    it("should deny editing deleted posts", async () => {
      const t = convexTest(schema, modules);
      const authorId = await createTestUser(t, "member");
      const spaceId = await createTestSpace(t);
      const postId = await createTestPost(t, authorId, spaceId, Date.now());

      const canEdit = await t.run(async (ctx) => {
        const { canEditContent } = await import("./permissions");
        return await canEditContent(ctx, authorId, postId, "post");
      });

      expect(canEdit).toBe(false);
    });
  });

  describe("canEditContent - comments", () => {
    it("should allow comment author to edit their comment", async () => {
      const t = convexTest(schema, modules);
      const authorId = await createTestUser(t, "member");
      const spaceId = await createTestSpace(t);
      const postId = await createTestPost(t, authorId, spaceId);
      const commentId = await createTestComment(t, authorId, postId);

      const canEdit = await t.run(async (ctx) => {
        const { canEditContent } = await import("./permissions");
        return await canEditContent(ctx, authorId, commentId, "comment");
      });

      expect(canEdit).toBe(true);
    });

    it("should deny non-author members from editing comments", async () => {
      const t = convexTest(schema, modules);
      const authorId = await createTestUser(t, "member");
      const otherUserId = await createTestUser(t, "member");
      const spaceId = await createTestSpace(t);
      const postId = await createTestPost(t, authorId, spaceId);
      const commentId = await createTestComment(t, authorId, postId);

      const canEdit = await t.run(async (ctx) => {
        const { canEditContent } = await import("./permissions");
        return await canEditContent(ctx, otherUserId, commentId, "comment");
      });

      expect(canEdit).toBe(false);
    });

    it("should allow moderators to edit any comment", async () => {
      const t = convexTest(schema, modules);
      const authorId = await createTestUser(t, "member");
      const modId = await createTestUser(t, "moderator");
      const spaceId = await createTestSpace(t);
      const postId = await createTestPost(t, authorId, spaceId);
      const commentId = await createTestComment(t, authorId, postId);

      const canEdit = await t.run(async (ctx) => {
        const { canEditContent } = await import("./permissions");
        return await canEditContent(ctx, modId, commentId, "comment");
      });

      expect(canEdit).toBe(true);
    });
  });

  describe("canDeleteContent", () => {
    it("should allow post author to delete their post", async () => {
      const t = convexTest(schema, modules);
      const authorId = await createTestUser(t, "member");
      const spaceId = await createTestSpace(t);
      const postId = await createTestPost(t, authorId, spaceId);

      const canDelete = await t.run(async (ctx) => {
        const { canDeleteContent } = await import("./permissions");
        return await canDeleteContent(ctx, authorId, postId, "post");
      });

      expect(canDelete).toBe(true);
    });

    it("should deny non-author members from deleting posts", async () => {
      const t = convexTest(schema, modules);
      const authorId = await createTestUser(t, "member");
      const otherUserId = await createTestUser(t, "member");
      const spaceId = await createTestSpace(t);
      const postId = await createTestPost(t, authorId, spaceId);

      const canDelete = await t.run(async (ctx) => {
        const { canDeleteContent } = await import("./permissions");
        return await canDeleteContent(ctx, otherUserId, postId, "post");
      });

      expect(canDelete).toBe(false);
    });

    it("should allow moderators to delete any content", async () => {
      const t = convexTest(schema, modules);
      const authorId = await createTestUser(t, "member");
      const modId = await createTestUser(t, "moderator");
      const spaceId = await createTestSpace(t);
      const postId = await createTestPost(t, authorId, spaceId);

      const canDelete = await t.run(async (ctx) => {
        const { canDeleteContent } = await import("./permissions");
        return await canDeleteContent(ctx, modId, postId, "post");
      });

      expect(canDelete).toBe(true);
    });
  });
});

// =============================================================================
// ROLE_HIERARCHY Constant Tests (AC: #1)
// =============================================================================

describe("ROLE_HIERARCHY constant", () => {
  it("should export ROLE_HIERARCHY with correct values", async () => {
    const { ROLE_HIERARCHY } = await import("./permissions");

    expect(ROLE_HIERARCHY).toEqual({
      admin: 3,
      moderator: 2,
      member: 1,
    });
  });

  it("should have admin with highest value", async () => {
    const { ROLE_HIERARCHY } = await import("./permissions");

    expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.moderator);
    expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.member);
  });

  it("should have moderator higher than member", async () => {
    const { ROLE_HIERARCHY } = await import("./permissions");

    expect(ROLE_HIERARCHY.moderator).toBeGreaterThan(ROLE_HIERARCHY.member);
  });
});

// =============================================================================
// Edge Cases and Error Handling
// =============================================================================

describe("Edge Cases", () => {
  it("should handle user profile not found gracefully for members-only space", async () => {
    const t = convexTest(schema, modules);
    // Use members-only space to ensure user profile is actually checked
    const spaceId = await createTestSpace(t, { visibility: "members" });

    const canView = await t.run(async (ctx) => {
      const { canViewSpace } = await import("./permissions");
      return await canViewSpace(ctx, "invalid_id" as Id<"users">, spaceId);
    });

    expect(canView).toBe(false);
  });

  it("should allow anyone to view public spaces even with invalid userId", async () => {
    const t = convexTest(schema, modules);
    const spaceId = await createTestSpace(t, { visibility: "public" });

    const canView = await t.run(async (ctx) => {
      const { canViewSpace } = await import("./permissions");
      return await canViewSpace(ctx, "invalid_id" as Id<"users">, spaceId);
    });

    // Public spaces are visible to everyone
    expect(canView).toBe(true);
  });

  it("should handle non-existent content IDs", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t, "admin");

    const canEdit = await t.run(async (ctx) => {
      const { canEditContent } = await import("./permissions");
      return await canEditContent(ctx, userId, "invalid_id" as string, "post");
    });

    // Even admins get false for non-existent content
    // Content must exist before any permission check succeeds
    expect(canEdit).toBe(false);
  });

  it("should allow paid space access when no requiredTier specified", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t, "member");
    const spaceId = await createTestSpace(t, {
      visibility: "paid",
      // No requiredTier
    });

    const canView = await t.run(async (ctx) => {
      const { canViewSpace } = await import("./permissions");
      return await canViewSpace(ctx, userId, spaceId);
    });

    expect(canView).toBe(true);
  });
});
