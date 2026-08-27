// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../../service/api.js";
// import {
//   Users,
//   FolderKanban,
//   CheckCircle2,
//   Clock,
//   AlertCircle,
//   ChevronDown,
//   ChevronUp,
//   Loader2,
//   Search,
//   User,
//   Briefcase,
//   Calendar,
//   Award,
//   Filter,
//   Activity,
//   Target,
//   Mail,
//   GraduationCap,
//   Trophy,
//   Star,
//   TrendingUp,
//   BarChart3,
//   PieChart,
//   Zap,
// } from "lucide-react";
// import toast, { Toaster } from 'react-hot-toast';

// const API_BASE_URL = "/projects";

// const TeamOverview = () => {
//   const navigate = useNavigate();
//   const [projects, setProjects] = useState([]);
//   const [allUsers, setAllUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [expandedTasks, setExpandedTasks] = useState({});
//   const [filterStatus, setFilterStatus] = useState("all");
//   const [sortBy, setSortBy] = useState("name");
//   const [showFilters, setShowFilters] = useState(false);
//   const [stats, setStats] = useState({
//     totalTasks: 0,
//     totalEmployees: 0,
//     completedTasks: 0,
//     inProgressTasks: 0,
//     pendingTasks: 0,
//     avgMarks: 0,
//     totalMarks: 0,
//   });

//   const fetchAllUsers = async () => {
//     try {
//       const res = await api.get("/user/all-users");
//       setAllUsers(res.data.users || res.data || []);
//     } catch (err) {
//       console.error("Failed to fetch users:", err);
//       setAllUsers([]);
//     }
//   };

//   const fetchProjects = async () => {
//     setLoading(true);
//     try {
//       await fetchAllUsers();
//       const res = await api.get(API_BASE_URL);
//       setProjects(res.data);
//       calculateStats(res.data);
//     } catch (err) {
//       console.error("Error fetching projects:", err.message);
//       toast.error("Failed to load team overview");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProjects();
//   }, []);

//   const getUserDetails = (taskUser) => {
//     if (taskUser && typeof taskUser === 'object' && taskUser.name) {
//       return {
//         _id: taskUser._id,
//         name: taskUser.name,
//         email: taskUser.email || "",
//         role: taskUser.role || "employee",
//       };
//     }
    
//     if (taskUser && (typeof taskUser === 'string' || taskUser._id)) {
//       const userId = typeof taskUser === 'string' ? taskUser : taskUser._id;
//       const foundUser = allUsers.find(u => u._id === userId || u._id?.toString() === userId);
//       if (foundUser) {
//         return {
//           _id: foundUser._id,
//           name: foundUser.name,
//           email: foundUser.email || "",
//           role: foundUser.role || "employee",
//         };
//       }
//     }
    
//     return {
//       _id: taskUser?._id || taskUser || "unknown",
//       name: "Unknown",
//       email: "",
//       role: "employee",
//     };
//   };

//   const calculateStats = (projectsData) => {
//     let totalTasks = 0;
//     let totalEmployees = new Set();
//     let completedTasks = 0;
//     let inProgressTasks = 0;
//     let pendingTasks = 0;
//     let totalMarks = 0;
//     let taskCount = 0;

//     projectsData.forEach((project) => {
//       (project.tasks || []).forEach((task) => {
//         totalTasks++;
//         const userDetails = getUserDetails(task.user);
//         if (userDetails._id && userDetails._id !== "unknown") {
//           totalEmployees.add(userDetails._id);
//         }
        
//         if (task.status === "Completed") completedTasks++;
//         else if (task.status === "In Progress") inProgressTasks++;
//         else pendingTasks++;

//         if (task.obtainedMarks !== undefined) {
//           totalMarks += task.obtainedMarks;
//           taskCount++;
//         }
//       });
//     });

//     setStats({
//       totalTasks,
//       totalEmployees: totalEmployees.size,
//       completedTasks,
//       inProgressTasks,
//       pendingTasks,
//       totalMarks,
//       avgMarks: taskCount > 0 ? Math.round(totalMarks / taskCount) : 0,
//     });
//   };

//   const getGroupedTasks = () => {
//     const taskGroups = {};

//     projects.forEach((project) => {
//       (project.tasks || []).forEach((task) => {
//         const taskName = task.name || "Unnamed Task";
//         const userDetails = getUserDetails(task.user);
        
//         if (!taskGroups[taskName]) {
//           taskGroups[taskName] = {
//             taskName,
//             taskDescription: task.description,
//             projectName: project.projectName,
//             projectId: project._id,
//             status: task.status || "Pending",
//             startDate: task.startDate,
//             endDate: task.endDate,
//             employees: [],
//             totalMarks: 0,
//             avgMarks: 0,
//             maxMarks: 0,
//           };
//         }

//         if (task.user) {
//           const marks = task.obtainedMarks || 0;
//           taskGroups[taskName].employees.push({
//             _id: userDetails._id,
//             name: userDetails.name,
//             email: userDetails.email,
//             role: userDetails.role,
//             obtainedMarks: marks,
//             completed: task.completed || false,
//             tested: task.tested || false,
//             basicWork: task.basicWork || false,
//             status: task.status || "Pending",
//           });
//           taskGroups[taskName].totalMarks += marks;
//           if (marks > taskGroups[taskName].maxMarks) {
//             taskGroups[taskName].maxMarks = marks;
//           }
//         }
//       });
//     });

