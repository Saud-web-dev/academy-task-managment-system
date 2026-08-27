import ScoreDeduction from '../models/ScoreDeduction.js';
import User from '../models/Users.js';
import { syncAssignedTaskMarks } from '../utility/userMarks.utility.js';
import { sendPushToUsers } from './notification.controller.js';

const notifyMarkDeduction = async (userId, deductionType, marksDeducted, reason) => {
  try {
    const typeMessages = {
      'late_arrival': '⏰ Late Arrival - Marks Deducted',
      'absent': '😔 Absent - Marks Deducted',
      'daily_update_miss': '📝 Daily Update Missed - Marks Deducted',
      'manual': '📊 Manual Deduction - Marks Deducted',
      'deadline_miss': '⏳ Deadline Missed - Marks Deducted',
    };
    const title = typeMessages[deductionType] || 'Marks Deducted';
    const payload = {
      title,
      body: `${marksDeducted} marks have been deducted. Reason: ${reason}`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'marks-deduction',
      timestamp: Date.now(),
      url: '/layout/profile',
    };
    await sendPushToUsers([userId], payload);
  } catch (error) {
    console.warn('Failed to send mark deduction notification:', error.message);
  }
};

const applyDeductionToUser = async (userId, marksToDeduct) => {
  await syncAssignedTaskMarks([userId]);
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const totalBase = (user.totalMarks ?? 0) + (user.manualMarks ?? 0);
  let currentMarks = user.marks;

  const existingDeductionsSum = await ScoreDeduction.aggregate([
    { $match: { userId: user._id } },
    { $group: { _id: null, total: { $sum: '$marksDeducted' } } },
  ]);
  const alreadyDeducted = existingDeductionsSum[0]?.total || 0;

  if (currentMarks === 0 || currentMarks === null || currentMarks === undefined) {
    currentMarks = Math.max(0, totalBase - alreadyDeducted);
    await User.findByIdAndUpdate(userId, { $set: { marks: currentMarks } });
  } else if (currentMarks === totalBase && alreadyDeducted > 0) {
    currentMarks = Math.max(0, totalBase - alreadyDeducted);
    await User.findByIdAndUpdate(userId, { $set: { marks: currentMarks } });
  } else if (currentMarks > totalBase) {
    currentMarks = totalBase;
    await User.findByIdAndUpdate(userId, { $set: { marks: currentMarks } });
  }

  const marksBefore = parseFloat(currentMarks.toFixed(2));
  const marksAfter = Math.max(0, parseFloat((marksBefore - marksToDeduct).toFixed(2)));

  await User.findByIdAndUpdate(userId, { $set: { marks: marksAfter } });

  return { marksBefore, marksAfter };
};

