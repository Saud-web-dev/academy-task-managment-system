import Project from "../models/Project.js";

// ============================================
// GET TOP PERFORMER (Dashboard ke liye)
// ============================================
export const getTopPerformer = async (req, res) => {
  try {
    const projects = await Project.find();

    // Sab employees ke marks calculate karo
    const employeeStats = {};

    projects.forEach(project => {
      project.tasks.forEach(task => {
        if (task.user && task.obtainedMarks > 0) {
          const userId = task.user.toString();
          
          if (!employeeStats[userId]) {
            employeeStats[userId] = {
              userId: userId,
              totalMarks: 0,
              taskCount: 0,
              tasks: [],
            };
          }
          
          employeeStats[userId].totalMarks += task.obtainedMarks;
          employeeStats[userId].taskCount += 1;
          employeeStats[userId].tasks.push({
            taskName: task.name,
            marks: task.obtainedMarks,
            projectName: project.projectName,
          });
        }
      });
    });

    // Percentage calculate karo
    const employeesWithPercentage = Object.values(employeeStats).map(emp => ({
      ...emp,
      percentage: emp.taskCount > 0 ? ((emp.totalMarks / (emp.taskCount * 100)) * 100).toFixed(2) : 0,
    }));

    // Sort by total marks descending
    const sortedEmployees = employeesWithPercentage.sort((a, b) => b.totalMarks - a.totalMarks);

    const topPerformer = sortedEmployees[0] || null;

    if (!topPerformer) {
      return res.status(200).json({
        success: true,
        message: "No performance data found",
        topPerformer: null,
      });
    }

    // User details populate karo
    const populatedProjects = await Project.find()
      .populate({
        path: "tasks.user",
        model: "User",
        select: "name email role isActive",
      });

    let topUser = null;
    populatedProjects.forEach(project => {
      project.tasks.forEach(task => {
        if (task.user && task.user._id.toString() === topPerformer.userId) {
          topUser = task.user;
        }
      });
    });

    res.status(200).json({
      success: true,
      topPerformer: {
        ...topPerformer,
        user: topUser,
      },
    });
  } catch (error) {
    console.error("Get Top Performer Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// GET ALL EMPLOYEES RANKING (with pagination, filter, sort)
// ============================================
export const getAllEmployeesRanking = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      filterBy = 'marks', // 'marks' ya 'percentage'
      sortOrder = 'desc'  // 'asc' ya 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const projects = await Project.find()
      .populate({
        path: "tasks.user",
        model: "User",
        select: "name email role isActive",
      });

    // Sab employees ke stats calculate karo
    const employeeStats = {};

    projects.forEach(project => {
      project.tasks.forEach(task => {
        if (task.user && task.obtainedMarks >= 0) {
          const userId = task.user._id.toString();
          
          if (!employeeStats[userId]) {
            employeeStats[userId] = {
              userId: userId,
              user: task.user,
              totalMarks: 0,
              totalPossibleMarks: 0,
              taskCount: 0,
              completedTasks: 0,
            };
          }
          
          employeeStats[userId].totalMarks += task.obtainedMarks;
          employeeStats[userId].totalPossibleMarks += 100;
          employeeStats[userId].taskCount += 1;
          if (task.completed) {
            employeeStats[userId].completedTasks += 1;
          }
        }
      });
    });

    // Percentage add karo
    let employeesArray = Object.values(employeeStats).map(emp => ({
      ...emp,
      percentage: emp.totalPossibleMarks > 0 
        ? ((emp.totalMarks / emp.totalPossibleMarks) * 100).toFixed(2) 
        : 0,
    }));

    // Filter apply karo (marks ya percentage ke basis par)
    // Sorting apply karo
    employeesArray.sort((a, b) => {
      let valA, valB;
      
      if (filterBy === 'percentage') {
        valA = parseFloat(a.percentage);
        valB = parseFloat(b.percentage);
      } else {
        valA = a.totalMarks;
        valB = b.totalMarks;
      }

      if (sortOrder === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    });

    // Pagination
    const totalEmployees = employeesArray.length;
    const totalPages = Math.ceil(totalEmployees / limitNum);
    const paginatedEmployees = employeesArray.slice(skip, skip + limitNum);

    // Rank add karo
    const rankedEmployees = paginatedEmployees.map((emp, index) => ({
      rank: skip + index + 1,
      ...emp,
    }));

    res.status(200).json({
      success: true,
      data: rankedEmployees,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalEmployees,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      filters: {
        filterBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error("Get All Employees Ranking Error:", error);
    res.status(500).json({ message: error.message });
  }
};