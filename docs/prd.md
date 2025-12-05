---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
inputDocuments:
  - docs/opentribe-prd.md
  - docs/analysis/product-brief-OpenTribe-2025-12-04.md
workflowType: "prd"
lastStep: 11
project_name: "OpenTribe"
user_name: "Robert"
date: "2025-12-04"
---

# Product Requirements Document - OpenTribe

**Author:** Robert Guss
**Date:** 2025-12-04

---

## Executive Summary

OpenTribe is a free, open-source community platform that gives creators, coaches, and educators everything they need to run their communities — without monthly fees, transaction costs, or platform lock-in.

The platform combines community discussions, course hosting, event management, member directories, payments, and gamification into a single self-hosted solution deployable on Vercel and Convex's generous free tiers.

OpenTribe is the flagship product in the "Kill Your SaaS" series — a systematic effort to liberate users from recurring SaaS fees by providing production-ready, open-source alternatives.

### What Makes This Special

**The Escape from Platform Rent**

Creators are trapped paying $50-360/month for community platforms. Over a year, that's $600-4,300+ gone — just to have a place for their people to gather. These platforms also extract transaction fees (2.9-10%), restrict custom domains, own member data, and can change terms at any time.

OpenTribe breaks this cycle:

| What Others Charge                 | What OpenTribe Offers        |
| ---------------------------------- | ---------------------------- |
| $49-360/month                      | $0/month forever             |
| 2.9-10% transaction fees           | 0% (your Stripe, your money) |
| Custom domains on premium tiers    | Custom domains included      |
| Platform owns your data            | You own everything           |
| Closed source, take it or leave it | Open source, fork and extend |

**The Real Differentiator:** This isn't a stripped-down alternative. It's a complete Skool/Circle replacement with feature parity — given away for free.

### Project Classification

**Technical Type:** Full-stack Web Application (SaaS B2B/B2C hybrid)
**Domain:** Community Platform / EdTech
**Complexity Level:** Medium-High

**Technology Stack:**

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Backend: Convex (real-time database + serverless functions)
- Authentication: Better Auth with Convex integration
- Payments: Stripe (via Convex component)
- UI: shadcn/ui (New York style)
- Deployment: Vercel + Convex Cloud

---

## Success Criteria

### User Success

**Sarah's Success (Primary User - Creator):**

