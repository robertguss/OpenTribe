# Tech-Spec: Epic 2 - Community Spaces & Content

**Created:** 2025-12-05
**Status:** Ready for Development
**Epic:** 2 of 8
**Stories:** 2.1 - 2.9 (9 stories)
**PRD Coverage:** FR11-FR24

---

## Overview

### Problem Statement

OpenTribe needs the core community experience that makes it valuable. Epic 1 established the foundation (schema, auth, profiles), but members still cannot:

1. Navigate organized discussion spaces
2. Create and share rich content (posts)
3. Engage with content (likes, comments)
4. Discover activity across the community
5. Search for content, members, and spaces

Without these capabilities, the platform is just an authentication system with no community value.

### Solution

Build the complete community content layer:

- Admin space management with drag-drop reordering
- Three-column layout with persistent sidebar navigation
- Tiptap-based rich text post composer with @mentions and #hashtags
- Post feed with real-time updates, likes, and nested comments
- Activity feed aggregating content from all accessible spaces
- Global search via command palette (Cmd+K)

### Scope

**In Scope:**

- Space CRUD for admins (create, edit, delete, reorder)
- Space sidebar navigation with unread indicators
- Rich text post composer (Tiptap with formatting, images, video embeds)
- @mentions with autocomplete and #hashtags
- Post display with author info, timestamps, media
- Like toggle for posts and comments
- Nested comment system (2 levels max)
- Edit and delete own posts/comments
- Pinned posts (admin/moderator)
- Activity feed with filtering (All, Following, Popular)
- Global search across posts, members, spaces, courses, events

**Out of Scope:**

- Course and event content (Epic 3, 4)
- Payment-gated spaces (Epic 5)
- Gamification points for actions (Epic 6 - but hooks will be placed)
- Notifications for mentions/comments (Epic 7 - but triggers will be placed)

---

## Context for Development

### Technology Stack

| Layer       | Technology               | Version      |
| ----------- | ------------------------ | ------------ |
| Frontend    | Next.js + React          | 16 + 19      |
| Backend     | Convex                   | Latest       |
| Auth        | Better Auth              | Latest       |
| Styling     | Tailwind CSS + shadcn/ui | 4 + NY style |
| Rich Text   | Tiptap                   | Latest       |
| Forms       | React Hook Form + Zod    | Latest       |
| Drag & Drop | @dnd-kit                 | Latest       |
| Icons       | Tabler Icons             | Latest       |

### Codebase Patterns (Established in Epic 1)

**Convex Function Organization:**

```
convex/
├── schema.ts              # Single schema file (COMPLETE)
├── auth.ts                # Better Auth integration (COMPLETE)
├── http.ts                # HTTP routes (COMPLETE)
├── _lib/                  # Shared utilities
│   ├── permissions.ts     # Authorization helpers (COMPLETE)
│   └── rateLimits.ts      # Rate limiting (COMPLETE)
├── members/               # User profiles (COMPLETE)
│   ├── queries.ts
│   └── mutations.ts
├── notifications/         # Notification system (COMPLETE)
│   ├── actions.ts
│   └── mutations.ts
├── spaces/                # NEW - Epic 2
│   ├── queries.ts
│   └── mutations.ts
├── posts/                 # NEW - Epic 2
│   ├── queries.ts
│   └── mutations.ts
├── comments/              # NEW - Epic 2
│   ├── queries.ts
│   └── mutations.ts
├── likes/                 # NEW - Epic 2
│   ├── queries.ts
│   └── mutations.ts
└── search/                # NEW - Epic 2
    └── queries.ts
```

**Function Naming Conventions:**

- Queries: `get*`, `list*`, `search*`, `count*`
- Mutations: `create*`, `update*`, `delete*`, `set*`, `toggle*`

**Authorization Pattern (from `convex/_lib/permissions.ts`):**

```typescript
import {
  requireAuth,
  requireAdmin,
  canViewSpace,
  canPostInSpace,
} from "../_lib/permissions";

export const createPost = mutation({
  args: { spaceId: v.id("spaces"), content: v.string() },
  handler: async (ctx, args) => {
    const authUser = await requireAuth(ctx);

    // Get user profile
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email))
      .unique();
    if (!user) throw new ConvexError("User profile not found");

    // Check space permissions
    if (!(await canPostInSpace(ctx, user._id, args.spaceId))) {
      throw new ConvexError("Cannot post in this space");
    }

    // Proceed with creation...
  },
});
```

