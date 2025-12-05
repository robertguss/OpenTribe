# Story 1.1: Extend Convex Schema with Core Tables

Status: ready-for-dev

## Story

As a **developer**,
I want the Convex schema extended with all domain tables,
So that the database foundation is ready for all features.

## Acceptance Criteria

1. **Given** the existing starter schema with only `numbers` table
   **When** I extend the schema
   **Then** all 18+ domain tables are created with proper Convex types

2. **Given** the new schema
   **When** I run `npx convex dev`
   **Then** schema validates without errors and TypeScript types are generated in `_generated/`

3. **Given** the domain tables
   **When** I query any table
   **Then** indexes exist for all common query patterns (by_userId, by_spaceId, etc.)

4. **Given** any date/timestamp field
   **When** I store data
   **Then** values are stored as Unix timestamps (Date.now()) not ISO strings

5. **Given** any foreign key reference
   **When** I define the field
   **Then** it uses `v.id("tableName")` not `v.string()`

## Tasks / Subtasks

- [ ] **Task 1: Replace demo schema** (AC: #1)

  - [ ] 1.1: Delete or replace the existing `numbers` table
  - [ ] 1.2: Add `users` table with profile fields (bio, avatarStorageId, visibility, role, points, level, notificationPrefs)
  - [ ] 1.3: Add index `by_role` and `by_points` for user queries

- [ ] **Task 2: Add community content tables** (AC: #1, #5)

  - [ ] 2.1: Add `spaces` table (name, description, icon, visibility, postPermission, requiredTier, order, deletedAt)
  - [ ] 2.2: Add `posts` table with denormalized author info (authorName, authorAvatar, likeCount, commentCount)
  - [ ] 2.3: Add `comments` table with parentId for 2-level nesting
  - [ ] 2.4: Add `likes` table (polymorphic: targetType, targetId)
  - [ ] 2.5: Add indexes: by_spaceId, by_authorId, by_postId, by_target

- [ ] **Task 3: Add courses & learning tables** (AC: #1, #4, #5)

  - [ ] 3.1: Add `courses` table (title, description, thumbnail, visibility, status, enrollmentCount)
  - [ ] 3.2: Add `modules` table (courseId, title, order)
  - [ ] 3.3: Add `lessons` table (moduleId, title, content, videoUrl, attachments, order)
  - [ ] 3.4: Add `enrollments` table (courseId, userId, lastLessonId, completedAt)
  - [ ] 3.5: Add `lessonProgress` table (lessonId, userId, completedAt)
  - [ ] 3.6: Add indexes for course/module/lesson hierarchical queries

- [ ] **Task 4: Add events & calendar tables** (AC: #1, #4)

  - [ ] 4.1: Add `events` table (title, description, startTime, endTime, location, capacity, recurrence)
  - [ ] 4.2: Add `rsvps` table (eventId, userId, status)
  - [ ] 4.3: Add indexes: by_startTime, by_eventId

- [ ] **Task 5: Add payments & memberships tables** (AC: #1)

  - [ ] 5.1: Add `memberships` table (userId, tier, stripeCustomerId, stripeSubscriptionId, status, currentPeriodEnd)
  - [ ] 5.2: Add index: by_userId, by_stripeCustomerId

- [ ] **Task 6: Add notifications & messaging tables** (AC: #1, #4, #5)

  - [ ] 6.1: Add `notifications` table (userId, type, actorId, actorName, data, read, createdAt)
  - [ ] 6.2: Add `conversations` table (participantIds, lastMessageAt, lastMessagePreview)
  - [ ] 6.3: Add `messages` table (conversationId, senderId, senderName, content, readAt)
  - [ ] 6.4: Add indexes for notification and message queries

- [ ] **Task 7: Add gamification tables** (AC: #1, #4)

  - [ ] 7.1: Add `points` table (userId, action, amount, referenceType, referenceId, createdAt)
  - [ ] 7.2: Add `gamificationConfig` table (action, pointValue)
  - [ ] 7.3: Add `levels` table (name, threshold, order, color)
  - [ ] 7.4: Add indexes: by_userId, by_action, by_order

- [ ] **Task 8: Add supporting tables** (AC: #1)

  - [ ] 8.1: Add `follows` table (followerId, followingId)
  - [ ] 8.2: Add `reports` table (reporterId, targetType, targetId, reason, status, resolvedAt)
  - [ ] 8.3: Add `spaceVisits` table (userId, spaceId, lastVisitedAt) for unread indicators
  - [ ] 8.4: Add `communitySettings` table (name, logoStorageId, primaryColor, customDomain, stripeConnectedAccountId)

- [ ] **Task 9: Validate schema** (AC: #2, #3)
  - [ ] 9.1: Run `npx convex dev` and verify no errors
  - [ ] 9.2: Verify `_generated/dataModel.d.ts` contains all table types
  - [ ] 9.3: Verify all indexes are created correctly

## Dev Notes

### Critical Architecture Patterns

**MUST Follow These Convex Conventions:**

1. **Table names:** camelCase, plural (e.g., `users`, `posts`, `lessonProgress`)
2. **Field names:** camelCase (e.g., `authorId`, `createdAt`, `deletedAt`)
3. **References:** ALWAYS use `v.id("tableName")` - NEVER `v.string()` for IDs
4. **Timestamps:** ALWAYS use `v.number()` with `Date.now()` - NEVER ISO strings
5. **Soft delete:** Use `deletedAt: v.optional(v.number())` pattern
6. **Index naming:** `by_fieldName` or `by_field1_and_field2` for compound indexes

**Schema Patterns from Epic Context:**

```typescript
// Example pattern for user table
users: defineTable({
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
  // ... more fields
})
  .index("by_role", ["role"])
  .index("by_points", ["points"]);
```

### Files to Create/Modify

| File               | Action  | Notes                                       |
| ------------------ | ------- | ------------------------------------------- |
| `convex/schema.ts` | REPLACE | Replace demo schema with full domain schema |

### Files to Reference (Read-Only)

| File                                      | Purpose                                            |
| ----------------------------------------- | -------------------------------------------------- |
| `docs/sprint-artifacts/epic-1-context.md` | Complete schema definition with 500+ lines of code |
| `docs/epics.md`                           | Story 1.1 acceptance criteria                      |
| `project-context.md`                      | Convex naming conventions and rules                |
| `CLAUDE.md`                               | Project-specific Convex patterns                   |

### Existing Code State

The current `convex/schema.ts` contains only a demo `numbers` table:

```typescript
export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),
});
```

This must be REPLACED ENTIRELY with the domain schema.

### Project Structure Notes

- The schema lives in a single file: `convex/schema.ts`
- After schema is defined, `npx convex dev` auto-generates types in `convex/_generated/`
- TypeScript types like `Id<"posts">` will be available after schema deployment
- No migration needed - Convex handles schema evolution automatically

### Testing Requirements

- Run `npx convex dev` to validate schema
- Verify TypeScript compilation succeeds
- Check that `convex/_generated/dataModel.d.ts` exports all table types

### References

- [Source: docs/sprint-artifacts/epic-1-context.md#Story-1.1] - Full schema definition
- [Source: docs/epics.md#Story-1.1] - Acceptance criteria
- [Source: project-context.md#Schema-Conventions] - Naming rules
- [Source: CLAUDE.md#Convex-Function-Patterns] - Convex conventions

## Dev Agent Record

### Context Reference

/Users/robertguss/Projects/startups/OpenTribe/docs/sprint-artifacts/1-1-extend-convex-schema-with-core-tables.md

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

(To be filled by dev agent)

### Completion Notes List

(To be filled by dev agent)

### File List

(To be filled by dev agent - list of files created/modified)

---

## Complete Schema Reference

The following schema definition from `epic-1-context.md` should be used as the implementation reference. This is the authoritative source:

**Tables to Create (18+ tables):**

1. `users` - Extended user profiles with role, points, level, preferences
2. `spaces` - Community discussion spaces
3. `posts` - Posts with denormalized author info
4. `comments` - Nested comments (2 levels via parentId)
5. `likes` - Polymorphic likes (posts + comments)
6. `courses` - Course catalog
7. `modules` - Course modules
8. `lessons` - Lesson content
9. `enrollments` - User enrollments in courses
10. `lessonProgress` - Lesson completion tracking
11. `events` - Community events
12. `rsvps` - Event RSVPs
13. `memberships` - Stripe subscription status
14. `notifications` - In-app notifications
15. `conversations` - DM conversation threads
16. `messages` - DM messages
17. `points` - Points history
18. `gamificationConfig` - Point values per action
19. `levels` - Level definitions
20. `follows` - Member following
21. `reports` - Content moderation reports
22. `spaceVisits` - Unread tracking
23. `communitySettings` - Branding and settings

**Critical Implementation Notes:**

- Better Auth manages user email/name/image separately - our `users` table extends with community-specific fields
- The schema includes `deletedAt` for soft-delete on user-generated content (posts, comments)
- Denormalized fields (authorName, authorAvatar, likeCount) are for performance - update them in mutations
- Use `v.any()` for flexible notification data payloads
- Recurrence on events uses embedded object with RRule-style fields

---

_Story created by create-story workflow | 2025-12-04_
_Ultimate context engine analysis completed - comprehensive developer guide created_
