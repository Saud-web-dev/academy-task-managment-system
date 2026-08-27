// Backend/src/Controllers/attendance.controller.js
import Attendance from "../models/Attendance.js";
import User from "../models/Users.js";
import { 
  getSettingValue, 
  getAttendanceDeadline, 
  isAttendanceAllowed,
  getRemainingAttendanceTime 
} from "./setting.controller.js";

// ============================================
// HELPER: Format Deadline Time
// ============================================
const formatDeadlineTime = (time) => {
  try {
    if (!time) return '5:00 PM';
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return '5:00 PM';
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  } catch {
    return '5:00 PM';
  }
};

// ============================================
// IS WITHIN ATTENDANCE WINDOW
// ============================================
export const isWithinAttendanceWindow = async (requestTime) => {
  try {
    const timeWindow = await getSettingValue('attendanceTimeWindow', 15);
    const now = new Date();
    const requestDate = new Date(requestTime);
    const diffMinutes = (now - requestDate) / (1000 * 60);
    return diffMinutes <= timeWindow;
  } catch {
    return true;
  }
};

// ============================================
// CREATE ATTENDANCE WITH VALIDATION
// ============================================
export const createAttendanceWithValidation = async (req, res) => {
  try {
    const { employeeId, date, time, name, type, reason } = req.body;
    
    const existing = await Attendance.findOne({ employeeId, date: new Date(date) });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this date',
      });
    }
    
    const isValidTime = await isWithinAttendanceWindow(time || new Date());
    if (!isValidTime) {
      const timeWindow = await getSettingValue('attendanceTimeWindow', 15);
      return res.status(400).json({
        success: false,
        message: `Attendance must be marked within ${timeWindow} minutes of scheduled time`,
      });
    }
    
    const attendance = await Attendance.create({
      name: name || 'Unknown',
      employeeId,
      date: new Date(date),
      type: type || 'Present',
      reason: reason || '',
      status: 'Pending',
      editHistory: [],
    });
    
    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance,
    });
  } catch (error) {
    console.error('Attendance creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// CAN MARK ATTENDANCE (Dynamic Deadline) - FIXED
// ============================================
export const canMarkAttendance = async (req, res) => {
  try {
    const deadline = await getAttendanceDeadline();
    const isAllowed = await isAttendanceAllowed();
    const remaining = await getRemainingAttendanceTime();
    const formattedDeadline = formatDeadlineTime(deadline);
    
    res.json({
      success: true,
      canMark: isAllowed,
      message: isAllowed 
        ? `You can mark attendance until ${formattedDeadline}` 
        : `Attendance window is closed (after ${formattedDeadline})`,
      currentTime: new Date().toISOString(),
      deadline: formattedDeadline,
      rawDeadline: deadline,
      remainingTime: remaining,
      isPastDeadline: !isAllowed,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET TODAY'S STATUS
// ============================================
export const getTodayStatus = async (req, res) => {
  try {
    const { employeeId } = req.query;
    
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'employeeId is required' });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: today, $lt: tomorrow }
    });
    
    const isAllowed = await isAttendanceAllowed();
    const deadline = await getAttendanceDeadline();
    const formattedDeadline = formatDeadlineTime(deadline);
    const remaining = await getRemainingAttendanceTime();
    
    res.json({
      success: true,
      data: {
        hasMarked: !!attendance,
        status: attendance?.status || 'Not Marked',
        type: attendance?.type || null,
        isAfterDeadline: !isAllowed,
        canMark: isAllowed && !attendance,
        deadline: formattedDeadline,
        remainingTime: remaining,
        currentTime: new Date().toISOString(),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// CHECK IF EMPLOYEE CAN EDIT REQUEST
// ============================================
export const canEditRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.query;
    
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }
    
    if (attendance.employeeId.toString() !== employeeId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit this request"
      });
    }
    
    if (attendance.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Request is already approved or rejected, cannot edit"
      });
    }
    
    const createdAt = new Date(attendance.createdAt);
    const now = new Date();
    const diffMinutes = (now - createdAt) / (1000 * 60);
    const editWindow = await getSettingValue('attendanceEditWindow', 15);
    
    const canEdit = diffMinutes <= editWindow;
    
    res.json({
      success: true,
      data: {
        canEdit,
        remainingMinutes: canEdit ? Math.ceil(editWindow - diffMinutes) : 0,
        timeElapsed: Math.floor(diffMinutes),
        editWindow: editWindow,
        expired: !canEdit,
        createdAt: attendance.createdAt,
        currentTime: now,
      }
    });
  } catch (error) {
    console.error("Can Edit Request Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET EDIT HISTORY
// ============================================
export const getEditHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }
    
    res.json({
      success: true,
      data: {
        editHistory: attendance.editHistory || [],
        totalEdits: attendance.editHistory?.length || 0,
        canEdit: attendance.status === "Pending",
      }
    });
  } catch (error) {
    console.error("Get Edit History Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// CREATE ATTENDANCE REQUEST
// ============================================
export const createAttendanceRequest = async (req, res) => {
  try {
    const {
      name,
      employeeId,
      date,
      type,
      reason,
    } = req.body;

    const existing = await Attendance.findOne({
      employeeId,
      date: new Date(date),
    });

    if (existing) {
      return res.status(400).json({
        message: "Attendance already marked for this date",
      });
    }

    const isAllowed = await isAttendanceAllowed();
    if (!isAllowed) {
      const deadline = await getAttendanceDeadline();
      const formattedDeadline = formatDeadlineTime(deadline);
      return res.status(400).json({
        success: false,
        message: `Attendance cannot be marked after ${formattedDeadline}. You will be marked as absent.`,
        code: 'ATTENDANCE_CLOSED',
        deadline: formattedDeadline,
      });
    }

    const attendance = await Attendance.create({
      name,
      employeeId,
      date: new Date(date),
      type: type || "Present",
      reason: reason || "",
      status: "Pending",
      editHistory: [],
    });

    const editWindow = await getSettingValue('attendanceEditWindow', 15);
    const deadline = await getAttendanceDeadline();
    const formattedDeadline = formatDeadlineTime(deadline);
    const remaining = await getRemainingAttendanceTime();

    res.status(201).json({
      success: true,
      message: "Attendance request submitted successfully",
      data: attendance,
      editWindow: editWindow,
      editWindowMessage: `You can edit this request within ${editWindow} minutes`,
      deadline: formattedDeadline,
      remainingTime: remaining,
    });
  } catch (error) {
    console.error("Create Attendance Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// EDIT ATTENDANCE REQUEST
// ============================================
export const editAttendanceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, type, reason, employeeId } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    if (attendance.employeeId.toString() !== employeeId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit this request"
      });
    }

    if (attendance.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Request is already approved or rejected, cannot edit"
      });
    }

    const createdAt = new Date(attendance.createdAt);
    const now = new Date();
    const diffMinutes = (now - createdAt) / (1000 * 60);
    const editWindow = await getSettingValue('attendanceEditWindow', 15);

    if (diffMinutes > editWindow) {
      return res.status(400).json({
        success: false,
        message: `Edit window expired. You can only edit within ${editWindow} minutes of submission.`,
        timeElapsed: Math.floor(diffMinutes),
        editWindow: editWindow,
        expired: true,
      });
    }

    if (name) attendance.name = name;
    if (date) attendance.date = new Date(date);
    if (type) attendance.type = type;
    if (reason !== undefined) attendance.reason = reason;
    
    attendance.editHistory = attendance.editHistory || [];
    attendance.editHistory.push({
      editedAt: new Date(),
      previousValues: {
        name: attendance.name,
        date: attendance.date,
        type: attendance.type,
        reason: attendance.reason,
      },
      editedBy: employeeId,
    });

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Attendance record updated successfully",
      data: attendance,
      editWindowRemaining: Math.ceil(editWindow - diffMinutes),
    });
  } catch (error) {
    console.error("Edit Attendance Request Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// GET PENDING REQUESTS
// ============================================
export const getPendingRequests = async (req, res) => {
  try {
    const { page = 1, limit = 15, search } = req.query;

    const query = { status: "Pending" };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [data, total] = await Promise.all([
      Attendance.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(query),
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
    console.error("Get Pending Requests Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// GET ALL REQUESTS
// ============================================
export const getAllRequests = async (req, res) => {
  try {
    const { page = 1, limit = 15, status, type, startDate, endDate, search } = req.query;

    const query = {};
    
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [data, total] = await Promise.all([
      Attendance.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(query),
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
    console.error("Get All Requests Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// GET EMPLOYEE REQUESTS
// ============================================
export const getEmployeeRequests = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const { page = 1, limit = 10, startDate, endDate, status, type } = req.query;

    if (!employeeId) {
      return res.status(400).json({ message: "employeeId is required" });
    }

    const query = { employeeId };
    
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [data, total] = await Promise.all([
      Attendance.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(query),
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
    console.error("Get Employee Requests Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// HANDLE ATTENDANCE ACTION
// ============================================
export const handleAttendanceAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    attendance.status = status;
    attendance.adminRemarks = adminRemarks || attendance.adminRemarks;
    attendance.processedAt = new Date();
    attendance.processedBy = req.user?._id;

    await attendance.save();

    res.status(200).json({
      success: true,
      message: `Attendance ${status} successfully`,
      data: attendance,
    });
  } catch (error) {
    console.error("Handle Attendance Action Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// DELETE REQUEST
// ============================================
export const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attendance = await Attendance.findByIdAndDelete(id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully",
    });
  } catch (error) {
    console.error("Delete Request Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// GET ATTENDANCE BY DATE RANGE
// ============================================
export const getAttendanceByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }

    const query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const data = await Attendance.find(query).sort({ date: 1 });

    res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error("Get Attendance By Date Range Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// GET ATTENDANCE STATS
// ============================================
export const getAttendanceStats = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    const query = {};
    if (employeeId) query.employeeId = employeeId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const [total, approved, rejected, pending] = await Promise.all([
      Attendance.countDocuments(query),
      Attendance.countDocuments({ ...query, status: "Approved" }),
      Attendance.countDocuments({ ...query, status: "Rejected" }),
      Attendance.countDocuments({ ...query, status: "Pending" }),
    ]);

    const present = await Attendance.countDocuments({ ...query, type: "Present" });
    const leave = await Attendance.countDocuments({ ...query, type: "Leave" });
    const halfDay = await Attendance.countDocuments({ ...query, type: "Half Day" });

    res.status(200).json({
      success: true,
      data: {
        total,
        approved,
        rejected,
        pending,
        present,
        leave,
        halfDay,
      },
    });
  } catch (error) {
    console.error("Get Attendance Stats Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// AUTO MARK ABSENT
// ============================================
export const autoMarkAbsent = async () => {
  try {
    const isAutoMarkEnabled = await getSettingValue('autoMarkAbsent', false);
    if (!isAutoMarkEnabled) {
      console.log('⏰ Auto-mark absent is disabled in settings');
      return { success: true, message: 'Auto-mark absent is disabled', absentCount: 0 };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isAllowed = await isAttendanceAllowed();
    if (isAllowed) {
      const deadline = await getAttendanceDeadline();
      const formattedDeadline = formatDeadlineTime(deadline);
      console.log(`⏰ Auto-mark absent will run after ${formattedDeadline}. Current time: ${new Date().toLocaleTimeString()}`);
      return { 
        success: true, 
        message: `Auto-mark absent will run after ${formattedDeadline}. Current time: ${new Date().toLocaleTimeString()}`,
        absentCount: 0 
      };
    }
    
    console.log(`📅 Running auto-mark absent for: ${today.toDateString()} at ${new Date().toLocaleTimeString()}`);
    
    const allEmployees = await User.find({ isActive: true });
    console.log(`👥 Total active employees: ${allEmployees.length}`);
    
    const todayAttendances = await Attendance.find({ 
      date: { 
        $gte: today, 
        $lt: tomorrow 
      },
      type: 'Present'
    });
    
    const markedEmployeeIds = todayAttendances.map(a => a.employeeId.toString());
    console.log(`✅ Employees who marked present today: ${markedEmployeeIds.length}`);
    
    let absentCount = 0;
    const absentEmployees = [];
    
    for (const employee of allEmployees) {
      const employeeIdStr = employee._id.toString();
      
      if (!markedEmployeeIds.includes(employeeIdStr)) {
        try {
          const existingAbsent = await Attendance.findOne({
            employeeId: employee._id,
            date: { $gte: today, $lt: tomorrow },
            status: 'Absent'
          });
          
          if (existingAbsent) {
            console.log(`⚠️ ${employee.name} already marked absent`);
            continue;
          }
          
          const deadline = await getAttendanceDeadline();
          const formattedDeadline = formatDeadlineTime(deadline);
          const attendance = new Attendance({
            name: employee.name,
            employeeId: employee._id,
            date: today,
            type: 'Present',
            status: 'Absent',
            reason: `Auto-marked absent - No attendance marked before ${formattedDeadline}`,
            markedBy: 'system',
          });
          
          await attendance.save();
          absentCount++;
          absentEmployees.push(employee.name);
          console.log(`✅ Auto-marked absent: ${employee.name} (No attendance before ${formattedDeadline})`);
        } catch (createError) {
          console.error(`❌ Failed to mark absent for ${employee.name}:`, createError.message);
        }
      }
    }
    
    console.log(`✅ Auto-mark absent completed at ${new Date().toLocaleTimeString()}. ${absentCount} employees marked absent.`);
    if (absentEmployees.length > 0) {
      console.log(`📋 Absent employees: ${absentEmployees.join(', ')}`);
    }
    
    return { 
      success: true, 
      message: `Auto-mark absent completed. ${absentCount} employees marked absent.`,
      absentCount,
      absentEmployees,
      time: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Auto-mark absent error:', error);
    return { success: false, error: error.message };
  }
};
