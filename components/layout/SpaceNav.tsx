"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { SpaceNavItem } from "./SpaceNavItem";
import { useSpaceNavigation } from "@/hooks/useSpaceNavigation";

/**
 * Space navigation sidebar component.
 *
 * Displays a list of spaces the user can access, with unread indicators.
 * Uses Convex reactive queries for real-time updates (AC: 5).
 * Supports keyboard navigation via G+S, J/K, Enter (AC: 4).
 */
export function SpaceNav() {
  const pathname = usePathname();
  const spaces = useQuery(api.spaces.queries.listSpacesForMember);

  // Keyboard navigation
  const { focusedIndex, handleKeyDown, isListening } = useSpaceNavigation({
    spaces,
    enabled: true,
  });

  // Extract current space ID from pathname
  const activeSpaceId = React.useMemo(() => {
    const match = pathname?.match(/^\/spaces\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  // Loading state
  if (spaces === undefined) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Spaces</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {/* Show 4 skeleton items while loading */}
            {Array.from({ length: 4 }).map((_, i) => (
              <SidebarMenuSkeleton key={i} showIcon />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // Empty state
  if (spaces.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Spaces</SidebarGroupLabel>
        <SidebarGroupContent>
          <p className="text-muted-foreground px-2 py-4 text-sm">
            No spaces available
          </p>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center justify-between">
        <span>Spaces</span>
        {isListening && (
          <span className="text-muted-foreground text-xs">J/K to navigate</span>
        )}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {spaces.map((space, index) => (
            <SpaceNavItem
              key={space._id}
              spaceId={space._id}
              name={space.name}
              icon={space.icon}
              hasUnread={space.hasUnread}
              isActive={activeSpaceId === space._id}
              isFocused={focusedIndex === index}
              tabIndex={focusedIndex === index ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
