"use client";

import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewPostsBannerProps {
  newPostCount: number;
  onShowNewPosts: () => void;
  className?: string;
}

export function NewPostsBanner({
  newPostCount,
  onShowNewPosts,
  className,
}: NewPostsBannerProps) {
  // Derive visibility from prop - no need for effect
  const isVisible = newPostCount > 0;

  const handleClick = () => {
    onShowNewPosts();
  };

  if (!isVisible || newPostCount === 0) {
    return null;
  }

  return (
    <div
      className={cn("sticky top-0 z-10 flex justify-center py-2", className)}
    >
      <Button
        variant="default"
        size="sm"
        onClick={handleClick}
        className="gap-2 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
      >
        <ArrowUp className="h-4 w-4" />
        <span>
          {newPostCount} new {newPostCount === 1 ? "post" : "posts"}
        </span>
      </Button>
    </div>
  );
}
