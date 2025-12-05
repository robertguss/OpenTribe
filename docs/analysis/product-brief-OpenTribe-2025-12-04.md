---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: complete
inputDocuments:
  - docs/opentribe-prd.md
  - docs/API.md
  - docs/ARCHITECTURE.md
  - docs/AUTHENTICATION.md
  - docs/DATABASE.md
  - docs/DEPLOYMENT.md
  - docs/DEVELOPMENT.md
  - docs/IDE_TOOLS.md
  - docs/QUICK_START.md
  - docs/SETUP.md
  - docs/TESTING.md
  - docs/TROUBLESHOOTING.md
workflowType: "product-brief"
lastStep: 0
project_name: "OpenTribe"
user_name: "Robert"
date: "2025-12-04"
---

# Product Brief: OpenTribe

**Date:** 2025-12-04
**Author:** Robert

---

## Executive Summary

OpenTribe is a free, open-source community platform designed to replace paid alternatives like Skool ($99/mo), Circle ($49-199/mo), and Mighty Networks ($41-360/mo). It provides creators, coaches, and educators with a self-hosted solution featuring community discussions, course hosting, event management, payments, gamification, and AI-powered engagement — all deployable for free on Vercel and Convex.

**Strategic Context:** OpenTribe is the flagship product in the "Kill Your SaaS" series — a systematic effort to liberate users from recurring SaaS fees by providing production-ready, open-source alternatives. While genuinely serving creators who want to own their communities, OpenTribe also demonstrates the development capabilities of DevFast, a premium MVP development service.

**Key Value Propositions:**

- **For Creators:** Own your community forever. Zero monthly fees. Zero transaction fees. Full control.
- **For Technical Founders (watching the build):** See what's possible when you hire the right developer.
- **For the Market:** A multi-million dollar SaaS, given away for free.

---

## Core Vision

### Problem Statement

Creators, coaches, and community builders are trapped in a recurring fee cycle. They pay $50-360/month just to have a place for their people to gather — that's $600-4,300+ per year, gone. These platforms also extract transaction fees (2.9-10%), restrict custom domains to higher tiers, own member data, limit customization, and can change terms or shut down at any time.

### Problem Impact

- **Financial drain:** Thousands per year in platform fees before earning a dollar
- **Data hostage:** Member relationships owned by the platform, not the creator
- **Brand dilution:** Forced into subdomains and template designs
- **Platform risk:** One policy change or price hike away from rebuilding everything

### Why Existing Solutions Fall Short

| Solution            | The Problem                                              |
| ------------------- | -------------------------------------------------------- |
| **Skool**           | No custom domains, limited customization, no AI features |
| **Circle**          | Gets expensive fast, complex feature set                 |
| **Mighty Networks** | Expensive, overwhelming, AI features locked to premium   |
| **Discord**         | Not built for courses/content, no monetization           |
| **Facebook Groups** | No monetization, no ownership, algorithm-dependent       |

None offer the combination of: free, open-source, self-hosted, full-featured, AND modern AI capabilities.

### Proposed Solution

OpenTribe delivers everything creators need without the recurring costs:

- **Community & Discussions:** Spaces, posts, comments, reactions, activity feeds
- **Courses & Content:** Modules, lessons, progress tracking, video hosting
- **Events & Calendar:** Scheduling, RSVPs, calendar integration, reminders
- **Payments:** Direct Stripe integration with zero platform fees
- **Gamification:** Points, levels, leaderboards to drive engagement
- **AI-Powered Engagement:** Member matching, profile generation, re-engagement tools
- **Full Customization:** Custom domains, branding, themes

Built on a modern stack (Next.js, Convex, Tailwind) and deployable in minutes via Vercel.

### Key Differentiators

| Differentiator                 | Why It Matters                                       |
| ------------------------------ | ---------------------------------------------------- |
| **100% Free & Open Source**    | No monthly fees, ever. Fork it, extend it, own it.   |
| **Self-Hosted Data Ownership** | Your members, your data, your terms.                 |
| **Zero Transaction Fees**      | Connect your Stripe directly — keep every dollar.    |
| **AI Features Included**       | Competing with Mighty's "People Magic" at $0/month.  |
| **Modern Stack**               | Built on Convex for real-time, scalable performance. |
| **First of Many**              | Flagship of the "Kill Your SaaS" series.             |

---

## Target Users

### Primary User: The Escape Artist Creator

**Name:** Sarah
**Role:** Online coach / course creator / community builder
**Community Size:** 50-500 members
**Technical Skill:** Low to moderate (can follow deployment instructions)
**Current Situation:** Paying $99-199/month for Skool, Circle, or Mighty Networks

