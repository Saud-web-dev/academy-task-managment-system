import DailyUpdate from '../models/DailyUpdate.js';
import User from '../models/Users.js';
import ScoreDeduction from '../models/ScoreDeduction.js';

// ============================================
// HELPER: Normalize date to start of day (PKT)
// ============================================
const normalizeDate = (dateInput) => {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ============================================
// EMPLOYEE: Submit daily update
// ============================================
export const submitDailyUpdate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, updateText, tasksWorkedOn, hoursWorked } = req.body;

    if (!updateText || updateText.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Update text must be at least 10 characters',
      });
    }

    const user = await User.findById(userId).select('-password');
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });

    const updateDate = date ? normalizeDate(date) : normalizeDate(new Date());

    // Check duplicate
    const existing = await DailyUpdate.findOne({ userId, date: updateDate });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a daily update for this date',
      });
    }

    const update = await DailyUpdate.create({
      userId,
      userName: user.name,
      date: updateDate,
      updateText: updateText.trim(),
      tasksWorkedOn: tasksWorkedOn || [],
      hoursWorked: hoursWorked || 0,
      status: 'submitted',
    });

    res.status(201).json({
      success: true,
      message: 'Daily update submitted successfully',
      data: update,
    });
  } catch (error) {
    console.error('Submit daily update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// EMPLOYEE: Get my daily updates
// ============================================
export const getMyDailyUpdates = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const query = { userId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = normalizeDate(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      DailyUpdate.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      DailyUpdate.countDocuments(query),
    ]);

    // Check if today's update is submitted
    const todayDate = normalizeDate(new Date());
    const todayUpdate = await DailyUpdate.findOne({ userId, date: todayDate });

    res.status(200).json({
      success: true,
      data,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      todaySubmitted: !!todayUpdate,
      todayUpdate: todayUpdate || null,
    });
  } catch (error) {
    console.error('Get my daily updates error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// EMPLOYEE: Edit today's update (if same day)
// ============================================
export const editDailyUpdate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { updateText, tasksWorkedOn, hoursWorked } = req.body;

    const update = await DailyUpdate.findById(id);
    if (!update)
      return res
        .status(404)
        .json({ success: false, message: 'Update not found' });

    if (update.userId.toString() !== userId)
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized' });

    // Only allow editing same-day updates
    const today = normalizeDate(new Date());
    const updateDay = normalizeDate(update.date);
    if (today.getTime() !== updateDay.getTime()) {
      return res.status(400).json({
        success: false,
        message: "You can only edit today's update",
      });
    }

    if (updateText) update.updateText = updateText.trim();
    if (tasksWorkedOn) update.tasksWorkedOn = tasksWorkedOn;
    if (hoursWorked !== undefined) update.hoursWorked = hoursWorked;

    await update.save();

    res.status(200).json({
      success: true,
      message: 'Daily update edited successfully',
      data: update,
    });
  } catch (error) {
    console.error('Edit daily update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ADMIN: Get all daily updates (all users)
// ============================================
export const getAllDailyUpdates = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      startDate,
      endDate,
      status,
      search,
    } = req.query;

    const query = {};
    if (userId) query.userId = userId;
    if (status && status !== 'all') query.status = status;
    if (search) query.userName = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = normalizeDate(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      DailyUpdate.find(query)
        .populate('userId', 'name email marks')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      DailyUpdate.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Get all daily updates error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ADMIN: Check who missed daily update on a date
// Returns list of users who did NOT submit
// ============================================
export const checkMissingUpdates = async (req, res) => {
  try {
    const { date } = req.query;
    const checkDate = date ? normalizeDate(date) : normalizeDate(new Date());

    // All active employees
    const allEmployees = await User.find({
      role: 'employee',
      isActive: true,
    }).select('_id name email marks');

    // Who submitted on this date
    const submitted = await DailyUpdate.find({
      date: checkDate,
      status: 'submitted',
    }).select('userId');
    const submittedIds = new Set(submitted.map((u) => u.userId.toString()));

    const missing = allEmployees.filter(
      (e) => !submittedIds.has(e._id.toString())
    );
    const present = allEmployees.filter((e) =>
      submittedIds.has(e._id.toString())
    );

    // Check which missing ones already have a penalty for this date
    const penaltiesApplied = await ScoreDeduction.find({
      userId: { $in: missing.map((e) => e._id) },
      deductionType: 'daily_update_miss',
      date: {
        $gte: checkDate,
        $lt: new Date(checkDate.getTime() + 86400000),
      },
    }).select('userId');
    const penaltyIds = new Set(
      penaltiesApplied.map((p) => p.userId.toString())
    );

    const missingWithStatus = missing.map((e) => ({
      ...e.toObject(),
      penaltyAlreadyApplied: penaltyIds.has(e._id.toString()),
    }));

    res.status(200).json({
      success: true,
      date: checkDate,
      missing: missingWithStatus,
      present: present.map((e) => e.toObject()),
      missingCount: missing.length,
      presentCount: present.length,
      totalEmployees: allEmployees.length,
    });
  } catch (error) {
    console.error('Check missing updates error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ADMIN: Bulk apply daily update miss penalty
// ============================================
export const bulkApplyMissPenalty = async (req, res) => {
  try {
    const { date, userIds, customCut } = req.body;

    if (!date || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'date and userIds array are required',
      });
    }

    const { getSettingValue } = await import('./setting.controller.js');
    const missCut = customCut
      ? Number(customCut)
      : await getSettingValue('dailyUpdateMissCut', 2);

    const checkDate = normalizeDate(date);
    const results = { success: [], failed: [], skipped: [] };

    for (const uid of userIds) {
      try {
        const user = await User.findById(uid).select('-password');
        if (!user) {
          results.failed.push({ uid, reason: 'User not found' });
          continue;
        }

        // Check if penalty already applied
        const existing = await ScoreDeduction.findOne({
          userId: uid,
          deductionType: 'daily_update_miss',
          date: {
            $gte: checkDate,
            $lt: new Date(checkDate.getTime() + 86400000),
          },
        });
        if (existing) {
          results.skipped.push({
            uid,
            name: user.name,
            reason: 'Penalty already applied',
          });
          continue;
        }

        const marksBefore = user.marks || 0;
        const marksAfter = Math.max(0, marksBefore - missCut);
        user.marks = marksAfter;
        await user.save();

        await ScoreDeduction.create({
          userId: uid,
          userName: user.name,
          deductionType: 'daily_update_miss',
          marksDeducted: missCut,
          marksBefore,
          marksAfter,
          reason: `Daily update not submitted for ${checkDate.toLocaleDateString('en-PK')}`,
          autoReason: `Daily update missed: ${missCut} marks deducted`,
          date: checkDate,
          appliedBy: 'admin',
          appliedByUserId: req.user?.id || null,
        });

        // Mark missed update record
        await DailyUpdate.findOneAndUpdate(
          { userId: uid, date: checkDate },
          {
            userId: uid,
            userName: user.name,
            date: checkDate,
            updateText: 'MISSED',
            status: 'missed',
            penaltyApplied: true,
            penaltyMarks: missCut,
          },
          { upsert: true, new: true }
        );

        results.success.push({ uid, name: user.name, marksAfter });
      } catch (err) {
        results.failed.push({ uid, reason: err.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk miss penalty applied. ${results.success.length} applied, ${results.skipped.length} skipped, ${results.failed.length} failed.`,
      results,
    });
  } catch (error) {
    console.error('Bulk apply miss penalty error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ADMIN: Add remarks to a daily update
// ============================================
export const addAdminRemarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminRemarks } = req.body;

    const update = await DailyUpdate.findByIdAndUpdate(
      id,
      { adminRemarks },
      { new: true }
    );
    if (!update)
      return res
        .status(404)
        .json({ success: false, message: 'Update not found' });

    res.status(200).json({
      success: true,
      message: 'Remarks added successfully',
      data: update,
    });
  } catch (error) {
    console.error('Add admin remarks error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ADMIN: Get full data export (all users)
// Tasks + Daily Updates + Deductions per user
// ============================================
export const getFullDataExport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const employees = await User.find({ role: 'employee' }).select('-password');

    const Project = (await import('../models/Project.js')).default;
    const projects = await Project.find({}).select(
      'projectName description status startDate endDate tasks'
    );

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = normalizeDate(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.date.$lte = end;
      }
    }

    const exportData = [];

    for (const emp of employees) {
      const empId = emp._id;

      // Tasks assigned to this employee
      const assignedTasks = [];
      for (const proj of projects) {
        for (const task of proj.tasks || []) {
          const isAssigned =
            task.user?.toString() === empId.toString() ||
            (task.users || []).some((u) => u.toString() === empId.toString());
          if (isAssigned) {
            assignedTasks.push({
              projectName: proj.projectName,
              taskName: task.name,
              description: task.description,
              status: task.status,
              obtainedMarks: task.obtainedMarks,
              startDate: task.startDate,
              endDate: task.endDate,
              completed: task.completed,
              tested: task.tested,
            });
          }
        }
      }

      // Daily updates
      const updates = await DailyUpdate.find({
        userId: empId,
        ...dateFilter,
      }).sort({ date: -1 });

      // Score deductions
      const deductions = await ScoreDeduction.find({
        userId: empId,
        ...dateFilter,
      }).sort({ date: -1 });

      const missedDeadlines = assignedTasks.reduce((sum, task) => {
        const deadline = task.endDate ? new Date(task.endDate) : null;
        return (
          sum + (deadline && deadline < new Date() && !task.completed ? 1 : 0)
        );
      }, 0);

      exportData.push({
        employee: {
          _id: emp._id,
          name: emp.name,
          email: emp.email,
          marks: emp.marks,
          isActive: emp.isActive,
          joinedAt: emp.createdAt,
        },
        summary: {
          totalTasks: assignedTasks.length,
          completedTasks: assignedTasks.filter((t) => t.completed).length,
          totalDailyUpdates: updates.filter((u) => u.status === 'submitted')
            .length,
          missedUpdates: updates.filter((u) => u.status === 'missed').length,
          missedDeadlines,
          totalDeductions: deductions.reduce((s, d) => s + d.marksDeducted, 0),
          currentMarks: emp.marks,
        },
        tasks: assignedTasks,
        dailyUpdates: updates,
        deductions,
      });
    }

    res.status(200).json({
      success: true,
      exportedAt: new Date().toISOString(),
      totalEmployees: exportData.length,
      data: exportData,
    });
  } catch (error) {
    console.error('Get full data export error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
