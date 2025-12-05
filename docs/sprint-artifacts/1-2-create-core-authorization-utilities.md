# Story 1.2: Create Core Authorization Utilities

Status: ready-for-dev

## Story

As a **developer**,
I want centralized authorization utilities,
So that permission checks are consistent across all features.

## Acceptance Criteria

1. **Given** the extended schema with user roles
   **When** I import from `convex/_lib/permissions.ts`
   **Then** the following utilities are available and functional

2. **Given** an unauthenticated request
   **When** I call `requireAuth(ctx)`
   **Then** a `ConvexError` is thrown with message "You must be logged in"

3. **Given** a user with role "member"
   **When** I call `requireAdmin(ctx)`
   **Then** a `ConvexError` is thrown with message "Requires admin role or higher"

4. **Given** the hierarchical role model (Admin > Moderator > Member)
   **When** I call `requireModerator(ctx)` as an admin
   **Then** the check passes (admins have moderator+ permissions)

5. **Given** a space with visibility "paid" and requiredTier "pro"
   **When** I call `canViewSpace(ctx, userId, spaceId)` for a free-tier member
   **Then** the function returns `false`

6. **Given** a space with postPermission "moderators"
   **When** I call `canPostInSpace(ctx, userId, spaceId)` for a regular member
   **Then** the function returns `false`

7. **Given** a post authored by user A
   **When** user B (who is not a moderator or admin) calls `canEditContent(ctx, userBId, postId, "post")`
   **Then** the function returns `false`

8. **Given** unit tests for all permission utilities
   **When** I run `pnpm run test`
   **Then** all tests pass with 100% coverage of permission scenarios

## Tasks / Subtasks

