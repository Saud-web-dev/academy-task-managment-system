import express from "express";
import checkToken from "../Middleware/checkToken.js";
import { requireTeamLeader } from "../Middleware/authorization.js";
import {
  getAllSettings,
  getSetting,
  updateSetting,
  deleteSetting,
  getSettingsGrouped,
  updateTheme,
  getTheme,
  updateUIStyle,
  getUIStyleValue,
  getSettingsStatus,
} from "../Controllers/setting.controller.js";

const router = express.Router();

// ============================================
// IMPORTANT: Specific routes MUST come BEFORE /:key
// Otherwise Express will match /:key first
// ============================================

// Read-only settings (any authenticated user — theme/UI needed for employee views too)
router.get("/", getAllSettings);
router.get("/grouped", getSettingsGrouped);
router.get("/status", getSettingsStatus);
router.get("/theme", getTheme);
router.get("/uiStyle", getUIStyleValue);

// Dynamic key route MUST be LAST among GET routes
router.get("/:key", getSetting);

// Mutations — teamLeader + superAdmin
// Specific routes FIRST
router.put("/theme", checkToken, requireTeamLeader, updateTheme);
router.put("/uiStyle", checkToken, requireTeamLeader, updateUIStyle);

// Dynamic key route LAST
router.put("/:key", checkToken, requireTeamLeader, updateSetting);
router.delete("/:key", checkToken, requireTeamLeader, deleteSetting);

export default router;
