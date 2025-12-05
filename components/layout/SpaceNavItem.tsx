"use client";

import * as React from "react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Id } from "@/convex/_generated/dataModel";

interface SpaceNavItemProps {
  spaceId: Id<"spaces">;
  name: string;
  icon?: string;
  hasUnread: boolean;
  isActive: boolean;
  isFocused?: boolean;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

/**
 * Render a space icon - either emoji or Lucide icon
 */
function SpaceIcon({ icon }: { icon?: string }) {
  // If no icon, use default
  if (!icon) {
    return <MessageCircle className="h-4 w-4" />;
  }

  // Check if it's a Lucide icon name (PascalCase)
  const LucideIcon = LucideIcons[icon as keyof typeof LucideIcons];
  if (LucideIcon && typeof LucideIcon === "function") {
    const IconComponent = LucideIcon as React.ComponentType<{
      className?: string;
    }>;
    return <IconComponent className="h-4 w-4" />;
  }

  // Otherwise treat as emoji
  return <span className="text-sm">{icon}</span>;
}

/**
 * Individual space item in the sidebar navigation.
 *
 * Displays the space icon, name, and unread indicator dot.
 * Uses UX spec colors for active and hover states.
 */
export function SpaceNavItem({
  spaceId,
  name,
  icon,
  hasUnread,
  isActive,
  isFocused = false,
  tabIndex = 0,
  onKeyDown,
}: SpaceNavItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={cn(
          "transition-colors duration-150 ease-out",
          // Active state: green background per UX spec (#E8F0EA)
          isActive && "bg-[#E8F0EA] text-[#4A7C59] hover:bg-[#E8F0EA]",
          // Hover state: subtle green tint per UX spec (#F4F8F5)
          !isActive && "hover:bg-[#F4F8F5]",
          // Focus state for keyboard navigation
          isFocused && "ring-2 ring-[#4A7C59] ring-offset-1"
        )}
        tooltip={name}
      >
        <Link
          href={`/spaces/${spaceId}`}
          tabIndex={tabIndex}
          onKeyDown={onKeyDown}
          className="flex w-full items-center gap-2"
        >
          <SpaceIcon icon={icon} />
          <span className="flex-1 truncate">{name}</span>
          {hasUnread && (
            <span
              className="h-2 w-2 flex-shrink-0 rounded-full bg-[#4A7C59]"
              aria-label="Unread posts"
            />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
