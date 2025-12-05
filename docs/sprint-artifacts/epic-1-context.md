# Tech-Spec: Epic 1 - Foundation & Authentication

**Created:** 2025-12-04
**Status:** Ready for Development
**Epic:** 1 of 8
**Stories:** 1.1 - 1.8 (8 stories)
**PRD Coverage:** FR1-FR7

---

## Overview

### Problem Statement

OpenTribe needs a complete identity and authentication layer. The current starter kit has only a demo `numbers` table and basic email/password auth. Before any community features can be built, we need:

1. A complete database schema with all domain tables
2. Role-based authorization utilities
3. Multiple authentication methods (email, Google, magic link)
4. User profile management
5. Notification preference configuration

### Solution

Extend the Convex schema with ~18 domain tables, create centralized authorization utilities, enhance the auth flows with Google OAuth and magic links, and build profile/settings management UI.

### Scope

**In Scope:**

- All 18 domain tables defined in Architecture document
- Authorization utilities with role hierarchy (Admin > Moderator > Member)
- Email/password registration with welcome email
- Google OAuth social login
- Magic link passwordless authentication
- Password reset flow
- Profile view/edit with avatar upload
- Notification preferences configuration

**Out of Scope:**

- Other social providers (GitHub, Apple) - post-MVP
- Member directory and search (Epic 8)
- Following system (Epic 8)
- Email verification requirement (disabled for quick setup)

---

## Context for Development

### Technology Stack

| Layer        | Technology               | Version      |
| ------------ | ------------------------ | ------------ |
| Frontend     | Next.js + React          | 16 + 19      |
| Backend      | Convex                   | Latest       |
| Auth         | Better Auth              | Latest       |
| Styling      | Tailwind CSS + shadcn/ui | 4 + NY style |
| Forms        | React Hook Form + Zod    | Latest       |
| Email        | Resend (via Convex)      | Component    |
| File Storage | Convex Storage           | Built-in     |

### Codebase Patterns

**Convex Schema Conventions:**

```typescript
// Tables: camelCase, plural
// Fields: camelCase
// Indexes: by_fieldName or by_field1_and_field2
defineTable({
  fieldName: v.string(),
  createdAt: v.number(), // Unix timestamp ms
  deletedAt: v.optional(v.number()), // Soft delete
}).index("by_fieldName", ["fieldName"]);
```

**Convex Function Organization:**

```
convex/
├── schema.ts              # Single schema file
├── auth.ts                # Better Auth integration (exists)
├── http.ts                # HTTP routes (exists)
├── _lib/                  # Shared utilities (NEW)
│   └── permissions.ts     # Authorization helpers
├── members/               # Domain module (NEW)
│   ├── queries.ts
│   └── mutations.ts
```

**Function Naming:**

- Queries: `get*`, `list*`, `search*`, `count*`
- Mutations: `create*`, `update*`, `delete*`, `set*`, `toggle*`

**Authorization Pattern:**

```typescript
import { authComponent } from "../auth";

export const myMutation = mutation({
  args: { ... },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new ConvexError("Unauthorized");

    // Check role
    if (!hasRole(user, "admin")) throw new ConvexError("Permission denied");

    // Proceed...
  }
});
```

**Error Pattern:**

- Return `null` for not-found (client handles display)
- Throw `ConvexError` for auth/permission errors
- Use descriptive error messages

### Files to Reference

**Existing Files (Read Before Modifying):**

- `convex/schema.ts` - Current demo schema to replace
- `convex/auth.ts` - Better Auth setup (extend for Google, magic link)
- `convex/http.ts` - HTTP router (may need webhook routes)
- `app/login/page.tsx` - Current login page
- `app/signup/page.tsx` - Current signup page
- `components/login-form.tsx` - Login form component
- `components/signup-form.tsx` - Signup form component
- `lib/auth-client.ts` - Frontend auth client

**Architecture Reference:**

- `docs/architecture.md` - Full architecture decisions
- `docs/prd.md` - Product requirements FR1-FR7
- `docs/ux-design-specification.md` - UI patterns (if exists)

### Technical Decisions (Pre-Made)

