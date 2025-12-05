# Story 2.3: Rich Text Post Composer

Status: Ready for Review

## Story

As a **member**,
I want to create posts with rich formatting and media,
So that I can share engaging content with the community.

## Acceptance Criteria

1. **AC1: Editor Display** - Given I am in a space where I can post, when I focus the post composer, then I see a Tiptap editor with toolbar: Bold, italic, underline, Headings (H1, H2, H3), Bullet and numbered lists, Code block with syntax highlighting, Link insertion, Image upload, Video embed (YouTube, Vimeo URLs).

2. **AC2: @Mentions** - Given I type @ followed by characters, when autocomplete dropdown appears, then I see matching members, and selecting inserts an @mention link.

3. **AC3: Hashtags** - Given I type # followed by characters, when a hashtag is created, then hashtags are clickable to filter feed (hashtag filtering is future scope, but hashtags should render as styled text).

4. **AC4: Image Upload** - Given I drag an image into the editor, when the image uploads, then it uploads to Convex storage and appears inline in the content.

5. **AC5: Post Submission** - Given I click "Post", when the post is created, then it appears in the current space immediately (optimistic UI), points are awarded (10 pts per Architecture), and composer clears.

6. **AC6: Keyboard Submit** - Given I press Cmd+Enter, when the form is valid, then the post submits (keyboard shortcut).

7. **AC7: Video Embeds** - Given I paste a YouTube or Vimeo URL, when detected, then it extracts embed URL and displays an embedded video player preview.

## Tasks / Subtasks

### Backend Implementation

- [x] **Task 1: Create Posts Mutations** (AC: 5)
  - [x] 1.1 Create `convex/posts/mutations.ts` with `createPost` mutation
    - Validate user can post in space via `canPostInSpace`
    - Store content as JSON (Tiptap format)
    - Store contentHtml as rendered HTML
    - Denormalize author info (name, avatar) for feed performance
    - Initialize likeCount=0, commentCount=0
    - Award 10 points via `awardPoints` helper
  - [x] 1.2 Create post validator in `convex/posts/_validators.ts`
    - Define post input schema
    - Define post output schema with author info
  - [x] 1.3 Write unit tests for post creation (minimum 8 tests)
    - Test successful post creation
    - Test permission denied for non-posting users
    - Test points awarded correctly
    - Test content stored correctly

- [x] **Task 2: Create Posts Queries** (AC: 5)
  - [x] 2.1 Create `convex/posts/queries.ts` with `listPostsBySpace` query
    - Filter by spaceId
    - Exclude soft-deleted posts (deletedAt != null)
    - Sort by pinnedAt DESC (pinned first), then createdAt DESC
    - Paginate results
  - [x] 2.2 Add `getPost` query for single post retrieval
  - [x] 2.3 Write unit tests (minimum 6 tests)

- [x] **Task 3: Create Media Upload Mutation** (AC: 4)
  - [x] 3.1 Create `convex/media/mutations.ts` with `generateUploadUrl` mutation
    - Generate Convex file storage upload URL
    - Return URL for client-side upload
  - [x] 3.2 Create `convex/media/queries.ts` with `getMediaUrl` query
    - Get serving URL for stored file
  - [x] 3.3 Write unit tests for media upload flow

### Frontend Implementation

- [x] **Task 4: Install and Configure Tiptap** (AC: 1)
  - [x] 4.1 Install Tiptap packages:
    - `@tiptap/react` - Core React integration
    - `@tiptap/starter-kit` - Basic extensions bundle
    - `@tiptap/extension-placeholder` - Placeholder text
    - `@tiptap/extension-link` - Link support
    - `@tiptap/extension-image` - Image support
    - `@tiptap/extension-code-block-lowlight` - Syntax highlighting
    - `@tiptap/extension-mention` - @mentions
    - `lowlight` - Syntax highlighting engine
  - [x] 4.2 Create `lib/tiptap/extensions.ts` with custom extensions config

