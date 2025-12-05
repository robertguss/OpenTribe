# Story 2.2: Space Navigation Sidebar

Status: complete

## Story

As a **member**,
I want to see and navigate between spaces,
So that I can find conversations that interest me.

## Acceptance Criteria

1. **AC1: Space List Display** - Given I am logged in, when I view the sidebar, then I see spaces grouped by visibility I can access: public spaces always visible, members-only if I'm a member, paid-only if I have the required tier.

2. **AC2: Space Item Display** - Given spaces are displayed, when I view each space item, then I see the space icon, name, and unread indicator (dot) if new posts since last visit.

3. **AC3: Space Navigation** - Given I click a space, when the navigation completes, then I navigate to that space's feed, the space is highlighted as active (green background #E8F0EA per UX), and URL updates to `/spaces/[spaceId]`.

4. **AC4: Keyboard Shortcuts** - Given I use keyboard shortcuts, when I press G+S then the spaces list opens, J/K navigates between spaces, and Enter opens the selected space.

5. **AC5: Real-time Updates** - Given spaces are added/modified/reordered by admin, when the change occurs, then my sidebar updates in real-time without page refresh.

6. **AC6: Mobile Bottom Nav** - Given I am on mobile (<768px), when I view navigation, then spaces appear in the bottom navigation bar or hamburger menu (collapsible sidebar).

## Tasks / Subtasks

### Backend Implementation

- [x] **Task 1: Create Space Visit Tracking** (AC: 2)
  - [x] 1.1 Create `convex/spaceVisits/mutations.ts` with `recordSpaceVisit` mutation
    - Get/update existing visit record or create new one
    - Update `lastVisitedAt` to current timestamp
  - [x] 1.2 Create `convex/spaceVisits/queries.ts` with `getSpaceVisits` query
    - Return all space visits for current user
    - Used to determine unread status
  - [x] 1.3 Write unit tests for visit tracking (minimum 6 tests)

- [x] **Task 2: Extend Space Queries for Member View** (AC: 1, 5)
  - [x] 2.1 Create `listSpacesForMember` query in `convex/spaces/queries.ts`
    - Filter by user's visibility permissions using `canViewSpace`
    - Sort by order ascending
    - Include unread indicator based on last post vs last visit
  - [x] 2.2 Add `getLatestPostTime` helper
    - Get most recent post createdAt per space
    - Used to compare against lastVisitedAt
  - [x] 2.3 Write unit tests (minimum 8 tests covering visibility filtering)

### Frontend Implementation

