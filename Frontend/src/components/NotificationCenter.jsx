import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  Loader2,
  ChevronRight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import api from '../service/api';
import toast from 'react-hot-toast';
import {
  getNotificationPreferences,
  setNotificationPreferences,
  testNotificationEffects,
} from '../service/notificationSound';

// ============================================
// NOTIFICATION CENTER - WhatsApp Style
// ============================================

const NotificationCenter = ({ isOpen, onClose, onUnreadChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // ✅ Load preferences on mount
  useEffect(() => {
    const prefs = getNotificationPreferences();
    setSoundEnabled(prefs.soundEnabled);
    setVibrationEnabled(prefs.vibrationEnabled);
  }, []);

  // ✅ Save preferences when changed
  useEffect(() => {
    setNotificationPreferences({
      soundEnabled,
      vibrationEnabled,
    });
  }, [soundEnabled, vibrationEnabled]);

  // ============================================
  // FETCH NOTIFICATIONS
  // ============================================
  useEffect(() => {
    if (!isOpen) return;
    fetchNotifications();
  }, [isOpen, selectedFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const query = selectedFilter && selectedFilter !== 'all' ? `?type=${selectedFilter}` : '';
      const res = await api.get(`/notifications/list${query}`);
      
      if (res.data.success) {
        setNotifications(res.data.data || []);
        const nextUnread = res.data.unreadCount || 0;
        setUnreadCount(nextUnread);
        onUnreadChange?.(nextUnread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // MARK AS READ
  // ============================================
  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
      const nextUnread = Math.max(0, unreadCount - 1);
      setUnreadCount(nextUnread);
      onUnreadChange?.(nextUnread);
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  // ============================================
  // MARK ALL AS READ
  // ============================================
  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      onUnreadChange?.(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  // ============================================
  // DISMISS NOTIFICATION
  // ============================================
  const handleDismiss = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}/dismiss`);
      setNotifications(notifications.filter(n => n._id !== notificationId));
    } catch (error) {
      toast.error('Failed to dismiss notification');
    }
  };

  // ============================================
  // CLICK NOTIFICATION
  // ============================================
  const handleClickNotification = async (notification) => {
    try {
      await api.put(`/notifications/${notification._id}/click`);
      
      // Navigate to action URL
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
      
      onClose();
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  // ============================================
  // PLAY TEST SOUND
  // ============================================
  const handleTestSound = async () => {
    try {
      await testNotificationEffects({
        soundEnabled,
        vibrationEnabled,
      });
      toast.success('Test notification played!');
    } catch (error) {
      toast.error('Failed to play test notification');
    }
  };

  // ============================================
  // GET NOTIFICATION ICON
  // ============================================
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return '📋';
      case 'marks_deducted':
        return '📊';
      case 'task_completed':
        return '✅';
      case 'deadline_approaching':
        return '⏰';
      case 'system_alert':
        return '⚠️';
      case 'message':
        return '💬';
      default:
        return '🔔';
    }
  };

  // ============================================
  // GET TIME AGO
  // ============================================
  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(date).toLocaleDateString();
  };

  // ============================================
  // FILTER OPTIONS
  // ============================================
  const filters = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'task_assigned', label: 'Tasks', count: notifications.filter(n => n.type === 'task_assigned').length },
    { id: 'marks_deducted', label: 'Marks', count: notifications.filter(n => n.type === 'marks_deducted').length },
    { id: 'system_alert', label: 'System', count: notifications.filter(n => n.type === 'system_alert').length },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* ✅ Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* ✅ Notification Panel */}
      <div className="relative ml-auto w-full sm:w-96 h-full bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-2xl flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-4 py-4 flex items-center justify-between sticky top-0">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Bell className="w-5 h-5 text-[var(--accent-primary)]" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-[var(--danger)] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {notifications.length} notifications
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SOUND & VIBRATION CONTROLS */}
        <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-4 py-3 flex gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
              soundEnabled
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-input)] text-[var(--text-muted)]'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            Sound
          </button>
          <button
            onClick={() => setVibrationEnabled(!vibrationEnabled)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
              vibrationEnabled
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-input)] text-[var(--text-muted)]'
            }`}
          >
            ⚡ Vibration
          </button>
          <button
            onClick={handleTestSound}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-lg text-sm font-medium transition"
            title="Test sound and vibration"
          >
            🧪 Test
          </button>
        </div>

        {/* FILTERS */}
        <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-4 py-2 overflow-x-auto">
          <div className="flex gap-2">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                  selectedFilter === filter.id
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {filter.label} {filter.count > 0 && `(${filter.count})`}
              </button>
            ))}
          </div>
        </div>

        {/* NOTIFICATIONS LIST */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-6 h-6 text-[var(--accent-primary)] animate-spin" />
              <p className="text-sm text-[var(--text-muted)]">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Bell className="w-12 h-12 text-[var(--text-muted)] opacity-30" />
              <p className="text-sm text-[var(--text-muted)]">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color)]">
              {notifications.map(notification => (
                <div
                  key={notification._id}
                  onClick={() => handleClickNotification(notification)}
                  className={`p-3 cursor-pointer transition hover:bg-[var(--bg-hover)] ${
                    !notification.read ? 'bg-[var(--accent-primary)]/5 border-l-2 border-[var(--accent-primary)]' : ''
                  }`}
                >
                  {/* Notification Header */}
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title & Time */}
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {notification.title}
                        </h3>
                        <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                      </div>

                      {/* Body */}
                      <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                        {notification.body}
                      </p>

                      {/* Status Indicators */}
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        {!notification.read && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-full font-medium">
                            <span className="w-2 h-2 bg-[var(--accent-primary)] rounded-full" />
                            New
                          </span>
                        )}
                        {notification.priority === 'urgent' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--danger)]/10 text-[var(--danger)] rounded-full font-medium">
                            ⚠️ Urgent
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification._id);
                          }}
                          className="p-1.5 hover:bg-[var(--bg-input)] rounded-lg transition text-[var(--text-muted)] hover:text-[var(--accent-primary)]"
                          title="Mark as read"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(notification._id);
                        }}
                        className="p-1.5 hover:bg-[var(--bg-input)] rounded-lg transition text-[var(--text-muted)] hover:text-[var(--danger)]"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        {notifications.length > 0 && (
          <div className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)] px-4 py-3 flex gap-2 sticky bottom-0">
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="flex-1 px-3 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
