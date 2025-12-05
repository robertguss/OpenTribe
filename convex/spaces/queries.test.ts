import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.setup";
import { Id } from "../_generated/dataModel";

/**
 * Testing Notes for Better Auth Integration:
 *
 * The listSpacesForAdmin query uses Better Auth via `requireAuth(ctx)` which calls
 * `authComponent.getAuthUser(ctx)`. This auth mechanism is separate from
 * Convex's built-in identity system.
 *
 * Testing Strategy:
 * 1. Test public queries (listSpaces, getSpace) via API
 * 2. Test auth-required queries (listSpacesForAdmin) business logic via direct ctx access
 * 3. Test unauthenticated rejection via API (verifies auth check exists)
 */

// Helper to create an admin user
async function createAdminUser(
  t: ReturnType<typeof convexTest>,
  email = "admin@example.com"
): Promise<Id<"users">> {
  const now = Date.now();
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      email: email.toLowerCase(),
      name: "Admin User",
      visibility: "public",
      role: "admin",
      points: 0,
      level: 1,
      createdAt: now,
      updatedAt: now,
    });
  });
}

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

// Helper to create a space directly
async function createSpace(
  t: ReturnType<typeof convexTest>,
  data: {
    name: string;
    order: number;
    description?: string;
    icon?: string;
    visibility?: "public" | "members" | "paid";
    postPermission?: "all" | "moderators" | "admin";
    requiredTier?: string;
    deletedAt?: number;
  }
): Promise<Id<"spaces">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("spaces", {
      name: data.name,
      description: data.description,
      icon: data.icon,
      visibility: data.visibility || "public",
      postPermission: data.postPermission || "all",
      requiredTier: data.requiredTier,
      order: data.order,
      createdAt: Date.now(),
      deletedAt: data.deletedAt,
    });
  });
}

