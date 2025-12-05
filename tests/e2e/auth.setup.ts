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
import { test as setup, expect } from '@playwright/test';

const AUTH_FILE = 'tests/.auth/user.json';

// Test credentials - in production, use environment variables
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@opentribe.test',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
};

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Fill login form
  // Note: Update selectors to match your actual login form
  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/password/i).fill(TEST_USER.password);

  // Submit login
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Wait for redirect to dashboard (successful login)
  await expect(page).toHaveURL(/dashboard/);

  // Verify user is logged in
  // Note: Update this assertion to match your app's logged-in state
  await expect(page.getByText(/welcome|dashboard/i)).toBeVisible();

  // Save session state for reuse
  await page.context().storageState({ path: AUTH_FILE });
});
