import express from "express";
import {
  register,
  login,
  logout,
  getCurrentUser,
  checkAdminStatus,
  registerFirstAdmin,
  migrateRoles,
  promoteSuperAdmin,
} from "../controllers/auth.controllers.js";

import checkToken from "../../Middleware/checkToken.js";

const router = express.Router();

// ── Public routes ──────────────────────────────────────────────────
router.get("/admin/status", checkAdminStatus);
router.post("/register-first-admin", registerFirstAdmin);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// ── Protected routes ───────────────────────────────────────────────
router.get("/me", checkToken, getCurrentUser);

// ── Admin-only routes (require superAdmin) ─────────────────────────
router.post("/migrate-roles", checkToken, migrateRoles);
router.post("/promote-super-admin", checkToken, promoteSuperAdmin);

export default router;
