---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - docs/prd.md
  - docs/ux-design-specification.md
  - docs/ARCHITECTURE.md
  - docs/analysis/product-brief-OpenTribe-2025-12-04.md
workflowType: 'architecture'
lastStep: 8
status: complete
completedAt: '2025-12-04'
project_name: 'OpenTribe'
user_name: 'Robert'
date: '2025-12-04'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
75 functional requirements across 9 capability areas:
- User Management (10 FRs): Registration, authentication, profiles, directory, following
- Community & Content (14 FRs): Spaces, posts, comments, reactions, mentions, search, activity feed
- Courses & Learning (10 FRs): Modules, lessons, progress tracking, enrollments, resources
- Events & Calendar (8 FRs): Creation, RSVPs, recurring, capacity, calendar integration
- Payments & Monetization (9 FRs): Stripe integration, subscriptions, one-time, coupons, access control
- Gamification & Engagement (7 FRs): Points, levels, leaderboards, configurable rewards
- Notifications (5 FRs): In-app, email digests, transactional emails
- Administration (8 FRs): Analytics, moderation, member management, branding, domains
- Direct Messaging (4 FRs): Real-time DMs, threads, read receipts, privacy controls

**Non-Functional Requirements:**
29 NFRs establishing quality attributes:
- Performance: 2s page loads, 500ms real-time updates, 1s search, 500 concurrent users
- Security: HTTPS, bcrypt/argon2 passwords, session tokens, rate limiting, webhook validation
- Scalability: Auto-scaling infrastructure, free tier <1000 members, 10x growth capacity
- Reliability: 99.5% uptime, automatic backups, webhook retry, graceful degradation
- Accessibility: WCAG 2.1 AA, keyboard navigation, screen reader support, mobile responsive
- Deployment: One-click deploy <5min, zero-downtime updates, UI wizard configuration

**Scale & Complexity:**

- Primary domain: Full-stack real-time web application
- Complexity level: Medium-High
- Estimated architectural components: 15-20 major modules

### Technical Constraints & Dependencies

**Mandated Technology Stack:**
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Backend: Convex (real-time database + serverless functions)
- Authentication: Better Auth with Convex integration
- Payments: Stripe via Convex component
- Email: Resend via Convex component
- UI Components: shadcn/ui (New York style)
- Deployment: Vercel + Convex Cloud

**Key Constraints:**
- Single-tenant deployment model (each creator owns their instance)
- Must operate within Vercel/Convex free tier for communities <1000 members
- Real-time capabilities are non-negotiable (core value proposition)
- No external auth services (Better Auth only, no Clerk/Auth0)

### Cross-Cutting Concerns Identified

1. **Authentication & Authorization:** Permeates all features; role-based + space-level permissions
2. **Real-time Synchronization:** Activity feeds, notifications, DMs, presence require live updates
3. **Gamification Engine:** Points triggered by posts, comments, likes, completions, levels, leaderboards
4. **Notification Dispatch:** Multi-channel (in-app + email) from numerous event sources
5. **File Storage & CDN:** Profile photos, course media, post attachments via Convex storage
6. **Payment-Access Coupling:** Stripe webhooks trigger automatic access provisioning/revocation

## Starter Template Evaluation

### Primary Technology Domain

Full-stack real-time web application based on project requirements analysis.

### Starter Status: Existing Foundation

This project extends an existing Next.js + Convex + Better Auth starter kit rather than initializing from scratch.

**Current Foundation Provides:**

**Language & Runtime:**
- TypeScript 5.x with strict mode
- Node.js runtime for API routes
- React 19 with Server Components support

**Framework & Routing:**
- Next.js 16 with App Router
- File-based routing in `/app` directory
- Server and Client Component patterns established

**Backend & Database:**
- Convex serverless functions (queries, mutations, actions)
- Convex real-time database with reactive subscriptions
- Schema-driven data modeling in `/convex/schema.ts`

**Authentication:**
- Better Auth with Convex integration
- Email/password authentication operational
- Session management via HTTP endpoints
- Middleware-based route protection

**Styling Solution:**
- Tailwind CSS 4 configured
- shadcn/ui (New York style) components installed
- CSS variables for theming

**Testing Framework:**
- Vitest configured for unit testing
- convex-test for backend function testing
- Test setup with mock environment

**Development Experience:**
- Turbo mode for fast development builds
- Hot reloading for frontend changes
- Convex dev server for backend iteration
- TypeScript auto-generation from Convex schema

