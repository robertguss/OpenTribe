/**
 * Settings Pages E2E Tests
 *
 * Tests for:
 * - Profile Settings (Story 1-7)
 * - Notification Preferences (Story 1-8)
 *
 * Both pages use auto-save with visual feedback.
 * Run: pnpm run test:e2e
 */
import { test, expect } from "../support/fixtures";

test.describe.serial("Profile Settings - Story 1-7", () => {
  test("should load profile settings page with user data", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/settings/profile");

    // Wait for form to load (not loading skeleton)
    await expect(authenticatedPage.getByTestId("profile-form")).toBeVisible();

    // Verify key form elements are visible
    await expect(
      authenticatedPage.getByTestId("input-display-name")
    ).toBeVisible();
    await expect(authenticatedPage.getByTestId("input-bio")).toBeVisible();
    await expect(authenticatedPage.getByTestId("input-email")).toBeVisible();
    await expect(
      authenticatedPage.getByTestId("toggle-visibility")
    ).toBeVisible();
  });

  test("should auto-save display name with save state indicators", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/settings/profile");

    // Wait for form to load
    await expect(authenticatedPage.getByTestId("profile-form")).toBeVisible();

    const nameInput = authenticatedPage.getByTestId("input-display-name");

    // Wait for email field to have a value (indicates profile data has loaded)
    await expect(authenticatedPage.getByTestId("input-email")).not.toHaveValue(
      ""
    );

    // Small delay to ensure React state is fully initialized
    await authenticatedPage.waitForTimeout(500);

    // Get current value
    const originalValue = await nameInput.inputValue();

    // Make a unique change by appending timestamp to ensure change is detected
    const uniqueSuffix = Date.now().toString().slice(-4);
    await nameInput.clear();
    await nameInput.pressSequentially(`Test User ${uniqueSuffix}`, {
      delay: 30,
    });

    // Click elsewhere to blur the input
    await authenticatedPage.getByTestId("input-bio").click();

    // Wait for "Saved" to appear (indicates auto-save completed)
    // Need to wait for debounce (500ms) + API call + state update
    await expect(authenticatedPage.getByTestId("save-state-saved")).toBeVisible(
      { timeout: 15000 }
    );

    // Restore original value for test isolation
    if (originalValue && originalValue !== `Test User ${uniqueSuffix}`) {
      await nameInput.clear();
      await nameInput.pressSequentially(originalValue, { delay: 10 });
      await authenticatedPage.getByTestId("input-bio").click();
      await expect(
        authenticatedPage.getByTestId("save-state-saved")
      ).toBeVisible({ timeout: 15000 });
    }
  });

  test("should auto-save bio with save state indicators", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/settings/profile");

    await expect(authenticatedPage.getByTestId("profile-form")).toBeVisible();

    // Wait for email field to have a value (indicates profile data has loaded)
    await expect(authenticatedPage.getByTestId("input-email")).not.toHaveValue(
      ""
    );

    // Small delay to ensure React state is fully initialized
    await authenticatedPage.waitForTimeout(500);

    const bioInput = authenticatedPage.getByTestId("input-bio");

    // Get current value
    const originalValue = await bioInput.inputValue();

    // Make a unique change to ensure change is detected
    const uniqueSuffix = Date.now().toString().slice(-4);
    await bioInput.clear();
    await bioInput.pressSequentially(`Test bio ${uniqueSuffix}`, { delay: 20 });

    // Click elsewhere to blur the input and trigger the debounce
    await authenticatedPage.getByTestId("input-display-name").click();

    // Wait for "Saved" to appear
    await expect(authenticatedPage.getByTestId("save-state-saved")).toBeVisible(
      { timeout: 15000 }
    );

    // Restore original value for test isolation
    if (originalValue && originalValue !== `Test bio ${uniqueSuffix}`) {
      await bioInput.clear();
      await bioInput.pressSequentially(originalValue, { delay: 5 });
      await authenticatedPage.getByTestId("input-display-name").click();
      await expect(
        authenticatedPage.getByTestId("save-state-saved")
      ).toBeVisible({ timeout: 15000 });
    }
  });

  test("should auto-save visibility toggle immediately", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/settings/profile");

    await expect(authenticatedPage.getByTestId("profile-form")).toBeVisible();

    const visibilityToggle = authenticatedPage.getByTestId("toggle-visibility");

    // Get current state
    const initialState = await visibilityToggle.getAttribute("data-state");

    // Toggle visibility (no debounce - immediate save)
    await visibilityToggle.click();

    // Wait for "Saved" to appear
    await expect(authenticatedPage.getByTestId("save-state-saved")).toBeVisible(
      { timeout: 15000 }
    );

    // Toggle back to original state for test isolation
    await visibilityToggle.click();
    await expect(authenticatedPage.getByTestId("save-state-saved")).toBeVisible(
      { timeout: 15000 }
    );

    // Verify state is back to original
    const finalState = await visibilityToggle.getAttribute("data-state");
    expect(finalState).toBe(initialState);
  });

  test("should display email as read-only", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/settings/profile");

    await expect(authenticatedPage.getByTestId("profile-form")).toBeVisible();

    const emailInput = authenticatedPage.getByTestId("input-email");

    // Verify email input is disabled
    await expect(emailInput).toBeDisabled();

    // Verify it has a value (user's email)
    const emailValue = await emailInput.inputValue();
    expect(emailValue).toContain("@");
  });
});

