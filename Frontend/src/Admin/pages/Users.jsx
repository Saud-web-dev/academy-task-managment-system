import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../service/api.js';
import SSIPageLoader from '../../components/SSIPageLoader';
import {
  Mail,
  Shield,
  Loader2,
  Eye,
  X,
  UserCheck,
  UserX,
  Calendar,
  Plus,
  EyeOff,
  Users as UsersIcon,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Minimum width (px) for any column so it never collapses completely
const MIN_COL_WIDTH = 60;

const DEFAULT_COL_WIDTHS = {
  index: 50,
  name: 180,
  email: 240,
  role: 110,
  createdOn: 140,
  status: 140,
  actions: 120,
};

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const getRoleLabel = (role) => {
    if (role === 'superAdmin') return 'Admin (Super Admin)';
    if (role === 'teamLeader') return 'Team Leader';
    if (role === 'admin') return 'Team Leader';
    return 'Employee';
  };

  const [confirmUser, setConfirmUser] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    workStartTime: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // ---- Excel-style resizable columns ----
  const [colWidths, setColWidths] = useState(DEFAULT_COL_WIDTHS);
  const resizingRef = useRef(null); // { key, startX, startWidth }

  const handleResizeMove = useCallback((e) => {
    const r = resizingRef.current;
    if (!r) return;
    const newWidth = Math.max(
      MIN_COL_WIDTH,
      r.startWidth + (e.clientX - r.startX)
    );
    setColWidths((prev) => ({ ...prev, [r.key]: newWidth }));
  }, []);

  const stopResize = useCallback(() => {
    resizingRef.current = null;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', stopResize);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleResizeMove]);

  const startResize = useCallback(
    (key, e) => {
      e.preventDefault();
      e.stopPropagation();
      resizingRef.current = {
        key,
        startX: e.clientX,
        startWidth: colWidths[key],
      };
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', stopResize);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [colWidths, handleResizeMove, stopResize]
  );

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => stopResize();
  }, [stopResize]);

  // Double-click on a divider resets that column to its default width (Excel-like)
  const resetColumn = (key) => {
    setColWidths((prev) => ({ ...prev, [key]: DEFAULT_COL_WIDTHS[key] }));
  };

  // Shared classNames for the column divider line + drag handle
  const dividerClass =
    'absolute top-0 right-0 h-full w-[6px] translate-x-1/2 cursor-col-resize z-10 group';
  const dividerLineClass =
    'mx-auto h-full w-px bg-[var(--border-color)] group-hover:w-[2px] group-hover:bg-[var(--accent-primary)] transition-all';

  const thBase =
    'relative px-4 py-3 text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider select-none';
  // ---------------------------------------

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/user/all-users');
      // Show all non-superAdmin users; superAdmin can see everyone
      const userData = res.data.users || [];
      setUsers(userData.filter((u) => u.role !== 'superAdmin'));
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateChange = (e) => {
    setCreateFormData({
      ...createFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateSubmit = async () => {
    if (
      !createFormData.name ||
      !createFormData.email ||
      !createFormData.password
    ) {
      toast.error('Name, Email and Password are required!');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/user/create', createFormData);
      await fetchUsers();
      setCreateFormData({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        workStartTime: '',
      });
      setCreateModalOpen(false);
      toast.success('User created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMigrateMarks = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/user/migrate-marks');
      if (res.data.results?.updated?.length === 0) {
        toast.success('All users already have correct marks — no migration needed');
      } else {
        toast.success(
          `Marks revalidated for ${res.data.results.updated.length} users`
        );
      }
      await fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Migration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusClick = (user) => {
    setConfirmUser(user);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const newStatus = !confirmUser.isActive;
      await api.put(`/user/status/${confirmUser._id}`, {
        isActive: newStatus,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u._id === confirmUser._id ? { ...u, isActive: newStatus } : u
        )
      );
      setConfirmUser(null);
      toast.success(
        `User ${newStatus ? 'activated' : 'deactivated'} successfully!`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  const formatDate = useCallback((date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  if (loading) {
    return <SSIPageLoader message="Loading users..." />;
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
        {/* HEADER PANEL */}
        <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--accent-primary)]/10 p-2.5 rounded-lg">
                <Shield className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-semibold text-[var(--text-primary)]">
                  User Management
                </h1>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                  Manage internal employee accounts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[10px] sm:text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] px-2 sm:px-3 py-1 font-semibold rounded-lg whitespace-nowrap">
                Total: {users.length}
              </span>
              <button
                onClick={handleMigrateMarks}
                disabled={submitting}
                title="Fix marks for existing users (run once)"
                className="inline-flex items-center gap-1.5 bg-[var(--warning)]/10 hover:bg-[var(--warning)]/20 text-[var(--warning)] border border-[var(--warning)]/30 px-3 py-1.5 rounded-lg text-xs font-medium transition"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <UsersIcon size={14} />
                )}
                <span className="hidden sm:inline">Fix Marks</span>
              </button>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 sm:gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition shadow-lg shadow-[var(--accent-primary)]/20"
              >
                <Plus size={16} />
                <span className="hidden xs:inline">Create User</span>
                <span className="xs:hidden">Create</span>
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE LIST LAYOUT */}
        <div className="block lg:hidden p-3 sm:p-4">
          <div className="space-y-3 sm:space-y-4">
            {users.length === 0 ? (
              <div className="text-center p-8 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] font-medium">
                No employees found.
              </div>
            ) : (
              users.map((user, index) => (
                <div
                  key={user._id}
                  className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-4 space-y-3 hover:border-[var(--border-hover)] transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                        Employee #{index + 1}
                      </span>
                      <h3 className="font-bold text-[var(--text-primary)] text-sm sm:text-base truncate">
                        {user.name || 'N/A'}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] truncate">
                        <Mail size={12} className="flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewDetails(user._id)}
                      className="p-2 text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-colors border border-[var(--border-color)] hover:border-[var(--accent-primary)]/30 flex-shrink-0"
                    >
                      <Eye size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[var(--border-color)] text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block mb-0.5">
                        Role
                      </span>
                      <span className="inline-flex items-center bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium px-2 py-0.5 rounded border border-[var(--accent-primary)]/20 text-[10px] sm:text-xs">
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase block mb-0.5">
                        Joined
                      </span>
                      <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1 text-[10px] sm:text-xs">
                        <Calendar
                          size={12}
                          className="text-[var(--text-muted)]"
                        />
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium">
                      Account Status
                    </span>
                    <button
                      onClick={() => handleStatusClick(user)}
                      className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold rounded-lg border transition-all active:scale-95 ${
                        user.isActive
                          ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20 hover:bg-[var(--success)]/20'
                          : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20 hover:bg-[var(--danger)]/20'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          user.isActive
                            ? 'bg-[var(--success)]'
                            : 'bg-[var(--danger)]'
                        }`}
                      />
                      {user.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ============================================ */}
        {/* DESKTOP TABLE LAYOUT - FULL WIDTH FIXED */}
        {/* ============================================ */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm table-fixed border-collapse">
            {/* Column widths controlled from state so dividers can resize them */}
            <colgroup>
              <col style={{ width: colWidths.index }} />
              <col style={{ width: colWidths.name }} />
              <col style={{ width: colWidths.email }} />
              <col style={{ width: colWidths.role }} />
              <col style={{ width: colWidths.createdOn }} />
              <col style={{ width: colWidths.status }} />
              <col style={{ width: colWidths.actions }} />
            </colgroup>

            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
              <tr>
                <th
                  className={`${thBase} text-left border-r border-[var(--border-color)]`}
                >
                  #
                  <span
                    className={dividerClass}
                    onMouseDown={(e) => startResize('index', e)}
                    onDoubleClick={() => resetColumn('index')}
                    title="Drag to resize • Double-click to reset"
                  >
                    <span className={dividerLineClass} />
                  </span>
                </th>
                <th
                  className={`${thBase} text-left border-r border-[var(--border-color)]`}
                >
                  Name
                  <span
                    className={dividerClass}
                    onMouseDown={(e) => startResize('name', e)}
                    onDoubleClick={() => resetColumn('name')}
                    title="Drag to resize • Double-click to reset"
                  >
                    <span className={dividerLineClass} />
                  </span>
                </th>
                <th
                  className={`${thBase} text-left border-r border-[var(--border-color)]`}
                >
                  Email
                  <span
                    className={dividerClass}
                    onMouseDown={(e) => startResize('email', e)}
                    onDoubleClick={() => resetColumn('email')}
                    title="Drag to resize • Double-click to reset"
                  >
                    <span className={dividerLineClass} />
                  </span>
                </th>
                <th
                  className={`${thBase} text-left border-r border-[var(--border-color)]`}
                >
                  Role
                  <span
                    className={dividerClass}
                    onMouseDown={(e) => startResize('role', e)}
                    onDoubleClick={() => resetColumn('role')}
                    title="Drag to resize • Double-click to reset"
                  >
                    <span className={dividerLineClass} />
                  </span>
                </th>
                <th
                  className={`${thBase} text-left border-r border-[var(--border-color)]`}
                >
                  Created On
                  <span
                    className={dividerClass}
                    onMouseDown={(e) => startResize('createdOn', e)}
                    onDoubleClick={() => resetColumn('createdOn')}
                    title="Drag to resize • Double-click to reset"
                  >
                    <span className={dividerLineClass} />
                  </span>
                </th>
                <th
                  className={`${thBase} text-center border-r border-[var(--border-color)]`}
                >
                  Status
                  <span
                    className={dividerClass}
                    onMouseDown={(e) => startResize('status', e)}
                    onDoubleClick={() => resetColumn('status')}
                    title="Drag to resize • Double-click to reset"
                  >
                    <span className={dividerLineClass} />
                  </span>
                </th>
                {/* ✅ Actions column - no right border, takes remaining space */}
                <th className={`${thBase} text-center`}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-color)]">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-12 text-center text-[var(--text-muted)] font-medium"
                  >
                    No employees found.
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr
                    key={user._id}
                    className="hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <td className="px-4 py-3 text-center font-medium text-[var(--text-muted)] border-r border-[var(--border-color)] truncate">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--text-primary)] border-r border-[var(--border-color)] truncate">
                      {user.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 border-r border-[var(--border-color)]">
                      <div className="flex items-center gap-2 text-[var(--text-secondary)] min-w-0">
                        <Mail
                          size={14}
                          className="text-[var(--text-muted)] flex-shrink-0"
                        />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-[var(--border-color)]">
                      <span className="inline-flex items-center bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium text-[10px] sm:text-xs px-2 py-1 rounded border border-[var(--accent-primary)]/20 capitalize">
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] text-xs border-r border-[var(--border-color)] truncate">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="px-4 py-3 text-center border-r border-[var(--border-color)]">
                      <button
                        onClick={() => handleStatusClick(user)}
                        className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold rounded-lg border transition-all active:scale-95 ${
                          user.isActive
                            ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20 hover:bg-[var(--success)]/20'
                            : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20 hover:bg-[var(--danger)]/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.isActive
                              ? 'bg-[var(--success)]'
                              : 'bg-[var(--danger)]'
                          }`}
                        />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewDetails(user._id)}
                        className="inline-flex items-center gap-1.5 sm:gap-2 bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-medium transition"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Resize hint */}
        <div className="hidden lg:flex items-center justify-between text-[10px] text-[var(--text-muted)] px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <span>Drag column borders to resize • Double-click to reset</span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30" />
            <span>Resize handle</span>
          </span>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setCreateModalOpen(false)}
          />
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl w-full max-w-md relative z-10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-2">
                <div className="bg-[var(--accent-primary)]/10 p-1.5 rounded-lg">
                  <Plus className="text-[var(--accent-primary)] w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                  Create New User
                </h2>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Full Name <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  value={createFormData.name}
                  onChange={handleCreateChange}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Email Address <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  value={createFormData.email}
                  onChange={handleCreateChange}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Password <span className="text-[var(--danger)]">*</span>
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={createFormData.password}
                    onChange={handleCreateChange}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none transition-colors pr-10"
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <div>
                  <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Role
                  </label>
                  <select
                    name="role"
                    value={createFormData.role}
                    onChange={handleCreateChange}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                  >
                    <option value="employee">Employee</option>
                    {(() => {
                      try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u.role === 'superAdmin'; } catch { return false; }
                    })() && <option value="teamLeader">Team Leader</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Work Start Time
                  </label>
                  <input
                    name="workStartTime"
                    type="time"
                    value={createFormData.workStartTime}
                    onChange={handleCreateChange}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                  />
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    Empty = global setting use hogi
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <button
                disabled={submitting}
                onClick={() => setCreateModalOpen(false)}
                className="flex-1 px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg text-sm font-medium transition border border-[var(--border-color)]"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={handleCreateSubmit}
                className="flex-1 px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] rounded-lg text-sm font-medium transition shadow-lg shadow-[var(--accent-primary)]/20 flex items-center justify-center gap-1.5"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS MODAL */}
      {confirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setConfirmUser(null)}
          />
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl w-full max-w-sm relative z-10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 sm:px-6 py-3 sm:py-4">
              <button
                onClick={() => setConfirmUser(null)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-6 text-center">
              <div
                className={`mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 sm:mb-4 ${
                  confirmUser.isActive
                    ? 'bg-[var(--danger)]/10'
                    : 'bg-[var(--success)]/10'
                }`}
              >
                {confirmUser.isActive ? (
                  <UserX className="text-[var(--danger)] w-6 h-6 sm:w-7 sm:h-7" />
                ) : (
                  <UserCheck className="text-[var(--success)] w-6 h-6 sm:w-7 sm:h-7" />
                )}
              </div>

              <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-1">
                {confirmUser.isActive
                  ? 'Deactivate Account?'
                  : 'Activate Account?'}
              </h2>

              <p className="text-sm text-[var(--text-secondary)] mb-4 sm:mb-6">
                Are you sure you want to change the active status for{' '}
                <span className="font-semibold text-[var(--text-primary)]">
                  {confirmUser.name || 'this user'}
                </span>
                ?
              </p>

              <div className="flex gap-3">
                <button
                  disabled={submitting}
                  onClick={() => setConfirmUser(null)}
                  className="flex-1 px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg text-sm font-medium transition border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-1.5 transition ${
                    confirmUser.isActive
                      ? 'bg-[var(--danger)] hover:bg-[var(--danger)]/80'
                      : 'bg-[var(--success)] hover:bg-[var(--success)]/80'
                  }`}
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {confirmUser.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Users;
