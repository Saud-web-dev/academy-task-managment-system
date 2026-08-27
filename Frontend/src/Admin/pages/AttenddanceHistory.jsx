// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import api from '../../service/api.js';
// import {
//     Loader2,
//     CheckCircle,
//     XCircle,
//     Clock,
//     History as HistoryIcon,
//     Trash2,
//     ChevronRight,
//     Calendar,
//     User,
//     MapPin,
//     AlertCircle,
//     Eye,
//     X,
//     UserCheck,
//     Globe,
//     FileText,
//     Clock as ClockIcon,
//     Calendar as CalendarIcon,
//     Filter,
//     Search,
//     XCircle as XCircleIcon,
//     ArrowLeft,
//     RefreshCw,
//     Save,
//     MessageSquare,
//     Edit2
// } from 'lucide-react';
// import toast from 'react-hot-toast';
// import { getCachedLocationName } from '../utility/geocode.js';

// export default function AttanddanceHistory() {
//     const navigate = useNavigate();

//     // ================= STATE =================
//     const [history, setHistory] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [processingId, setProcessingId] = useState(null);

//     // Pagination State
//     const [page, setPage] = useState(1);
//     const [total, setTotal] = useState(0);
//     const [hasMore, setHasMore] = useState(true);
//     const [loadingMore, setLoadingMore] = useState(false);
//     const observerRef = useRef(null);

//     // Filter State
//     const [filters, setFilters] = useState({
//         status: 'all',
//         type: 'all',
//         startDate: '',
//         endDate: '',
//         search: '',
//     });
//     const [showFilters, setShowFilters] = useState(false);
//     const [appliedFilters, setAppliedFilters] = useState({});
//     const [isFiltering, setIsFiltering] = useState(false);

//     // Selected Request for Detail View
//     const [selectedRequest, setSelectedRequest] = useState(null);
//     const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

//     // Edit Status Modal State
//     const [showEditStatusModal, setShowEditStatusModal] = useState(false);
//     const [editStatusData, setEditStatusData] = useState({
//         status: '',
//         adminRemarks: '',
//     });

//     // Location Names Cache
//     const [locationNames, setLocationNames] = useState({});
//     const [loadingLocation, setLoadingLocation] = useState(false);

//     // ================= FETCH LOCATION NAME =================
//     const fetchLocationName = async (latitude, longitude) => {
//         if (!latitude || !longitude) return null;

//         const cacheKey = `${latitude},${longitude}`;
//         if (locationNames[cacheKey]) return locationNames[cacheKey];

//         try {
//             const response = await api.get(`/geocode/reverse?lat=${latitude}&lon=${longitude}`);

//             if (response.data.success) {
//                 const locationName = response.data.locationName;
//                 setLocationNames(prev => ({
//                     ...prev,
//                     [cacheKey]: locationName
//                 }));
//                 return locationName;
//             }
//             return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
//         } catch (error) {
//             console.error('Location fetch error:', error);
//             return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
//         }
//     };

//     // ================= FETCH LOCATION NAMES =================
//     const fetchAllLocationNames = async (data) => {
//         if (!data || data.length === 0) return;

//         setLoadingLocation(true);

//         for (const req of data) {
//             if (req.latitude && req.longitude) {
//                 await fetchLocationName(req.latitude, req.longitude);
//             }
//         }

//         setLoadingLocation(false);
//     };

//     // ================= GET DISPLAY LOCATION NAME =================
//     const getLocationDisplay = (latitude, longitude) => {
//         if (!latitude || !longitude) return null;

//         const cacheKey = `${latitude},${longitude}`;
//         const cached = locationNames[cacheKey];

//         if (cached) {
//             return cached;
//         }

//         return `${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}`;
//     };

//     // ================= FETCH HISTORY =================
//     const fetchHistory = async (pageNum = 1, append = false, filterParams = {}) => {
//         try {
//             if (append) {
//                 setLoadingMore(true);
//             } else {
//                 setLoading(true);
//             }

//             const params = new URLSearchParams();
//             params.append('page', pageNum);
//             params.append('limit', 15);

//             if (filterParams.status && filterParams.status !== 'all') params.append('status', filterParams.status);
//             if (filterParams.type && filterParams.type !== 'all') params.append('type', filterParams.type);
//             if (filterParams.startDate) params.append('startDate', filterParams.startDate);
//             if (filterParams.endDate) params.append('endDate', filterParams.endDate);
//             if (filterParams.search) params.append('search', filterParams.search);

//             const url = `/attendance/all?${params.toString()}`;
//             const res = await api.get(url);

//             const data = res?.data?.data || res?.data || [];
//             const totalCount = res?.data?.total || data.length;

//             if (append) {
//                 setHistory(prev => [...prev, ...data]);
//             } else {
//                 setHistory(data);
//             }

//             setTotal(totalCount);
//             setHasMore(pageNum * 15 < totalCount);
//             setPage(pageNum);
//             setAppliedFilters(filterParams);

//             await fetchAllLocationNames(data);
//             setError('');
//         } catch (err) {
//             console.error('Fetch History Error:', err);
//             setError('Failed to load history. Please try again.');
//             toast.error('Failed to load history');
//         } finally {
//             if (append) {
//                 setLoadingMore(false);
//             } else {
//                 setLoading(false);
//             }
//         }
//     };

//     // ================= INFINITE SCROLL OBSERVER =================
//     const lastElementRef = useCallback((node) => {
//         if (loadingMore) return;
//         if (observerRef.current) observerRef.current.disconnect();

//         observerRef.current = new IntersectionObserver(entries => {
//             if (entries[0].isIntersecting && hasMore) {
//                 fetchHistory(page + 1, true, appliedFilters);
//             }
//         });

//         if (node) observerRef.current.observe(node);
//     }, [loadingMore, hasMore, page, appliedFilters]);

//     // ================= DELETE REQUEST =================
//     const handleDelete = async (id) => {
//         if (!window.confirm('Are you sure you want to delete this record?')) return;

//         setProcessingId(id);
//         try {
//             await api.delete(`/attendance/${id}`);
//             setHistory(prev => prev.filter(item => item._id !== id));
//             setTotal(prev => prev - 1);
//             toast.success('Record deleted successfully!');
//         } catch (err) {
//             console.error('Delete Error:', err);
//             toast.error('Failed to delete record');
//         } finally {
//             setProcessingId(null);
//         }
//     };

//     // ================= EDIT STATUS =================
//     const handleEditStatus = async () => {
//         if (!editStatusData.status) {
//             toast.error('Please select a status');
//             return;
//         }

//         setProcessingId(selectedRequest._id);
//         try {
//             await api.put(`/attendance/${selectedRequest._id}/action`, {
//                 status: editStatusData.status,
//                 adminRemarks: editStatusData.adminRemarks || `Status changed to ${editStatusData.status}`
//             });

