# Story 2.4: Post Display and Engagement Actions

Status: complete

## Story

As a **member**,
I want to view posts and engage with likes,
So that I can participate in community discussions.

## Acceptance Criteria

1. **AC1: Post Card Display** - Given I am viewing a space feed, when posts load, then each PostCard displays: Author avatar, name, level badge; Space name (if in activity feed); Timestamp (relative: "2h ago"); Post content (rich text rendered); Media (images, videos); Like count with heart icon; Comment count with comment icon; Share button.

2. **AC2: Like Toggle** - Given I click the like button, when the action completes, then like count increments immediately (optimistic); heart fills with color; like record is created; author earns 2 points (receiving likes awards author).

3. **AC3: Unlike Toggle** - Given I click like again on a post I've liked, when the action completes, then like is removed (toggle behavior); count decrements; heart unfills.

4. **AC4: Post Detail Navigation** - Given I click the post content area, when navigation occurs, then I navigate to post detail page; URL updates to `/posts/[postId]`.

5. **AC5: Real-time Updates** - Given new posts appear in real-time, when content changes, then a "New posts" banner appears at top; clicking it scrolls to and reveals new posts.

6. **AC6: Pinned Post Display** - Given a post is pinned, when viewing the feed, then pinned posts show pin icon; appear at top of feed sorted by pin date.

## Tasks / Subtasks

### Backend Implementation

- [x] **Task 1: Create Likes Module** (AC: 2, 3)
  - [x] 1.1 Create `convex/likes/mutations.ts` with `toggleLike` mutation
    - Check if user has already liked the target
    - If liked, remove like; if not liked, add like
    - Update likeCount on post/comment (increment/decrement)
    - Award 2 points to content author when liked (not on unlike)
    - Use optimistic update pattern
  - [x] 1.2 Create `convex/likes/queries.ts` with:
    - `hasUserLiked(targetType, targetId)` - returns boolean
    - `getLikeCount(targetType, targetId)` - returns number
  - [x] 1.3 Create `convex/likes/_validators.ts` with like validators
  - [x] 1.4 Write unit tests (minimum 10 tests)
    - Test like creates record correctly
    - Test unlike removes record correctly
    - Test likeCount increments on like
    - Test likeCount decrements on unlike
    - Test points awarded to author on like
    - Test points NOT awarded on unlike
    - Test duplicate like prevented
    - Test hasUserLiked returns correct boolean
    - Test likes work for both posts and comments

- [x] **Task 2: Enhance Posts Queries** (AC: 1, 6)
  - [x] 2.1 Update `convex/posts/queries.ts` `listPostsBySpace`:
    - Add user's like status for each post (hasLiked boolean)
    - Include author level badge info
    - Sort pinned posts first (by pinnedAt DESC), then by createdAt DESC
  - [x] 2.2 Create `convex/posts/queries.ts` `getPostWithDetails`:
    - Full post with author info
    - User's like status
    - Author level badge
  - [x] 2.3 Write additional unit tests for enhanced queries

### Frontend Implementation

- [x] **Task 3: Create Enhanced PostCard Component** (AC: 1, 6)
  - [x] 3.1 Update `components/posts/PostCard.tsx`:
    - Display author avatar (Avatar component from shadcn)
    - Display author name with link to profile
    - Display author level badge (LevelBadge component)
    - Display relative timestamp using date-fns `formatDistanceToNow`
    - Render post contentHtml safely
    - Show media (images via next/image, videos via VideoEmbed)
    - Show pin icon if post.pinnedAt exists
    - Add click handler on content area for navigation
  - [x] 3.2 Create `components/gamification/LevelBadge.tsx`:
    - Display level number in badge
    - Tooltip showing level name on hover
    - Color coding per level (gradient from gray to gold)

- [x] **Task 4: Implement Like Functionality** (AC: 2, 3)
  - [x] 4.1 Create `components/posts/LikeButton.tsx`:
    - Heart icon (filled when liked, outlined when not)
    - Like count display
    - Optimistic UI updates
    - Loading state during mutation
    - Animation on like (scale + color transition)
  - [x] 4.2 Integrate with PostCard:
    - Pass post.\_id and post.likeCount
    - Handle toggle mutation
    - Show success toast with "+2 pts" when liking

