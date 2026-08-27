import { getSettingValue } from '../Controllers/setting.controller.js';

// Store login attempts (in production, use Redis or database)
const loginAttempts = new Map();

export const checkLoginAttempts = async (req, res, next) => {
  try {
    const maxAttempts = await getSettingValue('maxLoginAttempts', 5);
    const email = req.body.email;
    
    if (!email) return next();
    
    const attempts = loginAttempts.get(email) || 0;
    
    if (attempts >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: `Too many failed attempts (${attempts}/${maxAttempts}). Please try after 15 minutes.`,
        remainingAttempts: 0,
        maxAttempts,
      });
    }
    
    req.loginAttempts = attempts;
    req.maxAttempts = maxAttempts;
    
    next();
  } catch (error) {
    console.error('Login attempts check error:', error);
    next();
  }
};

export const incrementLoginAttempts = (email) => {
  if (!email) return;
  
  const attempts = loginAttempts.get(email) || 0;
  loginAttempts.set(email, attempts + 1);
  console.log(`⚠️ Login attempts for ${email}: ${attempts + 1}`);
  
  // Reset after 15 minutes
  setTimeout(() => {
    loginAttempts.delete(email);
    console.log(`🔄 Reset login attempts for ${email}`);
  }, 15 * 60 * 1000);
};

export const resetLoginAttempts = (email) => {
  if (!email) return;
  loginAttempts.delete(email);
  console.log(`✅ Reset login attempts for ${email}`);
};

export const getLoginAttempts = (email) => {
  return loginAttempts.get(email) || 0;
};