export const getAttendanceMarkSettings = async (req, res) => {
  try {
    const { getSettingValue } = await import('./setting.controller.js');

    const settings = {
      totalHoursPerDay: await getSettingValue('totalHoursPerDay', 8),
      lateArrivalCutPerMinute: await getSettingValue('lateArrivalCutPerMinute', 0.5),
      absentMarksCut: await getSettingValue('absentMarksCut', 5),
      dailyUpdateMissCut: await getSettingValue('dailyUpdateMissCut', 2),
      halfDayCut: await getSettingValue('halfDayCut', 3),
      workStartTime: await getSettingValue('workStartTime', '09:00'),
      deadlineMissCut: await getSettingValue('deadlineMissCut', 5),
    };

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAttendanceMarkSettings = async (req, res) => {
  try {
    const {
      totalHoursPerDay,
      lateArrivalCutPerMinute,
      absentMarksCut,
      dailyUpdateMissCut,
      halfDayCut,
      workStartTime,
      deadlineMissCut,
    } = req.body;

    const updates = [];
    if (totalHoursPerDay !== undefined) updates.push({ key: 'totalHoursPerDay', value: Number(totalHoursPerDay) });
    if (lateArrivalCutPerMinute !== undefined) updates.push({ key: 'lateArrivalCutPerMinute', value: Number(lateArrivalCutPerMinute) });
    if (absentMarksCut !== undefined) updates.push({ key: 'absentMarksCut', value: Number(absentMarksCut) });
    if (dailyUpdateMissCut !== undefined) updates.push({ key: 'dailyUpdateMissCut', value: Number(dailyUpdateMissCut) });
    if (halfDayCut !== undefined) updates.push({ key: 'halfDayCut', value: Number(halfDayCut) });
    if (workStartTime !== undefined) updates.push({ key: 'workStartTime', value: workStartTime });
    if (deadlineMissCut !== undefined) updates.push({ key: 'deadlineMissCut', value: Number(deadlineMissCut) });

    const Setting = (await import('../models/Setting.js')).default;
    for (const upd of updates) {
      await Setting.findOneAndUpdate(
        { key: upd.key },
        { key: upd.key, value: upd.value },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({ success: true, message: 'Attendance mark settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignLateArrivalDeduction = async (req, res) => {
  try {
    const { userId, date, arrivalTime, expectedTime, lateByMinutes, customCutPerMinute, notes } = req.body;

    if (!userId || !date || !arrivalTime) {
      return res.status(400).json({ success: false, message: 'userId, date and arrivalTime are required' });
    }

    const { getSettingValue } = await import('./setting.controller.js');
    const cutPerMinute = customCutPerMinute
      ? Number(customCutPerMinute)
      : await getSettingValue('lateArrivalCutPerMinute', 0.5);

    const late = lateByMinutes || 0;
    const marksToDeduct = parseFloat((late * cutPerMinute).toFixed(2));

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { marksBefore, marksAfter } = await applyDeductionToUser(userId, marksToDeduct);
    const expectedTimeStr = expectedTime || (await getSettingValue('workStartTime', '09:00'));

    const deduction = await ScoreDeduction.create({
      userId,
      userName: user.name,
      deductionType: 'late_arrival',
      marksDeducted: marksToDeduct,
      marksBefore,
      marksAfter,
      reason: `Late arrival: arrived at ${arrivalTime}, expected ${expectedTimeStr}. Late by ${late} minutes.`,
      autoReason: `Late by ${late} minutes × ${cutPerMinute} marks/min = ${marksToDeduct} marks deducted`,
      date: new Date(date),
      attendanceDetails: {
        arrivalTime,
        expectedTime: expectedTimeStr,
        lateByMinutes: late,
        hoursWorked: req.body.hoursWorked || 0,
        totalHoursRequired: await getSettingValue('totalHoursPerDay', 8),
      },
      appliedBy: 'admin',
      appliedByUserId: req.user?.id || null,
      notes: notes || '',
    });

    await notifyMarkDeduction(userId, 'late_arrival', marksToDeduct, `Late by ${late} minutes`);

    res.status(201).json({
      success: true,
      message: `Late arrival deduction applied: ${marksToDeduct} marks cut from ${user.name}`,
      data: deduction,
      user: { _id: user._id, name: user.name, marksAfter },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignAbsentDeduction = async (req, res) => {
  try {
    const { userId, date, customCut, notes } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ success: false, message: 'userId and date are required' });
    }

    const { getSettingValue } = await import('./setting.controller.js');
    const absentCut = customCut ? Number(customCut) : await getSettingValue('absentMarksCut', 5);

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    const existing = await ScoreDeduction.findOne({
      userId,
      deductionType: 'absent',
      date: { $gte: dateObj, $lt: new Date(dateObj.getTime() + 86400000) },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Absent deduction already applied for this date' });
    }

    const { marksBefore, marksAfter } = await applyDeductionToUser(userId, absentCut);

    const deduction = await ScoreDeduction.create({
      userId,
      userName: user.name,
      deductionType: 'absent',
      marksDeducted: absentCut,
      marksBefore,
      marksAfter,
      reason: `Absent on ${new Date(date).toLocaleDateString('en-PK')}`,
      autoReason: `Absent: ${absentCut} marks deducted`,
      date: new Date(date),
      appliedBy: 'admin',
      appliedByUserId: req.user?.id || null,
      notes: notes || '',
    });

    await notifyMarkDeduction(userId, 'absent', absentCut, `Absent on ${new Date(date).toLocaleDateString('en-PK')}`);

    res.status(201).json({
      success: true,
      message: `Absent deduction applied: ${absentCut} marks cut from ${user.name}`,
      data: deduction,
      user: { _id: user._id, name: user.name, marksAfter },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignDailyUpdateMissDeduction = async (req, res) => {
  try {
    const { userId, date, customCut, notes } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ success: false, message: 'userId and date are required' });
    }

    const { getSettingValue } = await import('./setting.controller.js');
    const missCut = customCut ? Number(customCut) : await getSettingValue('dailyUpdateMissCut', 2);

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    const existing = await ScoreDeduction.findOne({
      userId,
      deductionType: 'daily_update_miss',
      date: { $gte: dateObj, $lt: new Date(dateObj.getTime() + 86400000) },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Daily update miss deduction already applied for this date' });
    }

    const { marksBefore, marksAfter } = await applyDeductionToUser(userId, missCut);

    const deduction = await ScoreDeduction.create({
      userId,
      userName: user.name,
      deductionType: 'daily_update_miss',
      marksDeducted: missCut,
      marksBefore,
      marksAfter,
      reason: `Daily update not submitted for ${new Date(date).toLocaleDateString('en-PK')}`,
      autoReason: `Daily update missed: ${missCut} marks deducted`,
      date: new Date(date),
      appliedBy: 'admin',
      appliedByUserId: req.user?.id || null,
      notes: notes || '',
    });

    await notifyMarkDeduction(userId, 'daily_update_miss', missCut, 'Daily update missed');

    res.status(201).json({
      success: true,
      message: `Daily update miss deduction applied: ${missCut} marks cut from ${user.name}`,
      data: deduction,
      user: { _id: user._id, name: user.name, marksAfter },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignManualDeduction = async (req, res) => {
  try {
    const { userId, date, marksToDeduct, reason, notes } = req.body;

    if (!userId || !date || !marksToDeduct || !reason) {
      return res.status(400).json({ success: false, message: 'userId, date, marksToDeduct and reason are required' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const cut = Math.max(0, Number(marksToDeduct));
    const { marksBefore, marksAfter } = await applyDeductionToUser(userId, cut);

    const deduction = await ScoreDeduction.create({
      userId,
      userName: user.name,
      deductionType: 'manual',
      marksDeducted: cut,
      marksBefore,
      marksAfter,
      reason,
      autoReason: '',
      date: new Date(date),
      appliedBy: 'admin',
      appliedByUserId: req.user?.id || null,
      notes: notes || '',
    });

    await notifyMarkDeduction(userId, 'manual', cut, reason);

    res.status(201).json({
      success: true,
      message: `Manual deduction applied: ${cut} marks cut from ${user.name}`,
      data: deduction,
      user: { _id: user._id, name: user.name, marksAfter },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkApplyAbsentDeductions = async (req, res) => {
  try {
    const { date, userIds, customCut } = req.body;

    if (!date || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'date and userIds array are required' });
    }

    const { getSettingValue } = await import('./setting.controller.js');
    const absentCut = customCut ? Number(customCut) : await getSettingValue('absentMarksCut', 5);

    const results = { success: [], failed: [], skipped: [] };

    for (const uid of userIds) {
      try {
        const user = await User.findById(uid).select('-password');
        if (!user) { results.failed.push({ uid, reason: 'User not found' }); continue; }

        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);
        const existing = await ScoreDeduction.findOne({
          userId: uid,
          deductionType: 'absent',
          date: { $gte: dateObj, $lt: new Date(dateObj.getTime() + 86400000) },
        });
        if (existing) { results.skipped.push({ uid, name: user.name, reason: 'Already applied' }); continue; }

        const { marksBefore, marksAfter } = await applyDeductionToUser(uid, absentCut);
        await ScoreDeduction.create({
          userId: uid,
          userName: user.name,
          deductionType: 'absent',
          marksDeducted: absentCut,
          marksBefore,
          marksAfter,
          reason: `Absent on ${new Date(date).toLocaleDateString('en-PK')}`,
          autoReason: `Absent: ${absentCut} marks deducted`,
          date: new Date(date),
          appliedBy: 'admin',
          appliedByUserId: req.user?.id || null,
        });
        results.success.push({ uid, name: user.name, marksAfter });
      } catch (err) {
        results.failed.push({ uid, reason: err.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk absent deduction complete. ${results.success.length} applied, ${results.skipped.length} skipped, ${results.failed.length} failed.`,
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllDeductions = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, deductionType, startDate, endDate, search } = req.query;

    const query = {};
    if (userId) query.userId = userId;
    if (deductionType && deductionType !== 'all') query.deductionType = deductionType;
    if (search) query.userName = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      ScoreDeduction.find(query)
        .populate('userId', 'name email marks')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ScoreDeduction.countDocuments(query),
    ]);

    const totalDeducted = data.reduce((s, d) => s + d.marksDeducted, 0);

    res.status(200).json({
      success: true,
      data,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalDeducted: parseFloat(totalDeducted.toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserDeductions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, startDate, endDate, deductionType } = req.query;

    const query = { userId };
    if (deductionType && deductionType !== 'all') query.deductionType = deductionType;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      ScoreDeduction.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      ScoreDeduction.countDocuments(query),
    ]);

    const user = await User.findById(userId).select('name email marks totalMarks manualMarks');
    const totalDeducted = await ScoreDeduction.aggregate([
      { $match: { userId: user?._id } },
      { $group: { _id: null, total: { $sum: '$marksDeducted' } } },
    ]);

    res.status(200).json({
      success: true,
      data,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      user,
      totalDeducted: totalDeducted[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyDeductions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, startDate, endDate, deductionType } = req.query;

    const query = { userId };
    if (deductionType && deductionType !== 'all') query.deductionType = deductionType;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      ScoreDeduction.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      ScoreDeduction.countDocuments(query),
    ]);

    const user = await User.findById(userId).select('name email marks totalMarks manualMarks');
    const aggResult = await ScoreDeduction.aggregate([
      { $match: { userId: user?._id } },
      { $group: { _id: null, total: { $sum: '$marksDeducted' } } },
    ]);

    res.status(200).json({
      success: true,
      data,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      user,
      totalDeducted: aggResult[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDeduction = async (req, res) => {
  try {
    const { id } = req.params;
    const deduction = await ScoreDeduction.findById(id);
    if (!deduction) return res.status(404).json({ success: false, message: 'Deduction not found' });

    const user = await User.findById(deduction.userId);
    if (user) {
      const cap = (user.totalMarks ?? 0) + (user.manualMarks ?? 0);
      const restored = Math.min(cap, (user.marks || 0) + deduction.marksDeducted);
      await User.findByIdAndUpdate(deduction.userId, { $set: { marks: restored } });
    }

    await ScoreDeduction.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `Deduction deleted and ${deduction.marksDeducted} marks restored to ${deduction.userName}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDeductionSummaryAllUsers = async (req, res) => {
  try {
    const summary = await ScoreDeduction.aggregate([
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          totalDeducted: { $sum: '$marksDeducted' },
          lateArrivals: { $sum: { $cond: [{ $eq: ['$deductionType', 'late_arrival'] }, 1, 0] } },
          absents: { $sum: { $cond: [{ $eq: ['$deductionType', 'absent'] }, 1, 0] } },
          dailyUpdateMisses: { $sum: { $cond: [{ $eq: ['$deductionType', 'daily_update_miss'] }, 1, 0] } },
          deadlineMisses: { $sum: { $cond: [{ $eq: ['$deductionType', 'deadline_missed'] }, 1, 0] } },
          manualCuts: { $sum: { $cond: [{ $eq: ['$deductionType', 'manual'] }, 1, 0] } },
          lastDeduction: { $max: '$date' },
        },
      },
      { $sort: { totalDeducted: -1 } },
    ]);

    const userIds = summary.map((s) => s._id);
    const users = await User.find({ _id: { $in: userIds } }).select('name email marks totalMarks manualMarks');
    const userMap = {};
    users.forEach((u) => (userMap[u._id.toString()] = u));

    const enriched = summary.map((s) => ({
      ...s,
      currentMarks: userMap[s._id?.toString()]?.marks || 0,
      email: userMap[s._id?.toString()]?.email || '',
    }));

    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const detectLateArrivals = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'date is required (YYYY-MM-DD)' });
    }

    const { getSettingValue } = await import('./setting.controller.js');
    const globalWorkStartTime = await getSettingValue('workStartTime', '09:00');
    const cutPerMinute = await getSettingValue('lateArrivalCutPerMinute', 0.5);

    const Attendance = (await import('../models/Attendance.js')).default;
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $ne: 'Absent' },
    });

    if (records.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No attendance records found for this date',
        data: [],
        globalWorkStartTime,
        cutPerMinute,
      });
    }

    const userIds = records.map((r) => r.employeeId);
    const users = await User.find({ _id: { $in: userIds } }).select('name email marks workStartTime totalMarks manualMarks');
    const userMap = {};
    users.forEach((u) => (userMap[u._id.toString()] = u));

    const existingDeductions = await ScoreDeduction.find({
      userId: { $in: userIds },
      deductionType: 'late_arrival',
      date: { $gte: dayStart, $lte: dayEnd },
    }).select('userId');
    const alreadyDeductedIds = new Set(existingDeductions.map((d) => d.userId.toString()));

    const results = [];

    for (const record of records) {
      const arrivalDate = new Date(record.createdAt);

      const pkTimeStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(arrivalDate);

      const [arrH, arrM] = pkTimeStr.split(':').map(Number);
      const arrivalMinutes = arrH * 60 + arrM;

      const userId = record.employeeId?.toString();
      const user = userMap[userId];

      const effectiveStartTime =
        user?.workStartTime && user.workStartTime.trim() !== ''
          ? user.workStartTime
          : globalWorkStartTime;

      const [startH, startM] = effectiveStartTime.split(':').map(Number);
      const workStartMinutes = startH * 60 + startM;

      const lateByMinutes = Math.max(0, arrivalMinutes - workStartMinutes);
      const marksToDeduct = parseFloat((lateByMinutes * cutPerMinute).toFixed(2));

      results.push({
        attendanceId: record._id,
        userId: record.employeeId,
        userName: record.name,
        userEmail: user?.email || '',
        currentMarks: typeof user?.marks === 'number' ? user.marks : (user?.totalMarks ?? 0),
        totalMarks: (user?.totalMarks ?? 0) + (user?.manualMarks ?? 0),
        arrivalTime: pkTimeStr,
        expectedTime: effectiveStartTime,
        workStartTime: effectiveStartTime,
        isPerUserTime: !!(user?.workStartTime && user.workStartTime.trim() !== ''),
        lateByMinutes,
        marksToDeduct,
        isLate: lateByMinutes > 0,
        alreadyDeducted: alreadyDeductedIds.has(userId),
        attendanceStatus: record.status,
        attendanceType: record.type,
      });
    }

    results.sort((a, b) => b.lateByMinutes - a.lateByMinutes);

    res.status(200).json({
      success: true,
      data: results,
      lateCount: results.filter((r) => r.isLate).length,
      onTimeCount: results.filter((r) => !r.isLate).length,
      totalRecords: results.length,
      globalWorkStartTime,
      cutPerMinute,
      date,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkApplyLateDeductions = async (req, res) => {
  try {
    const { date, entries } = req.body;

    if (!date || !entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'date and entries array are required' });
    }

    const { getSettingValue } = await import('./setting.controller.js');
    const cutPerMinute = await getSettingValue('lateArrivalCutPerMinute', 0.5);
    const globalWorkStartTime = await getSettingValue('workStartTime', '09:00');

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const results = { success: [], failed: [], skipped: [] };

    for (const entry of entries) {
      try {
        const { userId, lateByMinutes, arrivalTime, marksToDeduct } = entry;

        if (!userId || lateByMinutes <= 0) {
          results.skipped.push({ userId, reason: 'Not late or missing data' });
          continue;
        }

        const existing = await ScoreDeduction.findOne({
          userId,
          deductionType: 'late_arrival',
          date: { $gte: dayStart, $lte: dayEnd },
        });
        if (existing) { results.skipped.push({ userId, reason: 'Already deducted' }); continue; }

        const user = await User.findById(userId).select('-password');
        if (!user) { results.failed.push({ userId, reason: 'User not found' }); continue; }

        const effectiveStartTime =
          user.workStartTime && user.workStartTime.trim() !== ''
            ? user.workStartTime
            : globalWorkStartTime;

        const cut = marksToDeduct ?? parseFloat((lateByMinutes * cutPerMinute).toFixed(2));
        const { marksBefore, marksAfter } = await applyDeductionToUser(userId, cut);

        await ScoreDeduction.create({
          userId,
          userName: user.name,
          deductionType: 'late_arrival',
          marksDeducted: cut,
          marksBefore,
          marksAfter,
          reason: `Late arrival: arrived at ${arrivalTime}, expected ${effectiveStartTime}. Late by ${lateByMinutes} minutes.`,
          autoReason: `Late by ${lateByMinutes} min × ${cutPerMinute} marks/min = ${cut} marks`,
          date: new Date(date),
          attendanceDetails: { arrivalTime, expectedTime: effectiveStartTime, lateByMinutes },
          appliedBy: 'admin',
          appliedByUserId: req.user?.id || null,
        });

        results.success.push({ userId, name: user.name, marksAfter, cut });
      } catch (err) {
        results.failed.push({ userId: entry.userId, reason: err.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk late deduction done. ${results.success.length} applied, ${results.skipped.length} skipped, ${results.failed.length} failed.`,
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const autoApplyDeadlineDeductions = async () => {
  const Project = (await import('../models/Project.js')).default;
  const { getSettingValue } = await import('./setting.controller.js');

  const deadlineMissCut = await getSettingValue('deadlineMissCut', 5);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const projects = await Project.find().populate({
    path: 'tasks.user',
    model: 'User',
    select: 'name email marks totalMarks manualMarks',
  });

  const results = { applied: [], skipped: [], failed: [] };

  for (const project of projects) {
    for (const task of project.tasks || []) {
      if (!task.user || !task.endDate) continue;

      const deadline = new Date(task.endDate);
      deadline.setHours(0, 0, 0, 0);

      if (deadline >= today || task.completed) continue;

      const userId = task.user._id || task.user;

      const existing = await ScoreDeduction.findOne({
        userId,
        deductionType: 'deadline_missed',
        'taskDetails.taskId': task._id,
      });

      if (existing) {
        results.skipped.push({ taskName: task.name, userId, reason: 'Already applied' });
        continue;
      }

      try {
        const user = await User.findById(userId).select('-password');
        if (!user) { results.failed.push({ taskName: task.name, reason: 'User not found' }); continue; }

        const { marksBefore, marksAfter } = await applyDeductionToUser(userId, deadlineMissCut);

        await ScoreDeduction.create({
          userId,
          userName: user.name,
          deductionType: 'deadline_missed',
          marksDeducted: deadlineMissCut,
          marksBefore,
          marksAfter,
          reason: `Deadline missed for task "${task.name}" in project "${project.projectName}". Deadline was ${new Date(task.endDate).toLocaleDateString('en-PK')}.`,
          autoReason: `Task deadline passed without completion — ${deadlineMissCut} marks deducted`,
          date: new Date(),
          taskDetails: {
            taskId: task._id,
            taskName: task.name,
            projectName: project.projectName,
            deadlineDate: task.endDate,
          },
          appliedBy: 'system',
        });

        results.applied.push({ taskName: task.name, projectName: project.projectName, userName: user.name, marksAfter });
      } catch (err) {
        results.failed.push({ taskName: task.name, reason: err.message });
      }
    }
  }

  return results;
};

export const applyDeadlineDeductionsEndpoint = async (req, res) => {
  try {
    const results = await autoApplyDeadlineDeductions();
    res.status(200).json({
      success: true,
      message: `Deadline deductions applied: ${results.applied.length} new, ${results.skipped.length} skipped, ${results.failed.length} failed.`,
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