**Error Pattern:**

- Return `null` for not-found (client handles display)
- Throw `ConvexError` for auth/permission errors
- Use descriptive error messages

**Frontend Component Pattern:**

```typescript
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function SpaceList() {
  const spaces = useQuery(api.spaces.queries.listSpaces);

  if (spaces === undefined) return <Skeleton />;
  if (spaces.length === 0) return <EmptyState />;

  return <div>{spaces.map(s => <SpaceCard key={s._id} space={s} />)}</div>;
}
```

### Files to Reference

**Existing Files (Built in Epic 1):**

- `convex/schema.ts` - Complete schema with spaces, posts, comments, likes tables
- `convex/_lib/permissions.ts` - `canViewSpace`, `canPostInSpace`, `canEditContent`, `canDeleteContent`
- `convex/_lib/rateLimits.ts` - Rate limiting utilities
- `convex/members/queries.ts` - User profile queries
- `convex/members/mutations.ts` - User profile mutations
- `app/(community)/settings/layout.tsx` - Settings layout pattern
- `components/ui/sidebar.tsx` - shadcn/ui sidebar component

**Architecture Reference:**

- `docs/architecture.md` - Full architecture decisions
- `docs/prd.md` - Product requirements FR11-FR24
- `docs/ux-design-specification.md` - Three-column layout, PostCard, command palette specs
- `docs/epics.md` - Story details for 2.1-2.9

### Schema Reference (Already Defined)

The following tables are already in `convex/schema.ts`:

```typescript
// Spaces
spaces: defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  icon: v.optional(v.string()),
  visibility: v.union(v.literal("public"), v.literal("members"), v.literal("paid")),
  postPermission: v.union(v.literal("all"), v.literal("moderators"), v.literal("admin")),
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
  parentId: v.optional(v.id("comments")),
  content: v.string(),
  likeCount: v.number(),
  createdAt: v.number(),
  editedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
})
  .index("by_postId", ["postId"])
  .index("by_authorId", ["authorId"])
  .index("by_parentId", ["parentId"]),

// Likes
likes: defineTable({
  userId: v.id("users"),
  targetType: v.union(v.literal("post"), v.literal("comment")),
  targetId: v.string(),
  createdAt: v.number(),
})
  .index("by_userId", ["userId"])
  .index("by_target", ["targetType", "targetId"])
  .index("by_userId_and_target", ["userId", "targetType", "targetId"]),

// Space visits (for unread indicators)
spaceVisits: defineTable({
  userId: v.id("users"),
  spaceId: v.id("spaces"),
  lastVisitedAt: v.number(),
})
  .index("by_userId", ["userId"])
  .index("by_userId_and_spaceId", ["userId", "spaceId"]),
```

### Technical Decisions (Pre-Made)

| Decision              | Choice                              | Rationale                                  |
| --------------------- | ----------------------------------- | ------------------------------------------ |
| Rich text editor      | Tiptap                              | Headless, customizable, good React support |
| Content storage       | JSON (Tiptap) + HTML                | JSON for editing, HTML for fast display    |
| @mention autocomplete | Tiptap mention extension            | Built-in, good UX                          |
| Drag & drop           | @dnd-kit                            | Accessible, works with React 19            |
| Comment nesting       | 2 levels max (parentId)             | Per PRD, keeps UI clean                    |
| Like uniqueness       | userId + targetType + targetId      | Prevents duplicate likes                   |
| Soft delete           | deletedAt timestamp                 | Preserves content for moderation           |
| Denormalized author   | authorName, authorAvatar on posts   | Avoids joins in feed queries               |
| Unread indicators     | spaceVisits table                   | Tracks last visit per user per space       |
| Pinned posts          | pinnedAt timestamp, max 3 per space | Pinned sort first, then by createdAt       |

---

## Implementation Plan

### Story 2.1: Space Management for Admins

**Objective:** Admins can create, edit, delete, and reorder discussion spaces.

**Tasks:**

