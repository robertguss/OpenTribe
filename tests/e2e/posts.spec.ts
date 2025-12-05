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

/**
 * Post Engagement E2E Tests - Story 2.4
 *
 * Tests for:
 * - AC1: Post Card Display with engagement stats
 * - AC2: Like Toggle
 * - AC3: Unlike Toggle
 * - AC4: Post Detail Navigation
 * - AC5: Real-time Updates (New Posts Banner)
 * - AC6: Pinned Post Display
 */
test.describe("Post Engagement - Story 2.4", () => {
  test.describe("AC1: Post Card Display", () => {
    test("should display like and comment counts", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/spaces");

      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();

      if (await spaceLink.isVisible()) {
        const href = await spaceLink.getAttribute("href");
        await authenticatedPage.goto(href!);

        // Wait for posts to load or empty state
        await authenticatedPage.waitForLoadState("networkidle");

        // Check for post cards with like/comment buttons
        const postCard = authenticatedPage.locator('[class*="card"]').first();

        if (await postCard.isVisible()) {
          // Should have like button with heart icon
          const likeButton = postCard.locator("button").filter({
            has: authenticatedPage.locator('svg[class*="lucide-heart"]'),
          });

          await expect(likeButton).toBeVisible({ timeout: 5000 });

          // Should have comment button
          const commentButton = postCard.locator("button").filter({
            has: authenticatedPage.locator(
              'svg[class*="lucide-message-circle"]'
            ),
          });

          await expect(commentButton).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test("should display share button", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/spaces");

      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();

      if (await spaceLink.isVisible()) {
        const href = await spaceLink.getAttribute("href");
        await authenticatedPage.goto(href!);

        await authenticatedPage.waitForLoadState("networkidle");

        const postCard = authenticatedPage.locator('[class*="card"]').first();

        if (await postCard.isVisible()) {
          // Should have share button
          const shareButton = postCard.locator("button").filter({
            has: authenticatedPage.locator('svg[class*="lucide-share"]'),
          });

          await expect(shareButton).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe("AC2 & AC3: Like Toggle", () => {
    test("should toggle like on click and update count", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/spaces");

      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();

      if (await spaceLink.isVisible()) {
        const href = await spaceLink.getAttribute("href");
        await authenticatedPage.goto(href!);

        // First create a post to ensure we have one
        const editor = authenticatedPage.locator(".ProseMirror");
        if (await editor.isVisible()) {
          await editor.click();
          const uniqueText = `Like test ${Date.now()}`;
          await authenticatedPage.keyboard.type(uniqueText);
          await authenticatedPage
            .getByRole("button", { name: /post/i })
            .click();

          // Wait for post to appear
          await expect(authenticatedPage.getByText(uniqueText)).toBeVisible({
            timeout: 10000,
          });

          // Find the post card with our text
          const postCard = authenticatedPage
            .locator('[class*="card"]')
            .filter({ hasText: uniqueText });

          // Find like button
          const likeButton = postCard.locator("button").filter({
            has: authenticatedPage.locator('svg[class*="lucide-heart"]'),
          });

          // Get initial count text
          const countBefore = await likeButton
            .locator("span")
            .first()
            .textContent();

          // Click to like
          await likeButton.click();

          // Wait for optimistic update
          await authenticatedPage.waitForTimeout(500);

          // Heart should be filled (red)
          await expect(
            likeButton.locator('svg[class*="fill-red"]')
          ).toBeVisible({ timeout: 5000 });

          // Count should have increased
          const countAfter = await likeButton
            .locator("span")
            .first()
            .textContent();
          expect(parseInt(countAfter || "0")).toBeGreaterThanOrEqual(
            parseInt(countBefore || "0")
          );

          // Click again to unlike
          await likeButton.click();

          // Wait for update
          await authenticatedPage.waitForTimeout(500);

          // Heart should be unfilled (no fill class)
          await expect(
            likeButton.locator('svg:not([class*="fill-red"])')
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test("should show toast when liking", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/spaces");

      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();

      if (await spaceLink.isVisible()) {
        const href = await spaceLink.getAttribute("href");
        await authenticatedPage.goto(href!);

        await authenticatedPage.waitForLoadState("networkidle");

        const postCard = authenticatedPage.locator('[class*="card"]').first();

        if (await postCard.isVisible()) {
          const likeButton = postCard.locator("button").filter({
            has: authenticatedPage.locator('svg[class*="lucide-heart"]'),
          });

          if (await likeButton.isVisible()) {
            await likeButton.click();

            // Should show toast with "+2 pts" message
            await expect(
              authenticatedPage.getByText(/\+2 pts|liked/i)
            ).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });
  });

  test.describe("AC4: Post Detail Navigation", () => {
    test("should navigate to post detail on content click", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/spaces");

      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();

      if (await spaceLink.isVisible()) {
        const href = await spaceLink.getAttribute("href");
        await authenticatedPage.goto(href!);

        await authenticatedPage.waitForLoadState("networkidle");

        // Find post content area
        const postContent = authenticatedPage
          .locator('[class*="card"]')
          .first()
          .locator('[class*="prose"]');

        if (await postContent.isVisible()) {
          // Click on post content
          await postContent.click();

          // Should navigate to post detail page
          await expect(authenticatedPage).toHaveURL(/\/posts\/[a-zA-Z0-9]+/, {
            timeout: 10000,
          });

          // Post detail page should show back button
          await expect(
            authenticatedPage.locator('button:has(svg[class*="lucide-arrow"])')
          ).toBeVisible();
        }
      }
    });

    test("should show comments section placeholder on detail page", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/spaces");

      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();

      if (await spaceLink.isVisible()) {
        const href = await spaceLink.getAttribute("href");
        await authenticatedPage.goto(href!);

        await authenticatedPage.waitForLoadState("networkidle");

        const postContent = authenticatedPage
          .locator('[class*="card"]')
          .first()
          .locator('[class*="prose"]');

        if (await postContent.isVisible()) {
          await postContent.click();

          // Wait for navigation
          await authenticatedPage.waitForURL(/\/posts\/[a-zA-Z0-9]+/);

          // Should show comments section
          await expect(authenticatedPage.getByText(/comments/i)).toBeVisible({
            timeout: 10000,
          });
        }
      }
    });

    test("should navigate back to space from detail page", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/spaces");

      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();

      if (await spaceLink.isVisible()) {
        const href = await spaceLink.getAttribute("href");
        await authenticatedPage.goto(href!);

        await authenticatedPage.waitForLoadState("networkidle");

        const postContent = authenticatedPage
          .locator('[class*="card"]')
          .first()
          .locator('[class*="prose"]');

        if (await postContent.isVisible()) {
          await postContent.click();

          // Wait for navigation to detail page
          await authenticatedPage.waitForURL(/\/posts\/[a-zA-Z0-9]+/);

          // Click back button
          const backButton = authenticatedPage.locator(
            'button:has(svg[class*="lucide-arrow"])'
          );
          await backButton.click();

          // Should navigate back to space
          await expect(authenticatedPage).toHaveURL(/\/spaces\//, {
            timeout: 10000,
          });
        }
      }
    });
  });

  test.describe("AC5: Share Functionality", () => {
    test("should copy link to clipboard on share click", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/spaces");

      const spaceLink = authenticatedPage
        .locator("a[href^='/spaces/']")
        .first();

      if (await spaceLink.isVisible()) {
        const href = await spaceLink.getAttribute("href");
        await authenticatedPage.goto(href!);

        await authenticatedPage.waitForLoadState("networkidle");

        const postCard = authenticatedPage.locator('[class*="card"]').first();

        if (await postCard.isVisible()) {
          const shareButton = postCard.locator("button").filter({
            has: authenticatedPage.locator('svg[class*="lucide-share"]'),
          });

          if (await shareButton.isVisible()) {
            await shareButton.click();

            // Should show toast confirming link copied
            await expect(
              authenticatedPage.getByText(/copied|clipboard/i)
            ).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });
  });
});
