/**
 * Rate Limiting Configuration
 *
 * Centralized rate limit definitions for the OpenTribe platform.
 * Uses convex-helpers rate limiting with token bucket and fixed window strategies.
 *
 * Architecture requirement: 5 attempts per hour per IP for signup
 * See: docs/ARCHITECTURE.md, docs/epics.md
 */

import { defineRateLimits } from "convex-helpers/server/rateLimit";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

export const { checkRateLimit, rateLimit, resetRateLimit } = defineRateLimits({
  // Signup rate limit: 5 attempts per hour per email
  // Uses fixed window to match Architecture spec
  signup: {
    kind: "fixed window",
    rate: 5,
    period: HOUR,
  },

  // Profile creation: more lenient since it's after auth succeeds
  // 10 per minute to handle retries after failures
  createProfile: {
    kind: "token bucket",
    rate: 10,
    period: MINUTE,
    capacity: 3,
  },

  // Welcome email: prevent spam, 3 per hour per email
  sendWelcomeEmail: {
    kind: "fixed window",
    rate: 3,
    period: HOUR,
  },
});