- [x] **Task 5: Implement Post Action Buttons** (AC: 1)
  - [x] 5.1 Create `components/posts/PostActions.tsx`:
    - LikeButton component
    - Comment count button (navigates to post detail)
    - Share button (copy link to clipboard)
  - [x] 5.2 Add click handlers:
    - Comment button opens post detail
    - Share button copies URL and shows toast

- [x] **Task 6: Create Post Detail Page** (AC: 4)
  - [x] 6.1 Create `app/(community)/posts/[postId]/page.tsx`:
    - Fetch post with getPostWithDetails
    - Display full PostCard
    - Placeholder for comments section (Story 2.5)
    - Back navigation to space
    - Meta tags for social sharing
  - [x] 6.2 Add loading and error states

- [x] **Task 7: Implement Real-time Updates** (AC: 5)
  - [x] 7.1 Create `components/posts/NewPostsBanner.tsx`:
    - "X new posts" banner at top of feed
    - Click to scroll to top and show new posts
    - Auto-dismiss after showing posts
  - [x] 7.2 Update PostList to track new posts:
    - Compare current posts with previous on update
    - Show banner when new posts detected while scrolled down
    - Use Intersection Observer to detect scroll position

- [x] **Task 8: Update Space Detail Page** (AC: 1, 5, 6)
  - [x] 8.1 Update `app/(community)/spaces/[spaceId]/page.tsx`:
    - Replace basic PostList with enhanced version
    - Add NewPostsBanner integration
    - Ensure pinned posts appear first
  - [x] 8.2 Ensure PostList receives updated props from queries

- [x] **Task 9: Integration Testing** (AC: All)
  - [x] 9.1 Write E2E tests for like functionality
  - [x] 9.2 Write E2E tests for post navigation
  - [x] 9.3 Test share functionality
  - [x] 9.4 Test post detail page with comments placeholder

## Dev Notes

### Architecture Requirements

**From ARCHITECTURE.md and Schema:**

