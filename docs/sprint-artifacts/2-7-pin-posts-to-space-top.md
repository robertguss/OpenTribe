# Story 2.7: Pin Posts to Space Top

Status: Done

## Story

As an **admin or moderator**,
I want to pin important posts to the top of a space,
So that members see crucial announcements first.

## Acceptance Criteria

1. **AC1: Pin Option for Moderators** - Given I have moderation permissions in a space, when I click the more menu on a post, then I see "Pin to top" option.

2. **AC2: Pin Post Action** - Given I click "Pin to top", when the action completes, then the post moves to top of space feed; shows a pin icon; remains at top regardless of sort order.

3. **AC3: Unpin Option** - Given I view a pinned post, when I click the more menu, then I see "Unpin" option instead of "Pin to top".

4. **AC4: Unpin Post Action** - Given I click "Unpin" on a pinned post, when the action completes, then post returns to chronological position; pin icon is removed.

5. **AC5: Multiple Pinned Posts** - Given multiple posts are pinned, when viewing the space feed, then they appear at top sorted by pin date (newest pin first); limit of 3 pinned posts per space is enforced.

6. **AC6: Pin Limit Enforcement** - Given a space already has 3 pinned posts, when I try to pin another post, then I see an error message indicating the limit has been reached; suggestion to unpin an existing post.

7. **AC7: Visual Pin Indicator** - Given a post is pinned, when viewing the feed, then the post shows a "Pinned" badge next to the author info; post has subtle highlighted styling (green border/background per UX).

## Tasks / Subtasks

### Backend Implementation

- [x] **Task 1: Create Pin/Unpin Mutations** (AC: 1, 2, 3, 4, 5, 6)
  - [x] 1.1 Add `pinPost` mutation to `convex/posts/mutations.ts`:
    - Validate user is moderator or admin
    - Check space has fewer than 3 pinned posts
    - Set `pinnedAt` timestamp on post
    - Return success or error
  - [x] 1.2 Add `unpinPost` mutation to `convex/posts/mutations.ts`:
    - Validate user is moderator or admin
    - Clear `pinnedAt` (set to undefined)
    - Return success
  - [x] 1.3 Add validators in `convex/posts/_validators.ts`:
    - `pinPostInput` - postId only
    - Reuse existing output validators
  - [x] 1.4 Write unit tests for mutations:
    - Test pinPost sets pinnedAt timestamp
    - Test pinPost requires moderator or admin role
    - Test pinPost enforces 3 pin limit per space
    - Test pinPost fails if already pinned
    - Test unpinPost clears pinnedAt
    - Test unpinPost requires moderator or admin role
    - Test unpinPost fails if not pinned
    - Test member cannot pin posts

- [x] **Task 2: Verify Query Sorting** (AC: 2, 4, 5)
  - [x] 2.1 Verify `listPostsBySpace` already handles pinned posts:
    - Pinned posts first (sorted by pinnedAt DESC)
    - Regular posts next (sorted by createdAt DESC)
    - Already implemented in Story 2-4
  - [x] 2.2 Verify `listPostsBySpaceEnhanced` also handles pinned posts correctly
  - [x] 2.3 Add query to count pinned posts in a space (for limit validation):
    - `countPinnedPosts` internal query or inline check

### Frontend Implementation

- [x] **Task 3: Update PostCard Component** (AC: 1, 3, 7)
  - [x] 3.1 Update `components/posts/PostCard.tsx`:
    - Add `isModerator` prop to control pin/unpin menu visibility
    - Add "Pin to top" / "Unpin" option in more menu dropdown
    - Pin icon already imported from lucide-react
  - [x] 3.2 Update props interface to include `isModerator` boolean
  - [x] 3.3 Use existing Pin icon and "Pinned" badge (already implemented)

- [x] **Task 4: Create Pin/Unpin Functionality** (AC: 2, 4, 6)
  - [x] 4.1 Add pin/unpin handlers in PostCard:
    - Call pinPost mutation with toast feedback
    - Call unpinPost mutation with toast feedback
    - Handle 3-post limit error with informative message
    - Loading state during mutation
  - [x] 4.2 Reactive UI update via Convex real-time sync
  - [x] 4.3 Error handling with descriptive toast messages

- [x] **Task 5: Update PostList and Feed Components** (AC: 1, 3)
  - [x] 5.1 Update `components/posts/PostList.tsx`:
    - Query current user's role
    - Pass `isModerator` prop to PostCard based on role
  - [x] 5.2 Update `app/(community)/posts/[postId]/page.tsx`:
    - Pass `isModerator` prop for single post view
  - [x] 5.3 Update space feed to pass moderator status

