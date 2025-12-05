# OpenTribe - Epic Breakdown

**Author:** Robert
**Date:** 2025-12-04
**Project Level:** Full-stack Web Application
**Target Scale:** Communities up to 1,000 members (free tier)

---

## Overview

This document provides the complete epic and story breakdown for OpenTribe, decomposing the requirements from the [PRD](./prd.md) into implementable stories. Each epic delivers user value, and each story is sized for completion by a single dev agent in one focused session.

**Source Documents:**
- PRD: 75 Functional Requirements (FR1-FR75), 29 Non-Functional Requirements
- Architecture: Convex + Next.js 16 + Better Auth + Stripe integration
- UX Design: shadcn/ui + Tailwind CSS 4, three-column layout

---

## Context Validation

### Documents Loaded

| Document | Status | Key Content |
|----------|--------|-------------|
| PRD.md | Loaded | 75 FRs, 29 NFRs, complete MVP scope |
| Architecture.md | Loaded | Tech stack, data models, implementation patterns |
| UX Design Spec | Loaded | Visual design, component specs, user flows |

### Technology Stack Confirmed

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend:** Convex (real-time database + serverless functions)
- **Authentication:** Better Auth with Convex integration
- **Payments:** Stripe via Convex component
- **Email:** Resend via Convex component
- **UI Components:** shadcn/ui (New York style)
- **Deployment:** Vercel + Convex Cloud

---

## Functional Requirements Inventory

### User Management (FR1-FR10)

| FR | Description | Priority |
|----|-------------|----------|
| FR1 | Visitors can register with email/password or social login | MVP |
| FR2 | Users can authenticate via magic link (passwordless) | MVP |
| FR3 | Users can reset their password via email | MVP |
| FR4 | Users can view and edit their profile information | MVP |
| FR5 | Users can upload and change their profile photo | MVP |
| FR6 | Users can set profile visibility (public/private) | MVP |
| FR7 | Users can configure notification preferences | MVP |
| FR8 | Users can view other members' public profiles | MVP |
| FR9 | Users can search and filter the member directory | MVP |
| FR10 | Users can follow other members | MVP |

### Community & Content (FR11-FR24)

| FR | Description | Priority |
|----|-------------|----------|
| FR11 | Admins can create, edit, and delete spaces | MVP |
| FR12 | Admins can set space visibility (public, members-only, paid-only) | MVP |
| FR13 | Admins can reorder spaces via drag-and-drop | MVP |
| FR14 | Members can create posts with rich text, images, and video embeds | MVP |
| FR15 | Members can edit and delete their own posts | MVP |
| FR16 | Members can comment on posts | MVP |
| FR17 | Members can reply to comments (nested 2 levels) | MVP |
| FR18 | Members can like posts and comments | MVP |
| FR19 | Members can @mention other members in posts and comments | MVP |
| FR20 | Members can use #hashtags in posts | MVP |
| FR21 | Admins can pin posts to the top of spaces | MVP |
| FR22 | Members can view an aggregated activity feed across all spaces | MVP |
| FR23 | Members can filter the activity feed by space or content type | MVP |
| FR24 | Members can search posts, comments, members, courses, and events | MVP |

### Courses & Learning (FR25-FR34)

| FR | Description | Priority |
|----|-------------|----------|
| FR25 | Admins can create courses with title, description, and thumbnail | MVP |
| FR26 | Admins can organize courses into modules and lessons | MVP |
| FR27 | Admins can reorder modules and lessons via drag-and-drop | MVP |
| FR28 | Admins can create lessons with rich text, video, and file attachments | MVP |
| FR29 | Admins can set course visibility (public, members-only, paid-only) | MVP |
| FR30 | Members can enroll in available courses | MVP |
| FR31 | Members can mark lessons as complete | MVP |
| FR32 | Members can view their progress per course and module | MVP |
| FR33 | Members can resume courses where they left off | MVP |
| FR34 | Members can download course resources and attachments | MVP |

### Events & Calendar (FR35-FR42)

| FR | Description | Priority |
|----|-------------|----------|
| FR35 | Admins can create events with title, description, date/time, and location | MVP |
| FR36 | Admins can create recurring events | MVP |
| FR37 | Admins can set event capacity limits | MVP |
| FR38 | Members can view events in calendar or list view | MVP |
| FR39 | Members can RSVP to events (going, maybe, not going) | MVP |
| FR40 | Members can add events to their personal calendar (Google, Apple, Outlook) | MVP |
| FR41 | Members can view past events archive | MVP |
| FR42 | System sends event reminder notifications to RSVPed members | MVP |

### Payments & Monetization (FR43-FR51)

| FR | Description | Priority |
|----|-------------|----------|
| FR43 | Admins can connect their Stripe account | MVP |
| FR44 | Admins can create pricing tiers (free, one-time, subscription) | MVP |
| FR45 | Admins can create and manage coupon codes | MVP |
| FR46 | Admins can set free trial periods for subscriptions | MVP |
| FR47 | Visitors can purchase memberships or content | MVP |
| FR48 | Members can manage their subscription via Stripe portal | MVP |
| FR49 | Members can view their billing history and invoices | MVP |
| FR50 | System automatically provisions access on successful payment | MVP |
| FR51 | System automatically revokes access on subscription cancellation | MVP |

### Gamification & Engagement (FR52-FR58)

| FR | Description | Priority |
|----|-------------|----------|
| FR52 | System awards points for configured actions (posts, comments, likes, completions) | MVP |
| FR53 | Admins can configure point values per action | MVP |
| FR54 | Members progress through levels based on accumulated points | MVP |
| FR55 | Admins can customize level names and thresholds | MVP |
| FR56 | Members can view their points, level, and rank | MVP |
| FR57 | Members can view the community leaderboard | MVP |
| FR58 | Members can filter leaderboard by time period (all-time, month, week) | MVP |

### Notifications (FR59-FR63)

| FR | Description | Priority |
|----|-------------|----------|
| FR59 | Members receive in-app notifications for relevant activity | MVP |
| FR60 | Members can view notification history and mark as read | MVP |
| FR61 | Members receive email notifications based on preferences | MVP |
| FR62 | Members can configure email digest frequency (immediate, daily, weekly, off) | MVP |
| FR63 | System sends transactional emails (welcome, password reset, payment receipts) | MVP |

### Administration (FR64-FR71)

| FR | Description | Priority |
|----|-------------|----------|
| FR64 | Admins can view community analytics (members, activity, revenue) | MVP |
| FR65 | Admins can manage member roles and permissions | MVP |
| FR66 | Admins can remove or ban members | MVP |
| FR67 | Admins can export member list to CSV | MVP |
| FR68 | Admins can view and moderate reported content | MVP |
| FR69 | Admins can configure community branding (logo, colors, favicon) | MVP |
| FR70 | Admins can connect a custom domain | MVP |
| FR71 | Admins can configure gamification settings | MVP |

### Direct Messaging (FR72-FR75)

| FR | Description | Priority |
|----|-------------|----------|
| FR72 | Members can send direct messages to other members | MVP |
| FR73 | Members can view message threads and history | MVP |
| FR74 | Members can disable DMs in their settings | MVP |
| FR75 | System shows read receipts for messages | MVP |

---

## Epic Structure Plan

### Epic Organization Principles

Each epic delivers **user value**, not just technical capability. The structure follows natural user journeys while respecting technical dependencies from the Architecture document.

### Epic Overview

| Epic | Title | User Value | FRs Covered |
|------|-------|------------|-------------|
| 1 | Foundation & Authentication | Users can sign up, log in, and access a secure community | FR1-FR10 (partial) |
| 2 | Community Spaces & Content | Members can post, comment, and engage in organized spaces | FR11-FR24 |
| 3 | Courses & Learning | Members can take courses and track their learning progress | FR25-FR34 |
| 4 | Events & Calendar | Members can discover events and RSVP to attend | FR35-FR42 |
| 5 | Payments & Monetization | Creators can monetize; members can purchase access | FR43-FR51 |
| 6 | Gamification & Engagement | Members earn points, level up, and compete on leaderboards | FR52-FR58 |
| 7 | Notifications & Messaging | Members stay informed and connect via DMs | FR59-FR63, FR72-FR75 |
| 8 | Administration & Settings | Admins can manage, moderate, and customize the community | FR64-FR71, FR4-FR10 (remaining) |

### Technical Context from Architecture

**Foundation Dependencies:**
- Convex schema must be extended with all domain tables first
- `convex/_lib/` utilities (auth, permissions, points) enable all features
- Better Auth integration already exists in starter

**Cross-Cutting Concerns:**
- Authorization checks required in all domain modules
- Gamification points triggered by posts, comments, completions
- Notifications triggered by engagement, payments, events
- Real-time updates via Convex reactive queries

---

## FR Coverage Map

| FR Range | Epic Coverage | Notes |
|----------|---------------|-------|
| FR1-FR3 | Epic 1 | Authentication flows |
| FR4-FR10 | Epic 1 + Epic 8 | Profile in E1, directory/following in E8 |
| FR11-FR24 | Epic 2 | Complete community features |
| FR25-FR34 | Epic 3 | Complete course features |
| FR35-FR42 | Epic 4 | Complete event features |
| FR43-FR51 | Epic 5 | Complete payment features |
| FR52-FR58 | Epic 6 | Complete gamification features |
| FR59-FR63 | Epic 7 | Notification features |
| FR64-FR71 | Epic 8 | Admin features |
| FR72-FR75 | Epic 7 | Direct messaging features |

---

## Epic 1: Foundation & Authentication

**User Value:** Users can create accounts, sign in securely, and manage their basic profile. This epic establishes the core identity layer that all other features depend on.

