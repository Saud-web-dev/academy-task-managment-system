import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../service/api";
import SSIPageLoader from "../components/SSIPageLoader";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  Ban,
  AlertCircle,
  Loader2,
  FileText,
  MapPin,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

const EmployeeAttanddanceHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    leave: 0,
    halfDay: 0,
  });
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState(null);

  // ===== GET USER DATA =====
  useEffect(() => {
    const getUserData = () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsed = JSON.parse(userData);
          const id = parsed._id || parsed.id || parsed.userId;
          const name = parsed.name || "";
          if (id) {
            setEmployeeId(id);
            setEmployeeName(name);
          }
        }
      } catch (error) {
        console.error("Error getting user data:", error);
      }
    };
    getUserData();
  }, []);

  // ===== FETCH HISTORY =====
  const fetchHistory = useCallback(async () => {
    if (!employeeId) return;
    
    setLoading(true);
    try {
      const res = await api.get(`/attendance/employee?employeeId=${employeeId}&limit=50`);
      const data = res?.data?.data || [];
      setHistory(data);

      // Calculate stats
      const statsData = {
        total: data.length,
        present: data.filter(r => r.type === "Present" && r.status !== "Rejected").length,
        absent: data.filter(r => r.status === "Absent").length,
        leave: data.filter(r => r.type === "Leave" && r.status !== "Rejected").length,
        halfDay: data.filter(r => r.type === "Half Day" && r.status !== "Rejected").length,
      };
      setStats(statsData);
    } catch (error) {
      console.error("Fetch history error:", error);
      toast.error("Failed to load attendance history");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    if (employeeId) {
      fetchHistory();
    }
  }, [employeeId, fetchHistory]);

  // ===== HELPERS =====
  const getStatusBadge = (status) => {
    const map = {
      'approved': { color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Approved' },
      'rejected': { color: 'bg-red-50 text-red-600 border-red-200', icon: <Ban className="w-3 h-3" />, label: 'Rejected' },
      'absent': { color: 'bg-red-50 text-red-600 border-red-200', icon: <AlertCircle className="w-3 h-3" />, label: 'Absent' }
    };
    return map[status?.toLowerCase()] || { color: 'bg-amber-50 text-amber-600 border-amber-200', icon: <Clock className="w-3 h-3" />, label: 'Pending' };
  };

  const getTypeBadge = (type) => {
    const map = {
      'present': { color: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'Present' },
      'leave': { color: 'bg-amber-50 text-amber-600 border-amber-200', label: 'Leave' },
      'half day': { color: 'bg-blue-50 text-blue-600 border-blue-200', label: 'Half Day' }
    };
    return map[type?.toLowerCase()] || { color: 'bg-gray-50 text-gray-500 border-gray-200', label: type };
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <SSIPageLoader message="Loading history..." />;
  }

  return (
    <div className="min-h-screen bg-[#f5f0eb] p-3 sm:p-4 font-sans">
      <div className="max-w-6xl mx-auto space-y-4">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5ddd5] pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/layout/desboards")}
              className="p-2 hover:bg-[#f5f0eb] rounded-lg transition text-[#8a7a6a] hover:text-[#2c1810] border border-transparent hover:border-[#e5ddd5]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#2c1810] tracking-tight">Attendance History</h1>
              <p className="text-xs text-[#8a7a6a] mt-0.5">
                {employeeName ? `${employeeName}'s attendance records` : "Your attendance records"}
              </p>
            </div>
          </div>
          <div className="text-xs text-[#8a7a6a] bg-[#faf7f3] px-3 py-1.5 rounded-full border border-[#e5ddd5]">
            {history.length} records
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[#faf7f3] border border-[#e5ddd5] rounded-xl p-3 text-center hover:border-[#d4c8bc] transition">
            <p className="text-xl font-bold text-[#2c1810]">{stats.total}</p>
            <p className="text-[9px] text-[#8a7a6a] uppercase tracking-wider">Total</p>
          </div>
          <div className="bg-[#faf7f3] border border-[#e5ddd5] rounded-xl p-3 text-center hover:border-[#d4c8bc] transition">
            <p className="text-xl font-bold text-emerald-600">{stats.present}</p>
            <p className="text-[9px] text-[#8a7a6a] uppercase tracking-wider">Present</p>
          </div>
          <div className="bg-[#faf7f3] border border-[#e5ddd5] rounded-xl p-3 text-center hover:border-[#d4c8bc] transition">
            <p className="text-xl font-bold text-amber-600">{stats.leave}</p>
            <p className="text-[9px] text-[#8a7a6a] uppercase tracking-wider">Leave</p>
          </div>
          <div className="bg-[#faf7f3] border border-[#e5ddd5] rounded-xl p-3 text-center hover:border-[#d4c8bc] transition">
            <p className="text-xl font-bold text-blue-600">{stats.halfDay}</p>
            <p className="text-[9px] text-[#8a7a6a] uppercase tracking-wider">Half Day</p>
          </div>
          <div className="bg-[#faf7f3] border border-[#e5ddd5] rounded-xl p-3 text-center hover:border-[#d4c8bc] transition">
            <p className="text-xl font-bold text-red-600">{stats.absent}</p>
            <p className="text-[9px] text-[#8a7a6a] uppercase tracking-wider">Absent</p>
          </div>
        </div>

        {/* HISTORY LIST */}
        {history.length === 0 ? (
          <div className="text-center py-16 bg-[#faf7f3] border border-[#e5ddd5] rounded-2xl">
            <FileText className="w-12 h-12 text-[#8a7a6a] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#8a7a6a]">No history found</h3>
            <p className="text-xs text-[#8a7a6a] mt-1">You haven't submitted any attendance requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((record) => {
              const status = getStatusBadge(record.status);
              const typeBadge = getTypeBadge(record.type);
              
              return (
                <div
                  key={record._id}
                  className="bg-[#faf7f3] border border-[#e5ddd5] rounded-xl p-4 hover:border-[#d4c8bc] transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#f5f0eb] flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-[#8a7a6a]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-[#2c1810] truncate">{record.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-[#8a7a6a] flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(record.date)}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-[#e5ddd5]"></span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${typeBadge.color}`}>
                            {typeBadge.label}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                          {record.locationCaptured && (
                            <span className="flex items-center gap-1 text-emerald-600 text-[9px]">
                              <MapPin className="w-3 h-3" />
                              Location Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#8a7a6a] flex-shrink-0">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(record.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {record.reason && (
                    <div className="mt-3 pt-3 border-t border-[#e5ddd5]">
                      <p className="text-xs text-[#8a7a6a]">
                        <span className="font-medium">Reason:</span> {record.reason}
                      </p>
                    </div>
                  )}

                  {record.status === "Rejected" && record.adminRemarks && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-600">
                        <span className="font-medium">Admin Remarks:</span> {record.adminRemarks}
                      </p>
                    </div>
                  )}

                  {record.status === "Absent" && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-600">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        Auto-marked absent - No attendance marked before 5 PM
                      </p>
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

export default EmployeeAttanddanceHistory;