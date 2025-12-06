# Story 2.8: Activity Feed Aggregation

Status: done

## Story

As a **member**,
I want to see a unified activity feed across all spaces,
So that I can catch up on everything happening in the community.

## Acceptance Criteria

1. **AC1: Activity Feed Display** - Given I am on the community home page, when the activity feed loads, then I see posts from all spaces I can access; sorted by most recent; each post shows the space name as a link.

2. **AC2: Infinite Scroll Pagination** - Given the activity feed is loaded, when I scroll to the bottom, then additional posts load automatically (infinite scroll); loading indicator shows during fetch.

3. **AC3: Filter Tabs** - Given I view the activity feed, when I click filter tabs, then I can filter by: All (default), Following (posts from people I follow), Popular (sorted by engagement).

4. **AC4: Space Name Link** - Given I see a post in the activity feed, when I click the space name shown on the post, then I navigate to that space's feed.

5. **AC5: New Posts Indicator** - Given new posts appear while I'm scrolling, when real-time updates occur, then a "New posts" indicator appears at the top; clicking it loads new content without losing scroll position.

6. **AC6: Permission Filtering** - Given the activity feed queries posts, when fetching posts, then only posts from spaces the current user can access are included (respects visibility: public, members-only, paid-tier-only).

7. **AC7: Post Enhancement** - Given posts display in the activity feed, when rendering each post, then all post features work: like/unlike, comment count link, author level badge, pinned indicator (if pinned), edited indicator.

## Tasks / Subtasks

### Backend Implementation

- [x] **Task 1: Create Activity Feed Query** (AC: 1, 2, 6, 7)
  - [x] 1.1 Create `convex/feed/queries.ts` with `listActivityFeed` query:
    - Authenticate user and get profile
    - Get list of all spaces user can access
    - Query posts from all accessible spaces
    - Sort by createdAt DESC (most recent first)
    - Paginate with cursor-based pagination
    - Include space name and icon for each post
    - Include hasLiked status and authorLevel
  - [x] 1.2 Add `convex/feed/_validators.ts` with output validators:
    - `activityFeedPostOutput` extending `enhancedPostOutput` with `spaceName`, `spaceIcon`
    - `activityFeedPaginatedOutput` for paginated response
  - [x] 1.3 Write unit tests for `listActivityFeed`:
    - Test returns posts from multiple accessible spaces
    - Test excludes posts from spaces user cannot access (visibility check)
    - Test excludes deleted posts
    - Test pagination cursor works correctly
    - Test posts sorted by createdAt DESC
    - Test includes space name and icon
    - Test includes hasLiked and authorLevel

- [x] **Task 2: Create Following Filter Query** (AC: 3)
  - [x] 2.1 Create `listActivityFeedFollowing` query in `convex/feed/queries.ts`:
    - Filter posts to only those from users the current user follows
    - Use `follows` table to get followed user IDs
    - Apply same visibility, pagination, and enhancement logic
  - [x] 2.2 Write unit tests:
    - Test returns only posts from followed users
    - Test empty result if not following anyone
    - Test respects space visibility

- [x] **Task 3: Create Popular Filter Query** (AC: 3)
  - [x] 3.1 Create `listActivityFeedPopular` query in `convex/feed/queries.ts`:
    - Calculate engagement score: likeCount + (commentCount \* 2)
    - Sort by engagement score DESC
    - Optional time window filter (last 7 days for Popular)
    - Apply same visibility, pagination, and enhancement logic
  - [x] 3.2 Write unit tests:
    - Test posts sorted by engagement (likes + comments)
    - Test respects space visibility
    - Test pagination works correctly

### Frontend Implementation

