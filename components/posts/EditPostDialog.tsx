"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EditorToolbar } from "./EditorToolbar";
import { MentionList } from "./MentionList";
import { getExtensionsWithMentions } from "@/lib/tiptap/extensions";
import { isContentEmpty } from "@/lib/tiptap/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useImageUpload, validateImageFile } from "@/hooks/useImageUpload";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import type { MentionMember, MentionListRef } from "@/lib/tiptap/extensions";
import type {
  SuggestionProps,
  SuggestionKeyDownProps,
} from "@tiptap/suggestion";

interface EditPostDialogProps {
  postId: Id<"posts">;
  initialContent: string; // JSON string
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPostDialog({
  postId,
  initialContent,
  isOpen,
  onOpenChange,
}: EditPostDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updatePost = useMutation(api.posts.mutations.updatePost);

  // Query for searching members for @mentions
  const searchMembers = useQuery(api.members.queries.searchMembers, {
    query: "",
    limit: 5,
  });

  // Ref for mention popup
  const mentionPopupRef = useRef<TippyInstance | null>(null);

  // Search members function for mentions
  const searchMembersForMention = useCallback(
    async (query: string): Promise<MentionMember[]> => {
      if (!searchMembers?.members) return [];

      const filtered = searchMembers.members
        .filter((m) => m.name?.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
        .map((m) => ({
          id: m._id,
          name: m.name || "Unknown",
          avatar: m.avatarUrl,
        }));

      return filtered;
    },
    [searchMembers]
  );

  // Create mention suggestion configuration
  const mentionSuggestion = {
    items: async ({ query }: { query: string }) => {
      if (!query) return [];
      return await searchMembersForMention(query);
    },
    render: () => {
      let component: ReactRenderer | null = null;
      let popup: TippyInstance[] | null = null;

      return {
        onStart: (props: SuggestionProps<MentionMember>) => {
          component = new ReactRenderer(MentionList, {
            props: {
              items: props.items,
              command: props.command,
            },
            editor: props.editor,
          });

          if (!props.clientRect) return;

          popup = tippy("body", {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          });

          mentionPopupRef.current = popup[0] || null;
        },
        onUpdate: (props: SuggestionProps<MentionMember>) => {
          component?.updateProps({
            items: props.items,
            command: props.command,
          });

          if (!props.clientRect) return;

          popup?.[0]?.setProps({
            getReferenceClientRect: props.clientRect as () => DOMRect,
          });
        },
        onKeyDown: (props: SuggestionKeyDownProps) => {
          if (props.event.key === "Escape") {
            popup?.[0]?.hide();
            return true;
          }

          return (
            (component?.ref as MentionListRef | null)?.onKeyDown(props) || false
          );
        },
        onExit: () => {
          popup?.[0]?.destroy();
          component?.destroy();
          mentionPopupRef.current = null;
        },
      };
    },
  };

  // Initialize Tiptap editor with extensions
  const editor = useEditor({
    extensions: getExtensionsWithMentions(mentionSuggestion),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none min-h-[200px] p-4 focus:outline-none",
      },
    },
    content: initialContent ? JSON.parse(initialContent) : undefined,
  });

  // Reset editor content when dialog opens
  // Use a separate effect to ensure content resets properly on each open
  useEffect(() => {
    if (!isOpen || !editor) return;

    // Reset to initial content when dialog opens
    try {
      const parsedContent = JSON.parse(initialContent);
      editor.commands.setContent(parsedContent);
    } catch (error) {
      // Log in development to help debug content issues
      if (process.env.NODE_ENV === "development") {
        console.warn("EditPostDialog: Failed to parse initial content", error);
      }
      // Try setting as-is if parsing fails (content might be a valid Tiptap object)
      editor.commands.setContent(initialContent);
    }
  }, [isOpen, editor, initialContent]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!editor) return;

    const json = editor.getJSON();
    if (isContentEmpty(json)) {
      toast.error("Post content cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePost({
        postId,
        content: JSON.stringify(json),
        contentHtml: editor.getHTML(),
      });

      toast.success("Post updated");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update post:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update post"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [editor, updatePost, postId, onOpenChange]);

  // Handle Cmd+Enter keyboard shortcut
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Image upload hook
  const { upload: uploadImage } = useImageUpload({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Handle image upload button click
  const handleImageUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const validationError = validateImageFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      const result = await uploadImage(file);
      if (result && editor) {
        editor.chain().focus().setImage({ src: result.url }).run();
        toast.success("Image uploaded!");
      }
    };
    input.click();
  }, [uploadImage, editor]);

  // Handle video embed button click
  const handleVideoEmbed = useCallback(() => {
    const url = window.prompt(
      "Enter YouTube or Vimeo URL",
      "https://youtube.com/watch?v="
    );

    if (!url) return;

    if (editor) {
      const success = editor.chain().focus().setVideo({ src: url }).run();
      if (success) {
        toast.success("Video embedded!");
      } else {
        toast.error("Invalid video URL. Please use a YouTube or Vimeo link.");
      }
    }
  }, [editor]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>
            Make changes to your post. An &quot;(edited)&quot; indicator will
            appear after saving.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4" onKeyDown={handleKeyDown}>
          <div className="overflow-hidden rounded-md border">
            <EditorToolbar
              editor={editor}
              onImageUpload={handleImageUpload}
              onVideoEmbed={handleVideoEmbed}
            />
            <EditorContent editor={editor} />
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
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