**PRD Coverage:** FR1, FR2, FR3, FR4, FR5, FR6, FR7

**Architecture Context:**
- Better Auth with Convex integration (already in starter)
- Hierarchical role system: Admin, Moderator, Member
- Session management via HTTP endpoints
- Convex schema extension for user profiles

**UX Context:**
- Login/signup pages following shadcn/ui patterns
- Profile completion during onboarding
- Clean, minimal authentication flows

---

### Story 1.1: Extend Convex Schema with Core Tables

As a **developer**,
I want the Convex schema extended with all domain tables,
So that the database foundation is ready for all features.

**Acceptance Criteria:**

**Given** the existing starter schema
**When** I extend the schema
**Then** the following tables are created:
- `users` (extended with profile fields: bio, avatar, visibility, role)
- `spaces` (id, name, description, icon, visibility, order, createdAt)
- `posts` (id, spaceId, authorId, title, content, media, createdAt, pinnedAt, deletedAt)
- `comments` (id, postId, authorId, parentId, content, createdAt, deletedAt)
- `likes` (id, targetType, targetId, userId, createdAt)
- `courses` (id, title, description, thumbnail, visibility, createdAt)
- `modules` (id, courseId, title, order)
- `lessons` (id, moduleId, title, content, videoUrl, order)
- `enrollments` (id, courseId, userId, enrolledAt)
- `lessonProgress` (id, lessonId, userId, completedAt)
- `events` (id, title, description, startTime, endTime, location, capacity, recurring)
- `rsvps` (id, eventId, userId, status, createdAt)
- `memberships` (id, userId, tier, stripeCustomerId, status)
- `notifications` (id, userId, type, data, read, createdAt)
- `conversations` (id, participantIds, lastMessageAt)
- `messages` (id, conversationId, senderId, content, createdAt, readAt)
- `points` (id, userId, action, amount, createdAt)
- `gamificationConfig` (id, action, pointValue)
- `levels` (id, name, threshold, order)

**And** indexes are created following Architecture patterns:
- `by_spaceId`, `by_authorId`, `by_createdAt` on posts
- `by_postId` on comments
- `by_userId` on notifications, enrollments, points
- Compound indexes for common query patterns

**Technical Notes:**
- Follow Convex naming conventions (camelCase)
- Use `v.id("tableName")` for all references
- Store dates as Unix timestamps (Date.now())
- Include `deletedAt` for soft-delete on user content

**Prerequisites:** None (first story)

---

### Story 1.2: Create Core Authorization Utilities

As a **developer**,
I want centralized authorization utilities,
So that permission checks are consistent across all features.

**Acceptance Criteria:**

**Given** the extended schema with roles
**When** I create `convex/_lib/permissions.ts`
**Then** the following utilities are available:
- `getAuthUser(ctx)` returns User or null
- `requireAuth(ctx)` returns User or throws if not authenticated
- `requireAdmin(ctx)` returns User or throws if not admin
- `requireModerator(ctx)` returns User or throws if not mod or admin
- `canViewSpace(ctx, userId, spaceId)` returns boolean
- `canPostInSpace(ctx, userId, spaceId)` returns boolean
- `canModerateSpace(ctx, userId, spaceId)` returns boolean
- `canEditContent(ctx, userId, contentId, type)` returns boolean
- `canDeleteContent(ctx, userId, contentId, type)` returns boolean

**And** utilities use the hierarchical role model from Architecture:
- Admin: Full access
- Moderator: Content moderation, limited admin
- Member: Standard participation

**And** space-level permissions are checked:
- Visibility: public, members-only, paid-tier-only
- Post permission by role

**Technical Notes:**
- Reference Architecture section on Authorization Model
- Use ConvexError for permission denied
- Return null for not-found, not throw

**Prerequisites:** Story 1.1

---

### Story 1.3: Email/Password Registration Flow

As a **visitor**,
I want to create an account with my email and password,
So that I can join the community.

**Acceptance Criteria:**

**Given** I am on the signup page
**When** I view the registration form
**Then** I see email and password fields with proper labels (UX: Form Patterns)

**And** the email field validates RFC 5322 format on blur
**And** the password field shows requirements: "8+ characters, 1 uppercase, 1 number"
**And** real-time validation feedback appears as I type (after first blur)

**When** I submit valid registration data
**Then** POST to Better Auth registration endpoint is called
**And** a new user record is created with role "member"
**And** I am automatically logged in
**And** I am redirected to the onboarding flow
**And** a welcome email is sent via Resend

**When** I submit with an existing email
**Then** I see inline error: "An account with this email already exists"

**Technical Notes:**
- Use React Hook Form + Zod for frontend validation
- Better Auth handles password hashing (bcrypt)
- Rate limiting: 5 attempts per hour per IP (Architecture 8.1)
- Session managed via Better Auth Convex component

**Prerequisites:** Story 1.2

---

### Story 1.4: Social Login with Google

As a **visitor**,
I want to sign up using my Google account,
So that I can join quickly without creating a new password.

**Acceptance Criteria:**

**Given** I am on the signup or login page
**When** I click "Continue with Google"
**Then** I am redirected to Google OAuth consent screen

**When** I authorize the application
**Then** I am redirected back to the community
**And** a user record is created (or matched if email exists)
**And** my Google profile photo is saved as avatar
**And** I am logged in and redirected appropriately

**When** my Google email matches an existing account
**Then** accounts are linked automatically

**Technical Notes:**
- Better Auth Google provider configuration
- Google OAuth credentials via environment variables
- Profile photo stored in Convex file storage
- Architecture: Google only for MVP (others post-MVP)

**Prerequisites:** Story 1.3

---

### Story 1.5: Magic Link Passwordless Authentication

As a **user**,
I want to log in via a magic link sent to my email,
So that I can access my account without remembering a password.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I click "Sign in with email link"
**Then** I see an email input field

**When** I submit my email
**Then** a magic link is sent via Resend
**And** I see confirmation: "Check your email for a sign-in link"
**And** the link expires after 15 minutes

**When** I click the magic link
**Then** I am authenticated and redirected to the community
**And** the magic link is invalidated (one-time use)

**When** I click an expired or used link
**Then** I see error: "This link has expired. Please request a new one."

**Technical Notes:**
- Better Auth magic link provider
- Resend integration for email delivery
- Rate limit: 3 magic links per email per hour

**Prerequisites:** Story 1.3

---

### Story 1.6: Password Reset Flow

As a **user**,
I want to reset my password if I forget it,
So that I can regain access to my account.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I click "Forgot password?"
**Then** I see an email input form

**When** I submit my email
**Then** a password reset email is sent via Resend
**And** I see: "If an account exists, you'll receive a reset link"
**And** the reset link expires after 1 hour

**When** I click the reset link
**Then** I see a new password form with confirmation field
**And** password requirements are displayed

**When** I submit a valid new password
**Then** my password is updated
**And** all existing sessions are invalidated
**And** I am redirected to login with success message

**Technical Notes:**
- Better Auth password reset flow
- Secure token generation and validation
- Session invalidation on password change
- Same email sent whether account exists or not (security)

**Prerequisites:** Story 1.3

---

### Story 1.7: User Profile View and Edit

As a **member**,
I want to view and edit my profile information,
So that other members can learn about me.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate to my profile settings
**Then** I see my current profile information:
- Display name
- Bio (rich text, 500 char limit)
- Profile photo
- Visibility setting (public/private)

**When** I edit any field
**Then** changes auto-save after 500ms debounce
**And** I see "Saving..." then "Saved" indicator

**When** I upload a new profile photo
**Then** the image is validated (type, size <5MB)
**And** uploaded to Convex file storage
**And** my avatar updates immediately

**When** I set visibility to private
**Then** only my name and avatar show in member directory
**And** my bio and other details are hidden from non-admins

**Technical Notes:**
- Convex file storage for avatars
- Tiptap editor for bio (subset of features)
- Optimistic UI updates
- UX: Auto-save with "Saving..." indicator

**Prerequisites:** Story 1.3

---

### Story 1.8: Notification Preferences Setup

As a **member**,
I want to configure my notification preferences,
So that I receive updates in my preferred way.

**Acceptance Criteria:**

**Given** I am on my settings page
**When** I view notification preferences
**Then** I see toggles for each notification type:
- New comments on my posts (email + in-app)
- Replies to my comments (email + in-app)
- New followers (email + in-app)
- Event reminders (email + in-app)
- Course updates (email + in-app)
- Direct messages (email + in-app)

**And** I see email digest frequency options:
- Immediate
- Daily digest
- Weekly digest
- Off

**When** I change any preference
**Then** it saves immediately (auto-save)
**And** future notifications respect my preferences

**Technical Notes:**
- Store preferences in user record or separate preferences table
- Notification system checks preferences before sending
- Default: All in-app on, email digest daily

**Prerequisites:** Story 1.7

---

## Epic 2: Community Spaces & Content

**User Value:** Members can participate in organized discussion spaces, create posts, comment, and engage with the community. This is the core community experience.

**PRD Coverage:** FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24

**Architecture Context:**
- Posts with denormalized author info for feed performance
- Rich text via Tiptap with @mentions and #hashtags
- Real-time updates via Convex reactive queries
- Soft delete for user content

**UX Context:**
- Three-column layout with persistent sidebar
- PostCard and PostComposer components
- Activity feed with filtering
- Command palette (Cmd+K) for search

---

### Story 2.1: Space Management for Admins

As an **admin**,
I want to create and manage discussion spaces,
So that I can organize my community's conversations.

**Acceptance Criteria:**

