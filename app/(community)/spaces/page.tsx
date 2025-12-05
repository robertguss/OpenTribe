"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

/**
 * Space Directory Page
 *
 * Shows all accessible spaces in a grid/list format.
 */
export default function SpacesPage() {
  const spaces = useQuery(api.spaces.queries.listSpacesForMember);

  // Loading state
  if (spaces === undefined) {
    return (
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold">Spaces</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Spaces</h1>
        <span className="text-muted-foreground text-sm">
          {spaces.length} space{spaces.length !== 1 ? "s" : ""}
        </span>
      </div>

      {spaces.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No spaces available yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <Link
              key={space._id}
              href={`/spaces/${space._id}`}
              className="group relative flex flex-col rounded-lg border p-4 transition-colors hover:border-[#4A7C59] hover:bg-[#F4F8F5]"
            >
              <div className="mb-2 flex items-center gap-3">
                <span className="text-2xl">{space.icon || "💬"}</span>
                <h3 className="font-semibold group-hover:text-[#4A7C59]">
                  {space.name}
                </h3>
                {space.hasUnread && (
                  <span
                    className="ml-auto h-2 w-2 rounded-full bg-[#4A7C59]"
                    title="New posts"
                  />
                )}
              </div>
              {space.description && (
                <p className="text-muted-foreground mb-2 line-clamp-2 text-sm">
                  {space.description}
                </p>
              )}
              <div className="mt-auto flex gap-2 pt-2">
                {space.visibility !== "public" && (
                  <Badge variant="secondary" className="text-xs">
                    {space.visibility === "members" ? "Members" : "Paid"}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
