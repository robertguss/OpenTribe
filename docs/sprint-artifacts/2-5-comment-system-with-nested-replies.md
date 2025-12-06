# Story 2.5: Comment System with Nested Replies

Status: done

## Story

As a **member**,
I want to comment on posts and reply to comments,
So that I can participate in discussions.

## Acceptance Criteria

1. **AC1: Comment Section Display** - Given I am viewing a post, when I click "Comment" or the comment count, then the comment section expands; I see existing comments sorted by newest first; I see a comment input field.

2. **AC2: Submit Comment** - Given I submit a comment, when the action completes, then comment appears immediately (optimistic UI); comment count updates; I earn 5 points; post author receives notification.

3. **AC3: Reply to Comment** - Given I click "Reply" on a comment, when a nested input appears, then reply input shows below that comment; reply is indented when posted.

4. **AC4: Nested Display** - Given viewing nested comments, when comments have replies, then replies are nested up to 2 levels (per PRD FR17); deeper replies are flattened to level 2.

5. **AC5: Own Comment Actions** - Given I own a comment, when I view it, then I see edit and delete options in a dropdown menu.

6. **AC6: Delete Comment** - Given I delete my comment, when the action completes, then content is replaced with "[deleted]"; comment structure preserved for context.

7. **AC7: Like Comments** - Given I can like comments, when I click like on a comment, then like count increments; author earns 2 points.

## Tasks / Subtasks

### Backend Implementation

- [x] **Task 1: Create Comments Module** (AC: 1, 2, 3, 4, 6)
  - [x] 1.1 Create `convex/comments/_validators.ts` with validators:
    - `createCommentInput` - postId, content, optional parentId
    - `createCommentOutput` - returns comment ID
    - `updateCommentInput` - commentId, content
    - `deleteCommentOutput` - returns success boolean
    - `commentOutput` - full comment shape
    - `nestedCommentOutput` - comment with replies array
  - [x] 1.2 Create `convex/comments/mutations.ts`:
    - `createComment` - create comment or reply with denormalized author info
    - `updateComment` - edit own comment, sets editedAt
    - `deleteComment` - soft delete, replace content with "[deleted]"
  - [x] 1.3 Create `convex/comments/queries.ts`:
    - `listCommentsByPost` - get comments with 2-level nesting
    - `getComment` - single comment by ID
  - [x] 1.4 Write unit tests (minimum 12 tests):
    - Test createComment creates record correctly
    - Test createComment awards 5 points to commenter
    - Test createComment creates notification for post author
    - Test reply creates with correct parentId
    - Test updateComment sets editedAt timestamp
    - Test deleteComment soft-deletes (sets deletedAt)
    - Test deleteComment replaces content with "[deleted]"
    - Test listCommentsByPost returns nested structure
    - Test nesting limited to 2 levels (deeper flattened)
    - Test own comment check works correctly
    - Test authorization prevents editing others' comments
    - Test deleted comments show in thread but marked

- [x] **Task 2: Create Notification for Comments** (AC: 2)
  - [x] 2.1 Update notification system to create comment notifications:
    - Notify post author when comment added
    - Notify parent comment author when reply added
  - [ ] 2.2 Notify @mentioned users in comment (future enhancement)
  - [x] 2.3 Test notification creation in comment mutations

- [x] **Task 3: Integrate with Posts** (AC: 1)
  - [x] 3.1 Update `convex/posts/mutations.ts`:
    - Increment commentCount when comment created
    - Decrement commentCount when comment deleted (not soft-delete display)
  - [x] 3.2 Test commentCount updates correctly

### Frontend Implementation

- [x] **Task 4: Create Comment Components** (AC: 1, 3, 4, 5)
  - [x] 4.1 Create `components/comments/CommentList.tsx`:
    - Render nested comment structure
    - Handle 2-level nesting with visual indentation
    - Show "[deleted]" for soft-deleted comments
    - Sort by newest first
  - [x] 4.2 Create `components/comments/CommentItem.tsx`:
    - Display author avatar, name, level badge
    - Display relative timestamp (date-fns formatDistanceToNow)
    - Display comment content
    - Show "Reply" button
    - Show like button with count
    - Show dropdown menu for own comments (edit, delete)
    - Show "(edited)" indicator if editedAt exists
  - [x] 4.3 Create `components/comments/CommentInput.tsx`:
    - Simple textarea for comment entry
    - Character limit indicator (500 chars per UX spec)
    - Submit button with loading state
    - Cancel button for replies
    - Keyboard submit (Cmd+Enter)