//             // Update local state
//             setHistory(prev => prev.map(item =>
//                 item._id === selectedRequest._id
//                     ? { ...item, status: editStatusData.status, adminRemarks: editStatusData.adminRemarks }
//                     : item
//             ));

//             // Update selected request in modal
//             setSelectedRequest(prev => ({
//                 ...prev,
//                 status: editStatusData.status,
//                 adminRemarks: editStatusData.adminRemarks
//             }));

//             toast.success(`Status updated to ${editStatusData.status} successfully!`);
//             setShowEditStatusModal(false);
//             setEditStatusData({ status: '', adminRemarks: '' });
//         } catch (err) {
//             console.error('Edit Status Error:', err);
//             toast.error('Failed to update status');
//         } finally {
//             setProcessingId(null);
//         }
//     };

//     // ================= OPEN EDIT STATUS MODAL =================
//     const openEditStatusModal = () => {
//         setEditStatusData({
//             status: selectedRequest.status === 'Approved' ? 'Rejected' : 'Approved',
//             adminRemarks: selectedRequest.adminRemarks || '',
//         });
//         setShowEditStatusModal(true);
//     };

//     // ================= OPEN DETAIL MODAL =================
//     const openDetailModal = (request) => {
//         setSelectedRequest(request);
//         setIsDetailModalOpen(true);
//     };

//     // ================= APPLY FILTERS =================
//     const applyFilters = () => {
//         setIsFiltering(true);
//         fetchHistory(1, false, filters);
//         setIsFiltering(false);
//         setShowFilters(false);
//     };

//     // ================= RESET FILTERS =================
//     const resetFilters = () => {
//         const emptyFilters = {
//             status: 'all',
//             type: 'all',
//             startDate: '',
//             endDate: '',
//             search: '',
//         };
//         setFilters(emptyFilters);
//         setAppliedFilters({});
//         fetchHistory(1, false, emptyFilters);
//     };

//     // ================= INITIAL FETCH =================
//     useEffect(() => {
//         fetchHistory(1, false);
//     }, []);

//     // ================= HELPER FUNCTIONS =================
//     const getStatusBadgeClass = (status) => {
//         switch (status?.toLowerCase()) {
//             case 'approved':
//                 return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
//             case 'rejected':
//                 return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
//             default:
//                 return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
//         }
//     };

//     const getStatusIcon = (status) => {
//         switch (status?.toLowerCase()) {
//             case 'approved':
//                 return <CheckCircle className="w-4 h-4" />;
//             case 'rejected':
//                 return <XCircle className="w-4 h-4" />;
//             default:
//                 return <Clock className="w-4 h-4" />;
//         }
//     };

//     const getStatusColor = (status) => {
//         switch (status?.toLowerCase()) {
//             case 'approved':
//                 return 'text-emerald-400';
//             case 'rejected':
//                 return 'text-rose-400';
//             default:
//                 return 'text-amber-400';
//         }
//     };

//     const formatDate = (date) => {
//         if (!date) return 'N/A';
//         return new Date(date).toLocaleDateString('en-US', {
//             year: 'numeric',
//             month: 'short',
//             day: 'numeric',
//         });
//     };

//     const formatDateTime = (date) => {
//         if (!date) return 'N/A';
//         return new Date(date).toLocaleString('en-US', {
//             year: 'numeric',
//             month: 'short',
//             day: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit',
//         });
//     };

//     const getTypeIcon = (type) => {
//         switch (type?.toLowerCase()) {
//             case 'present':
//                 return <UserCheck className="w-4 h-4 text-emerald-400" />;
//             case 'leave':
//                 return <CalendarIcon className="w-4 h-4 text-amber-400" />;
//             case 'half day':
//                 return <ClockIcon className="w-4 h-4 text-blue-400" />;
//             default:
//                 return <FileText className="w-4 h-4 text-neutral-400" />;
//         }
//     };

//     const isFilterApplied = () => {
//         return Object.values(filters).some(v => v !== 'all' && v !== '');
//     };

//     return (
//         <div className="min-h-screen bg-[#0a0a0a] p-6 sm:p-8 font-sans">
//             <div className="max-w-6xl mx-auto">

//                 {/* HEADER */}
//                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-5 border-b border-neutral-800">
//                     <div className="flex items-center gap-4">
//                         <button
//                             onClick={() => navigate('/admin/attendance')}
//                             className="p-2 hover:bg-neutral-800 rounded-lg transition text-neutral-400 hover:text-white border border-transparent hover:border-neutral-700"
//                         >
//                             <ArrowLeft className="w-5 h-5" />
//                         </button>
//                         <div>
//                             <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
//                                 <HistoryIcon className="w-7 h-7 text-blue-400" />
//                                 Attendance History
//                             </h1>
//                             <p className="text-sm text-neutral-400 mt-1">View and manage all historical attendance records.</p>
//                         </div>
//                     </div>
//                     <div className="text-sm text-neutral-500">
//                         Total Records: <span className="text-white font-semibold">{total}</span>
//                     </div>
//                 </div>

//                 {/* ERROR STATE */}
//                 {error && (
//                     <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-6 flex items-center gap-3">
//                         <AlertCircle className="w-5 h-5" />
//                         <p className="text-sm font-medium">{error}</p>
//                     </div>
//                 )}

//                 {/* ================= FILTERS ================= */}
//                 <div className="mb-6">
//                     <div className="flex items-center justify-between flex-wrap gap-3">
//                         <div className="flex items-center gap-2">
//                             <button
//                                 onClick={() => setShowFilters(!showFilters)}
//                                 className="inline-flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition border border-neutral-700"
//                             >
//                                 <Filter className="w-4 h-4" />
//                                 Filters
//                                 {isFilterApplied() && (
//                                     <span className="ml-1 w-2 h-2 rounded-full bg-blue-400"></span>
//                                 )}
//                             </button>
//                             {isFilterApplied() && (
//                                 <button
//                                     onClick={resetFilters}
//                                     className="text-xs text-neutral-500 hover:text-white transition flex items-center gap-1"
//                                 >
//                                     <XCircleIcon className="w-3 h-3" />
//                                     Clear Filters
//                                 </button>
//                             )}
//                             {isFilterApplied() && (
//                                 <span className="text-xs text-neutral-500">
//                                     {history.length} results
//                                 </span>
//                             )}
//                         </div>
//                         {isFiltering && (
//                             <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
//                         )}
//                     </div>

//                     {/* Filter Panel */}
//                     {showFilters && (
//                         <div className="mt-4 bg-[#121212] border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-4">