**Given** I am logged in as admin
**When** I navigate to space management
**Then** I see a list of existing spaces with:
- Name, icon, description preview
- Visibility badge (public/members/paid)
- Member count
- Drag handles for reordering

**When** I click "Create Space"
**Then** I see a form with:
- Name (required, 50 char max)
- Description (optional, 200 char max)
- Icon picker (emoji or Lucide icon)
- Visibility selector (public, members-only, paid-tier-only)
- Post permission (all members, moderators+, admin only)

**When** I submit valid space data
**Then** the space is created and appears in the sidebar
**And** I see success toast

**When** I drag a space to reorder
**Then** the order updates in real-time for all users
**And** order persists across sessions

**When** I click edit on a space
**Then** I can modify all settings
**And** changes save on submit

**When** I click delete on a space
**Then** I see confirmation dialog: "Delete [name]? All posts will be archived."
**And** on confirm, space is soft-deleted
**And** space disappears from navigation

**Technical Notes:**
- Visibility affects sidebar display for non-admins
- Order field for drag-drop persistence
- Soft delete preserves posts for potential recovery
- Use @dnd-kit for drag-drop

**Prerequisites:** Story 1.2

---

### Story 2.2: Space Navigation Sidebar

As a **member**,
I want to see and navigate between spaces,
So that I can find conversations that interest me.

**Acceptance Criteria:**

**Given** I am logged in
**When** I view the sidebar
**Then** I see spaces grouped by visibility I can access:
- Public spaces always visible
- Members-only if I'm a member
- Paid-only if I have the required tier

**And** each space shows:
- Icon
- Name
- Unread indicator (dot) if new posts since last visit

**When** I click a space
**Then** I navigate to that space's feed
**And** the space is highlighted as active (green background per UX)
**And** URL updates to `/spaces/[spaceId]`

**When** I use keyboard shortcuts
**Then** G+S opens spaces list
**And** J/K navigates between spaces
**And** Enter opens selected space

**Technical Notes:**
- Track last visit per space per user for unread indicators
- Convex reactive query for real-time space list
- Respect space visibility permissions
- Mobile: Spaces in bottom nav or hamburger menu

**Prerequisites:** Story 2.1

---

### Story 2.3: Rich Text Post Composer

As a **member**,
I want to create posts with rich formatting and media,
So that I can share engaging content with the community.

**Acceptance Criteria:**

**Given** I am in a space where I can post
**When** I focus the post composer
**Then** I see a Tiptap editor with toolbar:
- Bold, italic, underline
- Headings (H1, H2, H3)
- Bullet and numbered lists
- Code block with syntax highlighting
- Link insertion
- Image upload
- Video embed (YouTube, Vimeo URLs)

**When** I type @ followed by characters
**Then** I see an autocomplete dropdown of matching members
**And** selecting inserts an @mention link

**When** I type # followed by characters
**Then** a hashtag is created
**And** hashtags are clickable to filter feed

**When** I drag an image into the editor
**Then** the image uploads to Convex storage
**And** appears inline in the content

**When** I click "Post"
**Then** the post is created in the current space
**And** appears at top of feed immediately (optimistic UI)
**And** points are awarded (10 pts per Architecture)
**And** composer clears

**When** I press Cmd+Enter
**Then** the post submits (keyboard shortcut)

**Technical Notes:**
- Tiptap with custom @mention and #hashtag extensions
- Store content as JSON (Tiptap format)
- Render to HTML for display
- Image upload: max 10MB, validate type
- Video: Extract embed URL, display player

**Prerequisites:** Story 2.1

---

### Story 2.4: Post Display and Engagement Actions

As a **member**,
I want to view posts and engage with likes,
So that I can participate in community discussions.

**Acceptance Criteria:**

**Given** I am viewing a space feed
**When** posts load
**Then** each PostCard displays:
- Author avatar, name, level badge
- Space name (if in activity feed)
- Timestamp (relative: "2h ago")
- Post content (rich text rendered)
- Media (images, videos)
- Like count with heart icon
- Comment count with comment icon
- Share button

**When** I click the like button
**Then** like count increments immediately (optimistic)
**And** heart fills with color
**And** like record is created
**And** I earn 2 points (receiving likes awards author)

**When** I click like again
**Then** like is removed (toggle behavior)
**And** count decrements

**When** I click the post content area
**Then** I navigate to post detail page
**And** URL updates to `/posts/[postId]`

**When** new posts appear in real-time
**Then** a "New posts" banner appears at top
**And** clicking it scrolls to and reveals new posts

**Technical Notes:**
- Likes table with unique constraint on userId + targetId + targetType
- Denormalize like count on post for performance
- Real-time updates via Convex subscriptions
- PostCard component per UX specification

**Prerequisites:** Story 2.3

---

### Story 2.5: Comment System with Nested Replies

As a **member**,
I want to comment on posts and reply to comments,
So that I can participate in discussions.

**Acceptance Criteria:**

**Given** I am viewing a post
**When** I click "Comment" or the comment count
**Then** the comment section expands
**And** I see existing comments sorted by newest first
**And** I see a comment input field

**When** I submit a comment
**Then** comment appears immediately (optimistic UI)
**And** comment count updates
**And** I earn 5 points
**And** post author receives notification

**When** I click "Reply" on a comment
**Then** a nested input appears below that comment
**And** reply is indented when posted

**When** viewing nested comments
**Then** replies are nested up to 2 levels (per PRD)
**And** deeper replies are flattened to level 2

**When** I own a comment
**Then** I see edit and delete options in a dropdown menu

**When** I delete my comment
**Then** content is replaced with "[deleted]"
**And** comment structure preserved for context

**Technical Notes:**
- Comments table with parentId for nesting
- Limit nesting to 2 levels in query
- Soft delete preserves thread structure
- Notification to post author and parent comment author

**Prerequisites:** Story 2.4

---

### Story 2.6: Edit and Delete Own Posts

As a **member**,
I want to edit or delete my own posts,
So that I can correct mistakes or remove content.

**Acceptance Criteria:**

**Given** I am viewing my own post
**When** I click the more menu (...)
**Then** I see "Edit" and "Delete" options

**When** I click "Edit"
**Then** the post content becomes editable in Tiptap
**And** I see "Save" and "Cancel" buttons
**And** I see "(edited)" indicator will be added

**When** I save edits
**Then** post updates immediately
**And** "(edited)" appears next to timestamp
**And** edit history is not tracked (simple edit)

**When** I click "Delete"
**Then** I see confirmation: "Delete this post? This cannot be undone."
**And** on confirm, post is soft-deleted
**And** post disappears from feed
**And** comments are preserved but marked as orphaned

**When** an admin views a deleted post
**Then** they can see it in moderation view
**And** can restore if needed

**Technical Notes:**
- Soft delete via deletedAt timestamp
- Filter deleted posts in normal queries
- Admin queries can include deleted content
- Edited posts show edit indicator

**Prerequisites:** Story 2.5

---

### Story 2.7: Pin Posts to Space Top

As an **admin or moderator**,
I want to pin important posts to the top of a space,
So that members see crucial announcements first.

**Acceptance Criteria:**

**Given** I have moderation permissions in a space
**When** I click the more menu on a post
**Then** I see "Pin to top" option

**When** I pin a post
**Then** post moves to top of space feed
**And** shows a pin icon
**And** remains at top regardless of sort order

**When** I click "Unpin" on a pinned post
**Then** post returns to chronological position

**When** multiple posts are pinned
**Then** they appear at top sorted by pin date (newest pin first)

**Technical Notes:**
- pinnedAt timestamp field on posts
- Query sorts by pinnedAt DESC, then createdAt DESC
- Only mods+ can pin in spaces they moderate
- Limit: 3 pinned posts per space

**Prerequisites:** Story 2.6

---

### Story 2.8: Activity Feed Aggregation

As a **member**,
I want to see a unified activity feed across all spaces,
So that I can catch up on everything happening in the community.

**Acceptance Criteria:**

**Given** I am on the community home page
**When** the activity feed loads
**Then** I see posts from all spaces I can access
**And** posts are sorted by most recent
**And** each post shows the space name as a link
**And** infinite scroll loads more posts

**When** I click filter tabs
**Then** I can filter by:
- All (default)
- Following (posts from people I follow)
- Popular (sorted by engagement)

**When** I click a space name on a post
**Then** I navigate to that space's feed

**When** new posts appear while I'm scrolling
**Then** a "New posts" indicator appears
**And** clicking it loads new content without losing scroll position

**Technical Notes:**
- Paginated query across all accessible spaces
- Denormalize space name/icon on posts for performance
- Following filter uses follows table
- Popular sorts by (likes + comments) in time window

**Prerequisites:** Story 2.4

---

### Story 2.9: Global Search

As a **member**,
I want to search across all community content,
So that I can find posts, members, courses, and events.

**Acceptance Criteria:**

**Given** I am logged in
**When** I press Cmd+K or click the search icon
**Then** a command palette opens (per UX Pattern)

**When** I type a search query
**Then** results appear organized by category:
- Posts (title and content matches)
- Members (name matches)
- Spaces (name and description matches)
- Courses (title matches)
- Events (title matches)

**And** results update as I type (debounced 300ms)
**And** each result shows relevant preview text

**When** I click a result
**Then** I navigate to that content
**And** palette closes

**When** I use keyboard navigation
**Then** arrow keys move selection
**And** Enter opens selected result
**And** Escape closes palette

**When** no results match
**Then** I see "No results for [query]"

**Technical Notes:**
- Search utility in convex/_lib/search.ts
- Search across multiple tables with permission filtering
- Highlight matching text in results
- Recent searches saved locally
- Command palette component per UX

**Prerequisites:** Story 2.8

---

## Epic 3: Courses & Learning

