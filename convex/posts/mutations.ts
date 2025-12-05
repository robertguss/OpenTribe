/**
 * Post Mutations
 *
 * Create, update, and delete posts in community spaces.
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { ConvexError } from "convex/values";
import { requireAuth, canPostInSpace } from "../_lib/permissions";
import { awardPoints } from "../_lib/points";
import { createPostInput } from "./_validators";

/**
 * Create a new post in a space.
 *
 * Requirements (from story 2-3):
 * - Validate user can post in space via canPostInSpace
 * - Store content as JSON (Tiptap format)
 * - Store contentHtml as rendered HTML
 * - Denormalize author info (name, avatar) for feed performance
 * - Initialize likeCount=0, commentCount=0
 * - Award 10 points via awardPoints helper
 *
 * @param spaceId - The space to post in
 * @param content - Tiptap JSON content string
 * @param contentHtml - Rendered HTML content
 * @param title - Optional post title
 * @param mediaIds - Optional array of storage IDs for attached media
 * @returns The created post ID
 */
export const createPost = mutation({
  args: createPostInput,
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await requireAuth(ctx);

    // Get user profile by email (pattern from story 2-2)
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }

    // Check posting permission
    const canPost = await canPostInSpace(ctx, userProfile._id, args.spaceId);
    if (!canPost) {
      throw new ConvexError("You don't have permission to post in this space");
    }

    // Verify space exists and is not deleted
    const space = await ctx.db.get(args.spaceId);
    if (!space || space.deletedAt) {
      throw new ConvexError("Space not found");
    }

    // Create the post with denormalized author info
    const now = Date.now();
    const postId = await ctx.db.insert("posts", {
      spaceId: args.spaceId,
      authorId: userProfile._id,
      authorName: userProfile.name || authUser.name || "Anonymous",
      authorAvatar: userProfile.avatarStorageId
        ? (userProfile.avatarStorageId as unknown as string)
        : undefined,
      title: args.title,
      content: args.content,
      contentHtml: args.contentHtml,
      mediaIds: args.mediaIds,
      likeCount: 0,
      commentCount: 0,
      createdAt: now,
    });

    // Award 10 points for creating a post
    await awardPoints(ctx, {
      userId: userProfile._id,
      action: "post_created",
      points: 10,
      sourceType: "post",
      sourceId: postId,
    });

    return postId;
  },
});

/**
 * Update an existing post.
 *
 * Only the author or moderators can update a post.
 *
 * @param postId - The post to update
 * @param content - Optional new Tiptap JSON content
 * @param contentHtml - Optional new rendered HTML
 * @param title - Optional new title
 * @param mediaIds - Optional new media IDs
 * @returns The updated post ID
 */
export const updatePost = mutation({
  args: {
    postId: v.id("posts"),
    content: v.optional(v.string()),
    contentHtml: v.optional(v.string()),
    title: v.optional(v.string()),
    mediaIds: v.optional(v.array(v.id("_storage"))),
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await requireAuth(ctx);

    // Get user profile
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }

    // Get the post
    const post = await ctx.db.get(args.postId);
    if (!post || post.deletedAt) {
      throw new ConvexError("Post not found");
    }

    // Check if user can edit (author or moderator+)
    const isAuthor = post.authorId === userProfile._id;
    const isModerator =
      userProfile.role === "admin" || userProfile.role === "moderator";

    if (!isAuthor && !isModerator) {
      throw new ConvexError("You don't have permission to edit this post");
    }

    // Update the post
    const now = Date.now();
    const updates: Record<string, unknown> = {
      editedAt: now,
    };

    if (args.content !== undefined) {
      updates.content = args.content;
    }
    if (args.contentHtml !== undefined) {
      updates.contentHtml = args.contentHtml;
    }
    if (args.title !== undefined) {
      updates.title = args.title;
    }
    if (args.mediaIds !== undefined) {
      updates.mediaIds = args.mediaIds;
    }

    await ctx.db.patch(args.postId, updates);

    return args.postId;
  },
});

/**
 * Delete a post (soft delete).
 *
 * Only the author or moderators can delete a post.
 *
 * @param postId - The post to delete
 */
export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Authenticate user
    const authUser = await requireAuth(ctx);

    // Get user profile
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email.toLowerCase()))
      .unique();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }

    // Get the post
    const post = await ctx.db.get(args.postId);
    if (!post || post.deletedAt) {
      throw new ConvexError("Post not found");
    }

    // Check if user can delete (author or moderator+)
    const isAuthor = post.authorId === userProfile._id;
    const isModerator =
      userProfile.role === "admin" || userProfile.role === "moderator";

    if (!isAuthor && !isModerator) {
      throw new ConvexError("You don't have permission to delete this post");
    }

    // Soft delete the post
    await ctx.db.patch(args.postId, {
      deletedAt: Date.now(),
    });

    return null;
  },
});
