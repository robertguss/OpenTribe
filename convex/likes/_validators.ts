/**
 * Like Validators
 *
 * Type definitions and validators for like-related functions.
 */

import { v } from "convex/values";

// =============================================================================
// Input Validators
// =============================================================================

/**
 * Target type for likes (post or comment).
 */
export const targetTypeValidator = v.union(
  v.literal("post"),
  v.literal("comment")
);

/**
 * Input for toggling a like.
 */
export const toggleLikeInput = {
  targetType: targetTypeValidator,
  targetId: v.string(),
};

/**
 * Input for checking if user has liked.
 */
export const hasUserLikedInput = {
  targetType: targetTypeValidator,
  targetId: v.string(),
};

/**
 * Input for getting like count.
 */
export const getLikeCountInput = {
  targetType: targetTypeValidator,
  targetId: v.string(),
};

// =============================================================================
// Output Validators
// =============================================================================

/**
 * Toggle like result.
 */
export const toggleLikeOutput = v.object({
  liked: v.boolean(),
  newCount: v.number(),
});