**User Value:** Members can enroll in structured courses, complete lessons at their own pace, and track their learning progress. Creators can build and organize educational content.

**PRD Coverage:** FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR34

**Architecture Context:**
- Courses -> Modules -> Lessons hierarchy
- Progress tracking per user per lesson
- Video support via embed URLs
- File attachments via Convex storage

**UX Context:**
- Course catalog with card layout
- Lesson viewer with video player
- Progress ring/bar components
- "Resume where you left off" functionality

---

### Story 3.1: Course Creation for Admins

As an **admin**,
I want to create courses with structured content,
So that I can deliver educational material to my community.

**Acceptance Criteria:**

**Given** I am logged in as admin
**When** I navigate to course management
**Then** I see existing courses with:
- Thumbnail, title, description preview
- Visibility badge
- Enrollment count
- Published/draft status

**When** I click "Create Course"
**Then** I see a form with:
- Title (required, 100 char max)
- Description (rich text)
- Thumbnail upload
- Visibility (public, members-only, paid-tier-only)
- Status (draft/published)

**When** I save the course
**Then** it's created in draft status
**And** I'm taken to the module editor

**Technical Notes:**
- Thumbnail via Convex file storage
- Draft courses visible only to admins
- Description supports Tiptap rich text

**Prerequisites:** Story 1.2

---

### Story 3.2: Module and Lesson Organization

As an **admin**,
I want to organize course content into modules and lessons,
So that learners can follow a structured curriculum.

**Acceptance Criteria:**

**Given** I am editing a course
**When** I view the course structure
**Then** I see modules with expandable lesson lists
**And** each has drag handles for reordering

**When** I click "Add Module"
**Then** I enter module title
**And** module is created and appears in list

**When** I click "Add Lesson" in a module
**Then** I see the lesson editor with:
- Title (required)
- Content (Tiptap rich text editor)
- Video URL field (YouTube/Vimeo)
- File attachments (upload multiple)

**When** I drag modules or lessons
**Then** order updates in real-time
**And** order persists (stored in order field)

**When** I save a lesson
**Then** content is saved
**And** I can continue editing or navigate away

**Technical Notes:**
- Modules have order field and courseId
- Lessons have order field and moduleId
- @dnd-kit for drag-drop
- Video embeds via iframe, validated URLs

**Prerequisites:** Story 3.1

---

### Story 3.3: Lesson Content with Rich Media

As an **admin**,
I want lessons to include video, text, and downloadable files,
So that I can create engaging learning content.

**Acceptance Criteria:**

**Given** I am editing a lesson
**When** I add a video URL
**Then** the video player previews in editor
**And** YouTube and Vimeo URLs are validated

**When** I write content in the editor
**Then** full Tiptap features are available:
- Formatting, headings, lists
- Code blocks with syntax highlighting
- Inline images
- Links

**When** I upload file attachments
**Then** files are stored in Convex storage
**And** displayed as downloadable links with file name and size

**When** I save the lesson
**Then** all content persists
**And** files remain attached

**Technical Notes:**
- Video URL parsing for embed generation
- File storage with metadata (name, size, type)
- Max file size: 50MB per file
- Supported video platforms: YouTube, Vimeo, Loom

**Prerequisites:** Story 3.2

---

### Story 3.4: Course Catalog for Members

As a **member**,
I want to browse available courses,
So that I can find learning content that interests me.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate to Courses
**Then** I see a grid of course cards showing:
- Thumbnail
- Title
- Description preview (2 lines)
- Lesson count
- Enrolled count
- My progress (if enrolled)

**And** only courses I can access are shown (visibility check)

**When** I click a course card
**Then** I navigate to course detail page

**When** I filter courses
**Then** I can filter by:
- All courses
- In progress (enrolled, not complete)
- Completed

**Technical Notes:**
- Course cards per UX component spec
- Progress shows as percentage bar if enrolled
- Visibility filtering in query

**Prerequisites:** Story 3.1

---

### Story 3.5: Course Enrollment

As a **member**,
I want to enroll in courses,
So that I can track my progress and access content.

**Acceptance Criteria:**

**Given** I am viewing a course I haven't enrolled in
**When** I view the course page
**Then** I see course overview:
- Title, description, thumbnail
- Module/lesson outline (preview)
- Instructor info
- "Enroll" button

**When** I click "Enroll"
**Then** I am enrolled in the course
**And** enrollment record is created
**And** I'm directed to the first lesson
**And** I earn 5 points for enrolling

**When** the course requires payment
**Then** "Enroll" becomes "Purchase to Enroll"
**And** clicking redirects to payment flow

**Technical Notes:**
- Enrollments table tracks user + course
- Check visibility and tier requirements
- Free courses enroll immediately
- Paid courses require active subscription/purchase

**Prerequisites:** Story 3.4

---

### Story 3.6: Lesson Viewing and Completion

As a **member**,
I want to view lessons and mark them complete,
So that I can progress through courses.

**Acceptance Criteria:**

**Given** I am enrolled in a course
**When** I view a lesson
**Then** I see:
- Lesson title
- Video player (if video attached)
- Lesson content (rich text)
- File downloads (if attachments)
- Previous/Next navigation
- "Mark Complete" button

**When** I click "Mark Complete"
**Then** the lesson is marked complete
**And** progress record is created
**And** I earn 15 points (per Architecture)
**And** next lesson auto-loads or completion screen if last

**When** I was on a different lesson
**Then** completing marks only current lesson

**When** I view the lesson list
**Then** completed lessons show checkmark
**And** my current position is highlighted

**Technical Notes:**
- lessonProgress table tracks completions
- Progress is per-user per-lesson
- Video player: embedded YouTube/Vimeo
- Keyboard: Right arrow for next, Left for previous

**Prerequisites:** Story 3.5

---

### Story 3.7: Course Progress Tracking

As a **member**,
I want to see my progress through courses,
So that I know how much I've completed.

**Acceptance Criteria:**

**Given** I am enrolled in courses
**When** I view the course catalog
**Then** my progress shows on each enrolled course card:
- Progress ring with percentage
- "X of Y lessons complete"

**When** I view a course detail page
**Then** I see:
- Overall progress bar
- Module-by-module progress
- Last accessed lesson with "Resume" button

**When** I click "Resume"
**Then** I'm taken to my last incomplete lesson

**When** I complete all lessons
**Then** course shows "Complete" badge
**And** I earn 50 bonus points
**And** completion celebration appears (confetti, message)

**Technical Notes:**
- Calculate progress from lessonProgress records
- Store last accessed lesson per enrollment
- Completion celebration per UX emotional design
- Progress ring component per UX spec

**Prerequisites:** Story 3.6

---

### Story 3.8: Download Course Resources

As a **member**,
I want to download lesson attachments,
So that I can access resources offline.

**Acceptance Criteria:**

**Given** I am viewing a lesson with attachments
**When** I see the attachments section
**Then** each file shows:
- File name
- File size
- File type icon
- Download button

**When** I click Download
**Then** the file downloads to my device
**And** the original file name is preserved

**When** viewing on mobile
**Then** downloads work correctly
**And** files open in appropriate app

**Technical Notes:**
- Convex file storage provides download URLs
- Content-Disposition header for download
- Track downloads for analytics (optional)

**Prerequisites:** Story 3.6

---

## Epic 4: Events & Calendar

**User Value:** Members can discover community events, RSVP to attend, and add events to their personal calendars. Creators can schedule and manage events.

**PRD Coverage:** FR35, FR36, FR37, FR38, FR39, FR40, FR41, FR42

**Architecture Context:**
- Events table with recurring event support
- RSVP table with status (going/maybe/not going)
- Calendar integration via .ics file generation
- Event reminders via notification system

**UX Context:**
- Event cards in list and calendar views
- RSVP button with status options
- "Add to Calendar" with platform options

---

### Story 4.1: Event Creation for Admins

As an **admin**,
I want to create events for my community,
So that members can attend gatherings and activities.

**Acceptance Criteria:**

**Given** I am logged in as admin
**When** I navigate to event management
**Then** I see existing events with:
- Title, date/time, location
- RSVP count
- Status (upcoming/past)

**When** I click "Create Event"
**Then** I see a form with:
- Title (required)
- Description (rich text)
- Start date and time (date picker)
- End date and time
- Location (text, can be URL for virtual)
- Capacity limit (optional)
- Cover image (optional)

**When** I save the event
**Then** event is created
**And** appears in community calendar
**And** notification sent to members (based on preferences)

**Technical Notes:**
- Store times as Unix timestamps
- Location field supports URLs for virtual events
- Capacity null = unlimited
- Cover image via Convex storage

**Prerequisites:** Story 1.2

---

### Story 4.2: Recurring Event Support

As an **admin**,
I want to create recurring events,
So that I don't have to create each instance manually.

**Acceptance Criteria:**

**Given** I am creating an event
**When** I toggle "Recurring event"
**Then** I see recurrence options:
- Frequency: Daily, Weekly, Monthly
- Interval: Every X days/weeks/months
- End: After X occurrences, or by date, or never

**When** I save a recurring event
**Then** the recurrence pattern is stored
**And** future instances are generated/shown in calendar

**When** I edit a recurring event
**Then** I can choose:
- Edit this instance only
- Edit all future instances
- Edit entire series

**When** I delete a recurring event
**Then** same options apply

**Technical Notes:**
- Store recurrence rule (RRule format)
- Generate instances dynamically or materialize
- Editing series updates rule
- Individual instance edits create exceptions

**Prerequisites:** Story 4.1

---

### Story 4.3: Event Calendar View

As a **member**,
I want to see events in a calendar view,
So that I can plan my participation.

**Acceptance Criteria:**

