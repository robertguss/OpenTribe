"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { IconPicker } from "./IconPicker";
import { toast } from "sonner";

const spaceSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or less"),
  description: z
    .string()
    .max(200, "Description must be 200 characters or less")
    .optional(),
  icon: z.string().optional(),
  visibility: z.enum(["public", "members", "paid"]),
  postPermission: z.enum(["all", "moderators", "admin"]),
  requiredTier: z.string().optional(),
});

type SpaceFormData = z.infer<typeof spaceSchema>;

type Space = {
  _id: Id<"spaces">;
  name: string;
  description?: string;
  icon?: string;
  visibility: "public" | "members" | "paid";
  postPermission: "all" | "moderators" | "admin";
  requiredTier?: string;
};

type SpaceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  space: Space | null;
};

export function SpaceFormDialog({
  open,
  onOpenChange,
  space,
}: SpaceFormDialogProps) {
  const isEditing = !!space;

  const createSpace = useMutation(api.spaces.mutations.createSpace);
  const updateSpace = useMutation(api.spaces.mutations.updateSpace);

  const form = useForm<SpaceFormData>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      visibility: "public",
      postPermission: "all",
      requiredTier: "",
    },
  });

  // Reset form when space changes
  useEffect(() => {
    if (space) {
      form.reset({
        name: space.name,
        description: space.description || "",
        icon: space.icon || "",
        visibility: space.visibility,
        postPermission: space.postPermission,
        requiredTier: space.requiredTier || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        icon: "",
        visibility: "public",
        postPermission: "all",
        requiredTier: "",
      });
    }
  }, [space, form]);

  const onSubmit = async (data: SpaceFormData) => {
    try {
      if (isEditing && space) {
        await updateSpace({
          spaceId: space._id,
          name: data.name,
          description: data.description || undefined,
          icon: data.icon || undefined,
          visibility: data.visibility,
          postPermission: data.postPermission,
          requiredTier: data.requiredTier || undefined,
        });
        toast.success("Space updated successfully");
      } else {
        await createSpace({
          name: data.name,
          description: data.description || undefined,
          icon: data.icon || undefined,
          visibility: data.visibility,
          postPermission: data.postPermission,
          requiredTier: data.requiredTier || undefined,
        });
        toast.success("Space created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save space:", error);
      toast.error(
        isEditing ? "Failed to update space" : "Failed to create space"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Space" : "Create Space"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the space settings below."
              : "Create a new discussion space for your community."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="General Discussion" {...field} />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/50 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A place for general community chat..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/200 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <IconPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormDescription>
                    Choose an emoji or icon for this space
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">
                        Public - Visible to everyone
                      </SelectItem>
                      <SelectItem value="members">
                        Members Only - Logged-in members
                      </SelectItem>
                      <SelectItem value="paid">
                        Paid - Specific tier required
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postPermission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Post Permission</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select who can post" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">
                        All Members - Anyone can post
                      </SelectItem>
                      <SelectItem value="moderators">
                        Moderators+ - Mods and admins only
                      </SelectItem>
                      <SelectItem value="admin">
                        Admin Only - Only admins can post
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Space"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