**The Trap She's In:**

- Monthly fees eating into margins before she earns a dollar
- Transaction fees (2.9-10%) stacking on top of Stripe fees
- Stuck on a subdomain that dilutes her brand
- Member data locked in a platform she doesn't control
- One price hike away from scrambling for alternatives

**What She Wants:**

- Stop the bleeding — eliminate recurring platform costs
- Own her community — her members, her data, her rules
- Look professional — custom domain, her branding, not theirs
- Keep it simple — she's not a developer, needs easy deployment

**Her "Aha!" Moment:**
"Wait — this does everything Skool does, and I own it? For free?"

**Success For Sarah:**

- Deploys OpenTribe in under 30 minutes
- Migrates her community without losing members
- Keeps 100% of her course revenue (minus only Stripe's cut)
- Finally has a community that feels like _hers_

---

### Primary Audience: The Watching Founder

**Name:** Alex
**Role:** Technical founder / indie hacker / startup builder
**Situation:** Following Robert's build-in-public journey
**Technical Skill:** High (developer or technical co-founder)

**What Catches Their Attention:**

- The speed — "He built all this in how long?"
- The polish — "This isn't a demo, it's production-ready"
- The features — "AI matching, gamification, payments... this is complete"
- The live demo — They can actually use it, click around, see it work

**What They're Thinking:**

- "If he built this for free, imagine what he could build for my idea"
- "This is the quality I want for my MVP"
- "The $10k for DevFast suddenly looks like a bargain"

**Their Journey:**

1. Sees OpenTribe content on social media
2. Clicks through to live demo, explores features
3. Impressed by quality and speed
4. Sees CTA: "Want something like this? DevFast builds MVPs in 2 weeks"
5. Joins waitlist or books a call

**Success For Alex:**

- Becomes a DevFast client
- Gets their own idea built with the same quality and speed

---

### Secondary User: The Fork-and-Forget Developer

**Name:** Marcus
**Role:** Developer who clones the repo
**What He Does:** Forks OpenTribe, customizes it, never looks back

**Priority Level:** Low. If he gets value, great. If he never engages again, that's fine too. OpenTribe is open source — forks are expected, not optimized for.

---

### User Journey: Sarah's Escape

| Stage              | Experience                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| **Awareness**      | Sees "Kill Your SaaS" content. Realizes there's an alternative to paying $99/month forever.                     |
| **Consideration**  | Explores OpenTribe demo. Compares features to her current platform. Realizes it has everything she needs.       |
| **Decision**       | Follows deployment guide. Deploys to Vercel + Convex. Connects her domain.                                      |
| **Onboarding**     | Sets up spaces, imports content, invites members. Customizes branding.                                          |
| **Success Moment** | First month with $0 platform fees. Sees her community on her own domain. Thinks: "Why didn't I do this sooner?" |
| **Long-term**      | Runs her entire business on OpenTribe. Recommends it to other creators. Never pays platform rent again.         |

---

## Success Metrics

### North Star Metric

**Real Adoption:** People cancel their Skool, Circle, or Mighty Networks subscriptions and run their communities on OpenTribe instead.

This is the ultimate validation — not vanity metrics, not launch buzz, but genuine product-market fit demonstrated through actual behavior change.

---

### Product Success Metrics

| Metric                         | What It Proves                                         |
| ------------------------------ | ------------------------------------------------------ |
| **Subscription Cancellations** | People trust OpenTribe enough to leave paid platforms  |
| **Active Communities**         | The product works in production, not just as a demo    |
| **Feature Completeness**       | Genuine replacement, not a toy or proof-of-concept     |
| **Deployment Success Rate**    | Sarah can actually deploy it without being a developer |

**Quality Indicators:**

- Full feature parity with Skool's core offering
- Production-ready stability (not "works on my machine")
- Documentation clear enough for non-technical creators
- Real communities running real businesses on it

---

### Business & Brand Metrics

| Metric                 | Target              | Why It Matters                                          |
| ---------------------- | ------------------- | ------------------------------------------------------- |
| **Email Waitlist**     | As many as possible | Audience for future "Kill Your SaaS" projects + DevFast |
| **Hacker News Launch** | Front page / #1     | Validates the concept, drives initial awareness         |
| **Social Engagement**  | Organic buzz        | "People are talking about it"                           |
| **DevFast Inquiries**  | Inbound leads       | Business justification for the build                    |

---

### Reputation Metrics (Compounding)

The real long-term metric is **brand recognition**:

> "Oh boy, Robert is at it again — what app is he going after now?"

**Indicators:**

- Followers anticipating the next "Kill Your SaaS" project
- Inbound requests: "Can you do [X SaaS] next?"
- DevFast leads who found you through OpenTribe
- Media/newsletter mentions of the "Kill Your SaaS" brand

**Compounding Effect:**

- Project 1 (OpenTribe): Establishes the brand
- Project 2: "He did it again"
- Project 3+: Reputation locked in, inbound leads compound

---

### What Success Looks Like

**At Launch:**

- Front page of Hacker News
- Waitlist growing organically
- Developers starring/forking the repo
- Social media buzz: "Wait, this is free?"

**At 3 Months:**

- Real communities running on OpenTribe
- First confirmed "I canceled Skool for this"
- DevFast inquiries attributable to OpenTribe
- Planning the next "Kill Your SaaS" project

**At 12 Months:**

- Multiple "Kill Your SaaS" projects live
- Established reputation as the anti-SaaS builder
- Compounding audience across all projects
- DevFast pipeline consistently fed by the brand

---

## Scope

### v1.0 Launch Scope (Complete Feature Set)

OpenTribe v1.0 launches as a **complete Skool/Circle replacement** — not an MVP. The quality and completeness of the app is the marketing.

**Core Features (All P0):**

| Category                    | Features                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| **Community & Discussions** | Spaces, Posts, Comments, Reactions, Activity Feed, @mentions, #hashtags, Post pinning               |
| **Member Management**       | Profiles, Member Directory, Roles & Permissions, Custom Fields                                      |
| **Courses & Content**       | Course structure, Modules, Lessons, Video/Text content, Progress tracking, Completion tracking      |
| **Events & Calendar**       | Event creation, Calendar views, RSVPs, Reminders, Add-to-calendar                                   |
| **Payments**                | Stripe integration (via Convex component), Subscriptions, One-time payments, Pricing tiers, Coupons |
| **Gamification**            | Points system, Levels, Leaderboards, Configurable rewards                                           |
| **Admin Dashboard**         | Analytics, Member management, Content moderation, Settings                                          |
| **Notifications**           | In-app notifications, Email notifications (via Resend component)                                    |
| **Customization**           | Custom domains, Branding, Themes, Custom CSS                                                        |
| **Authentication**          | Email/password, Social login, Magic links                                                           |

**P1 Features (Promoted to Launch):**

| Feature              | Why It's Essential                                                        |
| -------------------- | ------------------------------------------------------------------------- |
| **Global Search**    | Users expect to find content — table stakes for a complete platform       |
| **Direct Messaging** | Community without DMs feels incomplete — essential for member connections |

**Convex Components (Build Acceleration):**

| Component    | Purpose                                                   |
| ------------ | --------------------------------------------------------- |
| **Stripe**   | Payment processing without building from scratch          |
| **Presence** | Real-time "who's online" indicators                       |
| **Resend**   | Email delivery for notifications and transactional emails |

---

### v1.1 Scope (AI & Insights Update)

Post-launch feature bundle that adds intelligent engagement tools:

| Feature                      | Description                                                          |
| ---------------------------- | -------------------------------------------------------------------- |
| **AI Member Matching**       | "Members like you" suggestions based on profile and activity         |
| **AI Profile Builder**       | Answer questions → generate complete bio                             |
| **AI Conversation Starters** | Suggest DM openers based on shared interests                         |
| **AI Re-engagement**         | Identify inactive members, generate personalized outreach            |
| **AI Content Assistant**     | Improve posts, suggest hashtags, generate ideas                      |
| **Geospatial Member Map**    | Visualize where community members are located (via Convex component) |

**v1.1 Content Marketing Moment:**

> "OpenTribe now has AI-powered engagement — competing with Mighty Networks' 'People Magic' — for free."

---

### Out of Scope (Future Consideration)

| Feature                            | Rationale                                                          |
| ---------------------------------- | ------------------------------------------------------------------ |
| **Native Mobile Apps**             | PWA-first approach; native can come later if demand warrants       |
| **Real-time Video/Streaming**      | Complex infrastructure; integrate with existing tools (Zoom, etc.) |
| **White-label / Multi-tenant**     | v2.0+ consideration for agency/enterprise use cases                |
| **Marketplace for Themes/Plugins** | Ecosystem play for much later                                      |

---

### Launch Success Criteria

v1.0 is ready to ship when:

- [ ] All P0 features functional and tested
- [ ] Search and Direct Messaging complete
- [ ] Stripe payments processing successfully
- [ ] Real-time presence working
- [ ] Email notifications delivering
- [ ] Deployment documentation clear enough for Sarah
- [ ] Live demo instance running on production URL
- [ ] DevFast CTAs integrated into the app

---

_Product Brief completed on 2025-12-04 through collaborative discovery with BMAD workflow._
