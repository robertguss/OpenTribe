"use client";

import { useState, useCallback, useRef, KeyboardEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CommentInputProps {
  postId: Id<"posts">;
  parentId?: Id<"comments">;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

const MAX_CHARS = 500;

export function CommentInput({
  postId,
  parentId,
  onSuccess,
  onCancel,
  placeholder = "Write a comment...",
  autoFocus = false,
  className,
}: CommentInputProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createComment = useMutation(api.comments.mutations.createComment);

  const handleSubmit = useCallback(async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await createComment({
        postId,
        content: trimmedContent,
        parentId,
      });

      setContent("");
      toast.success("Comment posted! +5 pts", { duration: 2000 });
      onSuccess?.();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to post comment");
      } else {
        toast.error("Failed to post comment");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [content, createComment, postId, parentId, onSuccess, isSubmitting]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Cmd+Enter or Ctrl+Enter
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleCancel = useCallback(() => {
    setContent("");
    onCancel?.();
  }, [onCancel]);

  const charsRemaining = MAX_CHARS - content.length;
  const isOverLimit = charsRemaining < 0;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !isSubmitting;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={isSubmitting}
          className={cn(
            "min-h-[80px] resize-none pr-12",
            isOverLimit && "border-destructive focus-visible:ring-destructive"
          )}
          rows={3}
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

      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          Press ⌘+Enter to submit
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {parentId ? "Reply" : "Comment"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