### Extension Strategy

Rather than replacing the existing foundation, OpenTribe will extend it by:
1. Adding new Convex tables to the schema (spaces, posts, courses, events, etc.)
2. Implementing new Convex functions for community features
3. Building new React components following established patterns
4. Integrating additional Convex components (Stripe, Resend)
5. Extending the existing auth system with roles and permissions

**Note:** No `npx create-*` command needed — foundation already exists.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Authorization model (hierarchical roles + space overrides)
- Data modeling patterns (denormalization strategy)
- Real-time presence approach (Convex Presence component)

**Important Decisions (Shape Architecture):**
- Form handling (React Hook Form + Zod)
- Rich text editing (Tiptap)
- Notification architecture (inline dispatch)
- Error monitoring (Sentry)

**Deferred Decisions (Post-MVP):**
- Additional social login providers (GitHub, Apple)
- Rich presence features ("typing...", "viewing X")
- Advanced caching strategies

### Data Architecture

**Schema Organization:** Single schema file
- All ~15-20 tables defined in `convex/schema.ts`
- Convex's schema is designed as single source of truth
- Complexity of modular schemas not warranted at this scale

**Deletion Strategy:** Hybrid approach
- Soft delete for user-generated content (posts, comments, course content)
  - `deletedAt: v.optional(v.number())` field
  - Filtered in queries, recoverable by admins
- Hard delete for sensitive/ephemeral data (DMs when both parties delete, expired sessions)
  - GDPR-compliant data removal
  - Reduced storage overhead

**Denormalization Strategy:** Strategic denormalization for hot paths
- Author info (name, avatar) denormalized onto posts/comments for feed performance
- Space info (name, icon) denormalized onto posts for activity feed
- Relationships normalized for less-accessed data (course enrollments, event RSVPs)
- Update patterns: Mutation triggers update related denormalized records

**Indexing Strategy:**
- Index naming: `by_fieldName` for single field, `by_field1_and_field2` for compound
- Required indexes: `by_spaceId`, `by_authorId`, `by_createdAt` on posts
- Compound indexes for common query patterns: `by_spaceId_and_createdAt`

### Authentication & Security

**Authorization Model:** Hierarchical roles with space-level overrides

**Global Roles:**
| Role | Capabilities |
|------|-------------|
| Admin | Full system access, user management, billing, all moderation |
| Moderator | Content moderation, member warnings, limited admin access |
| Member | Standard community participation, content creation |

**Space-Level Permissions:**
- Visibility: public, members-only, paid-tier-only
- Post permission: who can create posts (all members, moderators+, admin only)
- Comment permission: who can comment
- Override: Admins can grant/restrict per-space access

**Implementation Pattern:**
```typescript
// Authorization check in Convex functions
const canPostInSpace = async (ctx, userId, spaceId) => {
  const user = await getUser(ctx, userId);
  const space = await getSpace(ctx, spaceId);
  const membership = await getMembership(ctx, userId);

  // Admin always can
  if (user.role === 'admin') return true;

  // Check space-level permission
  if (space.postPermission === 'moderators' && user.role === 'member') return false;

  // Check tier access
  if (space.requiredTier && membership.tier < space.requiredTier) return false;

  return true;
};
```

**Social Login:** Google only for MVP
- Rationale: Highest adoption rate, simplest configuration
- Architecture supports easy addition of GitHub, Apple, others post-MVP
- Better Auth provider configuration is modular

### API & Communication Patterns

**Convex Function Organization:**
```
convex/
├── schema.ts              # Single schema file
├── auth.ts                # Better Auth integration
├── http.ts                # HTTP routes (auth, webhooks)
├── _generated/            # Auto-generated types
│
├── spaces/                # Domain modules
│   ├── queries.ts         # listSpaces, getSpace, etc.
│   └── mutations.ts       # createSpace, updateSpace, etc.
├── posts/
│   ├── queries.ts
│   └── mutations.ts
├── courses/
│   ├── queries.ts
│   └── mutations.ts
├── events/
│   ├── queries.ts
│   └── mutations.ts
├── members/
│   ├── queries.ts
│   └── mutations.ts
├── notifications/
│   ├── queries.ts
│   ├── mutations.ts
│   └── actions.ts         # Email sending via Resend
├── payments/
│   ├── queries.ts
│   ├── mutations.ts
│   └── webhooks.ts        # Stripe webhook handlers
├── gamification/
│   ├── queries.ts
│   └── mutations.ts
└── messaging/
    ├── queries.ts
    └── mutations.ts
```