- [ ] Create `convex/spaces/queries.ts` with:
  - `listSpaces` - all spaces ordered by `order` field, filter deleted
  - `getSpace` - single space by ID
  - `listSpacesForAdmin` - includes deleted for recovery
- [ ] Create `convex/spaces/mutations.ts` with:
  - `createSpace` - requires admin, sets order to max+1
  - `updateSpace` - requires admin, updates fields
  - `deleteSpace` - soft delete, requires admin
  - `reorderSpaces` - batch update order field
- [ ] Create `app/admin/spaces/page.tsx` - space management list
- [ ] Create `components/spaces/CreateSpaceDialog.tsx` - modal form
- [ ] Create `components/spaces/SpaceListItem.tsx` - draggable row
- [ ] Implement drag-drop reorder with @dnd-kit
- [ ] Add success/error toasts

**Convex Functions:**

```typescript
// convex/spaces/queries.ts
export const listSpaces = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("spaces"),
      name: v.string(),
      description: v.optional(v.string()),
      icon: v.optional(v.string()),
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
      order: v.number(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db
      .query("spaces")
      .withIndex("by_order")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
  },
});

// convex/spaces/mutations.ts
export const createSpace = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
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
  },
  returns: v.id("spaces"),
  handler: async (ctx, args) => {
    const authUser = await requireAuth(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email))
      .unique();
    if (!user) throw new ConvexError("User not found");

    await requireAdmin(ctx, user._id);

    // Get max order
    const lastSpace = await ctx.db
      .query("spaces")
      .withIndex("by_order")
      .order("desc")
      .first();
    const order = (lastSpace?.order ?? 0) + 1;

    return await ctx.db.insert("spaces", {
      ...args,
      order,
      createdAt: Date.now(),
    });
  },
});
```

**Acceptance Criteria:**

- [ ] Admin can create spaces with name, description, icon, visibility, post permission
- [ ] Spaces appear in sidebar ordered by `order` field
- [ ] Admin can drag to reorder spaces
- [ ] Admin can edit space settings
- [ ] Admin can soft-delete spaces (confirmation required)
- [ ] Non-admins see 403 error on admin pages

---

### Story 2.2: Space Navigation Sidebar

**Objective:** Members can see and navigate between spaces in a persistent sidebar.

**Tasks:**

- [ ] Create `app/(community)/layout.tsx` - community shell with sidebar
- [ ] Create `components/layout/AppSidebar.tsx` - main navigation sidebar
- [ ] Create `components/layout/SpaceNavItem.tsx` - single space in nav
- [ ] Implement visibility filtering (only show accessible spaces)
- [ ] Create `convex/spaces/queries.ts` `listAccessibleSpaces` - filtered by user access
- [ ] Implement unread indicators using `spaceVisits` table
- [ ] Create `convex/spaces/mutations.ts` `recordSpaceVisit` - update lastVisitedAt
- [ ] Add keyboard shortcuts (G+S opens spaces, J/K navigation)

**Frontend Implementation:**

```typescript
// components/layout/AppSidebar.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const spaces = useQuery(api.spaces.queries.listAccessibleSpaces);
  const pathname = usePathname();

  if (spaces === undefined) return <SidebarSkeleton />;

  return (
    <aside className="w-60 border-r bg-muted/40 p-4">
      <nav className="space-y-1">
        {spaces.map((space) => (
          <Link
            key={space._id}
            href={`/spaces/${space._id}`}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
              pathname === `/spaces/${space._id}`
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <span>{space.icon || "💬"}</span>
            <span className="flex-1 truncate">{space.name}</span>
            {space.hasUnread && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

**Acceptance Criteria:**

- [ ] Sidebar shows all spaces user can access
- [ ] Active space highlighted with green background
- [ ] Unread indicator (dot) shows when new posts exist since last visit
- [ ] Clicking space navigates and updates URL
- [ ] Mobile: sidebar collapses to bottom nav or hamburger

---

### Story 2.3: Rich Text Post Composer

**Objective:** Members can create posts with rich formatting, images, and video embeds.

**Tasks:**

- [ ] Install Tiptap: `pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-mention @tiptap/extension-image @tiptap/extension-youtube`
- [ ] Create `components/editor/TiptapEditor.tsx` - reusable editor component
- [ ] Create `components/editor/EditorToolbar.tsx` - formatting toolbar
- [ ] Create `components/editor/MentionList.tsx` - @mention autocomplete dropdown
- [ ] Create `components/feed/PostComposer.tsx` - full composer with submit
- [ ] Create `convex/posts/mutations.ts` `createPost` - creates post with content
- [ ] Create `convex/members/queries.ts` `searchMembers` - for @mention autocomplete
- [ ] Implement image upload to Convex storage
- [ ] Implement YouTube/Vimeo URL parsing and embed

**Tiptap Configuration:**

```typescript
// components/editor/TiptapEditor.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";