- Deploys OpenTribe to her own domain in under 30 minutes
- Migrates her community without losing member relationships
- Keeps 100% of her revenue (minus only Stripe's 2.9% + 30¢)
- Members comment that her community "feels more professional"
- First month with $0 platform fees — she keeps the $99 she was paying Skool

**Member Success:**

- New members complete onboarding and make their first post within 24 hours
- Members find relevant content through spaces and search
- Course students complete lessons and track their progress
- Event attendees RSVP and receive reminders that get them to show up

### Business Success

**For OpenTribe (the project):**

- Real communities cancel Skool/Circle/Mighty subscriptions and run on OpenTribe instead
- GitHub stars indicate developer interest and validation
- "Kill Your SaaS" brand recognition grows with each project
- DevFast receives inbound inquiries from founders who saw OpenTribe built

**Measurable Indicators:**

- Active deployments running real communities (not just forks)
- Confirmed "I switched from [platform]" testimonials
- DevFast client inquiries attributable to OpenTribe content

### Technical Success

- One-click deploy to Vercel works reliably for non-technical users
- Real-time features (notifications, presence) work without configuration
- Stripe integration handles subscriptions without manual intervention
- Platform handles 500+ concurrent users without degradation
- Documentation enables self-service troubleshooting

### Measurable Outcomes

| Outcome                       | Target             | Measurement                           |
| ----------------------------- | ------------------ | ------------------------------------- |
| Deployment success rate       | >90%               | Users complete deploy without support |
| Time to first community       | <30 minutes        | From deploy to first member invited   |
| Feature completeness vs Skool | 100% core features | Feature comparison matrix             |
| Uptime                        | 99.5%+             | Convex/Vercel monitoring              |

---

## Product Scope

### MVP - Version 1.0 (Complete Platform)

OpenTribe v1.0 launches as a **complete Skool/Circle replacement** — not a minimal prototype. The quality and completeness IS the marketing.

**Core Capabilities:**

- Community & Discussions (Spaces, Posts, Comments, Reactions, Activity Feed)
- Member Management (Profiles, Directory, Roles & Permissions)
- Courses & Content (Modules, Lessons, Progress Tracking)
- Events & Calendar (Creation, RSVPs, Reminders, Calendar Integration)
- Payments (Stripe Subscriptions, One-time, Tiers, Coupons)
- Gamification (Points, Levels, Leaderboards)
- Admin Dashboard (Analytics, Member Management, Settings)
- Notifications (In-app + Email via Resend)
- Customization (Branding, Custom Domains, Themes)
- Authentication (Email/Password, Social Login, Magic Links)
- **Global Search** (promoted from P1 — table stakes for complete platform)
- **Direct Messaging** (promoted from P1 — essential for member connections)

### Version 1.1 - AI & Insights Update

Post-launch feature bundle adding intelligent engagement:

- **AI Member Matching:** "Members like you" suggestions based on profile and activity
- **AI Profile Builder:** Answer questions → generate complete bio
- **AI Conversation Starters:** Suggest DM openers based on shared interests
- **AI Re-engagement:** Identify inactive members, generate personalized outreach
- **AI Content Assistant:** Improve posts, suggest hashtags, generate ideas
- **Geospatial Member Map:** Visualize where community members are located

**Content Marketing Moment:** "OpenTribe now has AI-powered engagement — competing with Mighty Networks' 'People Magic' — for free."

### Version 2.0 - Platform Expansion

Future consideration based on adoption:

- Native mobile apps (React Native)
- Real-time chat rooms
- Live streaming integration
- White-label / multi-tenant support
- Marketplace for themes/plugins

---

## User Journeys

### Journey 1: Sarah Chen - Escaping Platform Rent

Sarah is a business coach who's been running her "Confident Founders" community on Skool for 18 months. Every month, $99 disappears from her account before she earns a dollar. When a client asks why her community URL says "skool.com" instead of her own brand, she feels embarrassed. Late one night, frustrated after calculating she's paid Skool $1,782 over her membership, she searches for alternatives and discovers OpenTribe.

The next morning, Sarah clicks "Deploy to Vercel" and follows the setup wizard. Twenty minutes later, she's staring at her own community platform running on community.confidentfounders.com. She uploads her logo, sets her brand colors, and creates her first three spaces: "Welcome Lounge," "Weekly Wins," and "Ask Sarah Anything."

The real test comes when she invites her first 50 members to migrate. She sends a personal email explaining the move and offering a special "founding member" badge. Within a week, 43 members have joined and are posting. When Sarah checks her Stripe dashboard at month-end, she sees the full $2,400 in course revenue — no platform cut, no transaction fee beyond Stripe's standard rate.

Three months later, Sarah has 180 members, runs weekly live events through the platform, and has launched two courses. She calculates she's saved $297 in platform fees and kept an extra $180 in transaction fees she would have lost. But the real win? When prospects visit her community, they see her brand, not someone else's.

**Journey reveals requirements for:**

- One-click deployment with guided setup
- Custom domain configuration
- Branding and visual customization
- Member invitation and onboarding
- Space creation and management
- Stripe payment integration
- Course hosting and delivery
- Event scheduling and management

---

### Journey 2: Marcus Thompson - The Technical Founder

Marcus runs a developer community of 800 members for his open-source project. He's been using Discord, but it's chaos — no way to organize learning content, discussions get buried, and there's no good way to recognize top contributors. He needs something purpose-built but refuses to pay monthly fees for his free community.

Marcus clones the OpenTribe repo on a Friday evening. By Sunday night, he's deployed a customized version with his project's branding, added a "Code Snippets" space with syntax highlighting for posts, and configured the gamification system to award points for helping others and contributing to documentation.

He announces the migration to his Discord server: "We're moving to our own platform. Same community, better organized, and I own the infrastructure." The response is enthusiastic — developers appreciate the open-source ethos.

Within the first month, Marcus notices something interesting: engagement is up 40%. The leaderboard has created friendly competition, and members are actually completing the tutorial courses he created. One contributor messages him: "The points system is addictive. I spent my Saturday writing docs just to hit Level 5."

**Journey reveals requirements for:**

- GitHub-based deployment for technical users
- Codebase extensibility and customization
- Rich text with code block support
- Configurable gamification rules
- Leaderboard and recognition systems
- Course progress tracking
- Member activity analytics

---

### Journey 3: Admin Operations - Community Management

David is a community manager Sarah hired to help with her growing "Confident Founders" community. His day starts with the admin dashboard, checking overnight activity and flagged content.

He sees three items in the moderation queue: a spam post from a new account (delete + ban), a heated discussion that was reported (he reads the context, decides it's fine, dismisses the report), and a member requesting a refund (he checks their payment history, processes through Stripe portal).

Next, David reviews the weekly analytics. Active members are up 12%, but he notices course completion rates dropped. He creates a post in the "Course Feedback" space asking what's blocking people and pins it. Then he schedules three events for the upcoming week — two coaching calls and a member networking session.

A new member messages him confused about accessing the premium content. David checks her membership status, sees her payment went through but access wasn't provisioned (edge case bug). He manually grants access, notes the issue to report, and sends her a welcome message with the AI-suggested conversation starter: "I see you're also in the SaaS space — have you connected with the other founders building in that vertical?"

**Journey reveals requirements for:**

- Admin dashboard with activity overview
- Content moderation queue
- Member management (roles, access, bans)
- Stripe integration for payment management
- Analytics and engagement metrics
- Event creation and management
- Direct messaging for support
- AI-assisted member engagement

---

### Journey 4: New Member - First Day Experience

Priya just paid $49/month to join Sarah's "Confident Founders" community. She gets a welcome email with her login link, clicks through, and lands on the community home page.

The first thing she sees is a "Welcome, Priya!" banner with a checklist: complete your profile, introduce yourself, explore the spaces. She clicks "Complete Profile" and the AI profile builder asks her three questions about her business and goals. Within two minutes, she has a professional bio she can tweak.

She notices the "New Members" space and sees a pinned post: "Introduce Yourself Here!" She writes a quick intro about her fintech startup. Within an hour, she has three welcomes and a DM from another fintech founder: "Hey! Saw your intro — I'm building in the same space. Would love to connect."

Priya explores the course library, starts the "Founder Fundamentals" course, and completes the first two lessons during lunch. She gets a notification: "You earned 50 points! You're now Level 2: Rising Star." She smiles — she's already more engaged here than she ever was in the Facebook group she left.

**Journey reveals requirements for:**

- Welcome email with login link
- Guided onboarding checklist
- AI profile builder
- Member introductions space
- Notifications for engagement
- Direct messaging between members
- Course enrollment and progress
- Points and level-up notifications
- Member matching suggestions

---

### Journey Requirements Summary

| Capability Area          | Journeys That Require It  |
| ------------------------ | ------------------------- |
| Deployment & Setup       | Sarah, Marcus             |
| Branding & Customization | Sarah, Marcus             |
| Member Management        | Sarah, Admin, New Member  |
| Content & Discussions    | All journeys              |
| Courses & Learning       | Sarah, Marcus, New Member |
| Events & Calendar        | Sarah, Admin              |
| Payments & Access        | Sarah, Admin              |
| Gamification             | Marcus, New Member        |
| Admin & Moderation       | Admin                     |
| Notifications            | All journeys              |
| AI Features (v1.1)       | Admin, New Member         |
| Search & Discovery       | All journeys              |
| Direct Messaging         | Admin, New Member         |

---

## Full-Stack Web Application Requirements

### Architecture Considerations

**Real-Time Foundation:**
OpenTribe requires real-time capabilities throughout:

- Live activity feeds that update without refresh
- Instant notifications when someone interacts with your content
- Presence indicators showing who's online
- Real-time comment threads during discussions

Convex provides this natively through reactive queries, eliminating the need for separate WebSocket infrastructure.

**Multi-Tenancy Model:**
Each OpenTribe deployment is a single-tenant instance. The deploying creator owns their data completely. This differs from SaaS platforms where all communities share infrastructure.

**Data Ownership:**

- All data stored in creator's own Convex deployment
- No data shared with OpenTribe project or DevFast
- Creator can export all data at any time
- Creator can delete deployment and all data disappears

### Authentication Architecture

**Better Auth + Convex Integration:**

- Email/password with secure session management
- Social login (Google, GitHub) via Better Auth providers
- Magic link passwordless authentication
- Session validation through Convex HTTP endpoints
- No external auth service dependencies (no Clerk)

**Authorization Model:**

- Role-based access control (Admin, Moderator, Member)
- Custom roles definable by admin
- Space-level permissions (who can post, who can view)
- Payment-tier gating (free vs. paid content access)

### Payment Architecture

**Stripe Integration via Convex Component:**

- Creator connects their own Stripe account
- Zero platform transaction fees (only Stripe's standard rates)
- Subscription management (monthly, yearly)
- One-time payments for courses/content
- Coupon and discount code support
- Stripe Customer Portal for member self-service

**Access Provisioning:**

- Automatic access grant on successful payment
- Automatic access revocation on subscription cancellation
- Grace period handling for failed payments
- Webhook-driven state synchronization

### Implementation Considerations

**Deployment Model:**

- One-click deploy to Vercel via deploy button
- Convex backend auto-provisioned
- Environment variables configured through setup wizard
- Custom domain configuration through Vercel

**File Storage:**

- Convex file storage for user uploads
- Profile photos, course thumbnails, post attachments
- Automatic CDN distribution through Convex

**Email Delivery:**

- Resend integration via Convex component
- Transactional emails (welcome, password reset, receipts)
- Notification digests (immediate, daily, weekly options)
- Event reminders

---

## Functional Requirements

### User Management

- FR1: Visitors can register with email/password or social login
- FR2: Users can authenticate via magic link (passwordless)
- FR3: Users can reset their password via email
- FR4: Users can view and edit their profile information
- FR5: Users can upload and change their profile photo
- FR6: Users can set profile visibility (public/private)
- FR7: Users can configure notification preferences
- FR8: Users can view other members' public profiles
- FR9: Users can search and filter the member directory
- FR10: Users can follow other members

### Community & Content

- FR11: Admins can create, edit, and delete spaces
- FR12: Admins can set space visibility (public, members-only, paid-only)
- FR13: Admins can reorder spaces via drag-and-drop
- FR14: Members can create posts with rich text, images, and video embeds
- FR15: Members can edit and delete their own posts
- FR16: Members can comment on posts
- FR17: Members can reply to comments (nested 2 levels)
- FR18: Members can like posts and comments
- FR19: Members can @mention other members in posts and comments
- FR20: Members can use #hashtags in posts
- FR21: Admins can pin posts to the top of spaces
- FR22: Members can view an aggregated activity feed across all spaces
- FR23: Members can filter the activity feed by space or content type
- FR24: Members can search posts, comments, members, courses, and events

### Courses & Learning

- FR25: Admins can create courses with title, description, and thumbnail
- FR26: Admins can organize courses into modules and lessons
- FR27: Admins can reorder modules and lessons via drag-and-drop
- FR28: Admins can create lessons with rich text, video, and file attachments
- FR29: Admins can set course visibility (public, members-only, paid-only)
- FR30: Members can enroll in available courses
- FR31: Members can mark lessons as complete
- FR32: Members can view their progress per course and module
- FR33: Members can resume courses where they left off
- FR34: Members can download course resources and attachments

### Events & Calendar

- FR35: Admins can create events with title, description, date/time, and location
- FR36: Admins can create recurring events
- FR37: Admins can set event capacity limits
- FR38: Members can view events in calendar or list view
- FR39: Members can RSVP to events (going, maybe, not going)
- FR40: Members can add events to their personal calendar (Google, Apple, Outlook)
- FR41: Members can view past events archive
- FR42: System sends event reminder notifications to RSVPed members

### Payments & Monetization

- FR43: Admins can connect their Stripe account
- FR44: Admins can create pricing tiers (free, one-time, subscription)
- FR45: Admins can create and manage coupon codes
- FR46: Admins can set free trial periods for subscriptions
- FR47: Visitors can purchase memberships or content
- FR48: Members can manage their subscription via Stripe portal
- FR49: Members can view their billing history and invoices
- FR50: System automatically provisions access on successful payment
- FR51: System automatically revokes access on subscription cancellation

### Gamification & Engagement

- FR52: System awards points for configured actions (posts, comments, likes, completions)
- FR53: Admins can configure point values per action
- FR54: Members progress through levels based on accumulated points
- FR55: Admins can customize level names and thresholds
- FR56: Members can view their points, level, and rank
- FR57: Members can view the community leaderboard
- FR58: Members can filter leaderboard by time period (all-time, month, week)

### Notifications

- FR59: Members receive in-app notifications for relevant activity
- FR60: Members can view notification history and mark as read
- FR61: Members receive email notifications based on preferences
- FR62: Members can configure email digest frequency (immediate, daily, weekly, off)
- FR63: System sends transactional emails (welcome, password reset, payment receipts)

### Administration

- FR64: Admins can view community analytics (members, activity, revenue)
- FR65: Admins can manage member roles and permissions
- FR66: Admins can remove or ban members
- FR67: Admins can export member list to CSV
- FR68: Admins can view and moderate reported content
- FR69: Admins can configure community branding (logo, colors, favicon)
- FR70: Admins can connect a custom domain
- FR71: Admins can configure gamification settings

### Direct Messaging

- FR72: Members can send direct messages to other members
- FR73: Members can view message threads and history
- FR74: Members can disable DMs in their settings
- FR75: System shows read receipts for messages

---

## Non-Functional Requirements

### Performance

- NFR1: Page loads complete within 2 seconds on standard connections
- NFR2: Real-time updates (new posts, comments, notifications) appear within 500ms
- NFR3: Search results return within 1 second for queries
- NFR4: File uploads complete within 10 seconds for files under 10MB
- NFR5: System supports 500 concurrent users without degradation

### Security

- NFR6: All data transmitted over HTTPS (TLS 1.3)
- NFR7: Passwords hashed using industry-standard algorithms (bcrypt/argon2)
- NFR8: Session tokens expire after configurable period (default 7 days)
- NFR9: Rate limiting prevents brute force attacks on authentication
- NFR10: File uploads validated for type and scanned for malware
- NFR11: SQL injection and XSS attacks prevented through Convex's design
- NFR12: Stripe webhook signatures validated before processing

### Scalability

- NFR13: Database scales automatically with Convex's managed infrastructure
- NFR14: File storage scales automatically with Convex file storage
- NFR15: System handles 10x user growth without architecture changes
- NFR16: Costs remain within Convex/Vercel free tier for communities under 1,000 members

### Reliability

- NFR17: System achieves 99.5% uptime (inherited from Convex/Vercel SLAs)
- NFR18: Data backed up automatically by Convex
- NFR19: Failed payment webhooks retry automatically
- NFR20: Graceful degradation when third-party services unavailable

### Accessibility

- NFR21: Interface meets WCAG 2.1 AA standards
- NFR22: All interactive elements keyboard accessible
- NFR23: Screen reader compatible with proper ARIA labels
- NFR24: Color contrast ratios meet accessibility guidelines
- NFR25: Mobile-responsive design works on all screen sizes

### Deployment & Operations

- NFR26: One-click deployment completes in under 5 minutes
- NFR27: Zero-downtime deployments for updates
- NFR28: Environment configuration through UI wizard (no manual env file editing)
- NFR29: Deployment documentation enables non-technical users to succeed

---

## Appendix: Competitive Feature Matrix

| Feature          | OpenTribe v1.0 | Skool  | Circle     | Mighty Networks |
| ---------------- | -------------- | ------ | ---------- | --------------- |
| Community feed   | Yes            | Yes    | Yes        | Yes             |
| Courses          | Yes            | Yes    | Yes        | Yes             |
| Events           | Yes            | Yes    | Yes        | Yes             |
| Payments         | Yes            | Yes    | Yes        | Yes             |
| Gamification     | Yes            | Yes    | No         | Yes             |
| Custom domain    | Yes            | No     | Paid tiers | Paid tiers      |
| Search           | Yes            | Yes    | Yes        | Yes             |
| Direct messaging | Yes            | Yes    | Yes        | Yes             |
| AI features      | v1.1           | No     | No         | Yes (paid)      |
| Self-hosted      | Yes            | No     | No         | No              |
| Open source      | Yes            | No     | No         | No              |
| Price            | $0             | $99/mo | $49-199/mo | $41-360/mo      |
| Transaction fees | 0%             | 2.9%+  | 0.5-4%     | Varies          |

---

_This PRD was created through the BMAD workflow methodology and is ready to guide UX design, technical architecture, and development planning._