**Notification Architecture:** Inline dispatch
- Mutations that trigger notifications create notification records directly
- No separate event bus needed at current scale
- Pattern: `await createNotification(ctx, { userId, type, data })`
- Email dispatch via Convex actions (async, non-blocking)

**Error Handling Standard:**
```typescript
// Convex function error pattern
export const createPost = mutation({
  args: { ... },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Unauthorized");

    const canPost = await canPostInSpace(ctx, user._id, args.spaceId);
    if (!canPost) throw new ConvexError("Permission denied");

    // Proceed with creation...
  }
});
```

**Webhook Handling (Stripe):**
- HTTP endpoint at `/api/webhooks/stripe`
- Signature validation before processing
- Idempotency via event ID tracking
- Retry-safe mutation patterns

### Frontend Architecture

**State Management:** Convex reactive queries
- No Redux/Zustand needed — Convex queries ARE the state
- `useQuery` for read state with automatic real-time updates
- `useMutation` for write operations with optimistic updates
- Local UI state via React `useState` for ephemeral state (modals, form input)

**Form Handling:** React Hook Form + Zod
- React Hook Form for form state management
- Zod schemas shared between frontend validation and display
- Convex validators as source of truth for backend validation
- Pattern: Zod schema mirrors Convex args validator

**Rich Text Editor:** Tiptap
- Headless, Prosemirror-based editor
- Extensions: @mention, #hashtag, image embed, video embed, code blocks
- Output: JSON (stored in Convex) + HTML (rendered)
- Rationale: Highly customizable, active maintenance, good Convex examples exist

**Component Organization:**
```
components/
├── ui/                    # shadcn/ui primitives
├── layout/                # App shell, sidebar, header
├── feed/                  # PostCard, PostComposer, ActivityFeed
├── spaces/                # SpaceCard, SpaceList, SpaceHeader
├── courses/               # CourseCard, LessonViewer, ProgressTracker
├── events/                # EventCard, Calendar, RSVPButton
├── members/               # MemberCard, Directory, ProfileView
├── gamification/          # LevelBadge, Leaderboard, PointsToast
├── messaging/             # ConversationList, MessageThread
└── admin/                 # Dashboard, Analytics, Moderation
```

### Real-Time & Presence

**Presence Implementation:** Convex Presence Component
- Package: `@convex-dev/presence`
- Features: Room-based presence, heartbeat management, auto-disconnect
- Use cases:
  - Global "who's online" indicator
  - Space-level "X members viewing this space"
  - Future: Typing indicators in DMs

**Presence Data Model:**
- Room concept maps to: global community, individual spaces, DM threads
- Heartbeat interval: Default (component-managed)
- Disconnect: Automatic on tab close via component

**Integration Pattern:**
```typescript
// Client-side usage
const { users, myPresence, updatePresence } = usePresence(roomId, userId);

// Display online members
<FacePile users={users} />
```

### Convex Ecosystem Components

**Convex Presence Component** (`@convex-dev/presence`)
- Room-based real-time presence tracking
- Automatic heartbeat management and disconnect handling
- Use cases: Online indicators, "viewing this space" counts, typing indicators

**Convex Helpers** (`convex-helpers`)
Core utilities to leverage throughout the codebase:

| Utility | Use Case in OpenTribe |
|---------|----------------------|
| **Relationship helpers** | Managing posts↔comments, spaces↔posts, users↔memberships |
| **CRUD utilities** | Standard database operations with consistent patterns |
| **Row-level security** | Authorization checks integrated into queries/mutations |
| **Rate limiting** | Protecting mutations (post creation, DMs, signups) |
| **Zod validation** | Runtime validation aligned with React Hook Form schemas |
| **Action retry** | Resilient external API calls (Stripe, Resend) |
| **Manual pagination** | Paginated feeds, member directories, search results |
| **Session helpers** | Server-side session tracking for auth flows |
| **Query caching** | `ConvexQueryCacheProvider` for optimized client performance |

**Implementation Patterns:**

