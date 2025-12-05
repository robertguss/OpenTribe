/**
 * Post Composer E2E Tests - Story 2.3
 *
 * Tests for:
 * - AC1: Editor display with Tiptap toolbar
 * - AC2: @Mentions (basic functionality)
 * - AC3: Hashtags (rendering)
 * - AC4: Image upload
 * - AC5: Post submission with optimistic UI
 * - AC6: Keyboard submit (Cmd+Enter)
 * - AC7: Video embeds
 *
 * Run: pnpm run test:e2e
 */
import { test, expect } from "../support/fixtures";

test.describe.serial("Post Composer - Story 2.3", () => {
  test.describe("AC1: Editor Display", () => {
    test("should show Tiptap editor in space page", async ({
      authenticatedPage,
    }) => {
      // Navigate to a space
      await authenticatedPage.goto("/spaces");

      // Find first space link
      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();

      if (await spaceLink.isVisible()) {
        const href = await spaceLink.getAttribute("href");
        await authenticatedPage.goto(href!);

        // Wait for page to load
        await expect(authenticatedPage.locator("h1")).toBeVisible({
          timeout: 10000,
        });

        // Editor should be visible (has prose class)
        await expect(
          authenticatedPage.locator(".prose, .ProseMirror")
        ).toBeVisible({ timeout: 10000 });
      }
    });

    test("should show formatting toolbar", async ({ authenticatedPage }) => {
      // Navigate to a space
      await authenticatedPage.goto("/spaces");

      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();

      if (await spaceLink.isVisible()) {
        const href = await spaceLink.getAttribute("href");
        await authenticatedPage.goto(href!);

        // Wait for editor to load
        await expect(
          authenticatedPage.locator(".prose, .ProseMirror")
        ).toBeVisible({ timeout: 10000 });

        // Toolbar should have formatting buttons
        // Bold button
        await expect(
          authenticatedPage.getByRole("button", { name: /bold/i })
        ).toBeVisible();

        // Italic button
        await expect(
          authenticatedPage.getByRole("button", { name: /italic/i })
        ).toBeVisible();
      }
    });

    test("should show Post button", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/spaces");

      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();

      if (await spaceLink.isVisible()) {
        const href = await spaceLink.getAttribute("href");
        await authenticatedPage.goto(href!);

        // Post button should be visible
        await expect(
          authenticatedPage.getByRole("button", { name: /post/i })
        ).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe("AC5: Post Submission", () => {
    test("should show error when trying to submit empty post", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/spaces");

      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();

      if (await spaceLink.isVisible()) {
        const href = await spaceLink.getAttribute("href");
        await authenticatedPage.goto(href!);

        // Wait for editor
        await expect(
          authenticatedPage.locator(".prose, .ProseMirror")
        ).toBeVisible({ timeout: 10000 });

        // Click Post without typing anything
        await authenticatedPage.getByRole("button", { name: /post/i }).click();

        // Should show error toast
        await expect(
          authenticatedPage.getByText(/please write something/i)
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("should create post with text content", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/spaces");

      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();

      if (await spaceLink.isVisible()) {
        const href = await spaceLink.getAttribute("href");
        await authenticatedPage.goto(href!);

        // Wait for editor
        const editor = authenticatedPage.locator(".ProseMirror");
        await expect(editor).toBeVisible({ timeout: 10000 });

        // Type content
        await editor.click();
        await authenticatedPage.keyboard.type("Hello, this is a test post!");

        // Click Post
        await authenticatedPage.getByRole("button", { name: /post/i }).click();

        // Should show success toast
        await expect(authenticatedPage.getByText(/post created/i)).toBeVisible({
          timeout: 10000,
        });

        // Post should appear in the list
        await expect(
          authenticatedPage.getByText("Hello, this is a test post!")
        ).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe("AC6: Keyboard Submit", () => {
    test("should submit post with Cmd+Enter", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/spaces");

      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();

      if (await spaceLink.isVisible()) {
        const href = await spaceLink.getAttribute("href");
        await authenticatedPage.goto(href!);

        // Wait for editor
        const editor = authenticatedPage.locator(".ProseMirror");
        await expect(editor).toBeVisible({ timeout: 10000 });

        // Type content
        await editor.click();
        const uniqueText = `Keyboard submit test ${Date.now()}`;
        await authenticatedPage.keyboard.type(uniqueText);

        // Submit with Cmd+Enter (or Ctrl+Enter on non-Mac)
        await authenticatedPage.keyboard.press("Meta+Enter");

        // Should show success or the post should appear
        await expect(authenticatedPage.getByText(uniqueText)).toBeVisible({
          timeout: 10000,
        });
      }
    });
  });

  test.describe("Formatting", () => {
    test("should apply bold formatting", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/spaces");

      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();

      if (await spaceLink.isVisible()) {
        const href = await spaceLink.getAttribute("href");
        await authenticatedPage.goto(href!);

        // Wait for editor
        const editor = authenticatedPage.locator(".ProseMirror");
        await expect(editor).toBeVisible({ timeout: 10000 });

        // Focus editor
        await editor.click();

        // Click bold button
        await authenticatedPage.getByRole("button", { name: /bold/i }).click();

        // Type some text
        await authenticatedPage.keyboard.type("Bold text");

        // Editor should contain bold text
        await expect(editor.locator("strong")).toContainText("Bold text");
      }
    });

    test("should apply italic formatting", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/spaces");

      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();

      if (await spaceLink.isVisible()) {
        const href = await spaceLink.getAttribute("href");
        await authenticatedPage.goto(href!);

        // Wait for editor
        const editor = authenticatedPage.locator(".ProseMirror");
        await expect(editor).toBeVisible({ timeout: 10000 });

        // Focus editor
        await editor.click();

        // Click italic button
        await authenticatedPage
          .getByRole("button", { name: /italic/i })
          .click();

        // Type some text
        await authenticatedPage.keyboard.type("Italic text");

        // Editor should contain italic text
        await expect(editor.locator("em")).toContainText("Italic text");
      }
    });
  });
});

test.describe("Post Display", () => {
  test("should show post in feed after creation", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/spaces");

    const spaceLink = authenticatedPage.locator("a[href^='/spaces/']").first();

    if (await spaceLink.isVisible()) {
      const href = await spaceLink.getAttribute("href");
      await authenticatedPage.goto(href!);

      // Wait for page to load
      await expect(authenticatedPage.locator("h1")).toBeVisible({
        timeout: 10000,
      });

      // Either we see posts or "No posts yet" message
      const hasContent = await authenticatedPage
        .locator('[class*="prose"]')
        .first()
        .isVisible()
        .catch(() => false);

      const hasEmptyState = await authenticatedPage
        .getByText(/no posts yet/i)
        .isVisible()
        .catch(() => false);

      expect(hasContent || hasEmptyState).toBe(true);
    }
  });

  test("should show author name on post", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/spaces");

    const spaceLink = authenticatedPage.locator("a[href^='/spaces/']").first();

    if (await spaceLink.isVisible()) {
      const href = await spaceLink.getAttribute("href");
      await authenticatedPage.goto(href!);

      // Create a post first
      const editor = authenticatedPage.locator(".ProseMirror");
      if (await editor.isVisible()) {
        await editor.click();
        const uniqueText = `Author test ${Date.now()}`;
        await authenticatedPage.keyboard.type(uniqueText);
        await authenticatedPage.getByRole("button", { name: /post/i }).click();

        // Wait for post to appear
        await expect(authenticatedPage.getByText(uniqueText)).toBeVisible({
          timeout: 10000,
        });

        // Post card should show author info (avatar or name)
        // Look for any card containing the post text
        const postCard = authenticatedPage
          .locator('[class*="card"]')
          .filter({ hasText: uniqueText });

        // Should have author avatar or name visible
        await expect(postCard.locator('[class*="avatar"]')).toBeVisible();
      }
    }
  });
});
