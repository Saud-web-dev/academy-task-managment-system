import { getSecuritySettings } from "./settings.middleware.js";

// ============================================
// SESSION TIMEOUT MIDDLEWARE
// ============================================
export const sessionTimeoutMiddleware = async (req, res, next) => {
  try {
    const settings = await getSecuritySettings();
    const timeoutMinutes = settings.sessionTimeout || 60;

    // Check last activity
    const lastActivity = req.session?.lastActivity;
    if (lastActivity) {
      const now = Date.now();
      const diffMinutes = (now - lastActivity) / 60000;

      if (diffMinutes > timeoutMinutes) {
        req.session.destroy();
        return res.status(401).json({
          success: false,
          message: `Session expired after ${timeoutMinutes} minutes of inactivity`,
        });
      }
    }

    // Update last activity
    if (req.session) {
      req.session.lastActivity = Date.now();
    }

    next();
  } catch (error) {
    console.error("Session Timeout Error:", error);
    next();
  }
};

// ============================================
// MAX LOGIN ATTEMPTS MIDDLEWARE
// ============================================
const loginAttempts = new Map();

export const maxLoginAttemptsMiddleware = async (req, res, next) => {
  try {
    const settings = await getSecuritySettings();
    const maxAttempts = settings.maxLoginAttempts || 5;
    const { email } = req.body;

    if (!email) return next();

    const key = `login_attempts_${email}`;
    const attempts = loginAttempts.get(key) || 0;

    if (attempts >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Please try again later. Max attempts: ${maxAttempts}`,
      });
    }

    // Store attempt on login failure
    const originalSend = res.send;
    res.send = function(data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.success === false) {
          loginAttempts.set(key, (loginAttempts.get(key) || 0) + 1);
        } else {
          loginAttempts.delete(key);
        }
      } catch (e) {}
      return originalSend.call(this, data);
    };

    next();
  } catch (error) {
    console.error("Max Login Attempts Error:", error);
    next();
  }
};