- [x] **Task 6: Testing** (AC: All)
  - [x] 6.1 Unit tests for pinPost mutation
  - [x] 6.2 Unit tests for unpinPost mutation
  - [x] 6.3 Unit tests for pin limit enforcement
  - [x] 6.4 Verify all existing tests still pass
  - [x] 6.5 Build succeeds with no TypeScript errors

## Dev Notes

### Architecture Requirements

**From ARCHITECTURE.md:**

- **Posts Schema (convex/schema.ts):**

  ```typescript
  posts: defineTable({
    spaceId: v.id("spaces"),
    authorId: v.id("users"),
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    title: v.optional(v.string()),
    content: v.string(), // Tiptap JSON
    contentHtml: v.string(), // Rendered HTML
    mediaIds: v.optional(v.array(v.id("_storage"))),
    likeCount: v.number(),
    commentCount: v.number(),
    pinnedAt: v.optional(v.number()), // <-- PIN TIMESTAMP
    editedAt: v.optional(v.number()),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_spaceId", ["spaceId"])
    .index("by_authorId", ["authorId"])
    .index("by_spaceId_and_createdAt", ["spaceId", "createdAt"])
    .index("by_createdAt", ["createdAt"]);
  ```

- **Authorization Model:**
  - Admin: Full access to all features including pinning
  - Moderator: Content moderation including pinning in spaces they moderate
  - Member: Cannot pin/unpin posts

**From UX Design Spec:**

- **Pin Badge:** Use Badge component with secondary variant, Pin icon
- **Pinned Post Styling:** Subtle primary color highlight (border-primary/20 bg-primary/5)
- **More Menu:** Three-dot icon (MoreHorizontal) with Pin/Unpin options
- **Colors:**
  - Primary: #4A7C59 (for pinned highlight)
  - Border: #E5E7EB
- **Transitions:** 150-200ms ease-out

**From PRD:**

- FR21: Admins can pin posts to the top of spaces

### Technical Specifications

**pinPost Mutation Pattern:**

```typescript
// convex/posts/mutations.ts
export const pinPost = mutation({
  args: {
    postId: v.id("posts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const authUser = await requireAuth(ctx);
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();
    if (!userProfile) throw new ConvexError("User profile not found");

    // Check moderator or admin role
    if (userProfile.role !== "admin" && userProfile.role !== "moderator") {
      throw new ConvexError("Moderation access required");
    }

    // Get the post
    const post = await ctx.db.get(args.postId);
    if (!post || post.deletedAt) {
      throw new ConvexError("Post not found");
    }

    // Check if already pinned
    if (post.pinnedAt) {
      throw new ConvexError("Post is already pinned");
    }

    // Check pin limit (max 3 per space)
    const pinnedPosts = await ctx.db
      .query("posts")
      .withIndex("by_spaceId", (q) => q.eq("spaceId", post.spaceId))
      .filter((q) =>
        q.and(
          q.neq(q.field("pinnedAt"), undefined),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .collect();

    if (pinnedPosts.length >= 3) {
      throw new ConvexError(
        "Maximum 3 pinned posts per space. Unpin another post first."
      );
    }

    // Pin the post
    await ctx.db.patch(args.postId, {
      pinnedAt: Date.now(),
    });

    return null;
  },
});
```

**unpinPost Mutation Pattern:**

```typescript
export const unpinPost = mutation({
  args: {
    postId: v.id("posts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const authUser = await requireAuth(ctx);
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();
    if (!userProfile) throw new ConvexError("User profile not found");

    // Check moderator or admin role
    if (userProfile.role !== "admin" && userProfile.role !== "moderator") {
      throw new ConvexError("Moderation access required");
    }

    // Get the post
    const post = await ctx.db.get(args.postId);
    if (!post || post.deletedAt) {
      throw new ConvexError("Post not found");
    }

    // Check if pinned
    if (!post.pinnedAt) {
      throw new ConvexError("Post is not pinned");
    }

    // Unpin the post
    await ctx.db.patch(args.postId, {
      pinnedAt: undefined,
    });

    return null;
  },
});
```

**PostCard More Menu Update Pattern:**

