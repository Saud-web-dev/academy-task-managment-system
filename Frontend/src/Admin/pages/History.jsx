// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../../service/api.js";
// import {
//   ArrowLeft,
//   Clock,
//   Search,
//   Filter,
//   ChevronLeft,
//   ChevronRight,
//   Loader2,
//   User,
//   Calendar,
//   CheckCircle,
//   AlertCircle,
//   FileText,
//   Briefcase,
//   RefreshCw,
//   Trash2,
//   X,
//   Plus,
// } from "lucide-react";
// import toast, { Toaster } from 'react-hot-toast';

// const History = () => {
//   const navigate = useNavigate();
//   const [activities, setActivities] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedActivities, setSelectedActivities] = useState([]);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [pagination, setPagination] = useState({
//     currentPage: 1,
//     totalPages: 1,
//     totalItems: 0,
//     limit: 10,
//     hasNextPage: false,
//     hasPrevPage: false,
//   });
//   const [filterStatus, setFilterStatus] = useState("all");

//   // Per page options
//   const perPageOptions = [10, 20, 50, 100];

//   useEffect(() => {
//     fetchHistory();
//   }, [pagination.currentPage, pagination.limit, filterStatus, searchTerm]);

//   const fetchHistory = async () => {
//     setLoading(true);
//     try {
//       const res = await api.get("/projects");
//       const projects = res.data || [];
      
//       let allActivities = [];
//       projects.forEach(project => {
//         (project.tasks || []).forEach(task => {
//           if (task.updatedAt) {
//             // ✅ Use project status from Projects.jsx
//             const projectStatus = project.status || "Pending";
            
//             allActivities.push({
//               id: task._id,
//               taskName: task.name,
//               projectName: project.projectName,
//               projectId: project._id,
//               // ✅ Status from project, not task
//               status: projectStatus,
//               updatedAt: task.updatedAt,
//               createdAt: task.createdAt,
//               user: task.user?.name || "Unassigned",
//               userId: task.user?._id || null,
//               marks: task.obtainedMarks || 0,
//               description: task.description || "",
//               deadline: task.endDate,
//               projectStatus: projectStatus,
//             });
//           }
//         });
//       });

//       // Sort by updated date (newest first)
//       allActivities.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

//       // Apply search filter
//       if (searchTerm) {
//         const lower = searchTerm.toLowerCase();
//         allActivities = allActivities.filter(
//           act =>
//             act.taskName.toLowerCase().includes(lower) ||
//             act.projectName.toLowerCase().includes(lower) ||
//             act.user.toLowerCase().includes(lower)
//         );
//       }

//       // Apply status filter
//       if (filterStatus !== "all") {
//         allActivities = allActivities.filter(act => act.status === filterStatus);
//       }

//       // Pagination
//       const total = allActivities.length;
//       const limit = pagination.limit;
//       const currentPage = pagination.currentPage;
//       const totalPages = Math.ceil(total / limit);
//       const start = (currentPage - 1) * limit;
//       const end = start + limit;
//       const paginatedData = allActivities.slice(start, end);

//       setActivities(paginatedData);
//       setSelectedActivities([]);
//       setPagination({
//         ...pagination,
//         totalPages,
//         totalItems: total,
//         hasNextPage: currentPage < totalPages,
//         hasPrevPage: currentPage > 1,
//       });
//     } catch (error) {
//       console.error("Error fetching history:", error);
//       toast.error("Failed to load history");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePageChange = (newPage) => {
//     if (newPage >= 1 && newPage <= pagination.totalPages) {
//       setPagination(prev => ({ ...prev, currentPage: newPage }));
//     }
//   };

//   const handlePerPageChange = (newLimit) => {
//     setPagination(prev => ({ ...prev, limit: newLimit, currentPage: 1 }));
//   };

//   // ✅ Select/Deselect all
//   const handleSelectAll = (e) => {
//     if (e.target.checked) {
//       setSelectedActivities(activities.map(act => act.id));
//     } else {
//       setSelectedActivities([]);
//     }
//   };

//   // ✅ Select single activity
//   const handleSelectActivity = (activityId) => {
//     if (selectedActivities.includes(activityId)) {
//       setSelectedActivities(selectedActivities.filter(id => id !== activityId));
//     } else {
//       setSelectedActivities([...selectedActivities, activityId]);
//     }
//   };

//   // ✅ Delete selected activities
//   const handleDeleteSelected = async () => {
//     if (selectedActivities.length === 0) {
//       toast.error("Please select activities to delete");
//       return;
//     }

