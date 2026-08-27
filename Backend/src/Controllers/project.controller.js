// import fs from "fs";
// import Project from "../models/Project.js";
// import User from "../models/Users.js";
// import cloudinary from "../config/cloudinary.js";
// import DateUtility from "../utility/date.utility.js";
// import {
//   getMaxEmployeesPerTask,
//   getSettingValue,
//   allowMultipleAssignees,
//   getDefaultProjectStatus,
//   getMaxTasksPerProject
// } from "./setting.controller.js";

// // ============================================
// // EMAIL IMPORT - COMMENTED OUT
// // ============================================
// // import { sendEmail, getTaskAssignmentEmail } from "../services/email.service.js";

// // ============================================
// // CREATE PROJECT (with default status from settings)
// // ============================================
// export const createProject = async (req, res) => {
//   try {
//     const { projectName, description, status, client, startDate, endDate } = req.body;

//     // ✅ Get default project status from settings
//     const defaultStatus = await getDefaultProjectStatus();

//     const project = await Project.create({
//       projectName,
//       description,
//       status: status || defaultStatus,
//       client,
//       startDate: startDate ? new Date(startDate) : null,
//       endDate: endDate ? new Date(endDate) : null,
//       documents: [],
//       tasks: [],
//     });

//     res.status(201).json({
//       ...project.toObject(),
//       startDate: project.startDate ? DateUtility.formatToShortDate(project.startDate) : null,
//       endDate: project.endDate ? DateUtility.formatToShortDate(project.endDate) : null,
//     });
//   } catch (error) {
//     console.error("Create Project Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ============================================
// // GET ALL PROJECTS (with populated task users)
// // ============================================
// export const getProjects = async (req, res) => {
//   try {
//     const projects = await Project.find()
//       .populate({
//         path: "tasks.user",
//         model: "User",
//         select: "name email role isActive"
//       })
//       .populate({
//         path: "tasks.users",
//         model: "User",
//         select: "name email role isActive"
//       });

//     const formattedProjects = projects.map((project) => ({
//       ...project.toObject(),
//       startDate: DateUtility.formatToShortDate(project.startDate),
//       endDate: DateUtility.formatToShortDate(project.endDate),
//     }));

//     res.status(200).json(formattedProjects);
//   } catch (error) {
//     console.error("Get Projects Error:", error);
//     res.status(500).json({ message: "Failed to fetch projects", error: error.message });
//   }
// };

// // ============================================
// // GET PROJECT BY ID (with populated users)
// // ============================================
// export const getProjectById = async (req, res) => {
//   try {
//     const project = await Project.findById(req.params.id)
//       .populate({
//         path: "tasks.user",
//         model: "User",
//         select: "name email role isActive"
//       })
//       .populate({
//         path: "tasks.users",
//         model: "User",
//         select: "name email role isActive"
//       });

//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }
//     res.status(200).json(project);
//   } catch (error) {
//     console.error("Get Project By ID Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ============================================
// // UPDATE PROJECT
// // ============================================
// export const updateProject = async (req, res) => {
//   try {
//     const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
//       .populate({
//         path: "tasks.user",
//         model: "User",
//         select: "name email role"
//       })
//       .populate({
//         path: "tasks.users",
//         model: "User",
//         select: "name email role"
//       });

//     if (!project) return res.status(404).json({ message: "Project not found" });

//     res.status(200).json({
//       ...project.toObject(),
//       startDate: DateUtility.formatToShortDate(project.startDate),
//       endDate: DateUtility.formatToShortDate(project.endDate),
//     });
//   } catch (error) {
//     console.error("Update Project Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ============================================
// // DELETE PROJECT
// // ============================================
// export const deleteProject = async (req, res) => {
//   try {
//     const project = await Project.findByIdAndDelete(req.params.id);
//     if (!project) return res.status(404).json({ message: "Project not found" });

//     res.status(200).json({ success: true, message: "Project deleted successfully" });
//   } catch (error) {
//     console.error("Delete Project Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ============================================
// // ✅ ADD TASK - EMAIL NOTIFICATIONS COMMENTED OUT
// // ============================================
// export const addTask = async (req, res) => {
//   try {
//     const project = await Project.findById(req.params.id);
//     if (!project) return res.status(404).json({ message: "Project not found" });

//     const {
//       name,
//       description,
//       basicWork,
//       completed,
//       tested,
//       obtainedMarks,
//       client,
//       user,
//       users,
//       startDate,
//       endDate,
//     } = req.body;

