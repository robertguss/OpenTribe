# Story 1.6: Password Reset Flow

Status: done

## Story

As a **user**,
I want to reset my password if I forget it,
So that I can regain access to my account.

## Acceptance Criteria

1. **Given** I am on the login page
   **When** I click "Forgot password?"
   **Then** I see an email input form

2. **When** I submit my email
   **Then** a password reset email is sent via Resend
   **And** I see: "If an account exists, you'll receive a reset link"
   **And** the reset link expires after 1 hour

3. **When** I click the reset link
   **Then** I see a new password form with confirmation field
   **And** password requirements are displayed

4. **When** I submit a valid new password
   **Then** my password is updated
   **And** all existing sessions are invalidated
   **And** I am redirected to login with success message

## Tasks / Subtasks

- [x] **Task 1: Create forgot-password page** (AC: #1)
  - [x] 1.1: Create `app/forgot-password/page.tsx` with email input form
  - [x] 1.2: Use React Hook Form + Zod for email validation (reuse patterns from 1.3)
  - [x] 1.3: Style form following shadcn/ui patterns (consistent with login/signup)
  - [x] 1.4: Add "Back to login" link

- [x] **Task 2: Create password reset email action** (AC: #2)
  - [x] 2.1: Create `convex/emails/PasswordResetEmail.tsx` React Email template
  - [x] 2.2: Add `sendPasswordResetEmail` action in `convex/notifications/actions.ts`
  - [x] 2.3: Include reset link, expiration warning, and security note in email

- [x] **Task 3: Implement forgot-password form submission** (AC: #2)
  - [x] 3.1: Call Better Auth's `authClient.forgetPassword()` endpoint on form submit
  - [x] 3.2: Always show generic success message (security: don't reveal if email exists)
  - [x] 3.3: Add rate limiting (3 attempts per email per hour) - Implemented via convex-helpers rate limiting in sendPasswordResetEmail action
  - [x] 3.4: Normalize email to lowercase before submission

- [x] **Task 4: Create reset-password page** (AC: #3)
  - [x] 4.1: Create `app/reset-password/page.tsx` with token from URL query param
  - [x] 4.2: Add password and confirmPassword fields with validation
  - [x] 4.3: Display password requirements inline: "8+ characters, 1 uppercase, 1 number"
  - [x] 4.4: Validate passwords match before submission

- [x] **Task 5: Implement reset-password form submission** (AC: #4)
  - [x] 5.1: Call Better Auth's `authClient.resetPassword()` with token and new password
  - [x] 5.2: Handle invalid/expired token error with clear message
  - [x] 5.3: On success, redirect to `/login?reset=success`
  - [x] 5.4: Show success toast on login page after redirect

- [x] **Task 6: Add login page integration** (AC: #1)
  - [x] 6.1: Add "Forgot password?" link to login form (below password field)
  - [x] 6.2: Handle `?reset=success` query param to show success message
  - [x] 6.3: Style link per UX spec (text-muted-foreground, hover underline)

- [x] **Task 7: Write tests** (AC: all)
  - [x] 7.1: Test password reset email action with proper template rendering
  - [x] 7.2: Test validation schemas for forgot-password and reset-password forms

## Dev Notes

### Critical Architecture Patterns

**Better Auth Password Reset Flow:**

Better Auth provides built-in password reset functionality. The flow uses secure tokens with configurable expiration.

**Required Better Auth Client Methods:**

```typescript
// Initiate password reset (sends email)
await authClient.forgetPassword({
  email: "user@example.com",
  redirectTo: `${window.location.origin}/reset-password`,
});

// Complete password reset (with token from email link)
await authClient.resetPassword({
  newPassword: "newSecurePassword123",
  token: tokenFromUrl, // from ?token=xxx query param
});
```

**Token Handling:**

- Token is appended to URL as `?token=xxx`
- Token expires after 1 hour (Better Auth default)
- Token is single-use (invalidated after successful reset)

### Session Invalidation

**CRITICAL:** Better Auth automatically invalidates all existing sessions when password is reset. No additional implementation needed.

### Security Requirements

1. **Generic Response:** Always return "If an account exists..." message - NEVER reveal whether email exists
2. **Rate Limiting:** Limit password reset requests per email (3/hour)
3. **Token Expiration:** 1 hour default (Better Auth handles this)
4. **HTTPS Only:** Reset links only work over HTTPS in production

### Email Configuration

**Environment Variable Required (already set from Story 1.3):**

```bash
npx convex env set RESEND_API_KEY "re_..."
```

**Existing Infrastructure:**

- `convex/notifications/actions.ts` - Email sending action pattern
- `convex/emails/WelcomeEmail.tsx` - Template pattern to follow
- Convex Resend component configured in `convex.config.ts`

### Zod Validation Schemas

**Forgot Password Schema (new):**

```typescript
// Add to lib/validators.ts
export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
```

**Reset Password Schema (new):**

```typescript
// Add to lib/validators.ts
export const resetPasswordSchema = z
  .object({
    password: passwordSchema, // Reuse existing passwordSchema
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
```

### File Structure

**Files to Create:**

| File                                   | Purpose                                    |
| -------------------------------------- | ------------------------------------------ |
| `app/forgot-password/page.tsx`         | Forgot password page with email form       |
| `app/reset-password/page.tsx`          | Reset password page with new password form |
| `convex/emails/PasswordResetEmail.tsx` | React Email template for reset emails      |

**Files to Modify:**

| File                              | Changes                                              |
| --------------------------------- | ---------------------------------------------------- |
| `lib/validators.ts`               | Add `forgotPasswordSchema` and `resetPasswordSchema` |
| `convex/notifications/actions.ts` | Add `sendPasswordResetEmail` action                  |
| `components/login-form.tsx`       | Add "Forgot password?" link                          |

**Files to Reference (Read-Only):**

| File                              | Purpose                                       |
| --------------------------------- | --------------------------------------------- |
| `convex/emails/WelcomeEmail.tsx`  | Template pattern for email styling            |
| `components/signup-form.tsx`      | Form validation patterns with React Hook Form |
| `lib/auth-client.ts`              | Better Auth client usage                      |
| `convex/notifications/actions.ts` | Email action pattern                          |

### Previous Story Learnings (Story 1.3)

From completed Story 1.3 (Registration Flow):

1. **React Hook Form + Zod pattern:**

   ```typescript
   const form = useForm<FormData>({
     resolver: zodResolver(schema),
     mode: "onBlur",
     reValidateMode: "onChange",
   });
   ```

2. **Email normalization:** Always lowercase email before submission

   ```typescript
   const normalizedEmail = values.email.toLowerCase().trim();
   ```

3. **Error handling pattern:**

   ```typescript
   try {
     await authClient.method({ ... });
   } catch (err: unknown) {
     const error = err as Error;
     if (error.message?.includes("specific error")) {
       setFormError("User-friendly message");
     } else {
       setFormError("Generic fallback message");
     }
   }
   ```

4. **Convex Resend action pattern:**

   ```typescript
   "use node";
   import { render } from "@react-email/render";
   import { Resend } from "@convex-dev/resend";
   import { components } from "../_generated/api";

   const resend = new Resend(components.resend, {});

   export const sendEmail = action({
     args: { ... },
     returns: v.boolean(),
     handler: async (ctx, args) => {
       const html = await render(EmailTemplate({ ...props }));
       await resend.sendEmail(ctx, { from, to, subject, html });
       return true;
     },
   });
   ```

5. **Rate limiting pattern from convex-helpers:**
   - Already configured in `convex/_lib/rateLimits.ts`
   - Tables included in schema via `...rateLimitTables`

### UI/UX Requirements

**From UX Spec:**

- **Form Pattern:** Labels above inputs, required marked with \*, validation on blur then onChange
- **Error Handling:** Inline error messages, not alerts
- **Loading States:** Show "Sending..." during submission
- **Success Feedback:** Clear success message with next steps

**Forgot Password Form:**

- Single email input field
- "Send Reset Link" primary button
- "Back to login" secondary link
- Success state: "If an account exists, you'll receive a reset link"

**Reset Password Form:**

- Password field with requirements displayed
- Confirm password field
- "Reset Password" primary button
- Handle expired token gracefully with retry option

### Page Layout Pattern

**Consistent with login/signup pages:**

```tsx
<div className="flex min-h-screen items-center justify-center">
  <Card className="w-full max-w-md">
    <CardHeader>
      <CardTitle>Reset Password</CardTitle>
      <CardDescription>Enter your new password</CardDescription>
    </CardHeader>
    <CardContent>{/* Form content */}</CardContent>
  </Card>
</div>
```

### Better Auth Configuration Note

Password reset is enabled by default in Better Auth when `emailAndPassword.enabled: true`. The current configuration in `convex/auth.ts` already supports password reset:

```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: false,
},
```

### Password Reset Email Template

**Template should include:**

- Clear subject: "Reset your password"
- Greeting with optional name
- Reset link button
- Expiration warning: "This link expires in 1 hour"
- Security note: "If you didn't request this, ignore this email"
- Footer with support contact

### Anti-Patterns to Avoid

```typescript
// WRONG: Revealing email existence
if (!user) {
  setError("No account found with this email"); // SECURITY RISK!
}

// CORRECT: Always generic response
setSuccess("If an account exists, you'll receive a reset link");

// WRONG: Not handling expired token
await authClient.resetPassword({ token, newPassword });

// CORRECT: Handle token errors gracefully
try {
  await authClient.resetPassword({ token, newPassword });
} catch (err) {
  if (err.message?.includes("expired") || err.message?.includes("invalid")) {
    setError("This link has expired. Please request a new one.");
  }
}

// WRONG: Not normalizing email
await authClient.forgetPassword({ email: values.email });

// CORRECT: Normalize email
await authClient.forgetPassword({
  email: values.email.toLowerCase().trim(),
});
```

### Dependencies

**Already installed (from Story 1.3):**

- `react-hook-form`
- `@hookform/resolvers`
- `zod`
- `@convex-dev/resend`
- `@react-email/components`
- `@react-email/render`

No new npm packages required.

### Testing Strategy

**Email Action Test:**

```typescript
import { convexTest } from "convex-test";
import { describe, it, expect, vi } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.setup";

describe("password reset email", () => {
  it("should render password reset email template", async () => {
    // Test that template renders without error
    // Note: Full email sending tested in integration tests
  });
});
```

### References

- [Source: docs/epics.md#Story-1.6] - Full acceptance criteria
- [Source: docs/ARCHITECTURE.md#Authentication-Security] - Better Auth patterns
- [Source: docs/ux-design-specification.md#Form-Patterns] - Form validation UX
- [Source: docs/sprint-artifacts/1-3-email-password-registration-flow.md] - Previous story patterns
- [Source: convex/emails/WelcomeEmail.tsx] - Email template pattern
- [Source: lib/validators.ts] - Existing validation schemas

## Dev Agent Record

### Context Reference

/Users/robertguss/Projects/startups/OpenTribe/docs/sprint-artifacts/1-6-password-reset-flow.md

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

- TypeScript compilation: SUCCESS
- All tests pass: 85 passed, 1 skipped

### Completion Notes List

- Implemented complete password reset flow with Better Auth integration
- Created forgot-password page with email validation using React Hook Form + Zod
- Created reset-password page with password confirmation and token handling
- Created beautiful PasswordResetEmail template following WelcomeEmail pattern
- Configured Better Auth to send password reset emails via Resend
- Updated login page with "Forgot password?" link and success message handling
- Added comprehensive tests for email template rendering and validation schemas
- All security requirements met: generic responses, email normalization, token expiration handling

### File List

**New Files:**

- `app/forgot-password/page.tsx` - Forgot password page with email form
- `app/reset-password/page.tsx` - Reset password page with new password form
- `convex/emails/PasswordResetEmail.tsx` - React Email template for reset emails
- `convex/emails/PasswordResetEmail.test.ts` - Tests for email template rendering
- `convex/notifications/mutations.ts` - Rate limiting mutation for password reset emails
- `convex/notifications/mutations.test.ts` - Tests for rate limiting mutation (6 tests)
- `lib/validators.test.ts` - Tests for validation schemas

**Modified Files:**

- `lib/validators.ts` - Added `forgotPasswordSchema` and `resetPasswordSchema`
- `convex/notifications/actions.ts` - Added `sendPasswordResetEmail` internal action with rate limiting
- `convex/auth.ts` - Configured Better Auth `sendResetPassword` email handler with proper error handling
- `convex/_lib/rateLimits.ts` - Added `passwordReset` rate limit (3/hour/email)
- `components/login-form.tsx` - Added "Forgot password?" link and success message
- `app/login/page.tsx` - Wrapped with Suspense for useSearchParams
- `docs/sprint-artifacts/sprint-status.yaml` - Updated story status

### Change Log

- 2025-12-04: Implemented complete password reset flow (Story 1.6)
- 2025-12-04: [Code Review] Added rate limiting for password reset (3/hour/email) via convex-helpers
- 2025-12-04: [Code Review] Fixed runAction else branch in auth.ts for proper error logging
- 2025-12-04: [Code Review] Created convex/notifications/mutations.ts for rate limit checking
- 2025-12-04: [Code Review #2] Added `required` attribute to forgot-password email input
- 2025-12-04: [Code Review #2] Added `required` attributes to reset-password password fields
- 2025-12-04: [Code Review #2] Added comprehensive rate limit tests (6 tests) in mutations.test.ts
- 2025-12-04: [Code Review #2] Fixed loading state handling in reset-password (moved to finally block)
- 2025-12-04: [Code Review #2] Added w-full class to login/Google buttons for consistency
- 2025-12-04: [Code Review #2] Removed dead serverError code from forgot-password page

---

_Story created by create-story workflow | 2025-12-04_
_Ultimate context engine analysis completed - comprehensive developer guide created_
_Implementation completed by dev-story workflow | 2025-12-04_