//     setShowDeleteModal(true);
//   };

//   const confirmDelete = async () => {
//     try {
//       // Delete each task
//       const deletePromises = selectedActivities.map(taskId => 
//         api.delete(`/projects/${activities.find(a => a.id === taskId)?.projectId}/tasks/${taskId}`)
//       );
      
//       await Promise.all(deletePromises);
//       toast.success(`${selectedActivities.length} activity(s) deleted successfully!`);
//       setShowDeleteModal(false);
//       setSelectedActivities([]);
//       fetchHistory();
//     } catch (error) {
//       console.error("Error deleting activities:", error);
//       toast.error("Failed to delete activities");
//     }
//   };

//   const formatDate = (date) => {
//     if (!date) return "N/A";
//     const d = new Date(date);
//     const now = new Date();
//     const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
//     if (diff === 0) return "Today";
//     if (diff === 1) return "Yesterday";
//     if (diff < 7) return `${diff} days ago`;
//     return d.toLocaleDateString('en-US', { 
//       year: 'numeric',
//       month: 'short', 
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   // ✅ Status colors from Projects.jsx
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
//       Completed: <CheckCircle className="w-3.5 h-3.5" />,
//       "In Progress": <Clock className="w-3.5 h-3.5" />,
//       Pending: <AlertCircle className="w-3.5 h-3.5" />,
//     };
//     return icons[status] || <AlertCircle className="w-3.5 h-3.5" />;
//   };

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
//         }}
//       />
//       <div className="bg-[#121212] rounded-xl border border-neutral-800 overflow-hidden">
//         <div className="p-4 md:p-6">
//           {/* Header */}
//           <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
//             <div className="flex items-center gap-3">
//               <button
//                 onClick={() => navigate("/admin/dashboard")}
//                 className="p-2 hover:bg-neutral-800 rounded-lg transition text-neutral-400 hover:text-white border border-transparent hover:border-neutral-700"
//               >
//                 <ArrowLeft className="w-5 h-5" />
//               </button>
//               <div>
//                 <h1 className="text-xl font-semibold text-white flex items-center gap-2">
//                   <Clock className="w-6 h-6 text-blue-400" />
//                   Activity History
//                 </h1>
//                 <p className="text-sm text-neutral-400 mt-1">
//                   Track all task activities across projects
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-center gap-3">
//               {selectedActivities.length > 0 && (
//                 <button
//                   onClick={handleDeleteSelected}
//                   className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
//                 >
//                   <Trash2 className="w-4 h-4" />
//                   Delete ({selectedActivities.length})
//                 </button>
//               )}
//               <button
//                 onClick={() => {
//                   setPagination(prev => ({ ...prev, currentPage: 1 }));
//                   fetchHistory();
//                 }}
//                 className="inline-flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition border border-neutral-700 hover:border-neutral-600"
//               >
//                 <RefreshCw className="w-4 h-4" />
//                 Refresh
//               </button>
//             </div>
//           </div>