```typescript
// Row-level security example
import { wrapDatabaseReader } from "convex-helpers/server/rowLevelSecurity";

const securedDb = wrapDatabaseReader(ctx.db, {
  posts: async (doc) => {
    // Only show posts in spaces user can access
    return canViewSpace(ctx, doc.spaceId);
  },
});

// Rate limiting example
import { rateLimit } from "convex-helpers/server/rateLimit";

export const createPost = mutation({
  handler: async (ctx, args) => {
    await rateLimit(ctx, {
      name: "createPost",
      key: userId,
      rate: 10,      // 10 posts
      period: 60000  // per minute
    });
    // ... create post
  }
});

// Relationship helpers example
import { getOneFrom, getManyFrom } from "convex-helpers/server/relationships";

// Get all comments for a post
const comments = await getManyFrom(ctx.db, "comments", "by_postId", postId);

// Zod validation integration
import { zodToConvex } from "convex-helpers/server/zod";
// Share Zod schemas between frontend validation and Convex args
```

**Additional Convex Components to Integrate:**
- Stripe component (payments)
- Resend component (email)
- File storage (built-in)

### Infrastructure & Deployment

**Environment Strategy:** Separate Convex projects
- Development: Local Convex dev server + localhost:3000
- Staging: Separate Convex project + Vercel preview
- Production: Production Convex project + Vercel production
- Branch previews: Auto-deploy to Vercel + ephemeral Convex (optional)

**Environment Variables:**
- Convex: `BETTER_AUTH_SECRET`, `SITE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`
- Next.js: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`

**Error Monitoring:** Sentry (free tier)
- Client-side error capture in Next.js
- Server-side capture in API routes
- Convex function errors logged to Convex dashboard
- Source maps uploaded for readable stack traces

**Logging Strategy:**
- Development: Console logging, Convex dashboard
- Production: Sentry for errors, Convex dashboard for function logs
- Structured logging pattern for consistency

### Decision Impact Analysis

**Implementation Sequence:**
1. Schema design (all tables, indexes, relationships)
2. Authorization utilities (role checks, permission helpers)
3. Core domain modules (spaces, posts, members)
4. Presence integration
5. Gamification engine
6. Payment/subscription flow
7. Notifications system
8. Admin dashboard

**Cross-Component Dependencies:**
- Authorization → Required by all domain modules
- Gamification → Triggered by posts, comments, completions (cross-cutting)
- Notifications → Triggered by engagement, payments, events (cross-cutting)
- Presence → Independent component, integrated into UI layer

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 23 areas where AI agents could make different choices

### Naming Patterns

**Convex Schema Conventions:**
- Tables: camelCase, plural (posts, comments, courseModules)
- Fields: camelCase (authorId, createdAt, spaceId)
- Indexes: by_fieldName or by_field1_and_field2

**Convex Function Conventions:**
- Queries: get*, list*, search*, count*
- Mutations: create*, update*, delete*, set*, toggle*
- File organization: convex/{domain}/queries.ts, mutations.ts

**React Component Conventions:**
- Files: PascalCase.tsx (PostCard.tsx, ActivityFeed.tsx)
- Names: PascalCase matching file (export function PostCard)
- Organization: By feature domain (components/feed/, components/spaces/)

**Route Conventions:**
- Folders: kebab-case (app/dashboard/, app/settings/)
- Dynamic params: camelCase ([spaceId], [courseId])

### Format Patterns

**Convex Return Values:**
- Direct returns, no wrapper objects
- Null for not-found (client handles), not throwing
- Use Convex validators for all args and returns

**Date/Time Handling:**
- Storage: Unix timestamp milliseconds (v.number())
- Creation: Date.now()
- Display: Format on frontend with date-fns

**ID References:**
- Always typed: Id<"posts">, Id<"users">
- In args: v.id("tableName")
- Never raw strings for document references

### Structure Patterns

**Test Location:** Co-located
- convex/posts/queries.test.ts alongside queries.ts

**Shared Utilities:**
- convex/_lib/ for internal helpers
- Underscore prefix indicates internal

**Components:**
- Feature folders with barrel exports
- components/feed/index.ts exports all feed components

### Process Patterns

**Error Handling:**
```typescript
// Convex: ConvexError for user-facing
throw new ConvexError("Permission denied");

