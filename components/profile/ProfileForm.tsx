"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { profileSchema, type ProfileFormData } from "@/lib/validators";
import { useDebounce } from "@/hooks/useDebounce";
import { AvatarUpload } from "./AvatarUpload";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type SaveState = "idle" | "saving" | "saved" | "error";

export function ProfileForm() {
  const profile = useQuery(api.members.queries.getMyProfile, {});
  const updateProfile = useMutation(api.members.mutations.updateProfile);
  const generateUploadUrl = useMutation(
    api.members.mutations.generateUploadUrl
  );

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [initialValues, setInitialValues] = useState<ProfileFormData | null>(
    null
  );
  const saveStateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveStateTimeoutRef.current) {
        clearTimeout(saveStateTimeoutRef.current);
      }
    };
  }, []);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      bio: "",
      visibility: "public",
    },
  });

  const { reset } = form;

  // Get avatar URL if user has one
  const avatarStorageId = profile?.avatarStorageId;
  const avatarUrl = useQuery(
    api.members.queries.getAvatarUrl,
    avatarStorageId ? { storageId: avatarStorageId } : "skip"
  );

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      const profileValues: ProfileFormData = {
        name: profile.name || "",
        bio: profile.bio || "",
        visibility: profile.visibility,
      };
      reset(profileValues);
      setInitialValues(profileValues);
    }
  }, [profile, reset]);

  // Watch form values for auto-save
  const watchedName = form.watch("name");
  const watchedBio = form.watch("bio");
  const watchedVisibility = form.watch("visibility");

  // Debounced values
  const debouncedName = useDebounce(watchedName, 500);
  const debouncedBio = useDebounce(watchedBio, 500);
  // No debounce for visibility since it's a toggle

  // Auto-save effect for name
  // Intentionally excluding handleSave and initialValues from deps:
  // - handleSave is recreated on every render but its identity change shouldn't trigger saves
  // - initialValues changes after saves, which would cause infinite loops
  // We only want to trigger saves when the debounced value actually changes
  useEffect(() => {
    if (initialValues && debouncedName !== initialValues.name) {
      handleSave({ name: debouncedName || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedName]);

  // Auto-save effect for bio (same rationale as name effect above)
  useEffect(() => {
    if (initialValues && debouncedBio !== initialValues.bio) {
      handleSave({ bio: debouncedBio || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedBio]);

  // Handle visibility toggle (immediate save, no debounce)
  const handleVisibilityChange = async (isPrivate: boolean) => {
    const visibility = isPrivate ? "private" : "public";
    form.setValue("visibility", visibility);
    await handleSave({ visibility });
  };

  // Save handler
  const handleSave = async (
    updates: Partial<{
      name: string;
      bio: string;
      visibility: "public" | "private";
    }>
  ) => {
    // Clear any existing timeout
    if (saveStateTimeoutRef.current) {
      clearTimeout(saveStateTimeoutRef.current);
    }

    // Validate the fields being saved
    const nameValid = !updates.name || updates.name.length <= 100;
    const bioValid = !updates.bio || updates.bio.length <= 500;

    if (!nameValid || !bioValid) {
      setSaveState("error");
      saveStateTimeoutRef.current = setTimeout(
        () => setSaveState("idle"),
        3000
      );
      return;
    }

    setSaveState("saving");
    try {
      await updateProfile(updates);

      // Update initial values after successful save
      if (initialValues) {
        setInitialValues({
          ...initialValues,
          ...updates,
        });
      }

      setSaveState("saved");
      // Reset to idle after 2 seconds
      saveStateTimeoutRef.current = setTimeout(
        () => setSaveState("idle"),
        2000
      );
    } catch (error) {
      console.error("Save failed:", error);
      setSaveState("error");
      saveStateTimeoutRef.current = setTimeout(
        () => setSaveState("idle"),
        3000
      );
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (file: File) => {
    // 1. Get upload URL from Convex
    const uploadUrl = await generateUploadUrl();

    // 2. Upload file directly to storage
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!result.ok) {
      throw new Error("Upload failed");
    }

    const { storageId } = await result.json();

    // 3. Update profile with storage ID
    await updateProfile({ avatarStorageId: storageId });
  };

  // Loading state
  if (profile === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // No profile found
  if (profile === null) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        <p>Profile not found. Please try logging in again.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* Save State Indicator */}
        <div className="text-muted-foreground flex justify-end text-sm">
          {saveState === "saving" && (
            <span className="text-yellow-600">Saving...</span>
          )}
          {saveState === "saved" && (
            <span className="text-green-600">Saved ✓</span>
          )}
          {saveState === "error" && (
            <span className="text-red-600">Save failed</span>
          )}
        </div>

        {/* Avatar Upload */}
        <div className="flex items-center gap-6">
          <AvatarUpload
            currentUrl={avatarUrl}
            name={profile.name}
            onUpload={handleAvatarUpload}
          />
          <div>
            <p className="text-sm font-medium">Profile Photo</p>
            <p className="text-muted-foreground text-sm">
              Click to upload. JPG, PNG, GIF, or WebP (max 5MB)
            </p>
          </div>
        </div>

        {/* Display Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="Your display name" {...field} />
              </FormControl>
              <FormDescription>
                How you appear to other community members.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bio */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell the community about yourself..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {field.value?.length || 0}/500 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email (read-only) */}
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={profile.email} disabled className="bg-muted" />
          <p className="text-muted-foreground text-sm">
            Your email address is not publicly visible.
          </p>
        </div>

        {/* Visibility Toggle */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="visibility-toggle">Private Profile</Label>
            <p className="text-muted-foreground text-sm">
              When enabled, only your name and avatar are visible to other
              members. Your bio and other details will be hidden from
              non-admins.
            </p>
          </div>
          <Switch
            id="visibility-toggle"
            checked={watchedVisibility === "private"}
            onCheckedChange={handleVisibilityChange}
          />
        </div>
      </form>
    </Form>
  );
}