//     // ✅ Get settings - Email settings commented out
//     const maxEmployees = await getSettingValue("maxEmployeesPerTask", 5);
//     // const emailNotifications = await getSettingValue("emailNotifications", true); // COMMENTED OUT
//     // const taskAssignmentNotifications = await getSettingValue("taskAssignmentNotifications", true); // COMMENTED OUT

//     // Get user IDs
//     let userIds = [];
//     if (users && Array.isArray(users) && users.length > 0) {
//       userIds = users;
//     } else if (user) {
//       userIds = [user];
//     }

//     // Validate employee count
//     if (userIds.length > maxEmployees) {
//       return res.status(400).json({
//         success: false,
//         message: `You can assign maximum ${maxEmployees} employees to a task`,
//       });
//     }

//     // ✅ Get employee details for email (keeping for future use if needed)
//     const assignedEmployees = await User.find({ _id: { $in: userIds } });

//     // Create task
//     const newTask = {
//       name,
//       description: description || "",
//       basicWork: basicWork || false,
//       completed: completed || false,
//       tested: tested || false,
//       obtainedMarks: Number(obtainedMarks) || 0,
//       client: client || "",
//       user: userIds[0] || null,
//       users: userIds,
//       startDate: startDate || null,
//       endDate: endDate || null,
//     };

//     project.tasks.push(newTask);
//     await project.save();

//     // ✅ Get the created task with populated user
//     const updatedProject = await Project.findById(req.params.id)
//       .populate({
//         path: "tasks.user",
//         model: "User",
//         select: "name email role"
//       })
//       .populate({
//         path: "tasks.users",
//         model: "User",
//         select: "name email role"
//       });

//     // ============================================
//     // EMAIL NOTIFICATIONS - COMPLETELY COMMENTED OUT
//     // ============================================
//     /*
//     // ✅ SEND EMAIL NOTIFICATIONS
//     if (emailNotifications && taskAssignmentNotifications) {
//       const assignedTask = updatedProject.tasks[updatedProject.tasks.length - 1];

//       // Get assigned user(s)
//       let assignedUsers = [];
//       if (assignedTask.users && assignedTask.users.length > 0) {
//         assignedUsers = assignedTask.users;
//       } else if (assignedTask.user) {
//         assignedUsers = [assignedTask.user];
//       }

//       console.log(`📧 Sending task assignment emails to ${assignedUsers.length} employee(s)...`);

//       // Send email to each assigned user
//       for (const employee of assignedUsers) {
//         if (employee && employee.email) {
//           try {
//             const emailData = getTaskAssignmentEmail(
//               assignedTask,
//               updatedProject,
//               req.user || { name: 'Admin' }
//             );

//             const result = await sendEmail({
//               to: employee.email,
//               subject: emailData.subject,
//               html: emailData.html,
//             });

//             if (result.success) {
//               console.log(`✅ Task assignment email sent to ${employee.email} for task: ${assignedTask.name}`);
//             } else {
//               console.log(`❌ Failed to send email to ${employee.email}: ${result.error}`);
//             }
//           } catch (emailError) {
//             console.error(`❌ Email error for ${employee.email}:`, emailError.message);
//           }
//         } else {
//           console.log(`⚠️ Employee ${employee?.name || 'Unknown'} has no email address`);
//         }
//       }
//     } else {
//       console.log(`📧 Email notifications disabled. Skipping task assignment emails.`);
//     }
//     */

//     // ✅ Log message instead of sending emails
//     console.log(`✅ Task "${name}" created successfully with ${userIds.length} employee(s). Email notifications are disabled.`);

//     res.status(200).json(updatedProject);
//   } catch (error) {
//     console.error("Add Task Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ============================================
// // UPDATE TASK (with validation)
// // ============================================
// export const updateTask = async (req, res) => {
//   try {
//     const { projectId, taskId } = req.params;

//     console.log("Update Task - projectId:", projectId, "taskId:", taskId);
//     console.log("Update Task - body:", req.body);

//     const project = await Project.findById(projectId);
//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     const task = project.tasks.id(taskId);
//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     const {
//       name,
//       description,
//       basicWork,
//       completed,
//       tested,
//       obtainedMarks,
//       client,
//       user,
//       users,
//       startDate,
//       endDate,
//     } = req.body;

