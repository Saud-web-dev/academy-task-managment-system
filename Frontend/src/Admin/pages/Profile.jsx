import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../service/api";
import SSIPageLoader from "../../components/SSIPageLoader";
import {
  User,
  Mail,
  Shield,
  Lock,
  Edit2,
  Save,
  X,
  Loader2,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Key,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";

const Profile = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const getRoleLabel = (role) => {
    if (role === 'superAdmin') return 'Admin (Super Admin)';
    if (role === 'teamLeader') return 'Team Leader';
    if (role === 'admin') return 'Team Leader';
    return 'Employee';
  };

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);

      const userData = localStorage.getItem("user");
      if (!userData) {
        toast.error("No user data found. Please login again.");
        navigate("/login");
        return;
      }

      const currentUser = JSON.parse(userData);
      if (!currentUser._id) {
        toast.error("Invalid user data. Please login again.");
        navigate("/login");
        return;
      }

      const res = await api.get(`/user/${currentUser._id}`);
      if (res.data.success) {
        setAdmin(res.data.user);
        setEditForm({
          name: res.data.user.name || "",
          email: res.data.user.email || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(res.data.message || "Failed to load profile");
        navigate("/admin/dashboard");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else if (error.response?.status === 404) {
        toast.error("User not found. Please login again.");
      } else {
        toast.error(error.response?.data?.message || "Failed to load profile");
        navigate("/admin/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  // ================= VALIDATE FORM =================
  const validateForm = () => {
    const newErrors = {};

    if (!editForm.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!editForm.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (editForm.newPassword) {
      if (editForm.newPassword.length < 6) {
        newErrors.newPassword = "Password must be at least 6 characters";
      }
      if (editForm.newPassword !== editForm.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
      if (!editForm.currentPassword) {
        newErrors.currentPassword = "Current password is required to set a new password";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= UPDATE PROFILE =================
  const handleUpdate = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setUpdating(true);
    try {
      const updateData = {
        name: editForm.name,
        email: editForm.email,
      };

      if (editForm.newPassword) {
        updateData.password = editForm.newPassword;
        updateData.currentPassword = editForm.currentPassword;
      }

      const res = await api.put(`/user/update/${admin._id}`, updateData);

      if (res.data.success) {
        setAdmin(res.data.user);
        // Sync localStorage with fresh data
        localStorage.setItem("user", JSON.stringify(res.data.user));
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        setEditForm({
          ...editForm,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setErrors({});
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      name: admin?.name || "",
      email: admin?.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  // ================= LOADING =================
  if (loading) {
    return <SSIPageLoader message="Loading profile..." />;
  }

  if (!admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <User className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
        <p className="text-[var(--text-secondary)] text-lg">No admin profile found</p>
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="mt-4 text-[var(--accent-primary)] hover:text-[var(--accent-hover)] text-sm font-medium transition flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="ui-card">
        {/* Header */}
        <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-color)]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="bg-[var(--accent-primary)]/10 p-2.5 rounded-lg">
                <User className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--text-primary)]">My Profile</h1>
                <p className="text-sm text-[var(--text-secondary)]">Manage your account settings</p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="ui-btn ui-btn-primary inline-flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          {!isEditing ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center p-8 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-hover)] flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-[var(--accent-primary)]/30 border-4 border-[var(--border-color)]">
                  {admin.name?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-4">
                  {admin.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
                  <span className="flex items-center gap-1 text-sm text-[var(--text-secondary)] capitalize">
                    <Shield className="w-4 h-4 text-[var(--accent-primary)]" />
                    {getRoleLabel(admin.role)}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${admin.isActive
                    ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20"
                    : "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20"
                    }`}>
                    {admin.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </div>
                  <p className="text-[var(--text-primary)] font-medium">{admin.name}</p>
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </div>
                  <p className="text-[var(--text-primary)] font-medium">{admin.email}</p>
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    <Shield className="w-4 h-4" />
                    Role
                  </div>
                  <p className="text-[var(--text-primary)] font-medium">{getRoleLabel(admin.role)}</p>
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    <Key className="w-4 h-4" />
                    Password
                  </div>
                  <p className="text-[var(--text-primary)] font-medium">••••••••</p>
                </div>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-[var(--success)]" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">Account Status</span>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${admin.isActive
                    ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20"
                    : "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20"
                    }`}>
                    {admin.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-[var(--accent-primary)]" />
                  Edit Profile Details
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                      Full Name <span className="text-[var(--danger)]">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className={`ui-input w-full text-sm ${errors.name ? 'border-[var(--danger)] focus:border-[var(--danger)]' : ''}`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="text-xs text-[var(--danger)] mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                      Email Address <span className="text-[var(--danger)]">*</span>
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className={`ui-input w-full text-sm ${errors.email ? 'border-[var(--danger)] focus:border-[var(--danger)]' : ''}`}
                      placeholder="Enter your email address"
                    />
                    {errors.email && (
                      <p className="text-xs text-[var(--danger)] mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                      Current Password {editForm.newPassword && <span className="text-[var(--danger)]">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={editForm.currentPassword}
                        onChange={(e) => setEditForm({ ...editForm, currentPassword: e.target.value })}
                        className={`ui-input w-full pr-10 text-sm ${errors.currentPassword ? 'border-[var(--danger)] focus:border-[var(--danger)]' : ''}`}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.currentPassword && (
                      <p className="text-xs text-[var(--danger)] mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.currentPassword}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                      New Password <span className="text-[var(--text-muted)] text-[10px]">(optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={editForm.newPassword}
                        onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                        className={`ui-input w-full pr-10 text-sm ${errors.newPassword ? 'border-[var(--danger)] focus:border-[var(--danger)]' : ''}`}
                        placeholder="Enter new password (min 6 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="text-xs text-[var(--danger)] mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.newPassword}
                      </p>
                    )}
                  </div>

                  {editForm.newPassword && (
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                        Confirm New Password <span className="text-[var(--danger)]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={editForm.confirmPassword}
                          onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                          className={`ui-input w-full pr-10 text-sm ${errors.confirmPassword ? 'border-[var(--danger)] focus:border-[var(--danger)]' : ''}`}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-[var(--danger)] mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="bg-[var(--warning)]/5 border border-[var(--warning)]/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[var(--warning)] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[var(--text-secondary)]">
                      Leave password fields empty if you don't want to change your password.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={handleCancelEdit}
                  className="ui-btn inline-flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="ui-btn ui-btn-primary inline-flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;