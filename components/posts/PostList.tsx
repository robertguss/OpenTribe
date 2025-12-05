"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PostCard } from "./PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";

interface PostListProps {
  spaceId: Id<"spaces">;
}

export function PostList({ spaceId }: PostListProps) {
  const result = useQuery(api.posts.queries.listPostsBySpace, {
    spaceId,
    limit: 20,
  });

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
    <div className="space-y-4">
      {result.posts.map((post) => (
        <PostCard key={post._id} post={post} />
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
