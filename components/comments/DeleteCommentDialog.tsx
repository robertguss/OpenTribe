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

interface DeleteCommentDialogProps {
  commentId: Id<"comments">;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCommentDialog({
  commentId,
  isOpen,
  onOpenChange,
}: DeleteCommentDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteComment = useMutation(api.comments.mutations.deleteComment);

  const handleDelete = useCallback(async () => {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      await deleteComment({ commentId });
      toast.success("Comment deleted");
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to delete comment");
      } else {
        toast.error("Failed to delete comment");
      }
    } finally {
      setIsDeleting(false);
    }
  }, [deleteComment, commentId, onOpenChange, isDeleting]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Comment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this comment? This action cannot be
            undone. The comment will be replaced with &quot;[deleted]&quot; but
            replies will be preserved.
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
