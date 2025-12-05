import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components, internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query, ActionCtx } from "./_generated/server";
import { betterAuth } from "better-auth";

// Check if we're in a setup/analysis phase where env vars may not be configured yet
const isSetupPhase = (): boolean => {
  return !process.env.SITE_URL || !process.env.BETTER_AUTH_SECRET;
};

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false }
) => {
  // During initial setup/deployment, env vars may not be configured yet.
  // Return a minimal placeholder config that allows module analysis to succeed.
  // Auth won't work until env vars are properly set via `npx convex env set`.
  if (isSetupPhase()) {
    return betterAuth({
      logger: { disabled: true },
      secret: "placeholder-secret-for-setup-only",
      baseURL: "http://localhost:3000",
      database: authComponent.adapter(ctx),
      emailAndPassword: { enabled: false },
      plugins: [convex()],
    });
  }

  const siteUrl = process.env.SITE_URL!;
  const secret = process.env.BETTER_AUTH_SECRET!;

  return betterAuth({
    // disable logging when createAuth is called just to generate options.
    // this is not required, but there's a lot of noise in logs without it.
    logger: {
      disabled: optionsOnly,
    },
    secret,
    baseURL: siteUrl,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    // Configure simple, non-verified email/password to get started
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      // Password reset email configuration
      sendResetPassword: async ({ user, url }) => {
        // Use internal action to send password reset email via Resend
        // Note: We cast ctx to ActionCtx since Better Auth runs in the HTTP handler context
        // which has access to runAction for calling Convex functions
        console.log(`[Better Auth] Password reset requested for ${user.email}`);
        try {
          const actionCtx = ctx as unknown as ActionCtx;
          if (actionCtx.runAction) {
            await actionCtx.runAction(
              internal.notifications.actions.sendPasswordResetEmail,
              {
                email: user.email,
                resetUrl: url,
                name: user.name || undefined,
              }
            );
          } else {
            // This shouldn't happen in normal operation, but log if it does
            console.error(
              "[Better Auth] runAction not available in current context - password reset email not sent"
            );
          }
        } catch (error) {
          console.error(
            "[Better Auth] Failed to send password reset email:",
            error
          );
          // Don't throw - Better Auth will still return success to avoid email enumeration
        }
      },
    },
    plugins: [
      // The Convex plugin is required for Convex compatibility
      convex(),
    ],
  });
};

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});
