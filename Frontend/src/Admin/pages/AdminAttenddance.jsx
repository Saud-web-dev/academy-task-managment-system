import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../service/api.js';
import SSIPageLoader from '../../components/SSIPageLoader';
import {
  Loader2, CheckCircle, XCircle, Clock, History, Calendar, User, MapPin,
  AlertCircle, Eye, X, UserCheck, Globe, FileText, Clock as ClockIcon,
  Calendar as CalendarIcon, RefreshCw, Filter, Search, XCircle as XCircleIcon, Save
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminAttendancePage() {
  const navigate = useNavigate();

  // ================= STATE =================
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectId, setRejectId] = useState(null);
  const [showEditStatusModal, setShowEditStatusModal] = useState(false);
  const [editStatusId, setEditStatusId] = useState(null);
  const [editStatusData, setEditStatusData] = useState({ status: '', adminRemarks: '' });
  const [filters, setFilters] = useState({ type: 'all', startDate: '', endDate: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isFiltering, setIsFiltering] = useState(false);
  const [locationCache, setLocationCache] = useState({});
  const [loadingLocation, setLoadingLocation] = useState(false);

  // ================= LOCATION FUNCTIONS (Optimized with caching) =================
  const fetchLocationName = useCallback(async (latitude, longitude, locationAddress = null) => {
    if (!latitude || !longitude) return null;

    if (locationAddress && locationAddress !== "Office Location" && locationAddress !== "Location captured") {
      return locationAddress;
    }

    const cacheKey = `${parseFloat(latitude).toFixed(6)},${parseFloat(longitude).toFixed(6)}`;
    if (locationCache[cacheKey]) {
      return locationCache[cacheKey];
    }

    try {
      setLoadingLocation(true);
      const response = await api.get(`/geocode/reverse?lat=${latitude}&lon=${longitude}&detailed=true`);

      let locationName = null;

      if (response.data?.success) {
        const data = response.data.data || {};
        locationName = data.building || data.street || data.suburb || data.neighborhood ||
          data.village || data.town || data.city || data.district ||
          data.state || data.country || data.formatted || response.data.locationName;
      }

      if (locationName) {
        setLocationCache(prev => ({ ...prev, [cacheKey]: locationName }));
        return locationName;
      }

      return `${parseFloat(latitude).toFixed(6)}, ${parseFloat(longitude).toFixed(6)}`;
    } catch (error) {
      console.error('Location fetch error:', error);
      return `${parseFloat(latitude).toFixed(6)}, ${parseFloat(longitude).toFixed(6)}`;
    } finally {
      setLoadingLocation(false);
    }
  }, [locationCache]);

  const fetchAllLocationNames = useCallback(async (requestsData) => {
    if (!requestsData?.length) return;

    setLoadingLocation(true);
    try {
      await Promise.allSettled(
        requestsData
          .filter(req => req.latitude && req.longitude && !req.locationAddress)
          .map(req => fetchLocationName(req.latitude, req.longitude))
      );
    } catch (error) {
      console.error('Error fetching location names:', error);
    } finally {
      setLoadingLocation(false);
    }
  }, [fetchLocationName]);

  const getLocationDisplay = useCallback((latitude, longitude, locationAddress = null) => {
    if (!latitude || !longitude) return null;

    if (locationAddress && locationAddress !== "Office Location" && locationAddress !== "Location captured") {
      return locationAddress;
    }

    const cacheKey = `${parseFloat(latitude).toFixed(6)},${parseFloat(longitude).toFixed(6)}`;
    if (locationCache[cacheKey]) {
      return locationCache[cacheKey];
    }

    return `${parseFloat(latitude).toFixed(6)}, ${parseFloat(longitude).toFixed(6)}`;
  }, [locationCache]);

  // ================= FETCH REQUESTS =================
  const fetchPending = useCallback(async (filterParams = {}) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (filterParams.type && filterParams.type !== 'all') params.append('type', filterParams.type);
      if (filterParams.startDate) params.append('startDate', filterParams.startDate);
      if (filterParams.endDate) params.append('endDate', filterParams.endDate);
      if (filterParams.search) params.append('search', filterParams.search);

      const url = `/attendance/pending${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await api.get(url);
      const data = res?.data?.data || res?.data || [];

      setRequests(data);
      setAppliedFilters(filterParams);

      fetchAllLocationNames(data);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError('Failed to load pending requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchAllLocationNames]);

  // ================= FILTERS =================
  const applyFilters = useCallback(() => {
    setIsFiltering(true);
    const filterParams = {};
    if (filters.type && filters.type !== 'all') filterParams.type = filters.type;
    if (filters.startDate) filterParams.startDate = filters.startDate;
    if (filters.endDate) filterParams.endDate = filters.endDate;
    if (filters.search) filterParams.search = filters.search;

    fetchPending(filterParams);
    setIsFiltering(false);
    setShowFilters(false);
  }, [filters, fetchPending]);

  const resetFilters = useCallback(() => {
    const emptyFilters = { type: 'all', startDate: '', endDate: '', search: '' };
    setFilters(emptyFilters);
    setAppliedFilters({});
    fetchPending(emptyFilters);
  }, [fetchPending]);

  // ================= ACTIONS =================
  const handleApprove = useCallback(async (id) => {
    setProcessingId(id);
    try {
      await api.put(`/attendance/${id}/action`, {
        status: "Approved",
        adminRemarks: "Approved by admin"
      });
      await fetchPending(appliedFilters);
      toast.success('Request approved successfully!');
      setIsDetailModalOpen(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error('Approve Error:', err);
      toast.error('Failed to approve request.');
    } finally {
      setProcessingId(null);
    }
  }, [fetchPending, appliedFilters]);

  const handleReject = useCallback(async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessingId(rejectId);
    try {
      await api.put(`/attendance/${rejectId}/action`, {
        status: "Rejected",
        adminRemarks: rejectReason
      });
      await fetchPending(appliedFilters);
      toast.success('Request rejected successfully!');
      setShowRejectModal(false);
      setRejectReason('');
      setRejectId(null);
      setIsDetailModalOpen(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error('Reject Error:', err);
      toast.error('Failed to reject request.');
    } finally {
      setProcessingId(null);
    }
  }, [rejectReason, rejectId, fetchPending, appliedFilters]);

  const handleEditStatus = useCallback(async () => {
    if (!editStatusData.status) {
      toast.error('Please select a status');
      return;
    }

    setProcessingId(editStatusId);
    try {
      await api.put(`/attendance/${editStatusId}/action`, {
        status: editStatusData.status,
        adminRemarks: editStatusData.adminRemarks || `Status changed to ${editStatusData.status}`
      });
      await fetchPending(appliedFilters);
      toast.success(`Status changed to ${editStatusData.status} successfully!`);
      setShowEditStatusModal(false);
      setEditStatusId(null);
      setEditStatusData({ status: '', adminRemarks: '' });
      setIsDetailModalOpen(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error('Edit Status Error:', err);
      toast.error('Failed to update status');
    } finally {
      setProcessingId(null);
    }
  }, [editStatusData, editStatusId, fetchPending, appliedFilters]);

  // ================= MODAL HANDLERS =================
  const openRejectModal = useCallback((id) => {
    setRejectId(id);
    setShowRejectModal(true);
    setRejectReason('');
  }, []);

  const openEditStatusModal = useCallback((id, currentStatus, remarks) => {
    setEditStatusId(id);
    setEditStatusData({
      status: currentStatus === "Approved" ? "Rejected" : "Approved",
      adminRemarks: remarks || '',
    });
    setShowEditStatusModal(true);
  }, []);

  const openDetailModal = useCallback((request) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  }, []);

  // ================= HELPERS =================
  const getStatusBadge = useCallback((status) => {
    const statusMap = {
      approved: 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20',
      rejected: 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20',
      default: 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20'
    };
    return statusMap[status?.toLowerCase()] || statusMap.default;
  }, []);

  const getStatusIcon = useCallback((status) => {
    const iconMap = {
      approved: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />,
      default: <Clock className="w-4 h-4" />
    };
    return iconMap[status?.toLowerCase()] || iconMap.default;
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }, []);

  const formatDateTime = useCallback((date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }, []);

  const getTypeIcon = useCallback((type) => {
    const iconMap = {
      present: <UserCheck className="w-4 h-4 text-[var(--success)]" />,
      leave: <CalendarIcon className="w-4 h-4 text-[var(--warning)]" />,
      'half day': <ClockIcon className="w-4 h-4 text-[var(--accent-primary)]" />,
      default: <FileText className="w-4 h-4 text-[var(--text-muted)]" />
    };
    return iconMap[type?.toLowerCase()] || iconMap.default;
  }, []);

  const isFilterApplied = useCallback(() => {
    return Object.values(filters).some(v => v !== 'all' && v !== '');
  }, [filters]);

  // ================= INITIAL FETCH =================
  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  if (loading) return <SSIPageLoader message="Loading attendance..." />;

  // ================= RENDER =================
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
            iconTheme: { primary: 'var(--success)', secondary: 'var(--text-inverse)' },
          },
          error: {
            iconTheme: { primary: 'var(--danger)', secondary: 'var(--text-inverse)' },
          },
        }}
      />
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden">
        {/* HEADER */}
        <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--accent-primary)]/10 p-2.5 rounded-xl">
                <UserCheck className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--text-primary)]">Attendance Management</h1>
                <p className="text-sm text-[var(--text-secondary)]">Review and approve pending attendance requests</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/attendance-history')}
              className="inline-flex items-center gap-2 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] px-4 py-2.5 rounded-lg text-sm font-medium transition border border-[var(--border-color)]"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">View History</span>
              <span className="sm:hidden">History</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 sm:p-6">
          {/* ERROR STATE */}
          {error && (
            <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] p-3 sm:p-4 rounded-xl mb-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* FILTERS */}
          <div className="mb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center gap-2 text-sm px-3 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg border border-[var(--border-color)] transition-all"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden xs:inline">Filters</span>
                  {isFilterApplied() && (
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]"></span>
                  )}
                </button>
                {isFilterApplied() && (
                  <>
                    <button
                      onClick={resetFilters}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition flex items-center gap-1"
                    >
                      <XCircleIcon className="w-3 h-3" />
                      Clear
                    </button>
                    <span className="text-xs text-[var(--text-muted)] hidden xs:inline">
                      {requests.length} results
                    </span>
                  </>
                )}
              </div>
              {isFiltering && <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />}
            </div>

            {showFilters && (
              <div className="mt-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Search</label>
                    <div className="relative mt-1">
                      <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        placeholder="Name or ID..."
                        className="w-full pl-9 pr-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg text-sm outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Type</label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                      className="w-full mt-1 py-2 px-3 bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg text-sm outline-none transition-colors"
                    >
                      <option value="all">All Types</option>
                      <option value="present">Present</option>
                      <option value="leave">Leave</option>
                      <option value="half day">Half Day</option>
                    </select>
                  </div>

                  <div className="xs:col-span-2 lg:col-span-2">
                    <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Date Range</label>
                    <div className="flex gap-1.5 mt-1">
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        className="flex-1 py-2 px-3 bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg text-sm outline-none transition-colors"
                        placeholder="From"
                      />
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        className="flex-1 py-2 px-3 bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg text-sm outline-none transition-colors"
                        placeholder="To"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col xs:flex-row justify-end gap-2 pt-2 border-t border-[var(--border-color)]/50">
                  <button
                    onClick={resetFilters}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition px-3 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] order-2 xs:order-1"
                  >
                    Reset All
                  </button>
                  <button
                    onClick={applyFilters}
                    disabled={isFiltering}
                    className="text-xs bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] px-4 py-1.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1 order-1 xs:order-2"
                  >
                    {isFiltering && <Loader2 className="w-3 h-3 animate-spin" />}
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* REQUESTS LIST */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text-primary)] text-base sm:text-lg flex items-center gap-2">
              Pending Requests
              <span className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2 py-0.5 rounded-full text-xs font-bold border border-[var(--accent-primary)]/20">
                {requests.length}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 sm:p-5 animate-pulse space-y-3">
                  <div className="h-4 bg-[var(--bg-card)] rounded w-1/4"></div>
                  <div className="h-3 bg-[var(--bg-card)] rounded w-1/2"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-[var(--bg-card)] rounded w-20"></div>
                    <div className="h-8 bg-[var(--bg-card)] rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-10 sm:py-12 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl border-dashed">
              <CheckCircle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-[var(--text-secondary)] text-sm">
                {isFilterApplied() ? 'No requests match your filters.' : '🎉 All caught up! No pending requests.'}
              </p>
              {isFilterApplied() && (
                <button onClick={resetFilters} className="mt-2 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-hover)] transition">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 sm:p-5 hover:border-[var(--border-hover)] transition-all cursor-pointer group"
                  onClick={() => openDetailModal(req)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[var(--text-primary)] text-sm sm:text-base truncate">
                          {req.name}
                        </h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusBadge(req.status)}`}>
                          {req.status}
                        </span>
                        {(req.latitude && req.longitude) && (
                          <span className="text-[10px] text-[var(--success)] bg-[var(--success)]/10 px-2 py-0.5 rounded-full border border-[var(--success)]/20 flex items-center gap-1 max-w-[200px] truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {loadingLocation ? (
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            ) : (
                              <span className="truncate">
                                {req.locationAddress && req.locationAddress !== "Office Location" ? (
                                  req.locationAddress
                                ) : (
                                  getLocationDisplay(req.latitude, req.longitude)
                                )}
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                        {req.reason || "No reason provided."}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(req.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          ID: {req.employeeId?.slice(-6) || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          {getTypeIcon(req.type)}
                          {req.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === "Pending" && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleApprove(req._id); }}
                            disabled={processingId === req._id}
                            className="inline-flex items-center gap-1 text-sm px-3 py-1.5 bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20 border border-[var(--success)]/20 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                          >
                            {processingId === req._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            <span className="hidden xs:inline">Approve</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openRejectModal(req._id); }}
                            disabled={processingId === req._id}
                            className="inline-flex items-center gap-1 text-sm px-3 py-1.5 bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20 border border-[var(--danger)]/20 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                          >
                            {processingId === req._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            <span className="hidden xs:inline">Reject</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); openDetailModal(req); }}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= REJECTION MODAL ================= */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setShowRejectModal(false)} />
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-md relative z-10 rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 sm:px-6 py-3 sm:py-4 bg-[var(--bg-secondary)]">
                <h4 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-[var(--danger)]" />
                  Rejection Reason
                </h4>
                <button onClick={() => setShowRejectModal(false)} className="p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-sm text-[var(--text-secondary)] mb-3">Please provide a reason for rejecting this request:</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows="4"
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl px-3 py-2.5 text-sm outline-none resize-none transition-colors"
                  required
                />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition border border-[var(--border-color)]">Cancel</button>
                  <button
                    onClick={handleReject}
                    disabled={!rejectReason.trim() || processingId === rejectId}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20 border border-[var(--danger)]/20 text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processingId === rejectId ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= EDIT STATUS MODAL ================= */}
        {showEditStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setShowEditStatusModal(false)} />
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-md relative z-10 rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 sm:px-6 py-3 sm:py-4 bg-[var(--bg-secondary)]">
                <h4 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-[var(--accent-primary)]" />
                  Edit Status
                </h4>
                <button onClick={() => setShowEditStatusModal(false)} className="p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">Change the status of this request:</p>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">New Status</label>
                  <select
                    value={editStatusData.status}
                    onChange={(e) => setEditStatusData({ ...editStatusData, status: e.target.value })}
                    className="w-full mt-1 py-2 px-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg text-sm outline-none transition-colors"
                  >
                    <option value="Approved">✅ Approved</option>
                    <option value="Rejected">❌ Rejected</option>
                    <option value="Pending">⏳ Pending</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Admin Remarks (Optional)</label>
                  <textarea
                    value={editStatusData.adminRemarks}
                    onChange={(e) => setEditStatusData({ ...editStatusData, adminRemarks: e.target.value })}
                    placeholder="Add remarks..."
                    rows="3"
                    className="w-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl px-3 py-2.5 text-sm outline-none resize-none transition-colors"
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowEditStatusModal(false)} className="flex-1 py-2.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition border border-[var(--border-color)]">Cancel</button>
                  <button
                    onClick={handleEditStatus}
                    disabled={!editStatusData.status || processingId === editStatusId}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processingId === editStatusId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= DETAIL MODAL ================= */}
        {isDetailModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => { setIsDetailModalOpen(false); setSelectedRequest(null); }} />
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col relative z-10 rounded-xl shadow-2xl overflow-hidden">

              <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 sm:px-6 py-3 sm:py-4 bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20 flex-shrink-0">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-primary)]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-lg font-semibold text-[var(--text-primary)] truncate">
                      Attendance Request Details
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      ID: {selectedRequest._id?.slice(-8) || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  {selectedRequest.status !== "Pending" && (
                    <button
                      onClick={() => openEditStatusModal(selectedRequest._id, selectedRequest.status, selectedRequest.adminRemarks)}
                      className="p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition"
                      title="Edit Status"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => { setIsDetailModalOpen(false); setSelectedRequest(null); }}
                    className="p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusBadge(selectedRequest.status)}`}>
                    {getStatusIcon(selectedRequest.status)}
                    {selectedRequest.status}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                    {getTypeIcon(selectedRequest.type)}
                    {selectedRequest.type}
                  </span>
                  {selectedRequest.latitude && selectedRequest.longitude && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)]">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                      Location Captured
                    </span>
                  )}
                </div>

                {/* Employee Info */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <h5 className="text-[10px] sm:text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Employee Information
                  </h5>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">Full Name</p>
                      <p className="text-sm sm:text-base text-[var(--text-primary)] font-medium truncate">{selectedRequest.name}</p>
                    </div>
                  </div>
                </div>

                {/* Request Details */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <h5 className="text-[10px] sm:text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    Request Details
                  </h5>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-[var(--text-muted)]">Date</span>
                      <span className="text-sm text-[var(--text-primary)]">{formatDate(selectedRequest.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[var(--text-muted)]">Type</span>
                      <span className="text-sm text-[var(--text-primary)]">{selectedRequest.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[var(--text-muted)]">Status</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">{selectedRequest.status}</span>
                    </div>
                    <div className="pt-2 border-t border-[var(--border-color)]">
                      <p className="text-xs text-[var(--text-muted)] mb-1">Reason</p>
                      <p className="text-sm text-[var(--text-primary)] bg-[var(--bg-card)] p-2 sm:p-3 rounded-xl break-words border border-[var(--border-color)]">
                        {selectedRequest.reason || 'No reason provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location Details */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <h5 className="text-[10px] sm:text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    Location Information
                  </h5>

                  {(selectedRequest.latitude && selectedRequest.longitude) ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[var(--success)] bg-[var(--success)]/10 p-3 rounded-xl border border-[var(--success)]/20">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium break-words">
                            {loadingLocation ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Loading location...
                              </span>
                            ) : (
                              selectedRequest.locationAddress &&
                                selectedRequest.locationAddress !== "Office Location" ? (
                                selectedRequest.locationAddress
                              ) : (
                                getLocationDisplay(selectedRequest.latitude, selectedRequest.longitude)
                              )
                            )}
                          </p>
                          <p className="text-[10px] text-[var(--success)] mt-0.5">
                            📍 {parseFloat(selectedRequest.latitude).toFixed(6)}, {parseFloat(selectedRequest.longitude).toFixed(6)}
                            {selectedRequest.locationAccuracy && (
                              <span className="ml-2">
                                ±{Math.round(selectedRequest.locationAccuracy)}m accuracy
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${selectedRequest.latitude},${selectedRequest.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-hover)] transition-colors"
                      >
                        <Globe className="w-3 h-3" />
                        View on Google Maps
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[var(--warning)] bg-[var(--warning)]/10 p-3 rounded-xl border border-[var(--warning)]/20">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">No Location Data</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          This request was submitted without location capture
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Legacy tracker intentionally disabled: attendance no longer collects location. */}
                {false && selectedRequest.status === "Pending" && selectedRequest._id && (
                  <div className="mt-4">
                    <RealTimeLocationTracker
                      attendanceId={selectedRequest._id}
                      onLocationUpdate={(data) => {
                        console.log('Location updated:', data);
                        fetchPending(appliedFilters);
                        setSelectedRequest(prev => ({
                          ...prev,
                          latitude: data.latitude,
                          longitude: data.longitude,
                          locationAddress: data.locationAddress,
                          locationUpdatedAt: data.locationUpdatedAt
                        }));
                      }}
                      autoUpdate={false}
                      compact={false}
                      showHistory={true}
                    />
                  </div>
                )}

                {/* Timestamps */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <h5 className="text-[10px] sm:text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                    <ClockIcon className="w-3 h-3" />
                    Timestamps
                  </h5>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[var(--text-muted)]">Created At</span>
                      <p className="text-[var(--text-primary)] break-words">{formatDateTime(selectedRequest.createdAt)}</p>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Updated At</span>
                      <p className="text-[var(--text-primary)] break-words">{formatDateTime(selectedRequest.updatedAt)}</p>
                    </div>
                    {selectedRequest.processedAt && (
                      <div className="xs:col-span-2">
                        <span className="text-[var(--text-muted)]">Processed At</span>
                        <p className="text-[var(--text-primary)] break-words">{formatDateTime(selectedRequest.processedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Remarks */}
                {selectedRequest.adminRemarks && (
                  <div className={`rounded-xl p-3 sm:p-4 border ${selectedRequest.status === "Rejected"
                    ? 'bg-[var(--danger)]/10 border-[var(--danger)]/20'
                    : 'bg-[var(--warning)]/10 border-[var(--warning)]/20'
                    }`}>
                    <h5 className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${selectedRequest.status === "Rejected" ? 'text-[var(--danger)]' : 'text-[var(--warning)]'
                      }`}>
                      <FileText className="w-3 h-3" />
                      {selectedRequest.status === "Rejected" ? 'Rejection Reason' : 'Admin Remarks'}
                    </h5>
                    <p className="text-sm text-[var(--text-primary)] mt-1 break-words">{selectedRequest.adminRemarks}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border-color)] px-4 sm:px-6 py-3 sm:py-4 bg-[var(--bg-secondary)]">
                {selectedRequest.status === "Pending" ? (
                  <>
                    <button
                      onClick={() => handleApprove(selectedRequest._id)}
                      disabled={processingId === selectedRequest._id}
                      className="flex-1 xs:flex-initial inline-flex items-center justify-center gap-2 text-sm px-4 py-2 bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20 border border-[var(--success)]/20 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                      {processingId === selectedRequest._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => { setIsDetailModalOpen(false); openRejectModal(selectedRequest._id); }}
                      disabled={processingId === selectedRequest._id}
                      className="flex-1 xs:flex-initial inline-flex items-center justify-center gap-2 text-sm px-4 py-2 bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20 border border-[var(--danger)]/20 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                      {processingId === selectedRequest._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Reject
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => openEditStatusModal(selectedRequest._id, selectedRequest.status, selectedRequest.adminRemarks)}
                    className="flex-1 xs:flex-initial inline-flex items-center justify-center gap-2 text-sm px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] rounded-lg transition-all active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Edit Status
                  </button>
                )}
                <button
                  onClick={() => { setIsDetailModalOpen(false); setSelectedRequest(null); }}
                  className="flex-1 xs:flex-initial inline-flex items-center justify-center gap-2 text-sm px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg transition-all active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
