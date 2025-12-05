"use client";

import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPrefsFormData,
} from "@/lib/validators";
import { useDebounce } from "@/hooks/useDebounce";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

type SaveState = "idle" | "saving" | "saved" | "error";

// Constants for timeout durations (in milliseconds)
const SAVE_SUCCESS_DISPLAY_MS = 2000;
const SAVE_ERROR_DISPLAY_MS = 3000;
const DEBOUNCE_DELAY_MS = 500;

/**
 * Notification category groupings
 */
const NOTIFICATION_CATEGORIES = [
  {
    title: "Content",
    toggles: [
      {
        key: "emailComments" as const,
        label: "Comments on my posts",
        description: "Get notified when someone comments on your posts",
      },
      {
        key: "emailReplies" as const,
        label: "Replies to my comments",
        description: "Get notified when someone replies to your comments",
      },
    ],
  },
  {
    title: "Social",
    toggles: [
      {
        key: "emailFollowers" as const,
        label: "New followers",
        description: "Get notified when someone follows you",
      },
    ],
  },
  {
    title: "Activity",
    toggles: [
      {
        key: "emailEvents" as const,
        label: "Event reminders",
        description: "Get notified about upcoming events you've RSVP'd to",
      },
      {
        key: "emailCourses" as const,
        label: "Course updates",
        description: "Get notified about new lessons and course updates",
      },
    ],
  },
  {
    title: "Messages",
    toggles: [
      {
        key: "emailDMs" as const,
        label: "Direct messages",
        description: "Get notified when you receive a direct message",
      },
    ],
  },
];

/**
 * Digest frequency options
 */
const DIGEST_OPTIONS = [
  {
    value: "immediate" as const,
    label: "Immediate",
    description: "Receive emails as activity happens",
  },
  {
    value: "daily" as const,
    label: "Daily digest",
    description: "Receive a summary once per day",
  },
  {
    value: "weekly" as const,
    label: "Weekly digest",
    description: "Receive a summary once per week",
  },
  {
    value: "off" as const,
    label: "Off",
    description: "Don't receive any email notifications",
  },
];