```typescript
// Inside PostCard component - expanded for moderators
{(isOwn || isModerator) && (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">More options</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {/* Pin/Unpin for moderators */}
      {isModerator && (
        <>
          {isPinned ? (
            <DropdownMenuItem onClick={handleUnpin}>
              <Pin className="mr-2 h-4 w-4" />
              Unpin
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handlePin}>
              <Pin className="mr-2 h-4 w-4" />
              Pin to top
            </DropdownMenuItem>
          )}
          {isOwn && <DropdownMenuSeparator />}
        </>
      )}

      {/* Edit/Delete for owner */}
      {isOwn && (
        <>
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
)}
```

### Existing Code References

**From Story 2-4 (Post Display and Engagement):**

- `convex/posts/queries.ts` - Already handles pinned posts in `listPostsBySpace`:

  ```typescript
  // First get pinned posts (pinnedAt is set)
  const pinnedPosts = await ctx.db
    .query("posts")
    .withIndex("by_spaceId", (q) => q.eq("spaceId", args.spaceId))
    .filter((q) =>
      q.and(
        q.neq(q.field("pinnedAt"), undefined),
        q.eq(q.field("deletedAt"), undefined)
      )
    )
    .order("desc")
    .collect();

  // Sort pinned posts by pinnedAt descending
  const sortedPinnedPosts = pinnedPosts.sort(
    (a, b) => (b.pinnedAt || 0) - (a.pinnedAt || 0)
  );
  ```

**From Story 2-6 (Edit and Delete Own Posts):**

- `components/posts/PostCard.tsx` - Already has:
  - More menu with DropdownMenu
  - `isOwn` prop for showing owner actions
  - Pin icon imported from lucide-react
  - isPinned detection and "Pinned" badge display
  - Pinned post styling (border-primary/20 bg-primary/5)

**Permissions (convex/\_lib/permissions.ts):**

- `requireAuth(ctx)` - Get authenticated user or throw
- `hasRole(userRole, requiredRole)` - Check role hierarchy

**User Query Pattern (established in previous stories):**

```typescript
const authUser = await requireAuth(ctx);
const userProfile = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
  .unique();
if (!userProfile) throw new ConvexError("User profile not found");
```

### Project Structure Notes

**Files to Modify:**

- `convex/posts/mutations.ts` - Add pinPost, unpinPost mutations
- `convex/posts/_validators.ts` - Add pinPostInput validator (if needed)
- `convex/posts/mutations.test.ts` - Add unit tests for pin/unpin
- `components/posts/PostCard.tsx` - Add isModerator prop, pin/unpin menu items
- `components/posts/PostList.tsx` - Query user role, pass isModerator prop
- `app/(community)/posts/[postId]/page.tsx` - Pass isModerator prop
- `app/(community)/spaces/[spaceId]/page.tsx` - Pass isModerator prop if needed

### Previous Story Learnings (from Stories 2-4, 2-5, 2-6)

1. **Pinned Post Sorting:** Already implemented in queries - pinned posts first by pinnedAt DESC

2. **PostCard Component:** Already has:
   - Pin icon import: `import { MoreHorizontal, Pencil, Pin, Trash2 } from "lucide-react";`
   - isPinned detection: `const isPinned = !!post.pinnedAt;`
   - Pinned badge display in header
   - Pinned post styling with cn() class names

3. **Role Checking Pattern:**

   ```typescript
   const isModerator =
     userProfile.role === "admin" || userProfile.role === "moderator";
   ```

4. **Toast Notifications:** Use `sonner` for success/error feedback

5. **Loading States:** Show loading in buttons during mutation

6. **DropdownMenuSeparator:** Use to separate different action groups

7. **Testing:** Use `convex-test` with `modules` from `test.setup.ts`

### Anti-Patterns to Avoid

- Do NOT allow members to pin/unpin posts
- Do NOT allow pinning more than 3 posts per space
- Do NOT use different icons than lucide-react
- Do NOT forget to check deletedAt when counting pinned posts
- Do NOT allow pinning already-deleted posts
- Do NOT skip the role check in mutations
- Do NOT forget optimistic UI updates for smooth UX
- Do NOT show pin/unpin options if user lacks permission

### Testing Strategy

**Unit Tests (convex-test):**

- Test pinPost sets pinnedAt timestamp
- Test pinPost requires moderator or admin role
- Test pinPost enforces 3 pin limit per space
- Test pinPost fails for member role
- Test pinPost fails if post already pinned
- Test pinPost fails if post is deleted
- Test unpinPost clears pinnedAt
- Test unpinPost requires moderator or admin role
- Test unpinPost fails for member role
- Test unpinPost fails if post not pinned
- Test pinned posts appear first in listPostsBySpace
- Test pinned posts sorted by pinnedAt DESC

**Manual Testing Checklist:**

