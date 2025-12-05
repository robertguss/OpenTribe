/**
 * Tiptap Extensions Configuration
 *
 * Configures all Tiptap extensions for the rich text post composer.
 */

import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Mention from "@tiptap/extension-mention";
import { common, createLowlight } from "lowlight";
import { Video } from "./video-extension";

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

/**
 * Member type for @mentions
 */
export interface MentionMember {
  id: string;
  name: string;
  avatar?: string;
}

/**
 * Props for MentionList component
 */
export interface MentionListProps {
  items: MentionMember[];
  command: (props: { id: string; label: string }) => void;
  selectedIndex: number;
}

/**
 * Ref type for MentionList component
 */
export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

/**
 * Get the base extensions for the post composer.
 * These don't require any external dependencies.
 */
export function getBaseExtensions() {
  return [
    // StarterKit includes: Document, Paragraph, Text, Bold, Italic, Strike, Code,
    // Heading, Blockquote, BulletList, OrderedList, ListItem, HardBreak, HorizontalRule
    StarterKit.configure({
      codeBlock: false, // We'll use CodeBlockLowlight instead
    }),

    // Underline (not in StarterKit)
    Underline,

    // Placeholder text
    Placeholder.configure({
      placeholder: "What's on your mind?",
      emptyEditorClass: "is-editor-empty",
    }),

    // Link support
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "text-primary underline cursor-pointer hover:text-primary/80",
      },
      validate: (href) => /^https?:\/\//.test(href),
    }),

    // Image support
    Image.configure({
      inline: false,
      allowBase64: false,
      HTMLAttributes: {
        class: "max-w-full h-auto rounded-lg my-4",
      },
    }),

    // Code block with syntax highlighting
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: {
        class: "bg-muted rounded-lg p-4 my-4 overflow-x-auto",
      },
    }),

    // Video embed support
    Video.configure({
      HTMLAttributes: {
        class: "video-embed",
      },
    }),
  ];
}

/**
 * Get all extensions including mention support.
 * Use this when you have mention search functionality set up.
 *
 * @param suggestionConfig - Suggestion configuration object for mentions
 */
export function getExtensionsWithMentions(
  suggestionConfig: NonNullable<
    NonNullable<Parameters<typeof Mention.configure>[0]>["suggestion"]
  >
) {
  return [
    ...getBaseExtensions(),

    // @mention support
    Mention.configure({
      HTMLAttributes: {
        class:
          "mention bg-primary/10 text-primary px-1 py-0.5 rounded font-medium",
      },
      suggestion: suggestionConfig,
    }),
  ];
}

/**
 * Default extensions without mention support.
 * Use this for simpler use cases.
 */
export const defaultExtensions = getBaseExtensions();
