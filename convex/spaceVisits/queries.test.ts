import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.setup";
import { Id } from "../_generated/dataModel";

/**
 * Space Visits Queries Tests
 *
 * Tests for retrieving space visits to determine unread status.
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

// Helper to create a space visit
async function createSpaceVisit(
  t: ReturnType<typeof convexTest>,
  userId: Id<"users">,
  spaceId: Id<"spaces">,
  lastVisitedAt: number
): Promise<Id<"spaceVisits">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("spaceVisits", {
      userId,
      spaceId,
      lastVisitedAt,
    });
  });
}

describe("spaceVisits queries", () => {
  describe("getSpaceVisits", () => {
    it("should return all space visits for the current user", async () => {
      const t = convexTest(schema, modules);
      const email = "member@example.com";
      const userId = await createMemberUser(t, email);
      const space1Id = await createSpace(t, { name: "Space 1", order: 1 });
      const space2Id = await createSpace(t, { name: "Space 2", order: 2 });

      const visit1Time = Date.now() - 5000;
      const visit2Time = Date.now();
      await createSpaceVisit(t, userId, space1Id, visit1Time);
      await createSpaceVisit(t, userId, space2Id, visit2Time);

      // Test business logic directly
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

    it("should return empty array when user has no visits", async () => {
      const t = convexTest(schema, modules);
      const email = "member@example.com";
      const userId = await createMemberUser(t, email);

      // Create space but don't visit
      await createSpace(t, { name: "Unvisited Space", order: 1 });

      const visits = await t.run(async (ctx) => {
        return await ctx.db
          .query("spaceVisits")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect();
      });

      expect(visits).toEqual([]);
    });

    it("should not return visits from other users", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createMemberUser(t, "user1@example.com");
      const user2Id = await createMemberUser(t, "user2@example.com");
      const spaceId = await createSpace(t, { name: "Test Space", order: 1 });

      // Both users visit the space
      await createSpaceVisit(t, user1Id, spaceId, Date.now());
      await createSpaceVisit(t, user2Id, spaceId, Date.now());

      // Query for user1 only
      const user1Visits = await t.run(async (ctx) => {
        return await ctx.db
          .query("spaceVisits")
          .withIndex("by_userId", (q) => q.eq("userId", user1Id))
          .collect();
      });

      expect(user1Visits).toHaveLength(1);
      expect(user1Visits[0].userId).toEqual(user1Id);
    });

    it("should include lastVisitedAt timestamp for each visit", async () => {
      const t = convexTest(schema, modules);
      const email = "member@example.com";
      const userId = await createMemberUser(t, email);
      const spaceId = await createSpace(t, { name: "Test Space", order: 1 });

      const visitTime = Date.now() - 3600000; // 1 hour ago
      await createSpaceVisit(t, userId, spaceId, visitTime);

      const visits = await t.run(async (ctx) => {
        return await ctx.db
          .query("spaceVisits")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect();
      });

      expect(visits).toHaveLength(1);
      expect(visits[0].lastVisitedAt).toBe(visitTime);
    });

    it("should require authentication", async () => {
      const t = convexTest(schema, modules);

      // Attempting to get visits without auth should throw
      await expect(
        t.query(api.spaceVisits.queries.getSpaceVisits, {})
      ).rejects.toThrow();
    });

    it("should return visits as objects with all required fields", async () => {
      const t = convexTest(schema, modules);
      const email = "member@example.com";
      const userId = await createMemberUser(t, email);
      const spaceId = await createSpace(t, { name: "Test Space", order: 1 });

      const visitTime = Date.now();
      const visitId = await createSpaceVisit(t, userId, spaceId, visitTime);

      const visits = await t.run(async (ctx) => {
        return await ctx.db
          .query("spaceVisits")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect();
      });

      expect(visits).toHaveLength(1);
      expect(visits[0]._id).toEqual(visitId);
      expect(visits[0].userId).toEqual(userId);
      expect(visits[0].spaceId).toEqual(spaceId);
      expect(visits[0].lastVisitedAt).toEqual(visitTime);
    });
  });

  describe("getSpaceVisit (single visit lookup)", () => {
    it("should return visit record for specific space", async () => {
      const t = convexTest(schema, modules);
      const email = "member@example.com";
      const userId = await createMemberUser(t, email);
      const spaceId = await createSpace(t, { name: "Test Space", order: 1 });

      const visitTime = Date.now();
      await createSpaceVisit(t, userId, spaceId, visitTime);

      const visit = await t.run(async (ctx) => {
        return await ctx.db
          .query("spaceVisits")
          .withIndex("by_userId_and_spaceId", (q) =>
            q.eq("userId", userId).eq("spaceId", spaceId)
          )
          .unique();
      });

      expect(visit).not.toBeNull();
      expect(visit!.spaceId).toEqual(spaceId);
      expect(visit!.lastVisitedAt).toEqual(visitTime);
    });

    it("should return null when no visit record exists", async () => {
      const t = convexTest(schema, modules);
      const email = "member@example.com";
      const userId = await createMemberUser(t, email);
      const spaceId = await createSpace(t, {
        name: "Unvisited Space",
        order: 1,
      });

      const visit = await t.run(async (ctx) => {
        return await ctx.db
          .query("spaceVisits")
          .withIndex("by_userId_and_spaceId", (q) =>
            q.eq("userId", userId).eq("spaceId", spaceId)
          )
          .unique();
      });

      expect(visit).toBeNull();
    });
  });
});
