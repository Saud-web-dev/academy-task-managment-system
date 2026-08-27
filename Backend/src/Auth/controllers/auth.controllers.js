import User from "../../models/Users.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// ── Helper: sign token ─────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

const setCookieToken = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const safeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  marks: user.marks,
  totalMarks: user.totalMarks,
  manualMarks: user.manualMarks,
  workStartTime: user.workStartTime,
});

// ============================================
// CHECK SYSTEM STATUS
// Returns whether a superAdmin or teamLeader exists (first-boot check)
// ============================================
export const checkAdminStatus = async (req, res) => {
  try {
    // Check for superAdmin first, fall back to teamLeader, legacy admin
    const adminExists = await User.findOne({
      role: { $in: ["superAdmin", "teamLeader", "admin"] },
    });

    res.status(200).json({
      success: true,
      adminExists: !!adminExists,
      message: adminExists
        ? "Admin exists - Please login"
        : "No admin found - Create first admin",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// REGISTER FIRST SUPER ADMIN (one-time bootstrap)
// Only works when NO superAdmin or teamLeader exists in DB
// ============================================
export const registerFirstAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Block if any elevated role already exists
    const existingAdmin = await User.findOne({
      role: { $in: ["superAdmin", "teamLeader", "admin"] },
    });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin already exists. Please login instead.",
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and password",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // First admin is always superAdmin
    const admin = new User({
      name,
      email,
      password: hashedPassword,
      role: "superAdmin",
      isActive: true,
      totalMarks: 0,
      manualMarks: 0,
      marks: 0,
    });

    await admin.save();

    const token = signToken(admin);
    setCookieToken(res, token);

    res.status(201).json({
      success: true,
      message: "Super Admin account created successfully",
      user: safeUser(admin),
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// LOGIN
// ============================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact admin.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = signToken(user);
    setCookieToken(res, token);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: safeUser(user),
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// REGISTER (general — creates employee by default)
// NEVER allows self-promoting to superAdmin/teamLeader
// ============================================
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and password",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Role is ALWAYS employee when self-registering
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "employee",
      isActive: true,
      totalMarks: 0,
      manualMarks: 0,
      marks: 0,
    });

    await user.save();

    const token = signToken(user);
    setCookieToken(res, token);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: safeUser(user),
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// LOGOUT
// ============================================
export const logout = (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

// ============================================
// GET CURRENT USER (verify token + return fresh DB data)
// ============================================
export const getCurrentUser = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      // User was hard-deleted — force logout
      return res.status(401).json({
        success: false,
        message: "Account no longer exists",
        code: "USER_DELETED",
      });
    }

    // Soft-delete check: user record still exists but is marked deleted
    if (user.deletedAt) {
      return res.status(401).json({
        success: false,
        message: "Account has been deleted",
        code: "USER_DELETED",
      });
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// MIGRATE: admin → teamLeader (safe, one-time)
// POST /api/auth/migrate-roles
// Protected: requires superAdmin
// ============================================
export const migrateRoles = async (req, res) => {
  try {
    // Only superAdmin can trigger this
    if (!req.user || req.user.role !== "superAdmin") {
      return res.status(403).json({
        success: false,
        message: "Super Admin access required",
      });
    }

    const result = await User.updateMany(
      { role: "admin" },
      { $set: { role: "teamLeader" } }
    );

    res.status(200).json({
      success: true,
      message: `Migration complete. ${result.modifiedCount} admin users converted to teamLeader.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// PROMOTE TO SUPER ADMIN
// POST /api/auth/promote-super-admin
// Protected: requires superAdmin + secret env key
// ============================================
export const promoteSuperAdmin = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "superAdmin") {
      return res.status(403).json({
        success: false,
        message: "Super Admin access required",
      });
    }

    const { userId, secret } = req.body;

    const PROMOTE_SECRET = process.env.SUPER_ADMIN_PROMOTE_SECRET;
    if (!PROMOTE_SECRET || secret !== PROMOTE_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Invalid promotion secret",
      });
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { role: "superAdmin" } },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: `${user.name} has been promoted to Super Admin`,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
