// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import api from '../../service/api.js';
// import {
//   ArrowLeft,
//   Calendar,
//   FileText,
//   CheckCircle,
//   FolderOpen,
//   User,
//   Plus,
//   Edit2,
//   Trash2,
//   Upload,
//   X,
//   Eye,
//   Briefcase,
//   Search,
//   Users,
//   Check,
//   Clock,
//   AlertCircle,
//   Loader2,
//   ChevronDown,
//   ChevronRight,
//   Award,
// } from 'lucide-react';
// import toast, { Toaster } from 'react-hot-toast';
// import SSIPageLoader from '../../components/SSIPageLoader.jsx';

// const API_BASE_URL = '/projects';

// const ProjectDetail = () => {
//   const { projectId } = useParams();
//   const navigate = useNavigate();
//   const [project, setProject] = useState(null);
//   const [users, setUsers] = useState([]);
//   const [currentTab, setCurrentTab] = useState('Tasks');
//   const [loading, setLoading] = useState(true);
//   const [showTaskForm, setShowTaskForm] = useState(false);
//   const [expandedGroups, setExpandedGroups] = useState({});
//   const [editTask, setEditTask] = useState(null);
//   const [isEditingMultiple, setIsEditingMultiple] = useState(false);
//   const [allTasksWithSameName, setAllTasksWithSameName] = useState([]);

//   const [taskForm, setTaskForm] = useState({
//     name: '',
//     description: '',
//     obtainedMarks: 0,
//     selectedEmployees: [],
//     startDate: '',
//     deadline: '',
//   });

//   const initialTaskFormState = {
//     name: '',
//     description: '',
//     obtainedMarks: 0,
//     selectedEmployees: [],
//     startDate: '',
//     deadline: '',
//   };

//   const [searchEmployee, setSearchEmployee] = useState('');
//   const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

//   const [showGiveNumbersModal, setShowGiveNumbersModal] = useState(false);
//   const [selectedTaskForNumbers, setSelectedTaskForNumbers] = useState(null);
//   const [numbersForm, setNumbersForm] = useState({
//     marks: 0,
//     basicWork: false,
//     completed: false,
//     tested: false,
//   });

//   const [taskLoading, setTaskLoading] = useState(false);
//   const [numbersLoading, setNumbersLoading] = useState(false);

//   const [settings, setSettings] = useState({
//     maxEmployeesPerTask: 5,
//     allowMultipleAssignees: true,
//     defaultTaskStatus: 'Pending',
//     maxTasksPerProject: 100,
//   });

//   // ================= FORMAT DATE WITH TIME =================
//   const formatDateTimeLocal = (date) => {
//     if (!date) return '';
//     const d = new Date(date);
//     return d.toISOString().slice(0, 16);
//   };

//   const formatDateWithTime = (date) => {
//     if (!date) return 'N/A';
//     return new Date(date).toLocaleString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   };

//   // ================= MEMOIZED VALUES =================
//   const groupedTasks = useMemo(() => {
//     if (!project?.tasks) return {};
//     const groups = {};
//     project.tasks.forEach((task) => {
//       const taskName = task.name || 'Unnamed Task';
//       if (!groups[taskName]) groups[taskName] = [];
//       groups[taskName].push(task);
//     });
//     return groups;
//   }, [project?.tasks]);

//   const totalTasks = useMemo(
//     () => project?.tasks?.length || 0,
//     [project?.tasks]
//   );
//   const completedTasks = useMemo(
//     () => project?.tasks?.filter((t) => t.completed && t.tested).length || 0,
//     [project?.tasks]
//   );
//   const projectProgress = useMemo(
//     () =>
//       totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
//     [totalTasks, completedTasks]
//   );

//   // ================= FETCH FUNCTIONS =================
//   const fetchProject = useCallback(async () => {
//     setLoading(true);
//     try {
//       const res = await api.get(`${API_BASE_URL}/${projectId}`);
//       setProject(res.data);
//     } catch (err) {
//       toast.error('Failed to load project');
//     } finally {
//       setLoading(false);
//     }
//   }, [projectId]);

//   const fetchEmployees = useCallback(async () => {
//     try {
//       const res = await api.get('/user/all-users');
//       let usersData = res.data.users || res.data.data || res.data || [];
//       const allUsers = Array.isArray(usersData) ? usersData : [];
//       setUsers(allUsers.filter((user) => user.role === 'employee'));
//     } catch (error) {
//       setUsers([]);
//     }
//   }, []);

//   const fetchAllSettings = useCallback(async () => {
//     try {
//       const res = await api.get('/settings');
//       if (res.data && Array.isArray(res.data)) {
//         const settingsMap = {};
//         res.data.forEach((setting) => {
//           settingsMap[setting.key] = setting.value;
//         });
//         setSettings((prev) => ({ ...prev, ...settingsMap }));
//       }
//     } catch (error) {}
//   }, []);

//   useEffect(() => {
//     fetchProject();
//     fetchEmployees();
//     fetchAllSettings();
//   }, [projectId, fetchProject, fetchEmployees, fetchAllSettings]);

//   // ================= CHECK DEADLINE WITH TIME =================
//   useEffect(() => {
//     if (!project?.tasks) return;

//     const now = new Date();
//     let updated = false;

//     const updateTasks = async () => {
//       for (const task of project.tasks) {
//         if (task.endDate && !task.completed) {
//           const deadline = new Date(task.endDate);
//           if (deadline < now && task.obtainedMarks !== 0) {
//             updated = true;
//             try {
//               await api.put(`${API_BASE_URL}/${projectId}/tasks/${task._id}`, {
//                 obtainedMarks: 0,
//                 basicWork: task.basicWork || false,
//                 completed: task.completed || false,
//                 tested: task.tested || false,
//               });
//             } catch (error) {}
//           }
//         }
//       }
//       if (updated) {
//         await fetchProject();
//         toast.warning(
//           '🚨 Some tasks had their marks reset to 0 due to missed deadlines!'
//         );
//       }
//     };

//     updateTasks();
//   }, [projectId, project?._id, project?.tasks, fetchProject]);

//   // ================= CALCULATE PROJECT STATUS =================
//   const calculateProjectStatus = (tasks) => {
//     if (!tasks || tasks.length === 0) return 'Pending';

//     let completedCount = 0,
//       inProgressCount = 0,
//       pendingCount = 0;

//     tasks.forEach((task) => {
//       if (task.completed === true && task.tested === true) {
//         completedCount++;
//       } else if (task.basicWork === true && task.completed === false) {
//         inProgressCount++;
//       } else if (task.basicWork === false && task.completed === false) {
//         pendingCount++;
//       } else if (task.completed === true && task.tested === false) {
//         inProgressCount++;
//       }
//     });

//     if (completedCount === tasks.length && completedCount > 0)
//       return 'Completed';
//     if (inProgressCount > 0) return 'In Progress';
//     if (pendingCount === tasks.length) return 'Pending';
//     if (completedCount > 0 && pendingCount > 0) return 'In Progress';
//     return 'Pending';
//   };

//   const projectStatus = useMemo(
//     () => calculateProjectStatus(project?.tasks),
//     [project?.tasks]
//   );

//   // ================= TASK HANDLERS =================
//   const handleTaskChange = (e) => {
//     const { name, value } = e.target;
//     setTaskForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const addEmployeeToTask = (employee) => {
//     if (
//       !settings.allowMultipleAssignees &&
//       taskForm.selectedEmployees.length >= 1
//     ) {
//       toast.error('Multiple assignees are disabled by admin.');
//       return;
//     }
//     if (taskForm.selectedEmployees.length >= settings.maxEmployeesPerTask) {
//       toast.error(`Maximum ${settings.maxEmployeesPerTask} employees allowed.`);
//       return;
//     }
//     if (taskForm.selectedEmployees.find((emp) => emp._id === employee._id)) {
//       toast.warning('Employee already assigned.');
//       return;
//     }

//     setTaskForm((prev) => ({
//       ...prev,
//       selectedEmployees: [...prev.selectedEmployees, employee],
//     }));
//     setSearchEmployee('');
//     setShowEmployeeDropdown(false);
//     toast.success(`${employee.name || employee.email} added to task`);
//   };

//   const removeEmployeeFromTask = (employeeId) => {
//     setTaskForm((prev) => ({
//       ...prev,
//       selectedEmployees: prev.selectedEmployees.filter(
//         (emp) => emp._id !== employeeId
//       ),
//     }));
//   };

//   const filteredEmployees = useMemo(() => {
//     return users.filter((emp) => {
//       const matchesSearch = emp.name
//         ?.toLowerCase()
//         .includes(searchEmployee.toLowerCase());
//       const alreadySelected = taskForm.selectedEmployees.some(
//         (selected) => selected._id === emp._id
//       );
//       const limitReached =
//         taskForm.selectedEmployees.length >= settings.maxEmployeesPerTask;
//       const multipleDisabled =
//         !settings.allowMultipleAssignees &&
//         taskForm.selectedEmployees.length >= 1;
//       return (
//         matchesSearch && !alreadySelected && !limitReached && !multipleDisabled
//       );
//     });
//   }, [
//     users,
//     searchEmployee,
//     taskForm.selectedEmployees,
//     settings.maxEmployeesPerTask,
//     settings.allowMultipleAssignees,
//   ]);

//   const toggleGroup = (taskName) => {
//     setExpandedGroups((prev) => ({
//       ...prev,
//       [taskName]: !prev[taskName],
//     }));
//   };

//   const resetTaskForm = () => {
//     setEditTask(null);
//     setIsEditingMultiple(false);
//     setAllTasksWithSameName([]);
//     setTaskForm(initialTaskFormState);
//     setSearchEmployee('');
//     setShowEmployeeDropdown(false);
//   };

//   // ================= CRUD OPERATIONS =================
//   const addTask = async () => {
//     if (taskForm.selectedEmployees.length === 0) {
//       toast.error('Please select at least one employee.');
//       return;
//     }
//     if (taskForm.selectedEmployees.length > settings.maxEmployeesPerTask) {
//       toast.error(`Maximum ${settings.maxEmployeesPerTask} employees allowed.`);
//       return;
//     }
//     if (
//       !settings.allowMultipleAssignees &&
//       taskForm.selectedEmployees.length > 1
//     ) {
//       toast.error('Multiple assignees disabled by admin.');
//       return;
//     }

//     setTaskLoading(true);
//     try {
//       const promises = taskForm.selectedEmployees.map((employee) => {
//         const taskData = {
//           name: taskForm.name,
//           description: taskForm.description,
//           basicWork: false,
//           completed: false,
//           tested: false,
//           obtainedMarks: Number(taskForm.obtainedMarks) || 0,
//           user: employee._id,
//           startDate: convertToUTC(taskForm.startDate),
//           endDate: convertToUTC(taskForm.deadline),
//         };
//         return api.post(`${API_BASE_URL}/${projectId}/tasks`, taskData);
//       });

