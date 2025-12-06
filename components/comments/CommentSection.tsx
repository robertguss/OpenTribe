"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { CommentInput } from "./CommentInput";
import { CommentList } from "./CommentList";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommentSectionProps {
  postId: Id<"posts">;
  commentCount: number;
  defaultExpanded?: boolean;
  className?: string;
}

export function CommentSection({
  postId,
  commentCount,
  defaultExpanded = true,
  className,
}: CommentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="-ml-2 gap-2 text-base font-semibold hover:bg-transparent"
        >
          <MessageSquare className="h-5 w-5" />
          Comments ({commentCount})
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Comment input */}
          <div className="bg-card rounded-lg border p-4">
            <CommentInput postId={postId} />
          </div>

          {/* Comment list */}
          <div className="bg-card rounded-lg border">
            <CommentList postId={postId} />
          </div>
        </div>
      )}
    </div>
  );
}
