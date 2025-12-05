/**
 * Points System Utilities
 *
 * Centralized point awarding for the OpenTribe gamification system.
 * All point awards MUST go through this helper to ensure consistency.
 *
 * Point Values (from project-context.md):
 * - post_created: 10 points
 * - comment_added: 5 points
 * - like_received: 2 points
 * - lesson_completed: 15 points
 * - course_completed: 50 points
 */

import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// =============================================================================
// Types
// =============================================================================

export type PointAction =
  | "post_created"
  | "comment_added"
  | "like_received"
  | "lesson_completed"
  | "course_completed";

export interface AwardPointsArgs {
  userId: Id<"users">;
  action: PointAction;
  points: number;
  sourceId?: string;
  sourceType?: string;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Default point values for each action.
 * These can be overridden by gamificationConfig table if needed.
 */
export const DEFAULT_POINT_VALUES: Record<PointAction, number> = {
  post_created: 10,
  comment_added: 5,
  like_received: 2,
  lesson_completed: 15,
  course_completed: 50,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Award points to a user and record the transaction.
 *
 * This function:
 * 1. Creates a points history record for audit/display
 * 2. Updates the user's total points
 * 3. Optionally updates the user's level based on new total
 *
 * @param ctx - Mutation context
 * @param args - Point award arguments
 * @returns The created points record ID
 */
export async function awardPoints(
  ctx: MutationCtx,
  args: AwardPointsArgs
): Promise<Id<"points">> {
  const { userId, action, points, sourceId, sourceType } = args;

  // Create points history record
  const pointsRecordId = await ctx.db.insert("points", {
    userId,
    action,
    amount: points,
    referenceType: sourceType,
    referenceId: sourceId,
    createdAt: Date.now(),
  });

  // Update user's total points
  const user = await ctx.db.get(userId);
  if (user) {
    const newTotal = user.points + points;
    await ctx.db.patch(userId, {
      points: newTotal,
      updatedAt: Date.now(),
    });

    // TODO: Check level progression based on newTotal
    // This will be implemented in Epic 6 (Gamification & Engagement)
  }

  return pointsRecordId;
}

/**
 * Get the default point value for an action.
 *
 * @param action - The point action
 * @returns The default point value
 */
export function getDefaultPointValue(action: PointAction): number {
  return DEFAULT_POINT_VALUES[action];
}