//       await Promise.all(promises);
//       await fetchProject();
//       resetTaskForm();
//       setShowTaskForm(false);
//       if (taskForm.name) {
//         setExpandedGroups((prev) => ({ ...prev, [taskForm.name]: true }));
//       }
//       toast.success(`${taskForm.selectedEmployees.length} task(s) added!`);
//     } catch (err) {
//       toast.error('Failed to add tasks');
//     } finally {
//       setTaskLoading(false);
//     }
//   };

//   const updateTask = async () => {
//     try {
//       if (taskForm.selectedEmployees.length === 0) {
//         toast.error('Please select at least one employee.');
//         return;
//       }

//       const tasksWithSameName = project.tasks.filter(
//         (t) => t.name === editTask.name
//       );
//       const selectedUserIds = taskForm.selectedEmployees.map((emp) => emp._id);
//       const currentUserIds = tasksWithSameName
//         .map((t) => {
//           let uid = t.user;
//           if (typeof uid === 'object' && uid?._id) uid = uid._id;
//           return uid?.toString();
//         })
//         .filter(Boolean);

//       const usersToAdd = selectedUserIds.filter(
//         (uid) => !currentUserIds.includes(uid?.toString())
//       );
//       const usersToRemove = currentUserIds.filter(
//         (uid) => !selectedUserIds.includes(uid?.toString())
//       );

//       for (const userId of usersToRemove) {
//         const taskToDelete = tasksWithSameName.find((t) => {
//           let uid = t.user;
//           if (typeof uid === 'object' && uid?._id) uid = uid._id;
//           return uid?.toString() === userId;
//         });
//         if (taskToDelete) {
//           await api.delete(
//             `${API_BASE_URL}/${projectId}/tasks/${taskToDelete._id}`
//           );
//         }
//       }

//       const tasksToKeep = tasksWithSameName.filter((t) => {
//         let uid = t.user;
//         if (typeof uid === 'object' && uid?._id) uid = uid._id;
//         return selectedUserIds.includes(uid?.toString());
//       });

//       for (const task of tasksToKeep) {
//         await api.put(`${API_BASE_URL}/${projectId}/tasks/${task._id}`, {
//           name: taskForm.name,
//           description: taskForm.description,
//           obtainedMarks: Number(taskForm.obtainedMarks),
//           startDate: convertToUTC(taskForm.startDate),
//           endDate: convertToUTC(taskForm.deadline),
//         });
//       }

//       for (const userId of usersToAdd) {
//         await api.post(`${API_BASE_URL}/${projectId}/tasks`, {
//           name: taskForm.name,
//           description: taskForm.description,
//           basicWork: false,
//           completed: false,
//           tested: false,
//           obtainedMarks: Number(taskForm.obtainedMarks),
//           user: userId,
//           startDate: taskForm.startDate,
//           endDate: taskForm.deadline,
//         });
//       }

//       await fetchProject();
//       resetTaskForm();
//       setShowTaskForm(false);
//       toast.success('Task updated successfully!');
//     } catch (error) {
//       toast.error('Failed to update task');
//     }
//   };

//   const deleteTask = async (taskId) => {
//     if (!window.confirm('Delete this task?')) return;
//     try {
//       await api.delete(`${API_BASE_URL}/${projectId}/tasks/${taskId}`);
//       await fetchProject();
//       toast.success('Task deleted!');
//     } catch (error) {
//       toast.error('Failed to delete task');
//     }
//   };

//   const deleteGroup = async (taskName) => {
//     const tasksToDelete = project.tasks.filter((t) => t.name === taskName);
//     if (!window.confirm(`Delete all ${tasksToDelete.length} tasks?`)) return;

//     try {
//       const promises = tasksToDelete.map((task) =>
//         api.delete(`${API_BASE_URL}/${projectId}/tasks/${task._id}`)
//       );
//       await Promise.all(promises);
//       await fetchProject();
//       toast.success(`Group "${taskName}" deleted!`);
//     } catch (error) {
//       toast.error('Failed to delete group');
//     }
//   };

//   const handleEditTask = (task) => {
//     setEditTask(task);
//     const sameNameTasks = project.tasks.filter((t) => t.name === task.name);
//     setAllTasksWithSameName(sameNameTasks);
//     setIsEditingMultiple(sameNameTasks.length > 1);

//     const allEmployees = [];
//     const seenIds = new Set();

//     sameNameTasks.forEach((t) => {
//       if (t.user) {
//         let userId = typeof t.user === 'object' ? t.user._id : t.user;
//         if (!seenIds.has(userId?.toString())) {
//           seenIds.add(userId?.toString());
//           const foundUser = users.find((u) => u._id === userId?.toString());
//           allEmployees.push(
//             foundUser || { _id: userId, name: 'Unknown', email: '' }
//           );
//         }
//       }
//     });

//     const firstTask = sameNameTasks[0] || task;
//     setTaskForm({
//       name: firstTask.name || '',
//       description: firstTask.description || '',
//       obtainedMarks: firstTask.obtainedMarks || 0,
//       selectedEmployees: allEmployees,
//       startDate: formatDateTimeLocal(firstTask.startDate),
//       deadline: formatDateTimeLocal(firstTask.endDate),
//     });
//     setShowTaskForm(true);
//   };

//   const openGiveNumbersModal = (task) => {
//     setSelectedTaskForNumbers(task);
//     setNumbersForm({
//       marks: task.obtainedMarks || 0,
//       basicWork: task.basicWork || false,
//       completed: task.completed || false,
//       tested: task.tested || false,
//     });
//     setShowGiveNumbersModal(true);
//   };

//   const handleNumbersChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     if (type === 'checkbox') {
//       setNumbersForm((prev) => ({
//         ...prev,
//         [name]: checked,
//       }));
//     } else if (name === 'marks') {
//       // Clamp marks: must be >= 0 and <= task's maxMarks
//       const taskMaxMarks = selectedTaskForNumbers?.maxMarks || 100;
//       const clampedValue = Math.min(Math.max(0, Number(value) || 0), taskMaxMarks);
//       setNumbersForm((prev) => ({
//         ...prev,
//         marks: clampedValue,
//       }));
//     } else {
//       setNumbersForm((prev) => ({
//         ...prev,
//         [name]: value,
//       }));
//     }
//   };

//   const submitNumbers = async () => {
//     try {
//       if (!selectedTaskForNumbers) return;
//       await api.put(
//         `${API_BASE_URL}/${projectId}/tasks/${selectedTaskForNumbers._id}`,
//         {
//           obtainedMarks: Number(numbersForm.marks),
//           basicWork: numbersForm.basicWork,
//           completed: numbersForm.completed,
//           tested: numbersForm.tested,
//         }
//       );
//       await fetchProject();
//       setShowGiveNumbersModal(false);
//       setSelectedTaskForNumbers(null);
//       toast.success('Numbers assigned!');
//     } catch (error) {
//       toast.error('Failed to assign numbers');
//     }
//   };

//   const uploadFile = async (file) => {
//     try {
//       const formData = new FormData();
//       formData.append('file', file);
//       await api.post(`${API_BASE_URL}/${projectId}/documents`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });
//       await fetchProject();
//       toast.success('Document uploaded!');
//     } catch (error) {
//       toast.error('Failed to upload document');
//     }
//   };

//   const handleRemoveDocument = async (documentId) => {
//     if (!window.confirm('Delete this document?')) return;
//     try {
//       await api.delete(`${API_BASE_URL}/${projectId}/documents/${documentId}`);
//       await fetchProject();
//       toast.success('Document deleted!');
//     } catch (error) {
//       toast.error('Failed to delete document');
//     }
//   };

//   // ================= HELPERS =================
//   const getStatusColor = (status) => {
//     const colors = {
//       Completed:
//         'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20',
//       'In Progress':
//         'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20',
//       Pending:
//         'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20',
//     };
//     return (
//       colors[status] ||
//       'bg-[var(--border-color)] text-[var(--text-muted)] border-[var(--border-color)]'
//     );
//   };

//   const getStatusIcon = (status) => {
//     const icons = {
//       Completed: <CheckCircle className="w-3 h-3" />,
//       'In Progress': <Clock className="w-3 h-3" />,
//       Pending: <AlertCircle className="w-3 h-3" />,
//     };
//     return icons[status] || <AlertCircle className="w-3 h-3" />;
//   };

//   const getAssignedUser = (task) => {
//     if (!task) return null;
//     if (
//       task.user &&
//       typeof task.user === 'object' &&
//       task.user._id &&
//       task.user.name
//     ) {
//       return task.user;
//     }
//     if (typeof task.user === 'string') {
//       const found = users.find((u) => u._id === task.user);
//       return found || { _id: task.user, name: 'Unknown', email: '' };
//     }
//     if (task.users && Array.isArray(task.users) && task.users.length > 0) {
//       const firstUser = task.users[0];
//       if (typeof firstUser === 'object' && firstUser._id) {
//         const found = users.find((u) => u._id === firstUser._id.toString());
//         return found || firstUser;
//       }
//     }
//     return null;
//   };

//   const getGroupStats = (tasks) => {
//     const total = tasks.length;
//     const completed = tasks.filter((t) => t.completed).length;
//     const totalMarks = tasks.reduce(
//       (sum, t) => sum + (t.obtainedMarks || 0),
//       0
//     );
//     const avgMarks = total > 0 ? Math.round(totalMarks / total) : 0;
//     return { total, completed, totalMarks, avgMarks };
//   };

//   if (loading) {
//     return <SSIPageLoader message="Loading project..." />;
//   }

//   if (!project) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[60vh]">
//         <FolderOpen className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
//         <p className="text-[var(--text-secondary)] text-lg">
//           Project not found
//         </p>
//         <button
//           onClick={() => navigate('/admin/project')}
//           className="mt-4 text-[var(--accent-primary)] hover:text-[var(--accent-hover)] text-sm font-medium transition"
//         >
//           Go back to projects
//         </button>
//       </div>
//     );
//   }

//   const convertToUTC = (dateStr) => {
//   if (!dateStr) return "";
//   const date = new Date(dateStr);
//   return date.toISOString(); // Converts to UTC
// }; 

//   return (
//     <>
//       <Toaster
//         position="top-right"
//         toastOptions={{
//           duration: 3000,
//           style: {
//             background: 'var(--bg-card)',
//             color: 'var(--text-primary)',
//             border: '1px solid var(--border-color)',
//           },
//         }}
//       />
//       <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden">
//         {/* Header */}
//         <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-4 sm:px-6 py-4 sm:py-5">
//           <div className="flex flex-col sm:flex-row sm:items-start gap-4">
//             <div className="flex items-center gap-3 flex-1 min-w-0">
//               <button
//                 onClick={() => navigate('/admin/project')}
//                 className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition flex-shrink-0"
//               >
//                 <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
//               </button>
//               <div className="min-w-0 flex-1">
//                 <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] truncate">
//                   {project.projectName}
//                 </h1>
//                 <p className="text-sm text-[var(--text-secondary)] truncate">
//                   {project.description}
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-center gap-3 flex-shrink-0">
//               <span
//                 className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(projectStatus)}`}
//               >
//                 <span className="w-1.5 h-1.5 rounded-full bg-current" />
//                 {projectStatus || 'Pending'}
//               </span>
//             </div>
//           </div>

