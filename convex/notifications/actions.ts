/**
 * Notification Actions
 *
 * Server-side actions for sending emails via Resend using the Convex Resend component.
 * Uses React Email for beautiful, maintainable email templates.
 *
 * Requires RESEND_API_KEY environment variable to be set in Convex.
 * Set via: npx convex env set RESEND_API_KEY "re_..."
 *
 * The Convex Resend component provides:
 * - Queueing and batching
 * - Durable execution
 * - Idempotency
 * - Rate limiting
 */

// IMPORTANT: React Email requires Node runtime
"use node";

import { render } from "@react-email/render";
import { Resend } from "@convex-dev/resend";
import { components } from "../_generated/api";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { WelcomeEmail } from "../emails/WelcomeEmail";

// Initialize the Resend component client
const resend = new Resend(components.resend, {});

/**
 * Send a welcome email to a new user after registration.
 *
 * @param email - The user's email address
 * @param name - Optional display name for personalization
 * @returns true if email was queued successfully, false otherwise
 */
export const sendWelcomeEmail = action({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      // Render the React Email template to HTML
      const html = await render(
        WelcomeEmail({
          name: args.name,
          dashboardUrl: process.env.SITE_URL
            ? `${process.env.SITE_URL}/dashboard`
            : "https://opentribe.com/dashboard",
        })
      );

      // Send via Convex Resend component
      await resend.sendEmail(ctx, {
        from: "OpenTribe <noreply@opentribe.com>",
        to: args.email,
        subject: "Welcome to OpenTribe!",
        html,
      });

      console.log(`[sendWelcomeEmail] Successfully queued for ${args.email}`);
      return true;
    } catch (error) {
      console.error("[sendWelcomeEmail] Failed to send:", error);
      return false;
    }
  },
});
