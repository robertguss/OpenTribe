/**
 * Media Queries
 *
 * Retrieve URLs for stored files.
 */

import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get the serving URL for a stored file.
 *
 * @param storageId - The storage ID of the file
 * @returns The URL to access the file, or null if not found
 */
export const getMediaUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    // Get the URL for the stored file
    const url = await ctx.storage.getUrl(args.storageId);
    return url;
  },
});

/**
 * Get serving URLs for multiple stored files.
 *
 * @param storageIds - Array of storage IDs
 * @returns Array of URLs (null for any not found)
 */
export const getMediaUrls = query({
  args: {
    storageIds: v.array(v.id("_storage")),
  },
  returns: v.array(v.union(v.string(), v.null())),
  handler: async (ctx, args) => {
    const urls = await Promise.all(
      args.storageIds.map((id) => ctx.storage.getUrl(id))
    );
    return urls;
  },
});