//                             {/* Row 1: Search, Status, Type - 3 Columns */}
//                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
//                                 {/* Search */}
//                                 <div className="min-w-0">
//                                     <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Search</label>
//                                     <div className="relative mt-1">
//                                         <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
//                                         <input
//                                             type="text"
//                                             value={filters.search}
//                                             onChange={(e) => setFilters({ ...filters, search: e.target.value })}
//                                             placeholder="Name or ID..."
//                                             className="w-full bg-[#0a0a0a] border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-neutral-600 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none transition-colors"
//                                         />
//                                     </div>
//                                 </div>

//                                 {/* Status Filter */}
//                                 <div className="min-w-0">
//                                     <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Status</label>
//                                     <select
//                                         value={filters.status}
//                                         onChange={(e) => setFilters({ ...filters, status: e.target.value })}
//                                         className="w-full mt-1 bg-[#0a0a0a] border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
//                                     >
//                                         <option value="all">All Status</option>
//                                         <option value="pending">⏳ Pending</option>
//                                         <option value="approved">✅ Approved</option>
//                                         <option value="rejected">❌ Rejected</option>
//                                     </select>
//                                 </div>

//                                 {/* Type Filter */}
//                                 <div className="min-w-0">
//                                     <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Type</label>
//                                     <select
//                                         value={filters.type}
//                                         onChange={(e) => setFilters({ ...filters, type: e.target.value })}
//                                         className="w-full mt-1 bg-[#0a0a0a] border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
//                                     >
//                                         <option value="all">All Types</option>
//                                         <option value="present">Present</option>
//                                         <option value="leave">Leave</option>
//                                         <option value="half day">Half Day</option>
//                                     </select>
//                                 </div>
//                             </div>

//                             {/* Row 2: Date Range - Centered */}
//                             <div className="flex justify-center pt-1">
//                                 <div className="w-full sm:w-2/3 lg:w-1/2 min-w-0">
//                                     <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider text-center block">
//                                         Date Range
//                                     </label>
//                                     <div className="flex flex-col sm:flex-row items-stretch gap-2 mt-1">
//                                         <div className="flex-1 min-w-0">
//                                             <input
//                                                 type="date"
//                                                 value={filters.startDate}
//                                                 onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
//                                                 className="w-full bg-[#0a0a0a] border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
//                                                 placeholder="From"
//                                             />
//                                         </div>
//                                         <div className="flex items-center justify-center text-neutral-500 text-xs px-1">
//                                             <span className="hidden sm:inline">to</span>
//                                             <span className="sm:hidden">→</span>
//                                         </div>
//                                         <div className="flex-1 min-w-0">
//                                             <input
//                                                 type="date"
//                                                 value={filters.endDate}
//                                                 onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
//                                                 className="w-full bg-[#0a0a0a] border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
//                                                 placeholder="To"
//                                             />
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Row 3: Buttons */}
//                             <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 border-t border-neutral-800/50">
//                                 <button
//                                     onClick={resetFilters}
//                                     className="text-xs text-neutral-500 hover:text-white transition px-4 py-2 rounded-lg hover:bg-neutral-800 order-2 sm:order-1"
//                                 >
//                                     Reset All
//                                 </button>
//                                 <button
//                                     onClick={applyFilters}
//                                     disabled={isFiltering}
//                                     className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
//                                 >
//                                     {isFiltering ? (
//                                         <Loader2 className="w-3 h-3 animate-spin" />
//                                     ) : (
//                                         <Search className="w-3 h-3" />
//                                     )}
//                                     Apply Filters
//                                 </button>
//                             </div>
//                         </div>
//                     )}
//                 </div>

//                 {/* ================= HISTORY LIST ================= */}
//                 {loading && history.length === 0 ? (
//                     <div className="space-y-4">
//                         {[1, 2, 3].map((n) => (
//                             <div key={n} className="bg-[#121212] border border-neutral-800 rounded-xl p-5 animate-pulse space-y-3">
//                                 <div className="h-4 bg-neutral-700 rounded w-1/4"></div>
//                                 <div className="h-3 bg-neutral-700 rounded w-1/2"></div>
//                                 <div className="h-8 bg-neutral-700 rounded w-24 inline-block"></div>
//                             </div>
//                         ))}
//                     </div>
//                 ) : history.length === 0 ? (
//                     <div className="text-center py-16 bg-[#121212] rounded-xl border border-dashed border-neutral-800">
//                         <HistoryIcon className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
//                         <p className="text-neutral-400 text-sm">
//                             {isFilterApplied() ? 'No records match your filters.' : 'No history records found.'}
//                         </p>
//                         {isFilterApplied() && (
//                             <button
//                                 onClick={resetFilters}
//                                 className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition"
//                             >
//                                 Clear Filters
//                             </button>
//                         )}
//                     </div>
//                 ) : (
//                     <div className="grid gap-4">
//                         {history.map((req, index) => {
//                             const isLast = index === history.length - 1;
//                             return (
//                                 <div
//                                     key={req._id}
//                                     ref={isLast ? lastElementRef : null}
//                                     className="bg-[#121212] border border-neutral-800 p-5 rounded-xl shadow-sm hover:border-neutral-700 transition-all cursor-pointer group"
//                                     onClick={() => openDetailModal(req)}
//                                 >
//                                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                                         <div className="space-y-2 flex-1">
//                                             <div className="flex items-center gap-3 flex-wrap">
//                                                 <h3 className="font-semibold text-white">{req.name}</h3>
//                                                 <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusBadgeClass(req.status)}`}>
//                                                     {getStatusIcon(req.status)}
//                                                     {req.status}
//                                                 </span>
//                                                 {(req.latitude && req.longitude) && (
//                                                     <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
//                                                         <MapPin className="w-3 h-3" />
//                                                         {loadingLocation ? 'Loading...' : getLocationDisplay(req.latitude, req.longitude)}
//                                                     </span>
//                                                 )}
//                                             </div>

//                                             <p className="text-sm text-neutral-400 line-clamp-2">
//                                                 {req.reason || "No reason provided."}
//                                             </p>

//                                             <div className="flex items-center gap-4 text-xs text-neutral-500 flex-wrap">
//                                                 <span className="flex items-center gap-1">
//                                                     <Calendar className="w-3 h-3" />
//                                                     {formatDate(req.date)}
//                                                 </span>
//                                                 <span className="flex items-center gap-1">
//                                                     <User className="w-3 h-3" />
//                                                     ID: {req.employeeId?.slice(-6) || 'N/A'}
//                                                 </span>
//                                                 <span className="flex items-center gap-1">
//                                                     {getTypeIcon(req.type)}
//                                                     {req.type}
//                                                 </span>
//                                                 <span className="flex items-center gap-1">
//                                                     <ClockIcon className="w-3 h-3" />
//                                                     {formatDateTime(req.createdAt)}
//                                                 </span>
//                                             </div>
//                                         </div>

