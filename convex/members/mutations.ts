/**
 * Member Mutations
 *
 * Handles user profile creation and updates for the OpenTribe platform.
 * Links Better Auth users to our extended community profiles.
 */

import { ConvexError } from "convex/values";
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { rateLimit } from "../_lib/rateLimits";
import { requireAuth } from "../_lib/permissions";

// Maximum avatar file size: 5MB
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

/**
 * Update the current user's profile.
 *
 * Requires authentication. Allows partial updates to profile fields.
 * Only the authenticated user can update their own profile.
 *
 * @param name - Optional display name (max 100 chars)
 * @param bio - Optional bio (max 500 chars)
 * @param visibility - Optional visibility setting ("public" or "private")
 * @param avatarStorageId - Optional avatar storage ID (file must be <5MB)
 * @throws ConvexError if not authenticated, profile not found, or validation fails
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
    avatarStorageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const authUser = await requireAuth(ctx);

    // Find user profile by email
    const profile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!profile) {
      throw new ConvexError("Profile not found");
    }

    // Validate bio length
    if (args.bio !== undefined && args.bio.length > 500) {
      throw new ConvexError("Bio must be 500 characters or less");
    }

    // Validate name length
    if (args.name !== undefined && args.name.length > 100) {
      throw new ConvexError("Name must be 100 characters or less");
    }

    // Validate avatar file size (server-side enforcement)
    if (args.avatarStorageId !== undefined) {
      const metadata = await ctx.db.system.get(args.avatarStorageId);
      if (!metadata) {
        throw new ConvexError("Avatar file not found in storage");
      }
      if (metadata.size > MAX_AVATAR_SIZE) {
        // Delete the oversized file to prevent storage abuse
        await ctx.storage.delete(args.avatarStorageId);
        throw new ConvexError("Avatar file must be less than 5MB");
      }
    }

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.bio !== undefined) {
      updates.bio = args.bio;
    }
    if (args.visibility !== undefined) {
      updates.visibility = args.visibility;
    }
    if (args.avatarStorageId !== undefined) {
      updates.avatarStorageId = args.avatarStorageId;
    }

    // Use patch for partial update
    await ctx.db.patch(profile._id, updates);

    return null;
  },
});

/**
 * Generate an upload URL for avatar images.
 *
 * Requires authentication. Returns a URL that can be used to upload
 * a file directly to Convex storage.
 *
 * @returns Upload URL string
 * @throws ConvexError if not authenticated
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Update the current user's notification preferences.
 *
 * Requires authentication. Updates all notification preference fields.
 * Only the authenticated user can update their own preferences.
 *
 * @param emailComments - Receive email notifications for comments on posts
 * @param emailReplies - Receive email notifications for replies to comments
 * @param emailFollowers - Receive email notifications for new followers
 * @param emailEvents - Receive email notifications for event reminders
 * @param emailCourses - Receive email notifications for course updates
 * @param emailDMs - Receive email notifications for direct messages
 * @param digestFrequency - Email digest frequency: immediate, daily, weekly, or off
 * @throws ConvexError if not authenticated or profile not found
 */
export const updateNotificationPrefs = mutation({
  args: {
    emailComments: v.boolean(),
    emailReplies: v.boolean(),
    emailFollowers: v.boolean(),
    emailEvents: v.boolean(),
    emailCourses: v.boolean(),
    emailDMs: v.boolean(),
    digestFrequency: v.union(
      v.literal("immediate"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("off")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const authUser = await requireAuth(ctx);

    // Find user profile by email
    const profile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!profile) {
      throw new ConvexError("Profile not found");
    }

    // Update notification preferences
    await ctx.db.patch(profile._id, {
      notificationPrefs: {
        emailComments: args.emailComments,
        emailReplies: args.emailReplies,
        emailFollowers: args.emailFollowers,
        emailEvents: args.emailEvents,
        emailCourses: args.emailCourses,
        emailDMs: args.emailDMs,
        digestFrequency: args.digestFrequency,
      },
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Create a new user profile in the users table.
 *
 * This mutation is idempotent - if a profile already exists for the email,
 * it returns the existing profile ID instead of creating a duplicate.
 *
 * Called after successful Better Auth signup to create the extended profile.
 *
 * Features:
 * - Rate limited: 10 requests per minute with burst capacity of 3
 * - Email normalized to lowercase for consistent lookups
 * - Idempotent: returns existing profile if email already registered
 *
 * @param email - User's email address (links to Better Auth user)
 * @param name - Optional display name
 * @returns The user's profile ID
 * @throws ConvexError if rate limited
 */
export const createUserProfile = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // Normalize email to lowercase for consistent lookups
    const normalizedEmail = args.email.toLowerCase().trim();

    // Rate limit by email to prevent abuse
    const { ok, retryAt } = await rateLimit(ctx, {
      name: "createProfile",
      key: normalizedEmail,
    });

    if (!ok) {
      throw new ConvexError({
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
        retryAt,
      });
    }

    // Check if profile already exists (idempotent operation)
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();

    if (existing) {
      return existing._id;
    }

    const now = Date.now();

    // Default notification preferences for new users
    const defaultNotificationPrefs = {
      emailComments: true,
      emailReplies: true,
      emailFollowers: true,
      emailEvents: true,
      emailCourses: true,
      emailDMs: true,
      digestFrequency: "daily" as const,
    };

    // Create new user profile with default values
    const userId = await ctx.db.insert("users", {
      email: normalizedEmail,
      name: args.name,
      visibility: "public",
      role: "member",
      points: 0,
      level: 1,
      notificationPrefs: defaultNotificationPrefs,
      createdAt: now,
      updatedAt: now,
    });

    // Create default membership record for the user
    await ctx.db.insert("memberships", {
      userId,
      tier: "free",
      status: "none",
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});
