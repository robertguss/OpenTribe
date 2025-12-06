"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Pin, Trash2 } from "lucide-react";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { PostActions } from "./PostActions";
import { EditPostDialog } from "./EditPostDialog";
import { DeletePostDialog } from "./DeletePostDialog";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

interface Post {
  _id: Id<"posts">;
  _creationTime: number;
  spaceId: Id<"spaces">;
  authorId: Id<"users">;
  authorName: string;
  authorAvatar?: string;
  authorLevel?: number;
  title?: string;
  content: string;
  contentHtml: string;
  likeCount: number;
  commentCount: number;
  pinnedAt?: number;
  editedAt?: number;
  createdAt: number;
  hasLiked?: boolean;
}

interface PostCardProps {
  post: Post;
  showActions?: boolean;
  isOwn?: boolean;
}

export function PostCard({
  post,
  showActions = true,
  isOwn = false,
}: PostCardProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isPinned = !!post.pinnedAt;
  const isEdited = !!post.editedAt;

  // Get author initials for avatar fallback
  const initials = post.authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Navigate to post detail page when clicking content
  const handleContentClick = () => {
    router.push(`/posts/${post._id}`);
  };

  return (
    <>
      <Card
        className={cn("group", isPinned && "border-primary/20 bg-primary/5")}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {post.authorAvatar && (
                  <AvatarImage src={post.authorAvatar} alt={post.authorName} />
                )}
                <AvatarFallback className="text-sm">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{post.authorName}</span>
                  {post.authorLevel && (
                    <LevelBadge level={post.authorLevel} size="sm" />
                  )}
                  {isPinned && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                  {isEdited && " (edited)"}
                </p>
              </div>
            </div>
            {isOwn && (
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
        </CardHeader>
        <CardContent>
          {/* Title if present */}
          {post.title && (
            <h3
              className="mb-2 cursor-pointer text-lg font-semibold hover:underline"
              onClick={handleContentClick}
            >
              {post.title}
            </h3>
          )}

          {/* Render HTML content - clickable to navigate to detail */}
          <div
            className="prose prose-sm dark:prose-invert max-w-none cursor-pointer"
            onClick={handleContentClick}
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          {/* Action bar */}
          {showActions && (
            <PostActions
              postId={post._id}
              likeCount={post.likeCount}
              commentCount={post.commentCount}
              hasLiked={post.hasLiked}
              className="mt-4 border-t pt-3"
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {isOwn && (
        <EditPostDialog
          postId={post._id}
          initialContent={post.content}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}

      {/* Delete Dialog */}
      {isOwn && (
        <DeletePostDialog
          postId={post._id}
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        />
      )}
    </>
  );
}