//     Object.values(taskGroups).forEach((group) => {
//       group.avgMarks = group.employees.length > 0 
//         ? Math.round(group.totalMarks / group.employees.length) 
//         : 0;
//     });

//     let groupedArray = Object.values(taskGroups);

//     if (filterStatus !== "all") {
//       groupedArray = groupedArray.filter((group) => {
//         if (filterStatus === "completed") return group.status === "Completed";
//         else if (filterStatus === "in-progress") return group.status === "In Progress";
//         else if (filterStatus === "pending") return group.status === "Pending";
//         return true;
//       });
//     }

//     if (searchTerm) {
//       const lower = searchTerm.toLowerCase();
//       groupedArray = groupedArray.filter(
//         (group) =>
//           group.taskName.toLowerCase().includes(lower) ||
//           group.projectName.toLowerCase().includes(lower) ||
//           group.employees.some((emp) =>
//             emp.name.toLowerCase().includes(lower)
//           )
//       );
//     }

//     groupedArray.sort((a, b) => {
//       switch (sortBy) {
//         case "name": return a.taskName.localeCompare(b.taskName);
//         case "employees": return b.employees.length - a.employees.length;
//         case "progress": return b.avgMarks - a.avgMarks;
//         case "status": return a.status.localeCompare(b.status);
//         default: return 0;
//       }
//     });

//     return groupedArray;
//   };

//   const toggleExpand = (taskName) => {
//     setExpandedTasks((prev) => ({
//       ...prev,
//       [taskName]: !prev[taskName],
//     }));
//   };

//   const getStatusColor = (status) => {
//     const colors = {
//       Pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
//       "In Progress": "bg-blue-500/10 text-blue-400 border-blue-500/20",
//       Completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
//     };
//     return colors[status] || "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
//   };

//   const getStatusIcon = (status) => {
//     const icons = {
//       Pending: Clock,
//       "In Progress": Activity,
//       Completed: CheckCircle2,
//     };
//     return icons[status] || AlertCircle;
//   };

//   const getMarksColor = (marks) => {
//     if (marks >= 80) return "text-emerald-400";
//     if (marks >= 60) return "text-blue-400";
//     if (marks >= 40) return "text-amber-400";
//     return "text-rose-400";
//   };

//   const getInitials = (name) => {
//     if (!name || name === "Unknown") return "?";
//     return name
//       .split(" ")
//       .map((n) => n[0])
//       .join("")
//       .toUpperCase()
//       .slice(0, 2);
//   };

//   const getMarksLabel = (marks) => {
//     if (marks >= 80) return "🏆 Excellent";
//     if (marks >= 60) return "⭐ Good";
//     if (marks >= 40) return "📊 Average";
//     return "📈 Needs Improvement";
//   };

//   const groupedTasks = getGroupedTasks();

//   if (loading) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
//         <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
//         <p className="text-neutral-400 text-sm">Loading team overview...</p>
//       </div>
//     );
//   }

//   return (
//     <>
//       <Toaster
//         position="top-right"
//         toastOptions={{
//           duration: 4000,
//           style: {
//             background: '#1a1a1a',
//             color: '#fff',
//             border: '1px solid #333',
//           },
//           success: {
//             iconTheme: { primary: '#10b981', secondary: '#fff' },
//           },
//           error: {
//             iconTheme: { primary: '#ef4444', secondary: '#fff' },
//           },
//         }}
//       />
//       <div className="bg-[#121212] rounded-xl border border-neutral-800 overflow-hidden">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-[#0a0a0a] to-[#121212] border-b border-neutral-800 px-6 py-5">
//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//             <div className="flex items-center gap-3">
//               <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
//                 <Users className="w-5 h-5 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-xl font-semibold text-white">Team Overview</h1>
//                 <p className="text-sm text-neutral-400">
//                   {stats.totalEmployees} team members • {stats.totalTasks} total tasks
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => setShowFilters(!showFilters)}
//                 className={`p-2 rounded-lg border transition ${
//                   showFilters 
//                     ? "bg-blue-600/10 border-blue-500/30 text-blue-400" 
//                     : "border-neutral-800 text-neutral-400 hover:bg-neutral-800"
//                 }`}
//               >
//                 <Filter className="w-4 h-4" />
//               </button>
//             </div>
//           </div>

//           {/* Search & Filters */}
//           <div className="mt-4 space-y-3">
//             <div className="relative">
//               <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
//               <input
//                 type="text"
//                 placeholder="Search tasks, projects, or employees..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full bg-[#121212] border border-neutral-800 text-white placeholder-neutral-500 pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
//               />
//             </div>