interface TiptapEditorProps {
  content: string;
  onChange: (json: string, html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder || "Write something..." }),
      Mention.configure({
        HTMLAttributes: { class: "mention" },
        suggestion: mentionSuggestion,
      }),
      Image.configure({ inline: true }),
      Youtube.configure({ width: 640, height: 360 }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()), editor.getHTML());
    },
  });

  return (
    <div className="border rounded-md">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="prose max-w-none p-4" />
    </div>
  );
}
```

**Acceptance Criteria:**

- [ ] Editor supports bold, italic, underline, headings, lists, code blocks
- [ ] Typing @ shows member autocomplete dropdown
- [ ] Selecting member inserts @mention link
- [ ] Typing # creates hashtag (clickable for filtering)
- [ ] Images can be uploaded via button or drag-drop
- [ ] YouTube/Vimeo URLs auto-embed as video players
- [ ] Cmd+Enter submits post
- [ ] Post appears in feed immediately (optimistic UI)

---

### Story 2.4: Post Display and Engagement Actions

**Objective:** Members can view posts and engage with likes.

**Tasks:**

- [ ] Create `convex/posts/queries.ts` with:
  - `listPostsBySpace` - paginated posts for a space
  - `getPost` - single post with details
- [ ] Create `convex/likes/mutations.ts` `toggleLike` - add/remove like
- [ ] Create `convex/likes/queries.ts` `hasUserLiked` - check if user liked
- [ ] Create `components/feed/PostCard.tsx` - post display component
- [ ] Create `components/feed/SpaceFeed.tsx` - feed container
- [ ] Create `app/(community)/spaces/[spaceId]/page.tsx` - space feed page
- [ ] Implement real-time updates with Convex subscriptions
- [ ] Show "New posts" banner when new content arrives

**PostCard Component:**

```typescript
// components/feed/PostCard.tsx
"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { IconHeart, IconMessageCircle, IconShare } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: {
    _id: Id<"posts">;
    authorName: string;
    authorAvatar?: string;
    contentHtml: string;
    likeCount: number;
    commentCount: number;
    createdAt: number;
    pinnedAt?: number;
  };
}

