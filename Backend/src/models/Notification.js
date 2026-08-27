import mongoose from "mongoose";

// ============================================
// NOTIFICATION SCHEMA - WhatsApp Style
// ============================================
// Stores all notifications for users
// Supports: push, in-app, email notifications
// ============================================

const notificationSchema = new mongoose.Schema({
  // ✅ User who receives notification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  // ✅ Notification metadata
  type: {
    type: String,
    enum: [
      "task_assigned",        // Task assigned to user
      "marks_deducted",       // Marks deducted
      "task_completed",       // Task marked complete
      "deadline_approaching", // Deadline reminder
      "system_alert",         // System notification
      "message",              // Direct message
    ],
    default: "system_alert",
    index: true,
  },

  // ✅ Notification content
  title: {
    type: String,
    required: true,
  },

  body: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    default: "",
  },

  // ✅ Visual elements
  icon: {
    type: String,
    default: "/icon-192.png",
  },

  icon_emoji: {
    type: String,
    default: "🔔",
  },

  badge: {
    type: String,
    default: "/badge-72.png",
  },

  // ✅ Related entity (task, project, user, etc.)
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },

  relatedType: {
    type: String,
    enum: ["Task", "Project", "User", "Attendance", "Marks"],
    default: null,
  },

  // ✅ Action URL (where to navigate on click)
  actionUrl: {
    type: String,
    default: "/",
  },

  // ✅ Status tracking
  read: {
    type: Boolean,
    default: false,
    index: true,
  },

  readAt: {
    type: Date,
    default: null,
  },

  clicked: {
    type: Boolean,
    default: false,
  },

  clickedAt: {
    type: Date,
    default: null,
  },

  dismissed: {
    type: Boolean,
    default: false,
  },

  dismissedAt: {
    type: Date,
    default: null,
  },

  // ✅ Delivery tracking
  sent: {
    type: Boolean,
    default: false,
  },

  sentAt: {
    type: Date,
    default: null,
  },

  deliveryMethod: {
    type: String,
    enum: ["push", "email", "in_app", "sms"],
    default: "push",
  },

  // ✅ Metadata
  priority: {
    type: String,
    enum: ["low", "normal", "high", "urgent"],
    default: "normal",
  },

  sender: {
    type: String,
    default: "System",
  },

  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  // ✅ Notification data (for custom handling)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // ✅ Tags for grouping
  tags: {
    type: [String],
    default: [],
  },

  // ✅ Expiry
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },

  // ✅ Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// ============================================
// INDEXES for performance
// ============================================
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired

// ============================================
// VIRTUAL FIELDS
// ============================================

// Get unread status
notificationSchema.virtual("isUnread").get(function() {
  return !this.read;
});

// Get time ago string
notificationSchema.virtual("timeAgo").get(function() {
  const now = Date.now();
  const diff = now - this.createdAt.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return this.createdAt.toLocaleDateString();
});

// ============================================
// METHODS
// ============================================

// Mark as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Mark as clicked
notificationSchema.methods.markAsClicked = async function() {
  this.clicked = true;
  this.clickedAt = new Date();
  return this.save();
};

// Mark as dismissed
notificationSchema.methods.markAsDismissed = async function() {
  this.dismissed = true;
  this.dismissedAt = new Date();
  return this.save();
};

// ============================================
// STATICS
// ============================================

// Get unread count for user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    userId,
    read: false,
    dismissed: false,
  });
};

// Get recent notifications
notificationSchema.statics.getRecent = async function(userId, limit = 20) {
  return this.find({
    userId,
    dismissed: false,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("senderId", "name email");
};

// Mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { userId, read: false },
    { 
      read: true,
      readAt: new Date(),
    }
  );
};

// Delete old notifications (cleanup)
notificationSchema.statics.cleanup = async function(daysOld = 90) {
  const date = new Date();
  date.setDate(date.getDate() - daysOld);
  
  return this.deleteMany({
    createdAt: { $lt: date },
    read: true,
  });
};

export default mongoose.model("Notification", notificationSchema);