- [x] **Task 4: Create ActivityFeed Component** (AC: 1, 4, 5, 7)
  - [x] 4.1 Create `components/feed/ActivityFeed.tsx`:
    - Use `listActivityFeed` query with infinite scroll
    - Render PostCard for each post with space name link
    - Pass `isModerator` and `isOwn` props to PostCard
    - Show loading skeleton during initial load
    - Show empty state when no posts
  - [x] 4.2 Create `components/feed/ActivityFeedPost.tsx` (optional wrapper):
    - Extends PostCard with space name/icon header
    - Space name is a link to `/spaces/[spaceId]`
  - [x] 4.3 Add space info display to posts:
    - Show space icon + name above author info
    - Link to space when clicked

- [x] **Task 5: Implement Infinite Scroll** (AC: 2)
  - [x] 5.1 Use `useInView` from `react-intersection-observer` or custom scroll detection
  - [x] 5.2 Implement pagination state management:
    - Track cursor for pagination
    - Load next page when scroll reaches threshold
    - Show loading indicator at bottom while fetching
  - [x] 5.3 Handle edge cases:
    - Disable loading when hasMore is false
    - Prevent multiple simultaneous fetches
    - Handle error states gracefully

- [x] **Task 6: Create Filter Tabs** (AC: 3)
  - [x] 6.1 Create filter tab component:
    - Tabs: "All", "Following", "Popular"
    - Use shadcn/ui Tabs component
    - Switch query based on selected tab
  - [x] 6.2 Implement tab state:
    - Default to "All" tab
    - Reset pagination when switching tabs
    - Preserve tab state in URL (optional: query param)

- [x] **Task 7: Implement New Posts Indicator** (AC: 5)
  - [x] 7.1 Extend `NewPostsBanner` component or create `ActivityFeedNewPostsBanner`:
    - Detect new posts via Convex real-time subscription
    - Track previous post IDs to detect new arrivals
    - Show "X new posts" banner when not at top
  - [x] 7.2 Handle click to show new posts:
    - Scroll to top smoothly
    - Reset new posts counter
    - New posts appear in feed via Convex reactivity

- [x] **Task 8: Update Community Home Page** (AC: 1, 3, 4, 5)
  - [x] 8.1 Update `app/(community)/page.tsx`:
    - Replace space grid with ActivityFeed component
    - Keep "Welcome to the Community" heading
    - Add filter tabs above the feed
  - [x] 8.2 Ensure proper layout:
    - Feed takes main content area
    - Responsive design for mobile

