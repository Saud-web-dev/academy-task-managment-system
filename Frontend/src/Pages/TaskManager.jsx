import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../service/api.js";
import SSIPageLoader from "../components/SSIPageLoader";
import {
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  User,
  Loader2,
  Search,
  Filter,
  XCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Star,
  ArrowLeft,
  Check,
  X,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

const TaskManager = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  useEffect(() => {
    const getUserData = () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsed = JSON.parse(userData);
          const id = parsed._id || parsed.id || parsed.userId;
          if (id) {
            setEmployeeId(id);
          }
        }
      } catch (error) {
        console.error("Error getting user data:", error);
      }
    };
    getUserData();
  }, []);

  useEffect(() => {
    if (employeeId) {
      fetchTasks();
    }
  }, [employeeId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/projects");
      const projects = res.data?.data || res.data || [];

      const allTasks = [];
      projects.forEach(project => {
        (project.tasks || []).forEach(task => {
          const assigneeIds = [task.user, ...(task.users || [])]
            .filter(Boolean)
            .map((assignee) => String(assignee?._id || assignee));
          if (assigneeIds.includes(String(employeeId))) {
            allTasks.push({
              ...task,
              projectName: project.projectName || project.name || "Unassigned Project",
              projectId: project._id,
              projectStatus: project.status || "Pending",
            });
          }
        });
      });

      setTasks(allTasks);
    } catch (error) {
      console.error("❌ Error fetching tasks:", error);
      setError("Failed to load tasks. Please try again.");
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, projectId, field, value) => {
    setUpdatingTaskId(taskId);
    try {
      const updateData = { [field]: value };
      
      if (field === 'basicWork' && value === false) {
        updateData.completed = false;
        updateData.tested = false;
      }
      
      if (field === 'completed' && value === false) {
        updateData.tested = false;
      }

      await api.put(`/projects/${projectId}/tasks/${taskId}`, updateData);
      
      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task._id === taskId) {
            const updatedTask = { ...task, [field]: value };
            if (field === 'basicWork' && value === false) {
              updatedTask.completed = false;
              updatedTask.tested = false;
            }
            if (field === 'completed' && value === false) {
              updatedTask.tested = false;
            }
            return updatedTask;
          }
          return task;
        })
      );

      toast.success("Task status updated!");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update task");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleCheckboxChange = (task, field, checked) => {
    if (field === 'completed' && !task.basicWork) {
      toast.error("Please complete Basic Work first");
      return;
    }

    if (field === 'tested' && !task.completed) {
      toast.error("Please complete the task first");
      return;
    }

    if (field === 'basicWork' && !checked) {
      updateTaskStatus(task._id, task.projectId, 'basicWork', false);
      return;
    }

    if (field === 'completed' && !checked) {
      updateTaskStatus(task._id, task.projectId, 'completed', false);
      return;
    }

    updateTaskStatus(task._id, task.projectId, field, checked);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" ||
                          (filterStatus === "completed" && task.completed) ||
                          (filterStatus === "pending" && !task.completed && !task.basicWork) ||
                          (filterStatus === "inprogress" && task.basicWork && !task.completed) ||
                          (filterStatus === "missed" && task.isMissed);

    return matchesSearch && matchesStatus;
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTaskStatus = (task) => {
    if (task.completed && task.tested) {
      return { 
        label: "Completed & Tested", 
        color: "bg-emerald-50 text-emerald-600 border-emerald-200", 
        icon: <CheckCircle className="w-3 h-3" />,
        progress: 100
      };
    }
    if (task.completed) {
      return { 
        label: "Completed", 
        color: "bg-emerald-50 text-emerald-600 border-emerald-200", 
        icon: <CheckCircle className="w-3 h-3" />,
        progress: 75
      };
    }
    if (task.basicWork) {
      return { 
        label: "In Progress", 
        color: "bg-blue-50 text-blue-600 border-blue-200", 
        icon: <Clock className="w-3 h-3" />,
        progress: 33
      };
    }
    if (task.isMissed) {
      return { 
        label: "Missed Deadline", 
        color: "bg-red-50 text-red-600 border-red-200", 
        icon: <AlertTriangle className="w-3 h-3" />,
        progress: 0
      };
    }
    return { 
      label: "Not Started", 
      color: "bg-gray-50 text-gray-500 border-gray-200", 
      icon: <AlertCircle className="w-3 h-3" />,
      progress: 0
    };
  };

  const getMarksColor = (marks) => {
    if (marks >= 80) return "text-emerald-600";
    if (marks >= 60) return "text-blue-600";
    if (marks >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const getTaskWarning = (task) => {
    if (!task.endDate) return null;
    if (task.completed) return null;

    const today = new Date();
    const endDate = new Date(task.endDate);
    if (isNaN(endDate.getTime())) return null;

    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { type: "overdue", message: "⚠️ Overdue", color: "bg-red-50 text-red-600 border-red-200" };
    }
    if (diffDays <= 3) {
      return { type: "warning", message: "⚠️ Due Soon", color: "bg-amber-50 text-amber-600 border-amber-200" };
    }
    return null;
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed && t.tested).length,
    inprogress: tasks.filter(t => t.basicWork && !t.completed).length,
    pending: tasks.filter(t => !t.basicWork && !t.completed).length,
    missed: tasks.filter(t => t.isMissed).length,
  };

  if (loading) {
    return <SSIPageLoader message="Loading your tasks..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-red-600" />
        <p className="text-[#8a7a6a] text-sm">{error}</p>
        <button
          onClick={fetchTasks}
          className="bg-[#2c1810] hover:bg-[#2c1810]/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f0eb] p-3 sm:p-4">
      <div className="max-w-6xl mx-auto space-y-4">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e5ddd5]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/layout/desboards")}
              className="p-2 hover:bg-[#f5f0eb] rounded-lg transition text-[#8a7a6a] hover:text-[#2c1810] border border-transparent hover:border-[#e5ddd5]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-[#2c1810]">My Tasks</h1>
              <p className="text-sm text-[#8a7a6a]">View and track your assigned tasks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8a7a6a] bg-[#faf7f3] px-3 py-1.5 rounded-full border border-[#e5ddd5]">
              {stats.total} tasks
            </span>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[#faf7f3] border border-[#e5ddd5] rounded-xl p-3 text-center hover:border-[#d4c8bc] transition">
            <FileText className="w-5 h-5 text-[#2c1810] mx-auto mb-1" />
            <p className="text-xl font-bold text-[#2c1810]">{stats.total}</p>
            <p className="text-[9px] text-[#8a7a6a] uppercase tracking-wider">Total</p>
          </div>
          <div className="bg-[#faf7f3] border border-[#e5ddd5] rounded-xl p-3 text-center hover:border-[#d4c8bc] transition">
            <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-emerald-600">{stats.completed}</p>
            <p className="text-[9px] text-[#8a7a6a] uppercase tracking-wider">Done</p>
          </div>
          <div className="bg-[#faf7f3] border border-[#e5ddd5] rounded-xl p-3 text-center hover:border-[#d4c8bc] transition">
            <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-blue-600">{stats.inprogress}</p>
            <p className="text-[9px] text-[#8a7a6a] uppercase tracking-wider">In Progress</p>
          </div>
          <div className="bg-[#faf7f3] border border-[#e5ddd5] rounded-xl p-3 text-center hover:border-[#d4c8bc] transition">
            <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-[9px] text-[#8a7a6a] uppercase tracking-wider">Pending</p>
          </div>
          <div className="bg-[#faf7f3] border border-[#e5ddd5] rounded-xl p-3 text-center hover:border-[#d4c8bc] transition">
            <AlertTriangle className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-red-600">{stats.missed}</p>
            <p className="text-[9px] text-[#8a7a6a] uppercase tracking-wider">Missed</p>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8a7a6a] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks by name, project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#faf7f3] border border-[#e5ddd5] focus:border-[#2c1810] focus:ring-1 focus:ring-[#2c1810] text-[#2c1810] placeholder-[#8a7a6a] rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-colors"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 bg-[#faf7f3] hover:bg-[#f5f0eb] text-[#2c1810] px-3 py-2 rounded-lg text-sm font-medium transition border border-[#e5ddd5]"
            >
              <Filter className="w-4 h-4" />
              Filters
              {filterStatus !== "all" && (
                <span className="ml-1 w-2 h-2 rounded-full bg-[#2c1810]"></span>
              )}
            </button>

            {filterStatus !== "all" && (
              <button
                onClick={() => setFilterStatus("all")}
                className="text-xs text-[#8a7a6a] hover:text-[#2c1810] transition flex items-center gap-1"
              >
                <XCircle className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div className="bg-[#faf7f3] border border-[#e5ddd5] rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-[#8a7a6a] uppercase tracking-wider">Status:</span>
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    filterStatus === "all"
                      ? "bg-[#2c1810] text-white"
                      : "bg-[#f5f0eb] text-[#8a7a6a] hover:text-[#2c1810] border border-[#e5ddd5]"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus("completed")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    filterStatus === "completed"
                      ? "bg-emerald-600 text-white"
                      : "bg-[#f5f0eb] text-[#8a7a6a] hover:text-[#2c1810] border border-[#e5ddd5]"
                  }`}
                >
                  Done
                </button>
                <button
                  onClick={() => setFilterStatus("inprogress")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    filterStatus === "inprogress"
                      ? "bg-blue-600 text-white"
                      : "bg-[#f5f0eb] text-[#8a7a6a] hover:text-[#2c1810] border border-[#e5ddd5]"
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setFilterStatus("pending")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    filterStatus === "pending"
                      ? "bg-amber-600 text-white"
                      : "bg-[#f5f0eb] text-[#8a7a6a] hover:text-[#2c1810] border border-[#e5ddd5]"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus("missed")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    filterStatus === "missed"
                      ? "bg-red-600 text-white"
                      : "bg-[#f5f0eb] text-[#8a7a6a] hover:text-[#2c1810] border border-[#e5ddd5]"
                  }`}
                >
                  Missed
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TASKS LIST */}
        {filteredTasks.length === 0 ? (
          <div className="bg-[#faf7f3] border border-[#e5ddd5] rounded-xl p-12 text-center border-dashed">
            {tasks.length === 0 ? (
              <>
                <FileText className="w-12 h-12 text-[#8a7a6a] mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-[#8a7a6a]">No tasks assigned</h3>
                <p className="text-xs text-[#8a7a6a] mt-1">You don't have any tasks yet.</p>
              </>
            ) : (
              <>
                <Search className="w-12 h-12 text-[#8a7a6a] mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-[#8a7a6a]">No matching tasks</h3>
                <p className="text-xs text-[#8a7a6a] mt-1">Try adjusting your search or filters</p>
                <button
                  onClick={() => { setSearchTerm(""); setFilterStatus("all"); }}
                  className="mt-3 text-xs text-[#2c1810] hover:text-[#2c1810]/70 transition"
                >
                  Clear all filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map((task) => {
              const status = getTaskStatus(task);
              const warning = getTaskWarning(task);
              const isExpanded = expandedId === task._id;
              const marksColor = getMarksColor(task.obtainedMarks || 0);
              const isUpdating = updatingTaskId === task._id;

              return (
                <div
                  key={task._id}
                  className={`bg-[#faf7f3] border rounded-xl overflow-hidden transition-all ${
                    warning?.type === "overdue" ? "border-red-300" : "border-[#e5ddd5]"
                  } hover:border-[#d4c8bc]`}
                >
                  <div 
                    className="p-4 cursor-pointer hover:bg-[#f5f0eb] transition-colors"
                    onClick={() => toggleExpand(task._id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-[#2c1810]">
                            {task.name}
                          </h3>
                          {warning && (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${warning.color}`}>
                              {warning.message}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#8a7a6a] flex-wrap">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {task.projectName}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-[#e5ddd5]"></span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {task.endDate ? formatDate(task.endDate) : "No deadline"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {task.obtainedMarks > 0 && (
                          <span className={`text-sm font-bold ${marksColor}`}>
                            {task.obtainedMarks} pts
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border ${status.color}`}>
                          {status.icon}
                          {status.label}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#8a7a6a] flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#8a7a6a] flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-[#e5ddd5] space-y-3">
                      {task.description && (
                        <div className="bg-[#f5f0eb] rounded-lg p-3">
                          <h5 className="text-[10px] font-semibold text-[#8a7a6a] uppercase tracking-wider mb-1 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Description
                          </h5>
                          <p className="text-sm text-[#8a7a6a]">{task.description}</p>
                        </div>
                      )}

                      <div className="bg-[#f5f0eb] rounded-lg p-4">
                        <h5 className="text-[10px] font-semibold text-[#8a7a6a] uppercase tracking-wider mb-3 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Task Progress
                        </h5>
                        
                        <div className="flex flex-wrap items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={task.basicWork || false}
                              onChange={(e) => handleCheckboxChange(task, 'basicWork', e.target.checked)}
                              disabled={isUpdating}
                              className="w-4 h-4 rounded border-[#e5ddd5] text-[#2c1810] focus:ring-[#2c1810] focus:ring-offset-0 transition-colors cursor-pointer disabled:opacity-50"
                            />
                            <span className={`text-xs font-medium ${task.basicWork ? "text-[#2c1810]" : "text-[#8a7a6a]"} group-hover:text-[#2c1810] transition`}>
                              Basic Work
                            </span>
                            {task.basicWork && (
                              <Check className="w-3 h-3 text-[#2c1810]" />
                            )}
                          </label>

                          <div className="w-px h-5 bg-[#e5ddd5]"></div>

                          <label className={`flex items-center gap-2 cursor-pointer group ${!task.basicWork ? "opacity-50 cursor-not-allowed" : ""}`}>
                            <input
                              type="checkbox"
                              checked={task.completed || false}
                              onChange={(e) => handleCheckboxChange(task, 'completed', e.target.checked)}
                              disabled={!task.basicWork || isUpdating}
                              className="w-4 h-4 rounded border-[#e5ddd5] text-emerald-600 focus:ring-emerald-600 focus:ring-offset-0 transition-colors cursor-pointer disabled:cursor-not-allowed"
                            />
                            <span className={`text-xs font-medium ${task.completed ? "text-emerald-600" : "text-[#8a7a6a]"} group-hover:text-[#2c1810] transition`}>
                              Completed
                            </span>
                            {task.completed && (
                              <Check className="w-3 h-3 text-emerald-600" />
                            )}
                          </label>

                          <div className="w-px h-5 bg-[#e5ddd5]"></div>

                          <label className={`flex items-center gap-2 cursor-pointer group ${!task.completed ? "opacity-50 cursor-not-allowed" : ""}`}>
                            <input
                              type="checkbox"
                              checked={task.tested || false}
                              onChange={(e) => handleCheckboxChange(task, 'tested', e.target.checked)}
                              disabled={!task.completed || isUpdating}
                              className="w-4 h-4 rounded border-[#e5ddd5] text-blue-600 focus:ring-blue-600 focus:ring-offset-0 transition-colors cursor-pointer disabled:cursor-not-allowed"
                            />
                            <span className={`text-xs font-medium ${task.tested ? "text-blue-600" : "text-[#8a7a6a]"} group-hover:text-[#2c1810] transition`}>
                              Tested
                            </span>
                            {task.tested && (
                              <Check className="w-3 h-3 text-blue-600" />
                            )}
                          </label>

                          {isUpdating && (
                            <Loader2 className="w-4 h-4 animate-spin text-[#2c1810] ml-2" />
                          )}

                          <div className="ml-auto flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-[#e5ddd5] rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500 bg-[#2c1810]"
                                style={{ width: `${status.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-[#8a7a6a] font-medium">
                              {status.progress}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-[#f5f0eb] rounded-lg p-3">
                          <h5 className="text-[10px] font-semibold text-[#8a7a6a] uppercase tracking-wider">Status</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.color}`}>
                              {status.icon}
                              {status.label}
                            </span>
                          </div>
                        </div>

                        <div className="bg-[#f5f0eb] rounded-lg p-3">
                          <h5 className="text-[10px] font-semibold text-[#8a7a6a] uppercase tracking-wider">Dates</h5>
                          <div className="space-y-0.5 mt-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-[#8a7a6a]">Start:</span>
                              <span className="text-[#2c1810]">{formatDate(task.startDate)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#8a7a6a]">Deadline:</span>
                              <span className={`${task.isMissed ? "text-red-600 font-medium" : "text-[#2c1810]"}`}>
                                {formatDate(task.endDate)}
                                {task.isMissed && " ⚠️"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#f5f0eb] rounded-lg p-3">
                          <h5 className="text-[10px] font-semibold text-[#8a7a6a] uppercase tracking-wider">Performance</h5>
                          <div className="space-y-0.5 mt-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-[#8a7a6a]">Marks:</span>
                              <span className={`font-bold ${marksColor}`}>{task.obtainedMarks || 0} / 100</span>
                            </div>
                            {task.client && (
                              <div className="flex justify-between">
                                <span className="text-[#8a7a6a]">Client:</span>
                                <span className="text-[#2c1810]">{task.client}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-[10px] text-[#8a7a6a]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Created: {formatDateTime(task.createdAt)}
                        </span>
                        {task.updatedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Updated: {formatDateTime(task.updatedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;