- [x] **Task 5: Implement Comment Actions** (AC: 2, 5, 6, 7)
  - [x] 5.1 Implement comment actions in `CommentItem.tsx` (lines 101-149):
    - Like button (reuses LikeButton from Story 2-4)
    - Reply button (triggers nested input)
    - More menu for owner actions (edit, delete)
    - Note: Actions integrated directly into CommentItem for simpler component tree
  - [x] 5.2 Create `components/comments/EditCommentDialog.tsx`:
    - Modal dialog for editing comment
    - Textarea with current content
    - Save/Cancel buttons
    - Loading state during mutation
  - [x] 5.3 Create `components/comments/DeleteCommentDialog.tsx`:
    - Confirmation dialog
    - Clear warning message
    - Delete/Cancel buttons

- [x] **Task 6: Update Post Detail Page** (AC: 1)
  - [x] 6.1 Update `app/(community)/posts/[postId]/page.tsx`:
    - Add CommentSection below post content
    - Show comment count
    - Load comments on mount (or expand)
  - [x] 6.2 Create `components/comments/CommentSection.tsx`:
    - Container for CommentInput + CommentList
    - Handles expand/collapse state
    - Shows loading skeleton while fetching

- [x] **Task 7: Update PostCard Comment Button** (AC: 1)
  - [x] 7.1 Update PostCard comment button:
    - Navigate to post detail page with comments expanded
    - Show comment count

- [x] **Task 8: Integration Testing** (AC: All)
  - [x] 8.1 Write E2E tests for comment flow
  - [x] 8.2 Test nested reply functionality
  - [x] 8.3 Test edit and delete flows
  - [x] 8.4 Test like functionality on comments

## Dev Notes

### Architecture Requirements

**From ARCHITECTURE.md and Schema:**

- **Comments Schema (convex/schema.ts:102-116):**

  ```typescript
  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    authorName: v.string(), // Denormalized
    authorAvatar: v.optional(v.string()), // Denormalized
    parentId: v.optional(v.id("comments")), // For nesting
    content: v.string(),
    likeCount: v.number(),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_postId", ["postId"])
    .index("by_authorId", ["authorId"])
    .index("by_parentId", ["parentId"]);
  ```

- **Nesting Limit:** PRD FR17 specifies nested 2 levels maximum
- **Authorization:** Use `requireAuth` from `convex/_lib/permissions.ts`
- **Points System:** Use `awardPoints` from `convex/_lib/points.ts`
  - Comment added: 5 points to commenter
  - Comment liked: 2 points to comment author (via existing likes module)

**From UX Design Spec (ux-design-specification.md):**

- **Comment Display:**
  - Author avatar (32px for comments)
  - Author name with level badge (use LevelBadge component)
  - Relative timestamp
  - Content area
  - Action buttons (like, reply)
- **Nesting Visual:**
  - Replies indented (16px per level)
  - Max 2 levels of visual indentation
  - Deeper replies shown at level 2 with "@parent" mention
- **Colors:**
  - Primary: #4A7C59
  - Primary Light: #E8F0EA (reply backgrounds)
  - Border: #E5E7EB
- **Transitions:** 150-200ms ease-out

**From PRD:**

- FR16: Members can comment on posts
- FR17: Members can reply to comments (nested 2 levels)
- FR18: Members can like posts and comments

### Technical Specifications

**createComment Mutation Pattern:**

