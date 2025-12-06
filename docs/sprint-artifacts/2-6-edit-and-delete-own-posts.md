# Story 2.6: Edit and Delete Own Posts

Status: done

## Story

As a **member**,
I want to edit or delete my own posts,
So that I can correct mistakes or remove content.

## Acceptance Criteria

1. **AC1: More Menu Display** - Given I am viewing my own post, when I click the more menu (...), then I see "Edit" and "Delete" options.

2. **AC2: Edit Mode Activation** - Given I click "Edit", when the edit mode activates, then the post content becomes editable in Tiptap; I see "Save" and "Cancel" buttons; I see a notice that "(edited)" indicator will be added.

3. **AC3: Save Edits** - Given I save edits, when the action completes, then post updates immediately; "(edited)" appears next to timestamp; edit history is not tracked (simple edit).

4. **AC4: Cancel Edit** - Given I click "Cancel" during edit, when I confirm, then changes are discarded; post returns to original content; edit mode closes.

5. **AC5: Delete Confirmation** - Given I click "Delete", when the dialog appears, then I see confirmation: "Delete this post? This cannot be undone."; I see "Delete" and "Cancel" buttons.

6. **AC6: Soft Delete** - Given I confirm delete, when the action completes, then post is soft-deleted (deletedAt set); post disappears from feed; comments are preserved but marked as orphaned.

7. **AC7: Admin Recovery** - Given an admin views moderation, when they see deleted content, then they can view and restore deleted posts if needed.

## Tasks / Subtasks

### Backend Implementation

- [x] **Task 1: Create/Update Post Mutations** (AC: 1, 2, 3, 5, 6)
  - [x] 1.1 Update `convex/posts/mutations.ts`:
    - Add/update `updatePost` mutation - edit own post content, sets editedAt
    - Add/update `deletePost` mutation - soft delete via deletedAt timestamp
    - Add `restorePost` mutation - admin-only post recovery
  - [x] 1.2 Validators in `convex/posts/_validators.ts`:
    - `updatePostInput` - postId, content (Tiptap JSON)
    - `deletePostOutput` validator
    - `deletedPostOutput` for admin moderation view
  - [x] 1.3 Write unit tests for mutations (27 tests total):
    - Test updatePost sets editedAt timestamp
    - Test updatePost only allows owner or moderator
    - Test updatePost updates content correctly
    - Test updatePost preserves other post fields
    - Test deletePost sets deletedAt timestamp
    - Test deletePost only allows owner or moderator
    - Test deletePost soft-deletes (not hard delete)
    - Test deleted post filtered from normal queries
    - Test deleted post still accessible for admin
    - Test authorization prevents editing/deleting others' posts
    - Test restorePost clears deletedAt
    - Test restorePost requires admin role

- [x] **Task 2: Update Post Queries** (AC: 6, 7)
  - [x] 2.1 Update `convex/posts/queries.ts`:
    - Filter out soft-deleted posts in `listPostsBySpace` (already done)
    - Filter out soft-deleted posts in other queries (already done)
    - Add `listDeletedPosts` for admin moderation view
  - [x] 2.2 Write unit tests for queries (18 tests total):
    - Test listPostsBySpace excludes deleted posts
    - Test listPostsByAuthor excludes deleted posts
    - Test admin can see deleted posts via listDeletedPosts
    - Test non-admin gets empty array from listDeletedPosts

### Frontend Implementation

- [x] **Task 3: Update PostCard Component** (AC: 1, 2)
  - [x] 3.1 Update `components/posts/PostCard.tsx`:
    - Add more menu (...) for post owner with `isOwn` prop
    - Show "Edit" and "Delete" options in dropdown
    - Only show menu when viewing own post
  - [x] 3.2 Use existing `DropdownMenu` from shadcn/ui
  - [x] 3.3 Add `MoreHorizontal`, `Pencil`, `Trash2` icons from lucide-react

- [x] **Task 4: Create Edit Post Dialog** (AC: 2, 3, 4)
  - [x] 4.1 Create `components/posts/EditPostDialog.tsx`:
    - Modal dialog for editing post
    - Full Tiptap editor with existing content
    - Save/Cancel buttons
    - Loading state during mutation
    - Show "(edited)" notice before saving
    - Preserve existing media and embeds
  - [x] 4.2 Integrate with PostCard via dialog trigger
  - [x] 4.3 Handle mutation on save with toast feedback

- [x] **Task 5: Create Delete Post Dialog** (AC: 5, 6)
  - [x] 5.1 Create `components/posts/DeletePostDialog.tsx`:
    - Confirmation dialog with warning message
    - "Delete this post? This cannot be undone."
    - Delete/Cancel buttons
    - Loading state during mutation
    - Destructive styling for Delete button
  - [x] 5.2 Handle post removal from feed on delete (via Convex reactivity)
  - [x] 5.3 Toast confirmation on successful delete

