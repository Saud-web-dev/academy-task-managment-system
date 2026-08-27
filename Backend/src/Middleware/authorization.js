/**
 * Authorization Middleware
 *
 * Role Hierarchy:
 *   employee < teamLeader < superAdmin
 *
 * requireAuth        → any authenticated user (employee + teamLeader + superAdmin)
 * requireTeamLeader  → teamLeader + superAdmin
 * requireSuperAdmin  → superAdmin only
 *
 * All functions must run AFTER checkToken which populates req.user.
 */

/**
 * Allow any authenticated user (token already verified by checkToken).
 * Use this when you just need to confirm the user is logged in.
 */
export const requireAuth = (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  next();
};

/**
 * Allow teamLeader and superAdmin.
 * Blocks plain employees from admin-level operations.
 */
export const requireTeamLeader = (req, res, next) => {
  if (!req.user || !["teamLeader", "superAdmin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Team Leader access required",
    });
  }
  next();
};

/**
 * Allow superAdmin only.
 * Used for financial management, expense CRUD, project pricing, etc.
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "superAdmin") {
    return res.status(403).json({
      success: false,
      message: "Super Admin access required",
    });
  }
  next();
};

/**
 * Legacy alias — keeps existing code that imports isAdmin working
 * while we migrate. Maps to requireTeamLeader behavior.
 */
export const isAdmin = requireTeamLeader;

export default { requireAuth, requireTeamLeader, requireSuperAdmin, isAdmin };
