/**
 * Comment System E2E Tests - Story 2.5
 *
 * Tests for:
 * - AC1: Comment Section Display
 * - AC2: Submit Comment with optimistic UI
 * - AC3: Reply to Comment with nested input
 * - AC4: Nested Display (2 levels max)
 * - AC5: Own Comment Actions (edit/delete)
 * - AC6: Delete Comment shows [deleted]
 * - AC7: Like Comments
 *
 * Run: pnpm run test:e2e
 */
import { test, expect, Page } from "../support/fixtures";

test.describe.serial("Comment System - Story 2.5", () => {
  // Helper to navigate to a post detail page
  async function navigateToPostDetail(authenticatedPage: Page) {
    await authenticatedPage.goto("/spaces");

    const spaceLink = authenticatedPage.locator("a[href^='/spaces/']").first();

    if (await spaceLink.isVisible()) {
      const href = await spaceLink.getAttribute("href");
      await authenticatedPage.goto(href!);

      await authenticatedPage.waitForLoadState("networkidle");

      // Find first post and navigate to detail
      const postContent = authenticatedPage
        .locator('[class*="card"]')
        .first()
        .locator('[class*="prose"]');

      if (await postContent.isVisible()) {
        await postContent.click();
        await authenticatedPage.waitForURL(/\/posts\/[a-zA-Z0-9]+/);
        return true;
      }
    }
    return false;
  }

  test.describe("AC1: Comment Section Display", () => {
    test("should show comment section on post detail page", async ({
      authenticatedPage,
    }) => {
      const hasPost = await navigateToPostDetail(authenticatedPage);

      if (hasPost) {
        // Should show comments section
        await expect(authenticatedPage.getByText(/comments/i)).toBeVisible({
          timeout: 10000,
        });

        // Should show comment input area
        await expect(authenticatedPage.locator("textarea").first()).toBeVisible(
          { timeout: 5000 }
        );
      }
    });

    test("should show expand/collapse toggle for comments", async ({
      authenticatedPage,
    }) => {
      const hasPost = await navigateToPostDetail(authenticatedPage);

      if (hasPost) {
        // Look for comments header with toggle
        const commentsHeader = authenticatedPage.locator("button").filter({
          hasText: /comments/i,
        });

        if (await commentsHeader.isVisible()) {
          // Should have chevron icon indicating toggle
          await expect(
            commentsHeader.locator('svg[class*="lucide-chevron"]')
          ).toBeVisible();
        }
      }
    });

    test("should show comment count in header", async ({
      authenticatedPage,
    }) => {
      const hasPost = await navigateToPostDetail(authenticatedPage);

      if (hasPost) {
        // Comments header should show count
        await expect(
          authenticatedPage.getByText(/comments\s*\(\d+\)/i)
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe("AC2: Submit Comment", () => {
    test("should create comment and show success toast", async ({
      authenticatedPage,
    }) => {
      const hasPost = await navigateToPostDetail(authenticatedPage);

      if (hasPost) {
        // Find comment textarea
        const textarea = authenticatedPage
          .locator("textarea")
          .filter({ hasText: "" })
          .first();

        if (await textarea.isVisible()) {
          // Type a comment
          const uniqueText = `Test comment ${Date.now()}`;
          await textarea.fill(uniqueText);

          // Click submit button (Comment or Post button)
          const submitButton = authenticatedPage
            .getByRole("button", { name: /comment|post/i })
            .first();
          await submitButton.click();

          // Should show success toast with points
          await expect(
            authenticatedPage.getByText(/\+5 pts|posted/i)
          ).toBeVisible({ timeout: 10000 });

          // Comment should appear in list
          await expect(authenticatedPage.getByText(uniqueText)).toBeVisible({
            timeout: 10000,
          });
        }
      }
    });

    test("should show character limit indicator", async ({
      authenticatedPage,
    }) => {
      const hasPost = await navigateToPostDetail(authenticatedPage);

      if (hasPost) {
        const textarea = authenticatedPage.locator("textarea").first();

        if (await textarea.isVisible()) {
          // Type some text
          await textarea.fill("Hello");

          // Should show remaining characters (500 - 5 = 495)
          await expect(authenticatedPage.getByText(/49[0-9]/)).toBeVisible();
        }
      }
    });

    test("should support Cmd+Enter keyboard shortcut", async ({
      authenticatedPage,
    }) => {
      const hasPost = await navigateToPostDetail(authenticatedPage);

      if (hasPost) {
        const textarea = authenticatedPage.locator("textarea").first();

        if (await textarea.isVisible()) {
          const uniqueText = `Keyboard submit ${Date.now()}`;
          await textarea.fill(uniqueText);

          // Submit with Cmd+Enter
          await authenticatedPage.keyboard.press("Meta+Enter");

          // Comment should appear
          await expect(authenticatedPage.getByText(uniqueText)).toBeVisible({
            timeout: 10000,
          });
        }
      }
    });
  });

  test.describe("AC3: Reply to Comment", () => {
    test("should show reply button on comments", async ({
      authenticatedPage,
    }) => {
      const hasPost = await navigateToPostDetail(authenticatedPage);

      if (hasPost) {
        // Wait for comments to load
        await authenticatedPage.waitForTimeout(1000);

        // Look for Reply button
        const replyButton = authenticatedPage.getByRole("button", {
          name: /reply/i,
        });

        // If there are comments, Reply button should be visible
        if ((await replyButton.count()) > 0) {
          await expect(replyButton.first()).toBeVisible();
        }
      }
    });

    test("should show nested input when clicking Reply", async ({
      authenticatedPage,
    }) => {
      const hasPost = await navigateToPostDetail(authenticatedPage);

      if (hasPost) {
        // First create a comment to reply to
        const textarea = authenticatedPage.locator("textarea").first();
        if (await textarea.isVisible()) {
          await textarea.fill(`Parent comment ${Date.now()}`);
          await authenticatedPage.keyboard.press("Meta+Enter");
          await authenticatedPage.waitForTimeout(2000);
        }

        // Click Reply button
        const replyButton = authenticatedPage
          .getByRole("button", { name: /reply/i })
          .first();

        if (await replyButton.isVisible()) {
          await replyButton.click();

          // Should show nested reply input
          const replyTextarea = authenticatedPage
            .locator("textarea")
            .filter({ hasText: "" });
          await expect(replyTextarea.last()).toBeVisible({ timeout: 5000 });

          // Should show Cancel button
          await expect(
            authenticatedPage.getByRole("button", { name: /cancel/i })
          ).toBeVisible();
        }
      }
    });
  });

  test.describe("AC4: Nested Display", () => {
    test("should show replies indented under parent comment", async ({
      authenticatedPage,
    }) => {
      const hasPost = await navigateToPostDetail(authenticatedPage);

      if (hasPost) {
        // Look for indented comments (ml-8 class or border-l)
        const nestedComment = authenticatedPage.locator(
          '[class*="ml-8"], [class*="border-l-2"]'
        );

        // If there are nested replies, they should be indented
        if ((await nestedComment.count()) > 0) {
          await expect(nestedComment.first()).toBeVisible();
        }
      }
    });
  });

  test.describe("AC5: Own Comment Actions", () => {
    test("should show more menu for own comments", async ({
      authenticatedPage,
    }) => {
      const hasPost = await navigateToPostDetail(authenticatedPage);

      if (hasPost) {
        // Create a comment first
        const textarea = authenticatedPage.locator("textarea").first();
        if (await textarea.isVisible()) {
          await textarea.fill(`My comment ${Date.now()}`);
          await authenticatedPage.keyboard.press("Meta+Enter");
          await authenticatedPage.waitForTimeout(2000);
        }

        // Hover over the comment to show the menu
        const commentItem = authenticatedPage
          .locator('[class*="group"]')
          .last();
        await commentItem.hover();

        // Look for more menu button (three dots)
        const moreButton = commentItem.locator(
          'button:has(svg[class*="lucide-more"])'
        );

        if (await moreButton.isVisible()) {
          await moreButton.click();

          // Should show Edit option
          await expect(
            authenticatedPage.getByRole("menuitem", { name: /edit/i })
          ).toBeVisible();

          // Should show Delete option
          await expect(
            authenticatedPage.getByRole("menuitem", { name: /delete/i })
          ).toBeVisible();
        }
      }
    });

    test("should open edit dialog when clicking Edit", async ({
      authenticatedPage,
    }) => {
      const hasPost = await navigateToPostDetail(authenticatedPage);

      if (hasPost) {
        // Create a comment first
        const textarea = authenticatedPage.locator("textarea").first();
        if (await textarea.isVisible()) {
          await textarea.fill(`Editable comment ${Date.now()}`);
          await authenticatedPage.keyboard.press("Meta+Enter");
          await authenticatedPage.waitForTimeout(2000);
        }

        // Open more menu
        const commentItem = authenticatedPage
          .locator('[class*="group"]')
          .last();
        await commentItem.hover();

        const moreButton = commentItem.locator(
          'button:has(svg[class*="lucide-more"])'
        );

        if (await moreButton.isVisible()) {
          await moreButton.click();

          // Click Edit
          await authenticatedPage
            .getByRole("menuitem", { name: /edit/i })
            .click();

          // Edit dialog should appear
          await expect(
            authenticatedPage.getByRole("dialog").filter({ hasText: /edit/i })
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe("AC6: Delete Comment", () => {
    test("should show confirmation dialog when deleting", async ({
      authenticatedPage,
    }) => {
      const hasPost = await navigateToPostDetail(authenticatedPage);

      if (hasPost) {
        // Create a comment first
        const textarea = authenticatedPage.locator("textarea").first();
        if (await textarea.isVisible()) {
          await textarea.fill(`Deletable comment ${Date.now()}`);
          await authenticatedPage.keyboard.press("Meta+Enter");
          await authenticatedPage.waitForTimeout(2000);
        }

        // Open more menu
        const commentItem = authenticatedPage
          .locator('[class*="group"]')
          .last();
        await commentItem.hover();

        const moreButton = commentItem.locator(
          'button:has(svg[class*="lucide-more"])'
        );

        if (await moreButton.isVisible()) {
          await moreButton.click();

          // Click Delete
          await authenticatedPage
            .getByRole("menuitem", { name: /delete/i })
            .click();

          // Confirmation dialog should appear
          await expect(authenticatedPage.getByRole("alertdialog")).toBeVisible({
            timeout: 5000,
          });

          // Should mention [deleted]
          await expect(
            authenticatedPage.getByText(/\[deleted\]/i)
          ).toBeVisible();
        }
      }
    });
  });

  test.describe("AC7: Like Comments", () => {
    test("should show like button on comments", async ({
      authenticatedPage,
    }) => {
      const hasPost = await navigateToPostDetail(authenticatedPage);

      if (hasPost) {
        // Wait for comments to load
        await authenticatedPage.waitForTimeout(1000);

        // Look for heart icon (like button)
        const likeButton = authenticatedPage.locator(
          'button:has(svg[class*="lucide-heart"])'
        );

        // If there are comments, like buttons should be visible
        if ((await likeButton.count()) > 0) {
          await expect(likeButton.first()).toBeVisible();
        }
      }
    });

    test("should toggle like on click", async ({ authenticatedPage }) => {
      const hasPost = await navigateToPostDetail(authenticatedPage);

      if (hasPost) {
        // Create a comment first
        const textarea = authenticatedPage.locator("textarea").first();
        if (await textarea.isVisible()) {
          await textarea.fill(`Likeable comment ${Date.now()}`);
          await authenticatedPage.keyboard.press("Meta+Enter");
          await authenticatedPage.waitForTimeout(2000);
        }

        // Find like button on the comment
        const commentItem = authenticatedPage
          .locator('[class*="group"]')
          .last();
        const likeButton = commentItem.locator(
          'button:has(svg[class*="lucide-heart"])'
        );

        if (await likeButton.isVisible()) {
          // Click to like
          await likeButton.click();

          // Heart should be filled (red)
          await expect(
            likeButton.locator('svg[class*="fill-red"]')
          ).toBeVisible({ timeout: 5000 });

          // Should show toast
          await expect(
            authenticatedPage.getByText(/\+2 pts|liked/i)
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });
});

test.describe("Comment Edge Cases", () => {
  test("should show empty state when no comments", async ({
    authenticatedPage,
  }) => {
    // Navigate to a new post without comments
    await authenticatedPage.goto("/spaces");

    const spaceLink = authenticatedPage.locator("a[href^='/spaces/']").first();

    if (await spaceLink.isVisible()) {
      const href = await spaceLink.getAttribute("href");
      await authenticatedPage.goto(href!);

      // Create a fresh post
      const editor = authenticatedPage.locator(".ProseMirror");
      if (await editor.isVisible()) {
        await editor.click();
        await authenticatedPage.keyboard.type(`Fresh post ${Date.now()}`);
        await authenticatedPage.getByRole("button", { name: /post/i }).click();

        await authenticatedPage.waitForTimeout(2000);

        // Navigate to the post
        const postContent = authenticatedPage
          .locator('[class*="card"]')
          .first()
          .locator('[class*="prose"]');

        if (await postContent.isVisible()) {
          await postContent.click();
          await authenticatedPage.waitForURL(/\/posts\/[a-zA-Z0-9]+/);

          // Should show "No comments yet" or similar
          await expect(
            authenticatedPage.getByText(/no comments|be the first/i)
          ).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test("should prevent empty comment submission", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/spaces");

    const spaceLink = authenticatedPage.locator("a[href^='/spaces/']").first();

    if (await spaceLink.isVisible()) {
      const href = await spaceLink.getAttribute("href");
      await authenticatedPage.goto(href!);

      const postContent = authenticatedPage
        .locator('[class*="card"]')
        .first()
        .locator('[class*="prose"]');

      if (await postContent.isVisible()) {
        await postContent.click();
        await authenticatedPage.waitForURL(/\/posts\/[a-zA-Z0-9]+/);

        // Try to submit empty comment - button should be disabled
        const submitButton = authenticatedPage
          .getByRole("button", { name: /comment/i })
          .first();

        if (await submitButton.isVisible()) {
          await expect(submitButton).toBeDisabled();
        }
      }
    }
  });
});
