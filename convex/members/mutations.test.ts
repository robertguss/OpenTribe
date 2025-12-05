import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.setup";

describe("members mutations", () => {
  describe("createUserProfile", () => {
    it("should create user profile with default values", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.mutation(api.members.mutations.createUserProfile, {
        email: "test@example.com",
        name: "Test User",
      });

      // Verify user was created
      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId);
      });

      expect(user).not.toBeNull();
      expect(user?.email).toBe("test@example.com");
      expect(user?.name).toBe("Test User");
      expect(user?.role).toBe("member");
      expect(user?.points).toBe(0);
      expect(user?.level).toBe(1);
      expect(user?.visibility).toBe("public");
      expect(user?.createdAt).toBeGreaterThan(0);
      expect(user?.updatedAt).toBeGreaterThan(0);
    });

    it("should create user profile without name", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.mutation(api.members.mutations.createUserProfile, {
        email: "noname@example.com",
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId);
      });

      expect(user).not.toBeNull();
      expect(user?.email).toBe("noname@example.com");
      expect(user?.name).toBeUndefined();
      expect(user?.role).toBe("member");
    });

    it("should be idempotent - return existing profile for same email", async () => {
      const t = convexTest(schema, modules);

      // First creation
      const userId1 = await t.mutation(
        api.members.mutations.createUserProfile,
        {
          email: "duplicate@example.com",
          name: "First User",
        }
      );

      // Second creation with same email
      const userId2 = await t.mutation(
        api.members.mutations.createUserProfile,
        {
          email: "duplicate@example.com",
          name: "Second User",
        }
      );

      // Should return the same user ID
      expect(userId1).toEqual(userId2);

      // Verify only one user exists
      const users = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", "duplicate@example.com"))
          .collect();
      });

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe("First User"); // Original name preserved
    });

    it("should create default membership record", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.mutation(api.members.mutations.createUserProfile, {
        email: "member@example.com",
        name: "New Member",
      });

      // Verify membership was created
      const membership = await t.run(async (ctx) => {
        return await ctx.db
          .query("memberships")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique();
      });

      expect(membership).not.toBeNull();
      expect(membership?.tier).toBe("free");
      expect(membership?.status).toBe("none");
      expect(membership?.userId).toEqual(userId);
    });

    it("should not create duplicate membership for idempotent call", async () => {
      const t = convexTest(schema, modules);

      // First creation
      await t.mutation(api.members.mutations.createUserProfile, {
        email: "nomember@example.com",
      });

      // Second creation (idempotent)
      const userId = await t.mutation(api.members.mutations.createUserProfile, {
        email: "nomember@example.com",
      });

      // Should still have only one membership
      const memberships = await t.run(async (ctx) => {
        return await ctx.db
          .query("memberships")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect();
      });

      expect(memberships).toHaveLength(1);
    });
  });
});
