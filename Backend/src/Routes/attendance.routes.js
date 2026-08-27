import express from "express";
import checkToken from "../Middleware/checkToken.js";
import { requireTeamLeader } from "../Middleware/authorization.js";
import {
  createAttendanceRequest,
  getPendingRequests,
  handleAttendanceAction,
  getEmployeeRequests,
  getAllRequests,
  deleteRequest,
  editAttendanceRequest,
  getAttendanceByDateRange,
  getAttendanceStats,
  createAttendanceWithValidation,
  autoMarkAbsent,
  canMarkAttendance,
  getTodayStatus,
  canEditRequest,
  getEditHistory,
} from "../Controllers/attendance.controller.js";

const router = express.Router();

// ── Employee routes (any authenticated user) ──────────────────────
router.get("/can-mark", checkToken, canMarkAttendance);
router.get("/today-status", checkToken, getTodayStatus);
router.get("/:id/can-edit", checkToken, canEditRequest);
router.get("/:id/edit-history", checkToken, getEditHistory);
router.post("/create", checkToken, createAttendanceWithValidation);
router.post("/create-request", checkToken, createAttendanceRequest);
router.put("/:id/edit", checkToken, editAttendanceRequest);
router.get("/employee", checkToken, getEmployeeRequests);

// ── Admin routes (teamLeader + superAdmin) ────────────────────────
router.get("/pending", checkToken, requireTeamLeader, getPendingRequests);
router.get("/all", checkToken, requireTeamLeader, getAllRequests);
router.put("/:id/action", checkToken, requireTeamLeader, handleAttendanceAction);
router.get("/date-range", checkToken, requireTeamLeader, getAttendanceByDateRange);
router.get("/stats", checkToken, requireTeamLeader, getAttendanceStats);
router.delete("/:id", checkToken, requireTeamLeader, deleteRequest);

router.post("/auto-mark-absent", checkToken, requireTeamLeader, async (req, res) => {
  try {
    const result = await autoMarkAbsent();
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        absentCount: result.absentCount || 0,
        absentEmployees: result.absentEmployees || [],
        time: result.time || new Date().toISOString(),
      });
    } else {
      res.status(500).json({ success: false, message: result.error || "Auto-mark absent failed" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