export function PostCard({ post }: PostCardProps) {
  const toggleLike = useMutation(api.likes.mutations.toggleLike);
  const hasLiked = useQuery(api.likes.queries.hasUserLiked, {
    targetType: "post",
    targetId: post._id,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <Avatar>
          <AvatarImage src={post.authorAvatar} />
          <AvatarFallback>{post.authorName[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{post.authorName}</p>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(post.createdAt, { addSuffix: true })}
          </p>
        </div>
        {post.pinnedAt && <Badge variant="secondary">Pinned</Badge>}
      </CardHeader>
      <CardContent>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </CardContent>
      <CardFooter className="gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleLike({ targetType: "post", targetId: post._id })}
        >
          <IconHeart className={hasLiked ? "fill-red-500 text-red-500" : ""} />
          <span>{post.likeCount}</span>
        </Button>
        <Button variant="ghost" size="sm">
          <IconMessageCircle />
          <span>{post.commentCount}</span>
        </Button>
        <Button variant="ghost" size="sm">
          <IconShare />
        </Button>
      </CardFooter>
    </Card>
  );
}
```

**Acceptance Criteria:**

- [ ] Posts display author avatar, name, timestamp, content, media
- [ ] Like button toggles (fill/unfill), count updates immediately
- [ ] Comment count shown, clicking opens comments
- [ ] New posts appear in real-time without refresh
- [ ] "New posts" banner shows when scrolled down and new content arrives
- [ ] Pinned posts show pin icon and appear first

---

### Story 2.5: Comment System with Nested Replies

**Objective:** Members can comment on posts and reply to comments (2 levels).

**Tasks:**

- [ ] Create `convex/comments/queries.ts` with:
  - `listCommentsByPost` - comments with nested replies
- [ ] Create `convex/comments/mutations.ts` with:
  - `createComment` - add comment (top-level or reply)
  - `updateComment` - edit own comment
  - `deleteComment` - soft delete
- [ ] Create `components/feed/CommentList.tsx` - comment thread display
- [ ] Create `components/feed/CommentItem.tsx` - single comment with actions
- [ ] Create `components/feed/CommentInput.tsx` - comment form
- [ ] Create `app/(community)/posts/[postId]/page.tsx` - post detail with comments
- [ ] Implement comment nesting (max 2 levels - parentId)
- [ ] Add notification trigger for comment author (placeholder for Epic 7)

**Comment Query with Nesting:**

```typescript
// convex/comments/queries.ts
export const listCommentsByPost = query({
  args: { postId: v.id("posts") },
  returns: v.array(
    v.object({
      _id: v.id("comments"),
      authorId: v.id("users"),
      authorName: v.string(),
      authorAvatar: v.optional(v.string()),
      content: v.string(),
      likeCount: v.number(),
      createdAt: v.number(),
      editedAt: v.optional(v.number()),
      replies: v.array(
        v.object({
          _id: v.id("comments"),
          authorId: v.id("users"),
          authorName: v.string(),
          authorAvatar: v.optional(v.string()),
          content: v.string(),
          likeCount: v.number(),
          createdAt: v.number(),
          editedAt: v.optional(v.number()),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    // Get top-level comments
    const topLevel = await ctx.db
      .query("comments")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .filter((q) =>
        q.and(
          q.eq(q.field("parentId"), undefined),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .collect();

    // Get replies for each
    const withReplies = await Promise.all(
      topLevel.map(async (comment) => {
        const replies = await ctx.db
          .query("comments")
          .withIndex("by_parentId", (q) => q.eq("parentId", comment._id))
          .filter((q) => q.eq(q.field("deletedAt"), undefined))
          .collect();
        return { ...comment, replies };
      })
    );

    return withReplies;
  },
});
```

**Acceptance Criteria:**

- [ ] Comment input visible below post
- [ ] Submitting comment adds it to the list immediately
- [ ] "Reply" button on comments shows nested input
- [ ] Replies indented under parent (max 2 levels)
- [ ] Deeper replies flatten to level 2
- [ ] Edit/delete options in dropdown for own comments
- [ ] Deleted comments show "[deleted]" but preserve structure

---

### Story 2.6: Edit and Delete Own Posts

**Objective:** Members can edit or delete their own posts.

**Tasks:**

- [ ] Create `convex/posts/mutations.ts` `updatePost` - edit content
- [ ] Create `convex/posts/mutations.ts` `deletePost` - soft delete
- [ ] Add dropdown menu to PostCard with Edit/Delete options
- [ ] Create inline edit mode with TiptapEditor
- [ ] Show "(edited)" indicator on edited posts
- [ ] Confirmation dialog for delete
- [ ] Check ownership via `canEditContent` from permissions

**Acceptance Criteria:**

- [ ] Three-dot menu on own posts shows Edit and Delete
- [ ] Edit opens inline editor with current content
- [ ] Save/Cancel buttons during edit mode
- [ ] "(edited)" shows next to timestamp after edit
- [ ] Delete shows confirmation dialog
- [ ] Deleted posts disappear from feed (soft delete)
- [ ] Moderators can edit/delete any content

---

### Story 2.7: Pin Posts to Space Top

**Objective:** Admins and moderators can pin important posts to the top.

**Tasks:**

- [ ] Create `convex/posts/mutations.ts` `pinPost` - set pinnedAt
- [ ] Create `convex/posts/mutations.ts` `unpinPost` - clear pinnedAt
- [ ] Add "Pin to top" / "Unpin" option in post dropdown (mods+)
- [ ] Update `listPostsBySpace` to sort pinned first
- [ ] Show pin icon on pinned posts
- [ ] Limit to 3 pinned posts per space

**Acceptance Criteria:**

- [ ] Mods/admins see "Pin to top" in post menu
- [ ] Pinned posts appear at top of feed
- [ ] Pin icon visible on pinned posts
- [ ] "Unpin" option on pinned posts
- [ ] Max 3 pinned posts per space
- [ ] Pinned posts sorted by pin date (newest pin first)

---

### Story 2.8: Activity Feed Aggregation

**Objective:** Members can see a unified activity feed across all spaces.

**Tasks:**

- [ ] Create `app/(community)/page.tsx` - home page with activity feed
- [ ] Create `convex/posts/queries.ts` `listActivityFeed` - cross-space feed
- [ ] Implement visibility filtering (only accessible spaces)
- [ ] Add filter tabs: All, Following, Popular
- [ ] Show space name as link on each post
- [ ] Implement infinite scroll pagination
- [ ] Create "New posts" indicator for real-time updates

**Activity Feed Query:**

```typescript
// convex/posts/queries.ts
export const listActivityFeed = query({
  args: {
    filter: v.optional(
      v.union(v.literal("all"), v.literal("following"), v.literal("popular"))
    ),
    cursor: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const authUser = await getAuthUser(ctx);
    const limit = args.limit ?? 20;

    // Get user profile for permission checks
    let userId: Id<"users"> | null = null;
    if (authUser) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", authUser.email))
        .unique();
      userId = user?._id ?? null;
    }

    // Get accessible spaces
    const allSpaces = await ctx.db
      .query("spaces")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    const accessibleSpaceIds = await Promise.all(
      allSpaces.map(async (space) => {
        if (await canViewSpace(ctx, userId, space._id)) {
          return space._id;
        }
        return null;
      })
    ).then((ids) => ids.filter((id): id is Id<"spaces"> => id !== null));

    // Query posts from accessible spaces
    let posts = await ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .take(limit * 2); // Over-fetch to filter

    // Filter to accessible spaces
    posts = posts.filter((p) => accessibleSpaceIds.includes(p.spaceId));

    // Apply additional filters
    if (args.filter === "following" && userId) {
      const following = await ctx.db
        .query("follows")
        .withIndex("by_followerId", (q) => q.eq("followerId", userId))
        .collect();
      const followingIds = new Set(following.map((f) => f.followingId));
      posts = posts.filter((p) => followingIds.has(p.authorId));
    }

    if (args.filter === "popular") {
      posts = posts.sort(
        (a, b) => b.likeCount + b.commentCount - (a.likeCount + a.commentCount)
      );
    }

    return posts.slice(0, limit);
  },
});
```

**Acceptance Criteria:**

- [ ] Home page shows activity feed from all accessible spaces
- [ ] Space name shown as link on each post
- [ ] Filter tabs: All (default), Following, Popular
- [ ] Infinite scroll loads more posts
- [ ] "New posts" banner when new content arrives
- [ ] Clicking space name navigates to that space

---

### Story 2.9: Global Search

**Objective:** Members can search across all community content via command palette.

**Tasks:**

- [ ] Install cmdk: `pnpm add cmdk`
- [ ] Create `components/layout/CommandPalette.tsx` - global search UI
- [ ] Create `convex/search/queries.ts` `globalSearch` - multi-table search
- [ ] Add keyboard shortcut Cmd+K to open palette
- [ ] Search across: posts, members, spaces, courses (future), events (future)
- [ ] Show categorized results with icons
- [ ] Navigate to result on selection
- [ ] Store recent searches locally

**Command Palette Implementation:**

```typescript
// components/layout/CommandPalette.tsx
"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const router = useRouter();

  const results = useQuery(
    api.search.queries.globalSearch,
    debouncedSearch.length > 1 ? { query: debouncedSearch } : "skip"
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input
        value={search}
        onValueChange={setSearch}
        placeholder="Search posts, members, spaces..."
      />
      <Command.List>
        {results?.posts.length > 0 && (
          <Command.Group heading="Posts">
            {results.posts.map((post) => (
              <Command.Item
                key={post._id}
                onSelect={() => {
                  router.push(`/posts/${post._id}`);
                  setOpen(false);
                }}
              >
                {post.title || post.contentPreview}
              </Command.Item>
            ))}
          </Command.Group>
        )}
        {results?.members.length > 0 && (
          <Command.Group heading="Members">
            {results.members.map((member) => (
              <Command.Item
                key={member._id}
                onSelect={() => {
                  router.push(`/members/${member._id}`);
                  setOpen(false);
                }}
              >
                {member.name}
              </Command.Item>
            ))}
          </Command.Group>
        )}
        {results?.spaces.length > 0 && (
          <Command.Group heading="Spaces">
            {results.spaces.map((space) => (
              <Command.Item
                key={space._id}
                onSelect={() => {
                  router.push(`/spaces/${space._id}`);
                  setOpen(false);
                }}
              >
                {space.icon} {space.name}
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  );
}
```

**Acceptance Criteria:**

- [ ] Cmd+K opens command palette
- [ ] Search input with real-time results (debounced 300ms)
- [ ] Results grouped by type: Posts, Members, Spaces
- [ ] Arrow keys navigate, Enter selects
- [ ] Escape closes palette
- [ ] "No results for [query]" when empty
- [ ] Recent searches shown initially

---

## Additional Context

### Dependencies

**NPM Packages to Install:**

```bash
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-mention @tiptap/extension-image @tiptap/extension-youtube
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
pnpm add cmdk
pnpm add date-fns
```

**shadcn/ui Components to Add (if not already installed):**

```bash
npx shadcn@latest add command
npx shadcn@latest add dialog
npx shadcn@latest add popover
```

### Testing Strategy

**Unit Tests:**

- Space CRUD operations (`convex/spaces/queries.test.ts`, `mutations.test.ts`)
- Post CRUD operations (`convex/posts/queries.test.ts`, `mutations.test.ts`)
- Comment operations (`convex/comments/queries.test.ts`, `mutations.test.ts`)
- Like toggle (`convex/likes/mutations.test.ts`)
- Permission checks for all operations

**Integration Tests:**

- Space visibility filtering (public/members/paid)
- Post creation in space with permission checks
- Comment thread with replies
- Activity feed aggregation

**E2E Tests:**

- Admin creates space, posts in it
- Member sees space, creates post, comments
- Like toggle works correctly
- Search finds posts and members

### Notes

**Story Execution Order:**

1. Story 2.1 (Space Management) - MUST be first, creates spaces
2. Story 2.2 (Space Sidebar) - Depends on 2.1 for spaces
3. Story 2.3 (Post Composer) - Needs space to post in
4. Story 2.4 (Post Display) - Shows posts from 2.3
5. Story 2.5 (Comments) - Needs posts from 2.4
6. Story 2.6 (Edit/Delete) - Modifies posts from 2.4
7. Story 2.7 (Pin Posts) - Needs posts from 2.4
8. Story 2.8 (Activity Feed) - Aggregates from all spaces
9. Story 2.9 (Search) - Searches all content

**Gamification Hooks (For Epic 6):**

Add placeholder comments for point awards:

```typescript
// In createPost mutation:
// TODO: Award points - await awardPoints(ctx, userId, "post_created", 10);

// In createComment mutation:
// TODO: Award points - await awardPoints(ctx, userId, "comment_added", 5);

// In toggleLike mutation (when liking):
// TODO: Award points to content author - await awardPoints(ctx, contentAuthorId, "like_received", 2);
```

**Notification Hooks (For Epic 7):**

Add placeholder comments for notifications:

```typescript
// In createComment mutation:
// TODO: Notify post author - await createNotification(ctx, { userId: postAuthorId, type: "comment", ... });

// In createComment mutation (for replies):
// TODO: Notify parent comment author - await createNotification(ctx, { userId: parentAuthorId, type: "reply", ... });

// When @mentioned:
// TODO: Notify mentioned user - await createNotification(ctx, { userId: mentionedUserId, type: "mention", ... });
```

**After Epic 2:**

- Update sprint status: `epic-2: contexted`
- Run `dev-story` for Story 2.1 first
- After all 9 stories done: `epic-2-retrospective: completed`

---

_Generated by create-tech-spec workflow | 2025-12-05_
