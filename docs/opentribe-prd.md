# OpenTribe - Product Requirements Document

## Document Info

| Field        | Value         |
| ------------ | ------------- |
| Product Name | OpenTribe     |
| Author       | Robert Guss   |
| Version      | 1.0           |
| Status       | Draft         |
| Last Updated | December 2024 |

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Target Users](#target-users)
4. [Competitive Analysis](#competitive-analysis)
5. [Product Positioning](#product-positioning)
6. [Feature Requirements](#feature-requirements)
7. [Technical Architecture](#technical-architecture)
8. [User Stories](#user-stories)
9. [Information Architecture](#information-architecture)
10. [Success Metrics](#success-metrics)
11. [Launch Plan](#launch-plan)
12. [Future Roadmap](#future-roadmap)

---

## Executive Summary

OpenTribe is a free, open-source community platform that provides creators, coaches, and educators with a self-hosted alternative to paid platforms like Skool ($99/mo), Circle ($49-199/mo), and Mighty Networks ($41-360/mo).

The platform combines community discussions, course hosting, event management, member directories, and AI-powered engagement features—all deployable for free on Vercel and Convex.

**Key Differentiators:**

- 100% free and open source
- Self-hosted (you own your data)
- Zero transaction fees (use your own Stripe)
- Custom domain support
- Full branding control
- AI-powered member engagement (competing with Mighty Networks' "People Magic")
- One-click deploy to Vercel + Convex

---

## Problem Statement

### The Pain

Creators, coaches, and community builders are paying $50-360/month for community platforms. Over a year, that's $600-4,300+ gone—just to have a place for their people to gather.

These platforms also:

- Charge transaction fees (2.9-10%) on top of Stripe's fees
- Lock you into their subdomain (no custom domains on lower tiers)
- Own your member data and relationships
- Limit customization and branding
- Can shut down or change pricing at any time

### The Opportunity

Modern deployment platforms (Vercel, Convex) offer generous free tiers. A well-built community platform can run essentially for free at small-to-medium scale.

By open-sourcing a production-ready community platform, we can:

1. Free creators from recurring SaaS fees
2. Give them full ownership of their community and data
3. Provide a marketing vehicle for DevFast (custom development services)
4. Build an audience around the "Kill Your SaaS" brand

---

## Target Users

### Primary Persona: The Budget-Conscious Creator

**Name:** Sarah  
**Role:** Online coach / course creator  
**Community Size:** 50-500 members  
**Technical Skill:** Low to moderate (can follow deployment instructions)

**Pain Points:**

- Paying $99/mo for Skool feels excessive for her community size
- Frustrated by transaction fees eating into her course sales
- Wants her community to feel like "hers," not a Skool subdomain
- Worried about platform lock-in

**Goals:**

- Reduce monthly costs
- Own her member relationships
- Have a professional-looking community space
- Engage members and reduce churn

### Secondary Persona: The Technical Founder

**Name:** Marcus  
**Role:** Indie hacker / startup founder  
**Community Size:** 100-2,000 members  
**Technical Skill:** High (developer)

**Pain Points:**

- Doesn't want to build community features from scratch
- Needs something customizable and extensible
- Values open source for transparency and control
- Wants to integrate with existing tools

**Goals:**

- Get a community up fast without building from zero
- Customize and extend as needed
- Maintain full control of the codebase
- Potentially white-label for clients

### Anti-Persona: Enterprise / Large Scale

**Not targeting (for v1):**

- Organizations needing 10,000+ member support
- Enterprises requiring SLAs and dedicated support
- Users who need native mobile apps immediately
- Communities requiring real-time video/streaming

---

## Competitive Analysis

### Direct Competitors

| Platform            | Price      | Transaction Fee | Custom Domain      | Key Strength                 | Key Weakness                       |
| ------------------- | ---------- | --------------- | ------------------ | ---------------------------- | ---------------------------------- |
| **Skool**           | $99/mo     | 2.9-10%         | Subdomain only     | Simplicity, gamification     | No customization, no custom domain |
| **Circle**          | $49-199/mo | 0.5-4%          | Yes (higher tiers) | Flexibility, courses         | Gets expensive, complex            |
| **Mighty Networks** | $41-360/mo | Varies          | Yes (higher tiers) | AI features ("People Magic") | Expensive, overwhelming            |
| **Discord**         | Free       | N/A             | N/A                | Real-time chat               | Not built for courses/content      |
| **Facebook Groups** | Free       | N/A             | N/A                | Familiar UX                  | No monetization, no ownership      |

### OpenTribe Positioning

| Feature          | OpenTribe        | Competitors       |
| ---------------- | ---------------- | ----------------- |
| Price            | Free             | $49-360/mo        |
| Transaction fees | 0% (your Stripe) | 0.5-10%           |
| Custom domain    | Yes              | Higher tiers only |
| Data ownership   | 100% yours       | Platform owns     |
| Open source      | Yes              | No                |
| AI engagement    | Yes              | Mighty only       |
| Self-hosted      | Yes              | No                |

---

## Product Positioning

### One-Liner

"The free, open-source community platform for creators who are done paying."

### Elevator Pitch

OpenTribe is a free, open-source alternative to Skool, Circle, and Mighty Networks. It gives creators everything they need—community discussions, courses, events, payments, and AI-powered engagement—without monthly fees or transaction costs. Deploy it yourself in minutes and own your community forever.

### Key Messages

1. **For creators:** "Stop renting your community. Own it."
2. **For developers:** "Fork it. Extend it. Make it yours."
3. **For the budget-conscious:** "Everything Skool does. $0/month."

---

## Feature Requirements

### Priority Levels

- **P0:** Must have for launch (MVP)
- **P1:** Important, launch soon after MVP
- **P2:** Nice to have, future roadmap

---

### 1. Community & Discussions (P0)

#### 1.1 Spaces

Spaces are containers for organizing community content by topic or purpose.

**Requirements:**

- Create, edit, delete spaces
- Space types: Posts, Events, Courses
- Space visibility: Public, Private (members only), Secret (invite only)
- Space ordering (drag and drop)
- Space icons/emojis
- Space descriptions

#### 1.2 Posts & Discussions

**Requirements:**

- Create posts with rich text editor
- Support for: text formatting, images, video embeds, file attachments, code blocks
- Comments on posts
- Nested replies (2 levels deep)
- Likes/reactions on posts and comments
- Post pinning
- Post sorting: Latest, Popular, Following
- @mentions for members
- #hashtags
- Edit and delete own posts/comments

#### 1.3 Activity Feed

**Requirements:**

- Aggregated feed of all spaces
- Filter by space
- Filter by: All, Following, Popular
- Infinite scroll pagination

---

### 2. Member Management (P0)

#### 2.1 Member Profiles

**Requirements:**

- Profile photo
- Display name
- Bio/about
- Custom profile fields (defined by admin)
- Social links
- Member since date
- Activity stats (posts, comments, points)
- Public/private profile toggle

#### 2.2 Member Directory

**Requirements:**

- Searchable member list
- Filter by custom fields
- Sort by: Name, Join date, Activity, Points
- Member cards with key info
- Click to view full profile

#### 2.3 Member Roles

**Requirements:**

- Default roles: Admin, Moderator, Member
- Custom roles (admin-defined)
- Role-based permissions:
  - Manage spaces
  - Manage members
  - Manage content
  - Access private spaces
  - Moderate content

---

### 3. Courses & Content (P0)

#### 3.1 Course Structure

**Requirements:**

- Create courses with title, description, thumbnail
- Organize into modules/sections
- Lessons within modules
- Lesson types: Video, Text, File download
- Lesson ordering (drag and drop)
- Course visibility: Public, Members only, Paid only

#### 3.2 Course Content

**Requirements:**

- Rich text lesson content
- Video embedding (YouTube, Vimeo, or direct upload)
- File attachments
- Downloadable resources
- Lesson completion tracking

#### 3.3 Course Progress

**Requirements:**

- Mark lessons complete
- Progress bar per course
- Progress bar per module
- "Continue where you left off"
- Completion certificates (P1)

---

### 4. Events & Calendar (P0)

#### 4.1 Event Creation

**Requirements:**

- Event title, description, thumbnail
- Date and time (with timezone support)
- Duration
- Event type: One-time, Recurring
- Event location: URL (Zoom, Google Meet, etc.) or physical address
- RSVP capacity limits (optional)

#### 4.2 Event Discovery

**Requirements:**

- Calendar view (month, week, list)
- Upcoming events list
- Past events archive
- Filter by space

#### 4.3 Event Engagement

**Requirements:**

- RSVP: Going, Maybe, Not going
- Add to calendar (Google, Apple, Outlook)
- Event reminders (email)
- Event discussion thread

---

### 5. Payments & Monetization (P0)

#### 5.1 Stripe Integration

**Requirements:**

- Connect your own Stripe account
- Zero platform transaction fees
- Test mode for development

#### 5.2 Pricing Options

**Requirements:**

- Free tier (no payment required)
- One-time payment
- Recurring subscription (monthly, yearly)
- Multiple price tiers
- Coupon codes
- Free trials

#### 5.3 Access Control

**Requirements:**

- Gate spaces by payment tier
- Gate courses by payment tier
- Gate content within spaces
- Automatic access provisioning on payment
- Automatic access revocation on cancellation

#### 5.4 Member Billing

**Requirements:**

- Member billing portal (Stripe Customer Portal)
- Update payment method
- View invoices
- Cancel subscription

---

### 6. Gamification (P0)

#### 6.1 Points System

**Requirements:**

- Earn points for actions:
  - Creating posts
  - Commenting
  - Receiving likes
  - Completing lessons
  - Attending events
  - Daily login streak
- Configurable point values per action
- Point leaderboard

#### 6.2 Levels

**Requirements:**

- Level progression based on points
- Level names (customizable by admin)
- Level badges displayed on profile
- Level-up notifications

#### 6.3 Leaderboard

**Requirements:**

- Community leaderboard
- Filter: All time, This month, This week
- Top 10/25/50 display
- Current user's rank always visible

---

### 7. AI-Powered Engagement (P0)

_Competing with Mighty Networks' "People Magic"_

#### 7.1 AI Member Matching

**Requirements:**

- "Members like you" suggestions
- Based on: profile fields, interests, activity patterns
- Display common interests/connections
- "You both..." conversation starters

#### 7.2 AI Profile Builder

**Requirements:**

- Answer 3-5 questions
- Generate complete profile bio
- Regenerate option
- Edit before saving

#### 7.3 AI Conversation Starters

**Requirements:**

- Suggest DM openers based on shared interests
- Suggest icebreakers for new members
- Generate discussion prompts for spaces

#### 7.4 AI Re-engagement

**Requirements:**

- Identify inactive members
- Generate personalized re-engagement messages
- Admin dashboard for bulk outreach
- Track re-engagement success

#### 7.5 AI Content Assistant

**Requirements:**

- Improve post writing (grammar, clarity, tone)
- Suggest hashtags
- Generate post ideas based on trending topics

---

### 8. Admin Dashboard (P0)

#### 8.1 Overview

**Requirements:**

- Total members (and growth trend)
- Active members (DAU, WAU, MAU)
- New members (today, this week, this month)
- Revenue (MRR, total)
- Top posts/content
- Recent activity feed

#### 8.2 Member Management

**Requirements:**

- View all members
- Search and filter
- Edit member details
- Change member role
- Remove/ban members
- Export member list (CSV)

#### 8.3 Content Moderation

**Requirements:**

- Reported content queue
- Approve/reject/delete content
- Member warnings
- Content filters (auto-flag keywords)

#### 8.4 Settings

**Requirements:**

- Community name, description, logo
- Custom domain configuration
- Color theme / branding
- Email settings
- Payment settings
- Gamification settings
- AI feature toggles

---

### 9. Notifications (P0)

#### 9.1 In-App Notifications

**Requirements:**

- Notification bell with unread count
- Notification types:
  - New comment on your post
  - Reply to your comment
  - @mention
  - New follower
  - Like on your content
  - Level up
  - Event reminder
- Mark as read
- Mark all as read

#### 9.2 Email Notifications

**Requirements:**

- Configurable email preferences
- Digest options: Immediate, Daily, Weekly, Off
- Transactional emails:
  - Welcome email
  - Password reset
  - Payment confirmation
  - Subscription renewal
  - Event reminders

---

### 10. Customization & Branding (P0)

#### 10.1 Visual Branding

**Requirements:**

- Logo upload
- Favicon
- Primary color
- Secondary color
- Light/dark mode toggle
- Custom CSS (advanced)

#### 10.2 Custom Domain

**Requirements:**

- Connect custom domain
- SSL certificate (automatic via Vercel)
- Subdomain support

#### 10.3 Custom Fields

**Requirements:**

- Create custom profile fields
- Field types: Text, Select, Multi-select, URL
- Required vs optional
- Displayed on profile vs admin only

---

### 11. Authentication (P0)

**Requirements:**

- Email/password registration
- Social login: Google, GitHub, (others via Clerk)
- Magic link login
- Password reset
- Email verification
- Session management

---

### 12. Search (P1)

**Requirements:**

- Global search
- Search posts and comments
- Search members
- Search courses and lessons
- Search events
- Filter search results by type

---

### 13. Direct Messaging (P1)

**Requirements:**

- 1:1 messaging between members
- Message threads
- Read receipts
- Typing indicators (P2)
- Disable DMs option (per member)

---

### 14. Mobile Responsiveness (P0)

**Requirements:**

- Fully responsive design
- Touch-friendly interactions
- Mobile navigation
- PWA support (add to home screen)

---

## Technical Architecture

### Tech Stack

| Layer              | Technology                 |
| ------------------ | -------------------------- |
| Framework          | Next.js 15 (App Router)    |
| Database & Backend | Convex                     |
| Authentication     | Clerk                      |
| Payments           | Stripe                     |
| Styling            | Tailwind CSS               |
| UI Components      | shadcn/ui                  |
| AI                 | OpenAI API (or Claude API) |
| File Storage       | Convex file storage        |
| Deployment         | Vercel + Convex Cloud      |
| Email              | Resend (or SendGrid)       |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
│                    (Next.js Frontend)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Convex Backend                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Queries    │  │  Mutations  │  │  Actions    │         │
│  │  (Read)     │  │  (Write)    │  │  (External) │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Convex Database                    │   │
│  │  - Users        - Memberships    - Points           │   │
│  │  - Spaces       - Events         - Notifications    │   │
│  │  - Posts        - Courses        - Settings         │   │
│  │  - Comments     - Lessons        - Files            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │  Clerk   │   │  Stripe  │   │ OpenAI/  │
    │  (Auth)  │   │(Payments)│   │ Claude   │
    └──────────┘   └──────────┘   └──────────┘
```

### Database Schema (Convex Tables)

```typescript
// Users
users: {
  clerkId: string
  email: string
  name: string
  avatar: string
  bio: string
  role: "admin" | "moderator" | "member"
  points: number
  level: number
  customFields: Record<string, any>
  createdAt: number
  lastActiveAt: number
}

// Spaces
spaces: {
  name: string
  description: string
  icon: string
  type: "posts" | "events" | "courses"
  visibility: "public" | "private" | "secret"
  order: number
  createdAt: number
}

// Posts
posts: {
  spaceId: Id<"spaces">
  authorId: Id<"users">
  title: string
  content: string // Rich text JSON
  attachments: string[]
  isPinned: boolean
  likesCount: number
  commentsCount: number
  createdAt: number
  updatedAt: number
}

// Comments
comments: {
  postId: Id<"posts">
  authorId: Id<"users">
  parentId?: Id<"comments">
  content: string
  likesCount: number
  createdAt: number
}

// Courses
courses: {
  title: string
  description: string
  thumbnail: string
  visibility: "public" | "members" | "paid"
  priceId?: string // Stripe price ID
  order: number
  createdAt: number
}

// Modules
modules: {
  courseId: Id<"courses">
  title: string
  order: number
}

// Lessons
lessons: {
  moduleId: Id<"modules">
  title: string
  content: string
  videoUrl?: string
  attachments: string[]
  order: number
}

// Progress
progress: {
  userId: Id<"users">
  lessonId: Id<"lessons">
  completedAt: number
}

// Events
events: {
  spaceId: Id<"spaces">
  title: string
  description: string
  thumbnail: string
  startTime: number
  endTime: number
  location: string
  locationType: "url" | "address"
  capacity?: number
  createdAt: number
}

// RSVPs
rsvps: {
  eventId: Id<"events">
  userId: Id<"users">
  status: "going" | "maybe" | "not_going"
  createdAt: number
}

// Memberships
memberships: {
  userId: Id<"users">
  stripeCustomerId: string
  stripeSubscriptionId?: string
  tier: string
  status: "active" | "canceled" | "past_due"
  currentPeriodEnd?: number
}

// Notifications
notifications: {
  userId: Id<"users">
  type: string
  title: string
  body: string
  link: string
  isRead: boolean
  createdAt: number
}

// Likes
likes: {
  userId: Id<"users">
  targetType: "post" | "comment"
  targetId: string
  createdAt: number
}

// Point Transactions
pointTransactions: {
  userId: Id<"users">
  action: string
  points: number
  createdAt: number
}

// Settings
settings: {
  key: string
  value: any
}
```

### Deployment Architecture

```
┌─────────────────────────────────────────┐
│              User's Browser              │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          Vercel (Frontend)               │
│  - Next.js App                          │
│  - Edge Functions                        │
│  - Static Assets (CDN)                   │
│  - Custom Domain + SSL                   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Convex Cloud (Backend)           │
│  - Database                              │
│  - Real-time Subscriptions               │
│  - Serverless Functions                  │
│  - File Storage                          │
└─────────────────────────────────────────┘
```

---

## User Stories

### Epic: Community Member Experience

```
US-001: As a member, I want to view a feed of community posts so I can stay updated on discussions.

US-002: As a member, I want to create a post with text, images, and videos so I can share with the community.

US-003: As a member, I want to comment on posts so I can participate in discussions.

US-004: As a member, I want to like posts and comments so I can show appreciation.

US-005: As a member, I want to view my profile and edit my information so others can learn about me.

US-006: As a member, I want to browse the member directory so I can find and connect with others.

US-007: As a member, I want to see what I have in common with other members so I can start conversations.

US-008: As a member, I want to earn points for my participation so I feel recognized.

US-009: As a member, I want to see my rank on the leaderboard so I can compare my engagement.

US-010: As a member, I want to receive notifications when someone interacts with my content.
```

### Epic: Course Experience

```
US-011: As a member, I want to browse available courses so I can find learning content.

US-012: As a member, I want to enroll in a course so I can access its lessons.

US-013: As a member, I want to watch video lessons so I can learn the content.

US-014: As a member, I want to mark lessons as complete so I can track my progress.

US-015: As a member, I want to see my overall course progress so I know how much is left.

US-016: As a member, I want to download course resources so I can reference them offline.
```

### Epic: Events

```
US-017: As a member, I want to view upcoming events so I can plan to attend.

US-018: As a member, I want to RSVP to events so the organizer knows I'm coming.

US-019: As a member, I want to add events to my calendar so I don't forget.

US-020: As a member, I want to receive event reminders so I show up on time.
```

### Epic: Payments

```
US-021: As a visitor, I want to see pricing options so I can decide whether to join.

US-022: As a visitor, I want to purchase a membership so I can access premium content.

US-023: As a member, I want to manage my subscription so I can upgrade, downgrade, or cancel.

US-024: As a member, I want to view my billing history so I can track my payments.
```

### Epic: Admin Experience

```
US-025: As an admin, I want to view community analytics so I can understand engagement.

US-026: As an admin, I want to create and manage spaces so I can organize the community.

US-027: As an admin, I want to create courses and lessons so I can provide educational content.

US-028: As an admin, I want to create events so I can engage my community.

US-029: As an admin, I want to manage members so I can handle roles and issues.

US-030: As an admin, I want to configure payment tiers so I can monetize my community.

US-031: As an admin, I want to customize branding so my community reflects my brand.

US-032: As an admin, I want to moderate content so I can maintain community standards.

US-033: As an admin, I want to configure gamification settings so I can incentivize engagement.

US-034: As an admin, I want to use AI to re-engage inactive members so I can reduce churn.
```

---

## Information Architecture

### Site Map

```
Home (Feed)
├── Spaces
│   ├── [Space Name]
│   │   ├── Posts
│   │   ├── New Post
│   │   └── [Post Detail]
│   └── ...
├── Courses
│   ├── [Course Name]
│   │   ├── Overview
│   │   ├── [Module]
│   │   │   └── [Lesson]
│   │   └── ...
│   └── ...
├── Events
│   ├── Calendar View
│   ├── List View
│   └── [Event Detail]
├── Members
│   ├── Directory
│   └── [Member Profile]
├── Leaderboard
├── Notifications
├── Messages (P1)
├── Profile
│   ├── My Profile
│   ├── Edit Profile
│   └── Settings
└── Admin (admin only)
    ├── Dashboard
    ├── Spaces
    ├── Courses
    ├── Events
    ├── Members
    ├── Payments
    ├── Moderation
    └── Settings
```

### Navigation Structure

**Primary Navigation (Sidebar):**

- Home (Feed)
- Spaces (expandable)
- Courses
- Events
- Members
- Leaderboard

**Secondary Navigation (Header):**

- Search
- Notifications
- Profile dropdown
  - My Profile
  - Settings
  - Admin (if admin)
  - Log out

---

## Success Metrics

### Launch Metrics (First 30 Days)

| Metric                   | Target |
| ------------------------ | ------ |
| GitHub Stars             | 500+   |
| Forks                    | 50+    |
| Email signups (Hit List) | 1,000+ |
| Successful deployments   | 100+   |
| Social shares/mentions   | 200+   |

### Engagement Metrics (Ongoing)

| Metric                           | Target      |
| -------------------------------- | ----------- |
| Monthly active deployments       | Growing MoM |
| GitHub contributors              | 10+         |
| Community Discord members        | 500+        |
| DevFast inquiries from OpenTribe | 2+/month    |

### Business Metrics

| Metric                                  | Target      |
| --------------------------------------- | ----------- |
| DevFast clients attributed to OpenTribe | 1-2/month   |
| Email list growth                       | 500+/month  |
| "Kill Your SaaS" brand awareness        | Qualitative |

---

## Launch Plan

### Phase 1: Pre-Launch (Weeks 1-2)

- [ ] Set up "SaaS Hit List" landing page
- [ ] Start collecting emails
- [ ] Announce the project on Twitter/X and LinkedIn
- [ ] Create GitHub repo with README and roadmap
- [ ] Begin build-in-public content

### Phase 2: Development (Weeks 3-8)

- [ ] Week 3-4: Core infrastructure, auth, database schema
- [ ] Week 5-6: Community features (spaces, posts, comments)
- [ ] Week 7: Courses and events
- [ ] Week 8: Payments, gamification, admin dashboard

### Phase 3: AI Features (Week 9-10)

- [ ] Member matching
- [ ] Profile builder
- [ ] Conversation starters
- [ ] Re-engagement tools

### Phase 4: Polish (Week 11-12)

- [ ] UI/UX refinement
- [ ] Documentation
- [ ] One-click deploy setup
- [ ] Demo instance

### Phase 5: Launch (Week 12+)

- [ ] Product Hunt launch
- [ ] Hacker News post
- [ ] Email blast to Hit List
- [ ] Social media campaign
- [ ] Outreach to tech press/newsletters

---

## Future Roadmap

### Version 1.1

- Direct messaging
- Advanced search
- Completion certificates

### Version 1.2

- Real-time chat rooms
- Polls and surveys
- Quizzes and assessments

### Version 2.0

- Native mobile app (React Native)
- Live streaming integration
- White-label / multi-tenant support
- Marketplace for themes/plugins

---

## Appendix

### Competitor Feature Matrix

| Feature        | OpenTribe | Skool | Circle | Mighty |
| -------------- | --------- | ----- | ------ | ------ |
| Community feed | ✅        | ✅    | ✅     | ✅     |
| Courses        | ✅        | ✅    | ✅     | ✅     |
| Events         | ✅        | ✅    | ✅     | ✅     |
| Payments       | ✅        | ✅    | ✅     | ✅     |
| Gamification   | ✅        | ✅    | ❌     | ✅     |
| AI features    | ✅        | ❌    | ❌     | ✅     |
| Custom domain  | ✅        | ❌    | ✅     | ✅     |
| Self-hosted    | ✅        | ❌    | ❌     | ❌     |
| Open source    | ✅        | ❌    | ❌     | ❌     |
| Free           | ✅        | ❌    | ❌     | ❌     |

### Reference Links

- [Skool](https://skool.com)
- [Circle](https://circle.so)
- [Mighty Networks](https://mightynetworks.com)
- [Convex Documentation](https://docs.convex.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Stripe Documentation](https://stripe.com/docs)

---

_This is a living document. Update as requirements evolve._