- [ ] Moderator can see "Pin to top" option on unpinned posts
- [ ] Moderator can see "Unpin" option on pinned posts
- [ ] Member cannot see pin/unpin options
- [ ] Pin action shows success toast and post moves to top
- [ ] Unpin action shows success toast and post returns to chronological position
- [ ] Pin limit (3) is enforced with error message
- [ ] Pinned posts have visual indicator (badge + styling)

### Performance Considerations

- **Query Optimization:** Pinned post queries already use indexes
- **Limit Enforcement:** Count pinned posts in mutation, not frontend
- **Optimistic UI:** Update UI immediately on pin/unpin

### Security Considerations

- **Role Check Required:** Only moderator+ can pin/unpin
- **Deleted Posts:** Cannot pin deleted posts
- **Space Scope:** Pin limit is per-space, not global

### References

- [Source: docs/prd.md#FR21] - Admins can pin posts to top of spaces
- [Source: docs/epics.md#Story-2.7] - Story requirements
- [Source: docs/ux-design-specification.md#PostCard] - Pinned post styling
- [Source: convex/schema.ts#posts] - pinnedAt field
- [Source: convex/posts/queries.ts#listPostsBySpace] - Existing pinned post sorting
- [Source: components/posts/PostCard.tsx] - Existing pin UI elements
- [Source: docs/sprint-artifacts/2-6-edit-and-delete-own-posts.md] - Previous story patterns

## Dev Agent Record

### Context Reference

This story is the seventh in Epic 2: Community Spaces & Content. It depends on:

- Story 2-1 (Space Management for Admins) - Created spaces CRUD
- Story 2-2 (Space Navigation Sidebar) - Created space detail page
- Story 2-3 (Rich Text Post Composer) - Created post creation
- Story 2-4 (Post Display and Engagement) - Created PostCard with pinned post support in queries
- Story 2-5 (Comment System) - Established permission patterns
- Story 2-6 (Edit and Delete Own Posts) - Added more menu to PostCard

This story adds pin/unpin functionality for moderators. Story 2-8 (Activity Feed Aggregation) is next.

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- No issues encountered during implementation

### Completion Notes List

- Implemented `pinPost` and `unpinPost` mutations with full validation (auth, role check, limit enforcement)
- Added 14 new unit tests covering all pin/unpin scenarios
- Updated PostCard with `isModerator` prop for pin/unpin menu visibility
- Pin/Unpin handlers use toast notifications for user feedback
- PostList and post detail page now pass moderator status to PostCard
- Queries already handled pinned posts correctly from Story 2-4 (no changes needed)
- All 282 tests pass (3 new query tests added during code review), build succeeds with no TypeScript errors

### Known Limitations

- UI updates use Convex real-time reactivity (server confirms, then UI updates) rather than true optimistic updates (UI updates immediately, then confirms with server)
- Pin limit uses MAX_PINNED_POSTS_PER_SPACE constant (currently 3), not configurable per space

### File List

**Files Created:**

- None

**Files Modified:**

- `convex/posts/mutations.ts` - Added pinPost, unpinPost mutations (lines 217-338)
- `convex/posts/_validators.ts` - Added pinPostInput validator (lines 35-39)
- `convex/posts/mutations.test.ts` - Added 14 unit tests for pin/unpin functionality
- `components/posts/PostCard.tsx` - Added isModerator prop, pin/unpin menu items, handlers
- `components/posts/PostList.tsx` - Added isModerator detection and prop passing
- `app/(community)/posts/[postId]/page.tsx` - Added isModerator detection and prop passing
- `docs/sprint-artifacts/sprint-status.yaml` - Updated story status to in-progress → review

**Files Modified (Code Review Fixes):**

- `convex/_lib/permissions.ts` - Added MAX_PINNED_POSTS_PER_SPACE constant
- `convex/posts/mutations.ts` - Use constant instead of hardcoded pin limit
- `convex/posts/queries.test.ts` - Added 4 tests for pinned post query sorting behavior

## Change Log

| Date       | Change                                                                                        | Author                                  |
| ---------- | --------------------------------------------------------------------------------------------- | --------------------------------------- |
| 2025-12-05 | Story created with comprehensive context                                                      | Claude Opus 4.5 (create-story workflow) |
| 2025-12-05 | Implemented all tasks - story ready for review                                                | Claude Opus 4.5 (dev-story workflow)    |
| 2025-12-05 | Code review: Fixed false optimistic UI claim, added query tests, extracted pin limit constant | Claude Opus 4.5 (code-review workflow)  |