//             {showFilters && (
//               <div className="flex flex-wrap items-center gap-2 p-3 bg-[#121212] rounded-lg border border-neutral-800">
//                 <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider mr-1">Status:</span>
//                 <button onClick={() => setFilterStatus("all")} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterStatus === "all" ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}>All</button>
//                 <button onClick={() => setFilterStatus("completed")} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterStatus === "completed" ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}>✅ Done</button>
//                 <button onClick={() => setFilterStatus("in-progress")} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterStatus === "in-progress" ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}>🔄 Progress</button>
//                 <button onClick={() => setFilterStatus("pending")} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterStatus === "pending" ? "bg-amber-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}>⏳ Pending</button>
                
//                 <div className="w-px h-6 bg-neutral-800 mx-2"></div>
                
//                 <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider mr-1">Sort:</span>
//                 <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-[#121212] border border-neutral-800 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500">
//                   <option value="name">Name</option>
//                   <option value="employees">Members</option>
//                   <option value="progress">Marks</option>
//                   <option value="status">Status</option>
//                 </select>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Statistics Cards */}
//         <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-4 border-b border-neutral-800 bg-[#0a0a0a]/50">
//           <div className="bg-[#121212] p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 transition group">
//             <div className="flex items-center gap-2">
//               <div className="p-1.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition">
//                 <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
//               </div>
//               <span className="text-[10px] text-neutral-500 font-medium">Tasks</span>
//             </div>
//             <p className="text-lg font-bold text-white mt-1">{stats.totalTasks}</p>
//           </div>
          
//           <div className="bg-[#121212] p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 transition group">
//             <div className="flex items-center gap-2">
//               <div className="p-1.5 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition">
//                 <Users className="w-3.5 h-3.5 text-purple-400" />
//               </div>
//               <span className="text-[10px] text-neutral-500 font-medium">Members</span>
//             </div>
//             <p className="text-lg font-bold text-white mt-1">{stats.totalEmployees}</p>
//           </div>
          
//           <div className="bg-[#121212] p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 transition group">
//             <div className="flex items-center gap-2">
//               <div className="p-1.5 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition">
//                 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
//               </div>
//               <span className="text-[10px] text-neutral-500 font-medium">Done</span>
//             </div>
//             <p className="text-lg font-bold text-emerald-400 mt-1">{stats.completedTasks}</p>
//           </div>
          
//           <div className="bg-[#121212] p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 transition group">
//             <div className="flex items-center gap-2">
//               <div className="p-1.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition">
//                 <Activity className="w-3.5 h-3.5 text-blue-400" />
//               </div>
//               <span className="text-[10px] text-neutral-500 font-medium">Progress</span>
//             </div>
//             <p className="text-lg font-bold text-blue-400 mt-1">{stats.inProgressTasks}</p>
//           </div>
          
//           <div className="bg-[#121212] p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 transition group">
//             <div className="flex items-center gap-2">
//               <div className="p-1.5 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition">
//                 <Clock className="w-3.5 h-3.5 text-amber-400" />
//               </div>
//               <span className="text-[10px] text-neutral-500 font-medium">Pending</span>
//             </div>
//             <p className="text-lg font-bold text-amber-400 mt-1">{stats.pendingTasks}</p>
//           </div>
          
//           <div className="bg-[#121212] p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 transition group">
//             <div className="flex items-center gap-2">
//               <div className="p-1.5 rounded-lg bg-rose-500/10 group-hover:bg-rose-500/20 transition">
//                 <Trophy className="w-3.5 h-3.5 text-rose-400" />
//               </div>
//               <span className="text-[10px] text-neutral-500 font-medium">Avg Marks</span>
//             </div>
//             <p className={`text-lg font-bold mt-1 ${getMarksColor(stats.avgMarks)}`}>
//               {stats.avgMarks}
//             </p>
//           </div>
//         </div>

//         {/* Task Groups */}
//         <div className="divide-y divide-neutral-800">
//           {groupedTasks.length === 0 ? (
//             <div className="text-center py-16 px-6">
//               <FolderKanban className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
//               <p className="text-neutral-400 font-medium">No tasks found</p>
//               <p className="text-neutral-500 text-sm mt-1">
//                 {searchTerm ? "Try adjusting your search" : "No tasks assigned yet"}
//               </p>
//             </div>
//           ) : (
//             groupedTasks.map((group) => {
//               const isExpanded = expandedTasks[group.taskName];
//               const employeeCount = group.employees.length;
//               const StatusIcon = getStatusIcon(group.status);

//               return (
//                 <div key={group.taskName} className="hover:bg-neutral-800/10 transition-colors">
//                   {/* Task Header */}
//                   <div 
//                     onClick={() => toggleExpand(group.taskName)} 
//                     className="px-6 py-4 cursor-pointer flex items-center justify-between group hover:bg-neutral-800/20 transition-all"
//                   >
//                     <div className="flex items-center gap-4 flex-1 min-w-0">
//                       <div className="text-neutral-500 group-hover:text-blue-400 transition-transform duration-200">
//                         {isExpanded ? (
//                           <ChevronUp className="w-4 h-4" />
//                         ) : (
//                           <ChevronDown className="w-4 h-4" />
//                         )}
//                       </div>