//           {/* Project Info */}
//           <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2 sm:gap-4 mt-3 text-xs sm:text-sm">
//             <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
//               <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
//               <span className="text-[var(--text-muted)]">Start:</span>
//               <span className="text-[var(--text-primary)] font-medium">
//                 {formatDateWithTime(project.startDate)}
//               </span>
//             </div>
//             <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
//               <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
//               <span className="text-[var(--text-muted)]">End:</span>
//               <span className="text-[var(--text-primary)] font-medium">
//                 {formatDateWithTime(project.endDate)}
//               </span>
//             </div>
//             <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
//               <CheckCircle className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
//               <span className="text-[var(--text-muted)]">Tasks:</span>
//               <span className="text-[var(--text-primary)] font-medium">
//                 {totalTasks}
//               </span>
//             </div>
//             <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
//               <FileText className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
//               <span className="text-[var(--text-muted)]">Docs:</span>
//               <span className="text-[var(--text-primary)] font-medium">
//                 {project.documents?.length || 0}
//               </span>
//             </div>
//           </div>

//           {/* Progress Bar */}
//           <div className="flex items-center gap-3 mt-3">
//             <span className="text-xs text-[var(--text-muted)]">Progress</span>
//             <div className="flex-1 h-2 bg-[var(--bg-input)] rounded-full overflow-hidden">
//               <div
//                 className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--success)] transition-all duration-500"
//                 style={{ width: `${projectProgress}%` }}
//               />
//             </div>
//             <span className="text-xs font-bold text-[var(--text-secondary)]">
//               {projectProgress}%
//             </span>
//           </div>

//           {/* Tabs */}
//           <div className="flex gap-1 mt-4 border-b border-[var(--border-color)] overflow-x-auto">
//             {['Tasks', 'Documents'].map((tab) => (
//               <button
//                 key={tab}
//                 onClick={() => setCurrentTab(tab)}
//                 className={`py-2.5 px-4 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
//                   currentTab === tab
//                     ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
//                     : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
//                 }`}
//               >
//                 {tab}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Content */}
//         <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6">
//           {currentTab === 'Tasks' && (
//             <div className="space-y-4">
//               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
//                 <div className="flex flex-wrap items-center gap-2">
//                   <h4 className="text-sm font-semibold text-[var(--text-primary)]">
//                     Tasks
//                   </h4>
//                   <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full">
//                     {Object.keys(groupedTasks).length} groups • {totalTasks}{' '}
//                     tasks
//                   </span>
//                   <span className="text-[10px] text-[var(--warning)] bg-[var(--warning)]/10 px-2 py-0.5 rounded-full border border-[var(--warning)]/20">
//                     Max {settings.maxEmployeesPerTask}/task
//                   </span>
//                 </div>
//                 <button
//                   onClick={() => {
//                     resetTaskForm();
//                     setShowTaskForm(true);
//                   }}
//                   className="inline-flex items-center gap-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] px-3 py-1.5 rounded-lg text-sm font-medium transition shadow-lg shadow-[var(--accent-primary)]/20 flex-shrink-0"
//                 >
//                   <Plus className="w-4 h-4" />
//                   Create Task
//                 </button>
//               </div>

//               <div className="space-y-3">
//                 {Object.keys(groupedTasks).length === 0 ? (
//                   <div className="text-center py-12 border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)]">
//                     <FolderOpen className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
//                     <p className="text-[var(--text-secondary)] text-sm">
//                       No tasks yet.
//                     </p>
//                     <p className="text-[var(--text-muted)] text-xs mt-1">
//                       Click "Create Task" to get started.
//                     </p>
//                   </div>
//                 ) : (
//                   Object.keys(groupedTasks).map((taskName) => {
//                     const tasks = groupedTasks[taskName];
//                     const isExpanded = expandedGroups[taskName];
//                     const stats = getGroupStats(tasks);

//                     return (
//                       <div
//                         key={taskName}
//                         className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden"
//                       >
//                         <div
//                           className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2.5 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
//                           onClick={() => toggleGroup(taskName)}
//                         >
//                           <div className="flex items-center gap-2 flex-wrap">
//                             <button className="text-[var(--text-secondary)]">
//                               {isExpanded ? (
//                                 <ChevronDown className="w-4 h-4" />
//                               ) : (
//                                 <ChevronRight className="w-4 h-4" />
//                               )}
//                             </button>
//                             <h4 className="font-semibold text-[var(--text-primary)] text-sm">
//                               {taskName}
//                             </h4>
//                             <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-input)] px-2 py-0.5 rounded-full">
//                               {tasks.length} tasks
//                             </span>
//                             {stats.completed > 0 && (
//                               <span className="text-[10px] text-[var(--success)]">
//                                 {stats.completed} done
//                               </span>
//                             )}
//                             <span className="text-[10px] text-[var(--text-muted)]">
//                               Avg: {stats.avgMarks}
//                             </span>
//                           </div>
//                           <div className="flex items-center gap-1">
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 handleEditTask(tasks[0]);
//                               }}
//                               className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition"
//                             >
//                               <Edit2 className="w-3.5 h-3.5" />
//                             </button>
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 deleteGroup(taskName);
//                               }}
//                               className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition"
//                             >
//                               <Trash2 className="w-3.5 h-3.5" />
//                             </button>
//                           </div>
//                         </div>

//                         {isExpanded && (
//                           <div className="overflow-x-auto">
//                             <table className="w-full text-xs sm:text-sm">
//                               <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
//                                 <tr>
//                                   <th className="px-2 sm:px-4 py-2 text-left text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
//                                     Employee
//                                   </th>
//                                   <th className="px-2 sm:px-4 py-2 text-left text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
//                                     Marks
//                                   </th>
//                                   <th className="px-2 sm:px-4 py-2 text-left text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">
//                                     Basic
//                                   </th>
//                                   <th className="px-2 sm:px-4 py-2 text-left text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">
//                                     Complete
//                                   </th>
//                                   <th className="px-2 sm:px-4 py-2 text-left text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">
//                                     Tested
//                                   </th>
//                                   <th className="px-2 sm:px-4 py-2 text-left text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider hidden lg:table-cell">
//                                     Deadline
//                                   </th>
//                                   <th className="px-2 sm:px-4 py-2 text-left text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
//                                     Action
//                                   </th>
//                                 </tr>
//                               </thead>
//                               <tbody className="divide-y divide-[var(--border-color)]">
//                                 {tasks.map((task) => {
//                                   const assignedUser = getAssignedUser(task);
//                                   const now = new Date();
//                                   const deadline = task.endDate
//                                     ? new Date(task.endDate)
//                                     : null;
//                                   const isDeadlineMissed =
//                                     deadline &&
//                                     deadline < now &&
//                                     !task.completed;

//                                   return (
//                                     <tr
//                                       key={task._id}
//                                       className={`hover:bg-[var(--bg-hover)] transition-colors ${isDeadlineMissed ? 'bg-[var(--danger)]/5' : ''}`}
//                                     >
//                                       <td className="px-2 sm:px-4 py-2">
//                                         {assignedUser ? (
//                                           <div className="flex items-center gap-1.5 sm:gap-2">
//                                             <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-[var(--text-inverse)] text-[8px] sm:text-[10px] font-bold flex-shrink-0">
//                                               {assignedUser.name
//                                                 ?.charAt(0)
//                                                 ?.toUpperCase() || '?'}
//                                             </div>
//                                             <span className="text-xs sm:text-sm text-[var(--text-primary)] truncate max-w-[60px] sm:max-w-[100px]">
//                                               {assignedUser.name ||
//                                                 assignedUser.email ||
//                                                 'Assigned'}
//                                             </span>
//                                             {isDeadlineMissed && (
//                                               <span className="text-[8px] sm:text-[10px] text-[var(--danger)] bg-[var(--danger)]/10 px-1 py-0.5 rounded border border-[var(--danger)]/20 hidden sm:inline">
//                                                 ⚠️
//                                               </span>
//                                             )}
//                                           </div>
//                                         ) : (
//                                           <div className="flex items-center gap-2">
//                                             <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-primary)] text-[8px] sm:text-[10px] font-bold flex-shrink-0">
//                                               ?
//                                             </div>
//                                             <span className="text-xs sm:text-sm text-[var(--text-muted)]">
//                                               Unassigned
//                                             </span>
//                                           </div>
//                                         )}
//                                       </td>

//                                       <td className="px-2 sm:px-4 py-2">
//                                         <span
//                                           className={`text-xs sm:text-sm font-bold ${
//                                             task.obtainedMarks >= 80
//                                               ? 'text-[var(--success)]'
//                                               : task.obtainedMarks >= 50
//                                                 ? 'text-[var(--accent-primary)]'
//                                                 : task.obtainedMarks >= 30
//                                                   ? 'text-[var(--warning)]'
//                                                   : 'text-[var(--danger)]'
//                                           }`}
//                                         >
//                                           {task.obtainedMarks || 0}
//                                         </span>
//                                       </td>

//                                       <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">
//                                         {task.basicWork ? (
//                                           <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
//                                             <Check className="w-3 h-3" />
//                                           </span>
//                                         ) : (
//                                           <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-input)]/50 text-[var(--text-muted)]">
//                                             <X className="w-3 h-3" />
//                                           </span>
//                                         )}
//                                       </td>

//                                       <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">
//                                         {task.completed ? (
//                                           <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--success)]/20 text-[var(--success)]">
//                                             <Check className="w-3 h-3" />
//                                           </span>
//                                         ) : (
//                                           <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-input)]/50 text-[var(--text-muted)]">
//                                             <X className="w-3 h-3" />
//                                           </span>
//                                         )}
//                                       </td>

//                                       <td className="px-2 sm:px-4 py-2 hidden md:table-cell">
//                                         {task.tested ? (
//                                           <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent-light)]/20 text-[var(--accent-light)]">
//                                             <Check className="w-3 h-3" />
//                                           </span>
//                                         ) : (
//                                           <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-input)]/50 text-[var(--text-muted)]">
//                                             <X className="w-3 h-3" />
//                                           </span>
//                                         )}
//                                       </td>

