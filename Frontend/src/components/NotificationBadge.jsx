import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import api from '../service/api';
import NotificationCenter from './NotificationCenter';

// ============================================
// NOTIFICATION BADGE - Shows unread count
// ============================================

const NotificationBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  // ============================================
  // FETCH UNREAD COUNT
  // ============================================
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);
    
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      clearInterval(interval);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data.success) {
        const newCount = res.data.unreadCount;
        
        // ✅ Show animation if count increased
        if (newCount > unreadCount && unreadCount > 0) {
          setHasNewNotification(true);
          setTimeout(() => setHasNewNotification(false), 2000);
        }
        
        setUnreadCount(newCount);
        
        // ✅ Update badge in browser tab
        if (newCount > 0) {
          document.title = `(${newCount}) Task Management`;
        } else {
          document.title = 'Task Management';
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // ============================================
  // HANDLE SERVICE WORKER MESSAGE
  // ============================================
  const handleServiceWorkerMessage = (event) => {
    if (event.data.type === 'NOTIFICATION_CLICKED') {
      // Refresh notifications when clicked
      fetchUnreadCount();
    }
  };

  return (
    <>
      {/* ============================================
          NOTIFICATION BELL BUTTON
          ============================================ */}
      <button
        onClick={() => setIsOpen(true)}
        className={`relative p-2 rounded-lg transition ${
          isOpen
            ? 'bg-[var(--accent-primary)] text-white'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
        }`}
        title={`${unreadCount} unread notifications`}
      >
        <Bell className={`w-5 h-5 ${hasNewNotification ? 'animate-bounce' : ''}`} />

        {/* ✅ UNREAD BADGE */}
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 bg-[var(--danger)] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse ${
              hasNewNotification ? 'scale-110' : 'scale-100'
            } transition-transform`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ============================================
          NOTIFICATION CENTER PANEL
          ============================================ */}
      <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default NotificationBadge;
