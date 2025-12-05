/**
 * Notification Mutations
 *
 * Internal mutations for rate limiting notification-related actions.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { rateLimit } from "../_lib/rateLimits";

/**
 * Check if a password reset email can be sent (rate limit check).
 *
 * Rate limit: 3 attempts per hour per email
 * This prevents email spam and enumeration attacks.
 *
 * @param email - The email address to check rate limit for
 * @returns { allowed: boolean, retryAt?: number }
 */
export const checkPasswordResetRateLimit = internalMutation({
  args: {
    email: v.string(),
  },
  returns: v.object({
    allowed: v.boolean(),
    retryAt: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase().trim();

    const { ok, retryAt } = await rateLimit(ctx, {
      name: "passwordReset",
      key: normalizedEmail,
    });

    return {
      allowed: ok,
      retryAt: retryAt ?? undefined,
    };
  },
});