//     // ✅ Get ALL settings
//     const maxEmployees = await getMaxEmployeesPerTask();
//     const allowMultiple = await allowMultipleAssignees();
//     const maxTasksPerProject = await getMaxTasksPerProject();

//     // ✅ Get all user IDs
//     let userIds = [];
//     if (users && Array.isArray(users) && users.length > 0) {
//       userIds = users;
//     } else if (user) {
//       userIds = [user];
//     }

//     // ✅ VALIDATION 1: Check if multiple assignees are allowed
//     if (!allowMultiple && userIds.length > 1) {
//       return res.status(400).json({
//         success: false,
//         message: "Multiple assignees are disabled by admin. Please select only one employee.",
//         setting: "allowMultipleAssignees",
//         currentCount: userIds.length,
//         maxAllowed: 1,
//       });
//     }

//     // ✅ VALIDATION 2: Check max employees per task
//     if (userIds.length > maxEmployees) {
//       return res.status(400).json({
//         success: false,
//         message: `You can assign maximum ${maxEmployees} employees to a task. Currently selected: ${userIds.length}`,
//         setting: "maxEmployeesPerTask",
//         maxAllowed: maxEmployees,
//         currentCount: userIds.length,
//       });
//     }

//     // ✅ VALIDATION 3: Check max tasks per project (only if adding new employees)
//     const existingUserIds = task.users.map(u => u.toString());
//     const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

//     if (newUserIds.length > 0 && project.tasks.length >= maxTasksPerProject) {
//       return res.status(400).json({
//         success: false,
//         message: `Maximum ${maxTasksPerProject} tasks allowed per project. Current tasks: ${project.tasks.length}`,
//         setting: "maxTasksPerProject",
//         maxAllowed: maxTasksPerProject,
//         currentCount: project.tasks.length,
//       });
//     }

//     // ✅ Update basic fields (if provided)
//     if (name !== undefined) task.name = name;
//     if (description !== undefined) task.description = description;
//     if (basicWork !== undefined) task.basicWork = basicWork;
//     if (completed !== undefined) task.completed = completed;
//     if (tested !== undefined) task.tested = tested;
//     if (obtainedMarks !== undefined) task.obtainedMarks = Number(obtainedMarks);
//     if (client !== undefined) task.client = client;
//     if (startDate !== undefined) task.startDate = startDate || null;
//     if (endDate !== undefined) task.endDate = endDate || null;

//     // ✅ Update users
//     if (user !== undefined || users !== undefined) {
//       task.user = userIds[0] || null;
//       task.users = userIds;
//     }

//     await project.save();

//     // ✅ Return with populated users
//     const updatedProject = await Project.findById(projectId)
//       .populate({
//         path: "tasks.user",
//         model: "User",
//         select: "name email role isActive"
//       })
//       .populate({
//         path: "tasks.users",
//         model: "User",
//         select: "name email role isActive"
//       });

//     res.status(200).json(updatedProject);
//   } catch (error) {
//     console.error("Update Task Error:", error);
//     res.status(500).json({ message: "Failed to update task", error: error.message });
//   }
// };

// // ============================================
// // DELETE TASK
// // ============================================
// export const deleteTask = async (req, res) => {
//   try {
//     const { projectId, taskId } = req.params;

//     console.log("Delete Task - projectId:", projectId, "taskId:", taskId);

//     const project = await Project.findById(projectId);
//     if (!project) {
//       console.log("Project not found:", projectId);
//       return res.status(404).json({ message: "Project not found" });
//     }

//     const task = project.tasks.id(taskId);
//     if (!task) {
//       console.log("Task not found:", taskId);
//       return res.status(404).json({ message: "Task not found" });
//     }

//     // Remove task using pull
//     project.tasks.pull(taskId);
//     await project.save();

//     const updatedProject = await Project.findById(projectId)
//       .populate({
//         path: "tasks.user",
//         model: "User",
//         select: "name email role"
//       })
//       .populate({
//         path: "tasks.users",
//         model: "User",
//         select: "name email role"
//       });

//     res.status(200).json(updatedProject);
//   } catch (error) {
//     console.error("Delete Task Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ============================================
// // ✅ UPLOAD DOCUMENT (Cloudinary) - WORKING
// // ============================================
// export const uploadDocument = async (req, res) => {
//   try {
//     const project = await Project.findById(req.params.id);
//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     // Convert file to base64 for Cloudinary upload
//     const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

