/**
 * OpenTribe E2E Test Fixtures
 *
 * Extends Playwright's base test with fixtures tailored for:
 * - Better Auth authentication
 * - Convex real-time backend
 *
 * Usage:
 *   import { test, expect } from '../support/fixtures';
 *
 * Fixtures available:
 *   - authenticatedPage: Pre-authenticated page (requires auth.setup.ts)
 *   - testUser: Factory for creating test users
 */

// Playwright's `use` function in fixtures is not a React hook - disable the false positive
/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect, Page } from "@playwright/test";

// Test user data type
export type TestUser = {
  email: string;
  password: string;
  name: string;
};

// Fixture types
type TestFixtures = {
  // Pre-authenticated page using stored session
  authenticatedPage: Page;

  // Factory for creating unique test users
  testUser: TestUser;

  // API request helper with base URL
  apiRequest: {
    get: (path: string) => Promise<Response>;
    post: (path: string, data: unknown) => Promise<Response>;
    delete: (path: string) => Promise<Response>;
  };
};

/**
 * Extended test with OpenTribe-specific fixtures
 */
export const test = base.extend<TestFixtures>({
  // Pre-authenticated page fixture
  // Uses stored session from auth.setup.ts
  authenticatedPage: async ({ browser }, use) => {
    // Create context with stored auth state
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Test user factory fixture
  // Generates unique user data for each test
  testUser: async ({}, use) => {
    const timestamp = Date.now();
    const user: TestUser = {
      email: `test-${timestamp}@opentribe.test`,
      password: `TestPass123!${timestamp}`,
      name: `Test User ${timestamp}`,
    };
    await use(user);
    // Cleanup: In production, delete user via API
    // For now, test users persist (clean manually or via DB reset)
  },

  // API request helper
  apiRequest: async ({ baseURL }, use) => {
    const makeRequest = async (
      method: string,
      path: string,
      data?: unknown
    ) => {
      const url = `${baseURL}${path}`;
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };
      if (data) {
        options.body = JSON.stringify(data);
      }
      return fetch(url, options);
    };

    await use({
      get: (path: string) => makeRequest("GET", path),
      post: (path: string, data: unknown) => makeRequest("POST", path, data),
      delete: (path: string) => makeRequest("DELETE", path),
    });
  },
});

// Re-export expect for convenience
export { expect };

// Re-export Page type for type hints
export type { Page };
