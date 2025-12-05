/**
 * Tiptap Utility Functions
 *
 * Helper functions for working with Tiptap content.
 */

import { generateHTML, generateJSON } from "@tiptap/react";
import { getBaseExtensions } from "./extensions";

/**
 * Convert Tiptap JSON to HTML string.
 *
 * @param json - The Tiptap JSON content
 * @returns The rendered HTML string
 */
export function tiptapJsonToHtml(json: string | object): string {
  try {
    const content = typeof json === "string" ? JSON.parse(json) : json;
    return generateHTML(content, getBaseExtensions());
  } catch (error) {
    console.error("Error converting Tiptap JSON to HTML:", error);
    return "";
  }
}

/**
 * Convert HTML string to Tiptap JSON.
 *
 * @param html - The HTML string
 * @returns The Tiptap JSON content
 */
export function htmlToTiptapJson(html: string): object {
  try {
    return generateJSON(html, getBaseExtensions());
  } catch (error) {
    console.error("Error converting HTML to Tiptap JSON:", error);
    return { type: "doc", content: [] };
  }
}

/**
 * Video embed information.
 */
export interface VideoEmbed {
  type: "youtube" | "vimeo";
  id: string;
  embedUrl: string;
}

/**
 * Extract video embed information from a URL.
 *
 * Supports YouTube and Vimeo URLs.
 *
 * @param url - The video URL to parse
 * @returns VideoEmbed info or null if not a valid video URL
 */
export function extractVideoEmbed(url: string): VideoEmbed | null {
  // YouTube patterns:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return {
      type: "youtube",
      id: youtubeMatch[1],
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
    };
  }

  // Vimeo patterns:
  // - https://vimeo.com/VIDEO_ID
  // - https://player.vimeo.com/video/VIDEO_ID
  const vimeoMatch = url.match(
    /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/
  );
  if (vimeoMatch) {
    return {
      type: "vimeo",
      id: vimeoMatch[1],
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }

  return null;
}

/**
 * Check if a URL is a video URL (YouTube or Vimeo).
 *
 * @param url - The URL to check
 * @returns true if it's a video URL
 */
export function isVideoUrl(url: string): boolean {
  return extractVideoEmbed(url) !== null;
}

/**
 * Check if content is empty (only whitespace or empty paragraphs).
 *
 * @param json - The Tiptap JSON content
 * @returns true if content is empty
 */
export function isContentEmpty(json: string | object): boolean {
  try {
    const content = typeof json === "string" ? JSON.parse(json) : json;

    // Check if doc has no content
    if (!content.content || content.content.length === 0) {
      return true;
    }

    // Check if all content nodes are empty paragraphs
    return content.content.every(
      (node: { type: string; content?: unknown[] }) => {
        if (node.type === "paragraph") {
          return !node.content || node.content.length === 0;
        }
        return false;
      }
    );
  } catch {
    return true;
  }
}

/**
 * Extract plain text from Tiptap JSON content.
 *
 * @param json - The Tiptap JSON content
 * @returns Plain text content
 */
export function extractPlainText(json: string | object): string {
  try {
    const content = typeof json === "string" ? JSON.parse(json) : json;

    function extractText(node: {
      type: string;
      text?: string;
      content?: unknown[];
    }): string {
      if (node.text) {
        return node.text;
      }
      if (node.content && Array.isArray(node.content)) {
        return node.content
          .map((child) =>
            extractText(
              child as { type: string; text?: string; content?: unknown[] }
            )
          )
          .join("");
      }
      return "";
    }

    return extractText(content).trim();
  } catch {
    return "";
  }
}

/**
 * Extract hashtags from content.
 *
 * @param text - The text to search for hashtags
 * @returns Array of hashtags (without the # symbol)
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const matches = text.match(hashtagRegex);
  if (!matches) return [];

  // Remove the # and deduplicate
  const hashtags = matches.map((tag) => tag.substring(1));
  return [...new Set(hashtags)];
}
