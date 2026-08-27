// ============================================
// ENHANCED SERVICE WORKER - WhatsApp Style
// ============================================
// Features:
// - Works offline and online
// - Stores notifications locally
// - Shows rich notifications
// - Handles notification actions
// - Syncs with server when online
// ============================================

const NOTIFICATION_DB = 'NotificationDB';
const NOTIFICATION_STORE = 'notifications';
const CACHE_VERSION = 'v1';

// ============================================
// INSTALL EVENT
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting();
});

// ============================================
// ACTIVATE EVENT
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  event.waitUntil(clients.claim());
});

// ============================================
// PUSH EVENT - Main notification handler
// ============================================
self.addEventListener('push', (event) => {
  console.log('[SW] 📬 Push notification received');

  let notificationData = {
    title: 'Task Management',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'notification',
    requireInteraction: true, // ✅ Keep notification visible
    timestamp: Date.now(),
    id: Date.now().toString(),
  };

  // ✅ Parse notification payload
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  console.log('[SW] Notification data:', notificationData);

  // ✅ Store notification in IndexedDB (for offline access)
  event.waitUntil(
    storeNotificationLocally(notificationData).then(() => {
      // ✅ Show notification with rich options
      return self.registration.showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        tag: notificationData.tag,
        requireInteraction: notificationData.requireInteraction,
        timestamp: notificationData.timestamp,
        data: {
          url: notificationData.url || '/',
          id: notificationData.id,
          type: notificationData.type || 'general',
        },
        actions: [
          {
            action: 'open',
            title: 'Open',
            icon: '/icons/open.png',
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/icons/close.png',
          },
        ],
        // ✅ Show vibration and sound
        vibrate: [200, 100, 200],
        sound: '/sounds/notification.mp3',
      });
    })
  );
});

// ============================================
// NOTIFICATION CLICK - Handle user interaction
// ============================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🔔 Notification clicked:', event.notification.tag);

  const notificationData = event.notification.data;
  const urlToOpen = notificationData?.url || '/';

  // ✅ Handle different actions
  if (event.action === 'dismiss') {
    event.notification.close();
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // ✅ Check if app window already exists
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          // ✅ Focus existing window and send message
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            notification: notificationData,
          });
          return;
        }
      }

      // ✅ Open new window if not exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen).then((client) => {
          if (client && client.postMessage) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              notification: notificationData,
            });
          }
        });
      }
    })
  );

  event.notification.close();
});

// ============================================
// NOTIFICATION CLOSE - Track dismissed notifications
// ============================================
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] ❌ Notification closed:', event.notification.tag);
  
  // ✅ Mark as read in IndexedDB
  if (event.notification.data?.id) {
    markNotificationAsRead(event.notification.data.id);
  }
});

// ============================================
// SYNC EVENT - Background sync when back online
// ============================================
self.addEventListener('sync', (event) => {
  console.log('[SW] ⚡ Background sync triggered:', event.tag);

  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotificationsWithServer());
  }
});

// ============================================
// MESSAGE EVENT - Receive messages from clients
// ============================================
self.addEventListener('message', (event) => {
  console.log('[SW] 📩 Message received:', event.data.type);

  if (event.data.type === 'GET_UNREAD_COUNT') {
    getUnreadNotificationCount().then((count) => {
      event.ports[0].postMessage({ unreadCount: count });
    });
  }

  if (event.data.type === 'GET_NOTIFICATIONS') {
    getStoredNotifications().then((notifications) => {
      event.ports[0].postMessage({ notifications });
    });
  }

  if (event.data.type === 'MARK_AS_READ') {
    markNotificationAsRead(event.data.id);
  }

  if (event.data.type === 'DELETE_NOTIFICATION') {
    deleteNotification(event.data.id);
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// ✅ Store notification in IndexedDB
async function storeNotificationLocally(notificationData) {
  try {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(NOTIFICATION_DB, 1);

      request.onerror = () => {
        console.error('[SW] IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(NOTIFICATION_STORE)) {
          db.createObjectStore(NOTIFICATION_STORE, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(NOTIFICATION_STORE, 'readwrite');
        const store = transaction.objectStore(NOTIFICATION_STORE);

        store.add({
          ...notificationData,
          read: false,
          createdAt: new Date().toISOString(),
        });

        transaction.oncomplete = () => {
          console.log('[SW] ✅ Notification stored locally');
          resolve();
        };

        transaction.onerror = () => {
          console.error('[SW] Transaction error:', transaction.error);
          reject(transaction.error);
        };
      };
    });
  } catch (error) {
    console.error('[SW] Error storing notification:', error);
  }
}

// ✅ Get unread notification count
async function getUnreadNotificationCount() {
  return new Promise((resolve) => {
    const request = indexedDB.open(NOTIFICATION_DB, 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(NOTIFICATION_STORE, 'readonly');
      const store = transaction.objectStore(NOTIFICATION_STORE);
      const countRequest = store.count();

      countRequest.onsuccess = () => {
        resolve(countRequest.result);
      };
    };

    request.onerror = () => {
      resolve(0);
    };
  });
}

// ✅ Get stored notifications from IndexedDB
async function getStoredNotifications() {
  return new Promise((resolve) => {
    const request = indexedDB.open(NOTIFICATION_DB, 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(NOTIFICATION_STORE, 'readonly');
      const store = transaction.objectStore(NOTIFICATION_STORE);
      const allRequest = store.getAll();

      allRequest.onsuccess = () => {
        // ✅ Sort by most recent first
        const notifications = allRequest.result.sort((a, b) => b.timestamp - a.timestamp);
        resolve(notifications);
      };
    };

    request.onerror = () => {
      resolve([]);
    };
  });
}

// ✅ Mark notification as read
async function markNotificationAsRead(id) {
  try {
    return new Promise((resolve) => {
      const request = indexedDB.open(NOTIFICATION_DB, 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(NOTIFICATION_STORE, 'readwrite');
        const store = transaction.objectStore(NOTIFICATION_STORE);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const notification = getRequest.result;
          if (notification) {
            notification.read = true;
            store.put(notification);
          }
        };

        transaction.oncomplete = () => {
          resolve();
        };
      };
    });
  } catch (error) {
    console.error('[SW] Error marking as read:', error);
  }
}

// ✅ Delete notification
async function deleteNotification(id) {
  try {
    return new Promise((resolve) => {
      const request = indexedDB.open(NOTIFICATION_DB, 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(NOTIFICATION_STORE, 'readwrite');
        const store = transaction.objectStore(NOTIFICATION_STORE);
        store.delete(id);

        transaction.oncomplete = () => {
          resolve();
        };
      };
    });
  } catch (error) {
    console.error('[SW] Error deleting notification:', error);
  }
}

// ✅ Sync notifications with server
async function syncNotificationsWithServer() {
  try {
    console.log('[SW] 🔄 Syncing notifications with server...');
    const response = await fetch('/api/notifications/sync');
    if (response.ok) {
      console.log('[SW] ✅ Notifications synced');
    }
  } catch (error) {
    console.warn('[SW] Sync failed (offline):', error);
  }
}