**Given** I am on the Events page
**When** I select calendar view
**Then** I see a monthly calendar with:
- Event dots/blocks on event days
- Current day highlighted
- Month/year navigation

**When** I click a day with events
**Then** I see event list for that day

**When** I click an event
**Then** I navigate to event detail page

**When** I toggle to list view
**Then** I see chronological list of upcoming events
**And** can toggle between Upcoming and Past

**Technical Notes:**
- Calendar component (build or use react-big-calendar)
- Query events in current month range
- Recurring events expanded to instances
- Mobile: List view default

**Prerequisites:** Story 4.1

---

### Story 4.4: Event RSVP System

As a **member**,
I want to RSVP to events,
So that organizers know I'm attending.

**Acceptance Criteria:**

**Given** I am viewing an event
**When** I see the event details
**Then** I see:
- Title, description, date/time
- Location (linked if URL)
- RSVP status buttons
- Attendee count/list preview
- Capacity remaining (if limited)

**When** I click "Going"
**Then** my RSVP is recorded as going
**And** attendee count updates
**And** button shows selected state

**When** I click "Maybe" or "Can't Go"
**Then** my status updates accordingly
**And** I can change my response anytime

**When** event is at capacity
**Then** "Going" is disabled
**And** I see "Event is full"

**When** I'm marked Going
**Then** I receive reminders (24h, 1h before)

**Technical Notes:**
- RSVPs table with userId, eventId, status
- Capacity check before allowing "Going"
- Status options: going, maybe, notGoing, null (no response)
- Reminder notifications scheduled

**Prerequisites:** Story 4.3

---

### Story 4.5: Add Event to Personal Calendar

As a **member**,
I want to add events to my personal calendar,
So that I don't forget to attend.

**Acceptance Criteria:**

**Given** I am viewing an event
**When** I click "Add to Calendar"
**Then** I see options:
- Google Calendar
- Apple Calendar
- Outlook
- Download .ics file

**When** I select a calendar
**Then** appropriate action occurs:
- Google: Opens Google Calendar with event pre-filled
- Apple: Opens .ics file (triggers Calendar app)
- Outlook: Opens Outlook calendar URL
- .ics: Downloads file

**When** the event is recurring
**Then** recurrence is included in calendar data

**Technical Notes:**
- Generate .ics file with event data
- Google Calendar URL with parameters
- Outlook web calendar URL
- Include location, description, times

**Prerequisites:** Story 4.4

---

### Story 4.6: Past Events Archive

As a **member**,
I want to view past events,
So that I can see what I missed or review what I attended.

**Acceptance Criteria:**

**Given** I am on the Events page
**When** I click "Past" tab
**Then** I see events that have ended
**And** sorted by most recent first

**When** viewing a past event
**Then** RSVP buttons are disabled
**And** I see "This event has ended"
**And** attendee list still visible

**When** I search events
**Then** search includes past events

**Technical Notes:**
- Filter by endTime < Date.now()
- Preserve RSVP data for history
- Optional: Event recordings/notes for past events

**Prerequisites:** Story 4.4

---

### Story 4.7: Event Reminder Notifications

As a **member who RSVPed Going**,
I want to receive reminders before events,
So that I don't forget to attend.

**Acceptance Criteria:**

**Given** I have RSVPed "Going" to an event
**When** the event is 24 hours away
**Then** I receive a reminder notification (in-app + email based on prefs)
**And** notification includes event title, time, location

**When** the event is 1 hour away
**Then** I receive a final reminder

**When** I view the notification
**Then** I can click to go to event page

**When** I change RSVP from Going
**Then** reminders are cancelled

**Technical Notes:**
- Scheduled functions in Convex for reminders
- Check RSVP status before sending (cancelled if changed)
- Respect notification preferences
- Email via Resend, in-app via notifications table

**Prerequisites:** Story 4.4, Epic 7 (Notifications)

---

## Epic 5: Payments & Monetization

**User Value:** Creators can monetize their community with subscriptions and one-time purchases. Members can purchase access to premium content. All payments flow directly to the creator's Stripe account.

**PRD Coverage:** FR43, FR44, FR45, FR46, FR47, FR48, FR49, FR50, FR51

**Architecture Context:**
- Stripe integration via Convex component
- Webhook handlers for payment events
- Automatic access provisioning on payment
- Membership tiers control content access

**UX Context:**
- Stripe connection in admin settings
- Pricing page for visitors
- Member billing management via Stripe portal

---

### Story 5.1: Stripe Account Connection

As an **admin**,
I want to connect my Stripe account,
So that I can receive payments from members.

**Acceptance Criteria:**

**Given** I am in admin settings > Billing
**When** Stripe is not connected
**Then** I see "Connect Stripe" button
**And** explanation of what happens when connected

**When** I click "Connect Stripe"
**Then** I am redirected to Stripe Connect OAuth
**And** I authorize the connection

**When** I return from Stripe
**Then** connection status shows "Connected"
**And** I see connected account name
**And** I can disconnect if needed

**When** Stripe is connected
**Then** I can create pricing tiers and accept payments

**Technical Notes:**
- Stripe Connect for platform payments
- Store Stripe account ID in community settings
- Webhook endpoint configured during connection
- Environment: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

**Prerequisites:** Story 1.2

---

### Story 5.2: Pricing Tier Configuration

As an **admin**,
I want to create membership pricing tiers,
So that I can offer different access levels.

**Acceptance Criteria:**

**Given** Stripe is connected
**When** I navigate to pricing settings
**Then** I see existing tiers and "Create Tier" button

**When** I create a tier
**Then** I enter:
- Name (e.g., "Pro Member", "Founding Member")
- Price (one-time or recurring)
- Billing interval (monthly/yearly) if recurring
- Description / benefits list
- Access level (which spaces/courses it unlocks)

**When** I save the tier
**Then** Stripe price is created
**And** tier appears in pricing options

**When** I edit a tier
**Then** I can update name/description
**And** price changes create new Stripe price (existing subscriptions unaffected)

**When** I archive a tier
**Then** it's hidden from new purchases
**And** existing subscribers continue unchanged

**Technical Notes:**
- Create Stripe Product + Price via API
- Store tier metadata in Convex
- Link tier to access permissions
- Support both subscription and one-time prices

**Prerequisites:** Story 5.1

---

### Story 5.3: Coupon Code Management

As an **admin**,
I want to create discount codes,
So that I can offer promotions to my community.

**Acceptance Criteria:**

**Given** I am in pricing settings
**When** I click "Create Coupon"
**Then** I enter:
- Code (custom or auto-generated)
- Discount type (percentage or fixed amount)
- Discount value
- Duration (once, repeating, forever for subs)
- Expiration date (optional)
- Usage limit (optional)
- Applicable tiers (all or specific)

**When** I save the coupon
**Then** Stripe coupon is created
**And** code is active for use

**When** I view coupons
**Then** I see usage count and status

**When** I deactivate a coupon
**Then** it can no longer be used
**And** existing discounts continue

**Technical Notes:**
- Stripe Coupon API
- Store coupon metadata in Convex
- Validate coupon on checkout
- Track redemption count

**Prerequisites:** Story 5.2

---

### Story 5.4: Free Trial Configuration

As an **admin**,
I want to offer free trials on subscriptions,
So that members can try before committing.

**Acceptance Criteria:**

**Given** I am editing a subscription tier
**When** I enable free trial
**Then** I enter trial period (days)
**And** trial applies to new subscribers

**When** a member starts a trial
**Then** they get full access immediately
**And** they see trial end date in their billing
**And** payment method is required upfront

**When** trial ends
**Then** subscription charges automatically
**And** member is notified before trial ends (3 days, 1 day)

**When** member cancels during trial
**Then** access ends at trial end
**And** no charge occurs

**Technical Notes:**
- Stripe subscription trial_period_days
- Webhook handles trial end conversion
- Notification before trial expiry
- Access based on subscription status + trial

**Prerequisites:** Story 5.2

---

### Story 5.5: Member Purchase Flow

As a **visitor or member**,
I want to purchase a membership tier,
So that I can access premium content.

**Acceptance Criteria:**

**Given** I am viewing the pricing page
**When** I see available tiers
**Then** I see:
- Tier name and price
- Benefits list
- "Subscribe" or "Purchase" button

**When** I click to purchase
**Then** I am redirected to Stripe Checkout
**And** coupon code field is available
**And** my email is pre-filled if logged in

**When** I complete payment
**Then** I am redirected back to community
**And** success message displays
**And** access is immediately provisioned
**And** welcome email with receipt is sent

**When** payment fails
**Then** error message displays
**And** I can retry

**Technical Notes:**
- Stripe Checkout for payment collection
- Success URL returns to community
- Webhook handles checkout.session.completed
- Create/update membership record on success

**Prerequisites:** Story 5.4

---

### Story 5.6: Automatic Access Provisioning

As a **system**,
I want to automatically grant access when payment succeeds,
So that members can immediately access paid content.

**Acceptance Criteria:**

**Given** a successful payment webhook arrives
**When** event is checkout.session.completed
**Then** member's tier is updated
**And** access to tier-gated content is granted
**And** notification sent: "Welcome to [Tier Name]!"

**Given** a subscription renewal webhook arrives
**When** event is invoice.paid
**Then** access continues uninterrupted

**Given** a subscription cancelled webhook arrives
**When** event is customer.subscription.deleted
**Then** access is revoked at period end
**And** member notified: "Your access will end on [date]"

**Technical Notes:**
- Webhook handlers in convex/payments/webhooks.ts
- Validate Stripe signature before processing
- Idempotency via webhook event ID
- Grace period for failed payments (configurable)

**Prerequisites:** Story 5.5

