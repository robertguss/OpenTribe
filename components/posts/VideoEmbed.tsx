"use client";

import { extractVideoEmbed } from "@/lib/tiptap/utils";

interface VideoEmbedProps {
  url: string;
}

export function VideoEmbedPreview({ url }: VideoEmbedProps) {
  const embed = extractVideoEmbed(url);

  if (!embed) {
    return null;
  }

  return (
    <div className="relative my-4 aspect-video w-full overflow-hidden rounded-lg">
      <iframe
        src={embed.embedUrl}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={`${embed.type} video`}
      />
    </div>
  );
}

/**
 * Check if a URL is a valid video embed URL.
 */
export function isValidVideoUrl(url: string): boolean {
  return extractVideoEmbed(url) !== null;
}
