// ============================================
// ADVANCED NOTIFICATION ROUTES
// ============================================

import express from 'express';
import checkToken from '../Middleware/checkToken.js';
import adminToken from '../Middleware/adminToken.js';
import {
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
} from '../Controllers/notification.advanced.controller.js';

const router = express.Router();

// ============================================
// GET ENDPOINTS
// ============================================

// Get all notifications for current user
// GET /api/notifications/list
router.get('/list', checkToken, getNotifications);

// Get unread notification count
// GET /api/notifications/unread-count
router.get('/unread-count', checkToken, getUnreadCount);

// Get notification statistics
// GET /api/notifications/stats
router.get('/stats', checkToken, getNotificationStats);

// ============================================
// PUT ENDPOINTS
// ============================================

// Mark single notification as read
// PUT /api/notifications/:id/read
router.put('/:id/read', checkToken, markAsRead);

// Mark all notifications as read
// PUT /api/notifications/mark-all-read
router.put('/mark-all-read', checkToken, markAllAsRead);

// Mark notification as clicked
// PUT /api/notifications/:id/click
router.put('/:id/click', checkToken, markAsClicked);

// ============================================
// DELETE ENDPOINTS
// ============================================

// Dismiss notification (hide from list)
// DELETE /api/notifications/:id/dismiss
router.delete('/:id/dismiss', checkToken, dismissNotification);

// Delete notification permanently
// DELETE /api/notifications/:id
router.delete('/:id', checkToken, deleteNotification);

// Clear all dismissed notifications
// DELETE /api/notifications/clear-all
router.delete('/clear-all', checkToken, clearAllNotifications);

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Send notification to specific user
// POST /api/notifications/send (admin only)
router.post('/send', checkToken, adminToken, sendNotificationToUser);

export default router;