//                                       <td className="px-2 sm:px-4 py-2 hidden lg:table-cell">
//                                         {task.endDate ? (
//                                           <span
//                                             className={`text-[10px] sm:text-xs ${isDeadlineMissed ? 'text-[var(--danger)] font-medium' : 'text-[var(--text-secondary)]'}`}
//                                           >
//                                             {formatDateWithTime(task.endDate)}
//                                             {isDeadlineMissed && ' 🚨'}
//                                           </span>
//                                         ) : (
//                                           <span className="text-[10px] text-[var(--text-muted)]">
//                                             -
//                                           </span>
//                                         )}
//                                       </td>

//                                       <td className="px-2 sm:px-4 py-2">
//                                         <button
//                                           onClick={() =>
//                                             openGiveNumbersModal(task)
//                                           }
//                                           className="inline-flex items-center gap-1 bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-medium transition"
//                                         >
//                                           <Award className="w-3 h-3" />
//                                           <span className="hidden xs:inline">
//                                             Give
//                                           </span>
//                                         </button>
//                                       </td>
//                                     </tr>
//                                   );
//                                 })}
//                               </tbody>
//                             </table>
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })
//                 )}
//               </div>
//             </div>
//           )}

//           {/* Documents Tab */}
//           {currentTab === 'Documents' && (
//             <div className="space-y-6">
//               <div className="bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 rounded-xl p-6 sm:p-10 text-center transition-all duration-300">
//                 <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20">
//                   <Upload className="w-7 h-7 text-[var(--text-muted)]" />
//                 </div>
//                 <label className="cursor-pointer inline-flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] px-5 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-[var(--accent-primary)]/20">
//                   <Plus className="w-4 h-4" />
//                   Upload Document
//                   <input
//                     type="file"
//                     className="hidden"
//                     onChange={(e) =>
//                       e.target.files?.[0] && uploadFile(e.target.files[0])
//                     }
//                   />
//                 </label>
//                 <p className="text-xs text-[var(--text-muted)] mt-2">
//                   PDF, Images — max 10MB
//                 </p>
//               </div>

//               <div>
//                 <div className="flex items-center justify-between mb-3">
//                   <h4 className="text-sm font-semibold text-[var(--text-primary)]">
//                     Documents
//                   </h4>
//                   <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full">
//                     {project.documents?.length || 0} files
//                   </span>
//                 </div>

//                 {!project.documents || project.documents.length === 0 ? (
//                   <div className="text-center py-12 border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)]">
//                     <FileText className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
//                     <p className="text-[var(--text-secondary)] text-sm">
//                       No documents uploaded.
//                     </p>
//                   </div>
//                 ) : (
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
//                     {project.documents.map((doc) => {
//                       const isImage =
//                         doc.fileUrl &&
//                         /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.fileUrl);
//                       return (
//                         <div
//                           key={doc._id}
//                           className="group bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--border-hover)] rounded-xl overflow-hidden transition-all"
//                         >
//                           <div className="relative aspect-video bg-[var(--bg-card)]">
//                             <button
//                               onClick={() => handleRemoveDocument(doc._id)}
//                               className="absolute top-2 right-2 z-10 bg-[var(--danger)]/90 hover:bg-[var(--danger)] text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
//                             >
//                               <X className="w-3 h-3" />
//                             </button>
//                             {isImage ? (
//                               <a
//                                 href={doc.fileUrl}
//                                 target="_blank"
//                                 rel="noopener noreferrer"
//                                 className="block h-full"
//                               >
//                                 <img
//                                   src={doc.fileUrl}
//                                   alt={doc.fileName}
//                                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//                                 />
//                               </a>
//                             ) : (
//                               <a
//                                 href={doc.fileUrl}
//                                 target="_blank"
//                                 rel="noopener noreferrer"
//                                 className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition"
//                               >
//                                 <FileText className="w-10 h-10" />
//                                 <span className="text-xs text-[var(--accent-primary)] mt-1 font-medium">
//                                   View
//                                 </span>
//                               </a>
//                             )}
//                           </div>
//                           <div className="p-2.5 border-t border-[var(--border-color)]">
//                             <p className="text-xs font-medium text-[var(--text-primary)] truncate">
//                               {doc.fileName || 'Untitled'}
//                             </p>
//                             <a
//                               href={doc.fileUrl}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="text-[10px] text-[var(--accent-primary)] hover:text-[var(--accent-hover)] mt-1 inline-flex items-center gap-1 transition"
//                             >
//                               <Eye className="w-3 h-3" />
//                               Open
//                             </a>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Task Form Modal */}
//         {showTaskForm && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
//             <div
//               className="absolute inset-0"
//               onClick={() => {
//                 setShowTaskForm(false);
//                 resetTaskForm();
//               }}
//             />
//             <div className="bg-[var(--bg-card)] w-full max-w-3xl max-h-[95vh] flex flex-col border border-[var(--border-color)] rounded-xl overflow-hidden relative z-10 shadow-2xl">
//               <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 sm:px-6 py-3 bg-[var(--bg-secondary)]">
//                 <div className="flex items-center gap-3">
//                   <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20">
//                     {editTask ? (
//                       <Edit2 className="w-4 h-4 text-[var(--accent-primary)]" />
//                     ) : (
//                       <Plus className="w-4 h-4 text-[var(--accent-primary)]" />
//                     )}
//                   </div>
//                   <div>
//                     <h4 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
//                       {editTask ? 'Edit Task' : 'Create Task'}
//                     </h4>
//                     <p className="text-xs text-[var(--text-muted)]">
//                       {editTask ? 'Update task details' : 'Add a new task'}
//                     </p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => {
//                     setShowTaskForm(false);
//                     resetTaskForm();
//                   }}
//                   className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>

//               <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
//                   <div className="space-y-3 sm:space-y-4">
//                     <div>
//                       <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
//                         Task Title{' '}
//                         <span className="text-[var(--danger)]">*</span>
//                       </label>
//                       <input
//                         name="name"
//                         placeholder="Enter task name"
//                         value={taskForm.name}
//                         onChange={handleTaskChange}
//                         className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
//                         Description
//                       </label>
//                       <textarea
//                         name="description"
//                         placeholder="Describe the task..."
//                         value={taskForm.description}
//                         onChange={handleTaskChange}
//                         rows="2"
//                         className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg px-3 py-2 text-sm outline-none transition-colors resize-none"
//                       />
//                     </div>

//                     {/* Employee Selector */}
//                     <div className="relative">
//                       <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
//                         Assign Employees{' '}
//                         <span className="text-[var(--danger)]">*</span>
//                         <span className="text-[var(--text-muted)] ml-1">
//                           (Max {settings.maxEmployeesPerTask})
//                         </span>
//                       </label>

//                       {taskForm.selectedEmployees.length > 0 && (
//                         <div className="flex flex-wrap gap-1 mb-2">
//                           {taskForm.selectedEmployees.map((emp) => (
//                             <span
//                               key={emp._id}
//                               className="inline-flex items-center gap-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 px-2 py-0.5 rounded-lg text-[10px]"
//                             >
//                               <User className="w-3 h-3" />
//                               {emp.name || emp.email}
//                               <button
//                                 type="button"
//                                 onClick={() => removeEmployeeFromTask(emp._id)}
//                                 className="hover:text-[var(--danger)] transition ml-0.5"
//                               >
//                                 <X className="w-2.5 h-2.5" />
//                               </button>
//                             </span>
//                           ))}
//                         </div>
//                       )}

//                       <div className="relative">
//                         <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
//                         <input
//                           type="text"
//                           value={searchEmployee}
//                           onChange={(e) => {
//                             setSearchEmployee(e.target.value);
//                             setShowEmployeeDropdown(true);
//                           }}
//                           onFocus={() => setShowEmployeeDropdown(true)}
//                           placeholder={
//                             taskForm.selectedEmployees.length >=
//                             settings.maxEmployeesPerTask
//                               ? 'Maximum limit reached'
//                               : 'Search employees...'
//                           }
//                           disabled={
//                             taskForm.selectedEmployees.length >=
//                             settings.maxEmployeesPerTask
//                           }
//                           className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg pl-8 pr-3 py-2 text-sm outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                         />
//                       </div>

//                       {showEmployeeDropdown && filteredEmployees.length > 0 && (
//                         <div className="absolute z-20 w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-xl max-h-36 overflow-y-auto custom-scrollbar">
//                           {filteredEmployees.map((emp) => (
//                             <button
//                               key={emp._id}
//                               type="button"
//                               onClick={() => addEmployeeToTask(emp)}
//                               className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--bg-hover)] transition text-left"
//                             >
//                               <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center flex-shrink-0">
//                                 <User className="w-3 h-3 text-[var(--accent-primary)]" />
//                               </div>
//                               <div className="min-w-0">
//                                 <p className="text-xs text-[var(--text-primary)] truncate">
//                                   {emp.name || 'Unknown'}
//                                 </p>
//                                 <p className="text-[9px] text-[var(--text-muted)] truncate">
//                                   {emp.email}
//                                 </p>
//                               </div>
//                             </button>
//                           ))}
//                         </div>
//                       )}
//                     </div>

//                     {/* ✅ UPDATED: DateTime inputs */}
//                     <div className="grid grid-cols-2 gap-3">
//                       <div>
//                         <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
//                           Start Date & Time
//                         </label>
//                         <input
//                           type="datetime-local"
//                           name="startDate"
//                           value={taskForm.startDate}
//                           onChange={handleTaskChange}
//                           className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
//                           Deadline & Time
//                         </label>
//                         <input
//                           type="datetime-local"
//                           name="deadline"
//                           value={taskForm.deadline}
//                           onChange={handleTaskChange}
//                           className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
//                         />
//                       </div>
//                     </div>
//                   </div>

//                   <div className="space-y-3 sm:space-y-4">
//                     <div>
//                       <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
//                         Marks{' '}
//                         <span className="text-[var(--text-muted)]">
//                           (0-100)
//                         </span>
//                       </label>
//                       <input
//                         type="number"
//                         name="obtainedMarks"
//                         min="0"
//                         max="100"
//                         value={taskForm.obtainedMarks}
//                         onChange={handleTaskChange}
//                         placeholder="Enter marks"
//                         className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
//                       />
//                     </div>