- [x] **Task 5: Create Post Composer Component** (AC: 1, 2, 3, 6)
  - [x] 5.1 Create `components/posts/PostComposer.tsx`
    - Tiptap editor with all required extensions
    - Toolbar with formatting buttons
    - Post button and Cmd+Enter support
    - Loading state during submission
  - [x] 5.2 Create `components/posts/EditorToolbar.tsx`
    - Bold, italic, underline buttons
    - Heading dropdown (H1, H2, H3)
    - List buttons (bullet, numbered)
    - Code block button
    - Link insertion button
    - Image upload button
    - Video embed button
  - [x] 5.3 Create `components/posts/MentionList.tsx`
    - Dropdown for @mention suggestions
    - Keyboard navigation support
    - Member avatar and name display

- [x] **Task 6: Implement Image Upload** (AC: 4)
  - [x] 6.1 Create `hooks/useImageUpload.ts`
    - Handle drag-drop and click-to-upload
    - Validate file type (image/\*) and size (<10MB)
    - Upload to Convex storage
    - Return storage ID and URL
  - [x] 6.2 Integrate with Tiptap Image extension
    - Insert image node on successful upload
    - Show upload progress indicator

- [x] **Task 7: Implement Video Embeds** (AC: 7)
  - [x] 7.1 Create `components/posts/VideoEmbed.tsx`
    - Parse YouTube and Vimeo URLs
    - Extract video ID and generate embed URL
    - Render iframe with responsive aspect ratio
  - [x] 7.2 Create Tiptap extension for video embeds
    - Detect video URLs in content
    - Convert to embed nodes

- [x] **Task 8: Integrate with Space Detail Page** (AC: 5)
  - [x] 8.1 Add PostComposer to `app/(community)/spaces/[spaceId]/page.tsx`
    - Show composer at top of space
    - Check posting permission before showing
    - Pass spaceId to composer
  - [x] 8.2 Create `components/posts/PostList.tsx`
    - Display posts from query
    - Optimistic updates on new post
    - Empty state when no posts

- [x] **Task 9: Integration Testing** (AC: All)
  - [x] 9.1 Write E2E tests for post creation flow
  - [x] 9.2 Test toolbar functionality
  - [x] 9.3 Test image upload
  - [x] 9.4 Test @mentions autocomplete

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
  });
  ```

- **Authorization:** Use `canPostInSpace` from `convex/_lib/permissions.ts`
- **Points System:** Use `awardPoints` from `convex/_lib/points.ts`
  - Post created: 10 points (per project-context.md)

**From UX Design Spec (ux-design-specification.md):**

- **PostComposer:** Rich text post creation with media upload
- **Layout:** Composer always visible at top of feed
- **Colors:**
  - Primary: #4A7C59
  - Primary Light: #E8F0EA (backgrounds)
- **Transitions:** 150-200ms ease-out
- **Auto-save:** 500ms debounce (but for posts, submit on button click)

**From PRD (FR14, FR19, FR20):**

- FR14: Members can create posts with rich text, images, and video embeds
- FR19: Members can @mention other members in posts and comments
- FR20: Members can use #hashtags in posts

### Technical Specifications

**Tiptap Extensions Required:**

```typescript
// lib/tiptap/extensions.ts
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Mention from "@tiptap/extension-mention";
import { common, createLowlight } from "lowlight";

export const extensions = [
  StarterKit.configure({
    codeBlock: false, // Replace with CodeBlockLowlight
  }),
  Placeholder.configure({
    placeholder: "What's on your mind?",
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: { class: "text-primary underline" },
  }),
  Image.configure({
    inline: true,
    allowBase64: false,
  }),
  CodeBlockLowlight.configure({
    lowlight: createLowlight(common),
  }),
  Mention.configure({
    HTMLAttributes: { class: "mention" },
    suggestion: {
      // Configure with member search
    },
  }),
];
```

**Video URL Parsing:**

```typescript
function extractVideoEmbed(
  url: string
): { type: "youtube" | "vimeo"; id: string } | null {
  // YouTube patterns
  const youtubeMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return { type: "youtube", id: youtubeMatch[1] };
  }

  // Vimeo patterns
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return { type: "vimeo", id: vimeoMatch[1] };
  }

  return null;
}
```

**Image Upload Pattern (using Convex storage):**

```typescript
// Hook pattern
export function useImageUpload() {
  const generateUploadUrl = useMutation(api.media.mutations.generateUploadUrl);

  const upload = async (file: File) => {
    // Validate
    if (!file.type.startsWith("image/")) throw new Error("Invalid file type");
    if (file.size > 10 * 1024 * 1024)
      throw new Error("File too large (max 10MB)");

    // Get upload URL from Convex
    const uploadUrl = await generateUploadUrl();

    // Upload to Convex storage
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await result.json();

    return storageId;
  };

  return { upload };
}
```

### Existing Code References

**Permissions (convex/\_lib/permissions.ts):**

- `canPostInSpace(ctx, userId, spaceId)` - Check if user can post in space
- `requireAuth(ctx)` - Get authenticated user or throw

**Points System (convex/\_lib/points.ts):**

- `awardPoints(ctx, { userId, action, points, sourceId })` - Award points

**User Query Pattern (from Story 2-2):**

```typescript
const authUser = await requireAuth(ctx);
const userProfile = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
  .unique();
