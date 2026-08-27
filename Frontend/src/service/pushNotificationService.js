// Push Notification Service - WhatsApp Style
// Works even when the app is closed (like WhatsApp Web)

import api from './api';

const VAPID_SUBJECT = 'mailto:admin@taskmanagement.com';

/**
 * Register service worker for push notifications
 */
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('✅ Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Request permission and subscribe user to push notifications
 */
export const subscribeToPushNotifications = async () => {
  // Check browser support
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push Notifications not supported');
    return { success: false, message: 'Push notifications not supported by browser' };
  }

  try {
    // Request notification permission
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      return { success: false, message: 'Notification permission denied' };
    }

    // Register service worker
    const registration = await navigator.serviceWorker.ready;

    // ✅ Get VAPID public key from backend with error handling
    let vapidPublicKey;
    try {
      const vapidResponse = await api.get('/notifications/vapid-public-key');
      if (!vapidResponse.data.success) {
        throw new Error('Failed to get VAPID key from backend');
      }
      vapidPublicKey = vapidResponse.data.publicKey;
    } catch (apiError) {
      console.error('❌ Failed to fetch VAPID key:', apiError);
      return { 
        success: false, 
        message: 'Push notification service temporarily unavailable. Please try again later.' 
      };
    }

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // Send subscription to backend
    await api.post('/notifications/subscribe', { subscription });

    console.log('✅ Subscribed to push notifications');
    return { success: true, message: 'Subscribed to push notifications', subscription };
  } catch (error) {
    console.error('❌ Push subscription failed:', error);
    return { success: false, message: error.message || 'Failed to subscribe to notifications' };
  }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPushNotifications = async () => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await api.delete('/notifications/subscribe');
      console.log('✅ Unsubscribed from push notifications');
      return { success: true };
    }
  } catch (error) {
    console.error('❌ Unsubscribe failed:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Check if user is subscribed to push
 */
export const checkPushSubscription = async () => {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
};

/**
 * Request notification test from backend
 */
export const sendTestNotification = async () => {
  try {
    const res = await api.post('/notifications/test');
    return res.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || error.message };
  }
};

/**
 * Broadcast notification to all users (admin only)
 */
export const broadcastNotification = async (title, body, icon, url) => {
  try {
    const res = await api.post('/notifications/broadcast', {
      title,
      body,
      icon,
      url,
      tag: 'broadcast',
    });
    return res.data;
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Convert VAPID key to Uint8Array
 * Helper for subscription
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Initialize push notifications on app start
 */
export const initPushNotifications = async () => {
  try {
    // Register service worker
    await registerServiceWorker();

    // Check if browser supports service workers
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Workers not supported - push notifications disabled');
      return false;
    }

    // Check and restore subscription if permission is granted
    const isSubscribed = await checkPushSubscription();
    if (isSubscribed && Notification.permission === 'granted') {
      console.log('✅ Push notifications already enabled');
      return true;
    }

    return false;
  } catch (error) {
    console.warn('⚠️ Push notification initialization failed:', error);
    return false;
  }
};