```typescript
// convex/comments/mutations.ts
export const createComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  returns: v.id("comments"),
  handler: async (ctx, args) => {
    const authUser = await requireAuth(ctx);
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();
    if (!userProfile) throw new ConvexError("User profile not found");

    // Validate post exists and not deleted
    const post = await ctx.db.get(args.postId);
    if (!post || post.deletedAt) throw new ConvexError("Post not found");

    // If replying, validate parent exists and belongs to same post
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent || parent.deletedAt)
        throw new ConvexError("Parent comment not found");
      if (parent.postId !== args.postId)
        throw new ConvexError("Invalid parent comment");

      // Enforce 2-level nesting: if parent has a parent, flatten to level 2
      // by using parent's parentId or parent itself as the new parentId
      if (parent.parentId) {
        // Reply to a reply -> attach to the first-level parent instead
        args = { ...args, parentId: parent.parentId };
      }
    }

    // Get avatar URL if user has one
    let avatarUrl: string | undefined;
    if (userProfile.avatarStorageId) {
      avatarUrl =
        (await ctx.storage.getUrl(userProfile.avatarStorageId)) ?? undefined;
    }

    // Create comment with denormalized author info
    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      authorId: userProfile._id,
      authorName: userProfile.name || authUser.email.split("@")[0],
      authorAvatar: avatarUrl,
      parentId: args.parentId,
      content: args.content,
      likeCount: 0,
      createdAt: Date.now(),
    });

    // Update post comment count
    await ctx.db.patch(args.postId, {
      commentCount: post.commentCount + 1,
    });

    // Award 5 points for commenting
    await awardPoints(ctx, {
      userId: userProfile._id,
      action: "comment_added",
      points: 5,
      sourceType: "comment",
      sourceId: commentId,
    });

    // Create notification for post author (if not self)
    if (post.authorId !== userProfile._id) {
      await ctx.db.insert("notifications", {
        userId: post.authorId,
        type: "comment",
        actorId: userProfile._id,
        actorName: userProfile.name || authUser.email.split("@")[0],
        actorAvatar: avatarUrl,
        data: {
          postId: args.postId,
          commentId,
          preview: args.content.slice(0, 100),
        },
        read: false,
        createdAt: Date.now(),
      });
    }

    // If this is a reply, notify parent comment author (if not self)
    if (args.parentId) {
      const parentComment = await ctx.db.get(args.parentId);
      if (parentComment && parentComment.authorId !== userProfile._id) {
        await ctx.db.insert("notifications", {
          userId: parentComment.authorId,
          type: "reply",
          actorId: userProfile._id,
          actorName: userProfile.name || authUser.email.split("@")[0],
          actorAvatar: avatarUrl,
          data: {
            postId: args.postId,
            commentId,
            parentCommentId: args.parentId,
            preview: args.content.slice(0, 100),
          },
          read: false,
          createdAt: Date.now(),
        });
      }
    }

    return commentId;
  },
});
```

**listCommentsByPost Query Pattern:**

```typescript
// convex/comments/queries.ts
export const listCommentsByPost = query({
  args: {
    postId: v.id("posts"),
  },
  returns: v.array(nestedCommentOutput),
  handler: async (ctx, args) => {
    const authUser = await requireAuth(ctx);
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    // Get all comments for this post
    const allComments = await ctx.db
      .query("comments")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .collect();

    // Get user's likes for these comments
    const userLikes = userProfile
      ? await ctx.db
          .query("likes")
          .withIndex("by_userId", (q) => q.eq("userId", userProfile._id))
          .filter((q) => q.eq(q.field("targetType"), "comment"))
          .collect()
      : [];
    const likedCommentIds = new Set(userLikes.map((l) => l.targetId));

    // Get author levels
    const authorIds = [...new Set(allComments.map((c) => c.authorId))];
    const authorLevels: Record<string, number> = {};
    for (const authorId of authorIds) {
      const author = await ctx.db.get(authorId);
      authorLevels[authorId] = author?.level ?? 1;
    }

    // Build nested structure (2 levels max)
    // Level 0: comments without parentId
    // Level 1: comments with parentId pointing to level 0

    const topLevelComments = allComments
      .filter((c) => !c.parentId)
      .map((c) => ({
        ...c,
        // Replace content with "[deleted]" if soft-deleted
        content: c.deletedAt ? "[deleted]" : c.content,
        hasLiked: likedCommentIds.has(c._id as string),
        authorLevel: authorLevels[c.authorId] ?? 1,
        isOwn: userProfile?._id === c.authorId,
        replies: allComments
          .filter((r) => r.parentId === c._id)
          .map((r) => ({
            ...r,
            content: r.deletedAt ? "[deleted]" : r.content,
            hasLiked: likedCommentIds.has(r._id as string),
            authorLevel: authorLevels[r.authorId] ?? 1,
            isOwn: userProfile?._id === r.authorId,
            replies: [], // Level 2 has no further nesting
          }))
          .sort((a, b) => a.createdAt - b.createdAt), // Oldest first for replies
      }))
      .sort((a, b) => b.createdAt - a.createdAt); // Newest first for top-level

    return topLevelComments;
  },
});
```