//     // Upload to Cloudinary
//     const result = await cloudinary.uploader.upload(fileBase64, {
//       folder: "projects",
//       resource_type: "auto",
//     });

//     // Add document to project
//     project.documents.push({
//       fileName: req.file.originalname,
//       fileUrl: result.secure_url,
//       publicId: result.public_id,
//     });

//     await project.save();

//     // Return updated project with populated users
//     const updatedProject = await Project.findById(req.params.id)
//       .populate({
//         path: "tasks.user",
//         model: "User",
//         select: "name email role"
//       })
//       .populate({
//         path: "tasks.users",
//         model: "User",
//         select: "name email role"
//       });

//     res.status(200).json({
//       success: true,
//       message: "Document uploaded successfully",
//       project: updatedProject
//     });
//   } catch (error) {
//     console.error("Upload Document Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to upload document",
//       error: error.message
//     });
//   }
// };

// // ============================================
// // ✅ DELETE DOCUMENT - WORKING
// // ============================================
// export const deleteDocument = async (req, res) => {
//   try {
//     const { projectId, documentId } = req.params;

//     const project = await Project.findById(projectId);
//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     const document = project.documents.id(documentId);
//     if (!document) {
//       return res.status(404).json({ message: "Document not found" });
//     }

//     // Delete from Cloudinary if publicId exists
//     if (document.publicId) {
//       try {
//         await cloudinary.uploader.destroy(document.publicId, { resource_type: "auto" });
//         console.log(`✅ Document deleted from Cloudinary: ${document.publicId}`);
//       } catch (cloudinaryError) {
//         console.error("Cloudinary deletion error:", cloudinaryError);
//         // Continue with database deletion even if Cloudinary fails
//       }
//     }

//     // Remove document from project
//     project.documents.pull(documentId);
//     await project.save();

//     // Return updated project
//     const updatedProject = await Project.findById(projectId)
//       .populate({
//         path: "tasks.user",
//         model: "User",
//         select: "name email role"
//       })
//       .populate({
//         path: "tasks.users",
//         model: "User",
//         select: "name email role"
//       });

//     res.status(200).json({
//       success: true,
//       message: "Document deleted successfully",
//       project: updatedProject
//     });
//   } catch (error) {
//     console.error("Delete Document Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to delete document",
//       error: error.message
//     });
//   }
// };

import fs from 'fs';
import Project from '../models/Project.js';
import User from '../models/Users.js';
import cloudinary from '../config/cloudinary.js';
import DateUtility from '../utility/date.utility.js';
import { syncAssignedTaskMarks } from '../utility/userMarks.utility.js';
import { sendPushToUsers } from './notification.controller.js';
import {
  getMaxEmployeesPerTask,
  getSettingValue,
  allowMultipleAssignees,
  getDefaultProjectStatus,
  getMaxTasksPerProject,
} from './setting.controller.js';

// ============================================
// HELPER: Parse date without timezone shift
// ============================================
const parseLocalDateTime = (dateStr) => {
  if (!dateStr) return null;

  // If it's already a Date object
  if (dateStr instanceof Date) return dateStr;

  // If it's a string in ISO format
  const date = new Date(dateStr);

  // Check if valid
  if (isNaN(date.getTime())) return null;

  // If the string doesn't contain 'Z' or timezone offset, it's a local time
  // We need to keep it as local time
  if (
    !dateStr.includes('Z') &&
    !dateStr.includes('+') &&
    !dateStr.includes('-')
  ) {
    // Get timezone offset in minutes and adjust
    const timezoneOffset = date.getTimezoneOffset();
    date.setMinutes(date.getMinutes() - timezoneOffset);
  }

  return date;
};

