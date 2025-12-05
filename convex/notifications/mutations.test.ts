import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.setup";

describe("checkPasswordResetRateLimit", () => {
  it("should allow first password reset request", async () => {
    const t = convexTest(schema, modules);

    const result = await t.mutation(
      internal.notifications.mutations.checkPasswordResetRateLimit,
      { email: "test@example.com" }
    );

    expect(result.allowed).toBe(true);
    expect(result.retryAt).toBeUndefined();
  });

  it("should allow up to 3 requests per hour", async () => {
    const t = convexTest(schema, modules);
    const email = "test@example.com";

    // First three requests should be allowed
    for (let i = 0; i < 3; i++) {
      const result = await t.mutation(
        internal.notifications.mutations.checkPasswordResetRateLimit,
        { email }
      );
      expect(result.allowed).toBe(true);
    }
  });

  it("should block after 3 requests per hour", async () => {
    const t = convexTest(schema, modules);
    const email = "ratelimited@example.com";

    // Use up the rate limit (3 requests)
    for (let i = 0; i < 3; i++) {
      await t.mutation(
        internal.notifications.mutations.checkPasswordResetRateLimit,
        { email }
      );
    }

    // Fourth request should be blocked
    const result = await t.mutation(
      internal.notifications.mutations.checkPasswordResetRateLimit,
      { email }
    );

    expect(result.allowed).toBe(false);
    expect(result.retryAt).toBeDefined();
    expect(typeof result.retryAt).toBe("number");
  });

  it("should normalize email to lowercase", async () => {
    const t = convexTest(schema, modules);

    // Request with uppercase
    await t.mutation(
      internal.notifications.mutations.checkPasswordResetRateLimit,
      { email: "TEST@EXAMPLE.COM" }
    );

    // Request with lowercase should count against same limit
    await t.mutation(
      internal.notifications.mutations.checkPasswordResetRateLimit,
      { email: "test@example.com" }
    );

    // Third request (still allowed)
    await t.mutation(
      internal.notifications.mutations.checkPasswordResetRateLimit,
      { email: "Test@Example.Com" }
    );

    // Fourth request should be blocked (all emails normalized to same key)
    const result = await t.mutation(
      internal.notifications.mutations.checkPasswordResetRateLimit,
      { email: "TEST@example.COM" }
    );

    expect(result.allowed).toBe(false);
  });

  it("should track rate limits independently per email", async () => {
    const t = convexTest(schema, modules);

    // Use up limit for user1
    for (let i = 0; i < 3; i++) {
      await t.mutation(
        internal.notifications.mutations.checkPasswordResetRateLimit,
        { email: "user1@example.com" }
      );
    }

    // user1 should be blocked
    const user1Result = await t.mutation(
      internal.notifications.mutations.checkPasswordResetRateLimit,
      { email: "user1@example.com" }
    );
    expect(user1Result.allowed).toBe(false);

    // user2 should still be allowed
    const user2Result = await t.mutation(
      internal.notifications.mutations.checkPasswordResetRateLimit,
      { email: "user2@example.com" }
    );
    expect(user2Result.allowed).toBe(true);
  });

  it("should trim whitespace from email", async () => {
    const t = convexTest(schema, modules);

    // Request with whitespace
    await t.mutation(
      internal.notifications.mutations.checkPasswordResetRateLimit,
      { email: "  test@example.com  " }
    );

    // Request without whitespace should count against same limit
    await t.mutation(
      internal.notifications.mutations.checkPasswordResetRateLimit,
      { email: "test@example.com" }
    );

    await t.mutation(
      internal.notifications.mutations.checkPasswordResetRateLimit,
      { email: "test@example.com" }
    );

    // Fourth request should be blocked
    const result = await t.mutation(
      internal.notifications.mutations.checkPasswordResetRateLimit,
      { email: "test@example.com" }
    );

    expect(result.allowed).toBe(false);
  });
});