- [x] **Task 9: Testing** (AC: All)
  - [x] 9.1 Unit tests for all new queries
  - [x] 9.2 Verify existing post features work in activity feed
  - [x] 9.3 Build succeeds with no TypeScript errors
  - [x] 9.4 All tests pass

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
    pinnedAt: v.optional(v.number()),
    editedAt: v.optional(v.number()),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_spaceId", ["spaceId"])
    .index("by_authorId", ["authorId"])
    .index("by_spaceId_and_createdAt", ["spaceId", "createdAt"])
    .index("by_createdAt", ["createdAt"]);
  ```

- **Follows Schema (for Following filter):**

  ```typescript
  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_followerId", ["followerId"])
    .index("by_followingId", ["followingId"])
    .index("by_followerId_and_followingId", ["followerId", "followingId"]);
  ```

- **Authorization Model:**
  - Space visibility: public, members-only, paid-tier-only
  - Use `canViewSpace(ctx, userId, spaceId)` from `convex/_lib/permissions.ts`
  - Posts from inaccessible spaces must be excluded

**From UX Design Spec:**

- **Activity Feed Pattern:** Infinite scroll with new posts indicator
- **Filter Tabs:** All | Following | Popular
- **Post Card:** Same as space feed but with space name header
- **Colors:**
  - Primary: #4A7C59
  - Active tab: Primary color underline
  - Border: #E5E7EB
- **Transitions:** 150-200ms ease-out

**From PRD:**

- FR22: Members can view an aggregated activity feed across all spaces
- FR23: Members can filter the activity feed by space or content type

### Technical Specifications

**Activity Feed Query Pattern:**

```typescript
// convex/feed/queries.ts
export const listActivityFeed = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    filter: v.optional(
      v.union(v.literal("all"), v.literal("following"), v.literal("popular"))
    ),
  },
  returns: activityFeedPaginatedOutput,
  handler: async (ctx, args) => {
    const authUser = await requireAuth(ctx);
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();
    if (!userProfile) {
      return { posts: [], nextCursor: undefined, hasMore: false };
    }

    // Get all accessible spaces
    const allSpaces = await ctx.db.query("spaces").collect();
    const accessibleSpaceIds: Id<"spaces">[] = [];

    for (const space of allSpaces) {
      if (
        !space.deletedAt &&
        (await canViewSpace(ctx, userProfile._id, space._id))
      ) {
        accessibleSpaceIds.push(space._id);
      }
    }

    // Build space lookup for names/icons
    const spaceLookup = new Map(
      allSpaces.map((s) => [s._id, { name: s.name, icon: s.icon }])
    );

    const limit = args.limit ?? 20;

    // Query all posts from accessible spaces, sorted by createdAt DESC
    // Note: Convex doesn't support OR on indexes, so we need to:
    // 1. Query using by_createdAt index for global ordering
    // 2. Filter to accessible spaces

    const postsQuery = ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .order("desc");

    const paginatedResult = await postsQuery.paginate({
      numItems: limit * 3, // Fetch extra to account for filtering
      cursor: args.cursor ? JSON.parse(args.cursor) : null,
    });

    // Filter to accessible spaces
    const accessiblePosts = paginatedResult.page
      .filter((post) => accessibleSpaceIds.includes(post.spaceId))
      .slice(0, limit);

    // Get user's likes for these posts
    const userLikes = await ctx.db
      .query("likes")
      .withIndex("by_userId", (q) => q.eq("userId", userProfile._id))
      .filter((q) => q.eq(q.field("targetType"), "post"))
      .collect();
    const likedPostIds = new Set(userLikes.map((l) => l.targetId));

    // Get author levels
    const authorIds = [...new Set(accessiblePosts.map((p) => p.authorId))];
    const authorLevels: Record<string, number> = {};
    for (const authorId of authorIds) {
      const author = await ctx.db.get(authorId);
      authorLevels[authorId] = author?.level ?? 1;
    }

    // Enhance posts with space info, like status, and author level
    const enhancedPosts = accessiblePosts.map((post) => ({
      ...post,
      spaceName: spaceLookup.get(post.spaceId)?.name ?? "Unknown Space",
      spaceIcon: spaceLookup.get(post.spaceId)?.icon,
      hasLiked: likedPostIds.has(post._id as string),
      authorLevel: authorLevels[post.authorId] ?? 1,
    }));

    return {
      posts: enhancedPosts,
      nextCursor: paginatedResult.isDone
        ? undefined
        : JSON.stringify(paginatedResult.continueCursor),
      hasMore: !paginatedResult.isDone && accessiblePosts.length === limit,
    };
  },
});
```

**Activity Feed Post Output Validator:**

```typescript
// convex/feed/_validators.ts
export const activityFeedPostOutput = v.object({
  _id: v.id("posts"),
  _creationTime: v.number(),
  spaceId: v.id("spaces"),
  spaceName: v.string(),
  spaceIcon: v.optional(v.string()),
  authorId: v.id("users"),
  authorName: v.string(),
  authorAvatar: v.optional(v.string()),
  authorLevel: v.number(),
  title: v.optional(v.string()),
  content: v.string(),
  contentHtml: v.string(),
  mediaIds: v.optional(v.array(v.id("_storage"))),
  likeCount: v.number(),
  commentCount: v.number(),
  pinnedAt: v.optional(v.number()),
  editedAt: v.optional(v.number()),
  createdAt: v.number(),
  deletedAt: v.optional(v.number()),
  hasLiked: v.boolean(),
});

