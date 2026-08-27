import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import api from '../service/api';
import NotificationCenter from './NotificationCenter';

const MIN_FETCH_INTERVAL_MS = 60_000;
let lastFetchAt = 0;
let inFlightRequest = null;
let cachedUnreadCount = 0;

const NotificationBadge = () => {
  const [unreadCount, setUnreadCount] = useState(() => cachedUnreadCount);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const unreadCountRef = useRef(0);

  const fetchUnreadCount = useCallback(async ({ force = false } = {}) => {
    if (!localStorage.getItem('token')) return;
    if (document.hidden && !force) return;

    const now = Date.now();
    if (now - lastFetchAt < MIN_FETCH_INTERVAL_MS) {
      unreadCountRef.current = cachedUnreadCount;
      return;
    }
    if (inFlightRequest) return inFlightRequest;

    lastFetchAt = now;
    inFlightRequest = api.get('/notifications/unread-count')
      .then((res) => {
        if (res.data.success) {
          const newCount = res.data.unreadCount;
          cachedUnreadCount = newCount;
          if (newCount > unreadCountRef.current && unreadCountRef.current > 0) {
            setHasNewNotification(true);
            setTimeout(() => setHasNewNotification(false), 2000);
          }
          unreadCountRef.current = newCount;
          setUnreadCount(newCount);
          document.title = newCount > 0 ? `(${newCount}) Task Management` : 'Task Management';
        }
      })
      .catch((error) => {
        console.error('Error fetching unread count:', error);
      })
      .finally(() => {
        inFlightRequest = null;
      });

    return inFlightRequest;
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    };
    const onFocus = () => fetchUnreadCount();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);

    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === 'NOTIFICATION_CLICKED') {
        fetchUnreadCount({ force: true });
      }
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [fetchUnreadCount]);

  return (
    <>
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

      <NotificationCenter
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onUnreadChange={(count) => {
          cachedUnreadCount = count;
          unreadCountRef.current = count;
          setUnreadCount(count);
          document.title = count > 0 ? `(${count}) Task Management` : 'Task Management';
        }}
      />
    </>
  );
};

export default NotificationBadge;
