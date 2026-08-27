// Backend/src/Controllers/notification.controller.js
import webpush from 'web-push';
import User from '../models/Users.js';

// ============================================
// VAPID KEYS SETUP
// Generate once with: npx web-push generate-vapid-keys
// Then set in .env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
// ============================================
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@taskmanagement.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('✅ Web Push VAPID keys configured');
} else {
  console.warn('⚠️ VAPID keys not set. Push notifications disabled. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env');
}

// ============================================
// GET VAPID PUBLIC KEY (for frontend subscription)
// GET /api/notifications/vapid-public-key
// ============================================
export const getVapidPublicKey = (req, res) => {
  if (!VAPID_PUBLIC_KEY) {
    return res.status(503).json({
      success: false,
      message: 'Push notifications not configured on server',
    });
  }
  res.status(200).json({ success: true, publicKey: VAPID_PUBLIC_KEY });
};

// ============================================
// SUBSCRIBE: Save push subscription for a user
// POST /api/notifications/subscribe
// Protected: requires auth
// ============================================
export const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription object',
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await User.findByIdAndUpdate(userId, {
      $set: { pushSubscription: subscription },
    });

    res.status(201).json({ success: true, message: 'Push subscription saved' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// UNSUBSCRIBE: Remove push subscription
// DELETE /api/notifications/subscribe
// Protected: requires auth
// ============================================
export const unsubscribe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await User.findByIdAndUpdate(userId, {
      $set: { pushSubscription: null },
    });

    res.status(200).json({ success: true, message: 'Push subscription removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// SEND NOTIFICATION TO SPECIFIC USER(S)
// Internal helper — called from other controllers
// ============================================
export const sendPushToUsers = async (userIds, payload) => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  const users = await User.find({ _id: { $in: userIds }, pushSubscription: { $ne: null } });

  const results = await Promise.allSettled(
    users.map(async (user) => {
      if (!user.pushSubscription) return;
      try {
        await webpush.sendNotification(
          user.pushSubscription,
          JSON.stringify(payload)
        );
      } catch (err) {
        // Subscription expired or invalid — clean it up
        if (err.statusCode === 410 || err.statusCode === 404) {
          await User.findByIdAndUpdate(user._id, { $set: { pushSubscription: null } });
        }
        throw err;
      }
    })
  );

  return results;
};

// ============================================
// SEND NOTIFICATION TO ALL USERS (broadcast)
// POST /api/notifications/broadcast
// Protected: requires teamLeader / superAdmin
// ============================================
export const broadcast = async (req, res) => {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return res.status(503).json({
        success: false,
        message: 'Push notifications not configured on server',
      });
    }

    const { title, body, icon, url, tag } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'title and body are required' });
    }

    const payload = {
      title,
      body,
      icon: icon || '/icon-192.png',
      badge: '/badge-72.png',
      url: url || '/',
      tag: tag || 'broadcast',
      timestamp: Date.now(),
    };

    const subscribers = await User.find({ pushSubscription: { $ne: null } });
    let sent = 0, failed = 0;

    await Promise.allSettled(
      subscribers.map(async (user) => {
        try {
          await webpush.sendNotification(user.pushSubscription, JSON.stringify(payload));
          sent++;
        } catch (err) {
          failed++;
          if (err.statusCode === 410 || err.statusCode === 404) {
            await User.findByIdAndUpdate(user._id, { $set: { pushSubscription: null } });
          }
        }
      })
    );

    res.status(200).json({
      success: true,
      message: `Broadcast sent to ${sent} users (${failed} failed)`,
      sent,
      failed,
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// SEND TEST NOTIFICATION TO SELF
// POST /api/notifications/test
// Protected: requires auth
// ============================================
export const testNotification = async (req, res) => {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return res.status(503).json({
        success: false,
        message: 'Push notifications not configured on server',
      });
    }

    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user?.pushSubscription) {
      return res.status(400).json({
        success: false,
        message: 'No push subscription found. Please enable notifications first.',
      });
    }

    const payload = {
      title: 'Test Notification',
      body: 'Push notifications are working correctly!',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'test',
      url: '/',
      timestamp: Date.now(),
    };

    await webpush.sendNotification(user.pushSubscription, JSON.stringify(payload));

    res.status(200).json({ success: true, message: 'Test notification sent!' });
  } catch (error) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      await User.findByIdAndUpdate(req.user?.id, { $set: { pushSubscription: null } });
      return res.status(400).json({
        success: false,
        message: 'Subscription expired. Please re-enable notifications.',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