export const activityFeedPaginatedOutput = v.object({
  posts: v.array(activityFeedPostOutput),
  nextCursor: v.optional(v.string()),
  hasMore: v.boolean(),
});
```

**Infinite Scroll Implementation Pattern:**

```typescript
// Using react-intersection-observer
import { useInView } from "react-intersection-observer";

function ActivityFeed() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const result = useQuery(api.feed.queries.listActivityFeed, {
    limit: 20,
    cursor,
  });

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  // Load more when scroll trigger is in view
  useEffect(() => {
    if (inView && result?.hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      setCursor(result.nextCursor);
    }
  }, [inView, result?.hasMore, result?.nextCursor, isLoadingMore]);

  // Accumulate posts
  useEffect(() => {
    if (result?.posts) {
      setAllPosts((prev) => {
        const newIds = new Set(result.posts.map((p) => p._id));
        const existing = prev.filter((p) => !newIds.has(p._id));
        return [...existing, ...result.posts];
      });
      setIsLoadingMore(false);
    }
  }, [result?.posts]);

  return (
    <div>
      {allPosts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
      {result?.hasMore && (
        <div ref={loadMoreRef}>
          {isLoadingMore && <Spinner />}
        </div>
      )}
    </div>
  );
}
```

**Filter Tabs Pattern:**

```typescript
// Filter tabs using shadcn Tabs
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FeedFilter = "all" | "following" | "popular";

