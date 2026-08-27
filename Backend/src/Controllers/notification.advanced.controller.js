// ============================================
// ADVANCED NOTIFICATION CONTROLLER
// ============================================
// Handles WhatsApp-style persistent notifications
// ============================================

import Notification from "../models/Notification.js";
import User from "../models/Users.js";
import { sendPushToUsers } from "./notification.controller.js";

// ============================================
// CREATE NOTIFICATION (Internal Helper)
// ============================================
export const createNotification = async (userId, notificationData) => {
  try {
    // ✅ Save to database (persistent)
    const notification = await Notification.create({
      userId,
      ...notificationData,
      sent: true,
      sentAt: new Date(),
    });

    console.log(`✅ Notification created: ${notification._id}`);

    // ✅ Send as push notification
    try {
      await sendPushToUsers([userId], {
        title: notificationData.title,
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        url: notificationData.actionUrl,
        tag: `notification-${notification._id}`,
        timestamp: notification.createdAt.getTime(),
      });
    } catch (pushError) {
      console.warn("⚠️ Push notification failed (will show in app):", pushError.message);
    }

    return notification;
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    throw error;
  }
};

// ============================================
// BATCH CREATE NOTIFICATIONS
// ============================================
export const createBulkNotifications = async (userIds, notificationData) => {
  try {
    const notifications = userIds.map(userId => ({
      userId,
      ...notificationData,
      sent: true,
      sentAt: new Date(),
    }));

    const created = await Notification.insertMany(notifications);
    console.log(`✅ ${created.length} notifications created`);

    // ✅ Send push notifications
    try {
      await sendPushToUsers(userIds, {
        title: notificationData.title,
        body: notificationData.body,
        icon: notificationData.icon,
        url: notificationData.actionUrl,
      });
    } catch (pushError) {
      console.warn("⚠️ Push notification failed:", pushError.message);
    }

    return created;
  } catch (error) {
    console.error("❌ Error creating bulk notifications:", error);
    throw error;
  }
};

// ============================================
// GET NOTIFICATIONS FOR USER
// ============================================
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, type, read } = req.query;

    const query = { userId, dismissed: false };
    
    if (type && type !== "all") query.type = type;
    if (read !== undefined) query.read = read === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("senderId", "name email"),
      Notification.countDocuments(query),
    ]);

    const unreadCount = await Notification.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: notifications,
      total,
      unreadCount,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET UNREAD COUNT
// ============================================
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;
    const count = await Notification.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// MARK AS READ
// ============================================
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    if (notification.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await notification.markAsRead();

    res.status(200).json({
      success: true,
      message: "Marked as read",
      notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// MARK ALL AS READ
// ============================================
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;

    const result = await Notification.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// MARK AS CLICKED
// ============================================
export const markAsClicked = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    if (notification.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await notification.markAsClicked();
    await notification.markAsRead();

    res.status(200).json({
      success: true,
      message: "Marked as clicked",
      notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// DISMISS NOTIFICATION
// ============================================
export const dismissNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    if (notification.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await notification.markAsDismissed();

    res.status(200).json({
      success: true,
      message: "Notification dismissed",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// DELETE NOTIFICATION
// ============================================
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    if (notification.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await Notification.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// CLEAR ALL NOTIFICATIONS
// ============================================
export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;

    const result = await Notification.deleteMany({
      userId,
      dismissed: true,
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} notifications`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET NOTIFICATION STATS
// ============================================
export const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user?.id;

    const [total, unread, byType] = await Promise.all([
      Notification.countDocuments({ userId, dismissed: false }),
      Notification.countDocuments({ userId, read: false, dismissed: false }),
      Notification.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId), dismissed: false } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
    ]);

    const stats = {};
    byType.forEach(item => {
      stats[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      stats: {
        total,
        unread,
        byType: stats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// SEND NOTIFICATION TO SPECIFIC USER
// ============================================
export const sendNotificationToUser = async (req, res) => {
  try {
    const { userId, title, body, type, actionUrl } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: "userId, title, and body are required",
      });
    }

    const notification = await createNotification(userId, {
      type: type || "system_alert",
      title,
      body,
      actionUrl: actionUrl || "/",
      sender: "Admin",
      senderId: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: "Notification sent",
      notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// EXPORT FOR INTERNAL USE
// ============================================
export default {
  createNotification,
  createBulkNotifications,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  markAsClicked,
  dismissNotification,
  deleteNotification,
  clearAllNotifications,
  getNotificationStats,
  sendNotificationToUser,
};
