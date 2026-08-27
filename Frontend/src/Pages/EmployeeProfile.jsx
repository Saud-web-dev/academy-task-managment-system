import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { syncUserFromDB } from "../service/api.js";
import SSIPageLoader from "../components/SSIPageLoader";
import {
  User, Mail, Shield, Calendar, Loader2, ArrowLeft, Bell,
} from "lucide-react";
import toast from "react-hot-toast";
import NotificationSettings from "../Admin/components/NotificationSettings";

const EmployeeProfile = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeProfile();
  }, []);

  const fetchEmployeeProfile = async () => {
    try {
      setLoading(true);
      
      const userData = localStorage.getItem("user");
      if (!userData) {
        toast.error("No user data found. Please login again.");
        navigate("/login");
        return;
      }

      const currentUser = JSON.parse(userData);
      const userId = currentUser._id || currentUser.id;
      
      if (!userId) {
        toast.error("Invalid user data. Please login again.");
        navigate("/login");
        return;
      }

      const res = await api.get(`/user/${userId}`);
      await syncUserFromDB();

      if (res.data.success) {
        setEmployee(res.data.user);
      } else {
        toast.error("Failed to load profile");
        navigate("/layout/desboards");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else {
        toast.error(error.response?.data?.message || "Failed to load profile");
        navigate("/layout/desboards");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return <SSIPageLoader message="Loading profile..." />;
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <User className="w-16 h-16 text-[#8a7a6a] mx-auto mb-4" />
        <p className="text-[#8a7a6a] text-lg">Profile not found</p>
        <button
          onClick={() => navigate("/layout/desboards")}
          className="mt-4 text-[#2c1810] hover:text-[#2c1810]/70 text-sm font-medium transition flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4">
      <div className="bg-[#faf7f3] border border-[#e5ddd5] rounded-xl overflow-hidden">
        {/* HEADER */}
        <div className="bg-[#f5f0eb] border-b border-[#e5ddd5] px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/layout/desboards")}
              className="p-2 hover:bg-[#f5f0eb] rounded-lg transition text-[#8a7a6a] hover:text-[#2c1810] border border-transparent hover:border-[#e5ddd5]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="bg-[#2c1810]/10 p-2.5 rounded-lg">
              <User className="w-5 h-5 text-[#2c1810]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#2c1810]">My Profile</h1>
              <p className="text-sm text-[#8a7a6a]">View your personal information</p>
            </div>
          </div>
        </div>

        {/* PROFILE CONTENT */}
        <div className="p-4 sm:p-6">
          {/* PROFILE CARD */}
          <div className="bg-[#f5f0eb] border border-[#e5ddd5] rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#2c1810] flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg border-4 border-[#e5ddd5]">
                  {employee.name?.charAt(0)?.toUpperCase() || "E"}
                </div>
                {employee.isActive && (
                  <div className="absolute bottom-1 right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-[#faf7f3] animate-pulse"></div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-[#2c1810]">
                  {employee.name}
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-sm text-[#8a7a6a] capitalize">
                    <Shield className="w-4 h-4 text-[#2c1810]" />
                    {employee.role || "Employee"}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                    employee.isActive
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "bg-red-50 text-red-600 border-red-200"
                  }`}>
                    {employee.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-3 text-sm">
                  <span className="flex items-center gap-1.5 text-[#8a7a6a]">
                    <Mail className="w-4 h-4 text-[#8a7a6a]" />
                    {employee.email}
                  </span>
                  <span className="flex items-center gap-1.5 text-[#8a7a6a]">
                    <Calendar className="w-4 h-4 text-[#8a7a6a]" />
                    Joined {formatDate(employee.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PERSONAL INFORMATION */}
          <div className="mt-4 sm:mt-6 bg-[#f5f0eb] border border-[#e5ddd5] rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-[#8a7a6a] uppercase tracking-wider mb-4">
              <User className="w-4 h-4" />
              Personal Information
            </div>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row justify-between border-b border-[#e5ddd5] pb-3">
                <span className="text-sm text-[#8a7a6a]">Full Name</span>
                <span className="text-sm font-medium text-[#2c1810]">{employee.name}</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between border-b border-[#e5ddd5] pb-3">
                <span className="text-sm text-[#8a7a6a]">Email Address</span>
                <span className="text-sm font-medium text-[#2c1810]">{employee.email}</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between border-b border-[#e5ddd5] pb-3">
                <span className="text-sm text-[#8a7a6a]">Role</span>
                <span className="text-sm font-medium text-[#2c1810] capitalize">{employee.role}</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between">
                <span className="text-sm text-[#8a7a6a]">Status</span>
                <span className={`text-sm font-medium ${employee.isActive ? "text-emerald-600" : "text-red-600"}`}>
                  {employee.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* MEMBER SINCE */}
          <div className="mt-4 bg-[#f5f0eb] border border-[#e5ddd5] rounded-xl p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#2c1810]" />
                <span className="text-sm font-medium text-[#2c1810]">Member Since</span>
              </div>
              <span className="text-sm text-[#8a7a6a]">
                {formatDate(employee.createdAt)}
              </span>
            </div>
          </div>

          {/* NOTIFICATION SETTINGS */}
          <div className="mt-4 sm:mt-6 bg-[#f5f0eb] border border-[#e5ddd5] rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-[#8a7a6a] uppercase tracking-wider mb-4">
              <Bell className="w-4 h-4" />
              Push Notifications
            </div>
            <NotificationSettings />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;