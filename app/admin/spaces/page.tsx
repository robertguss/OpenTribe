"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SpaceList } from "@/components/admin/SpaceList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSpacesPage() {
  // Use admin-only query that verifies admin role
  const spaces = useQuery(api.spaces.queries.listSpacesForAdmin, {});

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Space Management</CardTitle>
        </CardHeader>
        <CardContent>
          {spaces === undefined ? (
            <SpaceListSkeleton />
          ) : (
            <SpaceList spaces={spaces} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SpaceListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}
