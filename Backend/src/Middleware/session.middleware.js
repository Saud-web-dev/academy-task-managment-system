import { getSettingValue } from '../Controllers/setting.controller.js';

export const checkSessionTimeout = async (req, res, next) => {
  try {
    const sessionTimeout = await getSettingValue('sessionTimeout', 60);
    
    if (req.session?.lastActivity) {
      const now = Date.now();
      const lastActivity = new Date(req.session.lastActivity).getTime();
      const inactiveTime = (now - lastActivity) / (1000 * 60);
      
      if (inactiveTime > sessionTimeout) {
        req.session.destroy();
        return res.status(401).json({
          success: false,
          message: `Session expired after ${sessionTimeout} minutes of inactivity`,
          code: 'SESSION_TIMEOUT',
        });
      }
    }
    
    if (req.session) {
      req.session.lastActivity = new Date();
    }
    
    next();
  } catch (error) {
    console.error('Session check error:', error);
    next();
  }
};