---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments:
  - docs/prd.md
workflowType: "ux-design"
lastStep: 14
project_name: "OpenTribe"
user_name: "Robert"
date: "2025-12-04"
status: complete
---

# UX Design Specification OpenTribe

**Author:** Robert
**Date:** 2025-12-04

---

## Executive Summary

### Project Vision

OpenTribe is a free, open-source community platform designed to liberate creators from recurring SaaS fees. It provides complete Skool/Circle feature parity while offering what commercial platforms cannot: full ownership of brand, data, domain, and revenue. The UX must embody "freedom with polish" — professional enough to replace premium platforms, simple enough for non-technical creators.

### Target Users

**Primary: Community Creators (Sarah)**

- Business coaches, educators, course creators
- Semi-technical (comfortable with web tools, not developers)
- Currently paying $50-360/month for community platforms
- Pain points: Platform fees, lack of branding control, data ownership concerns
- Success metric: "My community looks and feels like MY brand"

**Secondary: Technical Founders (Marcus)**

- Developers running open-source or technical communities
- Highly technical, will customize and extend
- Coming from Discord/Slack chaos seeking organization
- Pain points: Poor content organization, no gamification, scattered discussions
- Success metric: "I own the infrastructure and can make it do what I need"

**End Users: Community Members (Priya)**

- Joining communities built on OpenTribe
- Varying technical ability
- Expect polished, intuitive experience
- Pain points: Confusing onboarding, difficulty finding content, feeling lost
- Success metric: "I found my people and know exactly where to go"

### Key Design Challenges

1. **Deployment-to-Value Speed** — Creator must go from zero to functional community in under 30 minutes without technical friction
2. **Dual-Experience Architecture** — Admin complexity must never leak into member simplicity
3. **Platform-Grade Polish** — Every interaction must feel as refined as $99/month competitors
4. **Meaningful Gamification** — Points and levels should drive genuine engagement, not feel manipulative

### Design Opportunities

1. **Brand Ownership Touchpoints** — Every surface reinforces "this is YOUR community"
2. **First-Hour Member Delight** — Onboarding flow creates immediate belonging and value
3. **Social Infrastructure** — Leaderboards, badges, and recognition become community storytelling tools
4. **Admin Confidence** — Dashboard and tools that make community management feel effortless

## Core User Experience

### Defining Experience

The core experience of OpenTribe centers on the **activity feed** — the intersection where creator content meets member engagement. For creators, the core action is "checking the community pulse" through their dashboard. For members, it's scrolling the feed to discover what's happening, who's active, and where to engage next.

The critical success loop: Creator posts → Member engages → Creator sees engagement → Both experience value. Every UX decision should optimize this loop.

### Platform Strategy

**Web-First Architecture:**

- Primary: Desktop/laptop browser for management and learning
- Secondary: Mobile-responsive for feed browsing, quick engagement, and notifications
- Real-time: All content updates appear instantly without page refresh
- No native apps required for MVP; responsive web provides sufficient mobile experience

**Platform Requirements:**

- Touch-friendly targets (44px minimum) for mobile interactions
- Keyboard shortcuts for power users on desktop
- Responsive breakpoints: Mobile (<768px), Tablet (768-1024px), Desktop (>1024px)
- PWA-ready architecture for future "install to home screen" capability

### Effortless Interactions

**Zero-Friction Design Targets:**

- Post creation feels like messaging friends (rich text, drag-drop media)
- Space navigation feels like switching channels (instant, memorable)
- Search returns results in under 1 second
- Course progression feels like streaming (play, complete, auto-advance)
- Notifications appear on lock screen-like banner without interruption
- Profile editing as simple as updating a social bio
- Member invitation via shareable link (no email collection required)

**Friction Points Eliminated:**

- Auto-save replaces manual save buttons
- Real-time updates eliminate page refreshes
- Contextual menus eliminate settings hunting
- Consistent navigation prevents disorientation

### Critical Success Moments

**Creator Success Moments:**

1. Deployment complete — seeing their brand on their domain
2. First member arrives — someone joins and engages
3. First payment received — revenue hits their Stripe dashboard
4. Efficiency realized — managing community takes less time than previous platform

**Member Success Moments:**

1. Belonging established — welcomed and connected within first hour
2. Learning progress — completing lessons with visible advancement
3. Recognition earned — level-up or leaderboard appearance
4. Community found — meaningful connection with like-minded member

**Critical Flows (Failure = Churn):**

- Member: Signup → Onboarding → First engagement (target: 24 hours)
- Creator: Deploy → Configure → First invite (target: 30 minutes)
- Payment: Purchase → Instant access grant (target: immediate)

### Experience Principles

1. **Instant Gratification** — Every action produces visible feedback within 500ms. No loading states, no uncertainty about whether actions succeeded.

2. **Progressive Disclosure** — Simple paths first, complexity on demand. New users see streamlined interfaces; advanced options appear contextually when needed.

3. **Ownership Reinforcement** — Every screen reinforces "this is YOUR community" through persistent branding, custom domain visibility, and creator-controlled elements.

4. **Progress Celebration** — Milestones are acknowledged with appropriate fanfare. Level-ups, completions, and achievements create positive reinforcement loops.

5. **Smart Defaults, Full Control** — 80% of users succeed with defaults. 100% can customize when ready. Configuration is optional, not required.

## Desired Emotional Response

### Primary Emotional Goals

**For Creators (Sarah):**

- **Liberation:** Freedom from platform rent and restrictions
- **Pride:** A community that reflects their professional brand
- **Confidence:** Certainty that they made the right choice
- **Control:** Complete ownership of data, revenue, and member relationships

**For Members (Priya):**

- **Belonging:** Feeling welcomed and part of something meaningful
- **Progress:** Visible growth through learning and engagement
- **Recognition:** Contributions acknowledged and celebrated
- **Connection:** Finding kindred spirits within the community

### Emotional Journey Mapping

| Stage          | Creator Emotion          | Member Emotion              |
| -------------- | ------------------------ | --------------------------- |
| Discovery      | Hope + Skepticism        | Curiosity                   |
| First Use      | Anxiety → Relief → Pride | Welcome → Belonging         |
| Core Loop      | Empowerment, Efficiency  | Engagement, Anticipation    |
| Achievement    | Pride, Vindication       | Recognition, Accomplishment |
| Return Visit   | Anticipation             | Habit, FOMO                 |
| Problem Moment | Supported, Capable       | Guided, Confident           |

### Micro-Emotions

**Critical Emotional States to Cultivate:**

- **Confidence:** Every action confirms success; clear feedback loops
- **Trust:** Visible ownership signals; no hidden agendas
- **Delight:** Celebration of milestones; moments of pleasant surprise
- **Belonging:** Presence awareness; never posting to silence

**Emotional States to Prevent:**

- **Embarrassment:** Community must look premium, not amateur
- **Overwhelm:** Progressive complexity; simple defaults
- **Abandonment:** Clear help paths; responsive guidance
- **Manipulation:** Honest gamification; no dark patterns
- **Confusion:** Every state is clear; every action has feedback

### Design Implications

| Emotion     | Design Implementation                                        |
| ----------- | ------------------------------------------------------------ |
| Liberation  | Custom domain prominent; zero platform branding              |
| Pride       | Beautiful defaults; screenshot-worthy design                 |
| Confidence  | Success confirmations; undo capabilities; clear status       |
| Belonging   | Welcome sequences; presence indicators; quick connections    |
| Progress    | Completion tracking; visual advancement; streak displays     |
| Recognition | Achievement announcements; leaderboard features              |
| Control     | Accessible settings; export options; permission transparency |
| Trust       | No upsells; clear data handling; honest communication        |

### Emotional Design Principles

1. **Celebrate Every Win** — Milestones deserve recognition. Level-ups get animation. First posts get welcomes. Course completions get congratulations.

2. **Never Leave Users Wondering** — Every action produces immediate feedback. Success is confirmed. Errors are explained. Progress is visible.

3. **Make Ownership Tangible** — Custom domains, brand colors, and "your" language reinforce that this community belongs to the creator.

4. **Build Trust Through Transparency** — No hidden fees, no surprise limitations, no data we don't explain. What you see is what you get.

5. **Design for Return** — Create anticipation. "What happened while I was away?" should be an exciting question, not an anxious one.

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**Circle (Aesthetic Benchmark):**

- Visual hierarchy with deliberate whitespace
- Familiar modern web app patterns
- Space navigation via clear sidebar iconography
- Content-first design where posts are the hero
- Professional, screenshot-worthy aesthetic

**Linear (Speed & Simplicity Benchmark):**

- Optimistic UI creates feeling of instant response
- Keyboard-first design with full mouse support
- Minimal chrome that reveals controls contextually
- Command palette (⌘K) for universal access
- Fast functional motion (150-200ms transitions)
- Clear focus states and spatial orientation

### Transferable UX Patterns

**Navigation:**

- Persistent sidebar for one-click space access
- Command palette (⌘K) for search and quick actions
- Breadcrumbs for hierarchical content (courses)

**Interaction:**

- Optimistic UI — actions appear instant, sync in background
- Inline editing — no separate "edit mode"
- Contextual actions on hover
- Keyboard shortcuts for power users (j/k, r, l)

**Visual:**

- Generous whitespace allowing content to breathe
- Subtle depth through shadows, not heavy borders
- Fast functional motion (150-200ms, ease-out)
- UI recedes to let user content shine

### Anti-Patterns to Avoid

1. **Sliding panels for primary navigation** — Use full pages with URL changes
2. **Modal stacking** — Maximum one modal, escape always closes
3. **Hidden navigation** — Sidebar visible on desktop, no hamburger-only
4. **Decorative animation** — Motion must be fast and functional
5. **Settings sprawl** — Group settings logically, reveal progressively
6. **Manual save buttons** — Auto-save everything
7. **Loading spinners** — Use skeleton screens or optimistic updates

### Design Inspiration Strategy

**Core Philosophy:** Circle's aesthetic polish + Linear's speed discipline = "Premium but fast"

**Adopt:**

- Command palette for universal access
- Optimistic UI for all user actions
- Persistent sidebar navigation
- Keyboard shortcuts for efficiency
- 150-200ms functional transitions

**Adapt:**

- Gamification visible but balanced (not Skool's leaderboard dominance)
- Admin features accessible without cluttering member experience
- Brand customization prominent without sacrificing usability

**Avoid:**

- Right-side sliding panels (Mighty Networks pattern)
- Any pattern that creates "where am I?" confusion
- Animations that delay user actions
- Complexity that requires training to understand

## Design System Foundation

### Design System Choice

**Primary:** shadcn/ui (New York style) with Tailwind CSS 4
**Icons:** Lucide Icons
**Approach:** Themeable component library with full customization control

### Rationale for Selection

1. **Alignment with inspiration:** shadcn/ui's aesthetic closely matches Circle's polish while Tailwind enables Linear-like development speed
2. **Creator customization:** CSS variables enable brand theming without component modifications
3. **Developer experience:** Components are copied, not imported — full control, no lock-in
4. **Accessibility:** Built on Radix UI primitives with WCAG compliance
5. **Performance:** No runtime CSS-in-JS overhead; optimized bundle sizes
6. **Already integrated:** Matches existing project setup, no migration needed

### Implementation Approach

**Use Existing:**

- All shadcn/ui primitives (Button, Card, Dialog, Input, etc.)
- Tailwind utility classes for layout and spacing
- Lucide icons exclusively for visual consistency

**Build Custom:**

- Community components (ActivityFeedItem, SpaceCard, MemberCard)
- Gamification components (LevelBadge, ProgressRing, LeaderboardRow)
- Admin components (StatCard, ModerationItem)

**Composition Pattern:**

- Custom components built from shadcn/ui primitives
- Consistent API patterns (className, variant, size props)
- Reusable across member and admin experiences

### Customization Strategy

**Theming Architecture:**

- CSS custom properties for all brand-impacting colors
- Single source of truth in tailwind.config.ts
- Dark mode ready via class-based toggle

**Creator Branding Flow:**

- Logo upload with automatic sizing
- Primary color selection (picker + presets)
- Automatic palette generation for complementary colors
- Real-time preview before applying

**Customizable Properties:**

- Primary and accent brand colors
- Logo and favicon
- Community name and tagline
- Default space icons and colors

## Defining Experience

### Core Interaction Definition

**For Creators:** "Deploy → Own → Profit"
The defining moment is watching the deployment complete and seeing YOUR brand on YOUR domain — the visual confirmation that you've escaped platform rent forever.

**For Members:** "Engage → Grow → Belong"
The defining moment is the "Level Up!" notification — the tangible proof that your participation matters and you're progressing in this community.

### User Mental Models

**Creator Mental Model:**

- Expectation to break: "Free means limited" and "Setup is technical"
- Familiar concepts: Stripe dashboards, web hosting, Vercel deploys
- Key insight: Creators expect complexity; simplicity creates delight

**Member Mental Model:**

- Familiar patterns: Social feeds (Twitter), courses (Udemy), gamification (Duolingo)
- Key insight: Members expect polished experiences; matching premium platforms creates trust

### Success Criteria

**Creator Deployment:**

- Time to live: <30 minutes
- Technical steps: Zero
- Confusion moments: Zero
- Completion emotion: Pride and excitement

**Member Engagement:**

- Time to first interaction: <1 hour
- Posts to feel welcomed: 1
- Days to first level-up: 1-3
- First week emotion: Belonging and investment

### Pattern Usage

**Established Patterns:**

- Activity feed (social media standard)
- Course modules (e-learning standard)
- Points/levels (gamification standard)
- Sidebar navigation (SaaS standard)
- Command palette (power user standard)

**Novel Combinations:**

- Self-hosted + Polished UX (breaking "self-hosted = ugly")
- Free + Complete features (breaking "free = crippled")
- Ownership signals throughout (custom domain, brand, Stripe)

### Experience Mechanics

**Creator Deploy Flow:**

1. Discovery → "Deploy to Vercel" click
2. Configuration → Guided wizard (name, domain, Stripe)
3. Personalization → Logo, colors, preview
4. Launch → Progress bar → Celebration → YOUR domain live
5. First member → Invite link → Real-time join → Achievement

**Member Engagement Loop:**

1. Join → Signup via invite link
2. Onboard → Welcome checklist, AI profile builder
3. First post → Intro post → Welcomes → Points earned
4. Explore → Feed browsing, course start, lesson completion
5. Level up → Points accumulate → Celebration → Leaderboard check

## Visual Design Foundation

### Color System

**Primary Palette (Warm Sage Green):**

- Primary: #4A7C59 — Main brand color for buttons, CTAs, active states
- Primary Hover: #3D6B4A — Darker shade for interactive hover states
- Primary Light: #E8F0EA — Tinted backgrounds, active sidebar items
- Primary Subtle: #F4F8F5 — Very light hover states

**Neutral Palette:**

- Background: #FFFFFF — Main content areas
- Surface: #F8F9FA — Sidebar, secondary surfaces
- Border: #E5E7EB — Dividers, card borders
- Text Primary: #1F2937 — Headings, important content
- Text Secondary: #6B7280 — Timestamps, metadata
- Text Muted: #9CA3AF — Placeholders, disabled states

**Semantic Colors:**

- Success: #10B981 — Confirmations, positive actions
- Warning: #F59E0B — Cautions, attention needed
- Error: #EF4444 — Errors, destructive actions
- Info: #3B82F6 — Informational messages

### Typography System

**Font Stack:**

- Primary: Inter (system-ui fallback)
- Monospace: JetBrains Mono (code blocks)

**Type Scale:**

- H1: 24px / 600 weight / 1.3 line-height
- H2: 20px / 600 weight / 1.35 line-height
- H3: 16px / 600 weight / 1.4 line-height
- Body: 14px / 400 weight / 1.5 line-height
- Small: 13px / 400 weight / 1.5 line-height
- Caption: 12px / 400 weight / 1.4 line-height

### Spacing & Layout Foundation

**Spacing Scale (4px base):**

- xs: 4px — Tight spacing between related items
- sm: 8px — Standard gap between elements
- md: 16px — Component padding
- lg: 24px — Section spacing
- xl: 32px — Major section breaks
- 2xl: 48px — Page margins

**Layout Structure:**

- Header: 56px fixed height
- Sidebar: 240px width (collapsible on mobile)
- Right sidebar: 280px width (hidden on tablet/mobile)
- Main content: Flexible, centered max-width 720px for readability

**Responsive Breakpoints:**

- Desktop: >1280px (three columns)
- Tablet: 768-1280px (two columns, no right sidebar)
- Mobile: <768px (single column, bottom navigation)

### Accessibility Considerations

**Contrast Requirements:**

- All text meets WCAG AA minimum (4.5:1)
- Large text and UI components meet 3:1 minimum
- Focus indicators visible in all contexts

**Motion Design:**

- Default transitions: 150-200ms ease-out
- Respects prefers-reduced-motion media query
- No essential information conveyed through motion alone

**Interactive Elements:**

- Minimum touch target: 44x44px on mobile
- Visible focus rings on all interactive elements
- Full keyboard navigation support

## Design Direction Decision

### Design Direction Overview

The chosen design direction follows a three-column layout inspired by Circle and LinkedIn, with OpenTribe's warm sage green brand identity throughout.

**Layout Structure:**

- Header: 56px with logo, search, and user actions
- Left Sidebar: 240px navigation with user profile and primary actions
- Main Content: Flexible width feed area with post composer
- Right Sidebar: 280px contextual information (hidden on smaller screens)

### Key Design Elements

**Navigation Pattern:**

- Persistent left sidebar with icon + label navigation
- Active states indicated by green background tint
- "Create Space" CTA prominently placed in sidebar
- Collapsible on tablet, bottom nav on mobile

**Content Presentation:**

- Card-based post design with consistent structure
- Post composer always visible at top of feed
- Filter tabs for feed customization (All, Following, Popular)
- Generous whitespace for visual breathing room

**Interactive Elements:**

- Green primary buttons for CTAs
- Subtle hover states with green tints
- Engagement actions inline with content
- Real-time updates without page refresh

### Design Rationale

1. **Familiar patterns:** Three-column layout matches established community platform conventions
2. **Brand differentiation:** Warm sage green creates unique identity vs. blue-heavy competitors
3. **Engagement optimization:** Always-visible composer reduces friction to post
4. **Scalable structure:** Card-based design adapts cleanly across breakpoints
5. **Contextual flexibility:** Right sidebar adapts content based on current page/context

### Implementation Approach

**Component Priority:**

1. App shell (header, sidebars, main area)
2. Navigation and routing
3. Post composer and feed
4. Card components and interactions
5. Contextual sidebar widgets

## User Journey Flows

### Creator Setup Flow

The creator setup flow transforms a new user from "clicked deploy" to "community live" in under 30 minutes.

**Flow Stages:**

1. Vercel deployment (automated)
2. Setup wizard (6 steps: name, logo, color, Stripe, space, preview)
3. Launch celebration
4. First member invite

**Key Design Decisions:**

- Wizard format with clear progress (Step X of 6)
- Every step has "Skip for now" where appropriate
- Live preview updates as creator configures
- Celebration screen with shareable moment

**Creator Setup Flow Diagram:**

```
Discovery → Deploy to Vercel → Setup Wizard
    ↓
Step 1: Name Community → Step 2: Upload Logo → Step 3: Pick Color
    ↓
Step 4: Connect Stripe (optional) → Step 5: Create First Space
    ↓
Step 6: Preview → Launch! → Celebration → Copy Invite Link
    ↓
Share & Invite → First Member Joins → Achievement Unlocked!
```

### Member Onboarding Flow

The member onboarding flow establishes belonging within the first hour.

**Flow Stages:**

1. Invite link → Landing page preview
2. Signup (email/password or social)
3. Welcome screen with onboarding checklist
4. Profile completion (AI-assisted option)
5. First post in introduction space
6. First engagement (like/comment)

**Key Design Decisions:**

- Checklist visible but not blocking
- AI profile builder reduces friction
- Points awarded for each completed task
- Welcome comments create immediate social proof

**Onboarding Checklist:**

- Complete your profile (+10 pts)
- Introduce yourself (+15 pts)
- Like your first post (+5 pts)
- Progress indicator shows completion

**AI Profile Builder:**

- 3 simple questions generate personalized bio
- User can edit before saving
- Reduces blank profile syndrome

### Daily Engagement Loop

The daily engagement loop keeps both creators and members returning.

**Entry Points:**

- Push/email notifications
- Direct navigation
- Habit (morning routine)

**Core Actions:**

- Browse feed → Engage with posts
- Take course lessons → Track progress
- Check events → RSVP/attend
- Read/send DMs → Build connections

**Feedback Loops:**

- Points for every action
- Level-up celebrations
- Leaderboard visibility
- Notification of responses

### Journey Patterns

**Progressive Disclosure:** Simple first, complexity on demand
**Immediate Feedback:** Every action acknowledged within 500ms
**Recovery Paths:** Skip options, edit access, undo capability
**Celebration Moments:** Achievements, level-ups, completions

### Flow Optimization Principles

1. **Minimize steps to value** — Creator live in 6 steps, member engaged in 4 steps
2. **Progressive commitment** — Low-effort actions first, high-effort later
3. **Clear progress indicators** — Numbered steps, checklists, progress bars
4. **Smart defaults** — Pre-selected options, AI assistance, templates
5. **Error prevention over handling** — Inline validation, confirmations, auto-save

## Component Strategy

### Design System Components (shadcn/ui)

**Layout:** Card, Dialog, Sheet, Drawer, Separator
**Forms:** Input, Textarea, Select, Checkbox, Switch, Form validation
**Navigation:** Tabs, Dropdown Menu, Command (⌘K), Breadcrumb
**Feedback:** Toast, Alert, Progress, Skeleton loaders
**Data Display:** Avatar, Badge, Table, Tooltip
**Actions:** Button (all variants), Toggle, Toggle Group

### Custom Components

**Feed Components:**

- PostCard — Feed post display with author, content, media, engagement
- PostComposer — Rich text post creation with media upload

**Community Components:**

- SpaceCard — Space preview with icon, description, member count
- MemberCard — Member profile card with avatar, level, bio
- LeaderboardRow — Ranked member entry with position, points

**Gamification Components:**

- LevelBadge — User level indicator (1-10) with title
- PointsToast — "+X pts" celebratory feedback notification
- ProgressRing — Circular progress indicator for courses

**Onboarding Components:**

- OnboardingChecklist — New member task list with progress

**Admin Components:**

- StatCard — Dashboard metric card with trend indicator
- NotificationItem — Single notification in dropdown list

### Component Specifications

**PostCard Anatomy:**

- Header: Avatar + Author name + Space link + Timestamp
- Body: Title (optional) + Content preview + Media
- Footer: Engagement actions (like, comment, share) with counts
- States: Default, Hover, Liked
- Variants: default, compact, expanded

**LevelBadge Levels:**

1. Newcomer, 2. Contributor, 3. Active Member, 4. Rising Star, 5. Engaged
2. Valued, 7. Expert, 8. Leader, 9. Champion, 10. Legend

**PointsToast Behavior:**

- Auto-dismiss after 3 seconds
- Stacks when multiple earned
- Shows action that earned points

### Implementation Approach

**Build Pattern:**

- Compose from shadcn/ui primitives
- Use CSS variables for theming
- Consistent API (size, variant, className props)
- ForwardRef on all components
- Storybook documentation

**Implementation Phases:**

1. Foundation (LevelBadge, PointsToast, ProgressRing)
2. Core Feed (PostCard, PostComposer, NotificationItem)
3. Community (SpaceCard, MemberCard, LeaderboardRow)
4. Onboarding (OnboardingChecklist, StatCard)

## UX Consistency Patterns

### Button Hierarchy

**Primary:** Green fill, white text — One per screen, main action
**Secondary:** Green outline — Supporting actions (Cancel, Back)
**Ghost:** Text only — Inline actions (Learn more, View all)
**Destructive:** Red — Dangerous actions, requires confirmation

**Sizes:** sm (32px), default (36px), lg (44px for mobile CTAs)

### Feedback Patterns

**Success:** Green toast, bottom-right, auto-dismiss 3s
**Error:** Red inline for forms, toast for system errors, persistent
**Warning:** Amber banner, dismissible
**Info:** Blue subtle banner or tooltip
**Loading:** Skeleton screens, inline spinners, optimistic UI

### Form Patterns

**Validation:** On blur, then on change after error
**Layout:** Labels above inputs, required marked with \*
**States:** Default (gray), Focus (green ring), Error (red), Disabled (gray bg)
**Auto-save:** 500ms debounce, "Saving..." → "Saved" indicator

### Navigation Patterns

**Sidebar:** Always visible desktop, icons + labels, green active state
**Breadcrumbs:** Hierarchical content, all levels clickable except current
**Command Palette:** ⌘K for global search, recent items first, keyboard nav
**Back:** Top-left "← Back to [previous]"

### Modal Patterns

**Usage:** Confirmations, quick actions only — never long forms
**Behavior:** Centered, backdrop click closes, Escape closes, no stacking
**Confirmation:** Destructive button right, clear consequence description

### Empty & Loading States

**Empty:** Icon/illustration + headline + explanation + action button
**Loading:** Skeleton screens for pages, inline spinners for actions
**Optimistic:** Updates appear immediately, revert on failure

### Keyboard Shortcuts

**Global:** ⌘K (palette), G+H (home), G+S (spaces), G+M (messages)
**Feed:** J/K (navigate), L (like), R (reply), Enter (open)
**Composer:** ⌘Enter (submit), Escape (cancel)

## Responsive Design Strategy

### Breakpoints

| Breakpoint    | Width       | Layout                        |
| ------------- | ----------- | ----------------------------- |
| Mobile        | <768px      | Single column, bottom nav     |
| Tablet        | 768-1024px  | Two columns, no right sidebar |
| Desktop       | 1024-1280px | Three columns, compact        |
| Large Desktop | >1280px     | Three columns, comfortable    |

### Mobile Adaptations

**Navigation:**

- Left sidebar → Bottom tab bar (Home, Spaces, Messages, Profile)
- Right sidebar content → Accessible via tabs or separate pages
- Command palette → Full-screen search

**Feed:**

- Full-width cards
- Swipe actions (like, bookmark)
- Pull-to-refresh

**Post Composer:**

- Expands to full screen on mobile
- Floating action button (FAB) to trigger

**Touch Targets:**

- Minimum 44x44px for all interactive elements
- Adequate spacing between tappable items

### Tablet Adaptations

- Left sidebar: Icons only (expandable on tap)
- Right sidebar: Hidden, content moved to main area
- Feed: Slightly wider cards with more padding

## Accessibility Strategy

### WCAG 2.1 AA Compliance

**Color Contrast:**

- Text on backgrounds: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Interactive elements: Minimum 3:1 against adjacent colors

**Keyboard Navigation:**

- All interactive elements focusable
- Logical tab order
- Visible focus indicators (green ring)
- Skip links for main content

**Screen Reader Support:**

- Semantic HTML (nav, main, article, aside)
- ARIA labels on icons and buttons
- Live regions for dynamic content
- Alt text on all images

### Focus Management

**Focus Trap:** Modals and dialogs trap focus
**Focus Restoration:** Return focus after modal close
**Focus Visible:** Clear visual indicator on all focused elements

### Motion & Animation

- Respect `prefers-reduced-motion` media query
- Reduced motion: Instant transitions, no decorative animation
- Essential animations only (loading indicators)

### Form Accessibility

- Labels associated with inputs (htmlFor)
- Error messages linked via aria-describedby
- Required fields marked and announced
- Form validation errors summarized

## Implementation Roadmap

### Phase 1: Foundation (MVP Core)

**App Shell:**

- [ ] Header with logo, search, notifications, profile
- [ ] Sidebar navigation with routing
- [ ] Main content area with responsive layout
- [ ] Mobile bottom navigation

**Authentication:**

- [ ] Login/signup pages
- [ ] Protected route middleware
- [ ] User session management

**Core Components:**

- [ ] PostCard component
- [ ] PostComposer component
- [ ] LevelBadge component

### Phase 2: Community Features

**Spaces:**

- [ ] Space listing page
- [ ] Space detail page with feed
- [ ] Create/edit space functionality
- [ ] Space settings

**Members:**

- [ ] Member directory
- [ ] Member profile pages
- [ ] Follow/connection system

**Feed:**

- [ ] Activity feed with filtering
- [ ] Real-time updates (Convex)
- [ ] Infinite scroll

### Phase 3: Engagement Features

**Gamification:**

- [ ] Points system implementation
- [ ] Level progression
- [ ] Leaderboard
- [ ] Achievements/badges

**Courses:**

- [ ] Course listing
- [ ] Module/lesson structure
- [ ] Progress tracking
- [ ] Completion certificates

**Events:**

- [ ] Event creation
- [ ] RSVP system
- [ ] Calendar integration

### Phase 4: Advanced Features

**Direct Messaging:**

- [ ] Conversation threads
- [ ] Real-time chat
- [ ] Message notifications

**Admin Dashboard:**

- [ ] Analytics overview
- [ ] Member management
- [ ] Content moderation
- [ ] Settings management

**Payments:**

- [ ] Stripe integration
- [ ] Subscription management
- [ ] Payment history

### Phase 5: Polish & Optimization

**Performance:**

- [ ] Image optimization
- [ ] Code splitting
- [ ] Caching strategy

**Onboarding:**

- [ ] Setup wizard
- [ ] Member onboarding checklist
- [ ] AI profile builder

**Creator Tools:**

- [ ] Brand customization
- [ ] Custom domain setup
- [ ] Export functionality

---

## Summary

This UX Design Specification defines the complete user experience for OpenTribe — a free, open-source community platform that empowers creators to own their communities.

**Key Design Principles:**

1. Instant Gratification — Fast feedback on every action
2. Progressive Disclosure — Simple first, complexity on demand
3. Ownership Reinforcement — Every screen shows "this is YOUR community"
4. Progress Celebration — Milestones get recognition
5. Smart Defaults — Works out of the box, customizable when needed

**Visual Identity:**

- Warm sage green (#4A7C59) primary color
- Clean, minimal design inspired by Circle and Linear
- Three-column layout with persistent navigation
- Professional aesthetic that screenshots well

**Technical Foundation:**

- shadcn/ui + Tailwind CSS 4 design system
- Real-time updates via Convex
- Mobile-responsive with bottom navigation
- WCAG 2.1 AA accessibility compliance

**Critical Success Metrics:**

- Creator: Deploy to live in <30 minutes
- Member: First engagement in <1 hour
- Member: Level up within 1-3 days
- Both: Return daily (habit formation)

---

_Document Status: Complete_
_Next Steps: Architecture design, then implementation per roadmap_
