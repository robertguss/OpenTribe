"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { IconUser, IconBell } from "@tabler/icons-react";

const settingsNavItems = [
  {
    title: "Profile",
    href: "/settings/profile",
    icon: IconUser,
  },
  {
    title: "Notifications",
    href: "/settings/notifications",
    icon: IconBell,
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Settings sidebar */}
        <nav className="w-full shrink-0 md:w-48">
          <h2 className="mb-4 text-lg font-semibold">Settings</h2>
          <ul className="space-y-1">
            {settingsNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content area */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
