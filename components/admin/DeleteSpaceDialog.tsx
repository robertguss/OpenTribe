"use client";

import { useState } from "react";
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
import { toast } from "sonner";

type Space = {
  _id: Id<"spaces">;
  name: string;
};

type DeleteSpaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  space: Space | null;
};

export function DeleteSpaceDialog({
  open,
  onOpenChange,
  space,
}: DeleteSpaceDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteSpace = useMutation(api.spaces.mutations.deleteSpace);

  const handleDelete = async () => {
    if (!space) return;

    setIsDeleting(true);
    try {
      await deleteSpace({ spaceId: space._id });
      toast.success("Space deleted successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete space:", error);
      toast.error("Failed to delete space");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {space?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            All posts in this space will be archived. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
