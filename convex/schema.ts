import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // User profiles (extends Better Auth user)
  // Better Auth manages: id, email, name, image
  // We add community-specific fields
  // ============================================
  users: defineTable({
    // Email field links Better Auth user to extended profile
    email: v.string(),
    // Optional name from registration
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    visibility: v.union(v.literal("public"), v.literal("private")),
    role: v.union(
      v.literal("admin"),
      v.literal("moderator"),
      v.literal("member")
    ),
    points: v.number(),
    level: v.number(),
    notificationPrefs: v.optional(
      v.object({
        emailComments: v.boolean(),
        emailReplies: v.boolean(),
        emailFollowers: v.boolean(),
        emailEvents: v.boolean(),
        emailCourses: v.boolean(),
        emailDMs: v.boolean(),
        digestFrequency: v.union(
          v.literal("immediate"),
          v.literal("daily"),
          v.literal("weekly"),
          v.literal("off")
        ),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_points", ["points"]),

  // ============================================
  // Community spaces
  // ============================================
  spaces: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()), // emoji or Lucide icon name
    visibility: v.union(
      v.literal("public"),
      v.literal("members"),
      v.literal("paid")
    ),
    postPermission: v.union(
      v.literal("all"),
      v.literal("moderators"),
      v.literal("admin")
    ),
    requiredTier: v.optional(v.string()),
    order: v.number(),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_order", ["order"])
    .index("by_visibility", ["visibility"]),

  // ============================================
  // Posts
  // ============================================
  posts: defineTable({
    spaceId: v.id("spaces"),
    authorId: v.id("users"),
    // Denormalized for feed performance
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    title: v.optional(v.string()),
    content: v.string(), // Tiptap JSON
    contentHtml: v.string(), // Rendered HTML
    mediaIds: v.optional(v.array(v.id("_storage"))),
    likeCount: v.number(),
    commentCount: v.number(),
    pinnedAt: v.optional(v.number()),
    editedAt: v.optional(v.number()),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_spaceId", ["spaceId"])
    .index("by_authorId", ["authorId"])
    .index("by_spaceId_and_createdAt", ["spaceId", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  // ============================================
  // Comments (2-level nesting via parentId)
  // ============================================
  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    parentId: v.optional(v.id("comments")), // For nesting
    content: v.string(),
    likeCount: v.number(),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_postId", ["postId"])
    .index("by_authorId", ["authorId"])
    .index("by_parentId", ["parentId"]),

  // ============================================
  // Likes (polymorphic: posts + comments)
  // ============================================
  likes: defineTable({
    userId: v.id("users"),
    targetType: v.union(v.literal("post"), v.literal("comment")),
    targetId: v.string(), // ID as string for flexibility
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_target", ["targetType", "targetId"])
    .index("by_userId_and_target", ["userId", "targetType", "targetId"]),

  // ============================================
  // Courses
  // ============================================
  courses: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    descriptionHtml: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.id("_storage")),
    visibility: v.union(
      v.literal("public"),
      v.literal("members"),
      v.literal("paid")
    ),
    requiredTier: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    enrollmentCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_visibility", ["visibility"]),

  // ============================================
  // Course modules
  // ============================================
  modules: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_courseId", ["courseId"])
    .index("by_courseId_and_order", ["courseId", "order"]),

  // ============================================
  // Lessons
  // ============================================
  lessons: defineTable({
    moduleId: v.id("modules"),
    title: v.string(),
    content: v.optional(v.string()), // Tiptap JSON
    contentHtml: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    attachmentIds: v.optional(v.array(v.id("_storage"))),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_moduleId", ["moduleId"])
    .index("by_moduleId_and_order", ["moduleId", "order"]),

  // ============================================
  // Course enrollments
  // ============================================
  enrollments: defineTable({
    courseId: v.id("courses"),
    userId: v.id("users"),
    lastLessonId: v.optional(v.id("lessons")),
    enrolledAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_courseId", ["courseId"])
    .index("by_userId_and_courseId", ["userId", "courseId"]),

  // ============================================
  // Lesson progress
  // ============================================
  lessonProgress: defineTable({
    lessonId: v.id("lessons"),
    userId: v.id("users"),
    completedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_lessonId", ["lessonId"])
    .index("by_userId_and_lessonId", ["userId", "lessonId"]),

  // ============================================
  // Events
  // ============================================
  events: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    descriptionHtml: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    startTime: v.number(),
    endTime: v.number(),
    location: v.optional(v.string()), // Text or URL for virtual
    capacity: v.optional(v.number()), // null = unlimited
    rsvpCount: v.number(),
    recurrence: v.optional(
      v.object({
        frequency: v.union(
          v.literal("daily"),
          v.literal("weekly"),
          v.literal("monthly")
        ),
        interval: v.number(),
        endDate: v.optional(v.number()),
        endAfter: v.optional(v.number()),
      })
    ),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_startTime", ["startTime"])
    .index("by_endTime", ["endTime"]),

  // ============================================
  // Event RSVPs
  // ============================================
  rsvps: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    status: v.union(
      v.literal("going"),
      v.literal("maybe"),
      v.literal("notGoing")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_eventId", ["eventId"])
    .index("by_userId", ["userId"])
    .index("by_eventId_and_userId", ["eventId", "userId"]),

  // ============================================
  // Memberships (Stripe integration)
  // ============================================
  memberships: defineTable({
    userId: v.id("users"),
    tier: v.string(), // "free", "pro", "founding", etc.
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("trialing"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("none")
    ),
    currentPeriodEnd: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_stripeCustomerId", ["stripeCustomerId"]),

  // ============================================
  // Notifications
  // ============================================
  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(), // "comment", "like", "follow", "mention", etc.
    actorId: v.optional(v.id("users")),
    actorName: v.optional(v.string()),
    actorAvatar: v.optional(v.string()),
    data: v.any(), // Flexible payload
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_read", ["userId", "read"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"]),

  // ============================================
  // DM Conversations
  // ============================================
  conversations: defineTable({
    participantIds: v.array(v.id("users")),
    lastMessageAt: v.number(),
    lastMessagePreview: v.optional(v.string()),
  }).index("by_lastMessageAt", ["lastMessageAt"]),

  // ============================================
  // DM Messages
  // ============================================
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    senderName: v.string(),
    content: v.string(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_conversationId_and_createdAt", ["conversationId", "createdAt"]),

  // ============================================
  // Points history
  // ============================================
  points: defineTable({
    userId: v.id("users"),
    action: v.string(), // "post", "comment", "like_received", "lesson_complete", etc.
    amount: v.number(),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"]),

  // ============================================
  // Gamification config
  // ============================================
  gamificationConfig: defineTable({
    action: v.string(),
    pointValue: v.number(),
  }).index("by_action", ["action"]),

  // ============================================
  // Levels
  // ============================================
  levels: defineTable({
    name: v.string(),
    threshold: v.number(),
    order: v.number(),
    color: v.optional(v.string()),
  })
    .index("by_order", ["order"])
    .index("by_threshold", ["threshold"]),

  // ============================================
  // Follows
  // ============================================
  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_followerId", ["followerId"])
    .index("by_followingId", ["followingId"])
    .index("by_followerId_and_followingId", ["followerId", "followingId"]),

  // ============================================
  // Reports (content moderation)
  // ============================================
  reports: defineTable({
    reporterId: v.id("users"),
    targetType: v.union(
      v.literal("post"),
      v.literal("comment"),
      v.literal("user")
    ),
    targetId: v.string(),
    reason: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),
  })
    .index("by_status", ["status"])
    .index("by_targetType_and_targetId", ["targetType", "targetId"]),

  // ============================================
  // Space visit tracking (for unread indicators)
  // ============================================
  spaceVisits: defineTable({
    userId: v.id("users"),
    spaceId: v.id("spaces"),
    lastVisitedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_spaceId", ["userId", "spaceId"]),

  // ============================================
  // Community settings (singleton-ish, one doc)
  // ============================================
  communitySettings: defineTable({
    name: v.string(),
    logoStorageId: v.optional(v.id("_storage")),
    faviconStorageId: v.optional(v.id("_storage")),
    primaryColor: v.optional(v.string()),
    customDomain: v.optional(v.string()),
    stripeConnectedAccountId: v.optional(v.string()),
    updatedAt: v.number(),
  }),
});
