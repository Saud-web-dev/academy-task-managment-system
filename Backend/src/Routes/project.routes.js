import express from "express";
import multer from "multer";
import checkToken from "../Middleware/checkToken.js";
import { requireTeamLeader, requireSuperAdmin } from "../Middleware/authorization.js";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  addTask,
  updateTask,
  deleteTask,
  uploadDocument,
  deleteDocument,
  getProjectById,
  updateProjectFinancial,
  getProjectFinancialSummary,
} from "../Controllers/project.controller.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type."), false);
  },
});

// Read projects — any authenticated user (employees need project data for their dashboard)
router.get("/", checkToken, getProjects);
router.get("/:id", checkToken, getProjectById);

// Mutations — teamLeader + superAdmin only
router.post("/", checkToken, requireTeamLeader, createProject);
router.put("/:id", checkToken, requireTeamLeader, updateProject);
router.delete("/:id", checkToken, requireTeamLeader, deleteProject);

// Task mutations — teamLeader + superAdmin
router.post("/:id/tasks", checkToken, requireTeamLeader, addTask);
// Employees may update progress only for tasks assigned to them; this is
// enforced inside updateTask. All other task mutations remain admin-only.
router.put("/:projectId/tasks/:taskId", checkToken, updateTask);
router.delete("/:projectId/tasks/:taskId", checkToken, requireTeamLeader, deleteTask);

// Documents — teamLeader + superAdmin
router.post("/:id/documents", checkToken, requireTeamLeader, upload.single("file"), uploadDocument);
router.delete("/:projectId/documents/:documentId", checkToken, requireTeamLeader, deleteDocument);

// Financial fields — superAdmin only
router.patch("/:id/financial", checkToken, requireSuperAdmin, updateProjectFinancial);
router.get("/:id/financial-summary", checkToken, requireSuperAdmin, getProjectFinancialSummary);

export default router;