//                       {/* Task Info */}
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center gap-4 mt-1 text-xs text-neutral-400 flex-wrap">
//                           <span className="flex items-center gap-1">
//                             <FolderKanban className="w-3 h-3 text-neutral-500" />
//                             {group.projectName}
//                           </span>
//                           {group.taskDescription && (
//                             <span className="line-clamp-1 max-w-xs hidden sm:block text-neutral-500">
//                               {group.taskDescription}
//                             </span>
//                           )}
//                           <span className="flex items-center gap-1 text-emerald-400">
//                             <GraduationCap className="w-3 h-3" />
//                             Avg: {group.avgMarks}
//                           </span>
//                           {group.maxMarks > 0 && (
//                             <span className="flex items-center gap-1 text-amber-400">
//                               <Trophy className="w-3 h-3" />
//                               Best: {group.maxMarks}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     </div>

//                     <div className="flex items-center gap-4">
//                       {/* Member Count */}
//                       <div className="flex items-center gap-1.5 bg-neutral-800/50 px-3 py-1.5 rounded-full border border-neutral-700">
//                         <Users className="w-3.5 h-3.5 text-blue-400" />
//                         <span className="text-xs font-medium text-neutral-300">
//                           {employeeCount}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Expanded - Employee Table */}
//                   {isExpanded && (
//                     <div className="px-6 pb-4">
//                       <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800 overflow-hidden shadow-lg shadow-black/20">
//                         {/* Table Header */}
//                         <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-gradient-to-r from-neutral-800/30 to-neutral-800/10 border-b border-neutral-800">
//                           <div className="col-span-3 flex items-center gap-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
//                             <User className="w-3 h-3" />
//                             Employee
//                           </div>
//                           <div className="col-span-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Role</div>
//                           <div className="col-span-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Marks</div>
//                           <div className="col-span-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Status</div>
//                           <div className="col-span-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Timeline</div>
//                           <div className="col-span-1 text-right text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Score</div>
//                         </div>

//                         {/* Employee Rows */}
//                         <div className="divide-y divide-neutral-800/50">
//                           {group.employees.map((emp, index) => (
//                             <div 
//                               key={`${emp._id}-${index}`} 
//                               className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-neutral-800/30 transition-all"
//                             >
//                               {/* Employee */}
//                               <div className="col-span-3 flex items-center gap-3">
//                                 <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-lg ${
//                                   emp.name === "Unknown" 
//                                     ? "bg-neutral-700" 
//                                     : "bg-gradient-to-br from-blue-500 to-blue-700"
//                                 }`}>
//                                   {getInitials(emp.name)}
//                                 </div>
//                                 <div className="min-w-0">
//                                   <p className={`text-sm font-medium truncate ${
//                                     emp.name === "Unknown" ? "text-neutral-500" : "text-white"
//                                   }`}>
//                                     {emp.name}
//                                   </p>
//                                   {emp.email && (
//                                     <p className="text-[10px] text-neutral-500 truncate flex items-center gap-1">
//                                       <Mail className="w-2.5 h-2.5" />
//                                       {emp.email}
//                                     </p>
//                                   )}
//                                 </div>
//                               </div>

//                               {/* Role */}
//                               <div className="col-span-2">
//                                 <span className="text-[10px] text-neutral-400 bg-neutral-800/50 px-2.5 py-1 rounded-full border border-neutral-700">
//                                   {emp.role}
//                                 </span>
//                               </div>

//                               {/* Marks - Direct number without % */}
//                               <div className="col-span-2">
//                                 <div className="flex items-center gap-2">
//                                   <span className={`text-sm font-bold ${getMarksColor(emp.obtainedMarks)}`}>
//                                     {emp.obtainedMarks}
//                                   </span>
//                                 </div>
//                                 <span className="text-[8px] text-neutral-500 mt-0.5 block">
//                                   {getMarksLabel(emp.obtainedMarks)}
//                                 </span>
//                               </div>

//                               {/* Status Badges */}
//                               <div className="col-span-2 flex items-center gap-1.5 flex-wrap">
//                                 {emp.basicWork && (
//                                   <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
//                                     <CheckCircle2 className="w-3 h-3" />
//                                     Basic
//                                   </span>
//                                 )}
//                                 {emp.completed && (
//                                   <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
//                                     <CheckCircle2 className="w-3 h-3" />
//                                     Done
//                                   </span>
//                                 )}
//                                 {emp.tested && (
//                                   <span className="inline-flex items-center gap-0.5 text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
//                                     <CheckCircle2 className="w-3 h-3" />
//                                     Tested
//                                   </span>
//                                 )}
//                                 {!emp.basicWork && !emp.completed && !emp.tested && (
//                                   <span className="text-[10px] text-neutral-500 bg-neutral-800/50 px-2 py-0.5 rounded">
//                                     Not started
//                                   </span>
//                                 )}
//                               </div>

//                               {/* Timeline with Year */}
//                               <div className="col-span-2 text-[10px] text-neutral-400 flex items-center gap-1">
//                                 <Calendar className="w-3 h-3 text-neutral-500" />
//                                 <span className="hidden lg:inline">
//                                   {group.startDate ? new Date(group.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
//                                 </span>
//                                 <span className="text-neutral-600">→</span>
//                                 <span className="hidden lg:inline">
//                                   {group.endDate ? new Date(group.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
//                                 </span>
//                               </div>

