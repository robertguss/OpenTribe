"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Space = {
  _id: Id<"spaces">;
  _creationTime: number;
  name: string;
  description?: string;
  icon?: string;
  visibility: "public" | "members" | "paid";
  postPermission: "all" | "moderators" | "admin";
  requiredTier?: string;
  order: number;
  createdAt: number;
};

type SpaceListItemProps = {
  space: Space;
  onEdit: () => void;
  onDelete: () => void;
  isDragOverlay?: boolean;
};

const visibilityLabels: Record<Space["visibility"], string> = {
  public: "Public",
  members: "Members",
  paid: "Paid",
};

const visibilityVariants: Record<
  Space["visibility"],
  "default" | "secondary" | "outline"
> = {
  public: "default",
  members: "secondary",
  paid: "outline",
};

export function SpaceListItem({
  space,
  onEdit,
  onDelete,
  isDragOverlay = false,
}: SpaceListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: space._id, disabled: isDragOverlay });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-background flex items-center gap-4 rounded-lg border p-4 transition-colors",
        isDragging && "opacity-50",
        isDragOverlay && "ring-primary shadow-lg ring-2"
      )}
    >
      {/* Drag Handle */}
      <button
        className="text-muted-foreground hover:text-foreground cursor-grab touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Icon */}
      <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full text-lg">
        {space.icon || space.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{space.name}</div>
        {space.description && (
          <div className="text-muted-foreground truncate text-sm">
            {space.description}
          </div>
        )}
      </div>

      {/* Visibility Badge */}
      <Badge variant={visibilityVariants[space.visibility]}>
        {visibilityLabels[space.visibility]}
      </Badge>

      {/* Member Count Placeholder */}
      <div className="text-muted-foreground w-16 text-right text-sm">
        0 members
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
