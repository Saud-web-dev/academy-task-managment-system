import Setting from "../models/Setting.js";
import { getSetting } from '../Controllers/setting.controller.js';

// ✅ Get setting value with default fallback
export const getSetting = async (key, defaultValue = null) => {
  try {
    const setting = await Setting.findOne({ key });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error(`Get Setting Error (${key}):`, error);
    return defaultValue;
  }
};

// ✅ Validate task limits
export const validateTaskLimits = async (projectId, employeeCount) => {
  try {
    const maxEmployees = await getSetting("maxEmployeesPerTask", 5);
    const maxTasks = await getSetting("maxTasksPerProject", 100);
    
    // Check employee limit
    if (employeeCount > maxEmployees) {
      return {
        valid: false,
        error: `You can assign maximum ${maxEmployees} employees to a task`,
        maxAllowed: maxEmployees,
        currentCount: employeeCount,
      };
    }

    // Check project task limit
    const project = await Project.findById(projectId);
    if (project && project.tasks.length >= maxTasks) {
      return {
        valid: false,
        error: `Maximum ${maxTasks} tasks allowed per project`,
        maxAllowed: maxTasks,
        currentCount: project.tasks.length,
      };
    }

    return { valid: true };
  } catch (error) {
    console.error("Validate Task Limits Error:", error);
    return { valid: true };
  }
};

// ✅ Check if multiple assignees allowed
export const allowMultipleAssignees = async () => {
  return await getSetting("allowMultipleAssignees", true);
};

// ✅ Get default task status
export const getDefaultTaskStatus = async () => {
  return await getSetting("defaultTaskStatus", "Pending");
};

// ✅ Check attendance settings
export const getAttendanceSettings = async () => {
  return {
    timeWindow: await getSetting("attendanceTimeWindow", 15),
    autoMarkAbsent: await getSetting("autoMarkAbsent", false),
  };
};

// ✅ Check notification settings
export const getNotificationSettings = async () => {
  return {
    email: await getSetting("emailNotifications", true),
    push: await getSetting("pushNotifications", true),
    // ✅ Keep this as a setting value, not an import
    reminderDays: await getSetting("deadlineReminderDays", 2),
  };
};

// ✅ Check security settings
export const getSecuritySettings = async () => {
  return {
    twoFactorAuth: await getSetting("twoFactorAuth", false),
    sessionTimeout: await getSetting("sessionTimeout", 60),
    maxLoginAttempts: await getSetting("maxLoginAttempts", 5),
  };
};