//                               {/* Score */}
//                               <div className="col-span-1 text-right">
//                                 <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getMarksColor(emp.obtainedMarks)} bg-neutral-800/50 border border-neutral-700`}>
//                                   {emp.obtainedMarks}
//                                 </div>
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       </div>

//                       {/* Quick Actions */}
//                       <div className="flex items-center gap-3 mt-3">
//                         <button
//                           onClick={() => navigate(`/admin/project/${group.projectId}`)}
//                           className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition"
//                         >
//                           <FolderKanban className="w-3.5 h-3.5" />
//                           View Project
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               );
//             })
//           )}
//         </div>

//         {/* Summary Footer */}
//         <div className="bg-gradient-to-r from-[#0a0a0a] to-[#121212] border-t border-neutral-800 px-6 py-4 flex flex-wrap items-center justify-between gap-2">
//           <div className="flex items-center gap-4 text-xs">
//             <span className="flex items-center gap-2 text-neutral-400">
//               <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
//               <span className="font-medium text-white">{groupedTasks.length}</span> task groups
//             </span>
//             <span className="flex items-center gap-2 text-neutral-400">
//               <Users className="w-3.5 h-3.5 text-purple-400" />
//               <span className="font-medium text-white">{groupedTasks.reduce((acc, g) => acc + g.employees.length, 0)}</span> assignments
//             </span>
//           </div>
//           <div className="flex items-center gap-4 text-xs">
//             <span className="flex items-center gap-2 text-neutral-400">
//               <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
//               Avg: <span className="font-medium text-white">{stats.avgMarks}</span>
//             </span>
//             <span className="flex items-center gap-2 text-neutral-400">
//               <Trophy className="w-3.5 h-3.5 text-amber-400" />
//               Total: <span className="font-medium text-white">{stats.totalMarks}</span>
//             </span>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default TeamOverview;