**deleteComment Mutation Pattern:**

```typescript
export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const authUser = await requireAuth(ctx);
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();
    if (!userProfile) throw new ConvexError("User profile not found");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new ConvexError("Comment not found");
    if (comment.deletedAt) throw new ConvexError("Comment already deleted");

    // Check permission (own content or moderator+)
    const canDelete = await canDeleteContent(
      ctx,
      userProfile._id,
      args.commentId,
      "comment"
    );
    if (!canDelete) throw new ConvexError("Permission denied");

    // Soft delete: set deletedAt, preserve structure
    // Content will be replaced with "[deleted]" on query
    await ctx.db.patch(args.commentId, {
      deletedAt: Date.now(),
    });

    // Do NOT decrement post commentCount - deleted comments still show in thread
    // This preserves context for replies

    return true;
  },
});
```

**CommentItem Component Pattern:**

```typescript
// components/comments/CommentItem.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { LikeButton } from "@/components/posts/LikeButton";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

interface CommentItemProps {
  comment: {
    _id: Id<"comments">;
    authorId: Id<"users">;
    authorName: string;
    authorAvatar?: string;
    authorLevel: number;
    content: string;
    likeCount: number;
    hasLiked: boolean;
    isOwn: boolean;
    createdAt: number;
    editedAt?: number;
    deletedAt?: number;
  };
  depth?: number;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CommentItem({
  comment,
  depth = 0,
  onReply,
  onEdit,
  onDelete,
}: CommentItemProps) {
  const isDeleted = !!comment.deletedAt;
  const initials = comment.authorName.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        "flex gap-3",
        depth > 0 && "ml-8 border-l-2 border-border pl-4"
      )}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{comment.authorName}</span>
          <LevelBadge level={comment.authorLevel} size="sm" />
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
          </span>
          {comment.editedAt && !isDeleted && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>

        <p className={cn(
          "text-sm mt-1",
          isDeleted && "text-muted-foreground italic"
        )}>
          {comment.content}
        </p>

        {!isDeleted && (
          <div className="flex items-center gap-2 mt-2">
            <LikeButton
              targetType="comment"
              targetId={comment._id}
              initialCount={comment.likeCount}
            />
            {depth < 1 && onReply && (
              <Button variant="ghost" size="sm" onClick={onReply}>
                <MessageSquare className="h-4 w-4 mr-1" />
                Reply
              </Button>
            )}
            {comment.isOwn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Existing Code References

**From Story 2-4 (Post Display and Engagement):**

- `convex/likes/mutations.ts` - toggleLike already supports comments
- `convex/likes/queries.ts` - hasUserLiked supports comment targetType
- `components/posts/LikeButton.tsx` - Reusable, works with comments
- `components/gamification/LevelBadge.tsx` - Reusable for comment authors
- `components/posts/PostCard.tsx` - Has comment count display

**Files Created in Story 2-4:**

- `convex/likes/mutations.ts` - toggleLike (post + comment)
- `convex/likes/queries.ts` - hasUserLiked
- `convex/likes/_validators.ts` - like validators
- `components/posts/LikeButton.tsx`
- `components/posts/PostActions.tsx`
- `components/posts/NewPostsBanner.tsx`
- `components/gamification/LevelBadge.tsx`
- `app/(community)/posts/[postId]/page.tsx`

**Permissions (convex/\_lib/permissions.ts):**

- `requireAuth(ctx)` - Get authenticated user or throw
- `getAuthUser(ctx)` - Get authenticated user or null
- `canEditContent(ctx, userId, contentId, type)` - Check edit permission
- `canDeleteContent(ctx, userId, contentId, type)` - Check delete permission

**Points System (convex/\_lib/points.ts):**

- `awardPoints(ctx, { userId, action, points, sourceType, sourceId })` - Award points

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

**Files to Create:**

```
convex/
  comments/
    mutations.ts        # createComment, updateComment, deleteComment
    queries.ts          # listCommentsByPost, getComment
    _validators.ts      # Comment input/output validators
    mutations.test.ts   # Unit tests for mutations
    queries.test.ts     # Unit tests for queries

