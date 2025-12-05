/**
 * Authentication Critical Path Tests
 *
 * These tests validate the most critical auth flows:
 * - User registration
 * - User login
 * - Session persistence
 * - Logout
 *
 * Run: pnpm run test:e2e --project=critical
 */
import { test, expect } from "../support/fixtures";

test.describe("Authentication - Critical Paths", () => {
  test("should redirect unauthenticated users to login", async ({ page }) => {
    // Attempt to access protected route without auth
    await page.goto("/dashboard");

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);

    // Should show login form
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("should allow user to sign up", async ({ page, testUser }) => {
    // Navigate to signup page
    await page.goto("/signup");

    // Fill registration form
    await page.getByLabel(/name/i).fill(testUser.name);
    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/password/i).fill(testUser.password);

    // Network-first: Intercept before action
    const signupResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/auth") && resp.request().method() === "POST"
    );

    // Submit signup
    await page
      .getByRole("button", { name: /sign up|register|create account/i })
      .click();

    // Wait for API response
    const response = await signupResponse;
    expect(response.ok()).toBeTruthy();

    // Should redirect to dashboard or email verification
    await expect(page).toHaveURL(/dashboard|verify/);
  });

  test("should allow user to login with valid credentials", async ({
    page,
  }) => {
    // Navigate to login page
    await page.goto("/login");

    // Fill login form with test credentials
    await page
      .getByLabel(/email/i)
      .fill(process.env.TEST_USER_EMAIL || "test@opentribe.test");
    await page
      .getByLabel(/password/i)
      .fill(process.env.TEST_USER_PASSWORD || "TestPassword123!");

    // Network-first: Intercept before action
    const loginResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/auth") && resp.request().method() === "POST"
    );

    // Submit login
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    // Wait for API response
    const response = await loginResponse;
    expect(response.ok()).toBeTruthy();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
  });

  test("should show error for invalid credentials", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");

    // Fill login form with invalid credentials
    await page.getByLabel(/email/i).fill("invalid@example.com");
    await page.getByLabel(/password/i).fill("WrongPassword123!");

    // Submit login
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    // Should show error message (not crash)
    await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("should allow authenticated user to logout", async ({
    authenticatedPage,
  }) => {
    // Navigate to dashboard (already authenticated via fixture)
    await authenticatedPage.goto("/dashboard");

    // Verify logged in
    await expect(authenticatedPage).toHaveURL(/dashboard/);

    // Find and click logout button
    // Note: Update selector to match your app's logout button location
    await authenticatedPage
      .getByRole("button", { name: /logout|sign out/i })
      .click();

    // Should redirect to login or home
    await expect(authenticatedPage).toHaveURL(/login|\/$/);
  });
});