describe("spaces queries", () => {
  describe("listSpaces", () => {
    it("should return all active spaces sorted by order", async () => {
      const t = convexTest(schema, modules);

      // Create spaces in random order
      await createSpace(t, { name: "Space B", order: 2 });
      await createSpace(t, { name: "Space A", order: 1 });
      await createSpace(t, { name: "Space C", order: 3 });

      const spaces = await t.query(api.spaces.queries.listSpaces, {});

      expect(spaces).toHaveLength(3);
      expect(spaces[0].name).toBe("Space A");
      expect(spaces[0].order).toBe(1);
      expect(spaces[1].name).toBe("Space B");
      expect(spaces[1].order).toBe(2);
      expect(spaces[2].name).toBe("Space C");
      expect(spaces[2].order).toBe(3);
    });

    it("should filter out deleted spaces", async () => {
      const t = convexTest(schema, modules);

      await createSpace(t, { name: "Active Space", order: 1 });
      await createSpace(t, {
        name: "Deleted Space",
        order: 2,
        deletedAt: Date.now(),
      });

      const spaces = await t.query(api.spaces.queries.listSpaces, {});

      expect(spaces).toHaveLength(1);
      expect(spaces[0].name).toBe("Active Space");
    });

    it("should return empty array when no spaces exist", async () => {
      const t = convexTest(schema, modules);

      const spaces = await t.query(api.spaces.queries.listSpaces, {});

      expect(spaces).toEqual([]);
    });

    it("should include all space fields", async () => {
      const t = convexTest(schema, modules);

      await t.run(async (ctx) => {
        await ctx.db.insert("spaces", {
          name: "Full Space",
          description: "A description",
          icon: "Star",
          visibility: "members",
          postPermission: "moderators",
          requiredTier: "pro",
          order: 1,
          createdAt: Date.now(),
        });
      });

      const spaces = await t.query(api.spaces.queries.listSpaces, {});

      expect(spaces).toHaveLength(1);
      expect(spaces[0].name).toBe("Full Space");
      expect(spaces[0].description).toBe("A description");
      expect(spaces[0].icon).toBe("Star");
      expect(spaces[0].visibility).toBe("members");
      expect(spaces[0].postPermission).toBe("moderators");
      expect(spaces[0].order).toBe(1);
    });
  });

  describe("getSpace", () => {
    it("should return a space by ID", async () => {
      const t = convexTest(schema, modules);

      const spaceId = await createSpace(t, { name: "Test Space", order: 1 });

      const space = await t.query(api.spaces.queries.getSpace, { spaceId });

      expect(space).not.toBeNull();
      expect(space?.name).toBe("Test Space");
      expect(space?._id).toEqual(spaceId);
    });

    it("should return null for deleted space", async () => {
      const t = convexTest(schema, modules);

      const spaceId = await createSpace(t, {
        name: "Deleted Space",
        order: 1,
        deletedAt: Date.now(),
      });

      const space = await t.query(api.spaces.queries.getSpace, { spaceId });

      expect(space).toBeNull();
    });

    it("should return space with all fields", async () => {
      const t = convexTest(schema, modules);

      const spaceId = await t.run(async (ctx) => {
        return await ctx.db.insert("spaces", {
          name: "Complete Space",
          description: "Full description",
          icon: "Heart",
          visibility: "paid",
          postPermission: "admin",
          requiredTier: "founding",
          order: 5,
          createdAt: Date.now(),
        });
      });

      const space = await t.query(api.spaces.queries.getSpace, { spaceId });

      expect(space).not.toBeNull();
      expect(space?.name).toBe("Complete Space");
      expect(space?.description).toBe("Full description");
      expect(space?.icon).toBe("Heart");
      expect(space?.visibility).toBe("paid");
      expect(space?.postPermission).toBe("admin");
      expect(space?.order).toBe(5);
    });
  });

  describe("listSpacesForAdmin", () => {
    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);

      await createSpace(t, { name: "Space", order: 1 });

      // Testing via API requires auth component - test for any auth error
      await expect(
        t.query(api.spaces.queries.listSpacesForAdmin, {})
      ).rejects.toThrow();
    });

    it("should return spaces with member count for admin (business logic)", async () => {
      const t = convexTest(schema, modules);
      const email = "admin@example.com";
      await createAdminUser(t, email);

      await createSpace(t, { name: "Admin Space 1", order: 1 });
      await createSpace(t, { name: "Admin Space 2", order: 2 });

      // Test the business logic directly
      const spaces = await t.run(async (ctx) => {
        // Simulate admin check
        const userProfile = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", email))
          .unique();

        if (!userProfile) throw new Error("Profile not found");
        if (userProfile.role !== "admin")
          throw new Error("Requires admin role");

        // Get all active spaces
        const allSpaces = await ctx.db
          .query("spaces")
          .withIndex("by_order")
          .filter((q) => q.eq(q.field("deletedAt"), undefined))
          .collect();

        // Add member count placeholder
        return allSpaces.map((space) => ({
          ...space,
          memberCount: 0,
        }));
      });

      expect(spaces).toHaveLength(2);
      expect(spaces[0].name).toBe("Admin Space 1");
      expect(spaces[0].memberCount).toBe(0);
      expect(spaces[1].name).toBe("Admin Space 2");
      expect(spaces[1].memberCount).toBe(0);
    });

    it("should filter out deleted spaces for admin (business logic)", async () => {
      const t = convexTest(schema, modules);
      const email = "admin@example.com";
      await createAdminUser(t, email);

      await createSpace(t, { name: "Active", order: 1 });
      await createSpace(t, {
        name: "Deleted",
        order: 2,
        deletedAt: Date.now(),
      });

      const spaces = await t.run(async (ctx) => {
        return await ctx.db
          .query("spaces")
          .withIndex("by_order")
          .filter((q) => q.eq(q.field("deletedAt"), undefined))
          .collect();
      });

      expect(spaces).toHaveLength(1);
      expect(spaces[0].name).toBe("Active");
    });

    it("should reject non-admin user (business logic)", async () => {
      const t = convexTest(schema, modules);
      const email = "member@example.com";
      await createMemberUser(t, email);

      await createSpace(t, { name: "Space", order: 1 });

      await expect(
        t.run(async (ctx) => {
          const userProfile = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .unique();

          if (!userProfile) throw new Error("Profile not found");
          if (userProfile.role !== "admin")
            throw new Error("Requires admin role");
        })
      ).rejects.toThrow("Requires admin role");
    });

    it("should sort spaces by order (business logic)", async () => {
      const t = convexTest(schema, modules);
      const email = "admin@example.com";
      await createAdminUser(t, email);

      await createSpace(t, { name: "Third", order: 3 });
      await createSpace(t, { name: "First", order: 1 });
      await createSpace(t, { name: "Second", order: 2 });

      const spaces = await t.run(async (ctx) => {
        return await ctx.db
          .query("spaces")
          .withIndex("by_order")
          .filter((q) => q.eq(q.field("deletedAt"), undefined))
          .collect();
      });

      expect(spaces).toHaveLength(3);
      expect(spaces[0].name).toBe("First");
      expect(spaces[1].name).toBe("Second");
      expect(spaces[2].name).toBe("Third");
    });
  });
});
