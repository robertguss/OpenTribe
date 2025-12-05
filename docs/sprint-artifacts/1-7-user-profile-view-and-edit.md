# Story 1.7: User Profile View and Edit

Status: Ready for Review

## Story

As a **member**,
I want to view and edit my profile information,
So that other members can learn about me.

## Acceptance Criteria

1. **Given** I am logged in
   **When** I navigate to my profile settings
   **Then** I see my current profile information:
   - Display name
   - Bio (plain text, 500 char limit)
   - Profile photo
   - Visibility setting (public/private)

2. **When** I edit any field
   **Then** changes auto-save after 500ms debounce
   **And** I see "Saving..." then "Saved" indicator

3. **When** I upload a new profile photo
   **Then** the image is validated (type: jpg/png/gif/webp, size <5MB)
   **And** uploaded to Convex file storage
   **And** my avatar updates immediately

4. **When** I set visibility to private
   **Then** only my name and avatar show in member directory
   **And** my bio and other details are hidden from non-admins

## Tasks / Subtasks

- [x] **Task 1: Create profile settings page** (AC: #1)
  - [x] 1.1: Create `app/(community)/settings/profile/page.tsx`
  - [x] 1.2: Create `components/profile/ProfileForm.tsx` with auto-save form
  - [x] 1.3: Display current profile data from Convex query
  - [x] 1.4: Style following shadcn/ui Card + Form patterns

- [x] **Task 2: Implement profile update mutation** (AC: #2)
  - [x] 2.1: Add `updateProfile` mutation in `convex/members/mutations.ts`
  - [x] 2.2: Add `getMyProfile` query in `convex/members/queries.ts`
  - [x] 2.3: Validate bio length (max 500 chars) in mutation
  - [x] 2.4: Use `ctx.db.patch()` for partial updates

- [x] **Task 3: Implement auto-save with debounce** (AC: #2)
  - [x] 3.1: Use `useDebounce` hook (create in `hooks/useDebounce.ts`)
  - [x] 3.2: Track save state: idle → saving → saved
  - [x] 3.3: Display "Saving..." and "Saved ✓" indicators
  - [x] 3.4: Handle save errors with inline feedback

- [x] **Task 4: Implement avatar upload** (AC: #3)
  - [x] 4.1: Create avatar upload component with preview
  - [x] 4.2: Add `generateUploadUrl` mutation in `convex/members/mutations.ts`
  - [x] 4.3: Validate file type (image/jpeg, image/png, image/gif, image/webp)
  - [x] 4.4: Validate file size (<5MB client-side, enforced server-side)
  - [x] 4.5: Use `ctx.storage.generateUploadUrl()` for upload
  - [x] 4.6: Update `avatarStorageId` on successful upload
  - [x] 4.7: Add `getAvatarUrl` query to resolve storage ID to URL

- [x] **Task 5: Implement visibility toggle** (AC: #4)
  - [x] 5.1: Add Switch/Toggle component for public/private
  - [x] 5.2: Auto-save visibility changes like other fields
  - [x] 5.3: Add helper text explaining visibility effects

- [x] **Task 6: Add settings navigation** (AC: #1)
  - [x] 6.1: Create settings layout `app/(community)/settings/layout.tsx`
  - [x] 6.2: Add settings link to nav-user dropdown in sidebar
  - [x] 6.3: Create settings sidebar with Profile, Notifications sections

- [x] **Task 7: Write tests** (AC: all)
  - [x] 7.1: Test `updateProfile` mutation with valid/invalid data
  - [x] 7.2: Test `getMyProfile` query returns correct user data
  - [x] 7.3: Test file upload validation (type, size)
  - [x] 7.4: Test visibility update

## Dev Notes

### Critical Architecture Patterns

**Authentication Flow:**
The user must be authenticated via Better Auth. Use the established pattern:

```typescript
// In queries/mutations:
import { requireAuth } from "../_lib/permissions";

export const getMyProfile = query({
  args: {},
  returns: v.union(userProfileValidator, v.null()),
  handler: async (ctx) => {
    const authUser = await requireAuth(ctx); // Throws if not logged in

    // Lookup user profile by email
    const profile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email))
      .unique();

    return profile;
  },
});
```

**User Profile Schema (Already Exists):**

```typescript
// convex/schema.ts - users table already has:
bio: v.optional(v.string()),
avatarStorageId: v.optional(v.id("_storage")),
visibility: v.union(v.literal("public"), v.literal("private")),
name: v.optional(v.string()),
```

No schema changes required!

### File Storage Pattern for Avatar

**Generate Upload URL (mutation):**

```typescript
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
```

**Upload and Save (client-side pattern):**

```typescript
// 1. Get upload URL from Convex
const uploadUrl = await generateUploadUrl();

// 2. Upload file directly to storage
const result = await fetch(uploadUrl, {
  method: "POST",
  headers: { "Content-Type": file.type },
  body: file,
});
const { storageId } = await result.json();

// 3. Update profile with storage ID
await updateProfile({ avatarStorageId: storageId });
```

**Get Avatar URL (query):**

```typescript
export const getAvatarUrl = query({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
```

### Auto-Save with Debounce Pattern

**useDebounce Hook:**

```typescript
// hooks/useDebounce.ts
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

**Save State Management:**

```typescript
type SaveState = "idle" | "saving" | "saved" | "error";
const [saveState, setSaveState] = useState<SaveState>("idle");

// Debounce form values
const debouncedName = useDebounce(watch("name"), 500);

// Trigger save when debounced values change
useEffect(() => {
  if (debouncedName !== profile?.name) {
    handleSave({ name: debouncedName });
  }
}, [debouncedName]);

// Save handler
const handleSave = async (updates: Partial<ProfileData>) => {
  setSaveState("saving");
  try {
    await updateProfile(updates);
    setSaveState("saved");
    // Reset to idle after 2 seconds
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
export const profileSchema = z.object({
  name: z.string().max(100, "Name must be 100 characters or less").optional(),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  visibility: z.enum(["public", "private"]),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
```

### File Structure

**Files to Create:**

| File                                        | Purpose                                      |
| ------------------------------------------- | -------------------------------------------- |
| `app/(community)/settings/layout.tsx`       | Settings page layout with sidebar navigation |
| `app/(community)/settings/profile/page.tsx` | Profile settings page                        |
| `components/profile/ProfileForm.tsx`        | Auto-save profile form with avatar upload    |
| `components/profile/AvatarUpload.tsx`       | Avatar image upload component                |
| `hooks/useDebounce.ts`                      | Debounce hook for auto-save                  |

**Files to Modify:**

| File                          | Changes                                  |
| ----------------------------- | ---------------------------------------- |
| `lib/validators.ts`           | Add `profileSchema`                      |
| `convex/members/mutations.ts` | Add `updateProfile`, `generateUploadUrl` |
| `convex/members/queries.ts`   | Add `getMyProfile`, `getAvatarUrl`       |
| `components/nav-user.tsx`     | Add settings link to dropdown            |

### Previous Story Learnings (Story 1.6)

From completed Story 1.6 (Password Reset Flow):

1. **React Hook Form pattern with mode onBlur:**

   ```typescript
   const form = useForm<ProfileFormData>({
     resolver: zodResolver(profileSchema),
     mode: "onBlur",
     reValidateMode: "onChange",
   });
   ```

2. **Error handling pattern:**

   ```typescript
   try {
     await mutation({ ...data });
   } catch (err: unknown) {
     const error = err as Error;
     setFormError(error.message || "An error occurred");
   }
   ```

3. **Loading state in finally block:**
   ```typescript
   try {
     // action
   } catch (error) {
     // handle
   } finally {
     setIsLoading(false);
   }
   ```

### UI/UX Requirements

**From UX Spec:**

- **Auto-save:** 500ms debounce, "Saving..." → "Saved" indicator
- **Form Pattern:** Labels above inputs, validation on blur
- **Feedback:** Success green toast, error red inline
- **Avatar:** Circular with hover overlay for change

**Save State Indicator:**

```tsx
<div className="text-muted-foreground text-sm">
  {saveState === "saving" && <span className="text-yellow-600">Saving...</span>}
  {saveState === "saved" && <span className="text-green-600">Saved ✓</span>}
  {saveState === "error" && <span className="text-red-600">Save failed</span>}
</div>
```

**Settings Page Layout:**

```tsx
<div className="container max-w-4xl py-8">
  <div className="flex gap-8">
    {/* Settings sidebar */}
    <nav className="w-48 shrink-0">
      <Link href="/settings/profile">Profile</Link>
      <Link href="/settings/notifications">Notifications</Link>
    </nav>

    {/* Content area */}
    <div className="flex-1">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Manage your profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>
    </div>
  </div>
</div>
```

### File Upload Validation

**Client-side (before upload):**

```typescript
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "File must be a JPEG, PNG, GIF, or WebP image";
  }
  if (file.size > MAX_SIZE) {
    return "File must be less than 5MB";
  }
  return null; // Valid
}
```

**Server-side (in mutation):**

```typescript
// After upload, validate the file metadata
const metadata = await ctx.db.system.get(storageId);
if (!metadata) {
  throw new ConvexError("File not found");
}
if (metadata.size > 5 * 1024 * 1024) {
  await ctx.storage.delete(storageId);
  throw new ConvexError("File exceeds 5MB limit");
}
```

### Avatar Component Pattern

```tsx
// components/profile/AvatarUpload.tsx
export function AvatarUpload({ currentUrl, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    // Preview
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      await onUpload(file);
    } catch (err) {
      toast.error("Upload failed");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="relative h-24 w-24 cursor-pointer rounded-full"
      onClick={() => inputRef.current?.click()}
    >
      <Avatar className="h-24 w-24">
        <AvatarImage src={preview || currentUrl} />
        <AvatarFallback>?</AvatarFallback>
      </Avatar>

      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity hover:opacity-100">
        {uploading ? <Spinner /> : <Camera className="h-6 w-6 text-white" />}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
```

### Testing Strategy

**Mutation Tests (`convex/members/mutations.test.ts`):**

```typescript
describe("updateProfile", () => {
  it("should update name successfully", async () => {
    const t = convexTest(schema, modules);
    // Setup user...
    const result = await t.mutation(api.members.mutations.updateProfile, {
      name: "New Name",
    });
    expect(result).toBe(true);
  });

  it("should reject bio over 500 characters", async () => {
    const t = convexTest(schema, modules);
    const longBio = "a".repeat(501);
    await expect(
      t.mutation(api.members.mutations.updateProfile, { bio: longBio })
    ).rejects.toThrow("Bio must be 500 characters or less");
  });

  it("should update visibility to private", async () => {
    const t = convexTest(schema, modules);
    // ...
  });
});
```

### Anti-Patterns to Avoid

```typescript
// ❌ WRONG: Not using requireAuth
export const updateProfile = mutation({
  handler: async (ctx, args) => {
    // Missing authentication check!
    await ctx.db.patch(userId, args);
  },
});

// ✅ CORRECT: Always verify auth
export const updateProfile = mutation({
  handler: async (ctx, args) => {
    const authUser = await requireAuth(ctx);
    const profile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email))
      .unique();
    if (!profile) throw new ConvexError("Profile not found");
    await ctx.db.patch(profile._id, { ...args, updatedAt: Date.now() });
  },
});

// ❌ WRONG: Uploading to wrong storage
const response = await fetch("/api/upload", { body: file });

// ✅ CORRECT: Use Convex storage directly
const uploadUrl = await generateUploadUrl();
const response = await fetch(uploadUrl, { method: "POST", body: file });

// ❌ WRONG: Not updating updatedAt
await ctx.db.patch(profile._id, { name: args.name });

// ✅ CORRECT: Always update timestamp
await ctx.db.patch(profile._id, { name: args.name, updatedAt: Date.now() });
```

### Dependencies

**Already installed (from previous stories):**

- `react-hook-form`
- `@hookform/resolvers`
- `zod`
- shadcn/ui components (Avatar, Card, Input, Button, Switch)

**No new packages required.**

### References

- [Source: docs/epics.md#Story-1.7] - Full acceptance criteria
- [Source: docs/ARCHITECTURE.md#File-Storage] - Convex storage patterns
- [Source: docs/ux-design-specification.md#Form-Patterns] - Auto-save UX
- [Source: docs/sprint-artifacts/1-6-password-reset-flow.md] - Previous story patterns
- [Source: convex/schema.ts] - Users table schema
- [Source: convex/_lib/permissions.ts] - Authentication patterns
- [Source: project-context.md] - Critical conventions

## Dev Agent Record

### Context Reference

/Users/robertguss/Projects/startups/OpenTribe/docs/sprint-artifacts/1-7-user-profile-view-and-edit.md

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- All tests pass (110 tests, 1 skipped)
- TypeScript compilation successful
- No new lint errors introduced

### Completion Notes List

- Implemented `getMyProfile` query and `updateProfile` mutation in Convex with proper authentication
- Added `generateUploadUrl` mutation for avatar uploads to Convex storage
- Added `getAvatarUrl` query to resolve storage IDs to URLs
- Created `useDebounce` hook for auto-save functionality (500ms debounce)
- Added `profileSchema` Zod validator for frontend form validation
- Built settings layout with sidebar navigation (`/settings/profile`, `/settings/notifications`)
- Created `ProfileForm` component with auto-save, save state indicators (Saving... / Saved ✓ / Error)
- Created `AvatarUpload` component with file validation (type: jpg/png/gif/webp, size: <5MB)
- Added visibility toggle (Switch component) with privacy explanation
- Updated nav-user dropdown with Settings link
- All acceptance criteria satisfied

### File List

**New Files:**

- `app/(community)/settings/layout.tsx` - Settings page layout with sidebar navigation
- `app/(community)/settings/profile/page.tsx` - Profile settings page
- `components/profile/ProfileForm.tsx` - Auto-save profile form component
- `components/profile/AvatarUpload.tsx` - Avatar upload component with preview
- `components/profile/index.ts` - Barrel export for profile components
- `hooks/useDebounce.ts` - Debounce hook for auto-save
- `components/ui/switch.tsx` - shadcn Switch component
- `components/ui/form.tsx` - shadcn Form component
- `components/ui/textarea.tsx` - shadcn Textarea component

**Modified Files:**

- `convex/members/mutations.ts` - Added `updateProfile`, `generateUploadUrl` mutations
- `convex/members/queries.ts` - Added `getMyProfile`, `getAvatarUrl` queries
- `convex/members/mutations.test.ts` - Added tests for new mutations
- `convex/members/queries.test.ts` - Added tests for new queries
- `lib/validators.ts` - Added `profileSchema` for profile form validation
- `lib/validators.test.ts` - Added tests for profileSchema
- `components/nav-user.tsx` - Added Settings link to user dropdown
- `docs/sprint-artifacts/sprint-status.yaml` - Updated story status to in-progress → review
- `docs/sprint-artifacts/1-7-user-profile-view-and-edit.md` - Updated task checkboxes and this record

### Change Log

| Date       | Change                                                                  |
| ---------- | ----------------------------------------------------------------------- |
| 2025-12-05 | Implemented story 1-7: User Profile View and Edit - All tasks completed |

---

_Story created by create-story workflow | 2025-12-05_
_Ultimate context engine analysis completed - comprehensive developer guide created_
