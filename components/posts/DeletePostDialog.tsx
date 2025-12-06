"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DeletePostDialogProps {
  postId: Id<"posts">;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeletePostDialog({
  postId,
  isOpen,
  onOpenChange,
  onDeleted,
}: DeletePostDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deletePost = useMutation(api.posts.mutations.deletePost);

  const handleDelete = useCallback(async () => {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      await deletePost({ postId });
      toast.success("Post deleted");
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to delete post");
      } else {
        toast.error("Failed to delete post");
      }
    } finally {
      setIsDeleting(false);
    }
  }, [deletePost, postId, onOpenChange, onDeleted, isDeleting]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this post?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone. Your post will be removed from the feed, but
            comments will be preserved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
