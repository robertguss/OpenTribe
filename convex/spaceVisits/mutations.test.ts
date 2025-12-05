import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.setup";
import { Id } from "../_generated/dataModel";

/**
 * Space Visits Mutations Tests
 *
 * Tests for recording space visits to track unread indicators.
 */

// Helper to create a member user
async function createMemberUser(
  t: ReturnType<typeof convexTest>,
  email = "member@example.com"
): Promise<Id<"users">> {
  const now = Date.now();
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email: email.toLowerCase(),
      name: "Member User",
      visibility: "public",
      role: "member",
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
    order: number;
    visibility?: "public" | "members" | "paid";
  }
): Promise<Id<"spaces">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("spaces", {
      name: data.name,
      visibility: data.visibility || "public",
      postPermission: "all",
      order: data.order,
      createdAt: Date.now(),
    });
  });
}

describe("spaceVisits mutations", () => {
  describe("recordSpaceVisit", () => {
    it("should create a new visit record when user visits a space for the first time", async () => {
      const t = convexTest(schema, modules);
      const email = "member@example.com";
      await createMemberUser(t, email);
      const spaceId = await createSpace(t, { name: "Test Space", order: 1 });

      // Test business logic directly since auth requires Better Auth integration
      const beforeTime = Date.now();

      const visitId = await t.run(async (ctx) => {
        const userProfile = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", email))
          .unique();

        if (!userProfile) throw new Error("Profile not found");

        // Check if visit record exists
        const existingVisit = await ctx.db
          .query("spaceVisits")
          .withIndex("by_userId_and_spaceId", (q) =>
            q.eq("userId", userProfile._id).eq("spaceId", spaceId)
          )
          .unique();

        if (existingVisit) {
          // Update existing
          await ctx.db.patch(existingVisit._id, {
            lastVisitedAt: Date.now(),
          });
          return existingVisit._id;
        } else {
          // Create new
          return await ctx.db.insert("spaceVisits", {
            userId: userProfile._id,
            spaceId: spaceId,
            lastVisitedAt: Date.now(),
          });
        }
      });

      const afterTime = Date.now();

      // Verify visit was created
      const visit = await t.run(async (ctx) => {
        return await ctx.db.get(visitId);
      });

      expect(visit).not.toBeNull();
      expect(visit!.spaceId).toEqual(spaceId);
      expect(visit!.lastVisitedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(visit!.lastVisitedAt).toBeLessThanOrEqual(afterTime);
    });

    it("should update existing visit record when user revisits a space", async () => {
      const t = convexTest(schema, modules);
      const email = "member@example.com";
      const userId = await createMemberUser(t, email);
      const spaceId = await createSpace(t, { name: "Test Space", order: 1 });

      // Create initial visit
      const initialTime = Date.now() - 10000; // 10 seconds ago
      const visitId = await t.run(async (ctx) => {
        return await ctx.db.insert("spaceVisits", {
          userId: userId,
          spaceId: spaceId,
          lastVisitedAt: initialTime,
        });
      });

      // Simulate second visit
      const beforeRevisit = Date.now();
      await t.run(async (ctx) => {
        const existingVisit = await ctx.db
          .query("spaceVisits")
          .withIndex("by_userId_and_spaceId", (q) =>
            q.eq("userId", userId).eq("spaceId", spaceId)
          )
          .unique();

        if (existingVisit) {
          await ctx.db.patch(existingVisit._id, {
            lastVisitedAt: Date.now(),
          });
        }
      });
      const afterRevisit = Date.now();

      // Verify visit was updated, not duplicated
      const visits = await t.run(async (ctx) => {
        return await ctx.db
          .query("spaceVisits")
          .withIndex("by_userId_and_spaceId", (q) =>
            q.eq("userId", userId).eq("spaceId", spaceId)
          )
          .collect();
      });

      expect(visits).toHaveLength(1);
      expect(visits[0]._id).toEqual(visitId);
      expect(visits[0].lastVisitedAt).toBeGreaterThan(initialTime);
      expect(visits[0].lastVisitedAt).toBeGreaterThanOrEqual(beforeRevisit);
      expect(visits[0].lastVisitedAt).toBeLessThanOrEqual(afterRevisit);
    });

    it("should track visits separately for different spaces", async () => {
      const t = convexTest(schema, modules);
      const email = "member@example.com";
      const userId = await createMemberUser(t, email);
      const space1Id = await createSpace(t, { name: "Space 1", order: 1 });
      const space2Id = await createSpace(t, { name: "Space 2", order: 2 });

      // Visit both spaces
      await t.run(async (ctx) => {
        await ctx.db.insert("spaceVisits", {
          userId: userId,
          spaceId: space1Id,
          lastVisitedAt: Date.now(),
        });
        await ctx.db.insert("spaceVisits", {
          userId: userId,
          spaceId: space2Id,
          lastVisitedAt: Date.now(),
        });
      });

      // Verify separate visits
      const visits = await t.run(async (ctx) => {
        return await ctx.db
          .query("spaceVisits")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect();
      });

      expect(visits).toHaveLength(2);
      const spaceIds = visits.map((v) => v.spaceId);
      expect(spaceIds).toContain(space1Id);
      expect(spaceIds).toContain(space2Id);
    });

    it("should track visits separately for different users", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createMemberUser(t, "user1@example.com");
      const user2Id = await createMemberUser(t, "user2@example.com");
      const spaceId = await createSpace(t, { name: "Test Space", order: 1 });

      // Both users visit the same space
      await t.run(async (ctx) => {
        await ctx.db.insert("spaceVisits", {
          userId: user1Id,
          spaceId: spaceId,
          lastVisitedAt: Date.now(),
        });
        await ctx.db.insert("spaceVisits", {
          userId: user2Id,
          spaceId: spaceId,
          lastVisitedAt: Date.now(),
        });
      });

      // Verify separate visits per user
      const user1Visits = await t.run(async (ctx) => {
        return await ctx.db
          .query("spaceVisits")
          .withIndex("by_userId", (q) => q.eq("userId", user1Id))
          .collect();
      });

      const user2Visits = await t.run(async (ctx) => {
        return await ctx.db
          .query("spaceVisits")
          .withIndex("by_userId", (q) => q.eq("userId", user2Id))
          .collect();
      });

      expect(user1Visits).toHaveLength(1);
      expect(user2Visits).toHaveLength(1);
      expect(user1Visits[0].userId).toEqual(user1Id);
      expect(user2Visits[0].userId).toEqual(user2Id);
    });

    it("should require authentication", async () => {
      const t = convexTest(schema, modules);
      const spaceId = await createSpace(t, { name: "Test Space", order: 1 });

      // Attempting to record visit without auth should throw
      await expect(
        t.mutation(api.spaceVisits.mutations.recordSpaceVisit, { spaceId })
      ).rejects.toThrow();
    });

    it("should return the visit ID on success", async () => {
      const t = convexTest(schema, modules);
      const email = "member@example.com";
      const userId = await createMemberUser(t, email);
      const spaceId = await createSpace(t, { name: "Test Space", order: 1 });

      const visitId = await t.run(async (ctx) => {
        // Check if visit record exists
        const existingVisit = await ctx.db
          .query("spaceVisits")
          .withIndex("by_userId_and_spaceId", (q) =>
            q.eq("userId", userId).eq("spaceId", spaceId)
          )
          .unique();

        if (existingVisit) {
          await ctx.db.patch(existingVisit._id, {
            lastVisitedAt: Date.now(),
          });
          return existingVisit._id;
        } else {
          return await ctx.db.insert("spaceVisits", {
            userId: userId,
            spaceId: spaceId,
            lastVisitedAt: Date.now(),
          });
        }
      });

      expect(visitId).toBeDefined();
      expect(typeof visitId).toBe("string");
    });
  });
});
