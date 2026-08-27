import Project from '../models/Project.js';
import User from '../models/Users.js';
import ScoreDeduction from '../models/ScoreDeduction.js';

// Numbers assigned to a user's tasks are their actual base marks.  Rebuild the
// profile total and remaining marks from those numbers and existing deductions.
export const syncAssignedTaskMarks = async (userIds) => {
  const uniqueUserIds = [...new Set(
    userIds.filter(Boolean).map((userId) => String(userId._id || userId))
  )];
  if (!uniqueUserIds.length) return;

  const [projects, users, deductions] = await Promise.all([
    Project.find({
      $or: [
        { 'tasks.user': { $in: uniqueUserIds } },
        { 'tasks.users': { $in: uniqueUserIds } },
      ],
    }).select('tasks'),
    User.find({ _id: { $in: uniqueUserIds } }).select('manualMarks'),
    ScoreDeduction.find({ userId: { $in: uniqueUserIds } }).select('userId marksDeducted'),
  ]);

  const deductionsByUser = new Map();
  deductions.forEach((deduction) => {
    const id = String(deduction.userId);
    deductionsByUser.set(id, (deductionsByUser.get(id) || 0) + deduction.marksDeducted);
  });

  await Promise.all(users.map(async (user) => {
    const userId = String(user._id);
    let hasAssignedTask = false;
    const assignedMarks = projects.reduce((total, project) => (
      total + project.tasks.reduce((projectTotal, task) => {
        const assignees = [task.user, ...(task.users || [])]
          .filter(Boolean)
          .map((assignee) => String(assignee._id || assignee));
        if (!assignees.includes(userId)) return projectTotal;
        hasAssignedTask = true;
        return projectTotal + (Number(task.obtainedMarks) || 0);
      }, 0)
    ), 0);

    // A user with no task-assigned marks can still use a manually set profile
    // score, so do not overwrite that score here.
    if (!hasAssignedTask) return;

    const totalBase = assignedMarks + (user.manualMarks ?? 0);
    const remainingMarks = Math.max(0, totalBase - (deductionsByUser.get(userId) || 0));
    await User.findByIdAndUpdate(user._id, {
      $set: { totalMarks: assignedMarks, marks: remainingMarks },
    });
  }));
};