// Frontend: Catch and toast
if (error instanceof ConvexError) {
  toast.error(error.data);
}
```

**Loading States:**
```typescript
const data = useQuery(api.module.query, args);
if (data === undefined) return <Skeleton />;
if (data.length === 0) return <EmptyState />;
return <DataDisplay data={data} />;
```

**Gamification:**
- Central awardPoints function for all point awards
- Standardized point values per action type

| Action | Points |
|--------|--------|
| Post created | 10 |
| Comment added | 5 |
| Like received | 2 |
| Course lesson completed | 15 |
| Course completed | 50 |

### Enforcement Guidelines

**All AI Agents MUST:**
1. Follow Convex naming conventions (camelCase tables/fields)
2. Use typed IDs (Id<"tableName">) never raw strings
3. Store dates as Unix timestamps (Date.now())
4. Use ConvexError for user-facing errors
5. Co-locate tests with Convex functions
6. Use centralized awardPoints for gamification
7. Return null for not-found, not throw
8. PascalCase components matching filename

### Pattern Examples

**Good Examples:**
```typescript
// Table definition
defineTable({
  authorId: v.id("users"),
  createdAt: v.number(),
  spaceId: v.id("spaces"),
}).index("by_spaceId", ["spaceId"])
  .index("by_authorId_and_createdAt", ["authorId", "createdAt"])

// Query function
export const listPosts = query({
  args: { spaceId: v.id("spaces"), limit: v.optional(v.number()) },
  returns: v.array(v.object({ ... })),
  handler: async (ctx, args) => { ... }
});

// Component
export function PostCard({ postId }: { postId: Id<"posts"> }) {
  const post = useQuery(api.posts.queries.getPost, { postId });
  if (post === undefined) return <Skeleton />;
  if (post === null) return <NotFound />;
  return <Card>...</Card>;
}
```

**Anti-Patterns to Avoid:**
```typescript
// ❌ Wrong naming conventions
defineTable({
  author_id: v.string(),      // Should be authorId: v.id("users")
  created_at: v.string(),     // Should be createdAt: v.number()
})

// ❌ Wrong function naming
export const fetchAllPosts = query({ ... })  // Should be listPosts
export const getPosts = query({ ... })       // Should be listPosts (plural)

// ❌ Untyped IDs
function PostCard({ postId }: { postId: string })  // Should be Id<"posts">

// ❌ Throwing on not-found
if (!post) throw new Error("Not found");  // Should return null

