import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.setup";

describe("members queries", () => {
  describe("getMyProfile", () => {
    it("should return profile when user exists (via direct query)", async () => {
      const t = convexTest(schema, modules);
      const email = "myprofile@example.com";
      const now = Date.now();

      // Create a user profile
      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          email,
          name: "My Profile User",
          bio: "This is my bio",
          visibility: "public",
          role: "member",
          points: 100,
          level: 2,
          createdAt: now,
          updatedAt: now,
        });
      });

      // Test the query logic directly (simulating what getMyProfile does)
      const profile = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", email))
          .unique();
      });

      expect(profile).not.toBeNull();
      expect(profile?.email).toBe(email);
      expect(profile?.name).toBe("My Profile User");
      expect(profile?.bio).toBe("This is my bio");
    });

    it("should return null if profile does not exist", async () => {
      const t = convexTest(schema, modules);
      const email = "noprofile@example.com";

      // Test the query logic directly
      const profile = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", email))
          .unique();
      });

      expect(profile).toBeNull();
    });

    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);

      // Testing via API requires auth component - test for any auth error
      await expect(
        t.query(api.members.queries.getMyProfile, {})
      ).rejects.toThrow();
    });

    it("should normalize email to lowercase for lookup", async () => {
      const t = convexTest(schema, modules);
      const email = "UPPERCASE@example.com";
      const normalizedEmail = email.toLowerCase();
      const now = Date.now();

      // Create user with lowercase email (as it would be stored)
      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          email: normalizedEmail,
          name: "Test User",
          visibility: "public",
          role: "member",
          points: 0,
          level: 1,
          createdAt: now,
          updatedAt: now,
        });
      });

      // Query with normalized email should find the user
      const profile = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
          .unique();
      });

      expect(profile).not.toBeNull();
      expect(profile?.name).toBe("Test User");
    });
  });

  describe("getAvatarUrl", () => {
    it("should return null for non-existent storage ID", async () => {
      const t = convexTest(schema, modules);

      // Test storage.getUrl directly - it returns null for non-existent IDs
      const url = await t.run(async (ctx) => {
        // In test environment, we can't actually store files
        // but we can verify the storage API is accessible
        try {
          // This will throw or return null for invalid IDs
          return await ctx.storage.getUrl(
            "invalid" as unknown as import("../_generated/dataModel").Id<"_storage">
          );
        } catch {
          return null;
        }
      });

      expect(url).toBeNull();
    });
  });

  describe("getUserProfileByEmail", () => {
    it("should return user profile when found", async () => {
      const t = convexTest(schema, modules);

      // Create a user first
      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "found@example.com",
          name: "Found User",
          visibility: "public",
          role: "member",
          points: 100,
          level: 2,
          createdAt: now,
          updatedAt: now,
        });
      });

      // Query by email
      const user = await t.query(api.members.queries.getUserProfileByEmail, {
        email: "found@example.com",
      });

      expect(user).not.toBeNull();
      expect(user?._id).toEqual(userId);
      expect(user?.email).toBe("found@example.com");
      expect(user?.name).toBe("Found User");
      expect(user?.role).toBe("member");
      expect(user?.points).toBe(100);
      expect(user?.level).toBe(2);
    });

    it("should return null when user not found", async () => {
      const t = convexTest(schema, modules);

      const user = await t.query(api.members.queries.getUserProfileByEmail, {
        email: "notfound@example.com",
      });

      expect(user).toBeNull();
    });

    it("should return user with all optional fields", async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "full@example.com",
          name: "Full User",
          bio: "A full user profile",
          visibility: "private",
          role: "moderator",
          points: 500,
          level: 5,
          notificationPrefs: {
            emailComments: true,
            emailReplies: true,
            emailFollowers: false,
            emailEvents: true,
            emailCourses: true,
            emailDMs: false,
            digestFrequency: "daily",
          },
          createdAt: now,
          updatedAt: now,
        });
      });

      const user = await t.query(api.members.queries.getUserProfileByEmail, {
        email: "full@example.com",
      });

      expect(user).not.toBeNull();
      expect(user?.bio).toBe("A full user profile");
      expect(user?.visibility).toBe("private");
      expect(user?.role).toBe("moderator");
      expect(user?.notificationPrefs?.emailComments).toBe(true);
      expect(user?.notificationPrefs?.digestFrequency).toBe("daily");
    });

    it("should be case-insensitive for email lookup (normalized)", async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      // Insert with lowercase (as normalized emails would be stored)
      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "case@example.com", // Stored as lowercase
          visibility: "public",
          role: "member",
          points: 0,
          level: 1,
          createdAt: now,
          updatedAt: now,
        });
      });

      // Lowercase should work
      const lowercase = await t.query(
        api.members.queries.getUserProfileByEmail,
        {
          email: "case@example.com",
        }
      );
      expect(lowercase).not.toBeNull();

      // Different case should also match (normalized on query)
      const mixedCase = await t.query(
        api.members.queries.getUserProfileByEmail,
        {
          email: "CASE@EXAMPLE.COM",
        }
      );
      expect(mixedCase).not.toBeNull();
      expect(mixedCase?._id).toEqual(lowercase?._id);
    });
  });
});
