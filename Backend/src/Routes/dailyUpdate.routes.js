import express from "express";
import checkToken from "../Middleware/checkToken.js";
import { requireTeamLeader } from "../Middleware/authorization.js";
import {
  submitDailyUpdate,
  getMyDailyUpdates,
  editDailyUpdate,
  getAllDailyUpdates,
  checkMissingUpdates,
  bulkApplyMissPenalty,
  addAdminRemarks,
  getFullDataExport,
} from "../Controllers/dailyUpdate.controller.js";

const router = express.Router();

// ── Employee routes ───────────────────────────────────────────────
router.post("/submit", checkToken, submitDailyUpdate);
router.get("/my", checkToken, getMyDailyUpdates);
router.put("/:id/edit", checkToken, editDailyUpdate);

// ── Admin routes (teamLeader + superAdmin) ────────────────────────
router.get("/all", checkToken, requireTeamLeader, getAllDailyUpdates);
router.get("/missing", checkToken, requireTeamLeader, checkMissingUpdates);
router.post("/bulk-penalty", checkToken, requireTeamLeader, bulkApplyMissPenalty);
router.put("/:id/remarks", checkToken, requireTeamLeader, addAdminRemarks);
router.get("/export", checkToken, requireTeamLeader, getFullDataExport);

export default router;
