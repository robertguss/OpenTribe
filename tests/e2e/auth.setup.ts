/**
 * Authentication Setup
 *
 * This setup runs once before all tests to create an authenticated session.
 * The session is stored in tests/.auth/user.json and reused by tests.
 *
 * This pattern avoids redundant login flows in every test.
 *
 * Run setup: pnpm run test:e2e --project=setup
 */
import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = "tests/.auth/user.json";

// Test credentials - in production, use environment variables
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || "test@opentribe.test",
  password: process.env.TEST_USER_PASSWORD || "TestPassword123!",
  name: "Test User",
};

setup("authenticate", async ({ page }) => {
  // First, try to create the test user via signup
  // This will fail gracefully if the user already exists
  await page.goto("/signup");

  // Fill signup form
  await page.getByLabel(/full name/i).fill(TEST_USER.name);
  await page.getByLabel(/^email$/i).fill(TEST_USER.email);
  await page.getByLabel(/^password$/i).fill(TEST_USER.password);
  await page.getByLabel(/confirm password/i).fill(TEST_USER.password);

  // Submit signup
  await page.getByRole("button", { name: /create account/i }).click();

  // Wait for either:
  // 1. Redirect to dashboard (new user created successfully)
  // 2. Error message about user already existing (existing user)
  const dashboardOrError = await Promise.race([
    page.waitForURL(/dashboard/, { timeout: 15000 }).then(() => "dashboard"),
    page
      .getByText(/already exists/i)
      .waitFor({ timeout: 15000 })
      .then(() => "exists"),
  ]).catch(() => "timeout");

  if (dashboardOrError === "dashboard") {
    // New user was created and we're logged in - save session
    await page.context().storageState({ path: AUTH_FILE });
    return;
  }

  // User already exists or signup failed - try logging in
  await page.goto("/login");

  // Fill login form
  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/password/i).fill(TEST_USER.password);

  // Submit login
  await page.getByRole("button", { name: /^login$/i }).click();

  // Wait for redirect to dashboard (successful login)
  await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });

  // Save session state for reuse
  await page.context().storageState({ path: AUTH_FILE });
});
