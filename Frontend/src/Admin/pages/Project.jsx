import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../service/api.js';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  Briefcase,
  FolderKanban,
  Loader2,
  X,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  FileText,
  ChevronRight,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import SSIPageLoader from '../../components/SSIPageLoader.jsx';

const API_BASE_URL = '/projects';

const Project = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [projects, setProjects] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const initialFormState = {
    projectName: '',
    description: '',
    status: '',
    client: '',
    startDate: '',
    endDate: '',
  };

  const [formData, setFormData] = useState(initialFormState);

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

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_BASE_URL);
      setProjects(res.data);
    } catch (err) {
      console.error(err.message);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        const res = await api.put(`${API_BASE_URL}/${editingId}`, formData);
        setProjects((prev) =>
          prev.map((p) => (p._id === editingId ? res.data : p))
        );
        setEditingId(null);
        toast.success('Project updated successfully!');
      } else {
        const res = await api.post(API_BASE_URL, formData);
        setProjects((prev) => [...prev, res.data]);
        toast.success('Project created successfully!');
      }
      setFormData(initialFormState);
      setShowForm(false);
    } catch (err) {
      console.error(err.message);
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (project) => {
    setFormData({
      projectName: project.projectName || '',
      description: project.description || '',
      status: project.status || '',
      client: project.client || '',
      startDate: formatDateTimeLocal(project.startDate),
      endDate: formatDateTimeLocal(project.endDate),
    });
    setEditingId(project._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete project?')) return;
    try {
      await api.delete(`${API_BASE_URL}/${id}`);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      toast.success('Project deleted successfully!');
    } catch (err) {
      console.error(err.message);
      toast.error('Failed to delete project');
    }
  };

  const openProjectDetail = (projectId) => {
    navigate(`/admin/project/${projectId}`);
  };

  // ✅ CALCULATE PROJECT STATUS FROM TASKS
  const calculateProjectStatus = (tasks) => {
    if (!tasks || tasks.length === 0) return 'Pending';

    let completedCount = 0;
    let inProgressCount = 0;
    let pendingCount = 0;

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

    if (completedCount === tasks.length && completedCount > 0) {
      return 'Completed';
    }
    if (inProgressCount > 0) {
      return 'In Progress';
    }
    if (pendingCount === tasks.length) {
      return 'Pending';
    }
    if (completedCount > 0 && pendingCount > 0) {
      return 'In Progress';
    }
    return 'Pending';
  };

  // ✅ Get status info
  const getStatusInfo = (status) => {
    const statusMap = {
      Pending: {
        color:
          'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20',
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        label: 'Pending',
      },
      'In Progress': {
        color:
          'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20',
        icon: <Clock className="w-3.5 h-3.5" />,
        label: 'In Progress',
      },
      Completed: {
        color:
          'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20',
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        label: 'Completed',
      },
    };
    return (
      statusMap[status] || {
        color:
          'bg-[var(--border-color)] text-[var(--text-muted)] border-[var(--border-color)]',
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        label: status || 'Unknown',
      }
    );
  };

  // ✅ Calculate task stats
  const getProjectStats = (project) => {
    const tasks = project.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed && t.tested).length;
    const progress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const documents = project.documents?.length || 0;
    return { totalTasks, completedTasks, progress, documents };
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <SSIPageLoader message="Loading projects..." />;
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--accent-primary)]/10 p-2.5 rounded-xl">
                <FolderKanban className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                  Projects
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  Manage and track your company projects
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData(initialFormState);
              }}
              className="inline-flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] px-4 py-2.5 rounded-lg text-sm font-medium transition shadow-lg shadow-[var(--accent-primary)]/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Project</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects by name or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="p-4 sm:p-6 overflow-x-auto">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16 px-6">
              <FolderKanban className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)] font-medium">
                No projects found
              </p>
              <p className="text-[var(--text-muted)] text-sm mt-1">
                {searchTerm
                  ? 'Try adjusting your search'
                  : "Click 'Create Project' to get started"}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider hidden lg:table-cell">
                    Timeline
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">
                    Tasks
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredProjects.map((project) => {
                  const stats = getProjectStats(project);
                  const calculatedStatus = calculateProjectStatus(
                    project.tasks
                  );
                  const statusInfo = getStatusInfo(calculatedStatus);

                  return (
                    <tr
                      key={project._id}
                      className="hover:bg-[var(--bg-hover)] transition-colors group"
                    >
                      {/* Project Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center flex-shrink-0">
                            <FolderKanban className="w-4 h-4 text-[var(--accent-primary)]" />
                          </div>
                          <div>
                            <p className="font-medium text-[var(--text-primary)] truncate max-w-[180px] sm:max-w-[250px]">
                              {project.projectName}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] truncate max-w-[180px] sm:max-w-[250px]">
                              {project.description || 'No description'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          {project.client || 'N/A'}
                        </span>
                      </td>

                      {/* Timeline */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDateWithTime(project.startDate)}</span>
                          <ChevronRight className="w-3 h-3" />
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDateWithTime(project.endDate)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}
                        >
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Tasks */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                            <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <span>{stats.totalTasks} tasks</span>
                          </div>
                          <div className="w-24 h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--success)]"
                              style={{ width: `${stats.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openProjectDetail(project._id)}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(project)}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition"
                            title="Edit Project"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(project._id)}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition"
                            title="Delete Project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div
              className="absolute inset-0"
              onClick={() => setShowForm(false)}
            />
            <form
              onSubmit={handleSubmit}
              className="bg-[var(--bg-card)] w-full max-w-2xl max-h-[90vh] flex flex-col border border-[var(--border-color)] rounded-xl overflow-hidden relative z-10"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                    {editingId ? 'Edit Project' : 'Create New Project'}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {editingId
                      ? 'Update project details'
                      : 'Add a new project to your portfolio'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                      Project Name{' '}
                      <span className="text-[var(--danger)]">*</span>
                    </label>
                    <input
                      type="text"
                      name="projectName"
                      value={formData.projectName || ''}
                      onChange={handleChange}
                      placeholder="Enter project name"
                      required
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                      Client
                    </label>
                    <input
                      type="text"
                      name="client"
                      value={formData.client || ''}
                      onChange={handleChange}
                      placeholder="Enter client name"
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Describe the project..."
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors resize-none"
                  />
                </div>

                {/* ✅ UPDATED: DateTime inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={formData.startDate || ''}
                      onChange={handleChange}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={formData.endDate || ''}
                      onChange={handleChange}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] font-medium rounded-lg text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] font-medium px-5 py-2 rounded-lg text-sm transition shadow-lg shadow-[var(--accent-primary)]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default Project;