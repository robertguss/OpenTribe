/**
 * Zod Validation Schemas
 *
 * Centralized validation schemas for form inputs.
 * Used with React Hook Form via @hookform/resolvers/zod.
 */

import { z } from "zod";

/**
 * Password validation rules:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
  .regex(/[0-9]/, "Password must contain at least 1 number");

/**
 * Signup form validation schema
 * Validates name, email (RFC 5322), password, and confirmPassword
 */
export const signupSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less"),
    email: z.string().email("Please enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Forgot password form validation schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password form validation schema
 * Validates password strength and confirmation match
 */
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Profile form validation schema
 * Validates name (max 100 chars), bio (max 500 chars), and visibility
 */
export const profileSchema = z.object({
  name: z
    .string()
    .max(100, "Name must be 100 characters or less")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(500, "Bio must be 500 characters or less")
    .optional()
    .or(z.literal("")),
  visibility: z.enum(["public", "private"]),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Notification preferences validation schema
 * Validates email notification toggles and digest frequency
 */
export const notificationPrefsSchema = z.object({
  emailComments: z.boolean(),
  emailReplies: z.boolean(),
  emailFollowers: z.boolean(),
  emailEvents: z.boolean(),
  emailCourses: z.boolean(),
  emailDMs: z.boolean(),
  digestFrequency: z.enum(["immediate", "daily", "weekly", "off"]),
});

export type NotificationPrefsFormData = z.infer<typeof notificationPrefsSchema>;

/**
 * Default notification preferences for new users or fallback
 */
export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefsFormData = {
  emailComments: true,
  emailReplies: true,
  emailFollowers: true,
  emailEvents: true,
  emailCourses: true,
  emailDMs: true,
  digestFrequency: "daily",
};

/**
 * Type-safe equality comparison for notification preferences.
 * More efficient and explicit than JSON.stringify comparison.
 */
export function areNotificationPrefsEqual(
  a: NotificationPrefsFormData,
  b: NotificationPrefsFormData
): boolean {
  return (
    a.emailComments === b.emailComments &&
    a.emailReplies === b.emailReplies &&
    a.emailFollowers === b.emailFollowers &&
    a.emailEvents === b.emailEvents &&
    a.emailCourses === b.emailCourses &&
    a.emailDMs === b.emailDMs &&
    a.digestFrequency === b.digestFrequency
  );
}
