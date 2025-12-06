"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, RotateCcw, FileText } from "lucide-react";

/**
 * Admin Moderation Page
 *
 * Shows deleted posts and allows admins to restore them.
 */
export default function ModerationPage() {
  const deletedPosts = useQuery(api.posts.queries.listDeletedPosts, {
    limit: 50,
  });
  const restorePost = useMutation(api.posts.mutations.restorePost);
  const [restoringIds, setRestoringIds] = useState<Set<string>>(new Set());

  const handleRestore = async (postId: Id<"posts">) => {
    if (restoringIds.has(postId)) return;

    setRestoringIds((prev) => new Set(prev).add(postId));

    try {
      await restorePost({ postId });
      toast.success("Post restored successfully");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to restore post");
      } else {
        toast.error("Failed to restore post");
      }
    } finally {
      setRestoringIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  // Loading state
  if (deletedPosts === undefined) {
    return (
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Content Moderation</h1>
          <p className="text-muted-foreground">
            View and manage deleted content
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Content Moderation</h1>
        <p className="text-muted-foreground">View and manage deleted content</p>
      </div>

      {/* Deleted Posts Section */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Deleted Posts</h2>

        {deletedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
            <FileText className="text-muted-foreground mb-4 h-12 w-12 opacity-50" />
            <h3 className="mb-2 font-medium">No deleted posts</h3>
            <p className="text-muted-foreground text-sm">
              Deleted posts will appear here for potential recovery.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Author</TableHead>
                  <TableHead>Space</TableHead>
                  <TableHead>Content Preview</TableHead>
                  <TableHead>Deleted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletedPosts.map((post) => {
                  const isRestoring = restoringIds.has(post._id);
                  // Extract text preview from content
                  const textPreview = post.contentHtml
                    .replace(/<[^>]*>/g, "")
                    .slice(0, 100);

                  return (
                    <TableRow key={post._id}>
                      <TableCell className="font-medium">
                        {post.authorName}
                      </TableCell>
                      <TableCell>{post.spaceName}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {post.title ? (
                          <span className="font-medium">{post.title}: </span>
                        ) : null}
                        {textPreview}
                        {textPreview.length >= 100 && "..."}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(post.deletedAt, {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(post._id)}
                          disabled={isRestoring}
                        >
                          {isRestoring ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Restoring...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Restore
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
