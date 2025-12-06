"use client";

import { ActivityFeed } from "@/components/feed";

/**
 * Community Home Page
 *
 * Shows the aggregated activity feed across all accessible spaces.
 * Features:
 * - Infinite scroll pagination
 * - Filter tabs (All, Following, Popular)
 * - New posts indicator
 * - Real-time updates via Convex reactivity
 */
export default function CommunityHomePage() {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Welcome to the Community</h1>
      <ActivityFeed />
    </div>
  );
}