---

### Story 5.7: Member Billing Management

As a **member with active subscription**,
I want to manage my billing,
So that I can update payment methods or cancel.

**Acceptance Criteria:**

**Given** I have an active subscription
**When** I go to my billing settings
**Then** I see:
- Current tier and price
- Next billing date
- Payment method (last 4 digits)
- "Manage Billing" button

**When** I click "Manage Billing"
**Then** I am redirected to Stripe Customer Portal
**And** I can update payment method
**And** I can view invoices
**And** I can cancel subscription

**When** I cancel via portal
**Then** access continues until period end
**And** I see "Subscription ends [date]" in app
**And** cancellation confirmation email sent

**Technical Notes:**
- Stripe Customer Portal for billing management
- Portal session created via Convex action
- Return URL brings back to app
- Sync status via webhooks

**Prerequisites:** Story 5.6

---

### Story 5.8: Billing History and Invoices

As a **member**,
I want to view my billing history and download invoices,
So that I have records for my expenses.

**Acceptance Criteria:**

**Given** I have made payments
**When** I view billing history
**Then** I see list of transactions:
- Date
- Description (tier name)
- Amount
- Status (paid, refunded, failed)
- Invoice link

**When** I click an invoice link
**Then** Stripe hosted invoice opens
**And** I can download as PDF

**When** I have no billing history
**Then** I see "No billing history yet"

**Technical Notes:**
- Query Stripe invoices via API
- Cache invoice list in Convex (refresh periodically)
- Stripe hosted invoice URLs for download

**Prerequisites:** Story 5.7

---

## Epic 6: Gamification & Engagement

**User Value:** Members earn points for participation, level up, and compete on leaderboards. This drives engagement and creates a sense of progression and recognition.

**PRD Coverage:** FR52, FR53, FR54, FR55, FR56, FR57, FR58

**Architecture Context:**
- Central awardPoints function for all point awards
- Standardized point values (Architecture table)
- Levels table with configurable thresholds
- Real-time leaderboard updates

**UX Context:**
- LevelBadge component showing user level
- PointsToast for "+X pts" feedback
- Leaderboard with filtering
- Level names: Newcomer -> Legend (1-10)

---

### Story 6.1: Points System Core

As a **system**,
I want to award points for member actions,
So that engagement is recognized and rewarded.

**Acceptance Criteria:**

**Given** a member performs a point-worthy action
**When** the action completes
**Then** points are awarded per the configuration:
- Post created: 10 points
- Comment added: 5 points
- Like received: 2 points (to content author)
- Course lesson completed: 15 points
- Course completed: 50 points (bonus)
- Event RSVP: 5 points

**And** a point record is created with:
- userId, action, amount, timestamp

**And** member's total points updates
**And** PointsToast notification appears

**Technical Notes:**
- Centralized awardPoints function per Architecture
- Points table for history
- Total cached on user record (update on award)
- Debounce rapid actions to prevent gaming

**Prerequisites:** Epic 2 posts, Epic 3 courses

---

### Story 6.2: Admin Point Configuration

As an **admin**,
I want to configure point values per action,
So that I can tune the gamification for my community.

**Acceptance Criteria:**

**Given** I am in admin gamification settings
**When** I view point configuration
**Then** I see each action with current point value:
- Post created: [input] pts
- Comment added: [input] pts
- Like received: [input] pts
- Lesson completed: [input] pts
- Course completed: [input] pts
- Event RSVP: [input] pts

**When** I change a value
**Then** it saves immediately
**And** future actions use new value
**And** existing points unchanged

**When** I set a value to 0
**Then** that action awards no points

**Technical Notes:**
- gamificationConfig table for point values
- Default values seeded on community creation
- awardPoints reads from config
- Validation: non-negative integers

**Prerequisites:** Story 6.1

---

### Story 6.3: Level Progression System

As a **member**,
I want to progress through levels as I earn points,
So that I have a sense of advancement.

**Acceptance Criteria:**

**Given** I am earning points
**When** my total points crosses a level threshold
**Then** I level up
**And** I see a level-up celebration (animation, message)
**And** I receive notification: "You reached Level X: [Name]!"
**And** my LevelBadge updates everywhere

**When** viewing my profile
**Then** I see:
- Current level badge
- Level name
- Points toward next level (progress bar)
- Total points earned

**Default levels:**
- Level 1: Newcomer (0 pts)
- Level 2: Contributor (50 pts)
- Level 3: Active Member (150 pts)
- Level 4: Rising Star (300 pts)
- Level 5: Engaged (500 pts)
- Level 6: Valued (800 pts)
- Level 7: Expert (1200 pts)
- Level 8: Leader (1800 pts)
- Level 9: Champion (2500 pts)
- Level 10: Legend (3500 pts)

**Technical Notes:**
- Levels table with thresholds
- Check level on point award
- Celebration per UX emotional design
- LevelBadge component per UX spec

**Prerequisites:** Story 6.1

---

### Story 6.4: Admin Level Customization

As an **admin**,
I want to customize level names and thresholds,
So that the progression fits my community's culture.

**Acceptance Criteria:**

**Given** I am in gamification settings
**When** I view level configuration
**Then** I see levels list with:
- Level number
- Name (editable)
- Points threshold (editable)
- Badge color/style (optional)

**When** I edit a level name
**Then** all members at that level see new name

**When** I edit thresholds
**Then** members are recalculated to appropriate levels
**And** level-ups/downs occur if needed

**When** I add a level
**Then** it inserts at appropriate position

**Technical Notes:**
- Levels table with order field
- Recalculate all user levels on threshold change
- Minimum 3 levels required
- Maximum 20 levels

**Prerequisites:** Story 6.3

---

### Story 6.5: Member Points Display

As a **member**,
I want to see my points and progress,
So that I know how I'm doing.

**Acceptance Criteria:**

**Given** I am logged in
**When** I view my profile or sidebar
**Then** I see:
- LevelBadge with level number and name
- Points count
- Progress to next level (if not max)

**When** I click my points
**Then** I see points history:
- Recent actions that earned points
- Date and points for each
- Breakdown by category (posts, comments, etc.)

**When** I earn points
**Then** PointsToast appears ("+10 pts")
**And** animates and auto-dismisses

**Technical Notes:**
- Points history from points table
- PointsToast stacks if multiple earned
- LevelBadge shows on all member cards
- Progress bar component per UX

**Prerequisites:** Story 6.3

---

### Story 6.6: Community Leaderboard

As a **member**,
I want to see the community leaderboard,
So that I can see top contributors and compete.

**Acceptance Criteria:**

**Given** I navigate to Leaderboard
**When** I view the default leaderboard
**Then** I see ranked members:
- Rank number (with special badge for 1, 2, 3)
- Avatar
- Name
- Level badge
- Points count

**And** I see my own rank highlighted if visible
**And** if not in top 50, I see "Your rank: #X"

**When** I filter by time period
**Then** I can select:
- All time
- This month
- This week

**And** rankings recalculate for that period

**When** I click a member
**Then** I navigate to their profile

**Technical Notes:**
- Query top N users by points
- Time-based filtering sums points in range
- My rank calculated separately if not in top
- Update leaderboard in real-time

**Prerequisites:** Story 6.5

---

## Epic 7: Notifications & Messaging

**User Value:** Members stay informed about community activity through notifications and can connect directly with other members via private messages.

**PRD Coverage:** FR59, FR60, FR61, FR62, FR63, FR72, FR73, FR74, FR75

**Architecture Context:**
- Notifications table with type and data fields
- Inline dispatch from triggering mutations
- Email via Resend component
- Real-time DM via Convex subscriptions

**UX Context:**
- NotificationBell with unread count
- Notification dropdown with history
- Message threads with real-time updates
- Read receipts in DMs

---

### Story 7.1: In-App Notification System

As a **member**,
I want to receive in-app notifications,
So that I know when something relevant happens.

**Acceptance Criteria:**

**Given** notification-triggering events occur
**When** someone:
- Comments on my post
- Replies to my comment
- Likes my post/comment
- Mentions me with @
- Follows me
- Sends me a DM

**Then** a notification is created
**And** notification appears in my dropdown
**And** bell shows unread count (badge)
**And** bell pulses briefly (attention)

**When** I click the notification bell
**Then** I see notification list with:
- Actor avatar and name
- Action description
- Timestamp
- Unread indicator (dot)

**When** I click a notification
**Then** I navigate to the relevant content
**And** notification is marked read

**Technical Notes:**
- Notifications table per schema
- createNotification helper in _lib
- Real-time via Convex subscription
- Batch notifications (e.g., "5 people liked your post")

**Prerequisites:** Epic 2 content

---

### Story 7.2: Notification History and Management

As a **member**,
I want to manage my notifications,
So that I can review and clear them.

**Acceptance Criteria:**

**Given** I have notifications
**When** I view the notification dropdown
**Then** I see most recent 20 notifications
**And** "View all" link to full page

**When** I click "Mark all read"
**Then** all notifications are marked read
**And** unread count clears

**When** I view notification page
**Then** I see full paginated history
**And** can filter by type
**And** can delete notifications

**When** I hover a notification
**Then** I see quick actions (mark read, delete)

**Technical Notes:**
- Pagination for notification history
- Soft delete for removed notifications
- Mark all read updates all unread in batch
- Filter by type: comments, likes, follows, etc.

**Prerequisites:** Story 7.1

---

### Story 7.3: Email Notification Delivery

As a **member**,
I want to receive email notifications,
So that I don't miss important activity.

**Acceptance Criteria:**

**Given** a notification-worthy event occurs
**When** my preferences allow email for that type
**Then** email is sent via Resend
**And** email includes:
- Clear subject line
- Actor and action
- Preview of content
- Link to view in app

