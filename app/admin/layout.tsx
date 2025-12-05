"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = useQuery(api.members.queries.getMyProfile, {});

  // Loading state
  if (profile === undefined) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    );
  }

  // Not authenticated or no profile
  if (profile === null) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <AlertCircle className="text-destructive h-12 w-12" />
          <h1 className="text-2xl font-semibold">Authentication Required</h1>
          <p className="text-muted-foreground">
            Please log in to access the admin area.
          </p>
          <Button asChild>
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Not an admin
  if (profile.role !== "admin") {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <AlertCircle className="text-destructive h-12 w-12" />
          <h1 className="text-2xl font-semibold">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to access the admin area.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Admin - render children
  return <>{children}</>;
}