//                                         <div className="flex items-center gap-2 shrink-0">
//                                             <button
//                                                 onClick={(e) => {
//                                                     e.stopPropagation();
//                                                     openDetailModal(req);
//                                                 }}
//                                                 className="p-2 text-neutral-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
//                                             >
//                                                 <Eye className="w-4 h-4" />
//                                             </button>
//                                             <button
//                                                 onClick={(e) => {
//                                                     e.stopPropagation();
//                                                     handleDelete(req._id);
//                                                 }}
//                                                 disabled={processingId === req._id}
//                                                 className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
//                                             >
//                                                 {processingId === req._id ? (
//                                                     <Loader2 className="w-4 h-4 animate-spin" />
//                                                 ) : (
//                                                     <Trash2 className="w-4 h-4" />
//                                                 )}
//                                             </button>
//                                         </div>
//                                     </div>

//                                     <div className="mt-2 text-[10px] text-neutral-500 flex items-center gap-1">
//                                         <span>Click card to view full details</span>
//                                         <ChevronRight className="w-3 h-3" />
//                                     </div>
//                                 </div>
//                             );
//                         })}
//                     </div>
//                 )}

//                 {/* Loading More Indicator */}
//                 {loadingMore && (
//                     <div className="flex items-center justify-center py-6">
//                         <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
//                         <span className="ml-2 text-sm text-neutral-500">Loading more records...</span>
//                     </div>
//                 )}

//                 {/* No More Data Indicator */}
//                 {!hasMore && history.length > 0 && !loading && (
//                     <div className="text-center py-6">
//                         <p className="text-sm text-neutral-500">No more records to load</p>
//                     </div>
//                 )}

//                 {/* ================= EDIT STATUS MODAL ================= */}
//                 {showEditStatusModal && selectedRequest && (
//                     <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
//                         <div className="absolute inset-0" onClick={() => setShowEditStatusModal(false)} />

//                         <div className="bg-[#121212] w-full max-w-md border border-neutral-800 rounded-xl overflow-hidden relative z-10 shadow-2xl shadow-black/50">
//                             <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-[#0a0a0a]">
//                                 <h4 className="text-lg font-semibold text-white flex items-center gap-2">
//                                     <RefreshCw className="w-5 h-5 text-blue-400" />
//                                     Edit Status
//                                 </h4>
//                                 <button
//                                     onClick={() => setShowEditStatusModal(false)}
//                                     className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
//                                 >
//                                     <X className="w-5 h-5" />
//                                 </button>
//                             </div>

//                             <div className="p-6 space-y-4">
//                                 <p className="text-sm text-neutral-400">
//                                     Change the status and add remarks for this request:
//                                 </p>

//                                 <div className="space-y-2">
//                                     <label className="text-xs font-semibold text-neutral-400">New Status</label>
//                                     <div className="grid grid-cols-3 gap-2">
//                                         {['Pending', 'Approved', 'Rejected'].map((statusOption) => (
//                                             <button
//                                                 key={statusOption}
//                                                 onClick={() => setEditStatusData({ ...editStatusData, status: statusOption })}
//                                                 className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${editStatusData.status === statusOption
//                                                     ? statusOption === 'Approved'
//                                                         ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
//                                                         : statusOption === 'Rejected'
//                                                             ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
//                                                             : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
//                                                     : 'bg-[#0a0a0a] border-neutral-800 text-neutral-400 hover:border-neutral-600'
//                                                     }`}
//                                             >
//                                                 {statusOption === 'Approved' && <CheckCircle className="w-4 h-4" />}
//                                                 {statusOption === 'Rejected' && <XCircle className="w-4 h-4" />}
//                                                 {statusOption === 'Pending' && <Clock className="w-4 h-4" />}
//                                                 {statusOption}
//                                             </button>
//                                         ))}
//                                     </div>
//                                 </div>

//                                 <div className="space-y-2">
//                                     <label className="text-xs font-semibold text-neutral-400">Admin Remarks / Reason</label>
//                                     <textarea
//                                         value={editStatusData.adminRemarks}
//                                         onChange={(e) => setEditStatusData({ ...editStatusData, adminRemarks: e.target.value })}
//                                         placeholder="Enter remarks or reason for status change..."
//                                         rows="3"
//                                         className="w-full bg-[#0a0a0a] border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-neutral-600 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors resize-none"
//                                     />
//                                 </div>

//                                 <div className="flex gap-3 mt-4">
//                                     <button
//                                         onClick={() => setShowEditStatusModal(false)}
//                                         className="flex-1 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-sm font-medium transition border border-neutral-700"
//                                     >
//                                         Cancel
//                                     </button>
//                                     <button
//                                         onClick={handleEditStatus}
//                                         disabled={!editStatusData.status || processingId === selectedRequest._id}
//                                         className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//                                     >
//                                         {processingId === selectedRequest._id ? (
//                                             <Loader2 className="w-4 h-4 animate-spin" />
//                                         ) : (
//                                             <Save className="w-4 h-4" />
//                                         )}
//                                         Update Status
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {/* ================= DETAIL MODAL ================= */}
//                 {isDetailModalOpen && selectedRequest && (
//                     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
//                         <div
//                             className="absolute inset-0"
//                             onClick={() => {
//                                 setIsDetailModalOpen(false);
//                                 setSelectedRequest(null);
//                             }}
//                         />

//                         <div className="bg-[#121212] w-full max-w-2xl max-h-[90vh] flex flex-col border border-neutral-800 rounded-xl overflow-hidden relative z-10 shadow-2xl shadow-black/50 animate-in fade-in zoom-in duration-200">

//                             {/* Modal Header */}
//                             <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-[#0a0a0a]">
//                                 <div className="flex items-center gap-3">
//                                     <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
//                                         <User className="w-5 h-5 text-blue-400" />
//                                     </div>
//                                     <div>
//                                         <h4 className="text-lg font-semibold text-white">
//                                             Attendance Request Details
//                                         </h4>
//                                         <p className="text-xs text-neutral-500">
//                                             Request ID: {selectedRequest._id?.slice(-8) || 'N/A'}
//                                         </p>
//                                     </div>
//                                 </div>
//                                 <div className="flex items-center gap-2">
//                                     <button
//                                         onClick={openEditStatusModal}
//                                         className="p-2 text-neutral-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
//                                         title="Edit Status"
//                                     >
//                                         <Edit2 className="w-4 h-4" />
//                                     </button>
//                                     <button
//                                         onClick={() => {
//                                             setIsDetailModalOpen(false);
//                                             setSelectedRequest(null);
//                                         }}
//                                         className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
//                                     >
//                                         <X className="w-5 h-5" />
//                                     </button>
//                                 </div>
//                             </div>