**When** I have digest mode enabled
**Then** notifications batch into:
- Daily digest (morning summary)
- Weekly digest (week summary)

**When** email delivery fails
**Then** system retries up to 3 times
**And** failure logged for debugging

**Technical Notes:**
- Resend component for sending
- Email templates in convex/notifications/
- Digest via scheduled function
- Unsubscribe link in emails (updates preferences)

**Prerequisites:** Story 7.1

---

### Story 7.4: Transactional Emails

As a **system**,
I want to send transactional emails,
So that users receive essential communications.

**Acceptance Criteria:**

**Given** transactional events occur
**When** event is:
- Account creation: Welcome email
- Password reset: Reset link email
- Payment success: Receipt email
- Subscription cancelled: Confirmation email
- Trial ending: Reminder email

**Then** appropriate email is sent immediately
**And** email is professionally formatted
**And** includes relevant details and CTAs

**When** email contains receipts
**Then** Stripe invoice link is included

**Technical Notes:**
- Transactional emails always send (no preferences)
- Templates for each email type
- Branding from community settings (logo, colors)
- Resend handles deliverability

**Prerequisites:** Story 5.6, Story 1.3

---

### Story 7.5: Direct Message Conversations

As a **member**,
I want to send direct messages to other members,
So that I can connect privately.

**Acceptance Criteria:**

**Given** I view another member's profile
**When** DMs are enabled for them and me
**Then** I see "Message" button

**When** I click Message
**Then** a conversation opens
**And** I see message input
**And** I see previous messages if exists

**When** I send a message
**Then** message appears instantly (optimistic)
**And** recipient receives notification
**And** conversation updates in their inbox

**When** viewing conversations list
**Then** I see all my conversations
**And** sorted by most recent message
**And** unread indicator on unread threads

**Technical Notes:**
- Conversations table with participantIds array
- Messages table with conversationId
- Real-time via Convex subscription
- Create conversation on first message

**Prerequisites:** Story 7.1

---

### Story 7.6: Message Thread and History

As a **member**,
I want to view message threads and history,
So that I can have ongoing conversations.

**Acceptance Criteria:**

**Given** I have a conversation
**When** I open the thread
**Then** I see:
- Messages in chronological order
- Sender avatar, name, timestamp
- Read receipts (checkmark if read)
- Typing indicator when other is typing

**When** I scroll up
**Then** older messages load (pagination)

**When** new message arrives
**Then** it appears at bottom
**And** thread auto-scrolls if at bottom

**When** I send a message
**Then** input clears
**And** message appears immediately

**Technical Notes:**
- Messages ordered by createdAt
- ReadAt timestamp for receipts
- Typing indicator via presence
- Load 50 messages, paginate older

**Prerequisites:** Story 7.5

---

### Story 7.7: DM Privacy Controls

As a **member**,
I want to control who can DM me,
So that I can manage my inbox.

**Acceptance Criteria:**

**Given** I am in my settings
**When** I view DM settings
**Then** I see:
- Enable/disable DMs toggle
- Option: Allow DMs from everyone / Only following / Nobody

**When** I disable DMs
**Then** "Message" button is hidden on my profile
**And** existing conversations still accessible
**And** no new conversations can start with me

**When** I set "Only following"
**Then** only people I follow can start DMs

**When** someone blocked by my settings tries to message
**Then** they see "This member has disabled DMs"

**Technical Notes:**
- DM preferences in user settings
- Check preferences before allowing new conversation
- Existing threads preserved but new messages blocked
- Consider: Block list for specific users

**Prerequisites:** Story 7.6

---

## Epic 8: Administration & Settings

**User Value:** Admins can manage members, moderate content, view analytics, and customize the community appearance. This enables effective community management.

**PRD Coverage:** FR64, FR65, FR66, FR67, FR68, FR69, FR70, FR71, FR8, FR9, FR10

**Architecture Context:**
- Admin routes in /admin
- Role-based access to admin features
- Analytics via Convex queries
- Branding stored in community settings

**UX Context:**
- Admin dashboard with stat cards
- Member management table
- Moderation queue
- Branding preview

---

### Story 8.1: Admin Dashboard Overview

As an **admin**,
I want to see a dashboard overview,
So that I can quickly understand community health.

**Acceptance Criteria:**

**Given** I am logged in as admin
**When** I navigate to /admin
**Then** I see dashboard with:
- Total members (with trend: +X this week)
- Active members (last 7 days)
- Total posts (with trend)
- Total revenue (if Stripe connected)

**And** charts showing:
- Member growth over time
- Activity over time (posts, comments)
- Revenue trend (if applicable)

**When** I click a stat card
**Then** I navigate to detailed view for that metric

**Technical Notes:**
- Aggregate queries for statistics
- Time-series data for charts
- Chart library: recharts or similar
- StatCard component per UX spec

**Prerequisites:** Story 1.2

---

### Story 8.2: Member Management

As an **admin**,
I want to manage community members,
So that I can handle access and roles.

**Acceptance Criteria:**

**Given** I am in admin member management
**When** I view the member list
**Then** I see table with:
- Avatar, name, email
- Role badge
- Join date
- Last active
- Points, level
- Actions dropdown

**When** I search members
**Then** I can search by name or email

**When** I filter members
**Then** I can filter by:
- Role (admin, moderator, member)
- Status (active, banned)
- Tier (free, paid)

**When** I click a member row
**Then** I see member detail panel with:
- Full profile
- Activity summary
- Membership info
- Role management

**Technical Notes:**
- Paginated member query
- Search across name and email fields
- Bulk selection for batch actions
- Role changes logged for audit

**Prerequisites:** Story 8.1

---

### Story 8.3: Role and Permission Management

As an **admin**,
I want to assign roles to members,
So that I can delegate moderation and admin tasks.

**Acceptance Criteria:**

**Given** I am viewing a member
**When** I click to change role
**Then** I can select:
- Admin (full access)
- Moderator (content moderation)
- Member (standard)

**When** I promote to admin
**Then** confirmation dialog warns about full access
**And** role updates on confirm
**And** member notified of new role

**When** I demote from admin
**Then** role changes
**And** access immediately restricted

**When** I am the only admin
**Then** I cannot demote myself (protection)

**Technical Notes:**
- Role stored on user record
- Permission checks use role
- Audit log for role changes
- At least one admin required

**Prerequisites:** Story 8.2

---

### Story 8.4: Remove and Ban Members

As an **admin**,
I want to remove or ban members,
So that I can handle problematic users.

**Acceptance Criteria:**

**Given** I am viewing a member
**When** I click "Remove member"
**Then** I see confirmation dialog
**And** on confirm, member loses access
**And** their content remains (attributed or anonymized based on setting)
**And** their subscription is cancelled (if applicable)

**When** I click "Ban member"
**Then** I see dialog to:
- Choose ban duration (temporary or permanent)
- Add reason (internal note)
**And** member is banned
**And** cannot sign up again with same email
**And** their content is hidden

**When** I view banned members
**Then** I can unban them

**Technical Notes:**
- Ban status on user record
- Ban table with reason and duration
- Check ban on login
- Webhook to Stripe to cancel subscription

**Prerequisites:** Story 8.3

---

### Story 8.5: Content Moderation Queue

As an **admin or moderator**,
I want to review reported content,
So that I can maintain community standards.

**Acceptance Criteria:**

**Given** content has been reported
**When** I view the moderation queue
**Then** I see reported items with:
- Content preview
- Reporter and reason
- Report count
- Author info
- Actions: Approve, Delete, Ban Author

**When** I click "Approve"
**Then** reports are dismissed
**And** content remains visible

**When** I click "Delete"
**Then** content is removed (soft delete)
**And** author notified (optional)

**When** I click "Ban Author"
**Then** delete + ban flow triggers

**When** queue is empty
**Then** I see "No reported content"

**Technical Notes:**
- Reports table with targetType, targetId, reason
- Aggregate reports per content
- Notification to mods on new reports
- Auto-hide content with X reports (threshold)

**Prerequisites:** Story 8.4

---

### Story 8.6: Member Export

As an **admin**,
I want to export my member list,
So that I have my data for external use.

**Acceptance Criteria:**

**Given** I am in member management
**When** I click "Export"
**Then** I see export options:
- All members
- Filtered selection
- Format: CSV

**When** I confirm export
**Then** CSV downloads with:
- Name, email, role
- Join date, last active
- Tier, points, level
- Any custom fields

**When** export is large
**Then** export is queued
**And** I receive notification when ready

**Technical Notes:**
- Generate CSV in Convex action
- Stream to file storage for large exports
- Include only data admin owns
- GDPR compliant (no password hashes)

**Prerequisites:** Story 8.2

---

### Story 8.7: Community Branding

As an **admin**,
I want to customize my community's branding,
So that it matches my brand identity.

**Acceptance Criteria:**

**Given** I am in admin settings
**When** I view branding settings
**Then** I see:
- Community name field
- Logo upload (with sizing)
- Favicon upload
- Primary color picker
- Preview showing changes

**When** I upload a logo
**Then** it previews immediately
**And** file is validated (type, size)
**And** saved to Convex storage

**When** I pick a primary color
**Then** UI elements preview in that color
**And** palette generates complementary colors

**When** I save branding
**Then** changes apply across the platform
**And** all users see updated branding

**Technical Notes:**
- Community settings table
- Logo/favicon via Convex storage
- Color stored as hex, CSS variables update
- Palette generation algorithm

**Prerequisites:** Story 8.1

---

### Story 8.8: Custom Domain Setup

As an **admin**,
I want to use my own domain,
So that my community has a professional URL.