- [x] **Task 3: Create Space Navigation Component** (AC: 1, 2, 3)
  - [x] 3.1 Create `components/layout/SpaceNav.tsx`
    - Use shadcn/ui Sidebar components
    - Map over spaces from `listSpacesForMember` query
    - Show loading skeleton while data loads
  - [x] 3.2 Create `components/layout/SpaceNavItem.tsx`
    - Display: icon (emoji or Lucide), name, unread dot
    - Active state: green background (#E8F0EA)
    - Hover state: subtle green tint (#F4F8F5)
  - [x] 3.3 Integrate with existing `AppSidebar.tsx`
    - Replace placeholder navigation with SpaceNav
    - Keep NavUser in footer
    - Update header to show community name (from communitySettings)

- [x] **Task 4: Implement Space Detail Page** (AC: 3)
  - [x] 4.1 Create `app/(community)/spaces/[spaceId]/page.tsx`
    - Load space details via `getSpace` query
    - Show space header with icon, name, description
    - Placeholder for feed (Story 2.3 implements full composer)
    - Call `recordSpaceVisit` on mount to clear unread
  - [x] 4.2 Create `app/(community)/spaces/page.tsx`
    - Show all accessible spaces in grid/list
    - Link to individual space pages
  - [x] 4.3 Create `app/(community)/layout.tsx`
    - Community shell with sidebar + main content
    - Apply route protection (require auth)

- [x] **Task 5: Implement Keyboard Navigation** (AC: 4)
  - [x] 5.1 Create `hooks/useSpaceNavigation.ts`
    - Listen for G+S key combo to focus sidebar
    - J/K for up/down navigation
    - Enter to select and navigate
    - Track focused space index
  - [x] 5.2 Add focus styles to SpaceNavItem
    - Visible focus ring when keyboard navigating
    - Use tabIndex for accessibility

- [x] **Task 6: Implement Mobile Navigation** (AC: 6)
  - [x] 6.1 Create `components/layout/MobileNav.tsx`
    - Bottom tab bar with: Home, Spaces, Messages, Profile
    - Spaces tab shows space list in sheet/drawer
  - [x] 6.2 Add responsive breakpoint handling
    - Desktop (>768px): Full sidebar visible
    - Mobile (<768px): Sidebar hidden, use MobileNav
  - [x] 6.3 Use shadcn/ui Sheet for mobile space selection

- [x] **Task 7: Integration Testing** (AC: All)
  - [x] 7.1 Write E2E tests for space navigation flow
  - [x] 7.2 Test visibility filtering with different user roles
  - [x] 7.3 Test keyboard shortcuts

## Dev Notes

### Architecture Requirements

**From ARCHITECTURE.md:**

- **Schema:** `spaceVisits` table already exists in `convex/schema.ts:392-400`
  - Fields: userId, spaceId, lastVisitedAt
  - Indexes: by_userId, by_userId_and_spaceId
- **Convex Function Organization:**
  - Queries: `convex/spaces/queries.ts` (extend existing)
  - Mutations: `convex/spaceVisits/mutations.ts` (new)
- **Authorization:** Use `canViewSpace` from `convex/_lib/permissions.ts` for filtering
- **Real-time:** Convex reactive queries provide automatic real-time updates
- **Naming Conventions:**
  - Functions: camelCase (listSpacesForMember, recordSpaceVisit)
  - Components: PascalCase (SpaceNav.tsx, SpaceNavItem.tsx)

**From UX Design Spec (ux-design-specification.md):**

- **Layout:** Three-column desktop, single-column mobile with bottom nav
- **Active states:** Green background tint (#E8F0EA) per UX spec
- **Colors:**
  - Primary: #4A7C59
  - Primary Light: #E8F0EA
  - Primary Subtle: #F4F8F5
- **Transitions:** 150-200ms ease-out
- **Touch targets:** 44px minimum on mobile
- **Keyboard shortcuts:** G+S (spaces), J/K (navigate), Enter (select)

### Technical Specifications

**Existing Space Schema (from schema.ts:52-72):**

```typescript
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
}).index("by_order", ["order"]);
```

**SpaceVisits Schema (from schema.ts:392-400):**

```typescript
spaceVisits: defineTable({
  userId: v.id("users"),
  spaceId: v.id("spaces"),
  lastVisitedAt: v.number(),
})
  .index("by_userId", ["userId"])
  .index("by_userId_and_spaceId", ["userId", "spaceId"]);
```

**Permission Helper Pattern (from \_lib/permissions.ts):**

```typescript
// Use canViewSpace for visibility filtering
export async function canViewSpace(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users"> | null,
  spaceId: Id<"spaces">
): Promise<boolean>;
```

**Unread Logic:**

```typescript
// Space is "unread" if:
// 1. User has never visited (no spaceVisit record)
// 2. Space has posts created after lastVisitedAt
const isUnread = !lastVisit || latestPostTime > lastVisit.lastVisitedAt;
```

### Existing Code References

**Spaces Queries (convex/spaces/queries.ts):**

- `listSpaces` - Returns all non-deleted spaces sorted by order
- `getSpace` - Returns single space by ID
- `listSpacesForAdmin` - Admin view with member counts

**App Sidebar (components/app-sidebar.tsx):**

- Currently uses placeholder navigation
- Uses `@tabler/icons-react` - REPLACE with Lucide for consistency
- Has NavUser component in footer - KEEP
- Uses Convex useQuery for auth

**UI Components Available:**

- `components/ui/sidebar.tsx` - shadcn/ui sidebar primitives
- `components/ui/sheet.tsx` - For mobile drawer (may need to add)

### Project Structure Notes

**Files to Create:**

```
convex/
  spaceVisits/
    mutations.ts      # recordSpaceVisit
    queries.ts        # getSpaceVisits
    mutations.test.ts # Unit tests
    queries.test.ts   # Unit tests

app/
  (community)/
    layout.tsx        # Community shell with sidebar
    page.tsx          # Activity feed home (placeholder)
    spaces/
      page.tsx        # Space directory
      [spaceId]/
        page.tsx      # Space detail page

components/
  layout/
    SpaceNav.tsx      # Space navigation list
    SpaceNavItem.tsx  # Individual space item
    MobileNav.tsx     # Mobile bottom navigation

hooks/
  useSpaceNavigation.ts  # Keyboard navigation hook
```

**Files to Modify:**

- `components/app-sidebar.tsx` - Integrate SpaceNav, update to use Lucide icons

### Icon Implementation

**From Story 2.1:** Icons are stored as strings - either emoji characters or Lucide icon names.

**Icon Rendering Pattern:**

```typescript
import * as LucideIcons from "lucide-react";

function SpaceIcon({ icon }: { icon?: string }) {
  // If no icon, use default
  if (!icon) {
    return <MessageCircle className="h-4 w-4" />;
  }

  // Check if it's a Lucide icon name
  const LucideIcon = LucideIcons[icon as keyof typeof LucideIcons];
  if (LucideIcon && typeof LucideIcon === "function") {
    return <LucideIcon className="h-4 w-4" />;
  }

  // Otherwise treat as emoji
  return <span className="text-sm">{icon}</span>;
}
```

### Previous Story Learnings (from 2-1)

**From Story 2-1 (Space Management):**

1. **Admin auth pattern:** Always check for user profile after `requireAuth`:

   ```typescript
   const authUser = await requireAuth(ctx);
   const userProfile = await ctx.db
     .query("users")
     .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
     .unique();
   if (!userProfile) return [];
   ```

2. **Query return validation:** Always use typed validators for returns

3. **Existing mutations pattern:** See `convex/spaces/mutations.ts` for CRUD pattern

4. **Testing pattern:** Use `convex-test` with `modules` from `test.setup.ts`

5. **Component structure:** Admin components in `components/admin/`, layout components in `components/layout/`

### Anti-Patterns to Avoid

- Do NOT use `@tabler/icons-react` - use `lucide-react` for consistency with shadcn/ui
- Do NOT create separate page for each action - use in-place updates
- Do NOT skip return type validators on Convex functions
- Do NOT throw on not-found - return null or empty array
- Do NOT use manual page refresh - rely on Convex reactive queries
- Do NOT hardcode colors - use CSS variables from UX spec

### Testing Strategy

**Unit Tests (convex-test):**

- Test `recordSpaceVisit` creates/updates visit records
- Test `getSpaceVisits` returns correct visits for user
- Test `listSpacesForMember` filters by visibility
- Test unread calculation logic

**E2E Tests (Playwright):**

- Test navigating between spaces updates URL
- Test unread indicator clears on visit
- Test keyboard shortcuts work
- Test mobile navigation

### Performance Considerations

- **Batch space visits:** Fetch all visits for user in single query
- **Denormalized unread:** Consider adding unread boolean to query return (calculate server-side)
- **Optimistic updates:** Mark space as visited immediately on click

### References

- [Source: docs/ARCHITECTURE.md#Convex-Function-Organization]
- [Source: docs/ARCHITECTURE.md#Authorization-Model]
- [Source: docs/ux-design-specification.md#Navigation-Pattern]
- [Source: docs/ux-design-specification.md#Color-System]
- [Source: docs/ux-design-specification.md#Responsive-Design-Strategy]
- [Source: convex/schema.ts:52-72] - spaces table
- [Source: convex/schema.ts:392-400] - spaceVisits table
- [Source: convex/_lib/permissions.ts:174-242] - canViewSpace function
- [Source: convex/spaces/queries.ts] - Existing space queries
- [Source: docs/sprint-artifacts/2-1-space-management-for-admins.md] - Previous story

## Dev Agent Record

### Context Reference

This story is the second in Epic 2: Community Spaces & Content. It depends on Story 2-1 (Space Management for Admins) which created the spaces CRUD backend and admin UI. This story creates the member-facing sidebar navigation.

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- ✅ Task 1: Created space visit tracking with mutations and queries. `recordSpaceVisit` mutation creates/updates visit records. `getSpaceVisits` and `getSpaceVisit` queries retrieve visit records for the current user. 14 unit tests written covering both mutations and queries.
- ✅ Task 2: Created `listSpacesForMember` query that filters spaces by visibility (public/members/paid), checks tier membership for paid spaces, and includes `hasUnread` indicator based on latest post time vs last visit time. 8 additional unit tests added for visibility filtering and unread logic.
- ✅ Task 3: Created `SpaceNav.tsx` and `SpaceNavItem.tsx` components. Integrated with `AppSidebar.tsx`, replaced Tabler icons with Lucide icons for consistency. Updated `NavSecondary.tsx` to use Lucide types. Spaces show with icons, names, and unread dots. Active/hover states use UX spec colors.
- ✅ Task 4: Created community layout, spaces page, and space detail page. Space detail page calls `recordSpaceVisit` on mount to mark as read. Pages use loading skeletons and empty states. URLs follow `/spaces/[spaceId]` pattern.
- ✅ Task 5: Created `useSpaceNavigation` hook for keyboard navigation. G+S focuses the sidebar, J/K moves up/down, Enter navigates, Escape exits. Shows "J/K to navigate" hint when active. Focus ring on focused space item.
- ✅ Task 6: Created `MobileNav.tsx` bottom tab bar (Home, Spaces, Notifications, Profile). Spaces tab opens sidebar sheet. Added bottom padding to content area on mobile. Uses safe area for home indicator.
- ✅ Task 7: Created comprehensive E2E tests in `tests/e2e/spaces.spec.ts` covering all ACs: space list display, navigation, keyboard shortcuts (G+S, J/K, Enter, Escape), and mobile bottom navigation.

### File List

**Created:**

- `convex/spaceVisits/mutations.ts` - recordSpaceVisit mutation
- `convex/spaceVisits/queries.ts` - getSpaceVisits, getSpaceVisit queries
- `convex/spaceVisits/mutations.test.ts` - 6 unit tests
- `convex/spaceVisits/queries.test.ts` - 8 unit tests
- `app/(community)/layout.tsx` - Community pages layout with sidebar
- `app/(community)/page.tsx` - Community home page with space grid
- `app/(community)/spaces/page.tsx` - Space directory page
- `app/(community)/spaces/[spaceId]/page.tsx` - Space detail page
- `components/layout/SpaceNav.tsx` - Sidebar space navigation
- `components/layout/SpaceNavItem.tsx` - Individual space nav item
- `components/layout/MobileNav.tsx` - Mobile bottom navigation
- `hooks/useSpaceNavigation.ts` - Keyboard navigation hook
- `tests/e2e/spaces.spec.ts` - E2E tests for space navigation

**Modified:**

- `components/app-sidebar.tsx` - Integrated SpaceNav, switched to Lucide icons
- `components/nav-secondary.tsx` - Updated to use Lucide icon types
- `convex/spaces/queries.ts` - Added listSpacesForMember query

## Change Log

| Date       | Change                                                                                     | Author                         |
| ---------- | ------------------------------------------------------------------------------------------ | ------------------------------ |
| 2025-12-05 | Story created with comprehensive context                                                   | Claude (create-story workflow) |
| 2025-12-05 | Task 1 complete: Space visit tracking mutations and queries                                | Claude (dev-story workflow)    |
| 2025-12-05 | Task 2 complete: listSpacesForMember query with visibility filtering and unread indicators | Claude (dev-story workflow)    |
| 2025-12-05 | Tasks 3-7 complete: Frontend components, keyboard nav, mobile nav, E2E tests               | Claude (dev-story workflow)    |
| 2025-12-05 | Story complete: All acceptance criteria implemented                                        | Claude (dev-story workflow)    |
