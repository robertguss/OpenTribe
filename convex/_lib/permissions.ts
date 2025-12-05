/**
 * Core Authorization Utilities
 *
 * Centralized permission checking for the OpenTribe platform.
 * Provides consistent authorization across all features.
 *
 * Role Hierarchy: Admin (3) > Moderator (2) > Member (1)
 *
 * ARCHITECTURE NOTE:
 * Better Auth manages user identity (id, email, name, image) in its component tables.
 * Our `users` table stores community-specific extensions (bio, role, points, level, etc.).
 *
 * Current linking approach: Functions require userId parameter for profile lookups.
 * Future enhancement: Add email field to users table for email-based lookups after
 * Better Auth user is obtained via requireAuth().
 */

import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { authComponent } from "../auth";

// =============================================================================
// Types
// =============================================================================

export type Role = "admin" | "moderator" | "member";

export type SpaceVisibility = "public" | "members" | "paid";

export type PostPermission = "all" | "moderators" | "admin";

export type ContentType = "post" | "comment";

// =============================================================================
// Constants
// =============================================================================

/**
 * Role hierarchy for permission comparisons.
 * Higher number = more permissions.
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 3,
  moderator: 2,
  member: 1,
};

// =============================================================================
// Auth Helpers (Task 2)
// =============================================================================

/**
 * Get the currently authenticated Better Auth user.
 * Returns null if not authenticated.
 */
export async function getAuthUser(ctx: QueryCtx | MutationCtx) {
  return await authComponent.getAuthUser(ctx);
}

/**
 * Require authentication. Throws ConvexError if not logged in.
 * Returns the authenticated Better Auth user.
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const user = await getAuthUser(ctx);
  if (!user) {
    throw new ConvexError("You must be logged in");
  }
  return user;
}

/**
 * Get the extended user profile from our users table.
 * Links Better Auth user to our community-specific user data via email.
 * Returns null if user profile not found.
 */
export async function getUserProfile(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  return await ctx.db.get(userId);
}

// =============================================================================
// Role-Based Helpers (Task 3)
// =============================================================================

/**
 * Pure function to compare roles using hierarchy.
 * Returns true if userRole meets or exceeds requiredRole.
 */
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Require a minimum role level. Throws ConvexError if insufficient.
 * Must be authenticated with a user profile.
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  minRole: Role,
  userId: Id<"users">
) {
  const userProfile = await getUserProfile(ctx, userId);
  if (!userProfile) {
    throw new ConvexError("User profile not found");
  }

  if (!hasRole(userProfile.role, minRole)) {
    const roleMessages: Record<Role, string> = {
      admin: "Requires admin role or higher",
      moderator: "Requires moderator role or higher",
      member: "Requires member role or higher",
    };
    throw new ConvexError(roleMessages[minRole]);
  }

  return userProfile;
}

/**
 * Require admin role. Convenience wrapper for requireRole("admin").
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const userProfile = await getUserProfile(ctx, userId);
  if (!userProfile) {
    throw new ConvexError("User profile not found");
  }

  if (!hasRole(userProfile.role, "admin")) {
    throw new ConvexError("Requires admin role or higher");
  }

  return userProfile;
}

/**
 * Require moderator role or higher. Convenience wrapper for requireRole("moderator").
 */
export async function requireModerator(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const userProfile = await getUserProfile(ctx, userId);
  if (!userProfile) {
    throw new ConvexError("User profile not found");
  }

  if (!hasRole(userProfile.role, "moderator")) {
    throw new ConvexError("Requires moderator role or higher");
  }

  return userProfile;
}

// =============================================================================
// Space Permission Helpers (Task 4)
// =============================================================================

/**
 * Check if a user can view a space based on visibility and tier requirements.
 *
 * Visibility rules:
 * - "public": Anyone can view (including unauthenticated)
 * - "members": Any logged-in member can view
 * - "paid": Only members with matching tier can view
 *
 * @returns boolean - true if user can view, false otherwise
 */
export async function canViewSpace(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users"> | null,
  spaceId: Id<"spaces">
): Promise<boolean> {
  const space = await ctx.db.get(spaceId);
  if (!space) {
    return false;
  }

  // Check if space is deleted
  if (space.deletedAt) {
    return false;
  }

  // Public spaces are visible to everyone
  if (space.visibility === "public") {
    return true;
  }

  // Non-public spaces require authentication
  if (!userId) {
    return false;
  }

  const userProfile = await getUserProfile(ctx, userId);
  if (!userProfile) {
    return false;
  }

  // Admins and moderators can always view
  if (hasRole(userProfile.role, "moderator")) {
    return true;
  }

  // Members-only spaces
  if (space.visibility === "members") {
    return true;
  }

  // Paid spaces require matching tier
  if (space.visibility === "paid") {
    if (!space.requiredTier) {
      // If no tier specified, any member can view
      return true;
    }

    // Check membership tier
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!membership) {
      return false;
    }

    if (membership.status !== "active" && membership.status !== "trialing") {
      return false;
    }

    // Simple tier match for now
    // Future: Could implement tier hierarchy (e.g., "founding" includes "pro")
    return membership.tier === space.requiredTier;
  }

  return false;
}

