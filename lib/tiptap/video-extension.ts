/**
 * Custom Tiptap Video Embed Extension
 *
 * Adds support for embedding YouTube and Vimeo videos in the editor.
 */

import { Node, mergeAttributes } from "@tiptap/core";
import type { CommandProps } from "@tiptap/core";
import { extractVideoEmbed } from "./utils";

export interface VideoOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      /**
       * Add a video embed
       */
      setVideo: (options: { src: string }) => ReturnType;
    };
  }
}

export const Video = Node.create<VideoOptions>({
  name: "video",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: "block",

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      embedUrl: {
        default: null,
      },
      type: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-video-embed]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    const embed = extractVideoEmbed(HTMLAttributes.src as string);
    if (!embed) {
      return ["div", { class: "video-embed-error" }, "Invalid video URL"];
    }

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, {
        "data-video-embed": "",
        class: "relative w-full aspect-video rounded-lg overflow-hidden my-4",
      }),
      [
        "iframe",
        {
          src: embed.embedUrl,
          class: "absolute inset-0 w-full h-full",
          allow:
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          allowfullscreen: "true",
          title: `${embed.type} video`,
        },
      ],
    ];
  },

  addCommands() {
    return {
      setVideo:
        (options: { src: string }) =>
        ({ commands }: CommandProps) => {
          const embed = extractVideoEmbed(options.src);
          if (!embed) {
            return false;
          }

          return commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              embedUrl: embed.embedUrl,
              type: embed.type,
            },
          });
        },
    };
  },
});
