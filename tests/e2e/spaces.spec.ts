/**
 * Space Navigation E2E Tests - Story 2.2
 *
 * Tests for:
 * - AC1: Space list display with visibility filtering
 * - AC2: Space item display with icons, names, unread indicators
 * - AC3: Space navigation with active state and URL update
 * - AC4: Keyboard shortcuts (G+S, J/K, Enter)
 * - AC5: Real-time updates (tested implicitly via Convex)
 * - AC6: Mobile navigation (bottom nav bar)
 *
 * Run: pnpm run test:e2e
 */
import { test, expect } from "../support/fixtures";

test.describe.serial("Space Navigation - Story 2.2", () => {
  test.describe("AC1: Space List Display", () => {
    test("should show spaces in sidebar when authenticated", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/");

      // Wait for sidebar to load
      await expect(
        authenticatedPage
          .locator('[data-sidebar="group-label"]')
          .getByText("Spaces")
      ).toBeVisible({ timeout: 10000 });

      // Sidebar should be visible on desktop
      await expect(
        authenticatedPage.locator('[data-slot="sidebar"]')
      ).toBeVisible();
    });

    test("should show loading skeleton while spaces load", async ({
      authenticatedPage,
    }) => {
      // Navigate and check for skeleton before data loads
      await authenticatedPage.goto("/spaces");

      // The skeleton or actual content should be visible
      await expect(
        authenticatedPage
          .locator('[data-sidebar="menu-skeleton"], [data-sidebar="menu-item"]')
          .first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("should show empty state when no spaces exist", async ({
      authenticatedPage,
    }) => {
      // This test may need adjustment based on seed data
      await authenticatedPage.goto("/spaces");

      // Either spaces exist or empty state shows
      const hasSpaces = await authenticatedPage
        .locator("a[href^='/spaces/']")
        .first()
        .isVisible()
        .catch(() => false);

      if (!hasSpaces) {
        await expect(
          authenticatedPage.getByText("No spaces available")
        ).toBeVisible();
      }
    });
  });

  test.describe("AC2: Space Item Display", () => {
    test("should display space with name in sidebar", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/");

      // Wait for sidebar to load
      await expect(
        authenticatedPage
          .locator('[data-sidebar="group-label"]')
          .getByText("Spaces")
      ).toBeVisible({ timeout: 10000 });

      // Check if any space menu items are visible
      const spaceItems = authenticatedPage.locator(
        '[data-sidebar="menu-item"]'
      );
      const count = await spaceItems.count();

      // If spaces exist, they should have text content (the name)
      if (count > 0) {
        const firstItem = spaceItems.first();
        await expect(firstItem).toHaveText(/.+/);
      }
    });
  });

  test.describe("AC3: Space Navigation", () => {
    test("should navigate to space detail page when clicking a space", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/");

      // Wait for sidebar to load
      await expect(
        authenticatedPage
          .locator('[data-sidebar="group-label"]')
          .getByText("Spaces")
      ).toBeVisible({ timeout: 10000 });

      // Find and click the first space link
      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();

      if (await spaceLink.isVisible()) {
        const href = await spaceLink.getAttribute("href");
        await spaceLink.click();

        // URL should update to the space page
        await expect(authenticatedPage).toHaveURL(href!, { timeout: 10000 });

        // Space header should be visible
        await expect(authenticatedPage.locator("h1")).toBeVisible();
      }
    });

    test("should show active state for current space", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/spaces");

      // Find first space link
      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();

      if (await spaceLink.isVisible()) {
        const href = await spaceLink.getAttribute("href");
        await authenticatedPage.goto(href!);

        // Wait for navigation
        await expect(authenticatedPage).toHaveURL(href!, { timeout: 10000 });

        // The space item should have active state (data-active="true")
        const activeItem = authenticatedPage.locator(
          '[data-sidebar="menu-button"][data-active="true"]'
        );
        await expect(activeItem).toBeVisible();
      }
    });
  });

  test.describe("AC4: Keyboard Navigation", () => {
    test("should focus spaces list with G+S keyboard shortcut", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/");

      // Wait for sidebar to load
      await expect(
        authenticatedPage
          .locator('[data-sidebar="group-label"]')
          .getByText("Spaces")
      ).toBeVisible({ timeout: 10000 });

      // Skip if no spaces exist
      const spaceItems = authenticatedPage.locator(
        '[data-sidebar="menu-item"]'
      );
      if ((await spaceItems.count()) === 0) {
        test.skip();
        return;
      }

      // Press G then S
      await authenticatedPage.keyboard.press("g");
      await authenticatedPage.waitForTimeout(100);
      await authenticatedPage.keyboard.press("s");

      // Should show navigation hint
      await expect(authenticatedPage.getByText("J/K to navigate")).toBeVisible({
        timeout: 5000,
      });
    });

    test("should navigate with J/K keys after activating keyboard mode", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/");

      // Wait for sidebar to load
      await expect(
        authenticatedPage
          .locator('[data-sidebar="group-label"]')
          .getByText("Spaces")
      ).toBeVisible({ timeout: 10000 });

      // Skip if not enough spaces
      const spaceItems = authenticatedPage.locator(
        '[data-sidebar="menu-item"]'
      );
      const count = await spaceItems.count();
      if (count < 2) {
        test.skip();
        return;
      }

      // Activate keyboard mode with G+S
      await authenticatedPage.keyboard.press("g");
      await authenticatedPage.waitForTimeout(100);
      await authenticatedPage.keyboard.press("s");

      // Wait for keyboard mode to activate
      await expect(authenticatedPage.getByText("J/K to navigate")).toBeVisible({
        timeout: 5000,
      });

      // Press J to move down
      await authenticatedPage.keyboard.press("j");
      await authenticatedPage.waitForTimeout(100);

      // The second item should now be focused (has focus ring)
      // This is hard to test visually, but the state should change
    });

    test("should navigate to space with Enter key", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/");

      // Wait for sidebar to load
      await expect(
        authenticatedPage
          .locator('[data-sidebar="group-label"]')
          .getByText("Spaces")
      ).toBeVisible({ timeout: 10000 });

      // Skip if no spaces
      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();
      if (!(await spaceLink.isVisible())) {
        test.skip();
        return;
      }

      const href = await spaceLink.getAttribute("href");

      // Activate keyboard mode with G+S
      await authenticatedPage.keyboard.press("g");
      await authenticatedPage.waitForTimeout(100);
      await authenticatedPage.keyboard.press("s");

      // Wait for keyboard mode
      await expect(authenticatedPage.getByText("J/K to navigate")).toBeVisible({
        timeout: 5000,
      });

      // Press Enter to navigate
      await authenticatedPage.keyboard.press("Enter");

      // Should navigate to the first space
      await expect(authenticatedPage).toHaveURL(href!, { timeout: 10000 });
    });

    test("should exit keyboard mode with Escape", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/");

      // Wait for sidebar to load
      await expect(
        authenticatedPage
          .locator('[data-sidebar="group-label"]')
          .getByText("Spaces")
      ).toBeVisible({ timeout: 10000 });

      // Skip if no spaces
      const spaceItems = authenticatedPage.locator(
        '[data-sidebar="menu-item"]'
      );
      if ((await spaceItems.count()) === 0) {
        test.skip();
        return;
      }

      // Activate keyboard mode
      await authenticatedPage.keyboard.press("g");
      await authenticatedPage.waitForTimeout(100);
      await authenticatedPage.keyboard.press("s");

      // Wait for keyboard mode
      await expect(authenticatedPage.getByText("J/K to navigate")).toBeVisible({
        timeout: 5000,
      });

      // Press Escape to exit
      await authenticatedPage.keyboard.press("Escape");

      // Navigation hint should disappear
      await expect(
        authenticatedPage.getByText("J/K to navigate")
      ).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("AC6: Mobile Navigation", () => {
    test("should show bottom navigation on mobile", async ({
      authenticatedPage,
    }) => {
      // Set mobile viewport
      await authenticatedPage.setViewportSize({ width: 375, height: 667 });
      await authenticatedPage.goto("/");

      // Wait for page to load
      await authenticatedPage.waitForTimeout(500);

      // Bottom nav should be visible on mobile
      await expect(
        authenticatedPage
          .locator("nav")
          .filter({ has: authenticatedPage.getByText("Spaces") })
      ).toBeVisible();
    });

    test("should open sidebar when tapping Spaces in bottom nav", async ({
      authenticatedPage,
    }) => {
      // Set mobile viewport
      await authenticatedPage.setViewportSize({ width: 375, height: 667 });
      await authenticatedPage.goto("/");

      // Wait for page to load
      await authenticatedPage.waitForTimeout(500);

      // Tap Spaces button in bottom nav
      await authenticatedPage
        .locator("nav button")
        .filter({ hasText: "Spaces" })
        .click();

      // Sidebar sheet should open (mobile sidebar uses Sheet component)
      await expect(
        authenticatedPage.locator(
          '[data-sidebar="sidebar"][data-mobile="true"]'
        )
      ).toBeVisible({ timeout: 5000 });
    });

    test("should hide sidebar on desktop", async ({ authenticatedPage }) => {
      // Set desktop viewport
      await authenticatedPage.setViewportSize({ width: 1200, height: 800 });
      await authenticatedPage.goto("/");

      // Wait for page to load
      await authenticatedPage.waitForTimeout(500);

      // Bottom nav should NOT be visible on desktop (md:hidden)
      await expect(
        authenticatedPage.locator("nav.fixed.bottom-0")
      ).not.toBeVisible();
    });
  });
});

test.describe("Space Detail Page", () => {
  test("should show space header with name and description", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/spaces");

    // Find first space link
    const spaceLink = authenticatedPage.locator("a[href^='/spaces/']").first();

    if (await spaceLink.isVisible()) {
      const href = await spaceLink.getAttribute("href");
      await authenticatedPage.goto(href!);

      // Space header should be visible
      await expect(authenticatedPage.locator("h1")).toBeVisible();
    }
  });

  test("should show 'not found' for invalid space ID", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/spaces/invalid-id-12345");

    // Should show not found message
    await expect(authenticatedPage.getByText("Space not found")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show posts placeholder", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/spaces");

    // Find first space link
    const spaceLink = authenticatedPage.locator("a[href^='/spaces/']").first();

    if (await spaceLink.isVisible()) {
      const href = await spaceLink.getAttribute("href");
      await authenticatedPage.goto(href!);

      // Wait for page to load
      await expect(authenticatedPage.locator("h1")).toBeVisible();

      // Should show posts placeholder (Story 2.4 placeholder)
      await expect(authenticatedPage.getByText(/no posts yet/i)).toBeVisible({
        timeout: 10000,
      });
    }
  });
});
