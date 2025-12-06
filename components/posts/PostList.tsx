"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PostCard } from "./PostCard";
import { NewPostsBanner } from "./NewPostsBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";

// Helper to compare user IDs
function isOwnPost(
  postAuthorId: Id<"users">,
  currentUserId: Id<"users"> | undefined
): boolean {
  return !!currentUserId && postAuthorId === currentUserId;
}

interface PostListProps {
  spaceId: Id<"spaces">;
}

export function PostList({ spaceId }: PostListProps) {
  const result = useQuery(api.posts.queries.listPostsBySpaceEnhanced, {
    spaceId,
    limit: 20,
  });

  // Get current user profile to determine post ownership
  const currentUser = useQuery(api.members.queries.getMyProfile, {});

  // Track post IDs to detect new posts
  const previousPostIdsRef = useRef<Set<string>>(new Set());
  const [newPostCount, setNewPostCount] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  // Detect scroll position to show new posts banner only when scrolled
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const atTop = scrollTop < 100;
      setIsAtTop(atTop);
      // Reset new post count when scrolled to top
      if (atTop) {
        setNewPostCount(0);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate new posts count based on changes - derive from data
  const currentIds = useMemo(
    () => new Set(result?.posts?.map((p) => p._id as string) ?? []),
    [result?.posts]
  );

  // Detect new posts - update ref and count in a single effect
  useEffect(() => {
    if (result?.posts && previousPostIdsRef.current.size > 0 && !isAtTop) {
      const newPosts = result.posts.filter(
        (p) => !previousPostIdsRef.current.has(p._id as string)
      );
      if (newPosts.length > 0) {
        setNewPostCount((prev) => prev + newPosts.length);
      }
    }
    previousPostIdsRef.current = currentIds;
  }, [currentIds, result?.posts, isAtTop]);

  // Handle showing new posts (scroll to top)
  const handleShowNewPosts = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setNewPostCount(0);
  }, []);

  // Loading state
  if (result === undefined) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="mb-2 h-4 w-32" />
                <Skeleton className="mb-1 h-4 w-full" />
                <Skeleton className="mb-1 h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!result.posts || result.posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageCircle className="text-muted-foreground mb-4 h-12 w-12 opacity-50" />
        <h2 className="mb-2 text-lg font-medium">No posts yet</h2>
        <p className="text-muted-foreground max-w-md text-sm">
          Be the first to start a conversation in this space.
        </p>
      </div>
    );
  }

  return (
    <div ref={listRef} className="relative space-y-4">
      {/* New posts banner */}
      {!isAtTop && newPostCount > 0 && (
        <NewPostsBanner
          newPostCount={newPostCount}
          onShowNewPosts={handleShowNewPosts}
        />
      )}

      {/* Posts list */}
      {result.posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          isOwn={isOwnPost(post.authorId, currentUser?._id)}
        />
      ))}

      {result.hasMore && (
        <div className="py-4 text-center">
          <p className="text-muted-foreground text-sm">
            More posts available - pagination coming soon
          </p>
        </div>
      )}
    </div>
  );
}
