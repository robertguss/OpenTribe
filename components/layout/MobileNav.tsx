"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Bell, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  matchPattern?: RegExp;
}

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    matchPattern: /^\/$/,
  },
  {
    href: "/spaces",
    label: "Spaces",
    icon: MessageCircle,
    matchPattern: /^\/spaces/,
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    matchPattern: /^\/notifications/,
  },
  {
    href: "/settings/profile",
    label: "Profile",
    icon: User,
    matchPattern: /^\/settings/,
  },
];

/**
 * Mobile Bottom Navigation
 *
 * Shows a fixed bottom tab bar on mobile devices (<768px).
 * Provides quick access to main sections: Home, Spaces, Notifications, Profile.
 *
 * The Spaces tab opens the sidebar sheet containing the full space list.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  // Only render on mobile
  if (!isMobile) {
    return null;
  }

  const handleSpacesClick = (e: React.MouseEvent) => {
    // Open the sidebar sheet when Spaces is tapped
    e.preventDefault();
    setOpenMobile(true);
  };

  return (
    <nav className="bg-background fixed right-0 bottom-0 left-0 z-50 border-t md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.matchPattern
            ? item.matchPattern.test(pathname)
            : pathname === item.href;

          // Special handling for Spaces tab - opens sidebar
          if (item.href === "/spaces") {
            return (
              <button
                key={item.href}
                onClick={handleSpacesClick}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2",
                  "transition-colors",
                  isActive
                    ? "text-[#4A7C59]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2",
                "transition-colors",
                isActive
                  ? "text-[#4A7C59]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for devices with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
