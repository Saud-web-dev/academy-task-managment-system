import express from "express";
import checkToken from "../Middleware/checkToken.js";
import { requireTeamLeader } from "../Middleware/authorization.js";
import {
  getAttendanceMarkSettings,
  updateAttendanceMarkSettings,
  assignLateArrivalDeduction,
  assignAbsentDeduction,
  assignDailyUpdateMissDeduction,
  assignManualDeduction,
  bulkApplyAbsentDeductions,
  getAllDeductions,
  getUserDeductions,
  getMyDeductions,
  deleteDeduction,
  getDeductionSummaryAllUsers,
  detectLateArrivals,
  bulkApplyLateDeductions,
  applyDeadlineDeductionsEndpoint,
} from "../Controllers/scoreDeduction.controller.js";

const router = express.Router();

// ── Admin-only routes (teamLeader + superAdmin) ───────────────────
router.get("/settings", checkToken, requireTeamLeader, getAttendanceMarkSettings);
router.put("/settings", checkToken, requireTeamLeader, updateAttendanceMarkSettings);

router.post("/late-arrival", checkToken, requireTeamLeader, assignLateArrivalDeduction);
router.post("/absent", checkToken, requireTeamLeader, assignAbsentDeduction);
router.post("/daily-update-miss", checkToken, requireTeamLeader, assignDailyUpdateMissDeduction);
router.post("/manual", checkToken, requireTeamLeader, assignManualDeduction);
router.post("/bulk-absent", checkToken, requireTeamLeader, bulkApplyAbsentDeductions);

router.get("/detect-late", checkToken, requireTeamLeader, detectLateArrivals);
router.post("/bulk-late", checkToken, requireTeamLeader, bulkApplyLateDeductions);
router.post("/apply-deadline-cuts", checkToken, requireTeamLeader, applyDeadlineDeductionsEndpoint);

router.get("/all", checkToken, requireTeamLeader, getAllDeductions);
router.get("/summary", checkToken, requireTeamLeader, getDeductionSummaryAllUsers);
router.get("/user/:userId", checkToken, requireTeamLeader, getUserDeductions);

router.delete("/:id", checkToken, requireTeamLeader, deleteDeduction);

// ── Employee: own deductions only ────────────────────────────────
router.get("/my", checkToken, getMyDeductions);

export default router;
