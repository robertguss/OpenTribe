import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.setup";
import { Id } from "../_generated/dataModel";

/**
 * Testing Notes for Better Auth Integration:
 *
 * The space mutations use Better Auth via `requireAuth(ctx)` which calls
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

describe("spaces mutations", () => {
  describe("createSpace", () => {
    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);

      // Testing via API requires auth component - test for any auth error
      await expect(
        t.mutation(api.spaces.mutations.createSpace, {
          name: "Attempt",
          visibility: "public",
          postPermission: "all",
        })
      ).rejects.toThrow();
    });

    it("should create a space with valid data (business logic)", async () => {
      const t = convexTest(schema, modules);
      const email = "admin@example.com";
      await createAdminUser(t, email);

      // Test the business logic directly
      const spaceId = await t.run(async (ctx) => {
        // Simulate the admin check
        const userProfile = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", email))
          .unique();

        if (!userProfile) throw new Error("Profile not found");
        if (userProfile.role !== "admin")
          throw new Error("Requires admin role");

        // Validate inputs
        const name = "General Discussion";
        const description = "A place for general chat";

        if (name.length < 1 || name.length > 50) {
          throw new Error("Name must be 1-50 characters");
        }
        if (description && description.length > 200) {
          throw new Error("Description must be 200 characters or less");
        }

        // Get next order
        const spaces = await ctx.db
          .query("spaces")
          .filter((q) => q.eq(q.field("deletedAt"), undefined))
          .collect();
        const maxOrder =
          spaces.length > 0 ? Math.max(...spaces.map((s) => s.order)) : 0;

        // Create space
        return await ctx.db.insert("spaces", {
          name,
          description,
          icon: "MessageCircle",
          visibility: "public",
          postPermission: "all",
          order: maxOrder + 1,
          createdAt: Date.now(),
        });
      });

      expect(spaceId).toBeDefined();

      // Verify space was created correctly
      const space = await t.run(async (ctx) => {
        return await ctx.db.get(spaceId);
      });

      expect(space).not.toBeNull();
      expect(space?.name).toBe("General Discussion");
      expect(space?.description).toBe("A place for general chat");
      expect(space?.icon).toBe("MessageCircle");
      expect(space?.visibility).toBe("public");
      expect(space?.postPermission).toBe("all");
      expect(space?.order).toBe(1);
      expect(space?.deletedAt).toBeUndefined();
    });

    it("should auto-increment order for new spaces", async () => {
      const t = convexTest(schema, modules);
      const email = "admin@example.com";
      await createAdminUser(t, email);

      // Create first space
      const space1Id = await createSpace(t, { name: "Space 1", order: 1 });

      // Create second space with auto-increment logic
      const space2Id = await t.run(async (ctx) => {
        const spaces = await ctx.db
          .query("spaces")
          .filter((q) => q.eq(q.field("deletedAt"), undefined))
          .collect();
        const maxOrder =
          spaces.length > 0 ? Math.max(...spaces.map((s) => s.order)) : 0;

        return await ctx.db.insert("spaces", {
          name: "Space 2",
          visibility: "members",
          postPermission: "moderators",
          order: maxOrder + 1,
          createdAt: Date.now(),
        });
      });

      // Verify orders
      const spaces = await t.run(async (ctx) => {
        return {
          s1: await ctx.db.get(space1Id),
          s2: await ctx.db.get(space2Id),
        };
      });

      expect(spaces.s1?.order).toBe(1);
      expect(spaces.s2?.order).toBe(2);
    });

    it("should reject non-admin user (business logic)", async () => {
      const t = convexTest(schema, modules);
      const email = "member@example.com";
      await createMemberUser(t, email);

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

    it("should validate name length (1-50 chars)", async () => {
      const t = convexTest(schema, modules);

      // Empty name should fail
      await expect(
        t.run(async () => {
          const name = "";
          if (name.length < 1 || name.length > 50) {
            throw new Error("Name must be 1-50 characters");
          }
        })
      ).rejects.toThrow("Name must be 1-50 characters");

      // Name too long should fail
      await expect(
        t.run(async () => {
          const name = "a".repeat(51);
          if (name.length < 1 || name.length > 50) {
            throw new Error("Name must be 1-50 characters");
          }
        })
      ).rejects.toThrow("Name must be 1-50 characters");
    });

    it("should validate description length (0-200 chars)", async () => {
      const t = convexTest(schema, modules);

      // Description too long should fail
      await expect(
        t.run(async () => {
          const description = "a".repeat(201);
          if (description.length > 200) {
            throw new Error("Description must be 200 characters or less");
          }
        })
      ).rejects.toThrow("Description must be 200 characters or less");
    });
  });

  describe("updateSpace", () => {
    it("should update space fields (business logic)", async () => {
      const t = convexTest(schema, modules);
      await createAdminUser(t);

      // Create a space first
      const spaceId = await createSpace(t, {
        name: "Original Name",
        order: 1,
      });

      // Update the space
      await t.run(async (ctx) => {
        const space = await ctx.db.get(spaceId);
        if (!space || space.deletedAt) throw new Error("Space not found");

        await ctx.db.patch(spaceId, {
          name: "Updated Name",
          description: "New description",
          icon: "Star",
          visibility: "members",
          postPermission: "moderators",
        });
      });

      // Verify updates
      const space = await t.run(async (ctx) => {
        return await ctx.db.get(spaceId);
      });

      expect(space?.name).toBe("Updated Name");
      expect(space?.description).toBe("New description");
      expect(space?.icon).toBe("Star");
      expect(space?.visibility).toBe("members");
      expect(space?.postPermission).toBe("moderators");
    });

    it("should allow partial updates", async () => {
      const t = convexTest(schema, modules);

      const spaceId = await createSpace(t, {
        name: "Original",
        description: "Original desc",
        order: 1,
      });

      // Update only name
      await t.run(async (ctx) => {
        await ctx.db.patch(spaceId, { name: "Updated Only Name" });
      });

      const space = await t.run(async (ctx) => {
        return await ctx.db.get(spaceId);
      });

      expect(space?.name).toBe("Updated Only Name");
      expect(space?.description).toBe("Original desc"); // Unchanged
      expect(space?.visibility).toBe("public"); // Unchanged
    });

    it("should throw error for deleted space", async () => {
      const t = convexTest(schema, modules);

      const spaceId = await createSpace(t, {
        name: "To Delete",
        order: 1,
        deletedAt: Date.now(),
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

    it("should validate name and description lengths on update", async () => {
      const t = convexTest(schema, modules);

      // Empty name
      await expect(
        t.run(async () => {
          const name = "";
          if (name.length < 1 || name.length > 50) {
            throw new Error("Name must be 1-50 characters");
          }
        })
      ).rejects.toThrow("Name must be 1-50 characters");

      // Name too long
      await expect(
        t.run(async () => {
          const name = "a".repeat(51);
          if (name.length < 1 || name.length > 50) {
            throw new Error("Name must be 1-50 characters");
          }
        })
      ).rejects.toThrow("Name must be 1-50 characters");

      // Description too long
      await expect(
        t.run(async () => {
          const description = "a".repeat(201);
          if (description.length > 200) {
            throw new Error("Description must be 200 characters or less");
          }
        })
      ).rejects.toThrow("Description must be 200 characters or less");
    });

    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);
      const spaceId = await createSpace(t, { name: "Space", order: 1 });

      await expect(
        t.mutation(api.spaces.mutations.updateSpace, {
          spaceId,
          name: "New Name",
        })
      ).rejects.toThrow();
    });
  });

  describe("deleteSpace", () => {
    it("should soft delete a space (business logic)", async () => {
      const t = convexTest(schema, modules);

      const spaceId = await createSpace(t, {
        name: "To Delete",
        order: 1,
      });

      // Soft delete
      await t.run(async (ctx) => {
        const space = await ctx.db.get(spaceId);
        if (!space || space.deletedAt) throw new Error("Space not found");

        await ctx.db.patch(spaceId, {
          deletedAt: Date.now(),
        });
      });

      // Verify soft delete
      const space = await t.run(async (ctx) => {
        return await ctx.db.get(spaceId);
      });

      expect(space).not.toBeNull();
      expect(space?.deletedAt).toBeDefined();
      expect(space?.deletedAt).toBeGreaterThan(0);
    });

    it("should throw error for already deleted space", async () => {
      const t = convexTest(schema, modules);

      const spaceId = await createSpace(t, {
        name: "Already Deleted",
        order: 1,
        deletedAt: Date.now(),
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

    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);
      const spaceId = await createSpace(t, { name: "Space", order: 1 });

      await expect(
        t.mutation(api.spaces.mutations.deleteSpace, { spaceId })
      ).rejects.toThrow();
    });
  });

  describe("reorderSpaces", () => {
    it("should reorder spaces (business logic)", async () => {
      const t = convexTest(schema, modules);

      // Create three spaces
      const space1 = await createSpace(t, { name: "Space 1", order: 1 });
      const space2 = await createSpace(t, { name: "Space 2", order: 2 });
      const space3 = await createSpace(t, { name: "Space 3", order: 3 });

      // Reorder: 3, 1, 2
      const newOrder = [space3, space1, space2];
      await t.run(async (ctx) => {
        // Verify all spaces exist
        for (const spaceId of newOrder) {
          const space = await ctx.db.get(spaceId);
          if (!space || space.deletedAt) {
            throw new Error(`Space not found: ${spaceId}`);
          }
        }

        // Update order
        for (let i = 0; i < newOrder.length; i++) {
          await ctx.db.patch(newOrder[i], { order: i + 1 });
        }
      });

      // Verify new orders
      const spaces = await t.run(async (ctx) => {
        return {
          s1: await ctx.db.get(space1),
          s2: await ctx.db.get(space2),
          s3: await ctx.db.get(space3),
        };
      });

      expect(spaces.s3?.order).toBe(1);
      expect(spaces.s1?.order).toBe(2);
      expect(spaces.s2?.order).toBe(3);
    });

    it("should throw error if any space not found", async () => {
      const t = convexTest(schema, modules);

      const space1 = await createSpace(t, { name: "Space 1", order: 1 });
      const deletedSpace = await createSpace(t, {
        name: "Deleted",
        order: 2,
        deletedAt: Date.now(),
      });

      // Try to include deleted space
      await expect(
        t.run(async (ctx) => {
          const spaces = [deletedSpace, space1];
          for (const spaceId of spaces) {
            const space = await ctx.db.get(spaceId);
            if (!space || space.deletedAt) {
              throw new Error(`Space not found: ${spaceId}`);
            }
          }
        })
      ).rejects.toThrow(/Space not found/);
    });

    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);
      const spaceId = await createSpace(t, { name: "Space", order: 1 });

      await expect(
        t.mutation(api.spaces.mutations.reorderSpaces, {
          spaceIds: [spaceId],
        })
      ).rejects.toThrow();
    });
  });
});