components/
  comments/
    CommentSection.tsx  # Container for comments on post
    CommentList.tsx     # Renders nested comment structure
    CommentItem.tsx     # Single comment display + actions (like, reply, owner menu)
    CommentInput.tsx    # Comment creation textarea
    EditCommentDialog.tsx   # Edit modal
    DeleteCommentDialog.tsx # Confirmation modal
    index.ts            # Barrel export

tests/
  e2e/
    comments.spec.ts    # E2E tests for comment flows
```

**Files to Modify:**

- `app/(community)/posts/[postId]/page.tsx` - Add CommentSection
- `convex/posts/mutations.ts` - Add helper for commentCount updates (if needed)

### Previous Story Learnings (from Story 2-4)

1. **Points System:** Use `awardPoints` helper consistently:

   ```typescript
   await awardPoints(ctx, {
     userId: userProfile._id,
     action: "comment_added",
     points: 5,
     sourceType: "comment",
     sourceId: commentId,
   });
   ```

2. **Icon Usage:** Use `lucide-react` exclusively (not @tabler/icons-react)

3. **Optimistic UI:** Show changes immediately, revert on error:

   ```typescript
   const [optimisticComments, setOptimisticComments] = useState<Comment[]>([]);
   ```

4. **Convex Patterns:**
   - Always use typed validators for returns
   - Use `v.optional()` for optional fields
   - Index naming: `by_fieldName` or `by_field1_and_field2`

5. **LikeButton Reuse:** The existing LikeButton works for comments:

   ```typescript
   <LikeButton targetType="comment" targetId={comment._id} initialCount={comment.likeCount} />
   ```

6. **Testing:** Use `convex-test` with `modules` from `test.setup.ts`

7. **UX Colors:** Use CSS variables - #E8F0EA for backgrounds, #4A7C59 for primary

**From Git Commits (62b14eb):**

- Story 2-4 implemented like system supporting both posts AND comments
- LikeButton component is generic and reusable
- toggleLike mutation handles comment targetType

### Anti-Patterns to Avoid

- Do NOT use `@tabler/icons-react` - use `lucide-react`
- Do NOT skip return type validators on Convex functions
- Do NOT throw on not-found for queries - return null or empty array
- Do NOT hardcode colors - use CSS variables
- Do NOT allow nesting beyond 2 levels - flatten deeper replies
- Do NOT hard delete comments - soft delete preserves thread structure
- Do NOT decrement commentCount on soft delete - deleted comments still show
- Do NOT forget to create notifications for post author and parent comment author
- Do NOT award points for deleting comments
- Do NOT allow editing/deleting others' comments (unless moderator+)

### Testing Strategy

**Unit Tests (convex-test):**

- Test `createComment` creates record with correct fields
- Test `createComment` awards 5 points to commenter
- Test `createComment` creates notification for post author
- Test `createComment` with parentId creates reply
- Test reply notification sent to parent comment author
- Test 2-level nesting enforcement (3rd level flattens)
- Test `updateComment` sets editedAt timestamp
- Test `updateComment` only allows owner or moderator
- Test `deleteComment` sets deletedAt (soft delete)
- Test `deleteComment` only allows owner or moderator
- Test `listCommentsByPost` returns nested structure
- Test `listCommentsByPost` includes hasLiked and authorLevel
- Test `listCommentsByPost` shows "[deleted]" for soft-deleted

**E2E Tests (Playwright):**

- Test submitting a comment shows it immediately
- Test points toast appears after commenting
- Test clicking reply shows nested input
- Test nested comments are visually indented
- Test edit dialog opens and saves changes
- Test delete confirmation and soft delete
- Test like button works on comments
- Test notification appears for post author

### Performance Considerations

- **Batch author lookups:** Get all author levels in single loop
- **Batch like checks:** Query all user likes once, not per comment
- **Optimistic UI:** Show comment immediately, sync in background
- **Pagination:** For posts with many comments, consider pagination

### Security Considerations

- **Authentication required:** Must be logged in to comment
- **Own content only:** Only owner or moderator+ can edit/delete
- **XSS prevention:** Sanitize comment content on display
- **Rate limiting:** Consider limiting comment frequency (future)

### References

- [Source: docs/prd.md#FR16] - Comment on posts
- [Source: docs/prd.md#FR17] - Reply to comments (nested 2 levels)
- [Source: docs/prd.md#FR18] - Like posts and comments
- [Source: docs/ux-design-specification.md#Comments] - Comment display
- [Source: convex/schema.ts:102-116] - comments table
- [Source: convex/schema.ts:121-129] - likes table (supports comments)
- [Source: convex/_lib/permissions.ts] - canEditContent, canDeleteContent
- [Source: convex/_lib/points.ts] - awardPoints function
- [Source: docs/architecture.md#Gamification] - Point values table
- [Source: docs/sprint-artifacts/2-4-post-display-and-engagement-actions.md] - Previous story
- [Source: docs/epics.md#Story-2.5] - Full story requirements

## Dev Agent Record

### Context Reference

This story is the fifth in Epic 2: Community Spaces & Content. It depends on:

- Story 2-1 (Space Management for Admins) - Created spaces CRUD
- Story 2-2 (Space Navigation Sidebar) - Created space detail page
- Story 2-3 (Rich Text Post Composer) - Created post creation
- Story 2-4 (Post Display and Engagement) - Created like system, post detail page

This story implements the comment system. Story 2-6 (Edit and Delete Own Posts) builds on this foundation.

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

No blocking issues encountered during implementation.

### Completion Notes List

- Implemented complete comment system with 2-level nested replies per PRD FR17
- Created 19 unit tests for comment mutations covering all business logic
- Created 11 unit tests for comment queries covering nested structure, sorting, deletion
- Created E2E tests in `tests/e2e/comments.spec.ts` for all ACs
- All 257 tests pass (including existing regression tests)
- Build completes successfully
- Integrated notifications for post author and parent comment author on replies
- Reused existing LikeButton and LevelBadge components from Story 2-4
- Comment input supports 500 character limit with visual indicator
- Keyboard shortcut (Cmd+Enter) for quick submission
- Soft delete preserves thread structure showing "[deleted]" for removed comments

### Known Limitations

- **AC2 Optimistic UI (partial):** Comment submission shows loading state and toast on success, but does not implement true optimistic UI pattern (adding comment to list before mutation resolves). The LikeButton does have full optimistic UI.
- **@mentions:** Not implemented in this story - marked as future enhancement (Task 2.2)

### File List

**New Files Created:**

- `convex/comments/_validators.ts` - Comment input/output validators
- `convex/comments/mutations.ts` - createComment, updateComment, deleteComment
- `convex/comments/queries.ts` - listCommentsByPost, getComment
- `convex/comments/mutations.test.ts` - 19 unit tests for mutations
- `convex/comments/queries.test.ts` - 11 unit tests for queries
- `components/comments/CommentSection.tsx` - Container with expand/collapse
- `components/comments/CommentList.tsx` - Nested comment renderer
- `components/comments/CommentItem.tsx` - Single comment with actions (includes like, reply, owner menu)
- `components/comments/CommentInput.tsx` - Textarea with char limit
- `components/comments/EditCommentDialog.tsx` - Edit modal
- `components/comments/DeleteCommentDialog.tsx` - Delete confirmation
- `components/comments/index.ts` - Barrel export
- `tests/e2e/comments.spec.ts` - E2E tests for comment flows

**Modified Files:**

- `app/(community)/posts/[postId]/page.tsx` - Added CommentSection
- `docs/sprint-artifacts/sprint-status.yaml` - Updated story status

**Architecture Notes:**

- `CommentActions.tsx` was not created as a separate file; the action functionality (like, reply, owner menu) is integrated directly into `CommentItem.tsx` for a simpler component architecture. This deviates from the original spec but reduces component nesting.

## Change Log

| Date       | Change                                                                                                                                                                                                      | Author                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 2025-12-05 | Story created with comprehensive context                                                                                                                                                                    | Claude Opus 4.5 (create-story workflow) |
| 2025-12-05 | Implementation complete - all tasks done                                                                                                                                                                    | Claude Opus 4.5 (dev-story workflow)    |
| 2025-12-05 | Code review fixes: added queries.test.ts, comments.spec.ts E2E tests, fixed @mention task status, updated file list, documented architecture deviation (CommentActions.tsx integrated into CommentItem.tsx) | Claude Opus 4.5 (code-review workflow)  |