import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../service/api.js";
import {
  Users,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  User,
  Briefcase,
  Calendar,
  Award,
  Filter,
  Activity,
  Target,
  Mail,
  GraduationCap,
  Trophy,
  Star,
  TrendingUp,
  BarChart3,
  PieChart,
  Zap,
  TrendingUp as TrendingUpIcon,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

const API_BASE_URL = "/projects";

const TeamOverview = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedTasks, setExpandedTasks] = useState({});
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showFilters, setShowFilters] = useState(false);
  
  const [projectStats, setProjectStats] = useState({
    totalProjects: 0,
    totalEmployees: 0,
    completedProjects: 0,
    inProgressProjects: 0,
    pendingProjects: 0,
    cancelledProjects: 0,
    avgMarks: 0,
    totalMarks: 0,
  });

  const fetchAllUsers = async () => {
    try {
      const res = await api.get("/user/all-users");
      setAllUsers(res.data.users || res.data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setAllUsers([]);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      await fetchAllUsers();
      const res = await api.get(API_BASE_URL);
      setProjects(res.data);
      calculateProjectStats(res.data);
    } catch (err) {
      console.error("Error fetching projects:", err.message);
      toast.error("Failed to load team overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getUserDetails = (taskUser) => {
    if (taskUser && typeof taskUser === 'object' && taskUser.name) {
      return {
        _id: taskUser._id,
        name: taskUser.name,
        email: taskUser.email || "",
        role: taskUser.role || "employee",
      };
    }
    
    if (taskUser && (typeof taskUser === 'string' || taskUser._id)) {
      const userId = typeof taskUser === 'string' ? taskUser : taskUser._id;
      const foundUser = allUsers.find(u => u._id === userId || u._id?.toString() === userId);
      if (foundUser) {
        return {
          _id: foundUser._id,
          name: foundUser.name,
          email: foundUser.email || "",
          role: foundUser.role || "employee",
        };
      }
    }
    
    return {
      _id: taskUser?._id || taskUser || "unknown",
      name: "Unknown",
      email: "",
      role: "employee",
    };
  };

  const calculateProjectStats = (projectsData) => {
    let totalProjects = projectsData.length;
    let totalEmployees = new Set();
    let completedProjects = 0;
    let inProgressProjects = 0;
    let pendingProjects = 0;
    let cancelledProjects = 0;
    let totalMarks = 0;
    let taskCount = 0;

    projectsData.forEach((project) => {
      const projectStatus = project.status || "Pending";
      
      switch(projectStatus) {
        case "Completed":
          completedProjects++;
          break;
        case "In Progress":
          inProgressProjects++;
          break;
        case "Pending":
          pendingProjects++;
          break;
        case "Cancelled":
          cancelledProjects++;
          break;
        default:
          pendingProjects++;
      }

      (project.tasks || []).forEach((task) => {
        const userDetails = getUserDetails(task.user);
        if (userDetails._id && userDetails._id !== "unknown") {
          totalEmployees.add(userDetails._id);
        }

        if (task.obtainedMarks !== undefined) {
          totalMarks += task.obtainedMarks;
          taskCount++;
        }
      });
    });

    setProjectStats({
      totalProjects,
      totalEmployees: totalEmployees.size,
      completedProjects,
      inProgressProjects,
      pendingProjects,
      cancelledProjects,
      totalMarks,
      avgMarks: taskCount > 0 ? Math.round(totalMarks / taskCount) : 0,
    });
  };

  // ✅ FIXED: getGroupedTasks - Ab project ka status store karenge, task ka nahi
  const getGroupedTasks = () => {
    const taskGroups = {};

    projects.forEach((project) => {
      // ✅ Project ka actual status store karo
      const projectStatus = project.status || "Pending";
      
      (project.tasks || []).forEach((task) => {
        const taskName = task.name || "Unnamed Task";
        const userDetails = getUserDetails(task.user);
        
        if (!taskGroups[taskName]) {
          taskGroups[taskName] = {
            taskName,
            taskDescription: task.description,
            projectName: project.projectName,
            projectId: project._id,
            // ✅ Yahan PROJECT ka status use karo, task ka nahi
            projectStatus: projectStatus,
            startDate: task.startDate,
            endDate: task.endDate,
            employees: [],
            totalMarks: 0,
            avgMarks: 0,
            maxMarks: 0,
          };
        }

        if (task.user) {
          const marks = task.obtainedMarks || 0;
          taskGroups[taskName].employees.push({
            _id: userDetails._id,
            name: userDetails.name,
            email: userDetails.email,
            role: userDetails.role,
            obtainedMarks: marks,
            completed: task.completed || false,
            tested: task.tested || false,
            basicWork: task.basicWork || false,
            // Employee ka individual task status
            empStatus: task.status || "Pending",
          });
          taskGroups[taskName].totalMarks += marks;
          if (marks > taskGroups[taskName].maxMarks) {
            taskGroups[taskName].maxMarks = marks;
          }
        }
      });
    });

    Object.values(taskGroups).forEach((group) => {
      group.avgMarks = group.employees.length > 0 
        ? Math.round(group.totalMarks / group.employees.length) 
        : 0;
    });

    let groupedArray = Object.values(taskGroups);

    // ✅ Filter ab PROJECT status ke basis par kaam karega
    if (filterStatus !== "all") {
      groupedArray = groupedArray.filter((group) => {
        if (filterStatus === "completed") return group.projectStatus === "Completed";
        else if (filterStatus === "in-progress") return group.projectStatus === "In Progress";
        else if (filterStatus === "pending") return group.projectStatus === "Pending";
        return true;
      });
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      groupedArray = groupedArray.filter(
        (group) =>
          group.taskName.toLowerCase().includes(lower) ||
          group.projectName.toLowerCase().includes(lower) ||
          group.employees.some((emp) =>
            emp.name.toLowerCase().includes(lower)
          )
      );
    }

    groupedArray.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.taskName.localeCompare(b.taskName);
        case "employees": return b.employees.length - a.employees.length;
        case "progress": return b.avgMarks - a.avgMarks;
        case "status": return a.projectStatus.localeCompare(b.projectStatus);
        default: return 0;
      }
    });

    return groupedArray;
  };

  const toggleExpand = (taskName) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskName]: !prev[taskName],
    }));
  };

  // ✅ PROJECT STATUS COLOR MAPPING
  const getProjectStatusColor = (status) => {
    const colors = {
      Completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      "In Progress": "bg-blue-500/10 text-blue-400 border-blue-500/20",
      Pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      Cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      Testing: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
    return colors[status] || "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
  };

  // ✅ PROJECT STATUS ICON MAPPING
  const getProjectStatusIcon = (status) => {
    const icons = {
      Pending: Clock,
      "In Progress": Activity,
      Completed: CheckCircle2,
      Cancelled: XCircle,
      Testing: Zap,
    };
    return icons[status] || AlertCircle;
  };

  const getMarksColor = (marks) => {
    if (marks >= 80) return "text-emerald-400";
    if (marks >= 60) return "text-blue-400";
    if (marks >= 40) return "text-amber-400";
    return "text-rose-400";
  };

  const getInitials = (name) => {
    if (!name || name === "Unknown") return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getMarksLabel = (marks) => {
    if (marks >= 80) return "🏆 Excellent";
    if (marks >= 60) return "⭐ Good";
    if (marks >= 40) return "📊 Average";
    return "📈 Needs Improvement";
  };

  const groupedTasks = getGroupedTasks();

  if (loading) {
    return <SSIPageLoader message="Loading team overview..." />;
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #333',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
      <div className="bg-[#121212] rounded-xl border border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a0a0a] to-[#121212] border-b border-neutral-800 px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Team Overview</h1>
                <p className="text-sm text-neutral-400">
                  {projectStats.totalEmployees} team members • {projectStats.totalProjects} projects
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border transition ${
                  showFilters 
                    ? "bg-blue-600/10 border-blue-500/30 text-blue-400" 
                    : "border-neutral-800 text-neutral-400 hover:bg-neutral-800"
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="mt-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks, projects, or employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#121212] border border-neutral-800 text-white placeholder-neutral-500 pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {showFilters && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-[#121212] rounded-lg border border-neutral-800">
                <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider mr-1">Project Status:</span>
                <button onClick={() => setFilterStatus("all")} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterStatus === "all" ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}>All</button>
                <button onClick={() => setFilterStatus("completed")} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterStatus === "completed" ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}>✅ Completed</button>
                <button onClick={() => setFilterStatus("in-progress")} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterStatus === "in-progress" ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}>🔄 In Progress</button>
                <button onClick={() => setFilterStatus("pending")} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterStatus === "pending" ? "bg-amber-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}>⏳ Pending</button>
                
                <div className="w-px h-6 bg-neutral-800 mx-2"></div>
                
                <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider mr-1">Sort:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-[#121212] border border-neutral-800 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500">
                  <option value="name">Name</option>
                  <option value="employees">Members</option>
                  <option value="progress">Marks</option>
                  <option value="status">Project Status</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* PROJECT STATUS BASED STATISTICS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 p-4 border-b border-neutral-800 bg-[#0a0a0a]/50">
          <div className="bg-[#121212] p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 transition group">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition">
                <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-[10px] text-neutral-500 font-medium">Total Projects</span>
            </div>
            <p className="text-lg font-bold text-white mt-1">{projectStats.totalProjects}</p>
          </div>
          
          <div className="bg-[#121212] p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 transition group">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition">
                <Users className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span className="text-[10px] text-neutral-500 font-medium">Members</span>
            </div>
            <p className="text-lg font-bold text-white mt-1">{projectStats.totalEmployees}</p>
          </div>
          
          <div className="bg-[#121212] p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 transition group">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-[10px] text-neutral-500 font-medium">Completed</span>
            </div>
            <p className="text-lg font-bold text-emerald-400 mt-1">{projectStats.completedProjects}</p>
          </div>
          
          <div className="bg-[#121212] p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 transition group">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition">
                <PlayCircle className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-[10px] text-neutral-500 font-medium">In Progress</span>
            </div>
            <p className="text-lg font-bold text-blue-400 mt-1">{projectStats.inProgressProjects}</p>
          </div>
          
          <div className="bg-[#121212] p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 transition group">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition">
                <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-[10px] text-neutral-500 font-medium">Pending</span>
            </div>
            <p className="text-lg font-bold text-amber-400 mt-1">{projectStats.pendingProjects}</p>
          </div>
          
          <div className="bg-[#121212] p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 transition group">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 group-hover:bg-rose-500/20 transition">
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <span className="text-[10px] text-neutral-500 font-medium">Cancelled</span>
            </div>
            <p className="text-lg font-bold text-rose-400 mt-1">{projectStats.cancelledProjects}</p>
          </div>
          
          <div className="bg-[#121212] p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 transition group">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 group-hover:bg-rose-500/20 transition">
                <Trophy className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <span className="text-[10px] text-neutral-500 font-medium">Avg Marks</span>
            </div>
            <p className={`text-lg font-bold mt-1 ${getMarksColor(projectStats.avgMarks)}`}>
              {projectStats.avgMarks}
            </p>
          </div>
        </div>

        {/* Projects Status Summary Bar */}
        <div className="px-6 py-3 border-b border-neutral-800 bg-[#0a0a0a]/30">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs text-neutral-500 font-medium">Project Status Distribution:</span>
            <div className="flex items-center gap-3">
              {projectStats.completedProjects > 0 && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  Completed: {projectStats.completedProjects}
                </span>
              )}
              {projectStats.inProgressProjects > 0 && (
                <span className="flex items-center gap-1 text-xs text-blue-400">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  In Progress: {projectStats.inProgressProjects}
                </span>
              )}
              {projectStats.pendingProjects > 0 && (
                <span className="flex items-center gap-1 text-xs text-amber-400">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  Pending: {projectStats.pendingProjects}
                </span>
              )}
              {projectStats.cancelledProjects > 0 && (
                <span className="flex items-center gap-1 text-xs text-rose-400">
                  <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                  Cancelled: {projectStats.cancelledProjects}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Task Groups */}
        <div className="divide-y divide-neutral-800">
          {groupedTasks.length === 0 ? (
            <div className="text-center py-16 px-6">
              <FolderKanban className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-400 font-medium">No tasks found</p>
              <p className="text-neutral-500 text-sm mt-1">
                {searchTerm ? "Try adjusting your search" : "No tasks assigned yet"}
              </p>
            </div>
          ) : (
            groupedTasks.map((group) => {
              const isExpanded = expandedTasks[group.taskName];
              const employeeCount = group.employees.length;
              // ✅ PROJECT ka status use karo
              const StatusIcon = getProjectStatusIcon(group.projectStatus);

              return (
                <div key={group.taskName} className="hover:bg-neutral-800/10 transition-colors">
                  {/* Task Header */}
                  <div 
                    onClick={() => toggleExpand(group.taskName)} 
                    className="px-6 py-4 cursor-pointer flex items-center justify-between group hover:bg-neutral-800/20 transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="text-neutral-500 group-hover:text-blue-400 transition-transform duration-200">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>

                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-white text-sm truncate">{group.taskName}</h4>
                          {/* ✅ YAHAN PROJECT KA STATUS SHOW HOGA */}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getProjectStatusColor(group.projectStatus)}`}>
                            <StatusIcon className="w-2.5 h-2.5" />
                            {group.projectStatus}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-neutral-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <FolderKanban className="w-3 h-3 text-neutral-500" />
                            {group.projectName}
                          </span>
                          {group.taskDescription && (
                            <span className="line-clamp-1 max-w-xs hidden sm:block text-neutral-500">
                              {group.taskDescription}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-emerald-400">
                            <GraduationCap className="w-3 h-3" />
                            Avg: {group.avgMarks}
                          </span>
                          {group.maxMarks > 0 && (
                            <span className="flex items-center gap-1 text-amber-400">
                              <Trophy className="w-3 h-3" />
                              Best: {group.maxMarks}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Member Count */}
                      <div className="flex items-center gap-1.5 bg-neutral-800/50 px-3 py-1.5 rounded-full border border-neutral-700">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-medium text-neutral-300">
                          {employeeCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded - Employee Table */}
                  {isExpanded && (
                    <div className="px-6 pb-4">
                      <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800 overflow-hidden shadow-lg shadow-black/20">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-gradient-to-r from-neutral-800/30 to-neutral-800/10 border-b border-neutral-800">
                          <div className="col-span-3 flex items-center gap-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                            <User className="w-3 h-3" />
                            Employee
                          </div>
                          <div className="col-span-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Role</div>
                          <div className="col-span-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Marks</div>
                          <div className="col-span-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Task Status</div>
                          <div className="col-span-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Timeline</div>
                          <div className="col-span-1 text-right text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Score</div>
                        </div>

                        {/* Employee Rows */}
                        <div className="divide-y divide-neutral-800/50">
                          {group.employees.map((emp, index) => (
                            <div 
                              key={`${emp._id}-${index}`} 
                              className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-neutral-800/30 transition-all"
                            >
                              {/* Employee */}
                              <div className="col-span-3 flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-lg ${
                                  emp.name === "Unknown" 
                                    ? "bg-neutral-700" 
                                    : "bg-gradient-to-br from-blue-500 to-blue-700"
                                }`}>
                                  {getInitials(emp.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className={`text-sm font-medium truncate ${
                                    emp.name === "Unknown" ? "text-neutral-500" : "text-white"
                                  }`}>
                                    {emp.name}
                                  </p>
                                  {emp.email && (
                                    <p className="text-[10px] text-neutral-500 truncate flex items-center gap-1">
                                      <Mail className="w-2.5 h-2.5" />
                                      {emp.email}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Role */}
                              <div className="col-span-2">
                                <span className="text-[10px] text-neutral-400 bg-neutral-800/50 px-2.5 py-1 rounded-full border border-neutral-700">
                                  {emp.role}
                                </span>
                              </div>

                              {/* Marks */}
                              <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-bold ${getMarksColor(emp.obtainedMarks)}`}>
                                    {emp.obtainedMarks}
                                  </span>
                                </div>
                                <span className="text-[8px] text-neutral-500 mt-0.5 block">
                                  {getMarksLabel(emp.obtainedMarks)}
                                </span>
                              </div>

                              {/* ✅ Employee ka individual task status */}
                              <div className="col-span-2 flex items-center gap-1.5 flex-wrap">
                                {emp.basicWork && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Basic
                                  </span>
                                )}
                                {emp.completed && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Done
                                  </span>
                                )}
                                {emp.tested && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Tested
                                  </span>
                                )}
                                {!emp.basicWork && !emp.completed && !emp.tested && (
                                  <span className="text-[10px] text-neutral-500 bg-neutral-800/50 px-2 py-0.5 rounded">
                                    {emp.empStatus}
                                  </span>
                                )}
                              </div>

                              {/* Timeline */}
                              <div className="col-span-2 text-[10px] text-neutral-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-neutral-500" />
                                <span className="hidden lg:inline">
                                  {group.startDate ? new Date(group.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                                </span>
                                <span className="text-neutral-600">→</span>
                                <span className="hidden lg:inline">
                                  {group.endDate ? new Date(group.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                                </span>
                              </div>

                              {/* Score */}
                              <div className="col-span-1 text-right">
                                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getMarksColor(emp.obtainedMarks)} bg-neutral-800/50 border border-neutral-700`}>
                                  {emp.obtainedMarks}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() => navigate(`/admin/project/${group.projectId}`)}
                          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition"
                        >
                          <FolderKanban className="w-3.5 h-3.5" />
                          View Project
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Summary Footer */}
        <div className="bg-gradient-to-r from-[#0a0a0a] to-[#121212] border-t border-neutral-800 px-6 py-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-2 text-neutral-400">
              <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium text-white">{groupedTasks.length}</span> task groups
            </span>
            <span className="flex items-center gap-2 text-neutral-400">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-medium text-white">{groupedTasks.reduce((acc, g) => acc + g.employees.length, 0)}</span> assignments
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-2 text-neutral-400">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              Avg: <span className="font-medium text-white">{projectStats.avgMarks}</span>
            </span>
            <span className="flex items-center gap-2 text-neutral-400">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Total: <span className="font-medium text-white">{projectStats.totalMarks}</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeamOverview;