# Story 1.8: Notification Preferences Setup

Status: ready-for-dev

## Story

As a **member**,
I want to configure my notification preferences,
So that I receive updates in my preferred way.

## Acceptance Criteria

1. **Given** I am on my settings page
   **When** I view notification preferences
   **Then** I see toggles for each notification type:
   - New comments on my posts (email + in-app)
   - Replies to my comments (email + in-app)
   - New followers (email + in-app)
   - Event reminders (email + in-app)
   - Course updates (email + in-app)
   - Direct messages (email + in-app)

2. **And** I see email digest frequency options:
   - Immediate
   - Daily digest
   - Weekly digest
   - Off

3. **When** I change any preference
   **Then** it saves immediately (auto-save)
   **And** future notifications respect my preferences

## Tasks / Subtasks

- [ ] **Task 1: Create notification preferences page** (AC: #1)
  - [ ] 1.1: Create `app/(community)/settings/notifications/page.tsx`
  - [ ] 1.2: Create `components/settings/NotificationPreferencesForm.tsx` with auto-save
  - [ ] 1.3: Display current preferences from Convex query (reuse `getMyProfile`)
  - [ ] 1.4: Style following shadcn/ui Card + Form patterns (match profile page)

- [ ] **Task 2: Implement notification preferences update mutation** (AC: #3)
  - [ ] 2.1: Add `updateNotificationPrefs` mutation in `convex/members/mutations.ts`
  - [ ] 2.2: Validate all preference values server-side
  - [ ] 2.3: Use `ctx.db.patch()` for partial updates to `notificationPrefs` field
  - [ ] 2.4: Ensure updates to nested object merge correctly (not replace)

- [ ] **Task 3: Implement auto-save with debounce** (AC: #3)
  - [ ] 3.1: Reuse existing `useDebounce` hook from `hooks/useDebounce.ts`
  - [ ] 3.2: Track save state: idle -> saving -> saved (same pattern as profile)
  - [ ] 3.3: Display "Saving..." and "Saved" indicators
  - [ ] 3.4: Handle save errors with inline feedback

- [ ] **Task 4: Build notification type toggles UI** (AC: #1)
  - [ ] 4.1: Create section for each notification category with Switch components
  - [ ] 4.2: Add descriptive labels explaining what each toggle controls
  - [ ] 4.3: Group toggles logically (Content, Social, Events, Courses, Messages)
  - [ ] 4.4: Use consistent spacing and visual hierarchy

- [ ] **Task 5: Build email digest frequency selector** (AC: #2)
  - [ ] 5.1: Create RadioGroup for digest frequency options
  - [ ] 5.2: Add descriptions for each option (what it means)
  - [ ] 5.3: Style to match overall settings page design

- [ ] **Task 6: Set default preferences for new users** (AC: #3)
  - [ ] 6.1: Update `createUserProfile` mutation to set default notification prefs
  - [ ] 6.2: Defaults: All email ON, digest frequency = "daily"
  - [ ] 6.3: Handle existing users without prefs (show defaults in UI)

- [ ] **Task 7: Write tests** (AC: all)
  - [ ] 7.1: Test `updateNotificationPrefs` mutation with valid data
  - [ ] 7.2: Test partial preference updates (only changing some fields)
  - [ ] 7.3: Test invalid digest frequency value rejection
  - [ ] 7.4: Test default preference handling for users without prefs

## Dev Notes

### Critical Architecture Patterns

**Schema Already Exists:**
The `notificationPrefs` field is already defined in the users table schema:

```typescript
// convex/schema.ts - users table already has:
notificationPrefs: v.optional(
  v.object({
    emailComments: v.boolean(),
    emailReplies: v.boolean(),
    emailFollowers: v.boolean(),
    emailEvents: v.boolean(),
    emailCourses: v.boolean(),
    emailDMs: v.boolean(),
    digestFrequency: v.union(
      v.literal("immediate"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("off")
    ),
  })
),
```

**No schema changes required!** The field is optional and already properly typed.

**Authentication Pattern (from Story 1.7):**

```typescript
// In mutations:
import { requireAuth } from "../_lib/permissions";

export const updateNotificationPrefs = mutation({
  args: {
    /* notification prefs */
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const authUser = await requireAuth(ctx);

    const profile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!profile) throw new ConvexError("Profile not found");

    await ctx.db.patch(profile._id, {
      notificationPrefs: args,
      updatedAt: Date.now(),
    });

    return null;
  },
});
```

### Settings Layout Already Exists

The settings layout and navigation are already implemented from Story 1.7:

- Layout: `app/(community)/settings/layout.tsx`
- Profile page: `app/(community)/settings/profile/page.tsx`
- Navigation includes "Notifications" link to `/settings/notifications`

**The notifications page is the only missing piece - just needs to be created!**

### Auto-Save Pattern (reuse from Story 1.7)

**useDebounce Hook Already Exists:**

```typescript
// hooks/useDebounce.ts - already created
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

**Save State Pattern (from ProfileForm):**

```typescript
type SaveState = "idle" | "saving" | "saved" | "error";
const [saveState, setSaveState] = useState<SaveState>("idle");

const handleSave = async (prefs: NotificationPrefsData) => {
  setSaveState("saving");
  try {
    await updateNotificationPrefs(prefs);
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2000);
  } catch (error) {
    setSaveState("error");
    console.error("Save failed:", error);
  }
};
```

### Zod Validation Schema

```typescript
// Add to lib/validators.ts
export const notificationPrefsSchema = z.object({
  emailComments: z.boolean(),
  emailReplies: z.boolean(),
  emailFollowers: z.boolean(),
  emailEvents: z.boolean(),
  emailCourses: z.boolean(),
  emailDMs: z.boolean(),
  digestFrequency: z.enum(["immediate", "daily", "weekly", "off"]),
});

export type NotificationPrefsFormData = z.infer<typeof notificationPrefsSchema>;
```

### Default Notification Preferences

When a user is created or has no prefs set, use these defaults:

```typescript
const DEFAULT_NOTIFICATION_PREFS = {
  emailComments: true,
  emailReplies: true,
  emailFollowers: true,
  emailEvents: true,
  emailCourses: true,
  emailDMs: true,
  digestFrequency: "daily" as const,
};
```

### File Structure

**Files to Create:**

| File                                                  | Purpose                               |
| ----------------------------------------------------- | ------------------------------------- |
| `app/(community)/settings/notifications/page.tsx`     | Notifications settings page           |
| `components/settings/NotificationPreferencesForm.tsx` | Auto-save preferences form            |
| `components/settings/index.ts`                        | Barrel export for settings components |

**Files to Modify:**

| File                               | Changes                                       |
| ---------------------------------- | --------------------------------------------- |
| `lib/validators.ts`                | Add `notificationPrefsSchema`                 |
| `convex/members/mutations.ts`      | Add `updateNotificationPrefs` mutation        |
| `convex/members/mutations.ts`      | Update `createUserProfile` with default prefs |
| `convex/members/mutations.test.ts` | Add tests for notification prefs              |

### Previous Story Learnings (Story 1.7)

From completed Story 1.7 (User Profile View and Edit):

1. **Auto-save pattern works well** - 500ms debounce with "Saving..." / "Saved" indicators

2. **Switch component pattern:**

   ```tsx
   <div className="flex items-center justify-between">
     <div className="space-y-0.5">
       <Label>Comments on my posts</Label>
       <p className="text-muted-foreground text-sm">
         Get notified when someone comments on your posts
       </p>
     </div>
     <Switch checked={field.value} onCheckedChange={field.onChange} />
   </div>
   ```

3. **Settings page structure:**

   ```tsx
   <Card>
     <CardHeader>
       <CardTitle>Notification Preferences</CardTitle>
       <CardDescription>
         Choose how you want to be notified about activity
       </CardDescription>
     </CardHeader>
     <CardContent>
       <NotificationPreferencesForm />
     </CardContent>
   </Card>
   ```

4. **Form validation timing:** Use `mode: "onChange"` for immediate feedback on toggles

### UI/UX Requirements

**From UX Spec & Epics:**

- **Auto-save:** Same pattern as profile - 500ms debounce
- **Toggle layout:** Label on left, switch on right, description below label
- **Grouping:** Related toggles grouped with subtle dividers
- **Digest selector:** RadioGroup with cards for each option

**Notification Categories:**

```tsx
// Group 1: Content
- Comments on my posts
- Replies to my comments

// Group 2: Social
- New followers

// Group 3: Activity
- Event reminders
- Course updates

// Group 4: Messages
- Direct messages

// Separate section: Email Digest
- Immediate / Daily / Weekly / Off
```

### Component Structure

**NotificationPreferencesForm.tsx:**

```tsx
export function NotificationPreferencesForm() {
  const profile = useQuery(api.members.queries.getMyProfile);
  const updatePrefs = useMutation(api.members.mutations.updateNotificationPrefs);

  // Use defaults if no prefs exist
  const currentPrefs = profile?.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS;

  // Auto-save on change (debounced)
  const handlePrefsChange = async (updates: Partial<NotificationPrefsFormData>) => {
    const newPrefs = { ...currentPrefs, ...updates };
    // Debounced save logic
  };

  return (
    <div className="space-y-6">
      {/* Content notifications */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Content</h3>
        <PreferenceToggle
          label="Comments on my posts"
          description="Get notified when someone comments on your posts"
          checked={currentPrefs.emailComments}
          onCheckedChange={(v) => handlePrefsChange({ emailComments: v })}
        />
        {/* ... more toggles */}
      </div>

      {/* Email digest */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Email Digest</h3>
        <RadioGroup value={currentPrefs.digestFrequency} onValueChange={...}>
          {/* ... options */}
        </RadioGroup>
      </div>

      {/* Save state indicator */}
      <SaveStateIndicator state={saveState} />
    </div>
  );
}
```

### Testing Strategy

**Mutation Tests (`convex/members/mutations.test.ts`):**

```typescript
describe("updateNotificationPrefs", () => {
  it("should update all notification preferences", async () => {
    const t = convexTest(schema, modules);
    // Setup authenticated user...

    await t.mutation(api.members.mutations.updateNotificationPrefs, {
      emailComments: false,
      emailReplies: true,
      emailFollowers: false,
      emailEvents: true,
      emailCourses: false,
      emailDMs: true,
      digestFrequency: "weekly",
    });

    // Verify update
    const user = await t.run(async (ctx) => {
      return await ctx.db.query("users").first();
    });

    expect(user?.notificationPrefs?.emailComments).toBe(false);
    expect(user?.notificationPrefs?.digestFrequency).toBe("weekly");
  });

  it("should require authentication", async () => {
    const t = convexTest(schema, modules);
    // No auth setup

    await expect(
      t.mutation(api.members.mutations.updateNotificationPrefs, {
        // ... prefs
      })
    ).rejects.toThrow();
  });
});
```

### Anti-Patterns to Avoid

```typescript
// ❌ WRONG: Not using requireAuth
export const updateNotificationPrefs = mutation({
  handler: async (ctx, args) => {
    // Missing authentication check!
    await ctx.db.patch(userId, { notificationPrefs: args });
  },
});

// ✅ CORRECT: Always verify auth
export const updateNotificationPrefs = mutation({
  handler: async (ctx, args) => {
    const authUser = await requireAuth(ctx);
    const profile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();
    if (!profile) throw new ConvexError("Profile not found");
    await ctx.db.patch(profile._id, {
      notificationPrefs: args,
      updatedAt: Date.now(),
    });
  },
});

// ❌ WRONG: Replacing entire prefs object incorrectly
await ctx.db.patch(profile._id, args); // args might be partial

// ✅ CORRECT: Merge with existing prefs
const existingPrefs = profile.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS;
await ctx.db.patch(profile._id, {
  notificationPrefs: { ...existingPrefs, ...args },
  updatedAt: Date.now(),
});

// ❌ WRONG: Not updating updatedAt
await ctx.db.patch(profile._id, { notificationPrefs: args });

// ✅ CORRECT: Always update timestamp
await ctx.db.patch(profile._id, {
  notificationPrefs: args,
  updatedAt: Date.now(),
});
```

### Dependencies

**Already installed (from previous stories):**

- `react-hook-form`
- `@hookform/resolvers`
- `zod`
- shadcn/ui components (Card, Switch, RadioGroup, Label)

**May need to add RadioGroup if not present:**

```bash
npx shadcn@latest add radio-group
```

### Key Implementation Details

1. **The schema already exists** - no migration needed, just implement the mutation and UI

2. **Settings layout exists** - just create the notifications page and form component

3. **Auto-save pattern is proven** - reuse from profile page exactly

4. **Default prefs** - handle users who don't have `notificationPrefs` set yet

5. **Note on in-app notifications** - This story focuses on EMAIL preferences only. The in-app notification toggles mentioned in the AC are NOT part of the current schema. For MVP, focus on email preferences which ARE in the schema. In-app notification preferences can be added in Epic 7 when the full notification system is built.

### References

- [Source: docs/epics.md#Story-1.8] - Full acceptance criteria
- [Source: docs/ARCHITECTURE.md#Notification-Architecture] - Notification patterns
- [Source: convex/schema.ts#users] - notificationPrefs field definition (lines 26-41)
- [Source: docs/sprint-artifacts/1-7-user-profile-view-and-edit.md] - Previous story patterns
- [Source: components/profile/ProfileForm.tsx] - Auto-save reference implementation
- [Source: app/(community)/settings/layout.tsx] - Settings layout with nav
- [Source: hooks/useDebounce.ts] - Debounce hook for auto-save

## Dev Agent Record

### Context Reference

/Users/robertguss/Projects/startups/OpenTribe/docs/sprint-artifacts/1-8-notification-preferences-setup.md

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

---

_Story created by create-story workflow | 2025-12-05_
_Ultimate context engine analysis completed - comprehensive developer guide created_
