"use client";

import { useCallback, useRef, useState } from "react";
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EditorToolbar } from "./EditorToolbar";
import { MentionList } from "./MentionList";
import { getExtensionsWithMentions } from "@/lib/tiptap/extensions";
import { isContentEmpty } from "@/lib/tiptap/utils";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { useImageUpload, validateImageFile } from "@/hooks/useImageUpload";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import type { MentionMember, MentionListRef } from "@/lib/tiptap/extensions";
import type {
  SuggestionProps,
  SuggestionKeyDownProps,
} from "@tiptap/suggestion";

interface PostComposerProps {
  spaceId: Id<"spaces">;
  onPostCreated?: (postId: Id<"posts">) => void;
}

export function PostComposer({ spaceId, onPostCreated }: PostComposerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createPost = useMutation(api.posts.mutations.createPost);

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
      // For now, filter from the cached members list
      // In a real implementation, this would be a query with the search term
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
          "prose prose-sm sm:prose-base max-w-none min-h-[120px] p-4 focus:outline-none",
      },
    },
    onUpdate: () => {
      // Could add auto-save here if needed
    },
  });

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!editor) return;

    const json = editor.getJSON();
    if (isContentEmpty(json)) {
      toast.error("Please write something before posting");
      return;
    }

    setIsSubmitting(true);
    try {
      const postId = await createPost({
        spaceId,
        content: JSON.stringify(json),
        contentHtml: editor.getHTML(),
      });

      // Clear the editor
      editor.commands.clearContent();

      toast.success("Post created!");
      onPostCreated?.(postId);
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create post"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [editor, createPost, spaceId, onPostCreated]);

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

      // Validate file
      const validationError = validateImageFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // Upload file
      const result = await uploadImage(file);
      if (result && editor) {
        // Insert image into editor
        // We need to get the actual URL from Convex storage
        // For now, we'll use the returned storageId and query for the URL
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
      // Use the custom video command
      const success = editor.chain().focus().setVideo({ src: url }).run();
      if (success) {
        toast.success("Video embedded!");
      } else {
        toast.error("Invalid video URL. Please use a YouTube or Vimeo link.");
      }
    }
  }, [editor]);

  return (
    <Card className="mb-6">
      <CardContent className="p-0">
        <div onKeyDown={handleKeyDown}>
          <EditorToolbar
            editor={editor}
            onImageUpload={handleImageUpload}
            onVideoEmbed={handleVideoEmbed}
          />
          <EditorContent editor={editor} />
        </div>
        <div className="bg-muted/20 flex items-center justify-between border-t p-3">
          <div className="text-muted-foreground text-xs">
            <span className="hidden sm:inline">
              <kbd className="bg-muted rounded px-1.5 py-0.5 text-xs font-medium">
                Cmd+Enter
              </kbd>{" "}
              to post
            </span>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="sm"
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Post
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
