"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PostCard } from "@/components/posts/PostCard";
import { NewPostsBanner } from "@/components/posts/NewPostsBanner";
import { FeedFilterTabs, type FeedFilter } from "./FeedFilterTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, MessageCircle, AlertCircle } from "lucide-react";

// Helper to compare user IDs
function isOwnPost(
  postAuthorId: Id<"users">,
  currentUserId: Id<"users"> | undefined
): boolean {
  return !!currentUserId && postAuthorId === currentUserId;
}

// Extended Post type with space info for activity feed
interface ActivityFeedPost {
  _id: Id<"posts">;
  _creationTime: number;
  spaceId: Id<"spaces">;
  spaceName: string;
  spaceIcon?: string;
  authorId: Id<"users">;
  authorName: string;
  authorAvatar?: string;
  authorLevel: number;
  title?: string;
  content: string;
  contentHtml: string;
  mediaIds?: Id<"_storage">[];
  likeCount: number;
  commentCount: number;
  pinnedAt?: number;
  editedAt?: number;
  createdAt: number;
  hasLiked: boolean;
}

export function ActivityFeed() {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [loadedCursors, setLoadedCursors] = useState<Set<string>>(
    new Set(["initial"])
  );
  const [allPosts, setAllPosts] = useState<ActivityFeedPost[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // Track pending cursor to determine if we're loading more
  const pendingCursorRef = useRef<string | null>(null);

  // Get current user profile to determine post ownership and moderation rights
  const currentUser = useQuery(api.members.queries.getMyProfile, {});

  // Check if current user is a moderator or admin
  const isModerator =
    currentUser?.role === "admin" || currentUser?.role === "moderator";

  // Select query based on filter
  const queryForFilter = {
    all: api.feed.queries.listActivityFeed,
    following: api.feed.queries.listActivityFeedFollowing,
    popular: api.feed.queries.listActivityFeedPopular,
  }[activeFilter];

  const result = useQuery(queryForFilter, {
    limit: 20,
    cursor,
  });

  // Refs to hold latest values for use in intersection observer callback
  const resultRef = useRef(result);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const loadedCursorsRef = useRef(loadedCursors);

  // Sync refs with latest values via effect (avoids setting ref during render)
  useEffect(() => {
    resultRef.current = result;
    isLoadingMoreRef.current = isLoadingMore;
    loadedCursorsRef.current = loadedCursors;
  });

  // Infinite scroll detection with direct callback
  const { ref: loadMoreRef } = useInView({
    threshold: 0,
    rootMargin: "200px",
    onChange: (inViewNow) => {
      const currentResult = resultRef.current;
      const currentIsLoadingMore = isLoadingMoreRef.current;
      const currentLoadedCursors = loadedCursorsRef.current;

      if (
        inViewNow &&
        currentResult?.hasMore &&
        !currentIsLoadingMore &&
        currentResult.nextCursor &&
        !currentLoadedCursors.has(currentResult.nextCursor)
      ) {
        setIsLoadingMore(true);
        pendingCursorRef.current = currentResult.nextCursor;
        setCursor(currentResult.nextCursor);
        setLoadedCursors(
          (prev) => new Set([...prev, currentResult.nextCursor!])
        );
      }
    },
  });

  // Track the first page's newest post ID to detect new posts arriving
  const firstPageNewestPostIdRef = useRef<string | null>(null);
  const [newPostCount, setNewPostCount] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);

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

  // Derive error state from result
  const queryError =
    result === null ? "Failed to load activity feed. Please try again." : null;

  // Process results - handles both initial load and pagination
  useEffect(() => {
    if (result?.posts) {
      setAllPosts((prev) => {
        // If this is the first page (no cursor), replace all posts
        if (!cursor) {
          // Track the newest post ID for new posts detection
          if (result.posts.length > 0) {
            const newestId = result.posts[0]._id as string;
            // Detect new posts: if we had a previous newest and it's different
            if (
              firstPageNewestPostIdRef.current &&
              firstPageNewestPostIdRef.current !== newestId &&
              !isAtTop
            ) {
              // Count how many posts are newer than our previous newest
              const prevNewestIdx = result.posts.findIndex(
                (p) => p._id === firstPageNewestPostIdRef.current
              );
              if (prevNewestIdx > 0) {
                setNewPostCount(prevNewestIdx);
              }
            }
            firstPageNewestPostIdRef.current = newestId;
          }
          return result.posts as ActivityFeedPost[];
        }

        // For pagination, merge with existing posts, updating any that changed
        const existingMap = new Map(prev.map((p) => [p._id as string, p]));

        // Update existing posts and add new ones
        for (const post of result.posts) {
          existingMap.set(post._id as string, post as ActivityFeedPost);
        }

        // Convert back to array and sort by createdAt DESC
        const merged = Array.from(existingMap.values());
        merged.sort((a, b) => b.createdAt - a.createdAt);

        return merged;
      });
      setIsLoadingMore(false);
    }
  }, [result?.posts, cursor, isAtTop]);

  // Handle filter change - reset state
  const handleFilterChange = useCallback((filter: FeedFilter) => {
    setActiveFilter(filter);
    setCursor(undefined);
    setLoadedCursors(new Set(["initial"]));
    setAllPosts([]);
    setNewPostCount(0);
    setIsLoadingMore(false);
    firstPageNewestPostIdRef.current = null;
    pendingCursorRef.current = null;
  }, []);

  // Handle showing new posts (scroll to top)
  const handleShowNewPosts = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setNewPostCount(0);
  }, []);

  // Loading state (initial load)
  if (result === undefined && allPosts.length === 0) {
    return (
      <div className="space-y-6">
        <FeedFilterTabs
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />
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
      </div>
    );
  }

  // Error state
  if (queryError) {
    return (
      <div className="space-y-6">
        <FeedFilterTabs
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="text-destructive mb-4 h-12 w-12 opacity-70" />
          <h2 className="mb-2 text-lg font-medium">Something went wrong</h2>
          <p className="text-muted-foreground mb-4 max-w-md text-sm">
            {queryError}
          </p>
          <button
            onClick={() => handleFilterChange(activeFilter)}
            className="text-primary text-sm font-medium hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (allPosts.length === 0 && result?.posts?.length === 0) {
    const emptyMessages = {
      all: "No posts yet. Be the first to start a conversation!",
      following:
        "No posts from people you follow. Try following some members to see their posts here.",
      popular:
        "No popular posts in the last 7 days. Check back later or explore the All tab.",
    };

    return (
      <div className="space-y-6">
        <FeedFilterTabs
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageCircle className="text-muted-foreground mb-4 h-12 w-12 opacity-50" />
          <h2 className="mb-2 text-lg font-medium">No posts found</h2>
          <p className="text-muted-foreground max-w-md text-sm">
            {emptyMessages[activeFilter]}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Filter tabs */}
      <FeedFilterTabs
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      {/* New posts banner */}
      {!isAtTop && newPostCount > 0 && (
        <NewPostsBanner
          newPostCount={newPostCount}
          onShowNewPosts={handleShowNewPosts}
        />
      )}

      {/* Posts list */}
      <div className="space-y-4">
        {allPosts.map((post) => (
          <div key={post._id}>
            {/* Space info header */}
            <Link
              href={`/spaces/${post.spaceId}`}
              className="text-muted-foreground mb-2 flex items-center gap-2 text-sm transition-colors hover:text-[#4A7C59]"
            >
              <span className="text-base">{post.spaceIcon || "💬"}</span>
              <span>{post.spaceName}</span>
            </Link>

            {/* Post card */}
            <PostCard
              post={{
                ...post,
                authorLevel: post.authorLevel,
              }}
              isOwn={isOwnPost(post.authorId, currentUser?._id)}
              isModerator={isModerator}
            />
          </div>
        ))}
      </div>

      {/* Load more trigger / loading indicator */}
      {result?.hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isLoadingMore && (
            <div className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading more posts...</span>
            </div>
          )}
        </div>
      )}

      {/* End of feed */}
      {!result?.hasMore && allPosts.length > 0 && (
        <div className="py-4 text-center">
          <p className="text-muted-foreground text-sm">
            You&apos;ve reached the end of the feed
          </p>
        </div>
      )}
    </div>
  );
}
