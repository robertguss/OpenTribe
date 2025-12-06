"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditCommentDialogProps {
  commentId: Id<"comments">;
  currentContent: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_CHARS = 500;

export function EditCommentDialog({
  commentId,
  currentContent,
  isOpen,
  onOpenChange,
}: EditCommentDialogProps) {
  const [content, setContent] = useState(currentContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateComment = useMutation(api.comments.mutations.updateComment);

  // Reset content when dialog opens
  useEffect(() => {
    if (isOpen) {
      setContent(currentContent);
    }
  }, [isOpen, currentContent]);

  const handleSubmit = useCallback(async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSubmitting) return;

    // Don't submit if content unchanged
    if (trimmedContent === currentContent) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);

    try {
      await updateComment({
        commentId,
        content: trimmedContent,
      });

      toast.success("Comment updated");
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to update comment");
      } else {
        toast.error("Failed to update comment");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    content,
    updateComment,
    commentId,
    currentContent,
    onOpenChange,
    isSubmitting,
  ]);

  const charsRemaining = MAX_CHARS - content.length;
  const isOverLimit = charsRemaining < 0;
  const canSubmit =
    content.trim().length > 0 &&
    !isOverLimit &&
    !isSubmitting &&
    content.trim() !== currentContent;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Comment</DialogTitle>
          <DialogDescription>
            Make changes to your comment. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <div className="relative">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Edit your comment..."
              disabled={isSubmitting}
              className={cn(
                "min-h-[120px] resize-none",
                isOverLimit &&
                  "border-destructive focus-visible:ring-destructive"
              )}
              rows={4}
            />
            <span
              className={cn(
                "absolute right-2 bottom-2 text-xs",
                isOverLimit
                  ? "text-destructive"
                  : charsRemaining <= 50
                    ? "text-amber-500"
                    : "text-muted-foreground"
              )}
            >
              {charsRemaining}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