// ❌ Wrong date storage
createdAt: new Date().toISOString()  // Should be Date.now()
```

## Project Structure & Boundaries

### Requirements to Structure Mapping

| FR Category | Primary Location | Supporting Locations |
|-------------|------------------|---------------------|
| User Management (FR1-10) | `convex/members/`, `components/members/` | `convex/_lib/auth.ts` |
| Community & Content (FR11-24) | `convex/spaces/`, `convex/posts/`, `components/feed/` | `convex/_lib/search.ts` |
| Courses & Learning (FR25-34) | `convex/courses/`, `components/courses/` | `convex/_lib/progress.ts` |
| Events & Calendar (FR35-42) | `convex/events/`, `components/events/` | - |
| Payments (FR43-51) | `convex/payments/`, `app/api/webhooks/` | `convex/_lib/access.ts` |
| Gamification (FR52-58) | `convex/gamification/`, `components/gamification/` | `convex/_lib/points.ts` |
| Notifications (FR59-63) | `convex/notifications/`, `components/notifications/` | - |
| Administration (FR64-71) | `convex/admin/`, `app/admin/` | - |
| Direct Messaging (FR72-75) | `convex/messaging/`, `components/messaging/` | - |

### Complete Project Directory Structure

```
OpenTribe/
├── README.md
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── components.json                    # shadcn/ui config
├── .env.local                         # Local environment (gitignored)
├── .env.example                       # Environment template
├── .gitignore
├── middleware.ts                      # Route protection
│
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Lint, type-check, test
│       └── deploy.yml                 # Vercel deployment
│
├── app/                               # Next.js App Router
│   ├── globals.css                    # Global styles + Tailwind
│   ├── layout.tsx                     # Root layout
│   ├── page.tsx                       # Landing page (public)
│   ├── ConvexClientProvider.tsx       # Convex + Auth provider
│   │
│   ├── (auth)/                        # Auth group (public)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── forgot-password/page.tsx
│   │
│   ├── (community)/                   # Main community (protected)
│   │   ├── layout.tsx                 # Community shell + sidebar
│   │   ├── page.tsx                   # Activity feed home
│   │   ├── spaces/
│   │   │   ├── page.tsx               # Space directory
│   │   │   └── [spaceId]/
│   │   │       ├── page.tsx           # Space feed
│   │   │       └── settings/page.tsx
│   │   ├── posts/[postId]/page.tsx    # Post detail + comments
│   │   ├── courses/
│   │   │   ├── page.tsx               # Course catalog
│   │   │   └── [courseId]/
│   │   │       ├── page.tsx           # Course overview
│   │   │       └── lessons/[lessonId]/page.tsx
│   │   ├── events/
│   │   │   ├── page.tsx               # Events calendar/list
│   │   │   └── [eventId]/page.tsx     # Event detail
│   │   ├── members/
│   │   │   ├── page.tsx               # Member directory
│   │   │   └── [memberId]/page.tsx    # Member profile
│   │   ├── messages/
│   │   │   ├── page.tsx               # Conversation list
│   │   │   └── [conversationId]/page.tsx
│   │   ├── leaderboard/page.tsx       # Community leaderboard
│   │   └── settings/
│   │       ├── page.tsx               # User settings
│   │       ├── profile/page.tsx
│   │       └── notifications/page.tsx
│   │
│   ├── admin/                         # Admin dashboard (admin only)
│   │   ├── layout.tsx                 # Admin layout
│   │   ├── page.tsx                   # Admin overview/analytics
│   │   ├── members/page.tsx           # Member management
│   │   ├── spaces/page.tsx            # Space management
│   │   ├── courses/page.tsx           # Course management
│   │   ├── events/page.tsx            # Event management
│   │   ├── moderation/page.tsx        # Content moderation queue
│   │   ├── payments/page.tsx          # Payment/subscription management
│   │   ├── gamification/page.tsx      # Points/levels config
│   │   └── settings/
│   │       ├── page.tsx               # Community settings
│   │       ├── branding/page.tsx      # Logo, colors, theme
│   │       └── billing/page.tsx       # Stripe connection
│   │
│   ├── api/                           # API routes
│   │   ├── auth/[...all]/route.ts     # Better Auth proxy
│   │   └── webhooks/stripe/route.ts   # Stripe webhook handler
│   │
│   └── setup/page.tsx                 # First-time setup wizard
│
├── components/
│   ├── ui/                            # shadcn/ui primitives
│   │   └── (button, card, dialog, input, skeleton, toast, etc.)
│   ├── layout/                        # App shell
│   │   └── (AppSidebar, Header, MobileNav, CommandPalette)
│   ├── auth/                          # Auth components
│   │   └── (LoginForm, SignupForm, ForgotPasswordForm)
│   ├── feed/                          # Feed components
│   │   └── (PostCard, PostComposer, ActivityFeed, CommentList)
│   ├── spaces/                        # Space components
│   │   └── (SpaceCard, SpaceList, SpaceHeader, CreateSpaceDialog)
│   ├── courses/                       # Course components
│   │   └── (CourseCard, LessonViewer, ProgressTracker, ModuleList)
│   ├── events/                        # Event components
│   │   └── (EventCard, EventCalendar, RSVPButton, CreateEventDialog)
│   ├── members/                       # Member components
│   │   └── (MemberCard, MemberDirectory, ProfileView, FollowButton)
│   ├── messaging/                     # DM components
│   │   └── (ConversationList, MessageThread, MessageInput)
│   ├── gamification/                  # Gamification components
│   │   └── (LevelBadge, PointsDisplay, PointsToast, Leaderboard)
│   ├── notifications/                 # Notification components
│   │   └── (NotificationBell, NotificationList, NotificationItem)
│   ├── admin/                         # Admin components
│   │   └── (StatCard, AnalyticsChart, ModerationQueue, MemberTable)
│   ├── editor/                        # Tiptap rich text editor
│   │   └── (TiptapEditor, Toolbar, extensions/)
│   └── shared/                        # Shared/common components
│       └── (Avatar, EmptyState, LoadingSpinner, ErrorBoundary)
│
├── convex/                            # Convex backend
│   ├── _generated/                    # Auto-generated (gitignored)
│   ├── schema.ts                      # Complete database schema
│   ├── convex.config.ts               # Convex configuration
│   ├── auth.ts                        # Better Auth setup
│   ├── auth.config.ts                 # Auth configuration
│   ├── http.ts                        # HTTP routes
│   ├── test.setup.ts                  # Test configuration
│   │
│   ├── _lib/                          # Internal utilities
│   │   ├── auth.ts                    # getAuthUser, requireAuth
│   │   ├── permissions.ts             # canPostInSpace, canModerate
│   │   ├── points.ts                  # awardPoints, calculateLevel
│   │   ├── notifications.ts           # createNotification helper
│   │   ├── search.ts                  # Search utilities
│   │   └── validators.ts              # Shared Convex validators
│   │
│   ├── spaces/                        # queries.ts, mutations.ts, *.test.ts
│   ├── posts/                         # queries.ts, mutations.ts, *.test.ts
│   ├── comments/                      # queries.ts, mutations.ts, *.test.ts
│   ├── courses/                       # queries.ts, mutations.ts, *.test.ts
│   ├── events/                        # queries.ts, mutations.ts, *.test.ts
│   ├── members/                       # queries.ts, mutations.ts, *.test.ts
│   ├── messaging/                     # queries.ts, mutations.ts, *.test.ts
│   ├── notifications/                 # queries.ts, mutations.ts, actions.ts
│   ├── gamification/                  # queries.ts, mutations.ts, *.test.ts
│   ├── payments/                      # queries.ts, mutations.ts, webhooks.ts, actions.ts
│   ├── admin/                         # queries.ts, mutations.ts, *.test.ts
│   └── presence/                      # Presence component integration
│
├── lib/                               # Frontend utilities
│   ├── auth-client.ts                 # Better Auth client
│   ├── utils.ts                       # cn(), formatDate()
│   ├── constants.ts                   # App constants
│   └── validators.ts                  # Zod schemas for forms
│
├── hooks/                             # Custom React hooks
│   ├── usePresence.ts
│   ├── useMobile.ts
│   ├── useDebounce.ts
│   └── useLocalStorage.ts
│
├── public/                            # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   └── og-image.png
│
└── docs/                              # Project documentation
    ├── architecture.md                # This document
    ├── prd.md
    └── ux-design-specification.md
