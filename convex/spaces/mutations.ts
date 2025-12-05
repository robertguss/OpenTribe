/**
 * Space Mutations
 *
 * CRUD operations for community spaces in the OpenTribe platform.
 * All mutations require admin role for authorization.
 */

import { ConvexError, v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAuth, requireAdmin } from "../_lib/permissions";

/**
 * Create a new community space.
 *
 * Requires admin role. Creates a space with the specified settings.
 * Order is automatically set to the next available position.
 *
 * @param name - Space name (1-50 characters, required)
 * @param description - Space description (0-200 characters, optional)
 * @param icon - Emoji or Lucide icon name (optional)
 * @param visibility - "public", "members", or "paid"
 * @param postPermission - "all", "moderators", or "admin"
 * @param requiredTier - Tier ID for paid spaces (optional)
 * @returns The new space ID
 * @throws ConvexError if not admin or validation fails
 */
export const createSpace = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    visibility: v.union(
      v.literal("public"),
      v.literal("members"),
      v.literal("paid")
    ),
    postPermission: v.union(
      v.literal("all"),
      v.literal("moderators"),
      v.literal("admin")
    ),
    requiredTier: v.optional(v.string()),
  },
  returns: v.id("spaces"),
  handler: async (ctx, args) => {
    // 1. Auth check
    const authUser = await requireAuth(ctx);

    // Find user profile by email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      throw new ConvexError("Profile not found");
    }

    // 2. Require admin role
    await requireAdmin(ctx, userProfile._id);

    // 3. Validate name length
    if (args.name.length < 1 || args.name.length > 50) {
      throw new ConvexError("Name must be 1-50 characters");
    }

    // 4. Validate description length
    if (args.description !== undefined && args.description.length > 200) {
      throw new ConvexError("Description must be 200 characters or less");
    }

    // 5. Get next order (max existing order + 1)
    const spaces = await ctx.db
      .query("spaces")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
    const maxOrder =
      spaces.length > 0 ? Math.max(...spaces.map((s) => s.order)) : 0;

    // 6. Create space
    const spaceId = await ctx.db.insert("spaces", {
      name: args.name,
      description: args.description,
      icon: args.icon,
      visibility: args.visibility,
      postPermission: args.postPermission,
      requiredTier: args.requiredTier,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });

    return spaceId;
  },
});

/**
 * Update an existing space.
 *
 * Requires admin role. Allows partial updates to space fields.
 *
 * @param spaceId - ID of the space to update
 * @param name - Space name (1-50 characters, optional)
 * @param description - Space description (0-200 characters, optional)
 * @param icon - Emoji or Lucide icon name (optional)
 * @param visibility - "public", "members", or "paid" (optional)
 * @param postPermission - "all", "moderators", or "admin" (optional)
 * @param requiredTier - Tier ID for paid spaces (optional)
 * @returns null on success
 * @throws ConvexError if not admin, space not found, or validation fails
 */
export const updateSpace = mutation({
  args: {
    spaceId: v.id("spaces"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    visibility: v.optional(
      v.union(v.literal("public"), v.literal("members"), v.literal("paid"))
    ),
    postPermission: v.optional(
      v.union(v.literal("all"), v.literal("moderators"), v.literal("admin"))
    ),
    requiredTier: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // 1. Auth check
    const authUser = await requireAuth(ctx);

    // Find user profile by email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      throw new ConvexError("Profile not found");
    }

    // 2. Require admin role
    await requireAdmin(ctx, userProfile._id);

    // 3. Get space
    const space = await ctx.db.get(args.spaceId);
    if (!space || space.deletedAt) {
      throw new ConvexError("Space not found");
    }

    // 4. Validate name length if provided
    if (
      args.name !== undefined &&
      (args.name.length < 1 || args.name.length > 50)
    ) {
      throw new ConvexError("Name must be 1-50 characters");
    }

    // 5. Validate description length if provided
    if (args.description !== undefined && args.description.length > 200) {
      throw new ConvexError("Description must be 200 characters or less");
    }

    // 6. Build update object with only provided fields
    const updates: Record<string, unknown> = {};

    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.description !== undefined) {
      updates.description = args.description;
    }
    if (args.icon !== undefined) {
      updates.icon = args.icon;
    }
    if (args.visibility !== undefined) {
      updates.visibility = args.visibility;
    }
    if (args.postPermission !== undefined) {
      updates.postPermission = args.postPermission;
    }
    if (args.requiredTier !== undefined) {
      updates.requiredTier = args.requiredTier;
    }

    // 7. Apply updates
    await ctx.db.patch(args.spaceId, updates);

    return null;
  },
});

/**
 * Soft delete a space.
 *
 * Requires admin role. Sets deletedAt timestamp instead of hard deleting.
 * Associated posts are NOT deleted (they become orphaned but preserved).
 *
 * @param spaceId - ID of the space to delete
 * @returns null on success
 * @throws ConvexError if not admin or space not found
 */
export const deleteSpace = mutation({
  args: {
    spaceId: v.id("spaces"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // 1. Auth check
    const authUser = await requireAuth(ctx);

    // Find user profile by email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      throw new ConvexError("Profile not found");
    }

    // 2. Require admin role
    await requireAdmin(ctx, userProfile._id);

    // 3. Get space
    const space = await ctx.db.get(args.spaceId);
    if (!space || space.deletedAt) {
      throw new ConvexError("Space not found");
    }

    // 4. Soft delete by setting deletedAt
    await ctx.db.patch(args.spaceId, {
      deletedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Reorder spaces by updating their order field.
 *
 * Requires admin role. Accepts an array of space IDs in their new order
 * and updates each space's order field atomically.
 *
 * @param spaceIds - Array of space IDs in the desired order
 * @returns null on success
 * @throws ConvexError if not admin or any space not found
 */
export const reorderSpaces = mutation({
  args: {
    spaceIds: v.array(v.id("spaces")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // 1. Auth check
    const authUser = await requireAuth(ctx);

    // Find user profile by email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      throw new ConvexError("Profile not found");
    }

    // 2. Require admin role
    await requireAdmin(ctx, userProfile._id);

    // 3. Verify all spaces exist and are not deleted
    for (const spaceId of args.spaceIds) {
      const space = await ctx.db.get(spaceId);
      if (!space || space.deletedAt) {
        throw new ConvexError(`Space not found: ${spaceId}`);
      }
    }

    // 4. Update order for each space
    for (let i = 0; i < args.spaceIds.length; i++) {
      await ctx.db.patch(args.spaceIds[i], {
        order: i + 1,
      });
    }

    return null;
  },
});
