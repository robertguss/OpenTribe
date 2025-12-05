"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageCircle, Share2 } from "lucide-react";
import { LikeButton } from "./LikeButton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

interface PostActionsProps {
  postId: Id<"posts">;
  likeCount: number;
  commentCount: number;
  hasLiked?: boolean;
  className?: string;
}

export function PostActions({
  postId,
  likeCount,
  commentCount,
  hasLiked = false,
  className,
}: PostActionsProps) {
  const router = useRouter();

  // Navigate to comment section
  const handleCommentClick = () => {
    router.push(`/posts/${postId}#comments`);
  };

  // Copy post URL to clipboard
  const handleShareClick = async () => {
    const url = `${window.location.origin}/posts/${postId}`;

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!", { duration: 2000 });
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Link copied to clipboard!", { duration: 2000 });
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Like button */}
      <LikeButton
        targetType="post"
        targetId={postId}
        initialCount={likeCount}
        initialLiked={hasLiked}
      />

      {/* Comment button */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 transition-all duration-150 hover:scale-105"
        onClick={handleCommentClick}
      >
        <MessageCircle className="h-4 w-4" />
        <span className="tabular-nums">{commentCount}</span>
      </Button>

      {/* Share button */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 transition-all duration-150 hover:scale-105"
        onClick={handleShareClick}
      >
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
