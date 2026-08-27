import api from '../../service/api.js';

// ============================================
// FORMAT DATE WITH TIME FOR LOGGING
// ============================================
const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Karachi', // ✅ Force Pakistan timezone for display
  });
};

// ============================================
// HELPER: Parse date without timezone shift
// ============================================
const parseLocalDateTime = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  // If string doesn't contain 'Z' or timezone offset, keep as local
  if (
    !dateStr.includes('Z') &&
    !dateStr.includes('+') &&
    !dateStr.includes('-')
  ) {
    const timezoneOffset = date.getTimezoneOffset();
    date.setMinutes(date.getMinutes() - timezoneOffset);
  }

  return date;
};

// ============================================
// AUTO-ZERO MISSED TASKS + APPLY DEDUCTIONS
// ============================================
export const autoZeroMissedTasks = async () => {
  try {
    console.log('🔄 Running auto-zero missed tasks check...');
    console.log(`🕐 Current Time: ${formatDateTime(new Date())}`);

    const res = await api.get('/projects');
    const allProjects = res.data || [];

    const updatePromises = [];
    const missedTasks = [];

    allProjects.forEach((project) => {
      (project.tasks || []).forEach((task) => {
        const now = new Date();

        // ✅ Parse deadline properly
        const deadline = task.endDate ? parseLocalDateTime(task.endDate) : null;

        // ✅ Compare date AND time
        const isDeadlineMissed = deadline && deadline < now && !task.completed;

        if (isDeadlineMissed && task.obtainedMarks > 0) {
          missedTasks.push({
            projectName: project.projectName,
            taskName: task.name,
            employeeName: task.user?.name || 'Unknown',
            deadline: formatDateTime(deadline),
            now: formatDateTime(now),
            currentMarks: task.obtainedMarks,
            taskId: task._id,
            projectId: project._id,
          });

          updatePromises.push(
            api.put(`/projects/${project._id}/tasks/${task._id}`, {
              obtainedMarks: 0,
              completed: false,
              basicWork: task.basicWork || false,
              tested: task.tested || false,
            })
          );
        }
      });
    });

    if (missedTasks.length > 0) {
      console.log(`⏰ Found ${missedTasks.length} missed task(s):`);
      missedTasks.forEach((task, index) => {
        console.log(`  ${index + 1}. "${task.taskName}" (${task.projectName})`);
        console.log(`     👤 ${task.employeeName}`);
        console.log(`     📅 Deadline: ${task.deadline}`);
        console.log(`     🕐 Current:  ${task.now}`);
        console.log(`     📊 Marks: ${task.currentMarks} → 0`);
      });
    } else {
      console.log('✅ No missed tasks found.');
    }

    if (updatePromises.length > 0) {
      console.log(`🔄 Updating ${updatePromises.length} task(s)...`);
      await Promise.all(updatePromises);
      console.log(`✅ ${updatePromises.length} task(s) reset to 0 marks.`);
    }

    // Apply deduction receipts
    console.log('🔄 Applying deduction receipts for missed deadlines...');
    try {
      await api.post('/score-deductions/apply-deadline-cuts');
      console.log('✅ Deduction receipts applied successfully.');
    } catch (deductionError) {
      console.error(
        '❌ Failed to apply deduction receipts:',
        deductionError.message
      );
    }

    console.log('✅ Auto-zero missed tasks check completed.');

    return {
      success: true,
      totalMissed: missedTasks.length,
      totalUpdated: updatePromises.length,
      missedTasks: missedTasks,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Error in autoZeroMissedTasks:', error.message);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// ============================================
// CHECK SPECIFIC TASK DEADLINE (with time)
// ============================================
export const checkTaskDeadline = (task) => {
  if (!task) return { isMissed: false, reason: 'Task not found' };

  const now = new Date();
  const deadline = task.endDate ? parseLocalDateTime(task.endDate) : null;

  if (!deadline) {
    return { isMissed: false, reason: 'No deadline set' };
  }

  if (task.completed) {
    return { isMissed: false, reason: 'Task already completed' };
  }

  const isMissed = deadline < now;

  return {
    isMissed,
    deadline: formatDateTime(deadline),
    currentTime: formatDateTime(now),
    timeDifference: isMissed
      ? `${Math.floor((now - deadline) / (1000 * 60 * 60))} hours ${Math.floor((now - deadline) / (1000 * 60)) % 60} minutes ago`
      : `${Math.floor((deadline - now) / (1000 * 60 * 60))} hours ${Math.floor((deadline - now) / (1000 * 60)) % 60} minutes remaining`,
    reason: isMissed ? 'Deadline passed' : 'Deadline not passed yet',
  };
};

// ============================================
// GET ALL MISSED TASKS (with time comparison)
// ============================================
export const getAllMissedTasks = async () => {
  try {
    const res = await api.get('/projects');
    const allProjects = res.data || [];

    const missedTasks = [];

    allProjects.forEach((project) => {
      (project.tasks || []).forEach((task) => {
        const check = checkTaskDeadline(task);
        if (check.isMissed) {
          missedTasks.push({
            ...check,
            projectName: project.projectName,
            projectId: project._id,
            taskName: task.name,
            taskId: task._id,
            employeeName: task.user?.name || 'Unknown',
            employeeId: task.user?._id || null,
            currentMarks: task.obtainedMarks || 0,
            basicWork: task.basicWork || false,
            completed: task.completed || false,
            tested: task.tested || false,
          });
        }
      });
    });

    return missedTasks;
  } catch (error) {
    console.error('❌ Error getting missed tasks:', error.message);
    return [];
  }
};

// ============================================
// RESET SINGLE TASK MARKS (with time check)
// ============================================
export const resetTaskMarksIfMissed = async (projectId, taskId) => {
  try {
    const res = await api.get(`/projects/${projectId}`);
    const project = res.data;

    const task = project.tasks.find((t) => t._id === taskId);
    if (!task) {
      return { success: false, message: 'Task not found' };
    }

    const check = checkTaskDeadline(task);
    if (!check.isMissed) {
      return { success: false, message: 'Task deadline not passed yet' };
    }

    if (task.obtainedMarks === 0) {
      return { success: false, message: 'Task already has 0 marks' };
    }

    await api.put(`/projects/${projectId}/tasks/${taskId}`, {
      obtainedMarks: 0,
      completed: task.completed || false,
      basicWork: task.basicWork || false,
      tested: task.tested || false,
    });

    return {
      success: true,
      message: 'Task marks reset to 0',
      taskName: task.name,
      previousMarks: task.obtainedMarks,
      deadline: formatDateTime(task.endDate),
      resetTime: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Error resetting task marks:', error.message);
    return { success: false, message: error.message };
  }
};

// ============================================
// BULK RESET TASKS BY DEADLINE (with time)
// ============================================
export const bulkResetTasksByDeadline = async (projectIds = null) => {
  try {
    console.log('🔄 Running bulk reset for missed deadlines...');

    const res = await api.get('/projects');
    const allProjects = res.data || [];

    let projectsToProcess = allProjects;
    if (projectIds && Array.isArray(projectIds) && projectIds.length > 0) {
      projectsToProcess = allProjects.filter((p) => projectIds.includes(p._id));
    }

    const results = [];

    for (const project of projectsToProcess) {
      const projectResults = [];

      for (const task of project.tasks || []) {
        const check = checkTaskDeadline(task);
        if (check.isMissed && task.obtainedMarks > 0) {
          try {
            await api.put(`/projects/${project._id}/tasks/${task._id}`, {
              obtainedMarks: 0,
              completed: task.completed || false,
              basicWork: task.basicWork || false,
              tested: task.tested || false,
            });

            projectResults.push({
              taskName: task.name,
              previousMarks: task.obtainedMarks,
              deadline: formatDateTime(task.endDate),
              status: 'reset',
            });
          } catch (error) {
            projectResults.push({
              taskName: task.name,
              previousMarks: task.obtainedMarks,
              deadline: formatDateTime(task.endDate),
              status: 'failed',
              error: error.message,
            });
          }
        }
      }

      if (projectResults.length > 0) {
        results.push({
          projectName: project.projectName,
          projectId: project._id,
          resetCount: projectResults.length,
          tasks: projectResults,
        });
      }
    }

    console.log(
      `✅ Bulk reset complete. Reset ${results.reduce((sum, r) => sum + r.resetCount, 0)} tasks.`
    );

    return results;
  } catch (error) {
    console.error('❌ Error in bulk reset:', error.message);
    return [];
  }
};
