import express from "express";
import checkToken from "../Middleware/checkToken.js";
import { requireTeamLeader } from "../Middleware/authorization.js";
import {
  getAllMembers,
  getMemberById,
  updateMember,
  deleteMember,
} from "../Controllers/members.controller.js";

const router = express.Router();

// Read members — any authenticated user (employees need member list for project assignment display)
router.get("/", checkToken, getAllMembers);
router.get("/:id", checkToken, getMemberById);

// Mutations — teamLeader + superAdmin
router.put("/:id", checkToken, requireTeamLeader, updateMember);
router.delete("/:id", checkToken, requireTeamLeader, deleteMember);

export default router;
