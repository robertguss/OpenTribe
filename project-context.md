# OpenTribe - Project Context for AI Agents

> **Purpose:** This file provides critical context for AI agents implementing OpenTribe.
> Read this BEFORE writing any code. Follow these rules EXACTLY.

## Tech Stack (Do Not Deviate)

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend:** Convex (real-time database + serverless functions)
- **Auth:** Better Auth with Convex integration
- **UI Components:** shadcn/ui (New York style)
- **Payments:** Stripe via Convex component
- **Email:** Resend via Convex component
- **Presence:** @convex-dev/presence
- **Utilities:** convex-helpers (rate limiting, relationships, RLS, Zod)

## Critical Convex Rules

### Schema Conventions
```typescript
// Tables: camelCase, plural
defineTable({
  authorId: v.id("users"),      // ✅ References use v.id()
  createdAt: v.number(),        // ✅ Dates as timestamps (Date.now())
  spaceId: v.id("spaces"),      // ✅ camelCase field names
}).index("by_spaceId", ["spaceId"])
  .index("by_authorId_and_createdAt", ["authorId", "createdAt"])

// ❌ NEVER: author_id, created_at, snake_case anything
// ❌ NEVER: v.string() for IDs - always v.id("tableName")
// ❌ NEVER: ISO date strings - always Date.now() timestamps
```

### Function Naming
```typescript
// Queries: get* (single), list* (multiple), search*, count*
export const getPost = query({ ... })
export const listPosts = query({ ... })
export const searchMembers = query({ ... })

// Mutations: create*, update*, delete*, set*, toggle*
export const createPost = mutation({ ... })
export const toggleLike = mutation({ ... })

// ❌ NEVER: fetchPosts, getAllPosts, getPosts (for multiple)
```

### Function Structure (ALWAYS include validators)
```typescript
export const createPost = mutation({
  args: {
    spaceId: v.id("spaces"),
    content: v.string(),
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Unauthorized");
    
    // Implementation...
  }
});
```

### Error Handling
```typescript
// ✅ Use ConvexError for user-facing errors
throw new ConvexError("You don't have permission to post here");

// ❌ NEVER: throw new Error() for user-facing messages
```

### Not Found Pattern
```typescript
// ✅ Return null, let client handle
export const getPost = query({
  returns: v.union(postValidator, v.null()),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    return post; // null if not found
  }
});

// ❌ NEVER: throw on not found
```

## File Organization

### Convex Backend
```
convex/
├── schema.ts                 # ALL tables in single file
├── _lib/                     # Internal utilities (underscore = internal)
│   ├── auth.ts              # getAuthUser, requireAuth
│   ├── permissions.ts       # canPostInSpace, canModerate
│   └── points.ts            # awardPoints (ALWAYS use this for gamification)
├── {domain}/
│   ├── queries.ts
│   ├── queries.test.ts      # Co-located tests
│   ├── mutations.ts
│   └── mutations.test.ts
```

### React Components
```
components/
├── ui/                      # shadcn/ui primitives only
├── {feature}/               # Feature folders
│   ├── FeatureComponent.tsx # PascalCase files
│   └── index.ts            # Barrel export
```

### Routes
```
app/
├── (community)/             # Protected routes
│   └── spaces/[spaceId]/   # camelCase dynamic params
├── admin/                   # Admin-only routes
└── api/webhooks/           # Webhook handlers
```

## React Patterns

### Loading States
```typescript
const posts = useQuery(api.posts.queries.listPosts, { spaceId });

if (posts === undefined) return <Skeleton />;  // Loading
if (posts.length === 0) return <EmptyState />; // Empty
return <PostList posts={posts} />;             // Data
```

### Typed Props
```typescript
// ✅ Always use typed IDs
type Props = {
  postId: Id<"posts">;  // From convex/_generated/dataModel
};

// ❌ NEVER: postId: string
```

## Gamification (Critical)

**ALWAYS award points through the central function:**
```typescript
import { awardPoints } from "../_lib/points";

// In any mutation that should award points:
await awardPoints(ctx, {
  userId: user._id,
  action: "post_created",  // Standardized action names
  points: 10,
  sourceId: postId,
});
```

**Point Values:**
| Action | Points |
|--------|--------|
| post_created | 10 |
| comment_added | 5 |
| like_received | 2 |
| lesson_completed | 15 |
| course_completed | 50 |

## Authorization Model

**Three-tier system:**
1. **Global Role:** Admin > Moderator > Member
2. **Space Permission:** Visibility, post permission, comment permission
3. **Tier Access:** Free, paid tier requirements

```typescript
// Use permission helpers from _lib/permissions.ts
const canPost = await canPostInSpace(ctx, user._id, spaceId);
if (!canPost) throw new ConvexError("Permission denied");
```

## Testing

**Location:** Co-located with Convex functions
**Framework:** Vitest + convex-test

```typescript
import { convexTest } from "convex-test";
import { modules } from "./test.setup";

it("should create post", async () => {
  const t = convexTest(schema, modules); // ALWAYS pass modules
  // ...
});
```

**Run tests:** `pnpm run test`

## Anti-Patterns to AVOID

1. **❌ snake_case** in Convex schema or functions
2. **❌ v.string()** for document IDs (use v.id())
3. **❌ ISO date strings** (use Date.now())
4. **❌ throw Error()** for user messages (use ConvexError)
5. **❌ Direct point awards** (use awardPoints helper)
6. **❌ Separate test folders** (co-locate with functions)
7. **❌ Redux/Zustand** (Convex queries ARE the state)
8. **❌ REST API routes** for data (use Convex functions)

## Key Dependencies

```json
{
  "@convex-dev/presence": "presence tracking",
  "convex-helpers": "rate limiting, relationships, RLS, Zod",
  "react-hook-form": "form state",
  "zod": "validation",
  "@tiptap/react": "rich text editor",
  "date-fns": "date formatting"
}
```

## Reference Documents

- **Architecture:** `docs/architecture.md` (complete decisions)
- **PRD:** `docs/prd.md` (75 functional requirements)
- **UX Spec:** `docs/ux-design-specification.md` (design system)
- **Convex Rules:** `.cursor/rules/convex_rules.mdc`
