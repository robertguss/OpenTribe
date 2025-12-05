"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/layout/MobileNav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * Community Layout
 *
 * Main layout for community pages with sidebar navigation.
 * Uses the AppSidebar component which contains space navigation.
 * On mobile (<768px), shows bottom navigation bar.
 * Route protection is handled by middleware at /middleware.ts.
 */
export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col pb-16 md:pb-0">
            {children}
          </div>
        </div>
        <MobileNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