**Acceptance Criteria:**

**Given** I am in domain settings
**When** I enter my custom domain
**Then** I see:
- Domain input field
- DNS instructions for CNAME/A record
- Verification status

**When** I configure DNS correctly
**Then** verification succeeds
**And** domain is added to Vercel
**And** SSL certificate provisioned
**And** community accessible at custom domain

**When** verification fails
**Then** I see troubleshooting tips
**And** can retry verification

**When** domain is active
**Then** I can switch back to default
**And** redirects are handled

**Technical Notes:**
- Vercel Domains API for provisioning
- DNS verification via TXT record
- SSL automatic via Vercel
- Update SITE_URL in settings

**Prerequisites:** Story 8.7

---

### Story 8.9: Member Directory and Search

As a **member**,
I want to browse and search the member directory,
So that I can find and connect with others.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate to Members
**Then** I see member grid with:
- Avatar
- Name
- Level badge
- Short bio preview
- Follow button

**When** I search
**Then** I can search by name or bio keywords

**When** I filter
**Then** I can filter by:
- Level (e.g., Level 5+)
- Recently active

**When** I click a member card
**Then** I navigate to their profile

**When** viewing a profile
**Then** I see:
- Full bio
- Points, level, badges
- Recent posts
- Follow/Message buttons

**Technical Notes:**
- Privacy settings respected
- Private profiles show limited info
- Paginated member query
- MemberCard component per UX

**Prerequisites:** Story 1.7

---

### Story 8.10: Follow System

As a **member**,
I want to follow other members,
So that I see their content in my feed.

**Acceptance Criteria:**

**Given** I am viewing a member profile
**When** I click "Follow"
**Then** I am following them
**And** button changes to "Following"
**And** they receive notification (if enabled)

**When** I click "Following"
**Then** I see option to Unfollow
**And** on confirm, I unfollow

**When** I view my following/followers
**Then** I see lists of each

**When** I filter activity feed by "Following"
**Then** I only see posts from people I follow

**Technical Notes:**
- Follows table with followerId, followingId
- Notification on new follow
- Activity feed filter uses follows
- Show follower/following counts on profiles

**Prerequisites:** Story 8.9

---

## FR Coverage Matrix

| FR | Description | Epic | Story |
|----|-------------|------|-------|
| FR1 | Register with email/password or social login | Epic 1 | 1.3, 1.4 |
| FR2 | Authenticate via magic link | Epic 1 | 1.5 |
| FR3 | Reset password via email | Epic 1 | 1.6 |
| FR4 | View and edit profile | Epic 1 | 1.7 |
| FR5 | Upload and change profile photo | Epic 1 | 1.7 |
| FR6 | Set profile visibility | Epic 1 | 1.7 |
| FR7 | Configure notification preferences | Epic 1 | 1.8 |
| FR8 | View other members' profiles | Epic 8 | 8.9 |
| FR9 | Search and filter member directory | Epic 8 | 8.9 |
| FR10 | Follow other members | Epic 8 | 8.10 |
| FR11 | Create, edit, delete spaces | Epic 2 | 2.1 |
| FR12 | Set space visibility | Epic 2 | 2.1 |
| FR13 | Reorder spaces via drag-and-drop | Epic 2 | 2.1 |
| FR14 | Create posts with rich text, images, video | Epic 2 | 2.3 |
| FR15 | Edit and delete own posts | Epic 2 | 2.6 |
| FR16 | Comment on posts | Epic 2 | 2.5 |
| FR17 | Reply to comments (nested 2 levels) | Epic 2 | 2.5 |
| FR18 | Like posts and comments | Epic 2 | 2.4 |
| FR19 | @mention other members | Epic 2 | 2.3 |
| FR20 | Use #hashtags in posts | Epic 2 | 2.3 |
| FR21 | Pin posts to top of spaces | Epic 2 | 2.7 |
| FR22 | View aggregated activity feed | Epic 2 | 2.8 |
| FR23 | Filter activity feed | Epic 2 | 2.8 |
| FR24 | Search posts, comments, members, courses, events | Epic 2 | 2.9 |
| FR25 | Create courses with title, description, thumbnail | Epic 3 | 3.1 |
| FR26 | Organize courses into modules and lessons | Epic 3 | 3.2 |
| FR27 | Reorder modules and lessons via drag-and-drop | Epic 3 | 3.2 |
| FR28 | Create lessons with rich text, video, attachments | Epic 3 | 3.3 |
| FR29 | Set course visibility | Epic 3 | 3.1 |
| FR30 | Enroll in courses | Epic 3 | 3.5 |
| FR31 | Mark lessons as complete | Epic 3 | 3.6 |
| FR32 | View progress per course and module | Epic 3 | 3.7 |
| FR33 | Resume courses where left off | Epic 3 | 3.7 |
| FR34 | Download course resources | Epic 3 | 3.8 |
| FR35 | Create events with details | Epic 4 | 4.1 |
| FR36 | Create recurring events | Epic 4 | 4.2 |
| FR37 | Set event capacity limits | Epic 4 | 4.1 |
| FR38 | View events in calendar or list | Epic 4 | 4.3 |
| FR39 | RSVP to events | Epic 4 | 4.4 |
| FR40 | Add events to personal calendar | Epic 4 | 4.5 |
| FR41 | View past events archive | Epic 4 | 4.6 |
| FR42 | Event reminder notifications | Epic 4 | 4.7 |
| FR43 | Connect Stripe account | Epic 5 | 5.1 |
| FR44 | Create pricing tiers | Epic 5 | 5.2 |
| FR45 | Create and manage coupon codes | Epic 5 | 5.3 |
| FR46 | Set free trial periods | Epic 5 | 5.4 |
| FR47 | Purchase memberships or content | Epic 5 | 5.5 |
| FR48 | Manage subscription via Stripe portal | Epic 5 | 5.7 |
| FR49 | View billing history and invoices | Epic 5 | 5.8 |
| FR50 | Automatic access provisioning on payment | Epic 5 | 5.6 |
| FR51 | Automatic access revocation on cancellation | Epic 5 | 5.6 |
| FR52 | Award points for actions | Epic 6 | 6.1 |
| FR53 | Configure point values per action | Epic 6 | 6.2 |
| FR54 | Level progression based on points | Epic 6 | 6.3 |
| FR55 | Customize level names and thresholds | Epic 6 | 6.4 |
| FR56 | View points, level, and rank | Epic 6 | 6.5 |
| FR57 | View community leaderboard | Epic 6 | 6.6 |
| FR58 | Filter leaderboard by time period | Epic 6 | 6.6 |
| FR59 | Receive in-app notifications | Epic 7 | 7.1 |
| FR60 | View notification history and mark read | Epic 7 | 7.2 |
| FR61 | Receive email notifications | Epic 7 | 7.3 |
| FR62 | Configure email digest frequency | Epic 1 | 1.8 |
| FR63 | Transactional emails | Epic 7 | 7.4 |
| FR64 | View community analytics | Epic 8 | 8.1 |
| FR65 | Manage member roles | Epic 8 | 8.3 |
| FR66 | Remove or ban members | Epic 8 | 8.4 |
| FR67 | Export member list to CSV | Epic 8 | 8.6 |
| FR68 | View and moderate reported content | Epic 8 | 8.5 |
| FR69 | Configure community branding | Epic 8 | 8.7 |
| FR70 | Connect custom domain | Epic 8 | 8.8 |
| FR71 | Configure gamification settings | Epic 6 | 6.2, 6.4 |
| FR72 | Send direct messages | Epic 7 | 7.5 |
| FR73 | View message threads and history | Epic 7 | 7.6 |
| FR74 | Disable DMs in settings | Epic 7 | 7.7 |
| FR75 | Read receipts for messages | Epic 7 | 7.6 |

---

## Summary

### Epic Statistics

| Epic | Title | Stories | FRs Covered |
|------|-------|---------|-------------|
| 1 | Foundation & Authentication | 8 | FR1-FR7 (7) |
| 2 | Community Spaces & Content | 9 | FR11-FR24 (14) |
| 3 | Courses & Learning | 8 | FR25-FR34 (10) |
| 4 | Events & Calendar | 7 | FR35-FR42 (8) |
| 5 | Payments & Monetization | 8 | FR43-FR51 (9) |
| 6 | Gamification & Engagement | 6 | FR52-FR58 (7) |
| 7 | Notifications & Messaging | 7 | FR59-FR63, FR72-FR75 (9) |
| 8 | Administration & Settings | 10 | FR64-FR71, FR8-FR10 (11) |

**Total:** 63 stories covering all 75 functional requirements

### Architecture Alignment

- Schema designed per Architecture document (Story 1.1)
- Authorization utilities per Architecture patterns (Story 1.2)
- Gamification points per Architecture table (Epic 6)
- Real-time updates via Convex throughout
- All patterns follow Architecture consistency rules

### UX Integration

- Components follow shadcn/ui patterns
- Three-column layout implemented
- PostCard, LevelBadge, PointsToast per UX spec
- Command palette (Cmd+K) for search
- Keyboard shortcuts throughout
- Mobile-responsive design

### Development Sequence

1. **Epic 1** - Foundation (required by all)
2. **Epic 2** - Community content (core value)
3. **Epic 6** - Gamification (integrates with E2)
4. **Epic 7** - Notifications (integrates with E2, E3, E4)
5. **Epic 3** - Courses (builds on foundation)
6. **Epic 4** - Events (builds on foundation)
7. **Epic 5** - Payments (can gate E2, E3, E4)
8. **Epic 8** - Admin (management layer)

---

*For implementation: Use the `dev-story` workflow to implement individual stories from this breakdown.*