//                     <div className="flex flex-col sm:flex-row gap-2 pt-2">
//                       <button
//                         onClick={editTask ? updateTask : addTask}
//                         disabled={
//                           taskForm.selectedEmployees.length === 0 ||
//                           !taskForm.name ||
//                           taskForm.selectedEmployees.length >
//                             settings.maxEmployeesPerTask
//                         }
//                         className={`flex-1 font-medium py-2 rounded-lg text-sm transition ${
//                           taskForm.selectedEmployees.length === 0 ||
//                           !taskForm.name ||
//                           taskForm.selectedEmployees.length >
//                             settings.maxEmployeesPerTask
//                             ? 'bg-[var(--bg-input)] text-[var(--text-muted)] cursor-not-allowed'
//                             : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] shadow-lg shadow-[var(--accent-primary)]/20'
//                         }`}
//                       >
//                         {editTask
//                           ? 'Update Task'
//                           : `Assign (${taskForm.selectedEmployees.length})`}
//                       </button>
//                       <button
//                         onClick={() => {
//                           resetTaskForm();
//                           setShowTaskForm(false);
//                         }}
//                         className="px-4 py-2 rounded-lg bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] text-sm font-medium transition border border-[var(--border-color)]"
//                       >
//                         Cancel
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Give Numbers Modal */}
//         {showGiveNumbersModal && selectedTaskForNumbers && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
//             <div
//               className="absolute inset-0"
//               onClick={() => {
//                 setShowGiveNumbersModal(false);
//                 setSelectedTaskForNumbers(null);
//               }}
//             />
//             <div className="bg-[var(--bg-card)] w-full max-w-md border border-[var(--border-color)] rounded-xl overflow-hidden relative z-10 shadow-2xl">
//               <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 sm:px-6 py-3 bg-[var(--bg-secondary)]">
//                 <div className="flex items-center gap-3">
//                   <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20">
//                     <Award className="w-4 h-4 text-[var(--accent-primary)]" />
//                   </div>
//                   <div>
//                     <h4 className="text-base font-semibold text-[var(--text-primary)]">
//                       Give Numbers
//                     </h4>
//                     <p className="text-xs text-[var(--text-muted)] truncate max-w-[120px] sm:max-w-[200px]">
//                       {selectedTaskForNumbers.name}
//                     </p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => {
//                     setShowGiveNumbersModal(false);
//                     setSelectedTaskForNumbers(null);
//                   }}
//                   className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>

//               <div className="p-4 sm:p-6 space-y-4">
//                 {getAssignedUser(selectedTaskForNumbers) && (
//                   <div className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
//                     <div className="w-9 h-9 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-[var(--text-inverse)] text-sm font-bold flex-shrink-0">
//                       {getAssignedUser(selectedTaskForNumbers)
//                         ?.name?.charAt(0)
//                         ?.toUpperCase() || '?'}
//                     </div>
//                     <div className="min-w-0">
//                       <p className="font-medium text-[var(--text-primary)] text-sm truncate">
//                         {getAssignedUser(selectedTaskForNumbers)?.name ||
//                           'Unknown'}
//                       </p>
//                       <p className="text-xs text-[var(--text-muted)] truncate">
//                         {getAssignedUser(selectedTaskForNumbers)?.email || ''}
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 <div>
//                   <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
//                     Marks{' '}
//                     <span className="text-[var(--text-muted)]">(0-{selectedTaskForNumbers?.maxMarks || 100})</span>
//                   </label>
//                   <input
//                     type="number"
//                     name="marks"
//                     min="0"
//                     max={selectedTaskForNumbers?.maxMarks || 100}
//                     value={numbersForm.marks}
//                     onChange={handleNumbersChange}
//                     className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
//                   />
//                   <p className="text-xs text-[var(--text-muted)] mt-1">
//                     Maximum marks for this task: <span className="font-semibold text-[var(--text-primary)]">{selectedTaskForNumbers?.maxMarks || 100}</span>
//                   </p>
//                 </div>

//                 <div className="space-y-1.5">
//                   <div className="flex items-center gap-3 p-1.5 hover:bg-[var(--bg-hover)] rounded-lg transition">
//                     <input
//                       type="checkbox"
//                       id="basicWork"
//                       name="basicWork"
//                       checked={numbersForm.basicWork}
//                       onChange={handleNumbersChange}
//                       className="w-4 h-4 rounded border-[var(--border-color)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] focus:ring-2"
//                     />
//                     <label
//                       htmlFor="basicWork"
//                       className="text-sm text-[var(--text-primary)] cursor-pointer"
//                     >
//                       Basic Work
//                     </label>
//                   </div>
//                   <div className="flex items-center gap-3 p-1.5 hover:bg-[var(--bg-hover)] rounded-lg transition">
//                     <input
//                       type="checkbox"
//                       id="completed"
//                       name="completed"
//                       checked={numbersForm.completed}
//                       onChange={handleNumbersChange}
//                       className="w-4 h-4 rounded border-[var(--border-color)] text-[var(--success)] focus:ring-[var(--success)] focus:ring-2"
//                     />
//                     <label
//                       htmlFor="completed"
//                       className="text-sm text-[var(--text-primary)] cursor-pointer"
//                     >
//                       Completed
//                     </label>
//                   </div>
//                   <div className="flex items-center gap-3 p-1.5 hover:bg-[var(--bg-hover)] rounded-lg transition">
//                     <input
//                       type="checkbox"
//                       id="tested"
//                       name="tested"
//                       checked={numbersForm.tested}
//                       onChange={handleNumbersChange}
//                       className="w-4 h-4 rounded border-[var(--border-color)] text-[var(--accent-light)] focus:ring-[var(--accent-light)] focus:ring-2"
//                     />
//                     <label
//                       htmlFor="tested"
//                       className="text-sm text-[var(--text-primary)] cursor-pointer"
//                     >
//                       Tested
//                     </label>
//                   </div>
//                 </div>

//                 <div className="flex gap-3 pt-3 border-t border-[var(--border-color)]">
//                   <button
//                     onClick={submitNumbers}
//                     className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] font-medium py-2 rounded-lg text-sm transition shadow-lg shadow-[var(--accent-primary)]/20"
//                   >
//                     Assign Numbers
//                   </button>
//                   <button
//                     onClick={() => {
//                       setShowGiveNumbersModal(false);
//                       setSelectedTaskForNumbers(null);
//                     }}
//                     className="px-4 py-2 rounded-lg bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] text-sm font-medium transition border border-[var(--border-color)]"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </>
//   );
// };

// export default ProjectDetail;




