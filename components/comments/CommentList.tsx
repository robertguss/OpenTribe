"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CommentItem } from "./CommentItem";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

interface CommentListProps {
  postId: Id<"posts">;
}

function CommentSkeleton({ depth = 0 }: { depth?: number }) {
  return (
    <div
      className={depth > 0 ? "border-border ml-8 border-l-2 pl-4" : undefined}
    >
      <div className="flex gap-3 py-3">
        <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommentList({ postId }: CommentListProps) {
  const comments = useQuery(api.comments.queries.listCommentsByPost, {
    postId,
  });

  // Loading state
  if (comments === undefined) {
    return (
      <div className="space-y-1">
        <CommentSkeleton />
        <CommentSkeleton depth={1} />
        <CommentSkeleton />
      </div>
    );
  }

  // Empty state
  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <MessageSquare className="text-muted-foreground mb-2 h-8 w-8 opacity-50" />
        <p className="text-muted-foreground text-sm">
          No comments yet. Be the first to comment!
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {comments.map((comment) => (
        <CommentItem key={comment._id} comment={comment} depth={0}>
          {/* Render nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-0">
              {comment.replies.map((reply) => (
                <CommentItem key={reply._id} comment={reply} depth={1} />
              ))}
            </div>
          )}
        </CommentItem>
      ))}
    </div>
  );
}
