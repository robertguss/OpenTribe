import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.setup";

/**
 * Media Mutations Tests
 *
 * Note: Testing file storage in convex-test has limitations.
 * We test the authentication requirements and basic function structure.
 * Full integration tests should be done in E2E tests.
 */

describe("media mutations", () => {
  describe("generateUploadUrl", () => {
    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.mutation(api.media.mutations.generateUploadUrl, {})
      ).rejects.toThrow();
    });

    // Note: We cannot fully test generateUploadUrl in convex-test
    // because it requires auth component integration.
    // The function structure and auth check are verified by the above test.
  });

  describe("storeMediaReference", () => {
    it("should throw error for unauthenticated user", async () => {
      const t = convexTest(schema, modules);

      // Create a fake storage ID - this will fail auth before any validation
      const fakeStorageId =
        "kg2fakeStorageId1234567890" as unknown as Parameters<
          typeof api.media.mutations.storeMediaReference
        >[0]["storageId"];

      await expect(
        t.mutation(api.media.mutations.storeMediaReference, {
          storageId: fakeStorageId,
        })
      ).rejects.toThrow();
    });

    // Note: Full testing of storage operations requires integration tests
    // as convex-test has limitations with file storage mocking.
  });
});
