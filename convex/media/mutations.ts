/**
 * Media Mutations
 *
 * Handle file uploads to Convex storage for images and other media.
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAuth } from "../_lib/permissions";

/**
 * Generate an upload URL for file storage.
 *
 * This mutation generates a temporary URL that the client can use to upload
 * a file directly to Convex storage. The upload URL is valid for a short period.
 *
 * Requirements (from story 2-3):
 * - Generate Convex file storage upload URL
 * - Return URL for client-side upload
 *
 * @returns The upload URL
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    // Require authentication - only logged-in users can upload
    await requireAuth(ctx);

    // Generate and return upload URL
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return uploadUrl;
  },
});

/**
 * Store a reference to an uploaded file.
 *
 * After a file is uploaded via the upload URL, this mutation can be used
 * to create a reference to the file if additional metadata tracking is needed.
 *
 * @param storageId - The storage ID returned from the upload
 * @param filename - Original filename
 * @param contentType - MIME type of the file
 * @returns The storage ID
 */
export const storeMediaReference = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.optional(v.string()),
    contentType: v.optional(v.string()),
  },
  returns: v.id("_storage"),
  handler: async (ctx, args) => {
    // Require authentication
    await requireAuth(ctx);

    // The storage ID is already valid from the upload
    // This mutation exists for future extensibility if we need to track
    // additional metadata about uploaded files
    return args.storageId;
  },
});
