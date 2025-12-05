import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import { PasswordResetEmail } from "./PasswordResetEmail";

describe("PasswordResetEmail", () => {
  const resetUrl = "https://example.com/reset-password?token=abc123";

  it("should render email template with all required fields", async () => {
    const html = await render(
      PasswordResetEmail({
        name: "John Doe",
        resetUrl,
      })
    );

    // Verify key content is present
    expect(html).toContain("Reset your password");
    expect(html).toContain("Hi John Doe,");
    expect(html).toContain(resetUrl);
    expect(html).toContain("1 hour");
    expect(html).toContain("Reset Password");
  });

  it("should render email template without name", async () => {
    const html = await render(
      PasswordResetEmail({
        resetUrl,
      })
    );

    // Should use generic greeting
    expect(html).toContain("Hi,");
    expect(html).not.toContain("undefined");
    expect(html).toContain(resetUrl);
  });

  it("should include security warning", async () => {
    const html = await render(
      PasswordResetEmail({
        resetUrl,
      })
    );

    expect(html).toContain("Security tip");
    expect(html).toContain("Never share this link");
  });

  it("should include expiration warning", async () => {
    const html = await render(
      PasswordResetEmail({
        resetUrl,
      })
    );

    expect(html).toContain("expire");
    expect(html).toContain("1 hour");
  });

  it("should include support contact", async () => {
    const html = await render(
      PasswordResetEmail({
        resetUrl,
      })
    );

    expect(html).toContain("support@opentribe.com");
  });

  it("should have proper HTML structure", async () => {
    const html = await render(
      PasswordResetEmail({
        name: "Test User",
        resetUrl,
      })
    );

    // Check for basic HTML structure
    expect(html).toContain("<!DOCTYPE html");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
  });

  it("should include reset URL in both button and text format", async () => {
    const html = await render(
      PasswordResetEmail({
        resetUrl,
      })
    );

    // URL should appear in button href and as plain text for fallback
    // Escape special regex characters in URL
    const escapedUrl = resetUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const urlCount = (html.match(new RegExp(escapedUrl, "g")) || []).length;
    expect(urlCount).toBeGreaterThanOrEqual(2);
  });
});
