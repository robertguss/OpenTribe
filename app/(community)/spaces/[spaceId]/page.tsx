"use client";

import { useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { PostComposer } from "@/components/posts/PostComposer";
import { PostList } from "@/components/posts/PostList";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Space Detail Page
 *
 * Shows the space header, post composer, and posts feed.
 * Records the visit when the page loads to mark the space as read.
 */
export default function SpaceDetailPage() {
  const params = useParams();
  const spaceId = params.spaceId as Id<"spaces">;

  const space = useQuery(api.spaces.queries.getSpace, { spaceId });
  const recordVisit = useMutation(api.spaceVisits.mutations.recordSpaceVisit);

  // Record visit when page loads (marks space as read)
  useEffect(() => {
    if (space && spaceId) {
      recordVisit({ spaceId }).catch((err) => {
        // Silently fail - user might not be authenticated for public space
        console.debug("Could not record visit:", err);
      });
    }
  }, [space, spaceId, recordVisit]);

  // Handle post creation - scroll to top or refresh
  const handlePostCreated = useCallback(() => {
    // The query will auto-update via Convex reactivity
    // Optionally scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Loading state
  if (space === undefined) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="mb-2 h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="mb-4 h-32 w-full" />
          <Skeleton className="mb-4 h-24 w-full" />
          <Skeleton className="mb-4 h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  // Space not found or deleted
  if (space === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <MessageCircle className="text-muted-foreground mb-4 h-16 w-16 opacity-50" />
        <h1 className="mb-2 text-xl font-semibold">Space not found</h1>
        <p className="text-muted-foreground">
          This space may have been deleted or you may not have access.
        </p>
      </div>
    );
  }

  // Check if user can post in this space
  // For now, we show the composer for all logged-in users
  // The mutation will handle permission checking
  const canPost =
    space.postPermission === "all" || space.postPermission === "moderators";

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Space Header */}
        <div className="border-b p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F0EA] text-2xl">
              {space.icon || "💬"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{space.name}</h1>
                {space.visibility !== "public" && (
                  <Badge variant="secondary" className="text-xs">
                    {space.visibility === "members" ? "Members Only" : "Paid"}
                  </Badge>
                )}
              </div>
              {space.description && (
                <p className="text-muted-foreground text-sm">
                  {space.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Posts Feed with Composer */}
        <div className="flex-1 overflow-auto p-4">
          {/* Post Composer */}
          {canPost && (
            <PostComposer spaceId={spaceId} onPostCreated={handlePostCreated} />
          )}

          {/* Posts List */}
          <PostList spaceId={spaceId} />
        </div>
      </div>
    </TooltipProvider>
  );
}