```

### Architectural Boundaries

**API Boundaries:**

| Boundary | Location | Purpose |
|----------|----------|---------|
| Auth API | `/api/auth/*` | Better Auth endpoints (proxy to Convex) |
| Stripe Webhooks | `/api/webhooks/stripe` | Payment event processing |
| Convex Functions | `convex/**/queries.ts`, `mutations.ts` | All data operations |

**Component Boundaries:**

| Boundary | Communication Pattern |
|----------|----------------------|
| Pages ↔ Components | Props + Convex hooks |
| Components ↔ Convex | `useQuery`, `useMutation` direct calls |
| Layout ↔ Children | React context (auth, theme) |
| Admin ↔ Community | Separate route groups, shared components via `/shared` |

**Data Boundaries:**

| Boundary | Pattern |
|----------|---------|
| Convex Tables | Domain modules own their tables |
| Cross-domain queries | Use `_lib/` helpers, not direct cross-module imports |
| File storage | Convex file storage via mutations in owning domain |

### Integration Points

**Internal Communication:**
- React Pages/Components ↔ Convex Backend via `useQuery`/`useMutation`
- Real-time subscriptions automatically managed by Convex
- Child components receive data via props from parent queries

**External Integrations:**

| Service | Integration Point | Pattern |
|---------|-------------------|---------|
| Stripe | `convex/payments/actions.ts` | Convex action → Stripe API |
| Stripe Webhooks | `app/api/webhooks/stripe/route.ts` | HTTP → Convex mutation |
| Resend (Email) | `convex/notifications/actions.ts` | Convex action → Resend API |
| Better Auth | `convex/http.ts` | HTTP routes via Convex component |
| Presence | `convex/presence/index.ts` | Convex component |

### Development Workflow

**Local Development:**
```bash
pnpm run dev  # Runs Next.js + Convex dev servers in parallel
```

**Testing:**
```bash
pnpm run test           # Vitest watch mode
pnpm run test:once      # Single run
pnpm run test:coverage  # With coverage
```

**Deployment:**
- Vercel: Auto-deploy on push to main
- Convex: Auto-deploy via `convex deploy` in CI

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices work together without conflicts:
- Next.js 16 + React 19 with App Router
- Convex real-time backend with native TypeScript generation
- Better Auth via official Convex component
- Tailwind CSS 4 + shadcn/ui (New York style)
- Convex ecosystem: Presence, Stripe, Resend components + convex-helpers

**Pattern Consistency:**
Implementation patterns fully support architectural decisions:
- Convex naming (camelCase) aligns with function organization
- React component patterns (PascalCase) align with file structure
- Error handling (ConvexError) consistent across stack
- State management via Convex queries eliminates conflicts

**Structure Alignment:**
Project structure enables all architectural decisions:
- Domain modules map directly to FR categories
- Boundaries support clean separation of concerns
- Integration points clearly defined and structured

### Requirements Coverage Validation ✅

**Functional Requirements (75 FRs):**
All 9 FR categories have complete architectural support with dedicated Convex modules, React components, and integration points.

**Non-Functional Requirements (29 NFRs):**
- Performance: Convex reactive queries + strategic denormalization
- Security: Better Auth + rate limiting + webhook validation
- Scalability: Convex auto-scaling infrastructure
- Accessibility: shadcn/ui (Radix primitives) + WCAG 2.1 AA compliance
- Deployment: One-click Vercel + Convex auto-provision

### Implementation Readiness Validation ✅

**Decision Completeness:**
All critical architectural decisions documented with:
- Technology versions and compatibility
- Implementation rationale
- Code examples and patterns
- Anti-patterns to avoid

**Structure Completeness:**
Complete project directory with:
- All routes and pages defined
- All component folders specified
- All Convex domain modules listed
- All integration points mapped

**Pattern Completeness:**
Comprehensive consistency rules covering:
- 23 potential conflict points addressed
- Naming conventions for all areas
- Process patterns for error/loading/gamification
- Good and anti-pattern examples

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] 75 FRs mapped to architectural components
- [x] 29 NFRs addressed architecturally
- [x] Cross-cutting concerns identified (auth, gamification, notifications)

**✅ Architectural Decisions**
- [x] Technology stack fully specified
- [x] Data architecture patterns defined
- [x] Authorization model documented
- [x] Integration patterns established

**✅ Implementation Patterns**
- [x] Convex naming conventions
- [x] React component conventions
- [x] Error handling patterns
- [x] Loading state patterns
- [x] Gamification patterns

**✅ Project Structure**
- [x] Complete directory tree
- [x] FR-to-module mapping
- [x] Architectural boundaries
- [x] Integration points

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** HIGH

**Key Strengths:**
- Complete Convex ecosystem leverage (Presence, helpers, components)
- Clear domain module organization matching PRD categories
- Comprehensive consistency rules preventing AI agent conflicts
- Strong typing from database to UI via Convex + TypeScript

**Areas for Future Enhancement:**
- Add additional social login providers post-MVP
- Expand presence to rich presence (typing indicators)
- Consider search index optimization as data grows

### Implementation Handoff

**AI Agent Guidelines:**
1. Follow all architectural decisions exactly as documented
2. Use implementation patterns consistently across all components
3. Respect project structure and domain module boundaries
4. Reference this document for all architectural questions
5. Use convex-helpers utilities (rate limiting, relationships, RLS)
6. Award points through centralized `awardPoints` function only

**First Implementation Priority:**
1. Extend `convex/schema.ts` with all domain tables
2. Implement `convex/_lib/` utilities (auth, permissions, points)
3. Build core modules: spaces, posts, members
4. Integrate Presence component
5. Add gamification hooks to mutations

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2025-12-04
**Document Location:** docs/architecture.md

### Final Architecture Deliverables

**Complete Architecture Document**
- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**Implementation Ready Foundation**
- 15+ architectural decisions made
- 23 implementation patterns defined
- 11 domain modules specified
- 75 functional requirements + 29 NFRs fully supported

**AI Agent Implementation Guide**
- Technology stack with verified versions
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Development Sequence

1. Initialize Convex schema with all domain tables
2. Set up `convex/_lib/` utilities (auth, permissions, points, notifications)
3. Build core modules: spaces, posts, comments, members
4. Integrate Convex Presence + convex-helpers
5. Implement gamification engine
6. Add payment flow (Stripe component)
7. Build notification system (Resend component)
8. Create admin dashboard

### Quality Assurance Checklist

**✅ Architecture Coherence**
- [x] All decisions work together without conflicts
- [x] Technology choices are compatible
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**✅ Requirements Coverage**
- [x] All 75 functional requirements are supported
- [x] All 29 non-functional requirements are addressed
- [x] Cross-cutting concerns are handled
- [x] Integration points are defined

**✅ Implementation Readiness**
- [x] Decisions are specific and actionable
- [x] Patterns prevent agent conflicts
- [x] Structure is complete and unambiguous
- [x] Examples are provided for clarity

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Create epics and stories using the architectural decisions documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.
