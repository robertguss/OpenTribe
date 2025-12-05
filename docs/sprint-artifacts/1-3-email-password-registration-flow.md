# Story 1.3: Email/Password Registration Flow

Status: Done

## Story

As a **visitor**,
I want to create an account with my email and password,
So that I can join the community.

## Acceptance Criteria

1. **Given** I am on the signup page
   **When** I view the registration form
   **Then** I see email and password fields with proper labels (UX: Form Patterns)

2. **And** the email field validates RFC 5322 format on blur
   **And** the password field shows requirements: "8+ characters, 1 uppercase, 1 number"
   **And** real-time validation feedback appears as I type (after first blur)

3. **When** I submit valid registration data
   **Then** POST to Better Auth registration endpoint is called
   **And** a new user record is created with role "member"
   **And** I am automatically logged in
   **And** I am redirected to the onboarding flow
   **And** a welcome email is sent via Resend

4. **When** I submit with an existing email
   **Then** I see inline error: "An account with this email already exists"

## Tasks / Subtasks

- [x] **Task 1: Enhance signup form with proper validation** (AC: #1, #2)
  - [x] 1.1: Install and configure React Hook Form with Zod resolver
  - [x] 1.2: Create Zod validation schema with email (RFC 5322) and password rules
  - [x] 1.3: Add real-time validation feedback on blur and onChange (after first blur)
  - [x] 1.4: Display password requirements inline: "8+ characters, 1 uppercase, 1 number"
  - [x] 1.5: Add proper field labels and error message styling per UX spec

- [x] **Task 2: Implement registration mutation with user profile creation** (AC: #3)
  - [x] 2.1: Create `convex/members/mutations.ts` with `createUserProfile` mutation
  - [x] 2.2: Mutation creates `users` table record with: role="member", points=0, level=1, visibility="public"
  - [x] 2.3: Create `convex/members/queries.ts` with `getUserProfileByEmail` query (for linking)
  - [x] 2.4: Create index `by_email` on users table (schema modification required)

- [x] **Task 3: Link Better Auth user to extended profile** (AC: #3)
  - [x] 3.1: Modify signup flow to call `createUserProfile` after successful Better Auth signup
  - [x] 3.2: Pass Better Auth user email to link the profile
  - [x] 3.3: Handle edge case: profile already exists for email (idempotent)

- [x] **Task 4: Implement welcome email via Resend** (AC: #3)
  - [x] 4.1: Create `convex/notifications/actions.ts` for email sending
  - [x] 4.2: Implement `sendWelcomeEmail` action using Resend API
  - [x] 4.3: Create welcome email template with community branding
  - [x] 4.4: Call `sendWelcomeEmail` after successful registration

- [x] **Task 5: Handle duplicate email error** (AC: #4)
  - [x] 5.1: Catch Better Auth "email already exists" error
  - [x] 5.2: Display inline error: "An account with this email already exists"
  - [x] 5.3: Suggest login link in error message

- [x] **Task 6: Implement redirect and loading states** (AC: #3)
  - [x] 6.1: Add loading state with "Creating Account..." feedback
  - [x] 6.2: Redirect to `/dashboard` after successful signup (later: onboarding flow)
  - [x] 6.3: Handle network errors gracefully with retry option

- [x] **Task 7: Write unit tests** (AC: all)
  - [x] 7.1: Create `convex/members/mutations.test.ts` for createUserProfile
  - [x] 7.2: Create `convex/members/queries.test.ts` for getUserProfileByEmail
  - [x] 7.3: Test profile creation with correct defaults
  - [x] 7.4: Test idempotent profile creation
  - [x] 7.5: Run tests and verify all pass

## Dev Notes

### Critical Architecture Patterns

**Better Auth + Extended Profile Linking:**

The current architecture has a gap identified in Story 1.2: Better Auth manages core user identity (id, email, name), but our `users` table extends this with community fields (bio, role, points, level). The link between them needs to be established during registration.

**Required Schema Modification:**
Add email field to `users` table for linking:

```typescript
// In convex/schema.ts - modify users table
users: defineTable({
  email: v.string(), // ADD THIS - links to Better Auth user
  bio: v.optional(v.string()),
  // ... rest of existing fields
})
  .index("by_email", ["email"]) // ADD THIS INDEX
  .index("by_role", ["role"])
  .index("by_points", ["points"]),
```

**Registration Flow Sequence:**

```
1. User submits form -> React Hook Form validates
2. Call authClient.signUp.email() -> Better Auth creates auth user
3. On success, call createUserProfile mutation -> Creates extended profile in users table
4. Trigger sendWelcomeEmail action -> Resend sends email
5. Redirect to dashboard
```

### Better Auth Integration

**Existing signup-form.tsx pattern:**

```typescript
await authClient.signUp.email({
  email,
  password,
  name,
});
```

**Error handling from Better Auth:**

```typescript
try {
  await authClient.signUp.email({ email, password, name });
} catch (err: any) {
  if (
    err?.code === "USER_ALREADY_EXISTS" ||
    err?.message?.includes("already exists")
  ) {
    setError("An account with this email already exists");
  } else {
    setError(err?.message || "Failed to create account. Please try again.");
  }
}
```

### Validation Requirements

**Zod Schema for Registration:**

```typescript
import { z } from "zod";

export const signupSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
      .regex(/[0-9]/, "Password must contain at least 1 number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
```

**React Hook Form Integration:**

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm<z.infer<typeof signupSchema>>({
  resolver: zodResolver(signupSchema),
  mode: "onBlur", // Validate on blur first
  reValidateMode: "onChange", // Then on change after first validation
});
```

### Convex Mutation Pattern

**createUserProfile mutation:**

```typescript
// convex/members/mutations.ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createUserProfile = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // Check if profile already exists (idempotent)
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      return existing._id;
    }

    // Create new profile with defaults
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      visibility: "public",
      role: "member",
      points: 0,
      level: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Also create default membership record
    await ctx.db.insert("memberships", {
      userId,
      tier: "free",
      status: "none",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userId;
  },
});
```

### Files to Create/Modify

| File                               | Action        | Purpose                                               |
| ---------------------------------- | ------------- | ----------------------------------------------------- |
| `convex/schema.ts`                 | Modify        | Add `email` field and `by_email` index to users table |
| `convex/members/mutations.ts`      | Create        | `createUserProfile` mutation                          |
| `convex/members/queries.ts`        | Create        | `getUserProfileByEmail` query                         |
| `convex/members/mutations.test.ts` | Create        | Unit tests for mutations                              |
| `convex/members/queries.test.ts`   | Create        | Unit tests for queries                                |
| `convex/notifications/actions.ts`  | Create        | `sendWelcomeEmail` action                             |
| `lib/validators.ts`                | Create/Modify | Add `signupSchema` Zod schema                         |
| `components/signup-form.tsx`       | Modify        | Add React Hook Form + validation                      |
| `package.json`                     | Modify        | Add `@hookform/resolvers` if not present              |

### Files to Reference (Read-Only)

| File                              | Purpose                                |
| --------------------------------- | -------------------------------------- |
| `convex/auth.ts`                  | Better Auth setup with `authComponent` |
| `lib/auth-client.ts`              | Better Auth React client               |
| `convex/_lib/permissions.ts`      | Role and permission patterns           |
| `project-context.md`              | Convex patterns and conventions        |
| `docs/ARCHITECTURE.md`            | Technical requirements                 |
| `docs/ux-design-specification.md` | Form design patterns                   |

### Previous Story Learnings (Story 1.2)

From the completed Story 1.2:

1. **Schema link gap identified** - The `users` table doesn't have an email field, making it impossible to link Better Auth users to extended profiles. This story MUST add the email field.

2. **Role hierarchy established** - Role system is: admin (3) > moderator (2) > member (1). New users get "member" role.

3. **Permission utilities ready** - `convex/_lib/permissions.ts` is complete with `getAuthUser`, `requireAuth`, `getUserProfile` etc.

4. **Error pattern** - Use `ConvexError` for user-facing errors, return `null` for not-found.

5. **Test patterns** - Use `convex-test` with `modules` from `test.setup.ts`.

6. **Architecture note from 1.2** - "The link between Better Auth users and our extended user profiles will be established in Story 1.3 (Registration Flow) when user profiles are created."

### Testing Strategy

**Unit Tests Pattern:**

```typescript
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.setup";

describe("members mutations", () => {
  it("should create user profile with defaults", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.mutation(api.members.mutations.createUserProfile, {
      email: "test@example.com",
      name: "Test User",
    });

    const user = await t.run(async (ctx) => {
      return await ctx.db.get(userId);
    });

    expect(user).not.toBeNull();
    expect(user.email).toBe("test@example.com");
    expect(user.role).toBe("member");
    expect(user.points).toBe(0);
    expect(user.level).toBe(1);
  });

  it("should be idempotent - return existing profile", async () => {
    const t = convexTest(schema, modules);

    const userId1 = await t.mutation(api.members.mutations.createUserProfile, {
      email: "test@example.com",
    });

    const userId2 = await t.mutation(api.members.mutations.createUserProfile, {
      email: "test@example.com",
    });

    expect(userId1).toBe(userId2);
  });
});
```

### Security Considerations

1. **Rate Limiting** - 5 attempts per hour per email. Email-based limiting is used instead of IP-based because client IPs are unreliable in serverless environments (proxies, CDNs). Implement using `convex-helpers` rate limiting:

```typescript
import { rateLimit } from "convex-helpers/server/rateLimit";

// In signup endpoint/mutation
await rateLimit(ctx, {
  name: "signup",
  key: email, // Email-based for reliable serverless rate limiting
  rate: 5,
  period: 60 * 60 * 1000, // 1 hour
});
```

2. **Password Handling** - Better Auth handles password hashing (bcrypt). We do NOT store passwords in our tables.

3. **Email Validation** - Validate RFC 5322 format on frontend, Better Auth validates on backend.

### UX Design Requirements

From UX spec:

- **Instant Gratification** - Every action produces visible feedback within 500ms
- **Auto-save not applicable** - Registration is explicit form submission
- **Loading States** - Show "Creating Account..." during submission
- **Error Handling** - Inline error messages, not alerts

**Form Design Pattern:**

```tsx
<Field>
  <FieldLabel htmlFor="password">Password</FieldLabel>
  <Input id="password" type="password" {...form.register("password")} />
  <FieldDescription>8+ characters, 1 uppercase, 1 number</FieldDescription>
  {errors.password && (
    <p className="text-destructive text-sm">{errors.password.message}</p>
  )}
</Field>
```

### Resend Email Integration (Convex Component + React Email)

**Environment Variable Required:**

```bash
npx convex env set RESEND_API_KEY "re_..."
```

**Convex Config Setup:**

```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import resend from "@convex-dev/resend/convex.config";

const app = defineApp();
app.use(resend);
export default app;
```

**React Email Template:**

```tsx
// convex/emails/WelcomeEmail.tsx
import {
  Body,
  Button,
  Container,
  Heading,
  Html,
  Text,
} from "@react-email/components";

export function WelcomeEmail({ name, dashboardUrl }) {
  return (
    <Html>
      <Body>
        <Container>
          <Heading>{name ? `Welcome, ${name}!` : "Welcome!"}</Heading>
          <Text>Thank you for joining our community.</Text>
          <Button href={dashboardUrl}>Go to Dashboard</Button>
        </Container>
      </Body>
    </Html>
  );
}
```

**Action Pattern using Convex Resend Component + React Email:**

```typescript
// convex/notifications/actions.ts
"use node"; // Required for React Email

import { render } from "@react-email/render";
import { Resend } from "@convex-dev/resend";
import { components } from "../_generated/api";
import { action } from "../_generated/server";
import { WelcomeEmail } from "../emails/WelcomeEmail";

const resend = new Resend(components.resend, {});

export const sendWelcomeEmail = action({
  args: { email: v.string(), name: v.optional(v.string()) },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const html = await render(WelcomeEmail({ name: args.name }));
    await resend.sendEmail(ctx, {
      from: "OpenTribe <noreply@opentribe.com>",
      to: args.email,
      subject: "Welcome to OpenTribe!",
      html,
    });
    return true;
  },
});
```

**Component Benefits:**

- Queueing and batching
- Durable execution
- Idempotency
- Rate limiting

**React Email Benefits:**

- Type-safe email templates
- Component-based design
- Easy to maintain and preview
- Responsive by default

### Anti-Patterns to Avoid

```typescript
// WRONG: Storing passwords in our tables
await ctx.db.insert("users", { password: args.password }); // NEVER

// WRONG: Not handling existing email case
const userId = await ctx.db.insert("users", { email }); // Will fail if exists

// WRONG: Throwing on idempotent operation
if (existing) throw new ConvexError("User already exists"); // Should return existing

// WRONG: Not validating on frontend
const handleSubmit = async () => {
  await authClient.signUp.email({ email, password }); // Missing validation!
};

// WRONG: Using filter instead of index
const user = await ctx.db
  .query("users")
  .filter((q) => q.eq(q.field("email"), email)) // Use withIndex!
  .unique();
```

### Dependencies

**Required npm packages:**

```bash
pnpm add @hookform/resolvers react-hook-form zod @convex-dev/resend @react-email/components @react-email/render
```

**Convex Component Configuration:**

- `@convex-dev/resend` must be added to `convex.config.ts` via `app.use(resend)`
- Provides durable email delivery with queueing, batching, and rate limiting

**React Email Setup:**

- Email templates live in `convex/emails/` directory
- Actions using React Email must have `"use node";` directive
- Use `render()` from `@react-email/render` to convert JSX to HTML

### References

- [Source: docs/epics.md#Story-1.3] - Full acceptance criteria
- [Source: docs/ARCHITECTURE.md#Authentication-Security] - Rate limiting, social login patterns
- [Source: docs/ux-design-specification.md#Form-Patterns] - Form validation UX
- [Source: docs/sprint-artifacts/1-2-create-core-authorization-utilities.md] - Schema link gap
- [Source: project-context.md#Error-Handling] - ConvexError patterns
- [Source: CLAUDE.md#Testing-Convex-Functions] - Test patterns

## Dev Agent Record

### Context Reference

/Users/robertguss/Projects/startups/OpenTribe/docs/sprint-artifacts/1-3-email-password-registration-flow.md

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation proceeded without major blockers.

### Completion Notes List

- Implemented full email/password registration flow with React Hook Form + Zod validation
- Enhanced signup form with real-time validation feedback (onBlur + onChange after first touch)
- Created `createUserProfile` mutation that creates user profile with defaults (role=member, points=0, level=1)
- Added `by_email` index to users table for efficient profile lookups
- Implemented idempotent profile creation (returns existing profile if email already registered)
- Created `sendWelcomeEmail` action using Convex Resend component + React Email for type-safe templates
- Added duplicate email error handling with "Sign in instead" link suggestion
- Schema modification: Added `email` and `name` fields to users table per Story 1.2 architecture note

**Code Review Fixes (2025-12-04):**

- **H1 FIXED:** Implemented rate limiting using convex-helpers (createProfile: 10/min with burst capacity 3)
- **M1 FIXED:** Added retry button for network errors with proper error categorization
- **M2 FIXED:** Improved profile creation error handling with rate limit detection
- **L1 FIXED:** Email normalized to lowercase on both mutations and queries for consistent lookups
- **Tests:** All 62 tests pass (7 mutations + 4 queries + 51 permissions, 1 skipped)

### File List

**Created:**

- `lib/validators.ts` - Zod validation schemas (signupSchema, loginSchema, passwordSchema)
- `convex/members/mutations.ts` - createUserProfile mutation with rate limiting and email normalization
- `convex/members/queries.ts` - getUserProfileByEmail query with email normalization
- `convex/members/mutations.test.ts` - Unit tests for mutations (7 tests including email normalization)
- `convex/members/queries.test.ts` - Unit tests for queries (4 tests with case-insensitive lookup)
- `convex/notifications/actions.ts` - sendWelcomeEmail action (uses Convex Resend component + React Email)
- `convex/emails/WelcomeEmail.tsx` - React Email template for welcome emails
- `convex/_lib/rateLimits.ts` - Rate limiting configuration (signup: 5/hour, createProfile: 10/min)

**Modified:**

- `convex/schema.ts` - Added email field, by_email index, and rateLimitTables from convex-helpers
- `convex/convex.config.ts` - Added Resend component configuration
- `components/signup-form.tsx` - React Hook Form integration with validation, retry button, email normalization
- `package.json` - Added react-hook-form, @hookform/resolvers, @convex-dev/resend, @react-email/components, @react-email/render, convex-helpers dependencies
- `convex/_lib/permissions.test.ts` - Fixed test helper to include required email field
- `.lintstagedrc.js` - Lint-staged configuration for pre-commit hooks
- `.prettierrc` - Prettier configuration
- `.prettierignore` - Prettier ignore patterns
- `tsconfig.json` - TypeScript config with test file exclusions

## Change Log

| Date       | Change                                                                                     | Author          |
| ---------- | ------------------------------------------------------------------------------------------ | --------------- |
| 2025-12-04 | Story implementation completed - all 7 tasks done                                          | Claude Opus 4.5 |
| 2025-12-04 | Code review completed - Fixed: rate limiting, retry button, email normalization (62 tests) | Claude Opus 4.5 |

---

_Story created by create-story workflow | 2025-12-04_
_Ultimate context engine analysis completed - comprehensive developer guide created_
