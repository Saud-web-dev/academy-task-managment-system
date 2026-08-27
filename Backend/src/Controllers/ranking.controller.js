import Project from "../models/Project.js";
import User from "../models/Users.js";

// ============================================
// GET EMPLOYEE RANKINGS
// Uses user.marks (actual remaining marks after
// all deductions) — NOT task-based percentage
// ============================================
export const getEmployeeRankings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      filterBy = "marks",
      sortOrder = "desc",
      search = "",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get all employees with their actual marks from DB
    const employees = await User.find({ role: "employee" }).select("-password");

    // Get all projects to count tasks per user
    const projects = await Project.find().populate({
      path: "tasks.user",
      model: "User",
      select: "name email role isActive",
    });

    // Build task stats per user
    const taskStats = {};
    projects.forEach((project) => {
      (project.tasks || []).forEach((task) => {
        if (!task.user) return;
        const userId = (task.user._id || task.user).toString();
        if (!taskStats[userId]) {
          taskStats[userId] = { taskCount: 0, completedTasks: 0 };
        }
        taskStats[userId].taskCount += 1;
        if (task.completed) taskStats[userId].completedTasks += 1;
      });
    });

    // Build rankings using actual user.marks
    let rankings = employees.map((emp) => {
      const stats = taskStats[emp._id.toString()] || { taskCount: 0, completedTasks: 0 };
      const actualMarks = typeof emp.marks === "number" ? emp.marks : (emp.totalMarks ?? 0);
      const totalBase   = emp.totalMarks ?? 0;
      // percentage = remaining marks / total base marks
      const percentage  = totalBase > 0 ? parseFloat(((actualMarks / totalBase) * 100).toFixed(1)) : 0;

      return {
        userId: emp._id.toString(),
        user: {
          _id: emp._id,
          name: emp.name,
          email: emp.email,
          role: emp.role,
          isActive: emp.isActive,
        },
        marks: actualMarks,           // actual remaining marks
        totalMarks: totalBase,         // base / total marks
        percentage: percentage,        // % of marks remaining
        taskCount: stats.taskCount,
        completedTasks: stats.completedTasks,
      };
    });

    // Search filter
    if (search) {
      const s = search.toLowerCase();
      rankings = rankings.filter(
        (r) => r.user.name?.toLowerCase().includes(s) || r.user.email?.toLowerCase().includes(s)
      );
    }

    // Sort by actual marks or percentage
    const sortField = filterBy === "percentage" ? "percentage" : "marks";
    rankings.sort((a, b) =>
      sortOrder === "desc" ? b[sortField] - a[sortField] : a[sortField] - b[sortField]
    );

    // Add rank
    const rankedEmployees = rankings.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    const totalEmployees = rankedEmployees.length;
    const paginated = rankedEmployees.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalEmployees / parseInt(limit)),
        totalEmployees,
        limit: parseInt(limit),
        hasNextPage: skip + parseInt(limit) < totalEmployees,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET TOP PERFORMERS
// Uses user.marks — sorted by actual marks
// ============================================
export const getTopPerformers = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // Get employees with actual marks
    const employees = await User.find({ role: "employee", isActive: true }).select("-password");

    // Get task counts
    const projects = await Project.find().populate({
      path: "tasks.user",
      model: "User",
      select: "_id",
    });

    const taskStats = {};
    projects.forEach((project) => {
      (project.tasks || []).forEach((task) => {
        if (!task.user) return;
        const uid = (task.user._id || task.user).toString();
        if (!taskStats[uid]) taskStats[uid] = { taskCount: 0, completedTasks: 0 };
        taskStats[uid].taskCount += 1;
        if (task.completed) taskStats[uid].completedTasks += 1;
      });
    });

    const performers = employees
      .map((emp) => {
        const stats = taskStats[emp._id.toString()] || { taskCount: 0, completedTasks: 0 };
        const actualMarks = typeof emp.marks === "number" ? emp.marks : (emp.totalMarks ?? 0);
        const totalBase   = emp.totalMarks ?? 0;
        const percentage  = totalBase > 0 ? parseFloat(((actualMarks / totalBase) * 100).toFixed(1)) : 0;
        return {
          userId: emp._id.toString(),
          name: emp.name,
          email: emp.email,
          marks: actualMarks,
          totalMarks: totalBase,
          percentage,
          avgMarks: percentage,  // kept for backward-compat with frontend
          taskCount: stats.taskCount,
          completedTasks: stats.completedTasks,
        };
      })
      .sort((a, b) => b.marks - a.marks)
      .slice(0, parseInt(limit));

    res.status(200).json({ success: true, data: performers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET DEADLINE RANKINGS
// ============================================
export const getDeadlineRankings = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortOrder = "desc", search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.find().populate({
      path: "tasks.user",
      model: "User",
      select: "name email role isActive",
    });

    const today = new Date();
    const userDeadlineStats = {};

    projects.forEach((project) => {
      (project.tasks || []).forEach((task) => {
        if (!task.user) return;
        const userId = (task.user._id || task.user).toString();

        if (!userDeadlineStats[userId]) {
          userDeadlineStats[userId] = {
            userId,
            user: {
              _id: userId,
              name: task.user.name || "Unknown",
              email: task.user.email || "",
              role: task.user.role || "employee",
              isActive: task.user.isActive !== undefined ? task.user.isActive : true,
            },
            totalTasks: 0,
            completedTasks: 0,
            missedDeadlines: 0,
            onTimeTasks: 0,
            totalDaysOverdue: 0,
            tasksWithDeadline: 0,
          };
        }

        const stats = userDeadlineStats[userId];
        stats.totalTasks++;
        if (task.completed) stats.completedTasks++;

        const deadline = task.endDate ? new Date(task.endDate) : null;
        if (deadline) {
          stats.tasksWithDeadline++;
          if (deadline < today && !task.completed) {
            stats.missedDeadlines++;
            stats.totalDaysOverdue += Math.floor((today - deadline) / (1000 * 60 * 60 * 24));
          } else {
            stats.onTimeTasks++;
          }
        }
      });
    });

    let rankings = Object.values(userDeadlineStats)
      .filter((u) => u.missedDeadlines > 0)
      .map((u) => ({
        ...u,
        avgDaysOverdue: u.missedDeadlines > 0
          ? Math.round(u.totalDaysOverdue / u.missedDeadlines)
          : 0,
      }));

    if (search) {
      const s = search.toLowerCase();
      rankings = rankings.filter(
        (r) => r.user.name?.toLowerCase().includes(s) || r.user.email?.toLowerCase().includes(s)
      );
    }

    rankings.sort((a, b) =>
      sortOrder === "desc"
        ? b.missedDeadlines - a.missedDeadlines
        : a.missedDeadlines - b.missedDeadlines
    );

    const rankedEmployees = rankings.map((item, i) => ({ ...item, rank: i + 1 }));
    const totalEmployees = rankedEmployees.length;
    const paginated = rankedEmployees.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalEmployees / parseInt(limit)),
        totalEmployees,
        limit: parseInt(limit),
        hasNextPage: skip + parseInt(limit) < totalEmployees,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