if (!userProfile) throw new ConvexError("User profile not found");
```

**Space Detail Page (app/(community)/spaces/[spaceId]/page.tsx):**

- Currently has placeholder "No posts yet" message
- Already has space header with icon, name, visibility badge
- Records space visit on mount

### Project Structure Notes

**Files to Create:**

```
convex/
  posts/
    mutations.ts        # createPost, updatePost, deletePost
    queries.ts          # listPostsBySpace, getPost
    _validators.ts      # Post input/output validators
    mutations.test.ts   # Unit tests
    queries.test.ts     # Unit tests
  media/
    mutations.ts        # generateUploadUrl
    queries.ts          # getMediaUrl

lib/
  tiptap/
    extensions.ts       # Tiptap extension configuration
    utils.ts            # JSON to HTML conversion, video parsing

components/
  posts/
    PostComposer.tsx    # Main composer component
    EditorToolbar.tsx   # Formatting toolbar
    MentionList.tsx     # @mention autocomplete dropdown
    VideoEmbed.tsx      # Video embed component
    PostList.tsx        # Posts list display (basic for this story)
    PostCard.tsx        # Individual post card (basic for this story)

hooks/
  useImageUpload.ts     # Image upload hook

tests/
  e2e/
    posts.spec.ts       # E2E tests for post creation