export function NotificationPreferencesForm() {
  const profile = useQuery(api.members.queries.getMyProfile, {});
  const updateNotificationPrefs = useMutation(
    api.members.mutations.updateNotificationPrefs
  );

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [prefs, setPrefs] = useState<NotificationPrefsFormData>(
    DEFAULT_NOTIFICATION_PREFS
  );
  const [lastError, setLastError] = useState<string | null>(null);
  const hasInitializedRef = useRef(false);
  const isSavingRef = useRef(false);

  // Track the last saved prefs to detect changes (use ref to avoid dependency issues)
  const lastSavedPrefsRef = useRef<NotificationPrefsFormData>(
    DEFAULT_NOTIFICATION_PREFS
  );

  // Debounce prefs for auto-save
  const debouncedPrefs = useDebounce(prefs, DEBOUNCE_DELAY_MS);

  // Initialize prefs from profile
  // This effect synchronizes external state (profile from Convex) with local state
  // setState here is intentional - we're responding to external data changes
  useEffect(() => {
    if (profile && !hasInitializedRef.current) {
      const currentPrefs =
        profile.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS;
      setPrefs(currentPrefs);
      lastSavedPrefsRef.current = currentPrefs;
      hasInitializedRef.current = true;
    }
  }, [profile]);

  // Handle save - defined outside useCallback to avoid dep issues
  // Includes guard to prevent concurrent saves
  const handleSave = async (prefsToSave: NotificationPrefsFormData) => {
    // Prevent concurrent saves
    if (isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setSaveState("saving");
    setLastError(null);

    try {
      await updateNotificationPrefs(prefsToSave);
      lastSavedPrefsRef.current = prefsToSave;
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), SAVE_SUCCESS_DISPLAY_MS);
    } catch (error) {
      console.error("Save failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setLastError(errorMessage);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), SAVE_ERROR_DISPLAY_MS);
    } finally {
      isSavingRef.current = false;
    }
  };

  // Retry save after error
  const handleRetry = () => {
    handleSave(prefs);
  };

  // Auto-save effect for debounced preferences
  // Intentionally excluding handleSave from deps:
  // - handleSave is recreated on every render but its identity change shouldn't trigger saves
  // We only want to trigger saves when the debounced prefs actually change
  useEffect(() => {
    // Only save if initialized and prefs have changed from last saved
    if (
      hasInitializedRef.current &&
      JSON.stringify(debouncedPrefs) !==
        JSON.stringify(lastSavedPrefsRef.current)
    ) {
      handleSave(debouncedPrefs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPrefs]);

  // Handle toggle change
  const handleToggleChange = (
    key: keyof Omit<NotificationPrefsFormData, "digestFrequency">,
    checked: boolean
  ) => {
    setPrefs((prev) => ({ ...prev, [key]: checked }));
  };

  // Handle digest frequency change
  const handleDigestChange = (
    value: NotificationPrefsFormData["digestFrequency"]
  ) => {
    setPrefs((prev) => ({ ...prev, digestFrequency: value }));
  };

  // Loading state
  if (profile === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
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
    <div className="space-y-6" data-testid="notification-preferences-form">
      {/* Save State Indicator */}
      <div className="text-muted-foreground flex items-center justify-end gap-2 text-sm">
        {saveState === "saving" && (
          <span className="text-yellow-600" data-testid="save-state-saving">
            Saving...
          </span>
        )}
        {saveState === "saved" && (
          <span className="text-green-600" data-testid="save-state-saved">
            Saved
          </span>
        )}
        {saveState === "error" && (
          <div
            className="flex items-center gap-2"
            data-testid="save-state-error"
          >
            <span className="text-red-600">
              Save failed{lastError ? `: ${lastError}` : ""}
            </span>
            <button
              type="button"
              onClick={handleRetry}
              className="text-primary hover:text-primary/80 underline"
              data-testid="retry-save-button"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Notification Toggles by Category */}
      {NOTIFICATION_CATEGORIES.map((category, categoryIndex) => (
        <div
          key={category.title}
          className="space-y-4"
          data-testid={`category-${category.title.toLowerCase()}`}
        >
          <h3 className="text-sm font-medium">{category.title}</h3>
          <div className="space-y-4">
            {category.toggles.map((toggle) => (
              <div
                key={toggle.key}
                className="flex items-center justify-between rounded-lg border p-4"
                data-testid={`toggle-container-${toggle.key}`}
              >
                <div className="space-y-0.5">
                  <Label htmlFor={toggle.key}>{toggle.label}</Label>
                  <p className="text-muted-foreground text-sm">
                    {toggle.description}
                  </p>
                </div>
                <Switch
                  id={toggle.key}
                  checked={prefs[toggle.key]}
                  onCheckedChange={(checked) =>
                    handleToggleChange(toggle.key, checked)
                  }
                  data-testid={`toggle-${toggle.key}`}
                />
              </div>
            ))}
          </div>
          {categoryIndex < NOTIFICATION_CATEGORIES.length - 1 && (
            <Separator className="my-4" />
          )}
        </div>
      ))}

      <Separator className="my-6" />

      {/* Email Digest Frequency */}
      <div className="space-y-4" data-testid="digest-frequency-section">
        <h3 className="text-sm font-medium">Email Digest</h3>
        <p className="text-muted-foreground text-sm">
          Choose how often you want to receive email notifications
        </p>
        <RadioGroup
          value={prefs.digestFrequency}
          onValueChange={(value) => {
            // Type guard to ensure value is a valid digest frequency
            const validFrequencies = [
              "immediate",
              "daily",
              "weekly",
              "off",
            ] as const;
            if (
              validFrequencies.includes(
                value as (typeof validFrequencies)[number]
              )
            ) {
              handleDigestChange(
                value as NotificationPrefsFormData["digestFrequency"]
              );
            }
          }}
          className="space-y-3"
          data-testid="digest-frequency-radio-group"
        >
          {DIGEST_OPTIONS.map((option) => (
            <div
              key={option.value}
              className="flex items-center space-x-3 rounded-lg border p-4"
              data-testid={`digest-option-${option.value}`}
            >
              <RadioGroupItem value={option.value} id={option.value} />
              <div className="space-y-0.5">
                <Label htmlFor={option.value} className="cursor-pointer">
                  {option.label}
                </Label>
                <p className="text-muted-foreground text-sm">
                  {option.description}
                </p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