//           {/* Search & Filters */}
//           <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800 p-4 mb-6">
//             <div className="flex flex-col md:flex-row gap-4">
//               <div className="flex-1 relative">
//                 <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
//                 <input
//                   type="text"
//                   placeholder="Search by task, project, or employee..."
//                   value={searchTerm}
//                   onChange={(e) => {
//                     setSearchTerm(e.target.value);
//                     setPagination(prev => ({ ...prev, currentPage: 1 }));
//                   }}
//                   className="w-full bg-[#121212] border border-neutral-800 text-white placeholder-neutral-500 pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
//                 />
//               </div>
//               <div className="flex items-center gap-2">
//                 <Filter className="w-4 h-4 text-neutral-500" />
//                 <select
//                   value={filterStatus}
//                   onChange={(e) => {
//                     setFilterStatus(e.target.value);
//                     setPagination(prev => ({ ...prev, currentPage: 1 }));
//                   }}
//                   className="bg-[#121212] border border-neutral-800 text-white px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-blue-500"
//                 >
//                   <option value="all">All Status</option>
//                   <option value="Completed">Completed</option>
//                   <option value="In Progress">In Progress</option>
//                   <option value="Pending">Pending</option>
//                 </select>
//               </div>
//               <div className="flex items-center gap-2">
//                 <span className="text-sm text-neutral-500 whitespace-nowrap">Show:</span>
//                 <select
//                   value={pagination.limit}
//                   onChange={(e) => handlePerPageChange(Number(e.target.value))}
//                   className="bg-[#121212] border border-neutral-800 text-white px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-blue-500"
//                 >
//                   {perPageOptions.map(option => (
//                     <option key={option} value={option}>{option}</option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Activities Table */}
//           {loading ? (
//             <div className="flex items-center justify-center py-20">
//               <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
//               <span className="ml-3 text-neutral-400">Loading history...</span>
//             </div>
//           ) : activities.length === 0 ? (
//             <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800 p-12 text-center">
//               <Clock className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
//               <h3 className="text-lg font-semibold text-neutral-300 mb-2">No Activity Found</h3>
//               <p className="text-neutral-500">No task activities found for the selected criteria.</p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead className="bg-[#0a0a0a] border-b border-neutral-800">
//                   <tr>
//                     <th className="px-4 py-3 text-left w-10">
//                       <input
//                         type="checkbox"
//                         checked={selectedActivities.length === activities.length && activities.length > 0}
//                         onChange={handleSelectAll}
//                         className="w-4 h-4 rounded border-neutral-600 bg-[#121212] text-blue-600 focus:ring-blue-500"
//                       />
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
//                       Task / Project
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider hidden md:table-cell">
//                       Assigned To
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
//                       Status
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider hidden lg:table-cell">
//                       Deadline
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider hidden sm:table-cell">
//                       Updated
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-neutral-800">
//                   {activities.map((activity) => (
//                     <tr
//                       key={activity.id}
//                       className="hover:bg-neutral-800/30 transition-colors cursor-pointer group"
//                       onClick={() => navigate(`/admin/project/${activity.projectId}`)}
//                     >
//                       <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
//                         <input
//                           type="checkbox"
//                           checked={selectedActivities.includes(activity.id)}
//                           onChange={() => handleSelectActivity(activity.id)}
//                           className="w-4 h-4 rounded border-neutral-600 bg-[#121212] text-blue-600 focus:ring-blue-500"
//                         />
//                       </td>
//                       <td className="px-4 py-3">
//                         <div>
//                           <p className="font-medium text-white">{activity.taskName}</p>
//                           <p className="text-xs text-neutral-500 flex items-center gap-1">
//                             <Briefcase className="w-3 h-3" />
//                             {activity.projectName}
//                           </p>
//                           {activity.description && (
//                             <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
//                               {activity.description}
//                             </p>
//                           )}
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 hidden md:table-cell">
//                         <div className="flex items-center gap-2">
//                           <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center">
//                             <User className="w-3 h-3 text-blue-400" />
//                           </div>
//                           <span className="text-sm text-neutral-300">{activity.user}</span>
//                         </div>
//                       </td>
//                       <td className="px-4 py-3">
//                         <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(activity.status)}`}>
//                           {getStatusIcon(activity.status)}
//                           {activity.status}
//                         </span>
//                       </td>
//                       <td className="px-4 py-3 hidden lg:table-cell">
//                         {activity.deadline ? (
//                           <span className="text-xs text-neutral-400 flex items-center gap-1">
//                             <Calendar className="w-3 h-3" />
//                             {formatDate(activity.deadline)}
//                           </span>
//                         ) : (
//                           <span className="text-xs text-neutral-500">-</span>
//                         )}
//                       </td>
//                       <td className="px-4 py-3 hidden sm:table-cell">
//                         <span className="text-xs text-neutral-400">
//                           {formatDate(activity.updatedAt)}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}

//           {/* Pagination */}
//           {!loading && activities.length > 0 && (
//             <div className="mt-6 bg-[#0a0a0a] rounded-xl border border-neutral-800 p-4">
//               <div className="flex flex-col md:flex-row items-center justify-between gap-4">
//                 <p className="text-sm text-neutral-500">
//                   Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
//                   {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of{" "}
//                   {pagination.totalItems} activities
//                 </p>

//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={() => handlePageChange(pagination.currentPage - 1)}
//                     disabled={!pagination.hasPrevPage}
//                     className={`p-2 rounded-lg transition-all ${
//                       pagination.hasPrevPage
//                         ? "bg-[#121212] hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700"
//                         : "bg-[#0a0a0a] text-neutral-600 cursor-not-allowed border border-neutral-800"
//                     }`}
//                   >
//                     <ChevronLeft className="w-5 h-5" />
//                   </button>

//                   <div className="flex items-center gap-1">
//                     {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => {
//                       let pageNum;
//                       if (pagination.totalPages <= 5) {
//                         pageNum = i + 1;
//                       } else if (pagination.currentPage <= 3) {
//                         pageNum = i + 1;
//                       } else if (pagination.currentPage >= pagination.totalPages - 2) {
//                         pageNum = pagination.totalPages - 4 + i;
//                       } else {
//                         pageNum = pagination.currentPage - 2 + i;
//                       }
                      
//                       return (
//                         <button
//                           key={pageNum}
//                           onClick={() => handlePageChange(pageNum)}
//                           className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
//                             pagination.currentPage === pageNum
//                               ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
//                               : "bg-[#121212] text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700"
//                           }`}
//                         >
//                           {pageNum}
//                         </button>
//                       );
//                     })}
//                   </div>

//                   <button
//                     onClick={() => handlePageChange(pagination.currentPage + 1)}
//                     disabled={!pagination.hasNextPage}
//                     className={`p-2 rounded-lg transition-all ${
//                       pagination.hasNextPage
//                         ? "bg-[#121212] hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700"
//                         : "bg-[#0a0a0a] text-neutral-600 cursor-not-allowed border border-neutral-800"
//                     }`}
//                   >
//                     <ChevronRight className="w-5 h-5" />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Delete Confirmation Modal */}
//       {showDeleteModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
//           <div className="absolute inset-0" onClick={() => setShowDeleteModal(false)} />
//           <div className="bg-[#121212] w-full max-w-md border border-neutral-800 rounded-xl overflow-hidden relative z-10">
//             <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-[#0a0a0a]">
//               <div className="flex items-center gap-2">
//                 <Trash2 className="w-5 h-5 text-rose-400" />
//                 <h2 className="text-lg font-semibold text-white">Delete Activities</h2>
//               </div>
//               <button
//                 onClick={() => setShowDeleteModal(false)}
//                 className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <div className="p-6">
//               <p className="text-neutral-300 mb-2">
//                 Are you sure you want to delete <span className="font-bold text-white">{selectedActivities.length}</span> activity(s)?
//               </p>
//               <p className="text-sm text-neutral-500">This action cannot be undone.</p>

//               <div className="flex gap-3 mt-6">
//                 <button
//                   onClick={() => setShowDeleteModal(false)}
//                   className="w-full border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-medium px-4 py-2 rounded-lg text-sm transition"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={confirmDelete}
//                   className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition shadow-lg shadow-rose-500/20"
//                 >
//                   Delete All
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default History;




import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../service/api.js";
import {
  ArrowLeft,
  Clock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  FileText,
  Briefcase,
  RefreshCw,
  Trash2,
  X,
  Plus,
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

const History = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [filterStatus, setFilterStatus] = useState("all");

  const perPageOptions = [10, 20, 50, 100];

  useEffect(() => {
    fetchHistory();
  }, [pagination.currentPage, pagination.limit, filterStatus, searchTerm]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get("/projects");
      const projects = res.data || [];
      
      let allActivities = [];
      projects.forEach(project => {
        (project.tasks || []).forEach(task => {
          if (task.updatedAt) {
            const projectStatus = project.status || "Pending";
            
            allActivities.push({
              id: task._id,
              taskName: task.name,
              projectName: project.projectName,
              projectId: project._id,
              status: projectStatus,
              updatedAt: task.updatedAt,
              createdAt: task.createdAt,
              user: task.user?.name || "Unassigned",
              userId: task.user?._id || null,
              marks: task.obtainedMarks || 0,
              description: task.description || "",
              deadline: task.endDate,
              projectStatus: projectStatus,
            });
          }
        });
      });

      allActivities.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        allActivities = allActivities.filter(
          act =>
            act.taskName.toLowerCase().includes(lower) ||
            act.projectName.toLowerCase().includes(lower) ||
            act.user.toLowerCase().includes(lower)
        );
      }

      if (filterStatus !== "all") {
        allActivities = allActivities.filter(act => act.status === filterStatus);
      }

      const total = allActivities.length;
      const limit = pagination.limit;
      const currentPage = pagination.currentPage;
      const totalPages = Math.ceil(total / limit);
      const start = (currentPage - 1) * limit;
      const end = start + limit;
      const paginatedData = allActivities.slice(start, end);

      setActivities(paginatedData);
      setSelectedActivities([]);
      setPagination({
        ...pagination,
        totalPages,
        totalItems: total,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      });
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handlePerPageChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit, currentPage: 1 }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedActivities(activities.map(act => act.id));
    } else {
      setSelectedActivities([]);
    }
  };

  const handleSelectActivity = (activityId) => {
    if (selectedActivities.includes(activityId)) {
      setSelectedActivities(selectedActivities.filter(id => id !== activityId));
    } else {
      setSelectedActivities([...selectedActivities, activityId]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedActivities.length === 0) {
      toast.error("Please select activities to delete");
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const deletePromises = selectedActivities.map(taskId => 
        api.delete(`/projects/${activities.find(a => a.id === taskId)?.projectId}/tasks/${taskId}`)
      );
      
      await Promise.all(deletePromises);
      toast.success(`${selectedActivities.length} activity(s) deleted successfully!`);
      setShowDeleteModal(false);
      setSelectedActivities([]);
      fetchHistory();
    } catch (error) {
      console.error("Error deleting activities:", error);
      toast.error("Failed to delete activities");
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20",
      "In Progress": "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20",
      Completed: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20",
    };
    return colors[status] || "bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/20";
  };

  const getStatusIcon = (status) => {
    const icons = {
      Completed: <CheckCircle className="w-3.5 h-3.5" />,
      "In Progress": <Clock className="w-3.5 h-3.5" />,
      Pending: <AlertCircle className="w-3.5 h-3.5" />,
    };
    return icons[status] || <AlertCircle className="w-3.5 h-3.5" />;
  };

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
        }}
      />
      <div className="ui-card">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-color)]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Clock className="w-6 h-6 text-[var(--accent-primary)]" />
                  Activity History
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Track all task activities across projects
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedActivities.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="ui-btn bg-[var(--danger)] hover:bg-[var(--danger)]/80 text-white inline-flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedActivities.length})
                </button>
              )}
              <button
                onClick={() => {
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                  fetchHistory();
                }}
                className="ui-btn inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="ui-card p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by task, project, or employee..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPagination(prev => ({ ...prev, currentPage: 1 }));
                  }}
                  className="ui-input w-full pl-10 pr-4 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[var(--text-muted)]" />
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPagination(prev => ({ ...prev, currentPage: 1 }));
                  }}
                  className="ui-input text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">Show:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => handlePerPageChange(Number(e.target.value))}
                  className="ui-input text-sm"
                >
                  {perPageOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Activities Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
              <span className="ml-3 text-[var(--text-secondary)]">Loading history...</span>
            </div>
          ) : activities.length === 0 ? (
            <div className="ui-card p-12 text-center">
              <Clock className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-2">No Activity Found</h3>
              <p className="text-[var(--text-muted)]">No task activities found for the selected criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectedActivities.length === activities.length && activities.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                      Task / Project
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">
                      Assigned To
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider hidden lg:table-cell">
                      Deadline
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {activities.map((activity) => (
                    <tr
                      key={activity.id}
                      className="hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group"
                      onClick={() => navigate(`/admin/project/${activity.projectId}`)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedActivities.includes(activity.id)}
                          onChange={() => handleSelectActivity(activity.id)}
                          className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{activity.taskName}</p>
                          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {activity.projectName}
                          </p>
                          {activity.description && (
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                              {activity.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
                            <User className="w-3 h-3 text-[var(--accent-primary)]" />
                          </div>
                          <span className="text-sm text-[var(--text-secondary)]">{activity.user}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(activity.status)}`}>
                          {getStatusIcon(activity.status)}
                          {activity.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {activity.deadline ? (
                          <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(activity.deadline)}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-[var(--text-secondary)]">
                          {formatDate(activity.updatedAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && activities.length > 0 && (
            <div className="mt-6 ui-card p-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm text-[var(--text-muted)]">
                  Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of{" "}
                  {pagination.totalItems} activities
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className={`p-2 rounded-lg transition-all ${
                      pagination.hasPrevPage
                        ? "ui-btn"
                        : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-color)]"
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                            pagination.currentPage === pageNum
                              ? "ui-btn ui-btn-primary"
                              : "ui-btn"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className={`p-2 rounded-lg transition-all ${
                      pagination.hasNextPage
                        ? "ui-btn"
                        : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-color)]"
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setShowDeleteModal(false)} />
          <div className="ui-card w-full max-w-md relative z-10">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4 bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-[var(--danger)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Delete Activities</h2>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-[var(--text-secondary)] mb-2">
                Are you sure you want to delete <span className="font-bold text-[var(--text-primary)]">{selectedActivities.length}</span> activity(s)?
              </p>
              <p className="text-sm text-[var(--text-muted)]">This action cannot be undone.</p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="ui-btn w-full"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="ui-btn w-full bg-[var(--danger)] hover:bg-[var(--danger)]/80 text-white"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default History;