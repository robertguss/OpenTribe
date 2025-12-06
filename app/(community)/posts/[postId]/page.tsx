"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { PostCard } from "@/components/posts/PostCard";
import { CommentSection } from "@/components/comments";
import { TooltipProvider } from "@/components/ui/tooltip";

// Helper to compare user IDs
function isOwnPost(
  postAuthorId: Id<"users">,
  currentUserId: Id<"users"> | undefined
): boolean {
  return !!currentUserId && postAuthorId === currentUserId;
}

/**
 * Post Detail Page
 *
 * Shows the full post with comments section.
 */
export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as Id<"posts">;

  const post = useQuery(api.posts.queries.getPostWithDetails, { postId });

  // Get current user profile to determine post ownership
  const currentUser = useQuery(api.members.queries.getMyProfile, {});

  // Navigate back to space
  const handleBack = () => {
    if (post?.spaceId) {
      router.push(`/spaces/${post.spaceId}`);
    } else {
      router.back();
    }
  };

  // Loading state
  if (post === undefined) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="mb-4 h-48 w-full" />
          <Skeleton className="mb-4 h-32 w-full" />
        </div>
      </div>
    );
  }

  // Post not found or deleted
  if (post === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <MessageCircle className="text-muted-foreground mb-4 h-16 w-16 opacity-50" />
        <h1 className="mb-2 text-xl font-semibold">Post not found</h1>
        <p className="text-muted-foreground mb-4">
          This post may have been deleted or you may not have access.
        </p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Go to Home
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Header with back button and space name */}
        <div className="border-b p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold">{post.spaceName}</h1>
              <p className="text-muted-foreground text-xs">Post details</p>
            </div>
          </div>
        </div>

        {/* Post content */}
        <div className="flex-1 overflow-auto p-4">
          <PostCard
            post={post}
            isOwn={isOwnPost(post.authorId, currentUser?._id)}
          />

          {/* Comments section */}
          <div id="comments" className="mt-6">
            <CommentSection
              postId={postId}
              commentCount={post.commentCount}
              defaultExpanded={true}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
