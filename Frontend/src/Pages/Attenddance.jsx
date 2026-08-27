import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../service/api";
import SSIPageLoader from "../components/SSIPageLoader";
import {
  Calendar, FileText, User, Plus, X, Loader2, CheckCircle2, AlertCircle,
  Clock, MapPin, Check, AlertTriangle, ChevronDown, ChevronUp, Info,
  Ban, Filter, Search, XCircle, ArrowLeft, History, Globe, Edit2
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function Attenddance() {
  const navigate = useNavigate();

  // ===== STATE =====
  const [employeeId, setEmployeeId] = useState(null);
  const [employeeName, setEmployeeName] = useState("");
  const [submittedRequestId, setSubmittedRequestId] = useState(null);
  const [canMarkAttendance, setCanMarkAttendance] = useState(true);
  const [attendanceDeadline, setAttendanceDeadline] = useState('5:00 PM');
  const [todayStatus, setTodayStatus] = useState(null);
  const [isAttendanceClosed, setIsAttendanceClosed] = useState(false);
  const [editWindow, setEditWindow] = useState(15);

  const [editingRequest, setEditingRequest] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    date: '',
    type: 'Present',
    reason: '',
  });
  const [editInfo, setEditInfo] = useState(null);
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({ name: "", date: "", type: "Present", reason: "" });

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Kept false so legacy records can render while location collection stays disabled.
  const [locationEnabled] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const observerRef = useRef(null);
  const watchIdRef = useRef(null);
  const isFetchingRef = useRef(false);

  const [filters, setFilters] = useState({
    startDate: '', endDate: '', status: 'all', type: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isFiltering, setIsFiltering] = useState(false);

  const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0, pending: 0 });

  // ===== HELPER: Format Deadline Time =====
  const formatDeadlineTime = (time) => {
    try {
      if (!time) return '5:00 PM';
      const [hours, minutes] = time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return '5:00 PM';
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
    } catch {
      return '5:00 PM';
    }
  };

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
            setFormData(prev => ({ ...prev, name }));
          }
        }
      } catch {
        // Silent fail
      }
    };
    getUserData();
  }, []);

  // ===== CHECK ATTENDANCE STATUS =====
  const checkAttendanceStatus = useCallback(async () => {
    try {
      const res = await api.get('/attendance/can-mark');
      setCanMarkAttendance(res.data.canMark);

      const deadlineTime = res.data.deadline || "17:00";
      const formattedDeadline = deadlineTime.includes('PM') || deadlineTime.includes('AM')
        ? deadlineTime
        : formatDeadlineTime(deadlineTime);

      setAttendanceDeadline(formattedDeadline);

      if (res.data.editWindow) {
        setEditWindow(res.data.editWindow);
      }

      setIsAttendanceClosed(res.data.isPastDeadline || !res.data.canMark);

      if (!res.data.canMark) {
        toast.error(`⏰ Attendance window is closed. Please mark before ${formattedDeadline}.`);
      }
    } catch {
      // Silent fail
    }
  }, []);

  // ===== CHECK TODAY'S STATUS =====
  const checkTodayStatus = useCallback(async () => {
    if (!employeeId) return;

    try {
      const res = await api.get(`/attendance/today-status?employeeId=${employeeId}`);
      setTodayStatus(res.data.data);
    } catch {
      // Silent fail
    }
  }, [employeeId]);

  // ===== FORCE REFRESH ON MOUNT =====
  useEffect(() => {
    const refreshAttendanceStatus = async () => {
      try {
        const res = await api.get('/attendance/can-mark');
        const deadlineTime = res.data.deadline || "17:00";
        const formattedDeadline = deadlineTime.includes('PM') || deadlineTime.includes('AM')
          ? deadlineTime
          : formatDeadlineTime(deadlineTime);

        setCanMarkAttendance(res.data.canMark);
        setAttendanceDeadline(formattedDeadline);
        setIsAttendanceClosed(res.data.isPastDeadline || !res.data.canMark);
      } catch {
        // Silent fail
      }
    };
    refreshAttendanceStatus();
  }, []);

  useEffect(() => {
    if (employeeId) {
      checkTodayStatus();
    }
    checkAttendanceStatus();
  }, [employeeId, checkAttendanceStatus, checkTodayStatus]);

  // ===== FETCH REQUESTS =====
  const fetchRequests = useCallback(async (pageNum = 1, append = false, filterParams = {}) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const empId = employeeId || localStorage.getItem("userId") || "emp_123";

      const params = new URLSearchParams();
      params.append('employeeId', empId);
      params.append('page', pageNum);
      params.append('limit', 10);
      if (filterParams.startDate) params.append('startDate', filterParams.startDate);
      if (filterParams.endDate) params.append('endDate', filterParams.endDate);
      if (filterParams.status && filterParams.status !== 'all') params.append('status', filterParams.status);
      if (filterParams.type && filterParams.type !== 'all') params.append('type', filterParams.type);

      const res = await api.get(`/attendance/employee?${params.toString()}`);
      const data = res?.data?.data || [];
      const totalCount = res?.data?.total || data.length;

      setRequests(prev => append ? [...prev, ...data] : data);
      setTotal(totalCount);
      setHasMore(pageNum * 10 < totalCount);
      setPage(pageNum);
      setAppliedFilters(filterParams);

      const allData = append ? [...requests, ...data] : data;
      setStats({
        total: allData.length,
        approved: allData.filter(r => r.status === "Approved").length,
        rejected: allData.filter(r => r.status === "Rejected").length,
        pending: allData.filter(r => r.status === "Pending").length
      });
    } catch {
      toast.error("Failed to load attendance requests");
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
      isFetchingRef.current = false;
    }
  }, [employeeId]);

  useEffect(() => {
    if (employeeId) {
      fetchRequests(1, false);
    }
  }, [employeeId, fetchRequests]);

  // ===== INFINITE SCROLL =====
  const lastElementRef = useCallback((node) => {
    if (loadingMore || !hasMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isFetchingRef.current) {
        fetchRequests(page + 1, true, appliedFilters);
      }
    }, { rootMargin: '100px' });

    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasMore, page, appliedFilters, fetchRequests]);

  // ===== FILTERS =====
  const applyFilters = useCallback(() => {
    setIsFiltering(true);
    setRequests([]);
    setPage(1);
    setHasMore(true);
    fetchRequests(1, false, filters).finally(() => {
      setIsFiltering(false);
      setShowFilters(false);
    });
  }, [filters, fetchRequests]);

  const resetFilters = useCallback(() => {
    const emptyFilters = { startDate: '', endDate: '', status: 'all', type: 'all' };
    setFilters(emptyFilters);
    setAppliedFilters({});
    setRequests([]);
    setPage(1);
    setHasMore(true);
    fetchRequests(1, false, emptyFilters);
  }, [fetchRequests]);

  // ===== LOCATION FUNCTIONS =====
  const handleCaptureLocation = useCallback(async () => {
    if (!locationEnabled) {
      toast.error("Location is disabled by admin");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    try {
      const position = await getCurrentPosition({ timeout: 5000 });

      const coordStr = `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`;
      setFormData(prev => ({
        ...prev,
        latitude: position.latitude,
        longitude: position.longitude,
        locationAddress: coordStr,
        locationAccuracy: position.accuracy,
      }));

      getAddressFromCoords(position.latitude, position.longitude, true)
        .then(addressData => {
          const specificAddress = addressData.specificAddress || addressData.locationName;
          if (specificAddress && !addressData.fallback) {
            setFormData(prev => ({
              ...prev,
              locationAddress: specificAddress
            }));
          }
        })
        .catch(() => {});

      toast.success(`📍 Location captured!`);

      if (!isTrackingLocation) {
        startContinuousTracking();
      }
    } catch (error) {
      setLocationError(error.message);
      toast.error(error.message);
    } finally {
      setLocationLoading(false);
    }
  }, [locationEnabled, isTrackingLocation]);

  const startContinuousTracking = useCallback(() => {
    if (!locationEnabled || !navigator.geolocation) return;

    setIsTrackingLocation(true);
    toast.loading("Starting location tracking...", { id: 'location-tracking', duration: 2000 });

    watchIdRef.current = watchLocation(
      async (newLocation) => {
        setFormData(prev => ({
          ...prev,
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          locationAccuracy: newLocation.accuracy,
        }));

        getAddressFromCoords(newLocation.latitude, newLocation.longitude)
          .then(addressData => {
            const addr = addressData.specificAddress || addressData.locationName;
            setFormData(prev => ({ ...prev, locationAddress: addr }));
          })
          .catch(() => {});

        if (submittedRequestId) {
          updateAttendanceLocationBackground(
            submittedRequestId,
            newLocation.latitude,
            newLocation.longitude,
            {
              platform: navigator.platform,
              userAgent: navigator.userAgent,
              accuracy: newLocation.accuracy
            }
          );
        }
      },
      (error) => {
        setIsTrackingLocation(false);
        setLocationError(error.message);
        toast.error(error.message);
      }
    );
  }, [locationEnabled, submittedRequestId]);

  const stopContinuousTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTrackingLocation(false);
    toast.success("Location tracking stopped");
  }, []);

  // ============================================
  // EDIT REQUEST FUNCTIONS
  // ============================================
  const openEditModal = async (request) => {
    setEditingRequest(request);
    setEditFormData({
      name: request.name || '',
      date: request.date ? new Date(request.date).toISOString().split('T')[0] : '',
      type: request.type || 'Present',
      reason: request.reason || '',
    });

    try {
      const res = await api.get(`/attendance/${request._id}/can-edit?employeeId=${employeeId}`);
      setEditInfo(res.data.data);
      if (res.data.data.canEdit) {
        setShowEditModal(true);
      } else {
        toast.error(`Edit window expired. You can only edit within ${editWindow} minutes.`);
      }
    } catch {
      toast.error('Failed to check edit status');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditing(true);

    try {
      await api.put(`/attendance/${editingRequest._id}/edit`, {
        ...editFormData,
        employeeId: employeeId,
      });

      toast.success('Request updated successfully!');
      setShowEditModal(false);
      setEditingRequest(null);
      setEditInfo(null);

      fetchRequests(1, false, appliedFilters);
    } catch (error) {
      if (error.response?.data?.expired) {
        toast.error(`Edit window expired. You can only edit within ${error.response.data.editWindow} minutes.`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to update request');
      }
    } finally {
      setEditing(false);
    }
  };

  // ===== HANDLE SUBMIT =====
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (isAttendanceClosed || !canMarkAttendance) {
      toast.error(`❌ Attendance cannot be marked after ${attendanceDeadline}. You will be marked as absent.`);
      return;
    }

    setSubmitting(true);

    try {
      let locationData = {};

      if (locationEnabled) {
        try {
          const position = await getCurrentPosition({ timeout: 5000 });

          const addressPromise = getAddressFromCoords(position.latitude, position.longitude);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 3000)
          );

          let addressData;
          try {
            addressData = await Promise.race([addressPromise, timeoutPromise]);
          } catch {
            addressData = {
              locationName: `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`
            };
          }

          locationData = {
            latitude: position.latitude,
            longitude: position.longitude,
            locationAddress: addressData.specificAddress || addressData.locationName,
            locationAccuracy: position.accuracy,
          };
        } catch (error) {
          toast.error(error.message);
          setSubmitting(false);
          return;
        }
      }

      const requestData = {
        ...formData,
        ...locationData,
        employeeId: employeeId || localStorage.getItem("userId") || "emp_123",
      };

      const response = await api.post("/attendance/create", requestData, { timeout: 15000 });
      const createdId = response.data?.data?._id || response.data?._id;

      if (createdId) {
        setSubmittedRequestId(createdId);
        if (!isTrackingLocation) startContinuousTracking();
      }

      toast.success("Attendance request submitted successfully!");

      // ✅ RESET FORM AND CLOSE MODAL
      resetForm();

      setRequests([]);
      setPage(1);
      setHasMore(true);
      fetchRequests(1, false, appliedFilters);
      checkTodayStatus();

    } catch (error) {
      if (error.response?.data?.code === 'ATTENDANCE_CLOSED') {
        toast.error(`❌ Attendance cannot be marked after ${attendanceDeadline}. You will be marked as absent.`);
      } else {
        toast.error(error.response?.data?.message || "Failed to submit request");
      }
    } finally {
      setSubmitting(false);
    }
  }, [formData, locationEnabled, employeeId, isTrackingLocation, appliedFilters, fetchRequests, startContinuousTracking, canMarkAttendance, isAttendanceClosed, checkTodayStatus, attendanceDeadline]);

  const resetForm = useCallback(() => {
    stopContinuousTracking();
    setFormData({
      name: employeeName || "", date: "", type: "Present", reason: "",
      latitude: null, longitude: null, locationAddress: "", locationAccuracy: null
    });
    setLocationError(null);
    setSubmittedRequestId(null);
    setShowForm(false);
  }, [employeeName, stopContinuousTracking]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  // ===== HELPERS =====
  const getStatusBadge = useMemo(() => (status) => {
    const map = {
      'approved': { color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Approved' },
      'rejected': { color: 'bg-red-50 text-red-600 border-red-200', icon: <Ban className="w-3 h-3" />, label: 'Rejected' },
      'absent': { color: 'bg-red-50 text-red-600 border-red-200', icon: <AlertCircle className="w-3 h-3" />, label: 'Absent' }
    };
    return map[status?.toLowerCase()] || { color: 'bg-amber-50 text-amber-600 border-amber-200', icon: <Clock className="w-3 h-3" />, label: 'Pending' };
  }, []);

  const getTypeBadge = useMemo(() => (type) => {
    const map = {
      'present': { color: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'Present' },
      'leave': { color: 'bg-amber-50 text-amber-600 border-amber-200', label: 'Leave' },
      'half day': { color: 'bg-blue-50 text-blue-600 border-blue-200', label: 'Half Day' }
    };
    return map[type?.toLowerCase()] || { color: 'bg-gray-50 text-gray-500 border-gray-200', label: type };
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }, []);

  const formatDateTime = useCallback((date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }, []);

  const toggleExpand = useCallback((id) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const isReasonRequired = useCallback(() => {
    return formData.type === "Leave" || formData.type === "Half Day";
  }, [formData.type]);

  const isFilterApplied = useCallback(() => {
    return Object.values(filters).some(v => v !== 'all' && v !== '');
  }, [filters]);

  // ===== RENDER =====
  if (loading) return <SSIPageLoader message="Loading..." />;

  return (
    <div className="min-h-screen bg-[#f5f0eb] p-3 sm:p-4 font-sans">
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
            iconTheme: { primary: 'var(--success)', secondary: 'var(--text-inverse)' },
          },
          error: {
            iconTheme: { primary: 'var(--danger)', secondary: 'var(--text-inverse)' },
          },
        }}
      />
      <div className="max-w-6xl mx-auto space-y-4">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-[#e5ddd5] pb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/layout/desboards')}
              className="p-2 hover:bg-[#f5f0eb] rounded-lg transition text-[#8a7a6a] hover:text-[#2c1810] border border-transparent hover:border-[#e5ddd5]">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#2c1810] tracking-tight">Attendance Requests</h1>
              <p className="text-xs text-[#8a7a6a] mt-0.5">
                {employeeName ? `Welcome, ${employeeName}` : 'Submit and track your attendance requests'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${
              canMarkAttendance
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}>
              <Clock className={`w-3 h-3 ${canMarkAttendance ? "text-emerald-500" : "text-red-500"}`} />
              {canMarkAttendance ? `Open until ${attendanceDeadline}` : `Closed after ${attendanceDeadline}`}
            </div>

            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${
              locationEnabled ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
            }`}>
              <MapPin className={`w-3 h-3 ${locationEnabled ? "text-emerald-500" : "text-red-500"}`} />
              {locationEnabled ? "Location ON" : "Location OFF"}
            </div>

            <button
              onClick={() => navigate('/layout/employeesAttanddance-history')}
              className="inline-flex items-center gap-2 text-xs font-medium text-[#8a7a6a] hover:text-[#2c1810] hover:bg-[#f5f0eb] px-3 py-2 rounded-lg transition border border-[#e5ddd5]"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>

            <button onClick={() => {
              if (!canMarkAttendance) {
                toast.error(`❌ Cannot create request after ${attendanceDeadline}`);
                return;
              }
              setShowForm(!showForm);
            }}
              className={`inline-flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95 ${
                showForm ? "bg-[#e5ddd5] text-[#8a7a6a] hover:bg-[#d4c8bc]"
                  : canMarkAttendance
                    ? "bg-[#2c1810] hover:bg-[#2c1810]/80 text-white shadow-lg shadow-[#2c1810]/20"
                    : "bg-[#e5ddd5] text-[#8a7a6a] cursor-not-allowed"
              }`}
              disabled={!canMarkAttendance}
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showForm ? "Close Form" : "Create Request"}</span>
            </button>
          </div>
        </div>

        {/* ATTENDANCE STATUS BANNER */}
        {!canMarkAttendance && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-600">⏰ Attendance Window Closed</p>
              <p className="text-xs text-red-500 mt-1">
                You cannot mark attendance after {attendanceDeadline}. Employees who haven't marked attendance will be automatically marked as absent.
              </p>
            </div>
          </div>
        )}

        {canMarkAttendance && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-600">✅ Attendance Window Open</p>
              <p className="text-xs text-emerald-500 mt-1">
                You can mark attendance until {attendanceDeadline}. Current time: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-[#2c1810]' },
            { label: 'Approved', value: stats.approved, color: 'text-emerald-600' },
            { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
            { label: 'Rejected', value: stats.rejected, color: 'text-red-600' }
          ].map(stat => (
            <div key={stat.label} className="bg-[#faf7f3] border border-[#e5ddd5] rounded-xl p-3 sm:p-4 text-center hover:border-[#d4c8bc] transition">
              <p className="text-xs text-[#8a7a6a]">{stat.label}</p>
              <p className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div className="mb-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 bg-[#faf7f3] hover:bg-[#f5f0eb] text-[#2c1810] px-3 py-2 rounded-lg text-sm font-medium transition border border-[#e5ddd5]">
                <Filter className="w-4 h-4" /> Filters
                {isFilterApplied() && <span className="ml-1 w-2 h-2 rounded-full bg-[#2c1810]"></span>}
              </button>
              {isFilterApplied() && (
                <>
                  <button onClick={resetFilters}
                    className="text-xs text-[#8a7a6a] hover:text-[#2c1810] transition flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Clear Filters
                  </button>
                  <span className="text-xs text-[#8a7a6a]">{requests.length} results</span>
                </>
              )}
            </div>
            {isFiltering && <Loader2 className="w-4 h-4 animate-spin text-[#2c1810]" />}
          </div>

          {showFilters && (
            <div className="mt-3 bg-[#faf7f3] border border-[#e5ddd5] rounded-xl p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-[#8a7a6a] uppercase tracking-wider">Status</label>
                  <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full mt-1 bg-[#f5f0eb] border border-[#e5ddd5] focus:border-[#2c1810] focus:ring-1 focus:ring-[#2c1810] text-[#2c1810] rounded-lg px-3 py-2 text-sm outline-none">
                    <option value="all">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#8a7a6a] uppercase tracking-wider">Type</label>
                  <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full mt-1 bg-[#f5f0eb] border border-[#e5ddd5] focus:border-[#2c1810] focus:ring-1 focus:ring-[#2c1810] text-[#2c1810] rounded-lg px-3 py-2 text-sm outline-none">
                    <option value="all">All Types</option>
                    <option value="Present">Present</option>
                    <option value="Leave">Leave</option>
                    <option value="Half Day">Half Day</option>
                  </select>
                </div>
                <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                  <label className="text-[10px] font-semibold text-[#8a7a6a] uppercase tracking-wider">Date Range</label>
                  <div className="flex flex-col sm:flex-row items-stretch gap-1.5 mt-1">
                    <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="flex-1 bg-[#f5f0eb] border border-[#e5ddd5] focus:border-[#2c1810] focus:ring-1 focus:ring-[#2c1810] text-[#2c1810] rounded-lg px-2 py-2 text-sm outline-none" />
                    <span className="text-[#8a7a6a] text-xs self-center hidden sm:block">to</span>
                    <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="flex-1 bg-[#f5f0eb] border border-[#e5ddd5] focus:border-[#2c1810] focus:ring-1 focus:ring-[#2c1810] text-[#2c1810] rounded-lg px-2 py-2 text-sm outline-none" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2 border-t border-[#e5ddd5]/50">
                <button onClick={resetFilters} className="text-xs text-[#8a7a6a] hover:text-[#2c1810] transition px-3 py-1.5 rounded-lg hover:bg-[#f5f0eb] order-2 sm:order-1">Reset All</button>
                <button onClick={applyFilters} disabled={isFiltering}
                  className="text-xs bg-[#2c1810] hover:bg-[#2c1810]/80 text-white px-4 py-1.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1 order-1 sm:order-2">
                  {isFiltering && <Loader2 className="w-3 h-3 animate-spin" />} Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ============================================ */}
        {/* FORM MODAL */}
        {/* ============================================ */}
        {showForm && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={resetForm} />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
              <div className="bg-[#faf7f3] border border-[#e5ddd5] rounded-2xl p-4 sm:p-6 w-full max-w-lg max-h-[95vh] overflow-y-auto shadow-xl animate-fade-in custom-scrollbar">

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#2c1810] uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#2c1810]" /> New Request
                  </h3>
                  <div className="flex items-center gap-2">
                    {false && isTrackingLocation && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
                      </span>
                    )}
                    <button type="button" onClick={resetForm} className="p-1.5 text-[#8a7a6a] hover:text-[#2c1810] hover:bg-[#f5f0eb] rounded-lg transition">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {!canMarkAttendance && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">
                      ⏰ Attendance window is closed after {attendanceDeadline}. You cannot submit a new request.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8a7a6a]">Employee Name</label>
                    <input type="text" placeholder="Enter your name" value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#f5f0eb] border border-[#e5ddd5] focus:border-[#2c1810] focus:ring-1 focus:ring-[#2c1810] text-[#2c1810] placeholder-[#8a7a6a] rounded-xl px-3 py-2.5 text-sm outline-none"
                      required />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8a7a6a]">Date</label>
                    <input type="date" value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-[#f5f0eb] border border-[#e5ddd5] focus:border-[#2c1810] focus:ring-1 focus:ring-[#2c1810] text-[#2c1810] rounded-xl px-3 py-2.5 text-sm outline-none"
                      required />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8a7a6a]">Attendance Type</label>
                    <select value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value, reason: "" })}
                      className="w-full bg-[#f5f0eb] border border-[#e5ddd5] focus:border-[#2c1810] focus:ring-1 focus:ring-[#2c1810] text-[#2c1810] rounded-xl px-3 py-2.5 text-sm outline-none">
                      <option value="Present">Present</option>
                      <option value="Leave">Leave</option>
                      <option value="Half Day">Half Day</option>
                    </select>
                  </div>

                  {isReasonRequired() && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#8a7a6a] flex items-center gap-1">
                        Reason <span className="text-red-600">*</span>
                        <span className="text-[10px] text-[#8a7a6a] font-normal ml-1">(Required for {formData.type})</span>
                      </label>
                      <textarea placeholder={`Enter reason for ${formData.type}...`} value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        rows="2"
                        className="w-full bg-[#f5f0eb] border border-[#e5ddd5] focus:border-[#2c1810] focus:ring-1 focus:ring-[#2c1810] text-[#2c1810] placeholder-[#8a7a6a] rounded-xl p-3 text-sm outline-none resize-none"
                        required />
                    </div>
                  )}

                  {formData.type === "Present" && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
                      <Info className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-emerald-600">
                        You are marking yourself as <span className="font-semibold">Present</span>. No reason is required.
                      </p>
                    </div>
                  )}

                  {/* LOCATION SECTION */}
                  {false && locationEnabled && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#8a7a6a] flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-emerald-500" /> Location Verification
                        </label>
                        <div className="flex items-center gap-2">
                          {isTrackingLocation && (
                            <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Tracking
                            </span>
                          )}
                          <button type="button" onClick={handleCaptureLocation} disabled={locationLoading || !canMarkAttendance}
                            className="text-xs bg-[#2c1810] hover:bg-[#2c1810]/80 text-white px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1">
                            {locationLoading ? <Loader2 className="w-3 h-3 animate-spin" />
                              : formData.latitude ? <Check className="w-3 h-3" />
                                : <Globe className="w-3 h-3" />}
                            {formData.latitude ? "Update" : "Capture Location"}
                          </button>
                        </div>
                      </div>

                      {locationError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-red-600">{locationError}</p>
                        </div>
                      )}

                      {formData.latitude && formData.longitude && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-emerald-800 break-words">
                                {formData.locationAddress}
                              </p>
                              <p className="text-[10px] text-emerald-600 mt-0.5">
                                📍 {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                                {formData.locationAccuracy && <span className="ml-2">±{Math.round(formData.locationAccuracy)}m</span>}
                              </p>
                              {isTrackingLocation && (
                                <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  Live tracking active — updates in background
                                </p>
                              )}
                            </div>
                          </div>
                          {isTrackingLocation && (
                            <button type="button" onClick={stopContinuousTracking}
                              className="text-[10px] text-red-600 hover:text-red-700 transition mt-1">
                              Stop Tracking
                            </button>
                          )}
                        </div>
                      )}

                      {!formData.latitude && !locationError && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-amber-800">Location Required</p>
                            <p className="text-xs text-amber-700 mt-0.5">
                              Click <span className="font-semibold">"Capture Location"</span> to get GPS
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {false && !locationEnabled && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-600">
                        Location verification is <span className="font-semibold">disabled</span> by admin.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-end pt-2 gap-3">
                    <button type="button" onClick={resetForm}
                      className="px-4 py-2.5 rounded-xl bg-[#f5f0eb] hover:bg-[#e5ddd5] text-[#8a7a6a] hover:text-[#2c1810] text-xs font-medium transition border border-[#e5ddd5] order-2 sm:order-1">Cancel</button>
                    <button type="submit" disabled={submitting || !canMarkAttendance || (locationEnabled && !formData.latitude) || (isReasonRequired() && !formData.reason.trim())}
                      className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 order-1 sm:order-2 ${submitting || !canMarkAttendance || (locationEnabled && !formData.latitude) || (isReasonRequired() && !formData.reason.trim())
                          ? "bg-[#e5ddd5] text-[#8a7a6a] cursor-not-allowed"
                          : "bg-[#2c1810] hover:bg-[#2c1810]/80 text-white shadow-lg shadow-[#2c1810]/20"
                        }`}>
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {submitting ? "Submitting..." : !canMarkAttendance ? "Closed" : "Submit Request"}
                    </button>
                  </div>
                </form>

                {false && submittedRequestId && (
                  <div className="mt-4 pt-4 border-t border-[#e5ddd5]">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-800">Request Submitted!</span>
                      </div>
                      <p className="text-xs text-emerald-700">Location tracking is active. Updates saved in background.</p>
                      {formData.latitude && (
                        <div className="mt-2 p-2 bg-white rounded-lg border border-emerald-200">
                          <p className="text-xs font-medium text-emerald-800 break-words">{formData.locationAddress}</p>
                          <p className="text-[10px] text-emerald-600 mt-0.5">📍 {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ============================================ */}
        {/* EDIT MODAL */}
        {/* ============================================ */}
        {showEditModal && editingRequest && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setShowEditModal(false)} />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
              <div className="bg-[#faf7f3] border border-[#e5ddd5] rounded-2xl p-4 sm:p-6 w-full max-w-lg max-h-[95vh] overflow-y-auto shadow-xl animate-fade-in custom-scrollbar">

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#2c1810] flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-[#2c1810]" />
                    Edit Attendance Request
                  </h3>
                  <button type="button" onClick={() => setShowEditModal(false)} className="p-1.5 text-[#8a7a6a] hover:text-[#2c1810] hover:bg-[#f5f0eb] rounded-lg transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Edit Window Info */}
                {editInfo && (
                  <div className={`p-3 rounded-lg mb-4 ${editInfo.canEdit ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${editInfo.canEdit ? 'text-emerald-600' : 'text-red-600'}`} />
                      <span className={`text-sm font-medium ${editInfo.canEdit ? 'text-emerald-600' : 'text-red-600'}`}>
                        {editInfo.canEdit
                          ? `⏰ ${editInfo.remainingMinutes} minutes remaining to edit`
                          : '🔒 Edit window expired'}
                      </span>
                    </div>
                    <p className="text-xs text-[#8a7a6a] mt-1">
                      Submitted: {new Date(editInfo.createdAt).toLocaleTimeString()}
                      {!editInfo.canEdit && ` • ${editInfo.timeElapsed} minutes ago`}
                    </p>
                  </div>
                )}

                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#8a7a6a]">Name</label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full bg-[#f5f0eb] border border-[#e5ddd5] focus:border-[#2c1810] focus:ring-1 focus:ring-[#2c1810] text-[#2c1810] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#8a7a6a]">Date</label>
                    <input
                      type="date"
                      value={editFormData.date}
                      onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                      className="w-full bg-[#f5f0eb] border border-[#e5ddd5] focus:border-[#2c1810] focus:ring-1 focus:ring-[#2c1810] text-[#2c1810] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#8a7a6a]">Type</label>
                    <select
                      value={editFormData.type}
                      onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                      className="w-full bg-[#f5f0eb] border border-[#e5ddd5] focus:border-[#2c1810] focus:ring-1 focus:ring-[#2c1810] text-[#2c1810] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                    >
                      <option value="Present">Present</option>
                      <option value="Leave">Leave</option>
                      <option value="Half Day">Half Day</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#8a7a6a]">Reason</label>
                    <textarea
                      value={editFormData.reason}
                      onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
                      rows="3"
                      className="w-full bg-[#f5f0eb] border border-[#e5ddd5] focus:border-[#2c1810] focus:ring-1 focus:ring-[#2c1810] text-[#2c1810] rounded-lg px-3 py-2 text-sm resize-none outline-none transition-colors"
                      placeholder="Enter reason..."
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 px-4 py-2 bg-[#f5f0eb] hover:bg-[#e5ddd5] text-[#8a7a6a] hover:text-[#2c1810] rounded-lg text-sm font-medium transition border border-[#e5ddd5]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editing || !editInfo?.canEdit}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition ${editing || !editInfo?.canEdit
                          ? 'bg-[#e5ddd5] text-[#8a7a6a] cursor-not-allowed'
                          : 'bg-[#2c1810] hover:bg-[#2c1810]/80'
                        }`}
                    >
                      {editing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* LOADING */}
        {loading && requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-[#8a7a6a] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#2c1810]" />
            <p className="text-xs font-medium">Loading your requests...</p>
          </div>
        )}

        {/* EMPTY STATES */}
        {!loading && requests.length === 0 && !isFilterApplied() && (
          <div className="text-center py-16 bg-[#faf7f3] border border-[#e5ddd5] rounded-2xl">
            <FileText className="w-12 h-12 text-[#8a7a6a] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#8a7a6a]">No requests found</h3>
            <p className="text-xs text-[#8a7a6a] mt-1">Submit your first attendance request</p>
          </div>
        )}

        {!loading && requests.length === 0 && isFilterApplied() && (
          <div className="text-center py-16 bg-[#faf7f3] border border-[#e5ddd5] rounded-2xl">
            <Filter className="w-12 h-12 text-[#8a7a6a] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#8a7a6a]">No matching requests</h3>
            <button onClick={resetFilters} className="mt-3 text-xs text-[#2c1810] hover:text-[#2c1810]/70 transition">Clear all filters</button>
          </div>
        )}

        {/* REQUESTS LIST */}
        {!loading && requests.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#2c1810] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#8a7a6a]" /> Your Requests <span className="text-xs text-[#8a7a6a]">({total})</span>
            </h3>

            {requests.map((req, index) => {
              const status = getStatusBadge(req.status);
              const typeBadge = getTypeBadge(req.type);
              const isExpanded = expandedId === req._id;
              const isLast = index === requests.length - 1;
              const canEdit = req.status === "Pending" && new Date() - new Date(req.createdAt) < (editWindow * 60 * 1000);

              return (
                <div key={req._id} ref={isLast ? lastElementRef : null}
                  className="bg-[#faf7f3] border border-[#e5ddd5] rounded-xl overflow-hidden hover:border-[#d4c8bc] transition-all">
                  <div className="p-4 cursor-pointer hover:bg-[#f5f0eb] transition-colors" onClick={() => toggleExpand(req._id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#f5f0eb] flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-[#8a7a6a]" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium text-[#2c1810] truncate">{req.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-[#8a7a6a]">
                            <span>{formatDate(req.date)}</span>
                            <span className="w-1 h-1 rounded-full bg-[#e5ddd5]"></span>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${typeBadge.color}`}>
                              {typeBadge.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[#8a7a6a]" /> : <ChevronDown className="w-4 h-4 text-[#8a7a6a]" />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-[#e5ddd5] space-y-3">
                      {req.status === "Rejected" && req.adminRemarks ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Ban className="w-4 h-4 text-red-600" />
                            <h5 className="text-xs font-semibold text-red-600 uppercase tracking-wider">Rejection Reason</h5>
                          </div>
                          <p className="text-sm text-[#2c1810]">{req.adminRemarks}</p>
                        </div>
                      ) : req.status === "Rejected" && !req.adminRemarks ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                          <Ban className="w-4 h-4 text-red-600" />
                          <p className="text-sm text-red-600">No rejection reason provided</p>
                        </div>
                      ) : (
                        <div className="bg-[#f5f0eb] rounded-lg p-3">
                          <h5 className="text-[10px] font-semibold text-[#8a7a6a] uppercase tracking-wider mb-1 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Your Reason
                          </h5>
                          <p className="text-sm text-[#2c1810]">{req.reason || "No reason provided"}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#8a7a6a]">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Submitted: {formatDateTime(req.createdAt)}</span>
                        {req.locationCaptured && <span className="flex items-center gap-1 text-emerald-600"><MapPin className="w-3 h-3" /> Location Verified</span>}
                        {req.processedAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Processed: {formatDateTime(req.processedAt)}</span>}
                        {req.status === "Absent" && (
                          <span className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="w-3 h-3" /> Auto-marked absent
                          </span>
                        )}
                        {req.editHistory && req.editHistory.length > 0 && (
                          <span className="flex items-center gap-1 text-[#2c1810]">
                            <Edit2 className="w-3 h-3" /> Edited {req.editHistory.length} time{req.editHistory.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Edit Button - Show if pending and within dynamic window */}
                      {req.status === "Pending" && (
                        <div className="flex items-center gap-2 pt-2 border-t border-[#e5ddd5]/50">
                          {canEdit ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(req);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2c1810]/10 hover:bg-[#2c1810]/20 text-[#2c1810] rounded-lg text-xs font-medium transition border border-[#2c1810]/20"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit Request
                              <span className="text-[10px] opacity-70">
                                ({(editWindow) - Math.floor((new Date() - new Date(req.createdAt)) / (1000 * 60))}m left)
                              </span>
                            </button>
                          ) : (
                            <span className="text-xs text-[#8a7a6a] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Edit window expired ({editWindow} min limit)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {loadingMore && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-[#2c1810]" />
                <span className="ml-2 text-sm text-[#8a7a6a]">Loading more...</span>
              </div>
            )}

            {!hasMore && requests.length > 0 && !loading && (
              <div className="text-center py-4"><p className="text-xs text-[#8a7a6a]">No more requests to load</p></div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d4c8bc; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #b8a898; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
