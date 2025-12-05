"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface LikeButtonProps {
  targetType: "post" | "comment";
  targetId: string;
  initialCount: number;
  initialLiked?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function LikeButton({
  targetType,
  targetId,
  initialCount,
  initialLiked = false,
  className,
  size = "sm",
}: LikeButtonProps) {
  const toggleLike = useMutation(api.likes.mutations.toggleLike);

  // Local optimistic state
  const [isOptimisticLiked, setIsOptimisticLiked] = useState<boolean | null>(
    null
  );
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use optimistic state if set, otherwise use prop values
  const liked = isOptimisticLiked ?? initialLiked;
  const count = optimisticCount ?? initialCount;

  const handleToggle = useCallback(async () => {
    if (isLoading) return;

    // Optimistic update
    const newLiked = !liked;
    const newCount = newLiked ? count + 1 : Math.max(0, count - 1);

    setIsOptimisticLiked(newLiked);
    setOptimisticCount(newCount);
    setIsLoading(true);

    try {
      const result = await toggleLike({ targetType, targetId });

      // Update to actual server values
      setIsOptimisticLiked(result.liked);
      setOptimisticCount(result.newCount);

      if (result.liked) {
        toast.success("Liked! +2 pts to author", { duration: 2000 });
      }
    } catch (error) {
      // Revert on error
      setIsOptimisticLiked(null);
      setOptimisticCount(null);

      if (error instanceof Error) {
        toast.error(error.message || "Failed to update like");
      } else {
        toast.error("Failed to update like");
      }
    } finally {
      setIsLoading(false);
    }
  }, [toggleLike, targetType, targetId, liked, count, isLoading]);

  const iconSizes = {
    sm: "h-4 w-4",
    default: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "gap-1.5 transition-all duration-150",
        liked && "text-red-500 hover:text-red-600",
        className
      )}
    >
      <Heart
        className={cn(
          iconSizes[size],
          "transition-all duration-150",
          liked && "scale-110 fill-red-500 text-red-500",
          isLoading && "animate-pulse"
        )}
      />
      <span className="tabular-nums">{count}</span>
    </Button>
  );
}
