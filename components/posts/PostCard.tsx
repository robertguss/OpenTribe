"use client";

import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pin, MessageCircle, Heart } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface Post {
  _id: Id<"posts">;
  _creationTime: number;
  spaceId: Id<"spaces">;
  authorId: Id<"users">;
  authorName: string;
  authorAvatar?: string;
  title?: string;
  content: string;
  contentHtml: string;
  likeCount: number;
  commentCount: number;
  pinnedAt?: number;
  editedAt?: number;
  createdAt: number;
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const isPinned = !!post.pinnedAt;
  const isEdited = !!post.editedAt;

  // Get author initials for avatar fallback
  const initials = post.authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className={isPinned ? "border-primary/20 bg-primary/5" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              {post.authorAvatar && (
                <AvatarImage src={post.authorAvatar} alt={post.authorName} />
              )}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{post.authorName}</span>
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
        </div>
      </CardHeader>
      <CardContent>
        {/* Render HTML content */}
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        {/* Engagement stats (read-only for now) */}
        <div className="text-muted-foreground mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span>{post.likeCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            <span>{post.commentCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