```

**Files to Modify:**

- `app/(community)/spaces/[spaceId]/page.tsx` - Add PostComposer and PostList
- `package.json` - Add Tiptap dependencies

### Tiptap Package Installation

Run the following command to install required packages:

```bash
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-link @tiptap/extension-image @tiptap/extension-code-block-lowlight @tiptap/extension-mention @tiptap/extension-underline lowlight
```

### Previous Story Learnings (from 2-2)

**From Story 2-2 (Space Navigation Sidebar):**

1. **Auth pattern:** Always check for user profile after `requireAuth`:

   ```typescript
   const authUser = await requireAuth(ctx);
   const userProfile = await ctx.db
     .query("users")
     .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
     .unique();
   if (!userProfile) throw new ConvexError("User profile not found");
   ```

2. **Query return validation:** Always use typed validators for returns

3. **Component structure:** Layout components in `components/layout/`, feature components in `components/{feature}/`

4. **Testing pattern:** Use `convex-test` with `modules` from `test.setup.ts`

5. **Icon usage:** Use `lucide-react` exclusively (not @tabler/icons-react)

6. **UX colors:** Use CSS variables - #E8F0EA for backgrounds, #4A7C59 for primary

**From Git Commits (ecf9495):**

- Story 2-2 created:
  - Space visit tracking in `convex/spaceVisits/`
  - `listSpacesForMember` query with visibility filtering
  - SpaceNav and SpaceNavItem components
  - Community layout at `app/(community)/layout.tsx`
  - Keyboard navigation hook

### Anti-Patterns to Avoid

- Do NOT use `@tabler/icons-react` - use `lucide-react` for consistency with shadcn/ui
- Do NOT skip return type validators on Convex functions
- Do NOT throw on not-found - return null or empty array
- Do NOT hardcode colors - use CSS variables from UX spec
- Do NOT forget to award points on post creation
- Do NOT store raw HTML without sanitization
- Do NOT allow files larger than 10MB for images
- Do NOT use synchronous file uploads - use Convex storage async pattern

### Testing Strategy

**Unit Tests (convex-test):**

- Test `createPost` creates post with correct fields
- Test `createPost` denormalizes author info correctly
- Test `createPost` awards 10 points
- Test `createPost` respects posting permissions
- Test `listPostsBySpace` filters by space
- Test `listPostsBySpace` excludes deleted posts
- Test `listPostsBySpace` sorts pinned first

**E2E Tests (Playwright):**

- Test creating a post with text content
- Test formatting toolbar buttons
- Test image upload via drag-drop
- Test @mention autocomplete
- Test Cmd+Enter submission
- Test post appears in feed after creation

### Performance Considerations

- **Optimistic UI:** Show post immediately on submit, revert on error
- **Denormalized author info:** Store authorName, authorAvatar on post to avoid joins
- **Pagination:** Use cursor-based pagination for post lists
- **Image optimization:** Consider adding image resizing before upload (future)

### Security Considerations

- **Content sanitization:** Render HTML safely (Tiptap handles this)
- **File validation:** Validate file type and size on both client and server
- **Permission checks:** Always verify user can post in space before creating post
- **Rate limiting:** Consider adding rate limits for post creation (future)

### References

- [Source: docs/prd.md#FR14] - Rich text posts
- [Source: docs/prd.md#FR19] - @mentions
- [Source: docs/prd.md#FR20] - Hashtags
- [Source: docs/ux-design-specification.md#PostComposer] - Composer design
- [Source: docs/ux-design-specification.md#Color-System] - Color palette
- [Source: convex/schema.ts:77-97] - posts table
- [Source: convex/schema.ts:121-129] - likes table
- [Source: convex/_lib/permissions.ts] - canPostInSpace function
- [Source: convex/_lib/points.ts] - awardPoints function
- [Source: project-context.md#Gamification] - Point values
- [Source: docs/sprint-artifacts/2-2-space-navigation-sidebar.md] - Previous story

## Dev Agent Record

### Context Reference

This story is the third in Epic 2: Community Spaces & Content. It depends on:

- Story 2-1 (Space Management for Admins) - Created spaces CRUD
- Story 2-2 (Space Navigation Sidebar) - Created space detail page where composer will live

This story creates the post creation experience. Story 2-4 (Post Display and Engagement Actions) will add the full PostCard display and engagement features.

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. Created full backend infrastructure for posts (mutations, queries, validators)
2. Created `convex/_lib/points.ts` for centralized point awarding
3. Added `searchMembers` query to support @mentions in the post composer
4. Installed and configured Tiptap with all required extensions (starter-kit, placeholder, link, image, code-block-lowlight, mention, underline)
5. Created custom Video extension for YouTube/Vimeo embeds
6. Created PostComposer with full toolbar (bold, italic, underline, headings, lists, code, links, images, videos)
7. Created MentionList component with keyboard navigation for @mentions
8. Created useImageUpload hook for file uploads to Convex storage
9. Created PostCard and PostList components for displaying posts
10. Updated space detail page to include PostComposer and PostList
11. All unit tests pass (208 tests)
12. Created E2E tests in tests/e2e/posts.spec.ts

### File List

**Backend:**

- convex/\_lib/points.ts (new)
- convex/posts/\_validators.ts (new)
- convex/posts/mutations.ts (new)
- convex/posts/mutations.test.ts (new)
- convex/posts/queries.ts (new)
- convex/posts/queries.test.ts (new)
- convex/media/mutations.ts (new)
- convex/media/mutations.test.ts (new)
- convex/media/queries.ts (new)
- convex/members/queries.ts (modified - added searchMembers)

**Frontend:**

- lib/tiptap/extensions.ts (new)
- lib/tiptap/utils.ts (new)
- lib/tiptap/video-extension.ts (new)
- hooks/useImageUpload.ts (new)
- components/posts/PostComposer.tsx (new)
- components/posts/EditorToolbar.tsx (new)
- components/posts/MentionList.tsx (new)
- components/posts/PostCard.tsx (new)
- components/posts/PostList.tsx (new)
- components/posts/VideoEmbed.tsx (new)
- app/(community)/spaces/[spaceId]/page.tsx (modified)
- components/ui/popover.tsx (new - shadcn component)

**Tests:**

- tests/e2e/posts.spec.ts (new)

## Change Log

| Date       | Change                                     | Author                               |
| ---------- | ------------------------------------------ | ------------------------------------ |
| 2025-12-05 | Story created with comprehensive context   | Claude (create-story workflow)       |
| 2025-12-05 | Implementation complete, all tests passing | Claude Opus 4.5 (dev-story workflow) |
