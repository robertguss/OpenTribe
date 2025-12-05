/**
 * Example E2E Test Suite
 *
 * Demonstrates Playwright patterns for OpenTribe:
 * - Network-first interception
 * - Real-time Convex updates
 * - Fixture usage
 * - Deterministic waits (no hard waits)
 *
 * Run: pnpm run test:e2e
 */
import { test, expect } from '../support/fixtures';

test.describe('Homepage', () => {
  test('should load homepage', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Verify page loads (update title to match your app)
    await expect(page).toHaveTitle(/OpenTribe|Home/i);

    // Verify key elements are visible
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should navigate to login from homepage', async ({ page }) => {
    await page.goto('/');

    // Click login link
    await page.getByRole('link', { name: /login|sign in/i }).click();

    // Should navigate to login page
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Dashboard - Authenticated', () => {
  test('should display user dashboard', async ({ authenticatedPage }) => {
    // Navigate to dashboard (pre-authenticated via fixture)
    await authenticatedPage.goto('/dashboard');

    // Verify dashboard loaded
    await expect(authenticatedPage).toHaveURL(/dashboard/);

    // Verify dashboard elements
    // Note: Update these assertions to match your actual dashboard
    await expect(authenticatedPage.getByText(/dashboard|welcome/i)).toBeVisible();
  });

  test('should handle real-time updates', async ({ authenticatedPage }) => {
    // Navigate to a page with real-time data
    await authenticatedPage.goto('/dashboard');

    // Intercept Convex WebSocket or API calls if needed
    // Note: Convex uses WebSocket for real-time - this is a placeholder pattern

    // Verify initial state
    await expect(authenticatedPage.getByText(/dashboard/i)).toBeVisible();

    // Trigger an action that updates data
    // The real-time nature of Convex means the UI should update automatically

    // Verify updated state (without hard waits)
    // Playwright's auto-waiting handles real-time updates
  });
});

test.describe('API Error Handling', () => {
  test('should handle API errors gracefully', async ({ page, context }) => {
    // Mock API failure
    await context.route('**/api/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    // Navigate to page that requires API
    await page.goto('/dashboard');

    // Should show error message (graceful degradation)
    // Note: Update this to match your error handling UI
    await expect(page.getByText(/error|unable to load|try again/i)).toBeVisible();

    // App should still be functional (not crash)
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should handle network offline gracefully', async ({ page, context }) => {
    // First load the page while online
    await page.goto('/');
    await expect(page).toHaveTitle(/OpenTribe|Home/i);

    // Go offline
    await context.setOffline(true);

    // Try to navigate
    await page.goto('/dashboard').catch(() => {
      // Expected to fail when offline
    });

    // Go back online
    await context.setOffline(false);

    // Should be able to navigate again
    await page.goto('/');
    await expect(page).toHaveTitle(/OpenTribe|Home/i);
  });
});

test.describe('Network-First Pattern Examples', () => {
  test('demonstrates network interception before action', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // CRITICAL: Set up response interception BEFORE the action
    const loginPromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/auth') && resp.request().method() === 'POST'
    );

    // Fill form
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');

    // Trigger the action
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for the response (deterministic, no hard wait)
    const response = await loginPromise;

    // Assert on response
    expect(response.status()).toBeLessThan(500); // Not a server error
  });
});