test.describe.serial("Notification Preferences - Story 1-8", () => {
  test("should load notification preferences page", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/settings/notifications");

    // Wait for form to load
    await expect(
      authenticatedPage.getByTestId("notification-preferences-form")
    ).toBeVisible();

    // Verify all toggle categories are visible
    await expect(
      authenticatedPage.getByTestId("toggle-emailComments")
    ).toBeVisible();
    await expect(
      authenticatedPage.getByTestId("toggle-emailReplies")
    ).toBeVisible();
    await expect(
      authenticatedPage.getByTestId("toggle-emailFollowers")
    ).toBeVisible();
    await expect(
      authenticatedPage.getByTestId("toggle-emailEvents")
    ).toBeVisible();
    await expect(
      authenticatedPage.getByTestId("toggle-emailCourses")
    ).toBeVisible();
    await expect(
      authenticatedPage.getByTestId("toggle-emailDMs")
    ).toBeVisible();

    // Verify digest frequency section
    await expect(
      authenticatedPage.getByTestId("digest-frequency-radio-group")
    ).toBeVisible();
  });

  test("should auto-save notification toggle with save state indicators", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/settings/notifications");

    await expect(
      authenticatedPage.getByTestId("notification-preferences-form")
    ).toBeVisible();

    const commentsToggle = authenticatedPage.getByTestId(
      "toggle-emailComments"
    );

    // Get current state
    const initialState = await commentsToggle.getAttribute("data-state");

    // Toggle the switch
    await commentsToggle.click();

    // Wait for "Saved" to appear
    await expect(authenticatedPage.getByTestId("save-state-saved")).toBeVisible(
      { timeout: 15000 }
    );

    // Toggle back to original state for test isolation
    await commentsToggle.click();
    await expect(authenticatedPage.getByTestId("save-state-saved")).toBeVisible(
      { timeout: 15000 }
    );

    // Verify state is back to original
    const finalState = await commentsToggle.getAttribute("data-state");
    expect(finalState).toBe(initialState);
  });

  test("should auto-save digest frequency change", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/settings/notifications");

    await expect(
      authenticatedPage.getByTestId("notification-preferences-form")
    ).toBeVisible();

    // Get current selected option by finding which one is checked
    const radioGroup = authenticatedPage.getByTestId(
      "digest-frequency-radio-group"
    );
    await expect(radioGroup).toBeVisible();

    // Get current selection and click a different option to ensure a change
    const dailyRadio = authenticatedPage.getByLabel("Daily digest");
    const weeklyRadio = authenticatedPage.getByLabel("Weekly digest");

    // Check if daily is currently selected
    const dailyChecked = await dailyRadio.isChecked();

    // Click the other option to ensure a change
    if (dailyChecked) {
      await weeklyRadio.click();
    } else {
      await dailyRadio.click();
    }

    // Wait for "Saved" to appear
    await expect(authenticatedPage.getByTestId("save-state-saved")).toBeVisible(
      { timeout: 15000 }
    );
  });

  test("should persist notification changes across page reload", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/settings/notifications");

    await expect(
      authenticatedPage.getByTestId("notification-preferences-form")
    ).toBeVisible();

    // Get current state of toggle
    const commentsToggle = authenticatedPage.getByTestId(
      "toggle-emailComments"
    );
    const initialChecked = await commentsToggle.getAttribute("data-state");

    // Toggle it
    await commentsToggle.click();

    // Wait for save to complete
    await expect(authenticatedPage.getByTestId("save-state-saved")).toBeVisible(
      { timeout: 15000 }
    );

    // Reload page
    await authenticatedPage.reload();

    // Wait for form to load again
    await expect(
      authenticatedPage.getByTestId("notification-preferences-form")
    ).toBeVisible();

    // Verify toggle state persisted (should be opposite of initial)
    const newChecked = await authenticatedPage
      .getByTestId("toggle-emailComments")
      .getAttribute("data-state");

    expect(newChecked).not.toBe(initialChecked);

    // Toggle back for test isolation
    await authenticatedPage.getByTestId("toggle-emailComments").click();
    await expect(authenticatedPage.getByTestId("save-state-saved")).toBeVisible(
      { timeout: 15000 }
    );
  });

  test("should display all digest frequency options", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/settings/notifications");

    await expect(
      authenticatedPage.getByTestId("notification-preferences-form")
    ).toBeVisible();

    // Verify all 4 digest options are visible
    await expect(
      authenticatedPage.getByTestId("digest-option-immediate")
    ).toBeVisible();
    await expect(
      authenticatedPage.getByTestId("digest-option-daily")
    ).toBeVisible();
    await expect(
      authenticatedPage.getByTestId("digest-option-weekly")
    ).toBeVisible();
    await expect(
      authenticatedPage.getByTestId("digest-option-off")
    ).toBeVisible();
  });
});
