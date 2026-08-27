// Backend/src/Controllers/setting.controller.js
import Setting from "../models/Setting.js";

const UI_STYLES_CONFIG = ['material', 'glass', 'neumorph', 'flat', 'corporate'];
const VALID_THEMES = ['win-light', 'win-dark', 'vscode-dark', 'github-dark', 'dracula', 'nord', 'one-dark', 'monokai', 'solarized-dark', 'solarized-light'];

// ======================== CRUD ========================
export const getAllSettings = async (req, res) => {
  try {
    const settings = await Setting.find().sort({ key: 1 });
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await Setting.findOne({ key });
    if (!setting) return res.status(404).json({ message: "Setting not found" });
    res.status(200).json(setting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    let { value, description } = req.body;

    // ✅ Fix attendanceDeadline format
    if (key === "attendanceDeadline" && value) {
      if (!/^\d{1,2}:\d{2}$/.test(value)) {
        if (value.includes(':')) {
          const parts = value.split(':');
          const h = parseInt(parts[0]) || 17;
          const m = parseInt(parts[1]) || 0;
          value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        } else {
          value = "17:00";
        }
      }
      const [h, m] = value.split(':').map(Number);
      if (isNaN(h) || h > 23 || isNaN(m) || m > 59) {
        value = "17:00";
      }
    }

    if (value === undefined || value === null) {
      if (key === "theme") value = "vscode-dark";
      else if (key === "uiStyle") value = "material";
      else value = "";
    }

    if (key === "theme" && !VALID_THEMES.includes(value)) value = "vscode-dark";
    if (key === "uiStyle" && !UI_STYLES_CONFIG.includes(value)) value = "material";

    let setting = await Setting.findOne({ key });
    if (setting) {
      setting.value = value;
      if (description !== undefined) setting.description = description;
      setting.updatedAt = new Date();
      await setting.save();
    } else {
      setting = await Setting.create({ key, value, description: description || "" });
    }

    res.status(200).json({ success: true, message: "Setting updated successfully", setting });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await Setting.findOneAndDelete({ key });
    if (!setting) return res.status(404).json({ message: "Setting not found" });
    res.status(200).json({ success: true, message: "Setting deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTheme = async (req, res) => {
  try {
    let { theme } = req.body;
    if (!theme || !VALID_THEMES.includes(theme)) theme = "vscode-dark";
    let setting = await Setting.findOne({ key: 'theme' });
    if (setting) {
      setting.value = theme;
      setting.updatedAt = new Date();
      await setting.save();
    } else {
      setting = await Setting.create({ key: 'theme', value: theme, description: 'Website theme preference' });
    }
    res.status(200).json({ success: true, message: 'Theme updated', theme: setting.value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTheme = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: 'theme' });
    res.status(200).json({ success: true, value: setting?.value || 'vscode-dark' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUIStyle = async (req, res) => {
  try {
    let { value } = req.body;
    if (!value || !UI_STYLES_CONFIG.includes(value)) value = "material";
    const setting = await Setting.findOneAndUpdate(
      { key: "uiStyle" },
      { key: "uiStyle", value, description: "Layout / component design system" },
      { new: true, upsert: true, runValidators: true }
    );
    return res.status(200).json({ success: true, value: setting.value, message: "UI Style Updated Successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUIStyleValue = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: 'uiStyle' });
    res.status(200).json({ success: true, value: setting?.value || 'material' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================== HELPERS ========================
export const getSettingValue = async (key, defaultValue = null) => {
  try {
    const setting = await Setting.findOne({ key });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

// ============================================
// ✅ FIXED: PAKISTAN TIME (UTC+5) — Proper Implementation
// ============================================

/**
 * Get current time in Pakistan (UTC+5)
 * Uses Intl.DateTimeFormat for accurate timezone conversion
 * @returns {Date} Date object representing Pakistan local time
 */
const getPakistanTime = () => {
  // Get Pakistan time as formatted string
  const pkTimeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());

  // Parse the formatted string back to a Date object
  // Format: MM/DD/YYYY, HH:mm:ss
  const [datePart, timePart] = pkTimeStr.split(', ');
  const [month, day, year] = datePart.split('/').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);

  return new Date(year, month - 1, day, hours, minutes, seconds);
};

/**
 * Get Pakistan time components
 * @returns {Object} { hours, minutes, totalMinutes, timeString }
 */
const getPakistanTimeComponents = () => {
  const pkTime = getPakistanTime();
  const hours = pkTime.getHours();
  const minutes = pkTime.getMinutes();
  return {
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
    timeString: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    date: pkTime,
  };
};

export const getAttendanceDeadline = async () => {
  return await getSettingValue("attendanceDeadline", "17:00");
};

export const getAttendanceEditWindow = async () => {
  return await getSettingValue("attendanceEditWindow", 15);
};

// ✅ FIXED: Pakistan Time (UTC+5) — Using Intl.DateTimeFormat
export const isAttendanceAllowed = async () => {
  try {
    const deadline = await getAttendanceDeadline();
    const [deadlineHours, deadlineMinutes] = deadline.split(':').map(Number);

    const pk = getPakistanTimeComponents();
    const deadlineTotalMinutes = deadlineHours * 60 + deadlineMinutes;

    console.log(`🕐 Pakistan Time: ${pk.timeString} (UTC+5)`);
    console.log(`⏰ Deadline: ${deadline}`);
    console.log(`✅ Can Mark: ${pk.totalMinutes < deadlineTotalMinutes}`);

    return pk.totalMinutes < deadlineTotalMinutes;
  } catch (error) {
    console.error("Check attendance allowed error:", error);
    return true; // Fail open — allow attendance if check fails
  }
};

// ✅ FIXED: Pakistan Time (UTC+5) — Using Intl.DateTimeFormat
export const getRemainingAttendanceTime = async () => {
  try {
    const deadline = await getAttendanceDeadline();
    const [deadlineHours, deadlineMinutes] = deadline.split(':').map(Number);

    const pk = getPakistanTimeComponents();
    const deadlineTotalMinutes = deadlineHours * 60 + deadlineMinutes;

    const remainingMinutes = Math.max(0, deadlineTotalMinutes - pk.totalMinutes);
    const remainingHours = Math.floor(remainingMinutes / 60);
    const remainingMins = remainingMinutes % 60;

    return {
      remainingMinutes,
      remainingHours,
      remainingMins,
      deadline: `${String(deadlineHours).padStart(2, '0')}:${String(deadlineMinutes).padStart(2, '0')}`,
      isPastDeadline: remainingMinutes <= 0,
      currentPakistanTime: pk.timeString,
    };
  } catch (error) {
    console.error("Get remaining time error:", error);
    return { 
      remainingMinutes: 0, 
      remainingHours: 0, 
      remainingMins: 0, 
      deadline: "17:00", 
      isPastDeadline: true,
      currentPakistanTime: "--:--",
    };
  }
};

// ======================== EXPORTED GETTERS ========================
export const getMaxEmployeesPerTask = async () => getSettingValue("maxEmployeesPerTask", 5);
export const getMaxTasksPerProject = async () => getSettingValue("maxTasksPerProject", 100);
export const getDefaultProjectStatus = async () => getSettingValue("defaultProjectStatus", "Pending");
export const allowMultipleAssignees = async () => getSettingValue("allowMultipleAssignees", true);
export const getAttendanceTimeWindow = async () => getSettingValue("attendanceTimeWindow", 15);
export const getAutoMarkAbsent = async () => getSettingValue("autoMarkAbsent", false);
export const getTaskAssignmentNotifications = async () => getSettingValue("taskAssignmentNotifications", true);
export const getTwoFactorAuth = async () => getSettingValue("twoFactorAuth", false);
export const getSessionTimeout = async () => getSettingValue("sessionTimeout", 60);
export const getMaxLoginAttempts = async () => getSettingValue("maxLoginAttempts", 5);
export const getCompactMode = async () => getSettingValue("compactMode", false);

// ======================== SETTINGS STATUS ========================
export const getSettingsStatus = async (req, res) => {
  try {
    const status = {
      autoMarkAbsent: await getSettingValue('autoMarkAbsent', false),
      attendanceTimeWindow: await getSettingValue('attendanceTimeWindow', 15),
      sessionTimeout: await getSettingValue('sessionTimeout', 60),
      maxLoginAttempts: await getSettingValue('maxLoginAttempts', 5),
      attendanceDeadline: await getAttendanceDeadline(),
      attendanceEditWindow: await getAttendanceEditWindow(),
    };
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================== INITIALIZE SETTINGS ========================
export const initializeSettings = async () => {
  try {
    console.log("🔄 Initializing default settings...");
    const defaultSettings = [
      { key: "employeeTheme", value: "dark", description: "Employee theme preference" },
      { key: "employeeEmailNotifications", value: true, description: "Enable email notifications" },
      { key: "employeeTaskAlerts", value: true, description: "Enable task assignment alerts" },
      { key: "employeeDisplayName", value: "", description: "Employee display name" },
      { key: "employeeLanguage", value: "en", description: "Employee language preference" },
      { key: "employeeSessionTimeout", value: 30, description: "Employee session timeout" },
      { key: "maxEmployeesPerTask", value: 5, description: "Maximum employees per task" },
      { key: "maxTasksPerProject", value: 100, description: "Maximum tasks per project" },
      { key: "defaultProjectStatus", value: "Pending", description: "Default project status" },
      { key: "allowMultipleAssignees", value: true, description: "Allow multiple assignees" },
      { key: "attendanceTimeWindow", value: 15, description: "Minutes allowed before/after scheduled time" },
      { key: "autoMarkAbsent", value: false, description: "Auto mark absent" },
      { key: "attendanceDeadline", value: "17:00", description: "Attendance deadline (24-hour format)" },
      { key: "attendanceEditWindow", value: 15, description: "Minutes to edit attendance" },
      { key: "twoFactorAuth", value: false, description: "Enable 2FA" },
      { key: "sessionTimeout", value: 60, description: "Session timeout in minutes" },
      { key: "maxLoginAttempts", value: 5, description: "Max login attempts" },
      { key: "theme", value: "vscode-dark", description: "Website theme" },
      { key: "uiStyle", value: "material", description: "UI Design System" },
      { key: "compactMode", value: false, description: "Compact mode" },
    ];

    let createdCount = 0, existingCount = 0;
    for (const setting of defaultSettings) {
      try {
        const exists = await Setting.findOne({ key: setting.key });
        if (!exists) {
          await Setting.create(setting);
          createdCount++;
          console.log(`✅ Setting created: ${setting.key} = ${setting.value}`);
        } else {
          existingCount++;
        }
      } catch (error) {
        console.error(`❌ Error creating setting ${setting.key}:`, error.message);
      }
    }
    console.log(`📊 Settings initialized: ${createdCount} created, ${existingCount} existing`);
    return { createdCount, existingCount };
  } catch (error) {
    console.error("❌ Initialize Settings Error:", error.message);
    return { createdCount: 0, existingCount: 0, error: error.message };
  }
};

export const getSettingsGrouped = async (req, res) => {
  try {
    const allSettings = await Setting.find().sort({ key: 1 });
    const grouped = { task: [], attendance: [], theme: [], security: [], appearance: [] };
    const taskKeys = ["maxEmployeesPerTask", "maxTasksPerProject", "defaultProjectStatus", "allowMultipleAssignees"];
    const attendanceKeys = ["attendanceTimeWindow", "autoMarkAbsent", "attendanceDeadline", "attendanceEditWindow"];
    const themeKeys = ["theme"];
    const securityKeys = ["twoFactorAuth", "sessionTimeout", "maxLoginAttempts"];
    const appearanceKeys = ["compactMode", "uiStyle"];

    allSettings.forEach(setting => {
      if (taskKeys.includes(setting.key)) grouped.task.push(setting);
      else if (attendanceKeys.includes(setting.key)) grouped.attendance.push(setting);
      else if (themeKeys.includes(setting.key)) grouped.theme.push(setting);
      else if (securityKeys.includes(setting.key)) grouped.security.push(setting);
      else if (appearanceKeys.includes(setting.key)) grouped.appearance.push(setting);
    });
    res.status(200).json({ success: true, data: grouped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