//                             {/* Modal Body */}
//                             <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">

//                                 {/* Status & Type Badges */}
//                                 <div className="flex items-center gap-3 flex-wrap">
//                                     <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusBadgeClass(selectedRequest.status)}`}>
//                                         {getStatusIcon(selectedRequest.status)}
//                                         {selectedRequest.status}
//                                     </span>
//                                     <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-neutral-800 border border-neutral-700 text-neutral-300">
//                                         {getTypeIcon(selectedRequest.type)}
//                                         {selectedRequest.type}
//                                     </span>
//                                     {(selectedRequest.latitude && selectedRequest.longitude) && (
//                                         <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
//                                             <MapPin className="w-4 h-4" />
//                                             Location Captured
//                                         </span>
//                                     )}
//                                 </div>

//                                 {/* Employee Info */}
//                                 <div className="bg-[#0a0a0a] border border-neutral-800 rounded-lg p-4 space-y-3">
//                                     <h5 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
//                                         <User className="w-3 h-3" />
//                                         Employee Information
//                                     </h5>
//                                     <div className="grid grid-cols-2 gap-3">
//                                         <div>
//                                             <p className="text-[10px] text-neutral-500">Full Name</p>
//                                             <p className="text-sm text-white font-medium">{selectedRequest.name}</p>
//                                         </div>
//                                         <div>
//                                             <p className="text-[10px] text-neutral-500">Employee ID</p>
//                                             <p className="text-sm text-white font-medium">{selectedRequest.employeeId || 'N/A'}</p>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Request Details */}
//                                 <div className="bg-[#0a0a0a] border border-neutral-800 rounded-lg p-4 space-y-3">
//                                     <h5 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
//                                         <FileText className="w-3 h-3" />
//                                         Request Details
//                                     </h5>
//                                     <div className="space-y-2">
//                                         <div className="flex justify-between">
//                                             <span className="text-xs text-neutral-500">Date</span>
//                                             <span className="text-sm text-white">{formatDate(selectedRequest.date)}</span>
//                                         </div>
//                                         <div className="flex justify-between">
//                                             <span className="text-xs text-neutral-500">Type</span>
//                                             <span className="text-sm text-white">{selectedRequest.type}</span>
//                                         </div>
//                                         <div className="flex justify-between">
//                                             <span className="text-xs text-neutral-500">Status</span>
//                                             <span className={`text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
//                                                 {selectedRequest.status}
//                                             </span>
//                                         </div>
//                                         <div className="pt-2 border-t border-neutral-800">
//                                             <p className="text-xs text-neutral-500 mb-1">Reason</p>
//                                             <p className="text-sm text-white bg-[#121212] p-3 rounded-lg">
//                                                 {selectedRequest.reason || 'No reason provided'}
//                                             </p>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Location Details */}
//                                 <div className="bg-[#0a0a0a] border border-neutral-800 rounded-lg p-4 space-y-3">
//                                     <h5 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
//                                         <MapPin className="w-3 h-3" />
//                                         Location Information
//                                     </h5>

//                                     {(selectedRequest.latitude && selectedRequest.longitude) ? (
//                                         <div className="space-y-2">
//                                             <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
//                                                 <MapPin className="w-4 h-4" />
//                                                 <div>
//                                                     <p className="text-sm font-medium">
//                                                         {loadingLocation ? (
//                                                             <span className="flex items-center gap-2">
//                                                                 <Loader2 className="w-3 h-3 animate-spin" />
//                                                                 Loading location...
//                                                             </span>
//                                                         ) : (
//                                                             getLocationDisplay(selectedRequest.latitude, selectedRequest.longitude)
//                                                         )}
//                                                     </p>
//                                                     <p className="text-[10px] text-neutral-400 mt-0.5">
//                                                         {parseFloat(selectedRequest.latitude).toFixed(6)}, {parseFloat(selectedRequest.longitude).toFixed(6)}
//                                                     </p>
//                                                 </div>
//                                             </div>

//                                             <a
//                                                 href={`https://www.google.com/maps?q=${selectedRequest.latitude},${selectedRequest.longitude}`}
//                                                 target="_blank"
//                                                 rel="noopener noreferrer"
//                                                 className="inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
//                                             >
//                                                 <Globe className="w-3 h-3" />
//                                                 View on Google Maps
//                                             </a>
//                                         </div>
//                                     ) : (
//                                         <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
//                                             <AlertCircle className="w-4 h-4" />
//                                             <div>
//                                                 <p className="text-sm font-medium">No Location Data</p>
//                                                 <p className="text-xs text-neutral-400 mt-0.5">
//                                                     This request was submitted without location capture
//                                                 </p>
//                                             </div>
//                                         </div>
//                                     )}
//                                 </div>

//                                 {/* Timestamps */}
//                                 <div className="bg-[#0a0a0a] border border-neutral-800 rounded-lg p-4 space-y-2">
//                                     <h5 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
//                                         <ClockIcon className="w-3 h-3" />
//                                         Timestamps
//                                     </h5>
//                                     <div className="grid grid-cols-2 gap-2 text-xs">
//                                         <div>
//                                             <span className="text-neutral-500">Created At</span>
//                                             <p className="text-white">{formatDateTime(selectedRequest.createdAt)}</p>
//                                         </div>
//                                         <div>
//                                             <span className="text-neutral-500">Updated At</span>
//                                             <p className="text-white">{formatDateTime(selectedRequest.updatedAt)}</p>
//                                         </div>
//                                         {selectedRequest.processedAt && (
//                                             <div className="col-span-2">
//                                                 <span className="text-neutral-500">Processed At</span>
//                                                 <p className="text-white">{formatDateTime(selectedRequest.processedAt)}</p>
//                                             </div>
//                                         )}
//                                     </div>
//                                 </div>

//                                 {/* Admin Remarks */}
//                                 {selectedRequest.adminRemarks && (
//                                     <div className={`rounded-lg p-4 ${selectedRequest.status === "Rejected"
//                                         ? 'bg-rose-500/5 border border-rose-500/20'
//                                         : 'bg-amber-500/5 border border-amber-500/20'
//                                         }`}>
//                                         <h5 className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${selectedRequest.status === "Rejected" ? 'text-rose-400' : 'text-amber-400'
//                                             }`}>
//                                             <MessageSquare className="w-3 h-3" />
//                                             {selectedRequest.status === "Rejected" ? 'Rejection Reason' : 'Admin Remarks'}
//                                         </h5>
//                                         <p className="text-sm text-white mt-1">{selectedRequest.adminRemarks}</p>
//                                     </div>
//                                 )}
//                             </div>