| Decision              | Choice                             | Rationale                         |
| --------------------- | ---------------------------------- | --------------------------------- |
| Role storage          | Field on user record               | Simpler than separate roles table |
| Profile visibility    | public/private enum                | Matches PRD FR6                   |
| Avatar storage        | Convex file storage                | Built-in, no external CDN needed  |
| Bio editor            | Tiptap (subset)                    | Consistent with post editor       |
| Notification prefs    | Embedded on user or separate table | TBD based on complexity           |
| Social login          | Google only MVP                    | Highest adoption, simplest config |
| Magic link expiry     | 15 minutes                         | Security best practice            |
| Password reset expiry | 1 hour                             | Standard practice                 |

---

## Implementation Plan

### Story 1.1: Extend Convex Schema with Core Tables

**Objective:** Replace demo schema with all domain tables needed for OpenTribe.

**Tasks:**

- [ ] Define `users` table with profile fields (bio, avatar, visibility, role)
- [ ] Define `spaces` table (name, description, icon, visibility, order)
- [ ] Define `posts` table with denormalized author info
- [ ] Define `comments` table with parentId for nesting
- [ ] Define `likes` table (targetType, targetId, userId)
- [ ] Define `courses`, `modules`, `lessons` tables
- [ ] Define `enrollments`, `lessonProgress` tables
- [ ] Define `events`, `rsvps` tables
- [ ] Define `memberships` table (Stripe integration)
- [ ] Define `notifications` table
- [ ] Define `conversations`, `messages` tables (DMs)
- [ ] Define `points`, `gamificationConfig`, `levels` tables
- [ ] Create indexes for all common query patterns
- [ ] Run `npx convex dev` to validate schema