- **Posts Schema (convex/schema.ts:77-97):**

  ```typescript
  posts: defineTable({
    spaceId: v.id("spaces"),
    authorId: v.id("users"),
    authorName: v.string(), // Denormalized
    authorAvatar: v.optional(v.string()), // Denormalized
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

- **Likes Schema (convex/schema.ts:121-129):**

  ```typescript
  likes: defineTable({
    userId: v.id("users"),
    targetType: v.union(v.literal("post"), v.literal("comment")),
    targetId: v.string(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_target", ["targetType", "targetId"])
    .index("by_userId_and_target", ["userId", "targetType", "targetId"]);
  ```

- **Authorization:** Use `requireAuth` from `convex/_lib/permissions.ts`
- **Points System:** Use `awardPoints` from `convex/_lib/points.ts`
  - Like received: 2 points to content author (per architecture)

**From UX Design Spec (ux-design-specification.md):**

- **PostCard Design:**
  - Card with subtle shadow
  - Author avatar (40px) with name and level badge
  - Relative timestamp
  - Content area with rich text
  - Action bar at bottom (like, comment, share)
- **Colors:**
  - Primary: #4A7C59
  - Primary Light: #E8F0EA (backgrounds)
  - Heart filled: red-500
  - Heart outline: muted-foreground
- **Transitions:** 150-200ms ease-out for button states
- **Hover states:** Scale 1.05 on action buttons

**From PRD (FR18):**

- FR18: Members can like posts and comments
- Like is a toggle (click again to unlike)
- Like count visible on all posts/comments

**Gamification Integration (from architecture):**

| Action        | Points | Recipient      |
| ------------- | ------ | -------------- |
| Like received | 2      | Content author |

### Technical Specifications

**toggleLike Mutation Pattern:**

```typescript
// convex/likes/mutations.ts
export const toggleLike = mutation({
  args: {
    targetType: v.union(v.literal("post"), v.literal("comment")),
    targetId: v.string(),
  },
  returns: v.object({
    liked: v.boolean(),
    newCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const authUser = await requireAuth(ctx);
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();
    if (!userProfile) throw new ConvexError("User profile not found");

    // Check for existing like
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_userId_and_target", (q) =>
        q
          .eq("userId", userProfile._id)
          .eq("targetType", args.targetType)
          .eq("targetId", args.targetId)
      )
      .unique();

    // Get the target to update count
    const targetTable = args.targetType === "post" ? "posts" : "comments";
    const targetDoc = await ctx.db.get(
      args.targetId as Id<"posts"> | Id<"comments">
    );
    if (!targetDoc) throw new ConvexError("Target not found");

    if (existingLike) {
      // Unlike: remove record, decrement count
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.targetId as Id<"posts">, {
        likeCount: Math.max(0, targetDoc.likeCount - 1),
      });
      return { liked: false, newCount: targetDoc.likeCount - 1 };
    } else {
      // Like: create record, increment count, award points
      await ctx.db.insert("likes", {
        userId: userProfile._id,
        targetType: args.targetType,
        targetId: args.targetId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.targetId as Id<"posts">, {
        likeCount: targetDoc.likeCount + 1,
      });

      // Award points to content author (2 pts for like received)
      await awardPoints(ctx, {
        userId: targetDoc.authorId,
        action: "like_received",
        points: 2,
        sourceId: args.targetId,
      });

      return { liked: true, newCount: targetDoc.likeCount + 1 };
    }
  },
});
```

**hasUserLiked Query Pattern:**

```typescript
// convex/likes/queries.ts
export const hasUserLiked = query({
  args: {
    targetType: v.union(v.literal("post"), v.literal("comment")),
    targetId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const authUser = await getAuthUser(ctx);
    if (!authUser) return false;

    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();
    if (!userProfile) return false;

    const like = await ctx.db
      .query("likes")
      .withIndex("by_userId_and_target", (q) =>
        q
          .eq("userId", userProfile._id)
          .eq("targetType", args.targetType)
          .eq("targetId", args.targetId)
      )
      .unique();

    return !!like;
  },
});
```

**LevelBadge Component Pattern:**

```typescript
// components/gamification/LevelBadge.tsx
"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LevelBadgeProps {
  level: number;
  levelName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const levelColors: Record<number, string> = {
  1: "bg-gray-400",
  2: "bg-gray-500",
  3: "bg-blue-400",
  4: "bg-blue-500",
  5: "bg-green-400",
  6: "bg-green-500",
  7: "bg-purple-400",
  8: "bg-purple-500",
  9: "bg-amber-400",
  10: "bg-amber-500",
};

export function LevelBadge({ level, levelName, size = "sm", className }: LevelBadgeProps) {
  const sizeClasses = {
    sm: "h-5 w-5 text-xs",
    md: "h-6 w-6 text-sm",
    lg: "h-8 w-8 text-base",
  };

  const badge = (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full text-white font-semibold",
        levelColors[level] || "bg-gray-400",
        sizeClasses[size],
        className
      )}
    >
      {level}
    </span>
  );

  if (levelName) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>{levelName}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
```

**LikeButton Component Pattern:**

```typescript
// components/posts/LikeButton.tsx
"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

interface LikeButtonProps {
  targetType: "post" | "comment";
  targetId: string;
  initialCount: number;
  className?: string;
}

export function LikeButton({ targetType, targetId, initialCount, className }: LikeButtonProps) {
  const toggleLike = useMutation(api.likes.mutations.toggleLike);
  const hasLiked = useQuery(api.likes.queries.hasUserLiked, {
    targetType,
    targetId,
  });

  const [isOptimisticLiked, setIsOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);

  const liked = isOptimisticLiked ?? hasLiked ?? false;
  const count = optimisticCount ?? initialCount;

  const handleToggle = async () => {
    // Optimistic update
    const newLiked = !liked;
    setIsOptimisticLiked(newLiked);
    setOptimisticCount(newLiked ? count + 1 : count - 1);

    try {
      const result = await toggleLike({ targetType, targetId });
      // Reset optimistic state after mutation completes
      setIsOptimisticLiked(null);
      setOptimisticCount(null);

      if (result.liked) {
        toast.success("+2 pts to author", { duration: 2000 });
      }
    } catch (error) {
      // Revert on error
      setIsOptimisticLiked(null);
      setOptimisticCount(null);
      toast.error("Failed to update like");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className={cn("gap-1.5 transition-all duration-150", className)}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-all duration-150",
          liked && "fill-red-500 text-red-500 scale-110"
        )}
      />
      <span className="text-sm tabular-nums">{count}</span>
    </Button>
  );
}
```

### Existing Code References

**From Story 2-3 (Rich Text Post Composer):**

- `convex/posts/mutations.ts` - createPost mutation already implemented
- `convex/posts/queries.ts` - listPostsBySpace already implemented (needs enhancement)
- `convex/_lib/points.ts` - awardPoints function exists
- `components/posts/PostCard.tsx` - Basic version exists, needs enhancement
- `components/posts/PostList.tsx` - Basic version exists, needs enhancement
- `lib/tiptap/video-extension.ts` - VideoEmbed component for video display

**Files Created in Story 2-3:**

- `convex/posts/mutations.ts`
- `convex/posts/queries.ts`
- `convex/posts/_validators.ts`
- `convex/media/mutations.ts`
- `convex/media/queries.ts`
- `lib/tiptap/extensions.ts`
- `lib/tiptap/utils.ts`
- `lib/tiptap/video-extension.ts`
- `hooks/useImageUpload.ts`
- `components/posts/PostComposer.tsx`
- `components/posts/EditorToolbar.tsx`
- `components/posts/MentionList.tsx`
- `components/posts/PostCard.tsx` (basic)
- `components/posts/PostList.tsx` (basic)
- `components/posts/VideoEmbed.tsx`

**Permissions (convex/\_lib/permissions.ts):**

- `requireAuth(ctx)` - Get authenticated user or throw
- `getAuthUser(ctx)` - Get authenticated user or null

**Points System (convex/\_lib/points.ts):**

- `awardPoints(ctx, { userId, action, points, sourceId })` - Award points

**User Query Pattern (established in Story 2-2 and 2-3):**

```typescript
const authUser = await requireAuth(ctx);
const userProfile = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
  .unique();
if (!userProfile) throw new ConvexError("User profile not found");
```

### Project Structure Notes

**Files to Create:**

```
convex/
  likes/
    mutations.ts        # toggleLike
    queries.ts          # hasUserLiked, getLikeCount
    _validators.ts      # Like input/output validators
    mutations.test.ts   # Unit tests
    queries.test.ts     # Unit tests

components/
  posts/
    LikeButton.tsx      # Like/unlike button with heart icon
    PostActions.tsx     # Action bar (like, comment, share)
    NewPostsBanner.tsx  # "X new posts" banner
  gamification/
    LevelBadge.tsx      # Level badge component

app/
  (community)/
    posts/
      [postId]/
        page.tsx        # Post detail page
```

**Files to Modify:**

- `components/posts/PostCard.tsx` - Enhance with full display, like button, author info
- `components/posts/PostList.tsx` - Add real-time new posts detection
- `convex/posts/queries.ts` - Add hasLiked to post response, author level
- `app/(community)/spaces/[spaceId]/page.tsx` - Integrate enhanced components

### Previous Story Learnings (from Story 2-3)

**From Story 2-3 (Rich Text Post Composer):**

1. **Points System:** `awardPoints` helper in `convex/_lib/points.ts` works as:

   ```typescript
   await awardPoints(ctx, {
     userId: userProfile._id,
     action: "post_created",
     points: 10,
     sourceId: postId,
   });
   ```

2. **Icon usage:** Use `lucide-react` exclusively (not @tabler/icons-react)

3. **Convex patterns:**
   - Always use typed validators for returns
   - Use `v.optional()` for optional fields
   - Index naming: `by_fieldName` or `by_field1_and_field2`

4. **PostCard exists but is basic:** Current PostCard in components/posts/PostCard.tsx needs enhancement for:
   - Author level badge
   - Like button integration
   - Pinned indicator
   - Full action bar

5. **Testing:** Use `convex-test` with `modules` from `test.setup.ts`

6. **UX colors:** Use CSS variables - #E8F0EA for backgrounds, #4A7C59 for primary

**From Git Commits (f625c1b):**

- Story 2-3 added full Tiptap integration
- Posts can be created with rich text, images, videos
- Author info is denormalized on posts
- Points awarded on post creation (10 pts)

### Anti-Patterns to Avoid

- Do NOT use `@tabler/icons-react` - use `lucide-react` for consistency with shadcn/ui
- Do NOT skip return type validators on Convex functions
- Do NOT throw on not-found for queries - return null or false
- Do NOT hardcode colors - use CSS variables from UX spec
- Do NOT award points on unlike - only on like action
- Do NOT create duplicate likes - check existing first
- Do NOT use dangerouslySetInnerHTML without proper sanitization (Tiptap HTML is safe)
- Do NOT forget to update likeCount on both like and unlike
- Do NOT block UI during like mutation - use optimistic updates

### Testing Strategy

**Unit Tests (convex-test):**

- Test `toggleLike` creates like record correctly
- Test `toggleLike` removes like record on second call
- Test `toggleLike` updates likeCount on post correctly
- Test `toggleLike` awards 2 points to author on like
- Test `toggleLike` does NOT award points on unlike
- Test `hasUserLiked` returns true when liked
- Test `hasUserLiked` returns false when not liked
- Test `hasUserLiked` returns false for unauthenticated users
- Test likes work for both posts and comments
- Test duplicate like handling (idempotent)

**E2E Tests (Playwright):**

- Test clicking like button fills heart and increments count
- Test clicking like again unfills heart and decrements count
- Test clicking post navigates to post detail page
- Test new posts banner appears when new post created
- Test pinned posts appear at top of feed
- Test share button copies link

### Performance Considerations

- **Optimistic UI:** Show like change immediately, revert on error
- **Batched queries:** Include hasLiked in listPostsBySpace to avoid N+1 queries
- **Real-time subscriptions:** Convex handles real-time automatically
- **New posts detection:** Use query comparison, not polling

### Security Considerations

- **Authentication required:** Must be logged in to like
- **Own content:** Cannot like own posts (consider implementing)
- **Rate limiting:** Consider rate limiting likes (future)
- **Duplicate prevention:** Index ensures one like per user per target

### References

- [Source: docs/prd.md#FR18] - Like posts and comments
- [Source: docs/ux-design-specification.md#PostCard] - Post card design
- [Source: docs/ux-design-specification.md#Color-System] - Color palette
- [Source: convex/schema.ts:77-97] - posts table
- [Source: convex/schema.ts:121-129] - likes table
- [Source: convex/_lib/permissions.ts] - requireAuth function
- [Source: convex/_lib/points.ts] - awardPoints function
- [Source: docs/architecture.md#Gamification] - Point values table
- [Source: docs/sprint-artifacts/2-3-rich-text-post-composer.md] - Previous story learnings
- [Source: docs/epics.md#Story-2.4] - Full story requirements

## Dev Agent Record

### Context Reference

This story is the fourth in Epic 2: Community Spaces & Content. It depends on:

- Story 2-1 (Space Management for Admins) - Created spaces CRUD
- Story 2-2 (Space Navigation Sidebar) - Created space detail page
- Story 2-3 (Rich Text Post Composer) - Created post creation and basic PostCard

This story builds upon the basic PostCard from 2-3 to add full engagement features. Story 2-5 (Comment System with Nested Replies) will add commenting functionality.

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date       | Change                                   | Author                                  |
| ---------- | ---------------------------------------- | --------------------------------------- |
| 2025-12-05 | Story created with comprehensive context | Claude Opus 4.5 (create-story workflow) |