- [ ] **Task 1: Create permissions utility file** (AC: #1)
  - [ ] 1.1: Create `convex/_lib/permissions.ts`
  - [ ] 1.2: Export `ROLE_HIERARCHY` constant for role comparisons
  - [ ] 1.3: Create TypeScript types for Role and permission function signatures

- [ ] **Task 2: Implement auth helpers** (AC: #1, #2)
  - [ ] 2.1: Implement `getAuthUser(ctx)` - returns BetterAuth user or null
  - [ ] 2.2: Implement `requireAuth(ctx)` - returns user or throws ConvexError
  - [ ] 2.3: Implement `getUserProfile(ctx, userId)` - gets our extended user doc

- [ ] **Task 3: Implement role-based helpers** (AC: #3, #4)
  - [ ] 3.1: Implement `requireRole(ctx, minRole)` - checks user has minimum role level
  - [ ] 3.2: Implement `requireAdmin(ctx)` - wraps requireRole("admin")
  - [ ] 3.3: Implement `requireModerator(ctx)` - wraps requireRole("moderator")
  - [ ] 3.4: Implement `hasRole(userRole, requiredRole)` - pure function for role comparison

- [ ] **Task 4: Implement space permission helpers** (AC: #5, #6)
  - [ ] 4.1: Implement `canViewSpace(ctx, userId, spaceId)` - checks visibility + tier
  - [ ] 4.2: Implement `canPostInSpace(ctx, userId, spaceId)` - checks postPermission
  - [ ] 4.3: Implement `canModerateSpace(ctx, userId, spaceId)` - checks mod+ role

- [ ] **Task 5: Implement content permission helpers** (AC: #7)
  - [ ] 5.1: Implement `canEditContent(ctx, userId, contentId, type)` - owner or mod+
  - [ ] 5.2: Implement `canDeleteContent(ctx, userId, contentId, type)` - owner or mod+
  - [ ] 5.3: Handle both "post" and "comment" content types

- [ ] **Task 6: Write unit tests** (AC: #8)
  - [ ] 6.1: Create `convex/_lib/permissions.test.ts`
  - [ ] 6.2: Test all auth helpers (authenticated/unauthenticated scenarios)
  - [ ] 6.3: Test role hierarchy (admin > mod > member)
  - [ ] 6.4: Test space visibility (public, members, paid with tiers)
  - [ ] 6.5: Test space post permissions (all, moderators, admin)
  - [ ] 6.6: Test content ownership and moderation permissions
  - [ ] 6.7: Run tests and verify all pass

## Dev Notes

### Critical Architecture Patterns

**Role Hierarchy (from Architecture doc):**
```typescript
const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 3,      // Full system access
  moderator: 2,  // Content moderation, limited admin
  member: 1,     // Standard participation
};
```

**Space Visibility Levels:**
- `public` - Visible to everyone, including non-logged-in visitors
- `members` - Visible to any logged-in member
- `paid` - Visible only to members with matching `requiredTier`

**Space Post Permissions:**
- `all` - Any member who can view the space can post
- `moderators` - Only moderators and admins can post
- `admin` - Only admins can post

**Error Handling Pattern:**
```typescript
// ALWAYS use ConvexError for user-facing errors
throw new ConvexError("You must be logged in");
throw new ConvexError("Permission denied");
throw new ConvexError("Requires admin role or higher");

// Return null for not-found - let client handle
if (!user) return null;
```

### Better Auth Integration

**Getting the authenticated user:**
```typescript
import { authComponent } from "../auth";

// In permissions.ts:
export async function getAuthUser(ctx: QueryCtx | MutationCtx) {
  return await authComponent.getAuthUser(ctx);
}
```

**User profile lookup:**
The Better Auth user has basic info (email, name). Our `users` table extends this with community-specific fields. Link via email or create a mapping.

```typescript
// Get our extended user profile
const userProfile = await ctx.db
  .query("users")
  .filter((q) => q.eq(q.field("email"), authUser.email))
  .unique();
```

**Important:** Better Auth manages the core user identity. Our `users` table stores community-specific extensions (bio, role, points, level, etc.). The link between them may be by email or a separate mapping - check existing auth patterns.

### Membership/Tier Checking

For paid space access, check the `memberships` table:
```typescript
const membership = await ctx.db
  .query("memberships")
  .withIndex("by_userId", (q) => q.eq("userId", userId))
  .unique();

if (!membership || membership.status !== "active") {
  return false; // No active subscription
}

// Tier comparison logic may need to be defined
// For now, simple string match or tier hierarchy
```

### Files to Create

| File | Purpose |
|------|---------|
| `convex/_lib/permissions.ts` | All permission utility functions |
| `convex/_lib/permissions.test.ts` | Unit tests for all utilities |

### Files to Reference (Read-Only)

| File | Purpose |
|------|---------|
| `convex/auth.ts` | Better Auth setup with `authComponent` |
| `convex/schema.ts` | Schema for users, memberships, spaces |
| `project-context.md` | Convex patterns and conventions |
| `docs/ARCHITECTURE.md` | Authorization model details |
| `docs/sprint-artifacts/epic-1-context.md` | Story 1.2 implementation details |

### Previous Story Learnings (Story 1.1)

From the completed Story 1-1:
1. **Schema is in place** - `users` table has `role` field as union type
2. **Membership table exists** - Has `tier`, `status`, `userId` fields
3. **Spaces table ready** - Has `visibility`, `postPermission`, `requiredTier` fields
4. **Polymorphic pattern** - `likes.targetId` and `reports.targetId` use `v.string()` for flexibility

### Implementation Reference

**Complete Implementation Pattern from Epic Context:**

```typescript
// convex/_lib/permissions.ts
import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { authComponent } from "../auth";
import { Id } from "../_generated/dataModel";

type Role = "admin" | "moderator" | "member";

export const ROLE_HIERARCHY: Record<Role, number> = {
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

// ... implement remaining functions per epic-1-context.md
```

### Testing Strategy

**Use convex-test with modules:**
```typescript
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "../schema";
import { modules } from "../test.setup";

describe("permissions", () => {
  it("should require authentication", async () => {
    const t = convexTest(schema, modules);
    // Test without identity - should throw
    await expect(
      t.run(async (ctx) => {
        const { requireAuth } = await import("./_lib/permissions");
        await requireAuth(ctx);
      })
    ).rejects.toThrow("You must be logged in");
  });

  it("should allow admin to pass moderator check", async () => {
    const t = convexTest(schema, modules);
    // Setup: create user with admin role
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        visibility: "public",
        role: "admin",
        points: 0,
        level: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // Test with admin identity
    const asAdmin = t.withIdentity({ subject: userId, email: "admin@test.com" });
    // ... test requireModerator passes for admin
  });
});
```

### Project Structure Notes

- Create `convex/_lib/` directory if it doesn't exist (underscore prefix = internal)
- Co-locate tests: `permissions.test.ts` next to `permissions.ts`
- Import pattern: `import { requireAuth, canViewSpace } from "../_lib/permissions"`

### Code Patterns to Follow

**Naming conventions:**
- Functions: camelCase (`getAuthUser`, `canViewSpace`)
- Types: PascalCase (`Role`, `QueryCtx`)
- Constants: SCREAMING_SNAKE_CASE (`ROLE_HIERARCHY`)

**Return patterns:**
- Auth helpers: return user object or throw ConvexError
- Permission checkers: return boolean (true/false), never throw

**Query patterns:**
- Use `.withIndex()` for indexed queries
- Use `.unique()` for single results
- Use `.filter()` only when index not available

### Anti-Patterns to Avoid

```typescript
// WRONG: Using throw Error for user-facing messages
throw new Error("Not authorized");  // Use ConvexError instead

// WRONG: Returning undefined for missing data
if (!user) return undefined;  // Use null instead

// WRONG: Not using indexes for queries
const user = await ctx.db.query("users")
  .filter((q) => q.eq(q.field("userId"), userId))  // BAD
  .unique();

// RIGHT: Using indexes
const membership = await ctx.db
  .query("memberships")
  .withIndex("by_userId", (q) => q.eq("userId", userId))  // GOOD
  .unique();

// WRONG: snake_case naming
export function get_auth_user() {}  // Should be getAuthUser

// WRONG: Assuming user exists without check
const userProfile = await ctx.db.get(userId);
return userProfile.role;  // Could be null!

// RIGHT: Null check
const userProfile = await ctx.db.get(userId);
if (!userProfile) return false;  // Handle null case
return userProfile.role;
```

### Dependencies

**No additional npm packages needed** - all utilities use built-in Convex features.

**Required imports:**
```typescript
import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { authComponent } from "../auth";
```

### References

- [Source: docs/ARCHITECTURE.md#Authorization-Model] - Role hierarchy and permissions
- [Source: docs/epics.md#Story-1.2] - Acceptance criteria
- [Source: docs/sprint-artifacts/epic-1-context.md#Story-1.2] - Implementation code
- [Source: project-context.md#Authorization-Model] - Three-tier system
- [Source: CLAUDE.md#Testing-Convex-Functions] - Testing patterns

## Dev Agent Record

### Context Reference

/Users/robertguss/Projects/startups/OpenTribe/docs/sprint-artifacts/1-2-create-core-authorization-utilities.md

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

---

_Story created by create-story workflow | 2025-12-04_
_Ultimate context engine analysis completed - comprehensive developer guide created_