/**
 * Check if a user can post in a space based on postPermission settings.
 *
 * Post permission rules:
 * - "all": Any member who can view the space can post
 * - "moderators": Only moderators and admins can post
 * - "admin": Only admins can post
 *
 * @returns boolean - true if user can post, false otherwise
 */
export async function canPostInSpace(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  spaceId: Id<"spaces">
): Promise<boolean> {
  // Fetch space and user profile in parallel to minimize DB calls
  const [space, userProfile] = await Promise.all([
    ctx.db.get(spaceId),
    getUserProfile(ctx, userId),
  ]);

  if (!space || space.deletedAt || !userProfile) {
    return false;
  }

  // Check view permission inline (avoiding duplicate space fetch)
  // Admins and moderators bypass visibility checks
  if (!hasRole(userProfile.role, "moderator")) {
    // Non-moderators need visibility check
    if (space.visibility === "members") {
      // Members-only: any authenticated member can view
      // (userProfile exists, so they're authenticated)
    } else if (space.visibility === "paid") {
      if (space.requiredTier) {
        // Check membership tier
        const membership = await ctx.db
          .query("memberships")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique();

        if (!membership) {
          return false;
        }

        if (membership.status !== "active" && membership.status !== "trialing") {
          return false;
        }

        if (membership.tier !== space.requiredTier) {
          return false;
        }
      }
      // If no requiredTier, any member can view/post
    }
    // Public spaces: anyone can view, but posting requires authentication (which we have)
  }

  // Now check post permission
  switch (space.postPermission) {
    case "all":
      // Any member who can view can post
      return true;

    case "moderators":
      // Only moderators and admins can post
      return hasRole(userProfile.role, "moderator");

    case "admin":
      // Only admins can post
      return hasRole(userProfile.role, "admin");

    default:
      return false;
  }
}

/**
 * Check if a user can moderate a space (moderator+ role).
 *
 * @returns boolean - true if user can moderate, false otherwise
 */
export async function canModerateSpace(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  spaceId: Id<"spaces">
): Promise<boolean> {
  // Must be able to view the space first
  const canView = await canViewSpace(ctx, userId, spaceId);
  if (!canView) {
    return false;
  }

  const userProfile = await getUserProfile(ctx, userId);
  if (!userProfile) {
    return false;
  }

  return hasRole(userProfile.role, "moderator");
}

// =============================================================================
// Content Permission Helpers (Task 5)
// =============================================================================

/**
 * Check if a user can edit content (post or comment).
 * Users can edit their own content, or moderators+ can edit any content.
 *
 * @param contentId - The ID of the post or comment (as string for flexibility)
 * @param type - The content type ("post" or "comment")
 * @returns boolean - true if user can edit, false otherwise
 */
export async function canEditContent(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  contentId: string,
  type: ContentType
): Promise<boolean> {
  const userProfile = await getUserProfile(ctx, userId);
  if (!userProfile) {
    return false;
  }

  // First, verify the content exists and is not deleted
  let content: { authorId: Id<"users">; deletedAt?: number } | null = null;

  if (type === "post") {
    content = await ctx.db.get(contentId as Id<"posts">);
  } else if (type === "comment") {
    content = await ctx.db.get(contentId as Id<"comments">);
  }

  // Content must exist and not be deleted
  if (!content || content.deletedAt) {
    return false;
  }

  // Moderators and admins can edit any existing content
  if (hasRole(userProfile.role, "moderator")) {
    return true;
  }

  // Regular users can only edit their own content
  return content.authorId === userId;
}

/**
 * Check if a user can delete content (post or comment).
 * Users can delete their own content, or moderators+ can delete any content.
 *
 * @param contentId - The ID of the post or comment (as string for flexibility)
 * @param type - The content type ("post" or "comment")
 * @returns boolean - true if user can delete, false otherwise
 */
export async function canDeleteContent(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  contentId: string,
  type: ContentType
): Promise<boolean> {
  // Same logic as edit permissions
  return canEditContent(ctx, userId, contentId, type);
}
