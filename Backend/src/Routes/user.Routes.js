import express from "express";
import checkToken from "../Middleware/checkToken.js";
import { requireTeamLeader, requireSuperAdmin } from "../Middleware/authorization.js";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  updateUserRole,
  bulkDeleteUsers,
  getUserStats,
  updateUserMarks,
  addManualMarks,
  importPreviousRecord,
  migrateUserMarks,
  getMe,
} from "../Controllers/user.controller.js";

const router = express.Router();

// Current logged-in user (any authenticated role)
router.get("/me", checkToken, getMe);

// Stats (teamLeader + superAdmin)
router.get("/stats", checkToken, requireTeamLeader, getUserStats);

// Fix marks migration (teamLeader + superAdmin)
router.post("/migrate-marks", checkToken, requireTeamLeader, migrateUserMarks);

// Get all users (teamLeader + superAdmin)
router.get("/all-users", checkToken, requireTeamLeader, getAllUsers);
router.get("/all", checkToken, requireTeamLeader, getAllUsers);

// Get single user - any user can view own profile, teamLeader can view any
router.get("/:id", checkToken, (req, res, next) => {
  try {
    const currentUser = req.user;
    const requestedUserId = req.params.id;
    
    // Check if currentUser exists - JWT has 'id' field, not '_id'
    if (!currentUser) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication failed" 
      });
    }
    
    // Get user ID from JWT (it's 'id', not '_id')
    const currentUserId = currentUser.id || currentUser._id;
    
    if (!currentUserId) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token data" 
      });
    }
    
    // If user is viewing their own profile OR is teamLeader/superAdmin, allow it
    if (currentUserId.toString() === requestedUserId || 
        currentUser.role === "teamLeader" || 
        currentUser.role === "superAdmin") {
      return next();
    }
    
    // Otherwise deny access
    return res.status(403).json({ 
      success: false, 
      message: "You can only view your own profile" 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}, getUserById);

// Create user (teamLeader + superAdmin)
router.post("/create", checkToken, requireTeamLeader, createUser);

// Update user (teamLeader + superAdmin)
router.put("/update/:id", checkToken, requireTeamLeader, updateUser);

// Update marks (teamLeader + superAdmin)
router.put("/marks/:id", checkToken, requireTeamLeader, updateUserMarks);

// Add manual bonus marks (teamLeader + superAdmin)
router.post("/manual-marks/:id", checkToken, requireTeamLeader, addManualMarks);

// Import previous record (teamLeader + superAdmin)
router.post("/previous-record/:id", checkToken, requireTeamLeader, importPreviousRecord);

// Update role — superAdmin only (to prevent teamLeader self-promoting)
router.put("/role/:id", checkToken, requireSuperAdmin, updateUserRole);

// Toggle user status (teamLeader + superAdmin)
router.put("/status/:id", checkToken, requireTeamLeader, toggleUserStatus);

// Delete user (teamLeader + superAdmin)
router.delete("/delete/:id", checkToken, requireTeamLeader, deleteUser);

// Bulk delete (teamLeader + superAdmin)
router.post("/bulk-delete", checkToken, requireTeamLeader, bulkDeleteUsers);

export default router;
