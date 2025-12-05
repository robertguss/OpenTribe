"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LevelBadgeProps {
  level: number;
  levelName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const levelColors: Record<number, string> = {
  1: "bg-gray-400",
  2: "bg-gray-500",
  3: "bg-blue-400",
  4: "bg-blue-500",
  5: "bg-green-400",
  6: "bg-green-500",
  7: "bg-purple-400",
  8: "bg-purple-500",
  9: "bg-amber-400",
  10: "bg-amber-500",
};

const levelNames: Record<number, string> = {
  1: "Newcomer",
  2: "Regular",
  3: "Active",
  4: "Contributor",
  5: "Trusted",
  6: "Expert",
  7: "Veteran",
  8: "Master",
  9: "Legend",
  10: "Champion",
};

export function LevelBadge({
  level,
  levelName,
  size = "sm",
  className,
}: LevelBadgeProps) {
  const sizeClasses = {
    sm: "h-5 w-5 text-xs",
    md: "h-6 w-6 text-sm",
    lg: "h-8 w-8 text-base",
  };

  const displayName = levelName || levelNames[level] || `Level ${level}`;
  const colorClass = levelColors[Math.min(level, 10)] || "bg-amber-500";

  const badge = (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white shadow-sm",
        colorClass,
        sizeClasses[size],
        className
      )}
    >
      {level}
    </span>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>{displayName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