//                             {/* Modal Footer */}
//                             <div className="flex items-center justify-end gap-3 border-t border-neutral-800 px-6 py-4 bg-[#0a0a0a]">
//                                 <button
//                                     onClick={openEditStatusModal}
//                                     className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-500/20"
//                                 >
//                                     <RefreshCw className="w-4 h-4" />
//                                     Edit Status
//                                 </button>
//                                 <button
//                                     onClick={() => {
//                                         setIsDetailModalOpen(false);
//                                         setSelectedRequest(null);
//                                     }}
//                                     className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-sm font-medium transition border border-neutral-700"
//                                 >
//                                     Close
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//             </div>

//             {/* Custom Scrollbar Styles */}
//             <style jsx>{`
//         .custom-scrollbar::-webkit-scrollbar {
//           width: 6px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-track {
//           background: transparent;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: #2a2a2a;
//           border-radius: 8px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//           background: #3a3a3a;
//         }

//         @keyframes fadeIn {
//           from { opacity: 0; transform: scale(0.95); }
//           to { opacity: 1; transform: scale(1); }
//         }
//         .animate-in {
//           animation: fadeIn 0.2s ease-out;
//         }
//       `}</style>
//         </div>
//     );
// }

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../service/api.js';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  History as HistoryIcon,
  Trash2,
  ChevronRight,
  Calendar,
  User,
  MapPin,
  AlertCircle,
  Eye,
  X,
  UserCheck,
  Globe,
  FileText,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  Filter,
  Search,
  XCircle as XCircleIcon,
  ArrowLeft,
  RefreshCw,
  Save,
  MessageSquare,
  Edit2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCachedLocationName } from '../utility/geocode.js';