import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../service/api.js';
import {
  ArrowLeft,
  Calendar,
  FileText,
  CheckCircle,
  FolderOpen,
  User,
  Plus,
  Edit2,
  Trash2,
  Upload,
  X,
  Eye,
  Briefcase,
  Search,
  Users,
  Check,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Award,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import SSIPageLoader from '../../components/SSIPageLoader.jsx';

const API_BASE_URL = '/projects';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [currentTab, setCurrentTab] = useState('Tasks');
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [editTask, setEditTask] = useState(null);
  const [isEditingMultiple, setIsEditingMultiple] = useState(false);
  const [allTasksWithSameName, setAllTasksWithSameName] = useState([]);

  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    obtainedMarks: 0,
    selectedEmployees: [],
    startDate: '',
    deadline: '',
  });

  const initialTaskFormState = {
    name: '',
    description: '',
    obtainedMarks: 0,
    selectedEmployees: [],
    startDate: '',
    deadline: '',
  };

  const [searchEmployee, setSearchEmployee] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  const [showGiveNumbersModal, setShowGiveNumbersModal] = useState(false);
  const [selectedTaskForNumbers, setSelectedTaskForNumbers] = useState(null);
  const [numbersForm, setNumbersForm] = useState({
    marks: 0,
    basicWork: false,
    completed: false,
    tested: false,
  });

  // ✅ LOADING STATES FOR BUTTONS
  const [taskLoading, setTaskLoading] = useState(false);
  const [numbersLoading, setNumbersLoading] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentDeleting, setDocumentDeleting] = useState(false);
  const [groupDeleting, setGroupDeleting] = useState(null);

  const [settings, setSettings] = useState({
    maxEmployeesPerTask: 5,
    allowMultipleAssignees: true,
    defaultTaskStatus: 'Pending',
    maxTasksPerProject: 100,
  });

  // ================= FORMAT DATE WITH TIME =================
  const formatDateTimeLocal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  };

  const formatDateWithTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ================= MEMOIZED VALUES =================
  const groupedTasks = useMemo(() => {
    if (!project?.tasks) return {};
    const groups = {};
    project.tasks.forEach((task) => {
      const taskName = task.name || 'Unnamed Task';
      if (!groups[taskName]) groups[taskName] = [];
      groups[taskName].push(task);
    });
    return groups;
  }, [project?.tasks]);

  const totalTasks = useMemo(
    () => project?.tasks?.length || 0,
    [project?.tasks]
  );
  const completedTasks = useMemo(
    () => project?.tasks?.filter((t) => t.completed && t.tested).length || 0,
    [project?.tasks]
  );
  const projectProgress = useMemo(
    () =>
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    [totalTasks, completedTasks]
  );

  // ================= FETCH FUNCTIONS =================
  const fetchProject = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`${API_BASE_URL}/${projectId}`);
      setProject(res.data);
    } catch (err) {
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get('/user/all-users');
      let usersData = res.data.users || res.data.data || res.data || [];
      const allUsers = Array.isArray(usersData) ? usersData : [];
      setUsers(allUsers.filter((user) => user.role === 'employee'));
    } catch (error) {
      setUsers([]);
    }
  }, []);

  const fetchAllSettings = useCallback(async () => {
    try {
      const res = await api.get('/settings');
      if (res.data && Array.isArray(res.data)) {
        const settingsMap = {};
        res.data.forEach((setting) => {
          settingsMap[setting.key] = setting.value;
        });
        setSettings((prev) => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {}
  }, []);

  useEffect(() => {
    fetchProject();
    fetchEmployees();
    fetchAllSettings();
  }, [projectId, fetchProject, fetchEmployees, fetchAllSettings]);

  // ================= CHECK DEADLINE WITH TIME =================
  useEffect(() => {
    if (!project?.tasks) return;

    const now = new Date();
    let updated = false;

    const updateTasks = async () => {
      for (const task of project.tasks) {
        if (task.endDate && !task.completed) {
          const deadline = new Date(task.endDate);
          if (deadline < now && task.obtainedMarks !== 0) {
            updated = true;
            try {
              await api.put(`${API_BASE_URL}/${projectId}/tasks/${task._id}`, {
                obtainedMarks: 0,
                basicWork: task.basicWork || false,
                completed: task.completed || false,
                tested: task.tested || false,
              });
            } catch (error) {}
          }
        }
      }
      if (updated) {
        await fetchProject();
        toast.warning(
          '🚨 Some tasks had their marks reset to 0 due to missed deadlines!'
        );
      }
    };

    updateTasks();
  }, [projectId, project?._id, project?.tasks, fetchProject]);

  // ================= CALCULATE PROJECT STATUS =================
  const calculateProjectStatus = (tasks) => {
    if (!tasks || tasks.length === 0) return 'Pending';

    let completedCount = 0,
      inProgressCount = 0,
      pendingCount = 0;

    tasks.forEach((task) => {
      if (task.completed === true && task.tested === true) {
        completedCount++;
      } else if (task.basicWork === true && task.completed === false) {
        inProgressCount++;
      } else if (task.basicWork === false && task.completed === false) {
        pendingCount++;
      } else if (task.completed === true && task.tested === false) {
        inProgressCount++;
      }
    });

    if (completedCount === tasks.length && completedCount > 0)
      return 'Completed';
    if (inProgressCount > 0) return 'In Progress';
    if (pendingCount === tasks.length) return 'Pending';
    if (completedCount > 0 && pendingCount > 0) return 'In Progress';
    return 'Pending';
  };

  const projectStatus = useMemo(
    () => calculateProjectStatus(project?.tasks),
    [project?.tasks]
  );

  // ================= TASK HANDLERS =================
  const handleTaskChange = (e) => {
    const { name, value } = e.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const addEmployeeToTask = (employee) => {
    if (
      !settings.allowMultipleAssignees &&
      taskForm.selectedEmployees.length >= 1
    ) {
      toast.error('Multiple assignees are disabled by admin.');
      return;
    }
    if (taskForm.selectedEmployees.length >= settings.maxEmployeesPerTask) {
      toast.error(`Maximum ${settings.maxEmployeesPerTask} employees allowed.`);
      return;
    }
    if (taskForm.selectedEmployees.find((emp) => emp._id === employee._id)) {
      toast.warning('Employee already assigned.');
      return;
    }

    setTaskForm((prev) => ({
      ...prev,
      selectedEmployees: [...prev.selectedEmployees, employee],
    }));
    setSearchEmployee('');
    setShowEmployeeDropdown(false);
    toast.success(`${employee.name || employee.email} added to task`);
  };

  const removeEmployeeFromTask = (employeeId) => {
    setTaskForm((prev) => ({
      ...prev,
      selectedEmployees: prev.selectedEmployees.filter(
        (emp) => emp._id !== employeeId
      ),
    }));
  };

  const filteredEmployees = useMemo(() => {
    return users.filter((emp) => {
      const matchesSearch = emp.name
        ?.toLowerCase()
        .includes(searchEmployee.toLowerCase());
      const alreadySelected = taskForm.selectedEmployees.some(
        (selected) => selected._id === emp._id
      );
      const limitReached =
        taskForm.selectedEmployees.length >= settings.maxEmployeesPerTask;
      const multipleDisabled =
        !settings.allowMultipleAssignees &&
        taskForm.selectedEmployees.length >= 1;
      return (
        matchesSearch && !alreadySelected && !limitReached && !multipleDisabled
      );
    });
  }, [
    users,
    searchEmployee,
    taskForm.selectedEmployees,
    settings.maxEmployeesPerTask,
    settings.allowMultipleAssignees,
  ]);

  const toggleGroup = (taskName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [taskName]: !prev[taskName],
    }));
  };

  const resetTaskForm = () => {
    setEditTask(null);
    setIsEditingMultiple(false);
    setAllTasksWithSameName([]);
    setTaskForm(initialTaskFormState);
    setSearchEmployee('');
    setShowEmployeeDropdown(false);
  };

  // ================= CRUD OPERATIONS =================
  const addTask = async () => {
    if (taskForm.selectedEmployees.length === 0) {
      toast.error('Please select at least one employee.');
      return;
    }
    if (taskForm.selectedEmployees.length > settings.maxEmployeesPerTask) {
      toast.error(`Maximum ${settings.maxEmployeesPerTask} employees allowed.`);
      return;
    }
    if (
      !settings.allowMultipleAssignees &&
      taskForm.selectedEmployees.length > 1
    ) {
      toast.error('Multiple assignees disabled by admin.');
      return;
    }

    setTaskLoading(true);
    try {
      const promises = taskForm.selectedEmployees.map((employee) => {
        const taskData = {
          name: taskForm.name,
          description: taskForm.description,
          basicWork: false,
          completed: false,
          tested: false,
          obtainedMarks: Number(taskForm.obtainedMarks) || 0,
          user: employee._id,
          startDate: convertToUTC(taskForm.startDate),
          endDate: convertToUTC(taskForm.deadline),
        };
        return api.post(`${API_BASE_URL}/${projectId}/tasks`, taskData);
      });

      await Promise.all(promises);
      await fetchProject();
      resetTaskForm();
      setShowTaskForm(false);
      if (taskForm.name) {
        setExpandedGroups((prev) => ({ ...prev, [taskForm.name]: true }));
      }
      toast.success(`${taskForm.selectedEmployees.length} task(s) added!`);
    } catch (err) {
      toast.error('Failed to add tasks');
    } finally {
      setTaskLoading(false);
    }
  };

  const updateTask = async () => {
    setTaskLoading(true);
    try {
      if (taskForm.selectedEmployees.length === 0) {
        toast.error('Please select at least one employee.');
        return;
      }

      const tasksWithSameName = project.tasks.filter(
        (t) => t.name === editTask.name
      );
      const selectedUserIds = taskForm.selectedEmployees.map((emp) => emp._id);
      const currentUserIds = tasksWithSameName
        .map((t) => {
          let uid = t.user;
          if (typeof uid === 'object' && uid?._id) uid = uid._id;
          return uid?.toString();
        })
        .filter(Boolean);

      const usersToAdd = selectedUserIds.filter(
        (uid) => !currentUserIds.includes(uid?.toString())
      );
      const usersToRemove = currentUserIds.filter(
        (uid) => !selectedUserIds.includes(uid?.toString())
      );

      for (const userId of usersToRemove) {
        const taskToDelete = tasksWithSameName.find((t) => {
          let uid = t.user;
          if (typeof uid === 'object' && uid?._id) uid = uid._id;
          return uid?.toString() === userId;
        });
        if (taskToDelete) {
          await api.delete(
            `${API_BASE_URL}/${projectId}/tasks/${taskToDelete._id}`
          );
        }
      }

      const tasksToKeep = tasksWithSameName.filter((t) => {
        let uid = t.user;
        if (typeof uid === 'object' && uid?._id) uid = uid._id;
        return selectedUserIds.includes(uid?.toString());
      });

      for (const task of tasksToKeep) {
        await api.put(`${API_BASE_URL}/${projectId}/tasks/${task._id}`, {
          name: taskForm.name,
          description: taskForm.description,
          obtainedMarks: Number(taskForm.obtainedMarks),
          startDate: convertToUTC(taskForm.startDate),
          endDate: convertToUTC(taskForm.deadline),
        });
      }

      for (const userId of usersToAdd) {
        await api.post(`${API_BASE_URL}/${projectId}/tasks`, {
          name: taskForm.name,
          description: taskForm.description,
          basicWork: false,
          completed: false,
          tested: false,
          obtainedMarks: Number(taskForm.obtainedMarks),
          user: userId,
          startDate: taskForm.startDate,
          endDate: taskForm.deadline,
        });
      }

      await fetchProject();
      resetTaskForm();
      setShowTaskForm(false);
      toast.success('Task updated successfully!');
    } catch (error) {
      toast.error('Failed to update task');
    } finally {
      setTaskLoading(false);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`${API_BASE_URL}/${projectId}/tasks/${taskId}`);
      await fetchProject();
      toast.success('Task deleted!');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const deleteGroup = async (taskName) => {
    const tasksToDelete = project.tasks.filter((t) => t.name === taskName);
    if (!window.confirm(`Delete all ${tasksToDelete.length} tasks?`)) return;

    setGroupDeleting(taskName);
    try {
      const promises = tasksToDelete.map((task) =>
        api.delete(`${API_BASE_URL}/${projectId}/tasks/${task._id}`)
      );
      await Promise.all(promises);
      await fetchProject();
      toast.success(`Group "${taskName}" deleted!`);
    } catch (error) {
      toast.error('Failed to delete group');
    } finally {
      setGroupDeleting(null);
    }
  };

  const handleEditTask = (task) => {
    setEditTask(task);
    const sameNameTasks = project.tasks.filter((t) => t.name === task.name);
    setAllTasksWithSameName(sameNameTasks);
    setIsEditingMultiple(sameNameTasks.length > 1);

    const allEmployees = [];
    const seenIds = new Set();

    sameNameTasks.forEach((t) => {
      if (t.user) {
        let userId = typeof t.user === 'object' ? t.user._id : t.user;
        if (!seenIds.has(userId?.toString())) {
          seenIds.add(userId?.toString());
          const foundUser = users.find((u) => u._id === userId?.toString());
          allEmployees.push(
            foundUser || { _id: userId, name: 'Unknown', email: '' }
          );
        }
      }
    });

    const firstTask = sameNameTasks[0] || task;
    setTaskForm({
      name: firstTask.name || '',
      description: firstTask.description || '',
      obtainedMarks: firstTask.obtainedMarks || 0,
      selectedEmployees: allEmployees,
      startDate: formatDateTimeLocal(firstTask.startDate),
      deadline: formatDateTimeLocal(firstTask.endDate),
    });
    setShowTaskForm(true);
  };

  const openGiveNumbersModal = (task) => {
    setSelectedTaskForNumbers(task);
    setNumbersForm({
      marks: task.obtainedMarks || 0,
      basicWork: task.basicWork || false,
      completed: task.completed || false,
      tested: task.tested || false,
    });
    setShowGiveNumbersModal(true);
  };

  const handleNumbersChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setNumbersForm((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (name === 'marks') {
      // Clamp marks: must be >= 0 and <= task's maxMarks
      const taskMaxMarks = selectedTaskForNumbers?.maxMarks || 100;
      const clampedValue = Math.min(Math.max(0, Number(value) || 0), taskMaxMarks);
      setNumbersForm((prev) => ({
        ...prev,
        marks: clampedValue,
      }));
    } else {
      setNumbersForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const submitNumbers = async () => {
    if (!selectedTaskForNumbers) return;
    setNumbersLoading(true);
    try {
      await api.put(
        `${API_BASE_URL}/${projectId}/tasks/${selectedTaskForNumbers._id}`,
        {
          obtainedMarks: Number(numbersForm.marks),
          basicWork: numbersForm.basicWork,
          completed: numbersForm.completed,
          tested: numbersForm.tested,
        }
      );
      await fetchProject();
      setShowGiveNumbersModal(false);
      setSelectedTaskForNumbers(null);
      toast.success('Numbers assigned!');
    } catch (error) {
      toast.error('Failed to assign numbers');
    } finally {
      setNumbersLoading(false);
    }
  };

  const uploadFile = async (file) => {
    setDocumentUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`${API_BASE_URL}/${projectId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchProject();
      toast.success('Document uploaded!');
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setDocumentUploading(false);
    }
  };

  const handleRemoveDocument = async (documentId) => {
    if (!window.confirm('Delete this document?')) return;
    setDocumentDeleting(true);
    try {
      await api.delete(`${API_BASE_URL}/${projectId}/documents/${documentId}`);
      await fetchProject();
      toast.success('Document deleted!');
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setDocumentDeleting(false);
    }
  };

  // ================= HELPERS =================
  const getStatusColor = (status) => {
    const colors = {
      Completed:
        'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20',
      'In Progress':
        'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20',
      Pending:
        'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20',
    };
    return (
      colors[status] ||
      'bg-[var(--border-color)] text-[var(--text-muted)] border-[var(--border-color)]'
    );
  };

  const getStatusIcon = (status) => {
    const icons = {
      Completed: <CheckCircle className="w-3 h-3" />,
      'In Progress': <Clock className="w-3 h-3" />,
      Pending: <AlertCircle className="w-3 h-3" />,
    };
    return icons[status] || <AlertCircle className="w-3 h-3" />;
  };

  const getAssignedUser = (task) => {
    if (!task) return null;
    if (
      task.user &&
      typeof task.user === 'object' &&
      task.user._id &&
      task.user.name
    ) {
      return task.user;
    }
    if (typeof task.user === 'string') {
      const found = users.find((u) => u._id === task.user);
      return found || { _id: task.user, name: 'Unknown', email: '' };
    }
    if (task.users && Array.isArray(task.users) && task.users.length > 0) {
      const firstUser = task.users[0];
      if (typeof firstUser === 'object' && firstUser._id) {
        const found = users.find((u) => u._id === firstUser._id.toString());
        return found || firstUser;
      }
    }
    return null;
  };

  const getGroupStats = (tasks) => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const totalMarks = tasks.reduce(
      (sum, t) => sum + (t.obtainedMarks || 0),
      0
    );
    const avgMarks = total > 0 ? Math.round(totalMarks / total) : 0;
    return { total, completed, totalMarks, avgMarks };
  };

  if (loading) {
    return <SSIPageLoader message="Loading project..." />;
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FolderOpen className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
        <p className="text-[var(--text-secondary)] text-lg">
          Project not found
        </p>
        <button
          onClick={() => navigate('/admin/project')}
          className="mt-4 text-[var(--accent-primary)] hover:text-[var(--accent-hover)] text-sm font-medium transition"
        >
          Go back to projects
        </button>
      </div>
    );
  }

  const convertToUTC = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toISOString(); // Converts to UTC
}; 

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          },
        }}
      />
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden">
        {/* Header */}
        <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => navigate('/admin/project')}
                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] truncate">
                  {project.projectName}
                </h1>
                <p className="text-sm text-[var(--text-secondary)] truncate">
                  {project.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(projectStatus)}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {projectStatus || 'Pending'}
              </span>
            </div>
          </div>

          {/* Project Info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2 sm:gap-4 mt-3 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
              <span className="text-[var(--text-muted)]">Start:</span>
              <span className="text-[var(--text-primary)] font-medium">
                {formatDateWithTime(project.startDate)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
              <span className="text-[var(--text-muted)]">End:</span>
              <span className="text-[var(--text-primary)] font-medium">
                {formatDateWithTime(project.endDate)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <CheckCircle className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
              <span className="text-[var(--text-muted)]">Tasks:</span>
              <span className="text-[var(--text-primary)] font-medium">
                {totalTasks}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <FileText className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
              <span className="text-[var(--text-muted)]">Docs:</span>
              <span className="text-[var(--text-primary)] font-medium">
                {project.documents?.length || 0}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-[var(--text-muted)]">Progress</span>
            <div className="flex-1 h-2 bg-[var(--bg-input)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--success)] transition-all duration-500"
                style={{ width: `${projectProgress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              {projectProgress}%
            </span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 border-b border-[var(--border-color)] overflow-x-auto">
            {['Tasks', 'Documents'].map((tab) => (
              <button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={`py-2.5 px-4 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  currentTab === tab
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6">
          {currentTab === 'Tasks' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                    Tasks
                  </h4>
                  <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full">
                    {Object.keys(groupedTasks).length} groups • {totalTasks}{' '}
                    tasks
                  </span>
                  <span className="text-[10px] text-[var(--warning)] bg-[var(--warning)]/10 px-2 py-0.5 rounded-full border border-[var(--warning)]/20">
                    Max {settings.maxEmployeesPerTask}/task
                  </span>
                </div>
                <button
                  onClick={() => {
                    resetTaskForm();
                    setShowTaskForm(true);
                  }}
                  className="inline-flex items-center gap-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] px-3 py-1.5 rounded-lg text-sm font-medium transition shadow-lg shadow-[var(--accent-primary)]/20 flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Create Task
                </button>
              </div>

              <div className="space-y-3">
                {Object.keys(groupedTasks).length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)]">
                    <FolderOpen className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="text-[var(--text-secondary)] text-sm">
                      No tasks yet.
                    </p>
                    <p className="text-[var(--text-muted)] text-xs mt-1">
                      Click "Create Task" to get started.
                    </p>
                  </div>
                ) : (
                  Object.keys(groupedTasks).map((taskName) => {
                    const tasks = groupedTasks[taskName];
                    const isExpanded = expandedGroups[taskName];
                    const stats = getGroupStats(tasks);

                    return (
                      <div
                        key={taskName}
                        className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden"
                      >
                        <div
                          className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2.5 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                          onClick={() => toggleGroup(taskName)}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <button className="text-[var(--text-secondary)]">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            <h4 className="font-semibold text-[var(--text-primary)] text-sm">
                              {taskName}
                            </h4>
                            <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-input)] px-2 py-0.5 rounded-full">
                              {tasks.length} tasks
                            </span>
                            {stats.completed > 0 && (
                              <span className="text-[10px] text-[var(--success)]">
                                {stats.completed} done
                              </span>
                            )}
                            <span className="text-[10px] text-[var(--text-muted)]">
                              Avg: {stats.avgMarks}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTask(tasks[0]);
                              }}
                              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteGroup(taskName);
                              }}
                              disabled={groupDeleting === taskName}
                              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {groupDeleting === taskName ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs sm:text-sm">
                              <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                                <tr>
                                  <th className="px-2 sm:px-4 py-2 text-left text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                    Employee
                                  </th>
                                  <th className="px-2 sm:px-4 py-2 text-left text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                    Marks
                                  </th>
                                  <th className="px-2 sm:px-4 py-2 text-left text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">
                                    Basic
                                  </th>
                                  <th className="px-2 sm:px-4 py-2 text-left text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">
                                    Complete
                                  </th>
                                  <th className="px-2 sm:px-4 py-2 text-left text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">
                                    Tested
                                  </th>
                                  <th className="px-2 sm:px-4 py-2 text-left text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider hidden lg:table-cell">
                                    Deadline
                                  </th>
                                  <th className="px-2 sm:px-4 py-2 text-left text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                                    Action
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border-color)]">
                                {tasks.map((task) => {
                                  const assignedUser = getAssignedUser(task);
                                  const now = new Date();
                                  const deadline = task.endDate
                                    ? new Date(task.endDate)
                                    : null;
                                  const isDeadlineMissed =
                                    deadline &&
                                    deadline < now &&
                                    !task.completed;

                                  return (
                                    <tr
                                      key={task._id}
                                      className={`hover:bg-[var(--bg-hover)] transition-colors ${isDeadlineMissed ? 'bg-[var(--danger)]/5' : ''}`}
                                    >
                                      <td className="px-2 sm:px-4 py-2">
                                        {assignedUser ? (
                                          <div className="flex items-center gap-1.5 sm:gap-2">
                                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-[var(--text-inverse)] text-[8px] sm:text-[10px] font-bold flex-shrink-0">
                                              {assignedUser.name
                                                ?.charAt(0)
                                                ?.toUpperCase() || '?'}
                                            </div>
                                            <span className="text-xs sm:text-sm text-[var(--text-primary)] truncate max-w-[60px] sm:max-w-[100px]">
                                              {assignedUser.name ||
                                                assignedUser.email ||
                                                'Assigned'}
                                            </span>
                                            {isDeadlineMissed && (
                                              <span className="text-[8px] sm:text-[10px] text-[var(--danger)] bg-[var(--danger)]/10 px-1 py-0.5 rounded border border-[var(--danger)]/20 hidden sm:inline">
                                                ⚠️
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-primary)] text-[8px] sm:text-[10px] font-bold flex-shrink-0">
                                              ?
                                            </div>
                                            <span className="text-xs sm:text-sm text-[var(--text-muted)]">
                                              Unassigned
                                            </span>
                                          </div>
                                        )}
                                      </td>

                                      <td className="px-2 sm:px-4 py-2">
                                        <span
                                          className={`text-xs sm:text-sm font-bold ${
                                            task.obtainedMarks >= 80
                                              ? 'text-[var(--success)]'
                                              : task.obtainedMarks >= 50
                                                ? 'text-[var(--accent-primary)]'
                                                : task.obtainedMarks >= 30
                                                  ? 'text-[var(--warning)]'
                                                  : 'text-[var(--danger)]'
                                          }`}
                                        >
                                          {task.obtainedMarks || 0}
                                        </span>
                                      </td>

                                      <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">
                                        {task.basicWork ? (
                                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
                                            <Check className="w-3 h-3" />
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-input)]/50 text-[var(--text-muted)]">
                                            <X className="w-3 h-3" />
                                          </span>
                                        )}
                                      </td>

                                      <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">
                                        {task.completed ? (
                                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--success)]/20 text-[var(--success)]">
                                            <Check className="w-3 h-3" />
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-input)]/50 text-[var(--text-muted)]">
                                            <X className="w-3 h-3" />
                                          </span>
                                        )}
                                      </td>

                                      <td className="px-2 sm:px-4 py-2 hidden md:table-cell">
                                        {task.tested ? (
                                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent-light)]/20 text-[var(--accent-light)]">
                                            <Check className="w-3 h-3" />
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-input)]/50 text-[var(--text-muted)]">
                                            <X className="w-3 h-3" />
                                          </span>
                                        )}
                                      </td>

                                      <td className="px-2 sm:px-4 py-2 hidden lg:table-cell">
                                        {task.endDate ? (
                                          <span
                                            className={`text-[10px] sm:text-xs ${isDeadlineMissed ? 'text-[var(--danger)] font-medium' : 'text-[var(--text-secondary)]'}`}
                                          >
                                            {formatDateWithTime(task.endDate)}
                                            {isDeadlineMissed && ' 🚨'}
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-[var(--text-muted)]">
                                            -
                                          </span>
                                        )}
                                      </td>

                                      <td className="px-2 sm:px-4 py-2">
                                        <button
                                          onClick={() =>
                                            openGiveNumbersModal(task)
                                          }
                                          className="inline-flex items-center gap-1 bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-medium transition"
                                        >
                                          <Award className="w-3 h-3" />
                                          <span className="hidden xs:inline">
                                            Give
                                          </span>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {currentTab === 'Documents' && (
            <div className="space-y-6">
              <div className="bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 rounded-xl p-6 sm:p-10 text-center transition-all duration-300">
                <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20">
                  <Upload className="w-7 h-7 text-[var(--text-muted)]" />
                </div>
                <label className={`cursor-pointer inline-flex items-center gap-2 ${documentUploading ? 'bg-[var(--bg-input)] cursor-not-allowed' : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)]'} text-[var(--text-inverse)] px-5 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-[var(--accent-primary)]/20`}>
                  {documentUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Upload Document
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    disabled={documentUploading}
                    onChange={(e) =>
                      e.target.files?.[0] && uploadFile(e.target.files[0])
                    }
                  />
                </label>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  PDF, Images — max 10MB
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                    Documents
                  </h4>
                  <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full">
                    {project.documents?.length || 0} files
                  </span>
                </div>

                {!project.documents || project.documents.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)]">
                    <FileText className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="text-[var(--text-secondary)] text-sm">
                      No documents uploaded.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {project.documents.map((doc) => {
                      const isImage =
                        doc.fileUrl &&
                        /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.fileUrl);
                      return (
                        <div
                          key={doc._id}
                          className="group bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--border-hover)] rounded-xl overflow-hidden transition-all"
                        >
                          <div className="relative aspect-video bg-[var(--bg-card)]">
                            <button
                              onClick={() => handleRemoveDocument(doc._id)}
                              disabled={documentDeleting}
                              className="absolute top-2 right-2 z-10 bg-[var(--danger)]/90 hover:bg-[var(--danger)] text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {documentDeleting ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                            </button>
                            {isImage ? (
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block h-full"
                              >
                                <img
                                  src={doc.fileUrl}
                                  alt={doc.fileName}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </a>
                            ) : (
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition"
                              >
                                <FileText className="w-10 h-10" />
                                <span className="text-xs text-[var(--accent-primary)] mt-1 font-medium">
                                  View
                                </span>
                              </a>
                            )}
                          </div>
                          <div className="p-2.5 border-t border-[var(--border-color)]">
                            <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                              {doc.fileName || 'Untitled'}
                            </p>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-[var(--accent-primary)] hover:text-[var(--accent-hover)] mt-1 inline-flex items-center gap-1 transition"
                            >
                              <Eye className="w-3 h-3" />
                              Open
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Task Form Modal */}
        {showTaskForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
            <div
              className="absolute inset-0"
              onClick={() => {
                setShowTaskForm(false);
                resetTaskForm();
              }}
            />
            <div className="bg-[var(--bg-card)] w-full max-w-3xl max-h-[95vh] flex flex-col border border-[var(--border-color)] rounded-xl overflow-hidden relative z-10 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 sm:px-6 py-3 bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20">
                    {editTask ? (
                      <Edit2 className="w-4 h-4 text-[var(--accent-primary)]" />
                    ) : (
                      <Plus className="w-4 h-4 text-[var(--accent-primary)]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                      {editTask ? 'Edit Task' : 'Create Task'}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)]">
                      {editTask ? 'Update task details' : 'Add a new task'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTaskForm(false);
                    resetTaskForm();
                  }}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                        Task Title{' '}
                        <span className="text-[var(--danger)]">*</span>
                      </label>
                      <input
                        name="name"
                        placeholder="Enter task name"
                        value={taskForm.name}
                        onChange={handleTaskChange}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        placeholder="Describe the task..."
                        value={taskForm.description}
                        onChange={handleTaskChange}
                        rows="2"
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg px-3 py-2 text-sm outline-none transition-colors resize-none"
                      />
                    </div>

                    {/* Employee Selector */}
                    <div className="relative">
                      <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                        Assign Employees{' '}
                        <span className="text-[var(--danger)]">*</span>
                        <span className="text-[var(--text-muted)] ml-1">
                          (Max {settings.maxEmployeesPerTask})
                        </span>
                      </label>

                      {taskForm.selectedEmployees.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {taskForm.selectedEmployees.map((emp) => (
                            <span
                              key={emp._id}
                              className="inline-flex items-center gap-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 px-2 py-0.5 rounded-lg text-[10px]"
                            >
                              <User className="w-3 h-3" />
                              {emp.name || emp.email}
                              <button
                                type="button"
                                onClick={() => removeEmployeeFromTask(emp._id)}
                                className="hover:text-[var(--danger)] transition ml-0.5"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchEmployee}
                          onChange={(e) => {
                            setSearchEmployee(e.target.value);
                            setShowEmployeeDropdown(true);
                          }}
                          onFocus={() => setShowEmployeeDropdown(true)}
                          placeholder={
                            taskForm.selectedEmployees.length >=
                            settings.maxEmployeesPerTask
                              ? 'Maximum limit reached'
                              : 'Search employees...'
                          }
                          disabled={
                            taskForm.selectedEmployees.length >=
                            settings.maxEmployeesPerTask
                          }
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg pl-8 pr-3 py-2 text-sm outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      {showEmployeeDropdown && filteredEmployees.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-xl max-h-36 overflow-y-auto custom-scrollbar">
                          {filteredEmployees.map((emp) => (
                            <button
                              key={emp._id}
                              type="button"
                              onClick={() => addEmployeeToTask(emp)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--bg-hover)] transition text-left"
                            >
                              <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center flex-shrink-0">
                                <User className="w-3 h-3 text-[var(--accent-primary)]" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-[var(--text-primary)] truncate">
                                  {emp.name || 'Unknown'}
                                </p>
                                <p className="text-[9px] text-[var(--text-muted)] truncate">
                                  {emp.email}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ✅ UPDATED: DateTime inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                          Start Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          name="startDate"
                          value={taskForm.startDate}
                          onChange={handleTaskChange}
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                          Deadline & Time
                        </label>
                        <input
                          type="datetime-local"
                          name="deadline"
                          value={taskForm.deadline}
                          onChange={handleTaskChange}
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                        Marks{' '}
                        <span className="text-[var(--text-muted)]">
                          (0-100)
                        </span>
                      </label>
                      <input
                        type="number"
                        name="obtainedMarks"
                        min="0"
                        max="100"
                        value={taskForm.obtainedMarks}
                        onChange={handleTaskChange}
                        placeholder="Enter marks"
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <button
                        onClick={editTask ? updateTask : addTask}
                        disabled={
                          taskForm.selectedEmployees.length === 0 ||
                          !taskForm.name ||
                          taskForm.selectedEmployees.length >
                            settings.maxEmployeesPerTask ||
                          taskLoading
                        }
                        className={`flex-1 font-medium py-2 rounded-lg text-sm transition flex items-center justify-center gap-2 ${
                          taskForm.selectedEmployees.length === 0 ||
                          !taskForm.name ||
                          taskForm.selectedEmployees.length >
                            settings.maxEmployeesPerTask ||
                          taskLoading
                            ? 'bg-[var(--bg-input)] text-[var(--text-muted)] cursor-not-allowed'
                            : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] shadow-lg shadow-[var(--accent-primary)]/20'
                        }`}
                      >
                        {taskLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {editTask ? 'Updating...' : 'Assigning...'}
                          </>
                        ) : (
                          <>
                            {editTask
                              ? 'Update Task'
                              : `Assign (${taskForm.selectedEmployees.length})`}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          resetTaskForm();
                          setShowTaskForm(false);
                        }}
                        className="px-4 py-2 rounded-lg bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] text-sm font-medium transition border border-[var(--border-color)]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Give Numbers Modal */}
        {showGiveNumbersModal && selectedTaskForNumbers && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
            <div
              className="absolute inset-0"
              onClick={() => {
                setShowGiveNumbersModal(false);
                setSelectedTaskForNumbers(null);
              }}
            />
            <div className="bg-[var(--bg-card)] w-full max-w-md border border-[var(--border-color)] rounded-xl overflow-hidden relative z-10 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 sm:px-6 py-3 bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20">
                    <Award className="w-4 h-4 text-[var(--accent-primary)]" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-[var(--text-primary)]">
                      Give Numbers
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] truncate max-w-[120px] sm:max-w-[200px]">
                      {selectedTaskForNumbers.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowGiveNumbersModal(false);
                    setSelectedTaskForNumbers(null);
                  }}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                {getAssignedUser(selectedTaskForNumbers) && (
                  <div className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                    <div className="w-9 h-9 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-[var(--text-inverse)] text-sm font-bold flex-shrink-0">
                      {getAssignedUser(selectedTaskForNumbers)
                        ?.name?.charAt(0)
                        ?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text-primary)] text-sm truncate">
                        {getAssignedUser(selectedTaskForNumbers)?.name ||
                          'Unknown'}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {getAssignedUser(selectedTaskForNumbers)?.email || ''}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Marks{' '}
                    <span className="text-[var(--text-muted)]">(0-{selectedTaskForNumbers?.maxMarks || 100})</span>
                  </label>
                  <input
                    type="number"
                    name="marks"
                    min="0"
                    max={selectedTaskForNumbers?.maxMarks || 100}
                    value={numbersForm.marks}
                    onChange={handleNumbersChange}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Maximum marks for this task: <span className="font-semibold text-[var(--text-primary)]">{selectedTaskForNumbers?.maxMarks || 100}</span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 p-1.5 hover:bg-[var(--bg-hover)] rounded-lg transition">
                    <input
                      type="checkbox"
                      id="basicWork"
                      name="basicWork"
                      checked={numbersForm.basicWork}
                      onChange={handleNumbersChange}
                      className="w-4 h-4 rounded border-[var(--border-color)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] focus:ring-2"
                    />
                    <label
                      htmlFor="basicWork"
                      className="text-sm text-[var(--text-primary)] cursor-pointer"
                    >
                      Basic Work
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-1.5 hover:bg-[var(--bg-hover)] rounded-lg transition">
                    <input
                      type="checkbox"
                      id="completed"
                      name="completed"
                      checked={numbersForm.completed}
                      onChange={handleNumbersChange}
                      className="w-4 h-4 rounded border-[var(--border-color)] text-[var(--success)] focus:ring-[var(--success)] focus:ring-2"
                    />
                    <label
                      htmlFor="completed"
                      className="text-sm text-[var(--text-primary)] cursor-pointer"
                    >
                      Completed
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-1.5 hover:bg-[var(--bg-hover)] rounded-lg transition">
                    <input
                      type="checkbox"
                      id="tested"
                      name="tested"
                      checked={numbersForm.tested}
                      onChange={handleNumbersChange}
                      className="w-4 h-4 rounded border-[var(--border-color)] text-[var(--accent-light)] focus:ring-[var(--accent-light)] focus:ring-2"
                    />
                    <label
                      htmlFor="tested"
                      className="text-sm text-[var(--text-primary)] cursor-pointer"
                    >
                      Tested
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-[var(--border-color)]">
                  <button
                    onClick={submitNumbers}
                    disabled={numbersLoading}
                    className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] font-medium py-2 rounded-lg text-sm transition shadow-lg shadow-[var(--accent-primary)]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {numbersLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      'Assign Numbers'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowGiveNumbersModal(false);
                      setSelectedTaskForNumbers(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] text-sm font-medium transition border border-[var(--border-color)]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProjectDetail;