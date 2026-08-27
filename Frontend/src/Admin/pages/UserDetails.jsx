import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../service/api.js';
import SSIPageLoader from '../../components/SSIPageLoader';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Shield,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  FolderKanban,
  Briefcase,
  Trophy,
  GraduationCap,
  Edit2,
  Trash2,
  Save,
  X,
  Check,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userTasks, setUserTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: '',
    isActive: true,
    marks: 0,
    totalMarks: 0,
    manualMarks: 0,
    workStartTime: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deadlineStats, setDeadlineStats] = useState({
    totalMissed: 0,
    missedTasks: [],
    autoZeroedTasks: [],
  });

  useEffect(() => {
    fetchUserDetails();
    fetchUserTasks();
  }, [userId]);

  const fetchUserDetails = useCallback(async () => {
    try {
      // Fetch this specific user directly — always gets latest marks from DB
      const res = await api.get(`/user/${userId}`);
      const foundUser = res.data.user;

      if (foundUser) {
        setUser(foundUser);
        setEditFormData({
          name: foundUser.name || '',
          email: foundUser.email || '',
          role: foundUser.role || 'employee',
          isActive:
            foundUser.isActive !== undefined ? foundUser.isActive : true,
          marks: foundUser.marks ?? 0,
          totalMarks: foundUser.totalMarks ?? 0,
          manualMarks: foundUser.manualMarks ?? 0,
          workStartTime: foundUser.workStartTime || '',
        });
      } else {
        toast.error('User not found');
        navigate('/admin/users');
      }
    } catch {
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  }, [userId, navigate]);

  const fetchUserTasks = useCallback(async () => {
    try {
      const res = await api.get('/projects');
      const allProjects = res.data || [];
      setProjects(allProjects);

      const tasks = [];
      let missedCount = 0;
      const missedTasksList = [];
      const autoZeroedList = [];

      allProjects.forEach((project) => {
        (project.tasks || []).forEach((task) => {
          const taskUser = task.user?._id || task.user;
          const isUserTask = taskUser === userId || taskUser?._id === userId;

          if (isUserTask) {
            const today = new Date();
            const deadline = task.endDate ? new Date(task.endDate) : null;
            const isMissed = deadline && deadline < today && !task.completed;

            if (isMissed) {
              missedCount++;
              missedTasksList.push(task._id);
            }

            const shouldZero = deadline && deadline < today && !task.completed;
            const taskCopy = { ...task };

            if (shouldZero && task.obtainedMarks > 0) {
              autoZeroedList.push(task._id);
              taskCopy.obtainedMarks = 0;
              taskCopy.completed = false;
            }

            tasks.push({
              ...taskCopy,
              projectName: project.projectName,
              projectId: project._id,
              isMissed: isMissed,
              daysOverdue: isMissed
                ? Math.floor((today - deadline) / (1000 * 60 * 60 * 24))
                : 0,
            });
          }
        });
      });

      setDeadlineStats({
        totalMissed: missedCount,
        missedTasks: missedTasksList,
        autoZeroedTasks: autoZeroedList,
      });

      setUserTasks(tasks);

      if (autoZeroedList.length > 0) {
        toast.warning(
          `${autoZeroedList.length} task(s) have missed deadline. Marks will show as 0.`
        );
      }
    } catch {
      toast.error('Failed to load user tasks');
    }
  }, [userId]);

  const handleUpdateUser = async () => {
    setSubmitting(true);
    try {
      const res = await api.put(`/user/update/${userId}`, editFormData);
      // Use fresh data from response — includes recalculated marks
      setUser(res.data.user);
      setEditFormData((prev) => ({
        ...prev,
        marks: res.data.user.marks,
        totalMarks: res.data.user.totalMarks,
        manualMarks: res.data.user.manualMarks ?? 0,
      }));
      toast.success('User updated successfully!');
      setIsEditing(false);
      fetchUserTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm(`Are you sure you want to delete ${user?.name}?`))
      return;

    setSubmitting(true);
    try {
      await api.delete(`/user/delete/${userId}`);
      toast.success('User deleted successfully!');
      navigate('/admin/users');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = !editFormData.isActive;
    setSubmitting(true);
    try {
      await api.put(`/user/status/${userId}`, { isActive: newStatus });
      setUser({ ...user, isActive: newStatus });
      setEditFormData({ ...editFormData, isActive: newStatus });
      toast.success(
        `User ${newStatus ? 'activated' : 'deactivated'} successfully!`
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    const newPassword = prompt('Enter new password (min 6 characters):');
    if (!newPassword || newPassword.length < 6) {
      if (newPassword) toast.error('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/user/update/${userId}`, { password: newPassword });
      toast.success('Password reset successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = useCallback((status) => {
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
      'bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/20'
    );
  }, []);

  const getStatusIcon = useCallback((status) => {
    const icons = {
      Completed: CheckCircle2,
      'In Progress': Clock,
      Pending: AlertCircle,
    };
    return icons[status] || AlertCircle;
  }, []);

  const getMarksColor = useCallback((marks) => {
    if (marks >= 80) return 'text-[var(--success)]';
    if (marks >= 60) return 'text-[var(--accent-primary)]';
    if (marks >= 40) return 'text-[var(--warning)]';
    return 'text-[var(--danger)]';
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const stats = useMemo(() => {
    const total = userTasks.length;
    const completed = userTasks.filter((t) => t.completed).length;
    const inProgress = userTasks.filter(
      (t) => t.status === 'In Progress'
    ).length;
    const pending = userTasks.filter((t) => t.status === 'Pending').length;
    const totalMarks = userTasks.reduce(
      (sum, t) => sum + (t.obtainedMarks || 0),
      0
    );
    const avgMarks = total > 0 ? Math.round(totalMarks / total) : 0;
    return { total, completed, inProgress, pending, totalMarks, avgMarks };
  }, [userTasks]);

  if (loading) {
    return <SSIPageLoader message="Loading user details..." />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <User className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
        <p className="text-[var(--text-secondary)] text-lg">User not found</p>
        <button
          onClick={() => navigate('/admin/users')}
          className="mt-4 text-[var(--accent-primary)] hover:text-[var(--accent-hover)] text-sm font-medium transition"
        >
          Go back to users
        </button>
      </div>
    );
  }

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
          success: {
            iconTheme: {
              primary: 'var(--success)',
              secondary: 'var(--text-inverse)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--danger)',
              secondary: 'var(--text-inverse)',
            },
          },
        }}
      />
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden">
        {/* Header */}
        <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/admin/users')}
                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-color)] flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {!isEditing ? (
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-hover)] flex items-center justify-center text-white text-base sm:text-xl font-bold shadow-lg ring-2 ring-[var(--accent-primary)]/30 flex-shrink-0">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-base sm:text-xl font-semibold text-[var(--text-primary)] truncate">
                      {user.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs sm:text-sm text-[var(--text-secondary)] flex items-center gap-1 truncate max-w-[120px] sm:max-w-full">
                        <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </span>
                      <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 rounded-full capitalize whitespace-nowrap">
                        {user.role === 'superAdmin' ? 'Admin (Super Admin)' : user.role === 'teamLeader' ? 'Team Leader' : user.role === 'admin' ? 'Team Leader' : user.role}
                      </span>
                      <span
                        className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${
                          user.isActive
                            ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'
                            : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {deadlineStats.totalMissed > 0 && (
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full border bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20 flex items-center gap-1 whitespace-nowrap">
                          <AlertTriangle className="w-3 h-3" />
                          {deadlineStats.totalMissed} Missed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          name: e.target.value,
                        })
                      }
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                      placeholder="Name"
                    />
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          email: e.target.value,
                        })
                      }
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                      placeholder="Email"
                    />
                    <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {/* Total Marks */}
                      <div>
                        <label className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                          Base Marks
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editFormData.totalMarks}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              totalMarks: Number(e.target.value),
                            })
                          }
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-2 py-1.5 text-sm outline-none transition-colors"
                        />
                      </div>
                      {/* Manual/Bonus Marks */}
                      <div>
                        <label className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                          Bonus Marks
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editFormData.manualMarks}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              manualMarks: Number(e.target.value),
                            })
                          }
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-2 py-1.5 text-sm outline-none transition-colors"
                        />
                      </div>
                      {/* Remaining Marks */}
                      <div>
                        <label className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                          Remaining Marks
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editFormData.marks}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              marks: Number(e.target.value),
                            })
                          }
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-2 py-1.5 text-sm outline-none transition-colors"
                        />
                      </div>
                      {/* Work Start Time */}
                      <div>
                        <label className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                          Work Start Time
                        </label>
                        <input
                          type="time"
                          value={editFormData.workStartTime}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              workStartTime: e.target.value,
                            })
                          }
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-2 py-1.5 text-sm outline-none transition-colors"
                        />
                      </div>
                      {/* Role */}
                      <div>
                        <label className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                          Role
                        </label>
                        <select
                          value={editFormData.role}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              role: e.target.value,
                            })
                          }
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-2 py-1.5 text-sm outline-none transition-colors"
                        >
                          <option value="employee">Employee</option>
                          <option value="teamLeader">Team Leader</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition"
                    title="Edit User"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    disabled={submitting}
                    className={`p-1.5 sm:p-2 rounded-lg transition ${
                      user.isActive
                        ? 'text-[var(--warning)] hover:bg-[var(--warning)]/10'
                        : 'text-[var(--success)] hover:bg-[var(--success)]/10'
                    }`}
                    title={user.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {user.isActive ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={submitting}
                    className="p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-[var(--accent-light)] hover:bg-[var(--accent-light)]/10 rounded-lg transition"
                    title="Reset Password"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={submitting}
                    className="p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition"
                    title="Delete User"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleUpdateUser}
                    disabled={submitting}
                    className="p-1.5 sm:p-2 text-[var(--success)] hover:bg-[var(--success)]/10 rounded-lg transition"
                    title="Save Changes"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditFormData({
                        name: user.name || '',
                        email: user.email || '',
                        role: user.role || 'employee',
                        isActive:
                          user.isActive !== undefined ? user.isActive : true,
                        marks: user.marks || 0,
                        totalMarks: user.totalMarks ?? 0,
                        manualMarks: user.manualMarks ?? 0,
                        workStartTime: user.workStartTime || '',
                      });
                    }}
                    className="p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Deadline Warning Banner */}
        {deadlineStats.totalMissed > 0 && (
          <div className="bg-[var(--danger)]/10 border-b border-[var(--danger)]/20 px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 overflow-x-auto">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--danger)] flex-shrink-0" />
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-[var(--danger)] font-medium whitespace-nowrap">
                {deadlineStats.totalMissed} task(s) missed deadline
              </span>
              <span className="text-[10px] sm:text-xs text-[var(--danger)]/70">
                Marks will show as 0 for these tasks
              </span>
            </div>
          </div>
        )}

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 p-3 sm:p-4 border-b border-[var(--border-color)]">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-2 sm:p-3 text-center border border-[var(--border-color)]">
            <FolderKanban className="w-4 h-4 text-[var(--accent-primary)] mx-auto mb-1" />
            <p className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              {stats.total}
            </p>
            <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-medium">
              Total Tasks
            </p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-lg p-2 sm:p-3 text-center border border-[var(--border-color)]">
            <CheckCircle2 className="w-4 h-4 text-[var(--success)] mx-auto mb-1" />
            <p className="text-base sm:text-lg font-bold text-[var(--success)]">
              {stats.completed}
            </p>
            <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-medium">
              Completed
            </p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-lg p-2 sm:p-3 text-center border border-[var(--border-color)]">
            <Clock className="w-4 h-4 text-[var(--accent-primary)] mx-auto mb-1" />
            <p className="text-base sm:text-lg font-bold text-[var(--accent-primary)]">
              {stats.inProgress}
            </p>
            <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-medium">
              In Progress
            </p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-lg p-2 sm:p-3 text-center border border-[var(--border-color)]">
            <AlertCircle className="w-4 h-4 text-[var(--warning)] mx-auto mb-1" />
            <p className="text-base sm:text-lg font-bold text-[var(--warning)]">
              {stats.pending}
            </p>
            <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-medium">
              Pending
            </p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-lg p-2 sm:p-3 text-center border border-[var(--border-color)]">
            <Trophy className="w-4 h-4 text-[var(--accent-light)] mx-auto mb-1" />
            <p className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              {stats.totalMarks}
            </p>
            <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-medium">
              Total Marks
            </p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-lg p-2 sm:p-3 text-center border border-[var(--border-color)]">
            <GraduationCap className="w-4 h-4 text-[var(--accent-light)] mx-auto mb-1" />
            <p
              className={`text-base sm:text-lg font-bold ${getMarksColor(stats.avgMarks)}`}
            >
              {stats.avgMarks}
            </p>
            <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-medium">
              Avg Marks
            </p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-lg p-2 sm:p-3 text-center border border-[var(--border-color)]">
            <AlertTriangle className="w-4 h-4 text-[var(--danger)] mx-auto mb-1" />
            <p className="text-base sm:text-lg font-bold text-[var(--danger)]">
              {deadlineStats.totalMissed}
            </p>
            <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-medium">
              Missed
            </p>
          </div>
        </div>

        {/* Marks Info Row */}
        <div className="px-3 sm:px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Marks progress bar */}
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Marks Remaining
                </span>
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {user.marks ?? 0} / {(user.totalMarks ?? 0) + (user.manualMarks ?? 0)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--border-color)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((user.marks ?? 0) / Math.max((user.totalMarks ?? 0) + (user.manualMarks ?? 0), 1)) * 100)}%`,
                    backgroundColor:
                      (user.marks ?? 0) / Math.max((user.totalMarks ?? 0) + (user.manualMarks ?? 0), 1) >= 0.7
                        ? 'var(--success)'
                        : (user.marks ?? 0) / Math.max((user.totalMarks ?? 0) + (user.manualMarks ?? 0), 1) >= 0.4
                          ? 'var(--warning)'
                          : 'var(--danger)',
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[9px] text-[var(--text-muted)]">
                  {(
                    ((user.marks ?? 0) / Math.max((user.totalMarks ?? 0) + (user.manualMarks ?? 0), 1)) *
                    100
                  ).toFixed(1)}% remaining
                </p>
                {(user.manualMarks ?? 0) > 0 && (
                  <p className="text-[9px] text-[var(--success)]">
                    +{user.manualMarks} bonus marks included
                  </p>
                )}
              </div>
              {(user.manualMarks ?? 0) > 0 && (
                <div className="flex items-center gap-3 mt-1.5 text-[9px] text-[var(--text-muted)]">
                  <span>Base: <strong className="text-[var(--text-primary)]">{user.totalMarks ?? 0}</strong></span>
                  <span className="text-[var(--success)]">Bonus: <strong>+{user.manualMarks}</strong></span>
                  <span>Total: <strong className="text-[var(--text-primary)]">{(user.totalMarks ?? 0) + (user.manualMarks ?? 0)}</strong></span>
                </div>
              )}
            </div>
            {/* Work start time badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
              <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
              <div>
                <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">
                  Work Start Time
                </p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {user.workStartTime && user.workStartTime !== '' ? (
                    user.workStartTime
                  ) : (
                    <span className="text-[var(--text-muted)] font-normal text-xs">
                      Global setting
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Assigned Tasks
            </h3>
            <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 sm:px-3 py-1 rounded-full border border-[var(--border-color)]">
              {userTasks.length} tasks
            </span>
          </div>

          {userTasks.length === 0 ? (
            <div className="text-center py-8 sm:py-12 border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-xl">
              <FolderKanban className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-[var(--text-secondary)] text-sm">
                No tasks assigned to this user
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              {userTasks.map((task) => {
                const StatusIcon = getStatusIcon(task.status);
                const isMissed = task.isMissed;

                return (
                  <div
                    key={task._id}
                    className={`bg-[var(--bg-secondary)] border rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-300 hover:border-[var(--border-hover)] ${
                      isMissed
                        ? 'border-[var(--danger)]/30'
                        : 'border-[var(--border-color)]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                          <h4
                            className={`font-semibold text-sm ${isMissed ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'} truncate`}
                          >
                            {task.name}
                          </h4>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border ${getStatusColor(task.status)} whitespace-nowrap`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {task.status || 'Pending'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                              isMissed
                                ? 'text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20'
                                : getMarksColor(task.obtainedMarks || 0) +
                                  ' bg-[var(--bg-card)] border border-[var(--border-color)]'
                            }`}
                          >
                            {task.obtainedMarks || 0}
                          </span>
                          {isMissed && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20 flex items-center gap-1 whitespace-nowrap">
                              <AlertTriangle className="w-3 h-3" />
                              {task.daysOverdue}d overdue
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p
                            className={`text-xs sm:text-sm mb-2 ${isMissed ? 'text-[var(--danger)]/70' : 'text-[var(--text-secondary)]'} line-clamp-2`}
                          >
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            <span className="truncate max-w-[80px] sm:max-w-[150px]">
                              {task.projectName}
                            </span>
                          </span>
                          {task.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(task.startDate)}
                            </span>
                          )}
                          {task.endDate && (
                            <span
                              className={`flex items-center gap-1 ${isMissed ? 'text-[var(--danger)]' : ''}`}
                            >
                              <Calendar className="w-3 h-3" />
                              {formatDate(task.endDate)}
                              {isMissed && (
                                <span className="text-[var(--danger)] font-medium">
                                  (Missed!)
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {task.basicWork && (
                            <span className="text-[9px] sm:text-[10px] text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded border border-[var(--accent-primary)]/20">
                              Basic
                            </span>
                          )}
                          {task.completed && (
                            <span className="text-[9px] sm:text-[10px] text-[var(--success)] bg-[var(--success)]/10 px-2 py-0.5 rounded border border-[var(--success)]/20">
                              Completed
                            </span>
                          )}
                          {task.tested && (
                            <span className="text-[9px] sm:text-[10px] text-[var(--accent-light)] bg-[var(--accent-light)]/10 px-2 py-0.5 rounded border border-[var(--accent-light)]/20">
                              Tested
                            </span>
                          )}
                          {isMissed && (
                            <span className="text-[9px] sm:text-[10px] text-[var(--danger)] bg-[var(--danger)]/10 px-2 py-0.5 rounded border border-[var(--danger)]/20 flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5" />
                              Auto-Zeroed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserDetail;
