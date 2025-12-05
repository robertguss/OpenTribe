import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.setup";

describe("members queries", () => {
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

    it("should be case-sensitive for email lookup", async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email: "Case@Example.com",
          visibility: "public",
          role: "member",
          points: 0,
          level: 1,
          createdAt: now,
          updatedAt: now,
        });
      });

      // Exact match should work
      const exactMatch = await t.query(
        api.members.queries.getUserProfileByEmail,
        {
          email: "Case@Example.com",
        }
      );
      expect(exactMatch).not.toBeNull();

      // Different case should not match
      const differentCase = await t.query(
        api.members.queries.getUserProfileByEmail,
        {
          email: "case@example.com",
        }
      );
      expect(differentCase).toBeNull();
    });
  });
});
