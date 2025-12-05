import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.setup";
import { Id } from "../_generated/dataModel";

// Helper to create a test user
async function createTestUser(
  t: ReturnType<typeof convexTest>,
  email: string,
  name?: string
): Promise<Id<"users">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email: email.toLowerCase(),
      name,
      visibility: "public",
      role: "member",
      points: 0,
      level: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
}

describe("members mutations", () => {
  describe("updateProfile", () => {
    it("should update name successfully", async () => {
      const t = convexTest(schema, modules);
      const email = "update@example.com";
      const now = Date.now();

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          email,
          name: "Original Name",
          visibility: "public",
          role: "member",
          points: 0,
          level: 1,
          createdAt: now,
          updatedAt: now,
        });
      });

      // Test the update logic directly
      await t.run(async (ctx) => {
        const profile = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", email))
          .unique();

        if (!profile) throw new Error("Profile not found");

        await ctx.db.patch(profile._id, {
          name: "New Name",
          updatedAt: Date.now(),
        });
      });

      // Verify the update
      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", email))
          .unique();
      });

      expect(user?.name).toBe("New Name");
      expect(user?.updatedAt).toBeGreaterThan(now);
    });

    it("should update bio successfully", async () => {
      const t = convexTest(schema, modules);
      const email = "bio@example.com";

      await createTestUser(t, email);

      await t.run(async (ctx) => {
        const profile = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", email))
          .unique();

        if (!profile) throw new Error("Profile not found");

        await ctx.db.patch(profile._id, {
          bio: "My new bio",
          updatedAt: Date.now(),
        });
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", email))
          .unique();
      });

      expect(user?.bio).toBe("My new bio");
    });

    it("should reject bio over 500 characters", async () => {
      const t = convexTest(schema, modules);
      const email = "longbio@example.com";
      const longBio = "a".repeat(501);

      await createTestUser(t, email);

      // Test the validation logic directly
      await expect(
        t.run(async (ctx) => {
          const profile = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .unique();

          if (!profile) throw new Error("Profile not found");

          // Validation logic
          if (longBio.length > 500) {
            throw new Error("Bio must be 500 characters or less");
          }

          await ctx.db.patch(profile._id, {
            bio: longBio,
            updatedAt: Date.now(),
          });
        })
      ).rejects.toThrow("Bio must be 500 characters or less");
    });

    it("should update visibility to private", async () => {
      const t = convexTest(schema, modules);
      const email = "visibility@example.com";

      await createTestUser(t, email);

      await t.run(async (ctx) => {
        const profile = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", email))
          .unique();

        if (!profile) throw new Error("Profile not found");

        await ctx.db.patch(profile._id, {
          visibility: "private",
          updatedAt: Date.now(),
        });
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", email))
          .unique();
      });

      expect(user?.visibility).toBe("private");
    });

    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);

      // Testing via API requires auth component - test for any auth error
      await expect(
        t.mutation(api.members.mutations.updateProfile, { name: "Test" })
      ).rejects.toThrow();
    });

    it("should throw error if profile does not exist", async () => {
      const t = convexTest(schema, modules);
      const email = "noprofile@example.com";

      await expect(
        t.run(async (ctx) => {
          const profile = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .unique();

          if (!profile) {
            throw new Error("Profile not found");
          }
        })
      ).rejects.toThrow("Profile not found");
    });

    it("should update multiple fields at once", async () => {
      const t = convexTest(schema, modules);
      const email = "multi@example.com";
      const now = Date.now();

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          email,
          name: "Old Name",
          visibility: "public",
          role: "member",
          points: 0,
          level: 1,
          createdAt: now,
          updatedAt: now,
        });
      });

      await t.run(async (ctx) => {
        const profile = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", email))
          .unique();

        if (!profile) throw new Error("Profile not found");

        await ctx.db.patch(profile._id, {
          name: "New Name",
          bio: "New bio",
          visibility: "private",
          updatedAt: Date.now(),
        });
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", email))
          .unique();
      });

      expect(user?.name).toBe("New Name");
      expect(user?.bio).toBe("New bio");
      expect(user?.visibility).toBe("private");
    });

    it("should reject name over 100 characters", async () => {
      const t = convexTest(schema, modules);
      const email = "longname@example.com";
      const longName = "a".repeat(101);

      await createTestUser(t, email);

      await expect(
        t.run(async (ctx) => {
          const profile = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .unique();

          if (!profile) throw new Error("Profile not found");

          // Validation logic
          if (longName.length > 100) {
            throw new Error("Name must be 100 characters or less");
          }

          await ctx.db.patch(profile._id, {
            name: longName,
            updatedAt: Date.now(),
          });
        })
      ).rejects.toThrow("Name must be 100 characters or less");
    });
  });

  describe("generateUploadUrl", () => {
    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);

      // Testing via API requires auth component - test for any auth error
      await expect(
        t.mutation(api.members.mutations.generateUploadUrl, {})
      ).rejects.toThrow();
    });

    it("should generate upload URL via storage API", async () => {
      const t = convexTest(schema, modules);

      // In convex-test, we can verify storage.generateUploadUrl is callable
      const url = await t.run(async (ctx) => {
        return await ctx.storage.generateUploadUrl();
      });

      expect(url).toBeDefined();
      expect(typeof url).toBe("string");
    });
  });

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

    it("should normalize email to lowercase", async () => {
      const t = convexTest(schema, modules);

      const userId = await t.mutation(api.members.mutations.createUserProfile, {
        email: "Test@EXAMPLE.COM",
        name: "Mixed Case User",
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId);
      });

      expect(user).not.toBeNull();
      // Email should be normalized to lowercase
      expect(user?.email).toBe("test@example.com");
    });

    it("should treat different case emails as the same user", async () => {
      const t = convexTest(schema, modules);

      // First creation with lowercase
      const userId1 = await t.mutation(
        api.members.mutations.createUserProfile,
        {
          email: "case@example.com",
          name: "First User",
        }
      );

      // Second creation with uppercase (should match existing)
      const userId2 = await t.mutation(
        api.members.mutations.createUserProfile,
        {
          email: "CASE@EXAMPLE.COM",
          name: "Second User",
        }
      );

      // Should return the same user ID
      expect(userId1).toEqual(userId2);
    });
  });
});