- [x] **Task 6: Update Post Display** (AC: 3)
  - [x] 6.1 PostCard already shows "(edited)" indicator:
    - Display when editedAt exists
    - Show next to relative timestamp
    - Style as muted/secondary text
  - [x] 6.2 Update PostList and post detail page to pass isOwn prop

- [x] **Task 7: Admin Moderation View** (AC: 7)
  - [x] 7.1 Create `app/admin/moderation/page.tsx`:
    - Show deleted posts in moderation table
    - Add restore action for deleted posts
  - [x] 7.2 Inline DeletedPostsTable in moderation page:
    - List deleted posts with author, space, date, content preview
    - Restore button per post with loading state

- [x] **Task 8: Testing** (AC: All)
  - [x] 8.1 Unit tests for mutations (27 tests)
  - [x] 8.2 Unit tests for queries (18 tests)
  - [x] 8.3 All 267 tests passing
  - [x] 8.4 Build succeeds with no TypeScript errors

## Dev Notes

### Architecture Requirements

**From ARCHITECTURE.md:**

- **Deletion Strategy:** Soft delete for user-generated content
  - `deletedAt: v.optional(v.number())` field
  - Filtered in queries, recoverable by admins
- **Posts Schema (convex/schema.ts):**
  ```typescript
  posts: defineTable({
    spaceId: v.id("spaces"),
    authorId: v.id("users"),
    authorName: v.string(), // Denormalized
    authorAvatar: v.optional(v.string()), // Denormalized
    title: v.optional(v.string()),
    content: v.any(), // Tiptap JSON
    media: v.optional(v.array(v.object({...}))),
    likeCount: v.number(),
    commentCount: v.number(),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
    pinnedAt: v.optional(v.number()),
  })
    .index("by_spaceId", ["spaceId"])
    .index("by_authorId", ["authorId"])
    .index("by_createdAt", ["createdAt"]);
  ```

**From UX Design Spec:**

- **More Menu:** Three-dot icon (MoreHorizontal) in top-right of PostCard
- **Dropdown:** Use shadcn DropdownMenu component
- **Edit Dialog:** Full-screen or modal with Tiptap editor
- **Delete Confirmation:** Alert dialog with destructive styling
- **Colors:**
  - Primary: #4A7C59
  - Destructive: red-500 (from Tailwind)
  - Border: #E5E7EB
- **Transitions:** 150-200ms ease-out

**From PRD:**

- FR15: Members can edit and delete their own posts

### Technical Specifications

**updatePost Mutation Pattern:**

```typescript
// convex/posts/mutations.ts
export const updatePost = mutation({
  args: {
    postId: v.id("posts"),
    content: v.any(), // Tiptap JSON
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const authUser = await requireAuth(ctx);
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();
    if (!userProfile) throw new ConvexError("User profile not found");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError("Post not found");
    if (post.deletedAt) throw new ConvexError("Post has been deleted");

    // Check permission (own content or moderator+)
    const canEdit = await canEditContent(
      ctx,
      userProfile._id,
      args.postId,
      "post"
    );
    if (!canEdit) throw new ConvexError("Permission denied");

    // Update post with new content and editedAt timestamp
    await ctx.db.patch(args.postId, {
      content: args.content,
      editedAt: Date.now(),
    });

    return true;
  },
});
```

**deletePost Mutation Pattern:**

```typescript
export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const authUser = await requireAuth(ctx);
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();
    if (!userProfile) throw new ConvexError("User profile not found");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError("Post not found");
    if (post.deletedAt) throw new ConvexError("Post already deleted");

    // Check permission (own content or moderator+)
    const canDelete = await canDeleteContent(
      ctx,
      userProfile._id,
      args.postId,
      "post"
    );
    if (!canDelete) throw new ConvexError("Permission denied");

    // Soft delete: set deletedAt timestamp
    await ctx.db.patch(args.postId, {
      deletedAt: Date.now(),
    });

    // NOTE: Comments are preserved - they become orphaned but visible
    // This matches the comment deletion pattern from Story 2-5

    return true;
  },
});
```

**restorePost Mutation Pattern (Admin only):**

```typescript
export const restorePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const authUser = await requireAuth(ctx);
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();
    if (!userProfile) throw new ConvexError("User profile not found");

    // Admin only
    if (userProfile.role !== "admin") {
      throw new ConvexError("Admin access required");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError("Post not found");
    if (!post.deletedAt) throw new ConvexError("Post is not deleted");

    // Clear deletedAt to restore
    await ctx.db.patch(args.postId, {
      deletedAt: undefined,
    });

    return true;
  },
});
```