// ============================================
// CREATE PROJECT (with datetime support)
// ============================================
export const createProject = async (req, res) => {
  try {
    const { projectName, description, status, client, startDate, endDate } =
      req.body;

    const defaultStatus = await getDefaultProjectStatus();

    const project = await Project.create({
      projectName,
      description,
      status: status || defaultStatus,
      client,
      startDate: parseLocalDateTime(startDate),
      endDate: parseLocalDateTime(endDate),
      documents: [],
      tasks: [],
    });

    res.status(201).json({
      ...project.toObject(),
      startDate: project.startDate ? project.startDate.toISOString() : null,
      endDate: project.endDate ? project.endDate.toISOString() : null,
    });
  } catch (error) {
    console.error('Create Project Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// GET ALL PROJECTS
// ============================================
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate({
        path: 'tasks.user',
        model: 'User',
        select: 'name email role isActive',
      })
      .populate({
        path: 'tasks.users',
        model: 'User',
        select: 'name email role isActive',
      });

    const formattedProjects = projects.map((project) => ({
      ...project.toObject(),
      startDate: project.startDate ? project.startDate.toISOString() : null,
      endDate: project.endDate ? project.endDate.toISOString() : null,
    }));

    res.status(200).json(formattedProjects);
  } catch (error) {
    console.error('Get Projects Error:', error);
    res
      .status(500)
      .json({ message: 'Failed to fetch projects', error: error.message });
  }
};

// ============================================
// GET PROJECT BY ID
// ============================================
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate({
        path: 'tasks.user',
        model: 'User',
        select: 'name email role isActive',
      })
      .populate({
        path: 'tasks.users',
        model: 'User',
        select: 'name email role isActive',
      });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json(project);
  } catch (error) {
    console.error('Get Project By ID Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// UPDATE PROJECT
// ============================================
export const updateProject = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const updateData = {
      ...req.body,
      startDate: parseLocalDateTime(startDate),
      endDate: parseLocalDateTime(endDate),
    };

    const project = await Project.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    })
      .populate({
        path: 'tasks.user',
        model: 'User',
        select: 'name email role',
      })
      .populate({
        path: 'tasks.users',
        model: 'User',
        select: 'name email role',
      });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    res.status(200).json({
      ...project.toObject(),
      startDate: project.startDate ? project.startDate.toISOString() : null,
      endDate: project.endDate ? project.endDate.toISOString() : null,
    });
  } catch (error) {
    console.error('Update Project Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// DELETE PROJECT
// ============================================
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    res
      .status(200)
      .json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete Project Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// ADD TASK (with datetime support - FIXED)
// ============================================
export const addTask = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const {
      name,
      description,
      basicWork,
      completed,
      tested,
      obtainedMarks,
      client,
      user,
      users,
      startDate,
      endDate,
    } = req.body;

    const maxEmployees = await getSettingValue('maxEmployeesPerTask', 5);

    let userIds = [];
    if (users && Array.isArray(users) && users.length > 0) {
      userIds = users;
    } else if (user) {
      userIds = [user];
    }

    if (userIds.length > maxEmployees) {
      return res.status(400).json({
        success: false,
        message: `You can assign maximum ${maxEmployees} employees to a task`,
      });
    }

    const assignedEmployees = await User.find({ _id: { $in: userIds } });

    // maxMarks is set at creation time and defines the ceiling for obtainedMarks
    const taskMaxMarks = Number(req.body.maxMarks) > 0 ? Number(req.body.maxMarks) : 100;
    const clampedObtainedMarks = Math.min(Math.max(0, Number(obtainedMarks) || taskMaxMarks), taskMaxMarks);

    const newTask = {
      name,
      description: description || '',
      basicWork: basicWork || false,
      completed: completed || false,
      tested: tested || false,
      maxMarks: taskMaxMarks,
      obtainedMarks: clampedObtainedMarks,
      client: client || '',
      user: userIds[0] || null,
      users: userIds,
      startDate: parseLocalDateTime(startDate), // ✅ FIXED
      endDate: parseLocalDateTime(endDate), // ✅ FIXED
    };

    project.tasks.push(newTask);
    await project.save();
    await syncAssignedTaskMarks(userIds);

    // ✅ Send notifications to assigned employees
    try {
      const taskNotificationPayload = {
        title: `📋 New Task Assigned: ${name}`,
        body: `You have been assigned to task "${name}" in project "${project.name}". Start: ${new Date(startDate).toLocaleDateString()}`,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'task-assigned',
        timestamp: Date.now(),
        url: '/layout/taskmanager',
      };
      await sendPushToUsers(userIds, taskNotificationPayload);
    } catch (notificationError) {
      console.warn('Failed to send task assignment notification:', notificationError.message);
    }

    const updatedProject = await Project.findById(req.params.id)
      .populate({
        path: 'tasks.user',
        model: 'User',
        select: 'name email role',
      })
      .populate({
        path: 'tasks.users',
        model: 'User',
        select: 'name email role',
      });

    console.log(
      `✅ Task "${name}" created successfully with ${userIds.length} employee(s).`
    );
    console.log(`   📅 Start: ${startDate}, End: ${endDate}`);

    res.status(200).json(updatedProject);
  } catch (error) {
    console.error('Add Task Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// UPDATE TASK (with datetime support - FIXED)
// ============================================
export const updateTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    const previousAssignees = [task.user, ...(task.users || [])];

    const isTeamLeader = ['teamLeader', 'superAdmin'].includes(req.user?.role);
    if (!isTeamLeader) {
      const employeeId = String(req.user?.id || '');
      const assignedUserIds = [task.user, ...(task.users || [])]
        .filter(Boolean)
        .map((assignedUser) => String(assignedUser._id || assignedUser));
      const allowedFields = ['basicWork', 'completed', 'tested'];
      const attemptedRestrictedFields = Object.keys(req.body).filter(
        (field) => !allowedFields.includes(field)
      );

      if (!assignedUserIds.includes(employeeId)) {
        return res.status(403).json({
          success: false,
          message: 'You can only update tasks assigned to you',
        });
      }

      if (attemptedRestrictedFields.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'Employees can only update their task progress',
        });
      }
    }

    const {
      name,
      description,
      basicWork,
      completed,
      tested,
      obtainedMarks,
      client,
      user,
      users,
      startDate,
      endDate,
    } = req.body;

    const maxEmployees = await getMaxEmployeesPerTask();
    const allowMultiple = await allowMultipleAssignees();
    const maxTasksPerProject = await getMaxTasksPerProject();

    let userIds = [];
    if (users && Array.isArray(users) && users.length > 0) {
      userIds = users;
    } else if (user) {
      userIds = [user];
    }

    if (!allowMultiple && userIds.length > 1) {
      return res.status(400).json({
        success: false,
        message:
          'Multiple assignees are disabled by admin. Please select only one employee.',
        setting: 'allowMultipleAssignees',
      });
    }

    if (userIds.length > maxEmployees) {
      return res.status(400).json({
        success: false,
        message: `You can assign maximum ${maxEmployees} employees to a task.`,
        setting: 'maxEmployeesPerTask',
      });
    }

    const existingUserIds = task.users.map((u) => u.toString());
    const newUserIds = userIds.filter((id) => !existingUserIds.includes(id));

    if (newUserIds.length > 0 && project.tasks.length >= maxTasksPerProject) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxTasksPerProject} tasks allowed per project.`,
        setting: 'maxTasksPerProject',
      });
    }

    // ✅ Update all fields including datetime (FIXED)
    if (name !== undefined) task.name = name;
    if (description !== undefined) task.description = description;
    if (basicWork !== undefined) task.basicWork = basicWork;
    if (completed !== undefined) task.completed = completed;
    if (tested !== undefined) task.tested = tested;
    if (obtainedMarks !== undefined) {
      // Clamp obtainedMarks: must be >= 0 and <= task.maxMarks
      const taskMax = task.maxMarks != null ? task.maxMarks : 100;
      task.obtainedMarks = Math.min(Math.max(0, Number(obtainedMarks)), taskMax);
    }
    // Allow updating maxMarks if provided (admin only)
    if (req.body.maxMarks !== undefined) {
      task.maxMarks = Math.max(0, Number(req.body.maxMarks));
      // Re-clamp obtainedMarks if the new ceiling is lower
      if (task.obtainedMarks > task.maxMarks) task.obtainedMarks = task.maxMarks;
    }
    if (client !== undefined) task.client = client;
    if (startDate !== undefined) task.startDate = parseLocalDateTime(startDate);
    if (endDate !== undefined) task.endDate = parseLocalDateTime(endDate);

    if (user !== undefined || users !== undefined) {
      task.user = userIds[0] || null;
      task.users = userIds;
    }

    await project.save();

    if (obtainedMarks !== undefined || user !== undefined || users !== undefined) {
      await syncAssignedTaskMarks([...previousAssignees, ...userIds]);
    }

    const updatedProject = await Project.findById(projectId)
      .populate({
        path: 'tasks.user',
        model: 'User',
        select: 'name email role isActive',
      })
      .populate({
        path: 'tasks.users',
        model: 'User',
        select: 'name email role isActive',
      });

    res.status(200).json(updatedProject);
  } catch (error) {
    console.error('Update Task Error:', error);
    res
      .status(500)
      .json({ message: 'Failed to update task', error: error.message });
  }
};

// ============================================
// DELETE TASK
// ============================================
export const deleteTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    project.tasks.pull(taskId);
    await project.save();

    const updatedProject = await Project.findById(projectId)
      .populate({
        path: 'tasks.user',
        model: 'User',
        select: 'name email role',
      })
      .populate({
        path: 'tasks.users',
        model: 'User',
        select: 'name email role',
      });

    res.status(200).json(updatedProject);
  } catch (error) {
    console.error('Delete Task Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// UPLOAD DOCUMENT (Cloudinary)
// ============================================
export const uploadDocument = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(fileBase64, {
      folder: 'projects',
      resource_type: 'auto',
    });

    project.documents.push({
      fileName: req.file.originalname,
      fileUrl: result.secure_url,
      publicId: result.public_id,
    });

    await project.save();

    const updatedProject = await Project.findById(req.params.id)
      .populate({
        path: 'tasks.user',
        model: 'User',
        select: 'name email role',
      })
      .populate({
        path: 'tasks.users',
        model: 'User',
        select: 'name email role',
      });

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      project: updatedProject,
    });
  } catch (error) {
    console.error('Upload Document Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message,
    });
  }
};

// ============================================
// DELETE DOCUMENT
// ============================================
export const deleteDocument = async (req, res) => {
  try {
    const { projectId, documentId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const document = project.documents.id(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.publicId) {
      try {
        await cloudinary.uploader.destroy(document.publicId, {
          resource_type: 'auto',
        });
        console.log(
          `✅ Document deleted from Cloudinary: ${document.publicId}`
        );
      } catch (cloudinaryError) {
        console.error('Cloudinary deletion error:', cloudinaryError);
      }
    }

    project.documents.pull(documentId);
    await project.save();

    const updatedProject = await Project.findById(projectId)
      .populate({
        path: 'tasks.user',
        model: 'User',
        select: 'name email role',
      })
      .populate({
        path: 'tasks.users',
        model: 'User',
        select: 'name email role',
      });

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      project: updatedProject,
    });
  } catch (error) {
    console.error('Delete Document Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message,
    });
  }
};

// ============================================
// UPDATE PROJECT FINANCIAL FIELDS (superAdmin only)
// PATCH /api/projects/:id/financial
// ============================================
export const updateProjectFinancial = async (req, res) => {
  try {
    // Role check — enforced in route, double-checked here
    if (!req.user || req.user.role !== "superAdmin") {
      return res.status(403).json({ success: false, message: "Super Admin access required" });
    }

    const { totalPrice, budget, currency, paymentStatus, amountReceived } = req.body;

    const updateFields = {};
    if (totalPrice !== undefined) updateFields.totalPrice = Math.max(0, Number(totalPrice));
    if (budget !== undefined) updateFields.budget = Math.max(0, Number(budget));
    if (currency !== undefined) updateFields.currency = currency;
    if (paymentStatus !== undefined) updateFields.paymentStatus = paymentStatus;
    if (amountReceived !== undefined) updateFields.amountReceived = Math.max(0, Number(amountReceived));

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).populate({ path: "tasks.user", model: "User", select: "name email role" })
     .populate({ path: "tasks.users", model: "User", select: "name email role" });

    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    res.status(200).json({ success: true, message: "Project financials updated", project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET PROJECT FINANCIAL SUMMARY (superAdmin only)
// GET /api/projects/:id/financial-summary
// ============================================
export const getProjectFinancialSummary = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "superAdmin") {
      return res.status(403).json({ success: false, message: "Super Admin access required" });
    }

    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    // Get expenses linked to this project
    const Expense = (await import("../models/Expense.js")).default;
    const expenseAgg = await Expense.aggregate([
      { $match: { project: project._id, status: { $ne: "Cancelled" } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const projectExpenses = expenseAgg[0]?.total || 0;

    const totalPrice = project.totalPrice || 0;
    const amountReceived = project.amountReceived || 0;
    const pendingAmount = Math.max(0, totalPrice - amountReceived);
    const estimatedProfit = Math.max(0, totalPrice - projectExpenses);
    const cashProfit = amountReceived - projectExpenses;

    res.status(200).json({
      success: true,
      data: {
        projectId: project._id,
        projectName: project.projectName,
        currency: project.currency || "PKR",
        totalPrice,
        budget: project.budget || 0,
        amountReceived,
        pendingAmount,
        paymentStatus: project.paymentStatus || "Pending",
        projectExpenses,
        estimatedProfit,
        cashProfit,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