**Schema Definition:**

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles (extends Better Auth user)
  users: defineTable({
    // Better Auth manages: id, email, name, image
    // We add:
    bio: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    visibility: v.union(v.literal("public"), v.literal("private")),
    role: v.union(
      v.literal("admin"),
      v.literal("moderator"),
      v.literal("member")
    ),
    points: v.number(),
    level: v.number(),
    notificationPrefs: v.optional(
      v.object({
        emailComments: v.boolean(),
        emailReplies: v.boolean(),
        emailFollowers: v.boolean(),
        emailEvents: v.boolean(),
        emailCourses: v.boolean(),
        emailDMs: v.boolean(),
        digestFrequency: v.union(
          v.literal("immediate"),
          v.literal("daily"),
          v.literal("weekly"),
          v.literal("off")
        ),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_points", ["points"]),

  // Community spaces
  spaces: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()), // emoji or Lucide icon name
    visibility: v.union(
      v.literal("public"),
      v.literal("members"),
      v.literal("paid")
    ),
    postPermission: v.union(
      v.literal("all"),
      v.literal("moderators"),
      v.literal("admin")
    ),
    requiredTier: v.optional(v.string()),
    order: v.number(),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_order", ["order"])
    .index("by_visibility", ["visibility"]),

  // Posts
  posts: defineTable({
    spaceId: v.id("spaces"),
    authorId: v.id("users"),
    // Denormalized for feed performance
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    title: v.optional(v.string()),
    content: v.string(), // Tiptap JSON
    contentHtml: v.string(), // Rendered HTML
    mediaIds: v.optional(v.array(v.id("_storage"))),
    likeCount: v.number(),
    commentCount: v.number(),
    pinnedAt: v.optional(v.number()),
    editedAt: v.optional(v.number()),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_spaceId", ["spaceId"])
    .index("by_authorId", ["authorId"])
    .index("by_spaceId_and_createdAt", ["spaceId", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  // Comments
  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    parentId: v.optional(v.id("comments")), // For nesting
    content: v.string(),
    likeCount: v.number(),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_postId", ["postId"])
    .index("by_authorId", ["authorId"])
    .index("by_parentId", ["parentId"]),

  // Likes (polymorphic)
  likes: defineTable({
    userId: v.id("users"),
    targetType: v.union(v.literal("post"), v.literal("comment")),
    targetId: v.string(), // ID as string for flexibility
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_target", ["targetType", "targetId"])
    .index("by_userId_and_target", ["userId", "targetType", "targetId"]),

  // Courses
  courses: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    descriptionHtml: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.id("_storage")),
    visibility: v.union(
      v.literal("public"),
      v.literal("members"),
      v.literal("paid")
    ),
    requiredTier: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    enrollmentCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_visibility", ["visibility"]),

  // Course modules
  modules: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_courseId", ["courseId"])
    .index("by_courseId_and_order", ["courseId", "order"]),

  // Lessons
  lessons: defineTable({
    moduleId: v.id("modules"),
    title: v.string(),
    content: v.optional(v.string()), // Tiptap JSON
    contentHtml: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    attachmentIds: v.optional(v.array(v.id("_storage"))),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_moduleId", ["moduleId"])
    .index("by_moduleId_and_order", ["moduleId", "order"]),

  // Course enrollments
  enrollments: defineTable({
    courseId: v.id("courses"),
    userId: v.id("users"),
    lastLessonId: v.optional(v.id("lessons")),
    enrolledAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_courseId", ["courseId"])
    .index("by_userId_and_courseId", ["userId", "courseId"]),

  // Lesson progress
  lessonProgress: defineTable({
    lessonId: v.id("lessons"),
    userId: v.id("users"),
    completedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_lessonId", ["lessonId"])
    .index("by_userId_and_lessonId", ["userId", "lessonId"]),

  // Events
  events: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    descriptionHtml: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    startTime: v.number(),
    endTime: v.number(),
    location: v.optional(v.string()), // Text or URL for virtual
    capacity: v.optional(v.number()), // null = unlimited
    rsvpCount: v.number(),
    recurrence: v.optional(
      v.object({
        frequency: v.union(
          v.literal("daily"),
          v.literal("weekly"),
          v.literal("monthly")
        ),
        interval: v.number(),
        endDate: v.optional(v.number()),
        endAfter: v.optional(v.number()),
      })
    ),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_startTime", ["startTime"])
    .index("by_endTime", ["endTime"]),

  // Event RSVPs
  rsvps: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    status: v.union(
      v.literal("going"),
      v.literal("maybe"),
      v.literal("notGoing")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_eventId", ["eventId"])
    .index("by_userId", ["userId"])
    .index("by_eventId_and_userId", ["eventId", "userId"]),

  // Memberships (Stripe integration)
  memberships: defineTable({
    userId: v.id("users"),
    tier: v.string(), // "free", "pro", "founding", etc.
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("trialing"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("none")
    ),
    currentPeriodEnd: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_stripeCustomerId", ["stripeCustomerId"]),

  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(), // "comment", "like", "follow", "mention", etc.
    actorId: v.optional(v.id("users")),
    actorName: v.optional(v.string()),
    actorAvatar: v.optional(v.string()),
    data: v.any(), // Flexible payload
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_read", ["userId", "read"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"]),

  // DM Conversations
  conversations: defineTable({
    participantIds: v.array(v.id("users")),
    lastMessageAt: v.number(),
    lastMessagePreview: v.optional(v.string()),
  }).index("by_lastMessageAt", ["lastMessageAt"]),

  // DM Messages
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    senderName: v.string(),
    content: v.string(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_conversationId_and_createdAt", ["conversationId", "createdAt"]),

  // Points history
  points: defineTable({
    userId: v.id("users"),
    action: v.string(), // "post", "comment", "like_received", "lesson_complete", etc.
    amount: v.number(),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"]),

  // Gamification config
  gamificationConfig: defineTable({
    action: v.string(),
    pointValue: v.number(),
  }).index("by_action", ["action"]),

  // Levels
  levels: defineTable({
    name: v.string(),
    threshold: v.number(),
    order: v.number(),
    color: v.optional(v.string()),
  })
    .index("by_order", ["order"])
    .index("by_threshold", ["threshold"]),

  // Follows
  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_followerId", ["followerId"])
    .index("by_followingId", ["followingId"])
    .index("by_followerId_and_followingId", ["followerId", "followingId"]),

  // Reports (content moderation)
  reports: defineTable({
    reporterId: v.id("users"),
    targetType: v.union(
      v.literal("post"),
      v.literal("comment"),
      v.literal("user")
    ),
    targetId: v.string(),
    reason: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),
  })
    .index("by_status", ["status"])
    .index("by_targetType_and_targetId", ["targetType", "targetId"]),

  // Space visit tracking (for unread indicators)
  spaceVisits: defineTable({
    userId: v.id("users"),
    spaceId: v.id("spaces"),
    lastVisitedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_spaceId", ["userId", "spaceId"]),

  // Community settings (singleton-ish, one doc)
  communitySettings: defineTable({
    name: v.string(),
    logoStorageId: v.optional(v.id("_storage")),
    faviconStorageId: v.optional(v.id("_storage")),
    primaryColor: v.optional(v.string()),
    customDomain: v.optional(v.string()),
    stripeConnectedAccountId: v.optional(v.string()),
    updatedAt: v.number(),
  }),
});
```

**Acceptance Criteria:**

- [ ] Schema validates without errors (`npx convex dev`)
- [ ] All 18+ tables created with proper types
- [ ] All indexes defined for common query patterns
- [ ] TypeScript types auto-generated in `_generated/`

---

### Story 1.2: Create Core Authorization Utilities

**Objective:** Centralized permission checking for all features.

**Tasks:**

- [ ] Create `convex/_lib/permissions.ts`
- [ ] Implement `getAuthUser(ctx)` - returns user or null
- [ ] Implement `requireAuth(ctx)` - returns user or throws
- [ ] Implement `requireAdmin(ctx)` - returns user or throws if not admin
- [ ] Implement `requireModerator(ctx)` - returns user or throws if not mod+
- [ ] Implement `canViewSpace(ctx, userId, spaceId)` - checks visibility
- [ ] Implement `canPostInSpace(ctx, userId, spaceId)` - checks post permission
- [ ] Implement `canEditContent(ctx, userId, contentId, type)` - owner or mod
- [ ] Implement `canDeleteContent(ctx, userId, contentId, type)` - owner or mod
- [ ] Add unit tests for all permission utilities

**Implementation:**

```typescript
// convex/_lib/permissions.ts
import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { authComponent } from "../auth";
import { Id } from "../_generated/dataModel";

type Role = "admin" | "moderator" | "member";

const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 3,
  moderator: 2,
  member: 1,
};

export async function getAuthUser(ctx: QueryCtx | MutationCtx) {
  return await authComponent.getAuthUser(ctx);
}

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const user = await getAuthUser(ctx);
  if (!user) {
    throw new ConvexError("You must be logged in");
  }
  return user;
}

export async function requireRole(ctx: QueryCtx | MutationCtx, minRole: Role) {
  const user = await requireAuth(ctx);
  const userDoc = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("email"), user.email))
    .unique();

  if (!userDoc) {
    throw new ConvexError("User profile not found");
  }

  const userRoleLevel = ROLE_HIERARCHY[userDoc.role];
  const requiredLevel = ROLE_HIERARCHY[minRole];

  if (userRoleLevel < requiredLevel) {
    throw new ConvexError(`Requires ${minRole} role or higher`);
  }

  return { ...user, profile: userDoc };
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  return requireRole(ctx, "admin");
}

export async function requireModerator(ctx: QueryCtx | MutationCtx) {
  return requireRole(ctx, "moderator");
}

export async function canViewSpace(
  ctx: QueryCtx,
  userId: Id<"users"> | null,
  spaceId: Id<"spaces">
): Promise<boolean> {
  const space = await ctx.db.get(spaceId);
  if (!space || space.deletedAt) return false;

  // Public spaces visible to all
  if (space.visibility === "public") return true;

  // Must be logged in for members/paid
  if (!userId) return false;

  const userDoc = await ctx.db.get(userId);
  if (!userDoc) return false;

  // Admins can view all
  if (userDoc.role === "admin") return true;

  // Members-only check
  if (space.visibility === "members") return true;

  // Paid tier check
  if (space.visibility === "paid" && space.requiredTier) {
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!membership || membership.status !== "active") return false;
    // Additional tier comparison logic here
  }

  return true;
}

export async function canPostInSpace(
  ctx: QueryCtx,
  userId: Id<"users">,
  spaceId: Id<"spaces">
): Promise<boolean> {
  // First check if can view
  if (!(await canViewSpace(ctx, userId, spaceId))) return false;

  const space = await ctx.db.get(spaceId);
  if (!space) return false;

  const userDoc = await ctx.db.get(userId);
  if (!userDoc) return false;

  // Check post permission
  if (space.postPermission === "admin" && userDoc.role !== "admin") {
    return false;
  }
  if (space.postPermission === "moderators" && userDoc.role === "member") {
    return false;
  }

  return true;
}

export async function canEditContent(
  ctx: QueryCtx,
  userId: Id<"users">,
  contentId: string,
  type: "post" | "comment"
): Promise<boolean> {
  const userDoc = await ctx.db.get(userId);
  if (!userDoc) return false;

  // Admins and mods can edit any content
  if (userDoc.role === "admin" || userDoc.role === "moderator") {
    return true;
  }

  // Check ownership
  if (type === "post") {
    const post = await ctx.db.get(contentId as Id<"posts">);
    return post?.authorId === userId;
  }
  if (type === "comment") {
    const comment = await ctx.db.get(contentId as Id<"comments">);
    return comment?.authorId === userId;
  }

  return false;
}

export async function canDeleteContent(
  ctx: QueryCtx,
  userId: Id<"users">,
  contentId: string,
  type: "post" | "comment"
): Promise<boolean> {
  // Same logic as edit for now
  return canEditContent(ctx, userId, contentId, type);
}

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
```

**Acceptance Criteria:**

- [ ] All utility functions implemented
- [ ] Role hierarchy enforced correctly
- [ ] Space visibility checks work for public/members/paid
- [ ] Content ownership checks work for posts/comments
- [ ] Unit tests pass

---

### Story 1.3: Email/Password Registration Flow

**Objective:** Enhanced registration with validation, welcome email, and proper user profile creation.

**Tasks:**

- [ ] Create Zod schema for registration validation
- [ ] Update signup form with real-time validation
- [ ] Create `convex/members/mutations.ts` with `createUserProfile`
- [ ] Implement welcome email via Resend (or queue for later)
- [ ] Handle duplicate email error gracefully
- [ ] Redirect to onboarding/dashboard after signup
- [ ] Add rate limiting (5 attempts/hour/IP)

**Frontend Validation Schema:**

```typescript
// lib/validation/auth.ts
import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export type SignupInput = z.infer<typeof signupSchema>;
```

**Acceptance Criteria:**

- [ ] Email validates RFC 5322 format on blur
- [ ] Password requirements shown and validated in real-time
- [ ] Duplicate email shows inline error
- [ ] Successful registration creates user profile with role "member"
- [ ] User is automatically logged in after registration
- [ ] Welcome email sent (can be placeholder for now)

---

### Story 1.4: Social Login with Google

**Objective:** Add Google OAuth for quick signup/login.

**Tasks:**

- [ ] Configure Better Auth Google provider
- [ ] Add Google OAuth credentials to environment
- [ ] Create "Continue with Google" button on login/signup
- [ ] Handle account linking for existing email
- [ ] Fetch and store Google profile photo as avatar
- [ ] Create user profile on first Google login

**Implementation Notes:**

```typescript
// convex/auth.ts - Add Google provider
import { google } from "better-auth/plugins";

// In createAuth function:
plugins: [
  convex(),
  google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
],
```

**Environment Variables Needed:**

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Acceptance Criteria:**

- [ ] Google button visible on login/signup pages
- [ ] OAuth flow redirects to Google and back
- [ ] New users get profile created with Google data
- [ ] Existing email users have accounts linked
- [ ] Google avatar saved to Convex storage

---

### Story 1.5: Magic Link Passwordless Authentication

**Objective:** Allow users to sign in via email link.

**Tasks:**

- [ ] Configure Better Auth magic link provider
- [ ] Set up Resend integration for email delivery
- [ ] Create "Sign in with email link" option on login
- [ ] Implement 15-minute expiry for magic links
- [ ] Handle expired/used link gracefully
- [ ] Rate limit to 3 requests per email per hour

**Acceptance Criteria:**

- [ ] "Sign in with email link" button on login page
- [ ] Email with magic link sent within seconds
- [ ] Clicking valid link logs user in
- [ ] Expired link shows error with "request new" option
- [ ] Used link cannot be reused

---

### Story 1.6: Password Reset Flow

**Objective:** Allow users to reset forgotten passwords.

**Tasks:**

- [ ] Create "Forgot password?" link on login page
- [ ] Implement reset request form (email input)
- [ ] Send reset email via Resend (1 hour expiry)
- [ ] Create password reset page with new password form
- [ ] Invalidate all existing sessions on password change
- [ ] Show success message and redirect to login

**Acceptance Criteria:**

- [ ] "Forgot password?" link visible on login
- [ ] Reset email sent (same message whether account exists or not - security)
- [ ] Reset link works within 1 hour
- [ ] New password form validates requirements
- [ ] Old sessions invalidated after reset
- [ ] Expired link shows error

---

### Story 1.7: User Profile View and Edit

**Objective:** Allow users to view and edit their profile information.

**Tasks:**

- [ ] Create `app/settings/profile/page.tsx`
- [ ] Build profile form with auto-save (500ms debounce)
- [ ] Implement avatar upload with preview
- [ ] Add bio editor (Tiptap subset, 500 char limit)
- [ ] Add visibility toggle (public/private)
- [ ] Create `convex/members/mutations.ts` updateProfile
- [ ] Show "Saving..." and "Saved" indicators

**Acceptance Criteria:**

- [ ] Profile settings page accessible from dashboard
- [ ] Display name, bio, avatar, visibility editable
- [ ] Changes auto-save with visual feedback
- [ ] Avatar uploads to Convex storage (max 5MB)
- [ ] Bio limited to 500 characters
- [ ] Private profiles hide bio from non-admins

---

### Story 1.8: Notification Preferences Setup

**Objective:** Allow users to configure notification preferences.

**Tasks:**

- [ ] Create `app/settings/notifications/page.tsx`
- [ ] Build toggles for each notification type
- [ ] Add email digest frequency selector
- [ ] Implement auto-save for preference changes
- [ ] Store preferences on user record

**Notification Types:**

- Comments on my posts (email + in-app)
- Replies to my comments (email + in-app)
- New followers (email + in-app)
- Event reminders (email + in-app)
- Course updates (email + in-app)
- Direct messages (email + in-app)

**Digest Frequencies:**

- Immediate
- Daily digest
- Weekly digest
- Off

**Acceptance Criteria:**

- [ ] All notification toggles functional
- [ ] Digest frequency selector works
- [ ] Preferences save immediately
- [ ] Default: All in-app on, email digest daily

---

## Additional Context

### Dependencies

**NPM Packages to Install:**

```bash
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
pnpm add react-hook-form @hookform/resolvers zod
pnpm add @dnd-kit/core @dnd-kit/sortable  # For future drag-drop
```

**Convex Components:**

- Better Auth (already installed)
- Resend component (for email)
- File Storage (built-in)

### Testing Strategy

**Unit Tests:**

- Permission utilities (`convex/_lib/permissions.test.ts`)
- Schema validation (automatic via Convex)

**Integration Tests:**

- Auth flows (registration, login, logout)
- Profile CRUD operations

**Manual Testing:**

- Google OAuth flow
- Magic link email delivery
- Password reset flow

### Notes

**First Story Execution Order:**

1. Story 1.1 (Schema) - MUST be first, all others depend on it
2. Story 1.2 (Permissions) - Needed by 1.3+
3. Story 1.3 (Registration) - Core auth flow
4. Stories 1.4-1.6 (Other auth) - Can be parallel
5. Story 1.7 (Profile) - Needs auth
6. Story 1.8 (Notifications) - Needs profile

**After Epic 1:**

- Update sprint status: `epic-1: contexted`
- Run `dev-story` for Story 1.1 first
- After all 8 stories done: `epic-1-retrospective: completed`

---

_Generated by create-tech-spec workflow | 2025-12-04_