**Query Filter Pattern:**

```typescript
// In listPostsBySpace - filter deleted posts
const posts = await ctx.db
  .query("posts")
  .withIndex("by_spaceId", (q) => q.eq("spaceId", args.spaceId))
  .filter((q) => q.eq(q.field("deletedAt"), undefined))
  .order("desc")
  .take(args.limit ?? 20);
```

**EditPostDialog Component Pattern:**

```typescript
// components/posts/EditPostDialog.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

interface EditPostDialogProps {
  postId: Id<"posts">;
  initialContent: any; // Tiptap JSON
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPostDialog({
  postId,
  initialContent,
  open,
  onOpenChange,
}: EditPostDialogProps) {
  const [content, setContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const updatePost = useMutation(api.posts.mutations.updatePost);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updatePost({ postId, content });
      toast.success("Post updated");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update post");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setContent(initialContent);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>
            Make changes to your post. An "(edited)" indicator will appear after saving.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <TiptapEditor content={content} onChange={setContent} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**DeletePostDialog Component Pattern:**

```typescript
// components/posts/DeletePostDialog.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

interface DeletePostDialogProps {
  postId: Id<"posts">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeletePostDialog({
  postId,
  open,
  onOpenChange,
}: DeletePostDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const deletePost = useMutation(api.posts.mutations.deletePost);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deletePost({ postId });
      toast.success("Post deleted");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this post?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone. Your post will be removed from the feed, but
            comments will be preserved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**PostCard More Menu Pattern:**

```typescript
// Inside PostCard component
{isOwn && (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">More options</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => setDeleteDialogOpen(true)}
        className="text-destructive"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)}
```

### Existing Code References

**From Story 2-3 (Rich Text Post Composer):**

- `components/posts/PostComposer.tsx` - Tiptap editor for creating posts
- `components/editor/TiptapEditor.tsx` - Rich text editor component (reuse for editing)

**From Story 2-4 (Post Display and Engagement):**

- `components/posts/PostCard.tsx` - Post display component to update
- `app/(community)/posts/[postId]/page.tsx` - Post detail page
- `convex/posts/queries.ts` - Post queries to update with filter

**From Story 2-5 (Comment System):**

- `components/comments/EditCommentDialog.tsx` - Pattern for edit dialog (similar)
- `components/comments/DeleteCommentDialog.tsx` - Pattern for delete dialog (similar)
- Soft delete pattern with `deletedAt` timestamp
- "(edited)" indicator pattern from CommentItem

**Permissions (convex/\_lib/permissions.ts):**

- `requireAuth(ctx)` - Get authenticated user or throw
- `canEditContent(ctx, userId, contentId, type)` - Check edit permission
- `canDeleteContent(ctx, userId, contentId, type)` - Check delete permission

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
components/
  posts/
    EditPostDialog.tsx      # Modal for editing post
    DeletePostDialog.tsx    # Confirmation dialog for delete

  admin/
    DeletedPostsTable.tsx   # Admin view of deleted posts
```

**Files to Modify:**

- `convex/posts/mutations.ts` - Add updatePost, deletePost, restorePost
- `convex/posts/queries.ts` - Add deletedAt filter, add listDeletedPosts
- `convex/posts/_validators.ts` - Add validators if not exists
- `components/posts/PostCard.tsx` - Add more menu, isOwn check, dialogs
- `app/(community)/posts/[postId]/page.tsx` - Add edit/delete functionality
- `app/admin/moderation/page.tsx` - Add deleted posts section

### Previous Story Learnings (from Stories 2-4 and 2-5)

1. **Soft Delete Pattern:** Use `deletedAt` timestamp, filter in queries:

   ```typescript
   .filter((q) => q.eq(q.field("deletedAt"), undefined))
   ```

2. **Icon Usage:** Use `lucide-react` exclusively:
   - `MoreHorizontal` for more menu
   - `Pencil` for edit action
   - `Trash2` for delete action

3. **Dialog Components:** Use shadcn/ui Dialog and AlertDialog

4. **Permission Check:** Use existing helpers:

   ```typescript
   const canEdit = await canEditContent(
     ctx,
     userProfile._id,
     args.postId,
     "post"
   );
   ```

5. **Toast Notifications:** Use `sonner` for success/error feedback

6. **Loading States:** Show loading in buttons during mutation

7. **(edited) Indicator:** Show when `editedAt` exists, style as muted

8. **Testing:** Use `convex-test` with `modules` from `test.setup.ts`

### Anti-Patterns to Avoid

- Do NOT hard delete posts - always soft delete with `deletedAt`
- Do NOT use `@tabler/icons-react` - use `lucide-react`
- Do NOT skip authorization checks for edit/delete
- Do NOT forget to set `editedAt` when content is updated
- Do NOT show more menu for posts you don't own
- Do NOT allow editing deleted posts
- Do NOT track edit history (keep it simple for MVP)
- Do NOT delete comments when post is deleted (preserve thread structure)
- Do NOT forget to filter deleted posts in activity feed queries

### Testing Strategy

**Unit Tests (convex-test):**

- Test `updatePost` sets editedAt timestamp
- Test `updatePost` only allows owner
- Test `updatePost` only allows moderator+ for others' posts
- Test `updatePost` fails for deleted posts
- Test `deletePost` sets deletedAt timestamp
- Test `deletePost` only allows owner
- Test `deletePost` only allows moderator+ for others' posts
- Test `restorePost` only allows admin
- Test `restorePost` clears deletedAt
- Test `listPostsBySpace` excludes deleted posts
- Test `listAllPosts` excludes deleted posts
- Test `listDeletedPosts` returns only deleted posts (admin)

**E2E Tests (Playwright):**

- Test more menu appears for own post
- Test more menu hidden for others' posts
- Test edit dialog opens with current content
- Test edit saves and shows "(edited)" indicator
- Test cancel edit discards changes
- Test delete dialog shows confirmation
- Test delete removes post from feed
- Test admin can see deleted posts
- Test admin can restore deleted post

### Performance Considerations

- **Query Optimization:** Filter deleted posts at query level, not in frontend
- **Optimistic UI:** Update UI immediately on edit/delete, revert on error
- **Index Usage:** Ensure deletedAt filtering uses appropriate indexes

### Security Considerations

- **Authentication Required:** Must be logged in to edit/delete
- **Own Content Only:** Only owner or moderator+ can edit/delete
- **Soft Delete:** Preserves content for admin recovery
- **XSS Prevention:** Sanitize content through Tiptap

### References

- [Source: docs/prd.md#FR15] - Edit and delete own posts
- [Source: docs/architecture.md#Deletion-Strategy] - Soft delete pattern
- [Source: docs/ux-design-specification.md#PostCard] - Post display
- [Source: convex/schema.ts] - posts table with editedAt, deletedAt
- [Source: convex/_lib/permissions.ts] - canEditContent, canDeleteContent
- [Source: docs/sprint-artifacts/2-5-comment-system-with-nested-replies.md] - Previous story patterns

## Dev Agent Record

### Context Reference

This story is the sixth in Epic 2: Community Spaces & Content. It depends on:

- Story 2-1 (Space Management for Admins) - Created spaces CRUD
- Story 2-2 (Space Navigation Sidebar) - Created space detail page
- Story 2-3 (Rich Text Post Composer) - Created Tiptap editor, post creation
- Story 2-4 (Post Display and Engagement) - Created PostCard, post detail page
- Story 2-5 (Comment System) - Established soft delete pattern, edit/delete dialogs

This story adds edit and delete functionality for posts. Story 2-7 (Pin Posts to Space Top) builds on this.

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### Known Limitations

### File List

**Created:**

- `components/posts/EditPostDialog.tsx` - Modal dialog for editing posts with Tiptap editor
- `components/posts/DeletePostDialog.tsx` - Confirmation dialog for soft-deleting posts
- `app/admin/moderation/page.tsx` - Admin view for managing deleted posts with restore functionality

**Modified:**

- `convex/posts/mutations.ts` - Added updatePost, deletePost, restorePost mutations
- `convex/posts/queries.ts` - Added listDeletedPosts query, verified deletedAt filtering
- `convex/posts/_validators.ts` - Added updatePostInput, deletedPostOutput validators
- `convex/posts/mutations.test.ts` - Added 27 unit tests for post mutations
- `convex/posts/queries.test.ts` - Added 18 unit tests for post queries
- `components/posts/PostCard.tsx` - Added more menu with Edit/Delete options, isOwn prop support
- `components/posts/PostList.tsx` - Added currentUser query and isOwn prop passing
- `app/(community)/posts/[postId]/page.tsx` - Added isOwn prop for post ownership detection

## Change Log

| Date       | Change                                                                                                 | Author                                  |
| ---------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| 2025-12-05 | Code review fixes: populated File List, fixed EditPostDialog content reset, fixed PostCard indentation | Claude Opus 4.5 (code-review workflow)  |
| 2025-12-05 | Story created with comprehensive context                                                               | Claude Opus 4.5 (create-story workflow) |