export default function AttendanceHistory() {
  const navigate = useNavigate();

  // ================= STATE =================
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef(null);

  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isFiltering, setIsFiltering] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [showEditStatusModal, setShowEditStatusModal] = useState(false);
  const [editStatusData, setEditStatusData] = useState({
    status: '',
    adminRemarks: '',
  });

  const [locationNames, setLocationNames] = useState({});
  const [loadingLocation, setLoadingLocation] = useState(false);

  // ================= FETCH LOCATION NAME =================
  const fetchLocationName = async (latitude, longitude) => {
    if (!latitude || !longitude) return null;

    const cacheKey = `${latitude},${longitude}`;
    if (locationNames[cacheKey]) return locationNames[cacheKey];

    try {
      const response = await api.get(
        `/geocode/reverse?lat=${latitude}&lon=${longitude}`
      );

      if (response.data.success) {
        const locationName = response.data.locationName;
        setLocationNames((prev) => ({
          ...prev,
          [cacheKey]: locationName,
        }));
        return locationName;
      }
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch (error) {
      console.error('Location fetch error:', error);
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  };

  const fetchAllLocationNames = async (data) => {
    if (!data || data.length === 0) return;

    setLoadingLocation(true);

    for (const req of data) {
      if (req.latitude && req.longitude) {
        await fetchLocationName(req.latitude, req.longitude);
      }
    }

    setLoadingLocation(false);
  };

  const getLocationDisplay = (latitude, longitude) => {
    if (!latitude || !longitude) return null;

    const cacheKey = `${latitude},${longitude}`;
    const cached = locationNames[cacheKey];

    if (cached) {
      return cached;
    }

    return `${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}`;
  };

  const fetchHistory = async (
    pageNum = 1,
    append = false,
    filterParams = {}
  ) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams();
      params.append('page', pageNum);
      params.append('limit', 15);

      if (filterParams.status && filterParams.status !== 'all')
        params.append('status', filterParams.status);
      if (filterParams.type && filterParams.type !== 'all')
        params.append('type', filterParams.type);
      if (filterParams.startDate)
        params.append('startDate', filterParams.startDate);
      if (filterParams.endDate) params.append('endDate', filterParams.endDate);
      if (filterParams.search) params.append('search', filterParams.search);

      const url = `/attendance/all?${params.toString()}`;
      const res = await api.get(url);

      const data = res?.data?.data || res?.data || [];
      const totalCount = res?.data?.total || data.length;

      if (append) {
        setHistory((prev) => [...prev, ...data]);
      } else {
        setHistory(data);
      }

      setTotal(totalCount);
      setHasMore(pageNum * 15 < totalCount);
      setPage(pageNum);
      setAppliedFilters(filterParams);

      await fetchAllLocationNames(data);
      setError('');
    } catch (err) {
      console.error('Fetch History Error:', err);
      setError('Failed to load history. Please try again.');
      toast.error('Failed to load history');
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const lastElementRef = useCallback(
    (node) => {
      if (loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchHistory(page + 1, true, appliedFilters);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loadingMore, hasMore, page, appliedFilters]
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    setProcessingId(id);
    try {
      await api.delete(`/attendance/${id}`);
      setHistory((prev) => prev.filter((item) => item._id !== id));
      setTotal((prev) => prev - 1);
      toast.success('Record deleted successfully!');
    } catch (err) {
      console.error('Delete Error:', err);
      toast.error('Failed to delete record');
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditStatus = async () => {
    if (!editStatusData.status) {
      toast.error('Please select a status');
      return;
    }

    setProcessingId(selectedRequest._id);
    try {
      await api.put(`/attendance/${selectedRequest._id}/action`, {
        status: editStatusData.status,
        adminRemarks:
          editStatusData.adminRemarks ||
          `Status changed to ${editStatusData.status}`,
      });

      setHistory((prev) =>
        prev.map((item) =>
          item._id === selectedRequest._id
            ? {
                ...item,
                status: editStatusData.status,
                adminRemarks: editStatusData.adminRemarks,
              }
            : item
        )
      );

      setSelectedRequest((prev) => ({
        ...prev,
        status: editStatusData.status,
        adminRemarks: editStatusData.adminRemarks,
      }));

      toast.success(`Status updated to ${editStatusData.status} successfully!`);
      setShowEditStatusModal(false);
      setEditStatusData({ status: '', adminRemarks: '' });
    } catch (err) {
      console.error('Edit Status Error:', err);
      toast.error('Failed to update status');
    } finally {
      setProcessingId(null);
    }
  };

  const openEditStatusModal = () => {
    setEditStatusData({
      status: selectedRequest.status === 'Approved' ? 'Rejected' : 'Approved',
      adminRemarks: selectedRequest.adminRemarks || '',
    });
    setShowEditStatusModal(true);
  };

  const openDetailModal = (request) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  const applyFilters = () => {
    setIsFiltering(true);
    fetchHistory(1, false, filters);
    setIsFiltering(false);
    setShowFilters(false);
  };

  const resetFilters = () => {
    const emptyFilters = {
      status: 'all',
      type: 'all',
      startDate: '',
      endDate: '',
      search: '',
    };
    setFilters(emptyFilters);
    setAppliedFilters({});
    fetchHistory(1, false, emptyFilters);
  };

  useEffect(() => {
    fetchHistory(1, false);
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20';
      case 'rejected':
        return 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20';
      case 'absent':
        return 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20';
      default:
        return 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'absent':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'text-[var(--success)]';
      case 'rejected':
        return 'text-[var(--danger)]';
      case 'absent':
        return 'text-[var(--danger)]';
      default:
        return 'text-[var(--warning)]';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'present':
        return <UserCheck className="w-4 h-4 text-[var(--success)]" />;
      case 'leave':
        return <CalendarIcon className="w-4 h-4 text-[var(--warning)]" />;
      case 'half day':
        return <ClockIcon className="w-4 h-4 text-[var(--accent-primary)]" />;
      default:
        return <FileText className="w-4 h-4 text-[var(--text-muted)]" />;
    }
  };

  const isFilterApplied = () => {
    return Object.values(filters).some((v) => v !== 'all' && v !== '');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/attendance')}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-color)]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
                <HistoryIcon className="w-7 h-7 text-[var(--accent-primary)]" />
                Attendance History
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                View and manage all historical attendance records.
              </p>
            </div>
          </div>
          <div className="text-sm text-[var(--text-muted)]">
            Total Records:{' '}
            <span className="text-[var(--text-primary)] font-semibold">
              {total}
            </span>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] p-4 rounded-xl mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* ================= FILTERS ================= */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="ui-btn inline-flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {isFilterApplied() && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-[var(--accent-primary)]"></span>
                )}
              </button>
              {isFilterApplied() && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition flex items-center gap-1"
                >
                  <XCircleIcon className="w-3 h-3" />
                  Clear Filters
                </button>
              )}
              {isFilterApplied() && (
                <span className="text-xs text-[var(--text-muted)]">
                  {history.length} results
                </span>
              )}
            </div>
            {isFiltering && (
              <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />
            )}
          </div>

          {showFilters && (
            <div className="mt-4 ui-card p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="min-w-0">
                  <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Search
                  </label>
                  <div className="relative mt-1">
                    <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) =>
                        setFilters({ ...filters, search: e.target.value })
                      }
                      placeholder="Name or ID..."
                      className="ui-input w-full pl-9 pr-3 text-sm"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="ui-input w-full text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="Pending">⏳ Pending</option>
                    <option value="Approved">✅ Approved</option>
                    <option value="Rejected">❌ Rejected</option>
                    <option value="Absent">🚫 Absent</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>
                </div>

                <div className="min-w-0">
                  <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) =>
                      setFilters({ ...filters, type: e.target.value })
                    }
                    className="ui-input w-full text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="present">Present</option>
                    <option value="leave">Leave</option>
                    <option value="half day">Half Day</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-center pt-1">
                <div className="w-full sm:w-2/3 lg:w-1/2 min-w-0">
                  <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-center block">
                    Date Range
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch gap-2 mt-1">
                    <div className="flex-1 min-w-0">
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) =>
                          setFilters({ ...filters, startDate: e.target.value })
                        }
                        className="ui-input w-full text-sm"
                        placeholder="From"
                      />
                    </div>
                    <div className="flex items-center justify-center text-[var(--text-muted)] text-xs px-1">
                      <span className="hidden sm:inline">to</span>
                      <span className="sm:hidden">→</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) =>
                          setFilters({ ...filters, endDate: e.target.value })
                        }
                        className="ui-input w-full text-sm"
                        placeholder="To"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 border-t border-[var(--border-color)]/50">
                <button
                  onClick={resetFilters}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition px-4 py-2 rounded-lg hover:bg-[var(--bg-hover)] order-2 sm:order-1"
                >
                  Reset All
                </button>
                <button
                  onClick={applyFilters}
                  disabled={isFiltering}
                  className="ui-btn ui-btn-primary text-xs order-1 sm:order-2 flex items-center justify-center gap-2"
                >
                  {isFiltering ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Search className="w-3 h-3" />
                  )}
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================= HISTORY LIST ================= */}
        {loading && history.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="ui-card p-5 animate-pulse space-y-3">
                <div className="h-4 bg-[var(--bg-hover)] rounded w-1/4"></div>
                <div className="h-3 bg-[var(--bg-hover)] rounded w-1/2"></div>
                <div className="h-8 bg-[var(--bg-hover)] rounded w-24 inline-block"></div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 ui-card border-dashed">
            <HistoryIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-secondary)] text-sm">
              {isFilterApplied()
                ? 'No records match your filters.'
                : 'No history records found.'}
            </p>
            {isFilterApplied() && (
              <button
                onClick={resetFilters}
                className="mt-2 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-hover)] transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {history.map((req, index) => {
              const isLast = index === history.length - 1;
              return (
                <div
                  key={req._id}
                  ref={isLast ? lastElementRef : null}
                  className="ui-card p-5 hover:border-[var(--border-hover)] transition-all cursor-pointer group"
                  onClick={() => openDetailModal(req)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-[var(--text-primary)]">
                          {req.name}
                        </h3>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusBadgeClass(req.status)}`}
                        >
                          {getStatusIcon(req.status)}
                          {req.status}
                        </span>
                        {req.latitude && req.longitude && (
                          <span className="text-[10px] text-[var(--success)] bg-[var(--success)]/10 px-2 py-0.5 rounded-full border border-[var(--success)]/20 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {loadingLocation
                              ? 'Loading...'
                              : getLocationDisplay(req.latitude, req.longitude)}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                        {req.reason || 'No reason provided.'}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] flex-wrap">
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
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {formatDateTime(req.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetailModal(req);
                        }}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(req._id);
                        }}
                        disabled={processingId === req._id}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {processingId === req._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                    <span>Click card to view full details</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {loadingMore && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
            <span className="ml-2 text-sm text-[var(--text-muted)]">
              Loading more records...
            </span>
          </div>
        )}

        {!hasMore && history.length > 0 && !loading && (
          <div className="text-center py-6">
            <p className="text-sm text-[var(--text-muted)]">
              No more records to load
            </p>
          </div>
        )}

        {/* ================= EDIT STATUS MODAL ================= */}
        {showEditStatusModal && selectedRequest && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div
              className="absolute inset-0"
              onClick={() => setShowEditStatusModal(false)}
            />

            <div className="ui-card w-full max-w-md relative z-10 shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4 bg-[var(--bg-secondary)]">
                <h4 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-[var(--accent-primary)]" />
                  Edit Status
                </h4>
                <button
                  onClick={() => setShowEditStatusModal(false)}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Change the status and add remarks for this request:
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">
                    New Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Pending', 'Approved', 'Rejected'].map((statusOption) => (
                      <button
                        key={statusOption}
                        onClick={() =>
                          setEditStatusData({
                            ...editStatusData,
                            status: statusOption,
                          })
                        }
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                          editStatusData.status === statusOption
                            ? statusOption === 'Approved'
                              ? 'bg-[var(--success)]/20 border-[var(--success)]/40 text-[var(--success)]'
                              : statusOption === 'Rejected'
                                ? 'bg-[var(--danger)]/20 border-[var(--danger)]/40 text-[var(--danger)]'
                                : 'bg-[var(--warning)]/20 border-[var(--warning)]/40 text-[var(--warning)]'
                            : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                        }`}
                      >
                        {statusOption === 'Approved' && (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {statusOption === 'Rejected' && (
                          <XCircle className="w-4 h-4" />
                        )}
                        {statusOption === 'Pending' && (
                          <Clock className="w-4 h-4" />
                        )}
                        {statusOption}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">
                    Admin Remarks / Reason
                  </label>
                  <textarea
                    value={editStatusData.adminRemarks}
                    onChange={(e) =>
                      setEditStatusData({
                        ...editStatusData,
                        adminRemarks: e.target.value,
                      })
                    }
                    placeholder="Enter remarks or reason for status change..."
                    rows="3"
                    className="ui-input w-full text-sm resize-none"
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowEditStatusModal(false)}
                    className="ui-btn flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditStatus}
                    disabled={
                      !editStatusData.status ||
                      processingId === selectedRequest._id
                    }
                    className="ui-btn ui-btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {processingId === selectedRequest._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= DETAIL MODAL ================= */}
        {isDetailModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div
              className="absolute inset-0"
              onClick={() => {
                setIsDetailModalOpen(false);
                setSelectedRequest(null);
              }}
            />

            <div className="ui-card w-full max-w-2xl max-h-[90vh] flex flex-col relative z-10 shadow-2xl shadow-black/50 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4 bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20">
                    <User className="w-5 h-5 text-[var(--accent-primary)]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-[var(--text-primary)]">
                      Attendance Request Details
                    </h4>
                    <p className="text-xs text-[var(--text-muted)]">
                      Request ID: {selectedRequest._id?.slice(-8) || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={openEditStatusModal}
                    className="p-2 text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition"
                    title="Edit Status"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      setSelectedRequest(null);
                    }}
                    className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusBadgeClass(selectedRequest.status)}`}
                  >
                    {getStatusIcon(selectedRequest.status)}
                    {selectedRequest.status}
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                    {getTypeIcon(selectedRequest.type)}
                    {selectedRequest.type}
                  </span>
                  {selectedRequest.latitude && selectedRequest.longitude && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)]">
                      <MapPin className="w-4 h-4" />
                      Location Captured
                    </span>
                  )}
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 space-y-3">
                  <h5 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Employee Information
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Full Name
                      </p>
                      <p className="text-sm text-[var(--text-primary)] font-medium">
                        {selectedRequest.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 space-y-3">
                  <h5 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    Request Details
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-[var(--text-muted)]">
                        Date
                      </span>
                      <span className="text-sm text-[var(--text-primary)]">
                        {formatDate(selectedRequest.date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[var(--text-muted)]">
                        Type
                      </span>
                      <span className="text-sm text-[var(--text-primary)]">
                        {selectedRequest.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[var(--text-muted)]">
                        Status
                      </span>
                      <span
                        className={`text-sm font-medium ${getStatusColor(selectedRequest.status)}`}
                      >
                        {selectedRequest.status}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-[var(--border-color)]">
                      <p className="text-xs text-[var(--text-muted)] mb-1">
                        Reason
                      </p>
                      <p className="text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] p-3 rounded-lg">
                        {selectedRequest.reason || 'No reason provided'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 space-y-3">
                  <h5 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    Location Information
                  </h5>

                  {selectedRequest.latitude && selectedRequest.longitude ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[var(--success)] bg-[var(--success)]/10 p-3 rounded-lg border border-[var(--success)]/20">
                        <MapPin className="w-4 h-4" />
                        <div>
                          <p className="text-sm font-medium">
                            {loadingLocation ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Loading location...
                              </span>
                            ) : (
                              getLocationDisplay(
                                selectedRequest.latitude,
                                selectedRequest.longitude
                              )
                            )}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            {parseFloat(selectedRequest.latitude).toFixed(6)},{' '}
                            {parseFloat(selectedRequest.longitude).toFixed(6)}
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
                    <div className="flex items-center gap-2 text-[var(--warning)] bg-[var(--warning)]/10 p-3 rounded-lg border border-[var(--warning)]/20">
                      <AlertCircle className="w-4 h-4" />
                      <div>
                        <p className="text-sm font-medium">No Location Data</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          This request was submitted without location capture
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 space-y-2">
                  <h5 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                    <ClockIcon className="w-3 h-3" />
                    Timestamps
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[var(--text-muted)]">
                        Created At
                      </span>
                      <p className="text-[var(--text-primary)]">
                        {formatDateTime(selectedRequest.createdAt)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">
                        Updated At
                      </span>
                      <p className="text-[var(--text-primary)]">
                        {formatDateTime(selectedRequest.updatedAt)}
                      </p>
                    </div>
                    {selectedRequest.processedAt && (
                      <div className="col-span-2">
                        <span className="text-[var(--text-muted)]">
                          Processed At
                        </span>
                        <p className="text-[var(--text-primary)]">
                          {formatDateTime(selectedRequest.processedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedRequest.adminRemarks && (
                  <div
                    className={`rounded-lg p-4 ${
                      selectedRequest.status === 'Rejected'
                        ? 'bg-[var(--danger)]/5 border border-[var(--danger)]/20'
                        : 'bg-[var(--warning)]/5 border border-[var(--warning)]/20'
                    }`}
                  >
                    <h5
                      className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                        selectedRequest.status === 'Rejected'
                          ? 'text-[var(--danger)]'
                          : 'text-[var(--warning)]'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3" />
                      {selectedRequest.status === 'Rejected'
                        ? 'Rejection Reason'
                        : 'Admin Remarks'}
                    </h5>
                    <p className="text-sm text-[var(--text-primary)] mt-1">
                      {selectedRequest.adminRemarks}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[var(--border-color)] px-6 py-4 bg-[var(--bg-secondary)]">
                <button
                  onClick={openEditStatusModal}
                  className="ui-btn ui-btn-primary flex items-center gap-2 shadow-lg shadow-[var(--accent-primary)]/20"
                >
                  <RefreshCw className="w-4 h-4" />
                  Edit Status
                </button>
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedRequest(null);
                  }}
                  className="ui-btn"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