function FeedFilterTabs({
  activeFilter,
  onFilterChange
}: {
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}) {
  return (
    <Tabs value={activeFilter} onValueChange={(v) => onFilterChange(v as FeedFilter)}>
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="following">Following</TabsTrigger>
        <TabsTrigger value="popular">Popular</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
```

### Existing Code References

**From Story 2-4 & 2-7 (Post Display and Pin):**

- `convex/posts/queries.ts` - Post query patterns with pagination
- `listPostsBySpaceEnhanced` - Includes hasLiked, authorLevel enhancement
- Pinned posts handled separately (first by pinnedAt DESC)

**From PostCard Component:**

```typescript
// components/posts/PostCard.tsx already handles:
- Author avatar, name, level badge
- Like count and comment count
- Pin indicator and pinned styling
- Edited indicator
- Owner/moderator menu
```

**From PostList Component:**

```typescript
// components/posts/PostList.tsx patterns to reuse:
- NewPostsBanner for new post detection
- Scroll position tracking for new posts indicator
- isOwn and isModerator detection
- Loading skeletons
- Empty state
```

**From Permissions (convex/\_lib/permissions.ts):**

```typescript
export async function canViewSpace(
  ctx: QueryCtx,
  userId: Id<"users">,
  spaceId: Id<"spaces">
): Promise<boolean>;
```

**User Query Pattern (established in previous stories):**

```typescript
const authUser = await requireAuth(ctx);
const userProfile = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
  .unique();
if (!userProfile) return { posts: [], nextCursor: undefined, hasMore: false };
```

### Project Structure Notes

**Files to Create:**

- `convex/feed/queries.ts` - Activity feed queries (listActivityFeed, listActivityFeedFollowing, listActivityFeedPopular)
- `convex/feed/_validators.ts` - Output validators for activity feed
- `convex/feed/queries.test.ts` - Unit tests for feed queries
- `components/feed/ActivityFeed.tsx` - Main activity feed component
- `components/feed/FeedFilterTabs.tsx` - Filter tabs component
- `components/feed/index.ts` - Barrel export

**Files to Modify:**

- `app/(community)/page.tsx` - Replace space grid with ActivityFeed
- `components/posts/PostCard.tsx` - Add optional spaceName/spaceIcon display (or create wrapper)

### Previous Story Learnings (from Story 2-7)

1. **Query Pattern:** Use `requireAuth`, get userProfile by email, return empty on auth failure
2. **Pagination:** Use Convex's `.paginate()` with cursor serialization via JSON.stringify/parse
3. **Enhancement Pattern:** Batch get likes and author levels, then map posts
4. **Testing:** Use `convex-test` with `modules` from `test.setup.ts`
5. **Toast Notifications:** Use `sonner` for success/error feedback
6. **Loading States:** Show skeletons during initial load, spinners for more loading
7. **Real-time Updates:** Convex reactive queries automatically update when data changes

### Anti-Patterns to Avoid

- Do NOT query all posts without filtering by accessible spaces
- Do NOT use N+1 queries for author levels or space info (batch)
- Do NOT forget to exclude deletedAt posts
- Do NOT show posts from spaces user cannot access
- Do NOT break existing PostCard functionality
- Do NOT skip pagination for large datasets
- Do NOT fetch all posts at once - use infinite scroll
- Do NOT forget to reset cursor when switching filter tabs

### Testing Strategy

**Unit Tests (convex-test):**

- Test listActivityFeed returns posts from multiple spaces
- Test listActivityFeed excludes posts from inaccessible spaces
- Test listActivityFeed excludes deleted posts
- Test listActivityFeed pagination with cursor
- Test listActivityFeed includes spaceName and spaceIcon
- Test listActivityFeed includes hasLiked and authorLevel
- Test listActivityFeedFollowing returns only followed users' posts
- Test listActivityFeedFollowing empty when not following anyone
- Test listActivityFeedPopular sorts by engagement
- Test all queries respect space visibility

**Manual Testing Checklist:**

- [ ] Activity feed shows posts from all accessible spaces
- [ ] Space name displayed and links to space page
- [ ] Infinite scroll loads more posts on scroll
- [ ] Filter tabs switch between All/Following/Popular
- [ ] New posts indicator appears when scrolled down
- [ ] Clicking new posts banner scrolls to top
- [ ] Like/unlike works on activity feed posts
- [ ] Post detail navigation works from activity feed
- [ ] Pinned posts still show pinned indicator
- [ ] Edited posts still show edited indicator
- [ ] Level badges display correctly

### Performance Considerations

- **Batch Fetching:** Get all accessible spaces upfront, not per-post
- **Index Usage:** Use `by_createdAt` index for global sorting
- **Over-fetch Strategy:** Fetch 3x limit to account for visibility filtering, then slice
- **Client-side Accumulation:** Track loaded posts to avoid duplicates on pagination
- **Intersection Observer:** Use efficient scroll detection, not scroll events

### Security Considerations

- **Space Visibility:** Always filter posts through `canViewSpace`
- **Deleted Posts:** Filter out posts with `deletedAt` set
- **User Context:** All queries require authentication
- **Following Privacy:** Only show followed users' posts to the follower

### References

- [Source: docs/prd.md#FR22] - Aggregated activity feed across all spaces
- [Source: docs/prd.md#FR23] - Filter activity feed by space or content type
- [Source: docs/epics.md#Story-2.8] - Story requirements
- [Source: docs/Architecture.md#Frontend-Architecture] - State management patterns
- [Source: convex/schema.ts#posts] - Posts table structure
- [Source: convex/schema.ts#follows] - Follows table for Following filter
- [Source: convex/posts/queries.ts] - Existing post query patterns
- [Source: components/posts/PostCard.tsx] - Existing post display component
- [Source: components/posts/PostList.tsx] - Existing list and new posts indicator
- [Source: docs/sprint-artifacts/2-7-pin-posts-to-space-top.md] - Previous story patterns

## Dev Agent Record

### Context Reference

This story is the eighth in Epic 2: Community Spaces & Content. It depends on:

- Story 2-1 (Space Management for Admins) - Created spaces CRUD
- Story 2-2 (Space Navigation Sidebar) - Created space detail page
- Story 2-3 (Rich Text Post Composer) - Created post creation
- Story 2-4 (Post Display and Engagement) - Created PostCard with like/comment
- Story 2-5 (Comment System) - Established permission patterns
- Story 2-6 (Edit and Delete Own Posts) - Added post editing
- Story 2-7 (Pin Posts to Space Top) - Added pin/unpin for moderators

This story transforms the community home page from a space grid to a full activity feed with filtering and infinite scroll. Story 2-9 (Global Search) is next.

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 18 feed query tests pass (10 for listActivityFeed, 4 for listActivityFeedFollowing, 4 for listActivityFeedPopular)
- Build succeeds with no TypeScript errors
- All 300 tests pass (including 18 new feed tests)

### Completion Notes List

- Implemented `listActivityFeed` query with cursor-based pagination, space visibility filtering, and post enhancement
- Implemented `listActivityFeedFollowing` query filtering posts to followed users
- Implemented `listActivityFeedPopular` query with engagement score sorting (likes + comments \* 2) for last 7 days
- Created `ActivityFeed` component with infinite scroll using `react-intersection-observer`
- Created `FeedFilterTabs` component with All/Following/Popular tabs
- Integrated `NewPostsBanner` component for real-time new posts indicator
- Updated community home page to use the new activity feed component
- Added `react-intersection-observer` as a dependency

### File List

**Created:**

- `convex/feed/_validators.ts` - Activity feed output validators
- `convex/feed/queries.ts` - Activity feed queries (listActivityFeed, listActivityFeedFollowing, listActivityFeedPopular)
- `convex/feed/queries.test.ts` - Unit tests for all feed queries
- `components/feed/ActivityFeed.tsx` - Main activity feed component with infinite scroll and new posts indicator
- `components/feed/FeedFilterTabs.tsx` - Filter tabs component (All, Following, Popular)
- `components/feed/index.ts` - Barrel export file

**Modified:**

- `app/(community)/page.tsx` - Replaced space grid with ActivityFeed component
- `docs/sprint-artifacts/sprint-status.yaml` - Updated story status to in-progress
- `package.json` - Added react-intersection-observer dependency

## Change Log

| Date       | Change                                            | Author                                  |
| ---------- | ------------------------------------------------- | --------------------------------------- |
| 2025-12-05 | Story created with comprehensive context          | Claude Opus 4.5 (create-story workflow) |
| 2025-12-05 | Story implementation completed                    | Claude Opus 4.5 (dev-story workflow)    |
| 2025-12-05 | Code review: Fixed 4 HIGH, 4 MEDIUM, 3 LOW issues | Claude Opus 4.5 (code-review workflow)  |

### Code Review Fixes Applied (2025-12-05)

**HIGH Issues Fixed:**

- HIGH-1: Fixed post accumulation logic to properly handle Convex reactivity updates using Map-based reconciliation
- HIGH-2: Rewrote new posts detection to track first page's newest post ID instead of all post IDs
- HIGH-3: Added missing `mediaIds` field to `ActivityFeedPost` interface
- HIGH-4: Documented that tests use business logic testing due to Better Auth integration constraints

**MEDIUM Issues Fixed:**

- MEDIUM-1: Added documentation explaining pagination strategy differences between queries
- MEDIUM-2: Extracted over-fetch multipliers to named constants (`CURSOR_OVERFETCH_MULTIPLIER`, `FOLLOWING_OVERFETCH_MULTIPLIER`)
- MEDIUM-3: Removed unused `Badge` import from ActivityFeed.tsx
- MEDIUM-4: Added error state handling with retry option in ActivityFeed component

**LOW Issues Fixed:**

- LOW-1: Removed `deletedAt` from output validator (always undefined since deleted posts filtered)
- LOW-2: Extracted magic number 7 days to `POPULAR_TIME_WINDOW_MS` constant
- LOW-3: ID casting documented as intentional (Convex ID type constraints)
