"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SpaceListItem } from "./SpaceListItem";
import { SpaceFormDialog } from "./SpaceFormDialog";
import { DeleteSpaceDialog } from "./DeleteSpaceDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

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
  memberCount?: number;
};

type SpaceListProps = {
  spaces: Space[];
};

export function SpaceList({ spaces }: SpaceListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [deletingSpace, setDeletingSpace] = useState<Space | null>(null);
  const [activeId, setActiveId] = useState<Id<"spaces"> | null>(null);

  // Optimistic UI state - local copy of spaces for immediate visual feedback
  const [optimisticSpaces, setOptimisticSpaces] = useState(spaces);
  const pendingReorder = useRef(false);

  // Sync optimistic state with server state when not pending
  useEffect(() => {
    if (!pendingReorder.current) {
      setOptimisticSpaces(spaces);
    }
  }, [spaces]);

  const reorderSpaces = useMutation(api.spaces.mutations.reorderSpaces);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as Id<"spaces">);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = optimisticSpaces.findIndex((s) => s._id === active.id);
    const newIndex = optimisticSpaces.findIndex((s) => s._id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistic update - immediately update local state
    const reorderedSpaces = arrayMove(optimisticSpaces, oldIndex, newIndex);
    setOptimisticSpaces(reorderedSpaces);
    pendingReorder.current = true;

    const newSpaceIds = reorderedSpaces.map((s) => s._id);

    try {
      await reorderSpaces({ spaceIds: newSpaceIds });
      toast.success("Space order updated");
    } catch (error) {
      console.error("Failed to reorder spaces:", error);
      toast.error("Failed to update space order");
      // Revert to server state on error
      setOptimisticSpaces(spaces);
    } finally {
      pendingReorder.current = false;
    }
  };

  const activeSpace = activeId
    ? optimisticSpaces.find((s) => s._id === activeId)
    : null;

  if (spaces.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground mb-4">No spaces yet</p>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create First Space
        </Button>
        <SpaceFormDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          space={null}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Space
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={optimisticSpaces.map((s) => s._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {optimisticSpaces.map((space) => (
              <SpaceListItem
                key={space._id}
                space={space}
                onEdit={() => setEditingSpace(space)}
                onDelete={() => setDeletingSpace(space)}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeSpace ? (
            <SpaceListItem
              space={activeSpace}
              onEdit={() => {}}
              onDelete={() => {}}
              isDragOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <SpaceFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        space={null}
      />

      <SpaceFormDialog
        open={!!editingSpace}
        onOpenChange={(open) => !open && setEditingSpace(null)}
        space={editingSpace}
      />

      <DeleteSpaceDialog
        open={!!deletingSpace}
        onOpenChange={(open) => !open && setDeletingSpace(null)}
        space={deletingSpace}
      />
    </div>
  );
}
