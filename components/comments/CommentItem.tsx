"use client";

import { useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { LikeButton } from "@/components/posts/LikeButton";
import { CommentInput } from "./CommentInput";
import { EditCommentDialog } from "./EditCommentDialog";
import { DeleteCommentDialog } from "./DeleteCommentDialog";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

interface CommentData {
  _id: Id<"comments">;
  postId: Id<"posts">;
  authorId: Id<"users">;
  authorName: string;
  authorAvatar?: string;
  authorLevel: number;
  parentId?: Id<"comments">;
  content: string;
  likeCount: number;
  hasLiked: boolean;
  isOwn: boolean;
  createdAt: number;
  editedAt?: number;
  deletedAt?: number;
}

interface CommentItemProps {
  comment: CommentData;
  depth?: number;
  children?: React.ReactNode;
}

export function CommentItem({
  comment,
  depth = 0,
  children,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isDeleted = !!comment.deletedAt;
  const initials = comment.authorName.slice(0, 2).toUpperCase();

  const handleReplySuccess = useCallback(() => {
    setIsReplying(false);
  }, []);

  return (
    <div
      className={cn("group", depth > 0 && "border-border ml-8 border-l-2 pl-4")}
    >
      <div className="flex gap-3 py-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          {!isDeleted && (
            <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
          )}
          <AvatarFallback className={isDeleted ? "bg-muted" : undefined}>
            {isDeleted ? "?" : initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isDeleted ? (
              <span className="text-muted-foreground text-sm">[deleted]</span>
            ) : (
              <>
                <span className="text-sm font-medium">
                  {comment.authorName}
                </span>
                <LevelBadge level={comment.authorLevel} size="sm" />
              </>
            )}
            <span className="text-muted-foreground text-xs">
              {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
            </span>
            {comment.editedAt && !isDeleted && (
              <span className="text-muted-foreground text-xs">(edited)</span>
            )}
          </div>

          <p
            className={cn(
              "mt-1 text-sm break-words",
              isDeleted && "text-muted-foreground italic"
            )}
          >
            {comment.content}
          </p>

          {!isDeleted && (
            <div className="mt-2 flex items-center gap-1">
              <LikeButton
                targetType="comment"
                targetId={comment._id}
                initialCount={comment.likeCount}
                initialLiked={comment.hasLiked}
                size="sm"
              />
              {/* Only show reply button at top level (depth 0) */}
              {depth === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplying(!isReplying)}
                  className="text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <MessageSquare className="h-4 w-4" />
                  Reply
                </Button>
              )}
              {comment.isOwn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          {/* Reply input */}
          {isReplying && !isDeleted && (
            <div className="mt-3">
              <CommentInput
                postId={comment.postId}
                parentId={comment._id}
                onSuccess={handleReplySuccess}
                onCancel={() => setIsReplying(false)}
                placeholder={`Reply to ${comment.authorName}...`}
                autoFocus
              />
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {children}

      {/* Edit Dialog */}
      <EditCommentDialog
        commentId={comment._id}
        currentContent={comment.content}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      {/* Delete Dialog */}
      <DeleteCommentDialog
        commentId={comment._id}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </div>
  );
}
