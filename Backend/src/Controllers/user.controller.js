import User from "../models/Users.js";
import bcrypt from "bcryptjs";
import { syncAssignedTaskMarks } from "../utility/userMarks.utility.js";

export const getMe = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    await syncAssignedTaskMarks([userId]);
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { search, role, isActive, sortBy = "createdAt", order = "desc" } = req.query;

    const filter = {};
    if (role && role !== "all") filter.role = role;
    if (isActive && isActive !== "all") filter.isActive = isActive === "true";
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === "asc" ? 1 : -1;

    const users = await User.find(filter).select("-password").sort(sortOptions);
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, workStartTime } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine allowed role — only superAdmin can create teamLeader/superAdmin
    const callerRole = req.user?.role || "employee";
    let finalRole = "employee";
    if (role === "superAdmin" && callerRole === "superAdmin") finalRole = "superAdmin";
    else if (role === "teamLeader" && ["superAdmin"].includes(callerRole)) finalRole = "teamLeader";
    else if (role === "employee") finalRole = "employee";
    // legacy: keep "admin" working during migration period
    else if (role === "admin") finalRole = "teamLeader";
    // Marks are never accepted while creating an account. They can only be
    // assigned later by an authorized Team Leader or Super Admin.
    const baseTotalMarks = 0;
    const baseManualMarks = 0;
    const baseMarks = 0;

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: finalRole,
      isActive: true,
      totalMarks: baseTotalMarks,
      manualMarks: baseManualMarks,
      marks: baseMarks,
      workStartTime: workStartTime || "",
    });

    await newUser.save();
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({ success: true, message: "User created successfully", user: userResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, currentPassword, role, isActive, marks, totalMarks, manualMarks, workStartTime } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    // Role change: only superAdmin can assign teamLeader/superAdmin
    if (role) {
      const callerRole = req.user?.role || "employee";
      const allowedRoles = ["employee", "teamLeader", "superAdmin"];
      if (allowedRoles.includes(role)) {
        if (role === "superAdmin" && callerRole !== "superAdmin") {
          return res.status(403).json({ success: false, message: "Only Super Admin can assign Super Admin role" });
        }
        if (role === "teamLeader" && callerRole !== "superAdmin") {
          return res.status(403).json({ success: false, message: "Only Super Admin can assign Team Leader role" });
        }
        user.role = role;
      } else if (role === "admin") {
        // legacy migration: treat "admin" as "teamLeader"
        user.role = "teamLeader";
      }
    }
    if (isActive !== undefined) user.isActive = isActive;
    if (workStartTime !== undefined) user.workStartTime = workStartTime;
    if (totalMarks !== undefined) user.totalMarks = Number(totalMarks);
    if (manualMarks !== undefined) user.manualMarks = Number(manualMarks);
    if (marks !== undefined) user.marks = Number(marks);

    if (password) {
      if (currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ success: false, message: "Current password is incorrect" });
        }
      }
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    // Recalculate deduction chain when marks/totalMarks/manualMarks change
    if (marks !== undefined || totalMarks !== undefined || manualMarks !== undefined) {
      try {
        const ScoreDeduction = (await import('../models/ScoreDeduction.js')).default;
        const deductions = await ScoreDeduction.find({ userId: id }).sort({ date: 1, createdAt: 1 });
        const newBase = (user.totalMarks ?? 0) + (user.manualMarks ?? 0);
        let running = newBase;

        for (const d of deductions) {
          const before = parseFloat(running.toFixed(2));
          const after = Math.max(0, parseFloat((before - d.marksDeducted).toFixed(2)));
          await ScoreDeduction.findByIdAndUpdate(d._id, { $set: { marksBefore: before, marksAfter: after } });
          running = after;
        }

        if (marks === undefined && (totalMarks !== undefined || manualMarks !== undefined)) {
          await User.findByIdAndUpdate(id, { $set: { marks: running } });
        }
      } catch {
        // Chain recalc is non-fatal
      }
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: await User.findById(id).select("-password"),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    // Soft-delete first: set deletedAt so any active JWT for this user returns 401
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { deletedAt: new Date(), isActive: false } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    // Hard-delete after marking
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(id, { isActive }, { new: true }).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: isActive ? "User activated successfully" : "User deactivated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: "Role is required" });
    }

    const allowedRoles = ["employee", "teamLeader", "superAdmin"];
    // legacy: accept "admin" and map to teamLeader
    const mappedRole = role === "admin" ? "teamLeader" : role;

    if (!allowedRoles.includes(mappedRole)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    // Only superAdmin can assign superAdmin role — enforced in middleware + double-check here
    if (mappedRole === "superAdmin" && req.user?.role !== "superAdmin") {
      return res.status(403).json({ success: false, message: "Only Super Admin can assign Super Admin role" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role: mappedRole },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User role updated successfully", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkDeleteUsers = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No user IDs provided" });
    }

    const result = await User.deleteMany({ _id: { $in: ids } });
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} users deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const [total, active, inactive, teamLeaders, superAdmins, employees] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ role: "teamLeader" }),
      User.countDocuments({ role: "superAdmin" }),
      User.countDocuments({ role: "employee" }),
    ]);
    res.status(200).json({
      success: true,
      stats: { total, active, inactive, teamLeaders, superAdmins, employees,
        // legacy alias
        admins: teamLeaders + superAdmins,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserMarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { marks, totalMarks, manualMarks } = req.body;

    if (marks === undefined && totalMarks === undefined && manualMarks === undefined) {
      return res.status(400).json({ success: false, message: "marks, totalMarks, or manualMarks is required" });
    }

    const updateFields = {};
    if (marks !== undefined) updateFields.marks = Number(marks);
    if (totalMarks !== undefined) updateFields.totalMarks = Number(totalMarks);
    if (manualMarks !== undefined) updateFields.manualMarks = Number(manualMarks);

    const user = await User.findByIdAndUpdate(id, updateFields, { new: true }).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    try {
      const ScoreDeduction = (await import('../models/ScoreDeduction.js')).default;
      const deductions = await ScoreDeduction.find({ userId: id }).sort({ date: 1, createdAt: 1 });
      const newBase = (user.totalMarks ?? 0) + (user.manualMarks ?? 0);
      let running = newBase;

      for (const d of deductions) {
        const before = parseFloat(running.toFixed(2));
        const after = Math.max(0, parseFloat((before - d.marksDeducted).toFixed(2)));
        await ScoreDeduction.findByIdAndUpdate(d._id, { $set: { marksBefore: before, marksAfter: after } });
        running = after;
      }

      if (marks === undefined) {
        await User.findByIdAndUpdate(id, { $set: { marks: running } });
        user.marks = running;
      }
    } catch {
      // Chain recalc is non-fatal
    }

    res.status(200).json({ success: true, message: "User marks updated successfully", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add manual bonus marks to a user — marks = totalMarks + manualMarks - deductions
export const addManualMarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { marksToAdd, reason, notes } = req.body;

    if (!marksToAdd || Number(marksToAdd) <= 0) {
      return res.status(400).json({ success: false, message: "marksToAdd must be a positive number" });
    }
    if (!reason) {
      return res.status(400).json({ success: false, message: "reason is required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const addAmount = parseFloat(Number(marksToAdd).toFixed(2));
    const newManualMarks = parseFloat(((user.manualMarks || 0) + addAmount).toFixed(2));
    const newMarks = parseFloat(((user.marks || 0) + addAmount).toFixed(2));

    await User.findByIdAndUpdate(id, {
      $set: {
        manualMarks: newManualMarks,
        marks: newMarks,
      },
    });

    const updatedUser = await User.findById(id).select("-password");

    res.status(200).json({
      success: true,
      message: `${addAmount} marks added to ${user.name}`,
      user: updatedUser,
      addedMarks: addAmount,
      reason,
      notes: notes || "",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Import previous record for a user — set totalMarks and marks directly from historical data
export const importPreviousRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalMarks, marks, manualMarks, notes } = req.body;

    if (totalMarks === undefined) {
      return res.status(400).json({ success: false, message: "totalMarks is required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const newTotalMarks = parseFloat(Number(totalMarks).toFixed(2));
    const newManualMarks = manualMarks !== undefined ? parseFloat(Number(manualMarks).toFixed(2)) : user.manualMarks || 0;
    const newMarks = marks !== undefined ? parseFloat(Number(marks).toFixed(2)) : newTotalMarks + newManualMarks;

    await User.findByIdAndUpdate(id, {
      $set: {
        totalMarks: newTotalMarks,
        manualMarks: newManualMarks,
        marks: newMarks,
      },
    });

    const updatedUser = await User.findById(id).select("-password");

    res.status(200).json({
      success: true,
      message: `Previous record imported for ${user.name}`,
      user: updatedUser,
      notes: notes || "",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const migrateUserMarks = async (req, res) => {
  try {
    const ScoreDeduction = (await import("../models/ScoreDeduction.js")).default;
    const users = await User.find({ marks: 0 });
    const updated = [];

    for (const user of users) {
      const aggResult = await ScoreDeduction.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, total: { $sum: "$marksDeducted" } } },
      ]);
      const alreadyDeducted = aggResult[0]?.total || 0;
      const totalBase = (user.totalMarks ?? 0) + (user.manualMarks ?? 0);
      const correctMarks = Math.max(0, totalBase - alreadyDeducted);

      await User.findByIdAndUpdate(user._id, { $set: { marks: correctMarks, totalMarks: user.totalMarks ?? 0 } });
      updated.push({ name: user.name, email: user.email, oldMarks: 0, newMarks: correctMarks, totalMarks: user.totalMarks ?? 0 });
    }

    res.status(200).json({
      success: true,
      message: `Migration complete. ${updated.length} users updated.`,
      results: { updated },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
