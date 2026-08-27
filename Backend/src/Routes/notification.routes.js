// Backend/src/Routes/notification.routes.js
import express from 'express';
import {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  broadcast,
  testNotification,
} from '../Controllers/notification.controller.js';
import checkToken from '../Middleware/checkToken.js';
import adminToken from '../Middleware/adminToken.js';

const router = express.Router();

// Public — frontend needs VAPID key before subscribing
router.get('/vapid-public-key', getVapidPublicKey);

// Protected — requires auth
router.post('/subscribe', checkToken, subscribe);
router.delete('/subscribe', checkToken, unsubscribe);
router.post('/test', checkToken, testNotification);

// Admin only — broadcast to all
router.post('/broadcast', checkToken, adminToken, broadcast);

export default router;
