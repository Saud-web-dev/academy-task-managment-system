import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../service/api.js";
import SSIPageLoader from "../../components/SSIPageLoader";
import {
  ArrowLeft,
  Trophy,
  Medal,
  ChevronUp,
  ChevronDown,
  Filter,
  Crown,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  Loader2,
  Award,
  Clock,
  Calendar,
  AlertTriangle,
  Users,
  CheckCircle2,
  Timer
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

// ─── Reusable Components ─────────────────────────────────────────

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 1500 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count.toLocaleString()}</span>;
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color, trend, trendValue }) => {
  const isPositive = trend === "up";
  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)] hover:border-[var(--border-hover)] transition-all group relative overflow-hidden">
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
        style={{ backgroundColor: color }}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {isPositive ? '↑' : '↓'} {trendValue}%
            </div>
          )}
        </div>
        <p className="text-3xl font-bold text-[var(--text-primary)] mb-1">
          <AnimatedCounter end={value} />
        </p>
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">{label}</p>
      </div>
    </div>
  );
};

const DeadlineRanking = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEmployees: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [filters, setFilters] = useState({
    filterBy: "missed",
    sortOrder: "desc",
  });
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Derived stats for header
  const totalEmployees = pagination.totalEmployees || 0;
  const totalMissedDeadlines = employees.reduce((acc, emp) => acc + (emp.missedDeadlines || 0), 0);
  const totalDeadlines = employees.reduce((acc, emp) => acc + (emp.tasksWithDeadline || 0), 0);
  const onTimeRate = totalDeadlines > 0
    ? Math.round(((totalDeadlines - totalMissedDeadlines) / totalDeadlines) * 100)
    : 0;

  useEffect(() => {
    fetchDeadlineRankings();
  }, [pagination.currentPage, filters, limit, searchTerm]);

  const fetchDeadlineRankings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/ranking/deadline-rankings", {
        params: {
          page: pagination.currentPage,
          limit: limit,
          sortOrder: filters.sortOrder,
          search: searchTerm,
        },
      });

      if (response.data.success) {
        setEmployees(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch {
      toast.error("Failed to fetch deadline rankings");
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, filters.sortOrder, limit, searchTerm]);

  const handleSortChange = useCallback((newSortOrder) => {
    setFilters((prev) => ({
      ...prev,
      sortOrder: newSortOrder,
    }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  }, [pagination.totalPages]);

  const getRankIcon = useCallback((rank) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
          <Crown className="w-4 h-4 text-yellow-500" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-gray-400/20 flex items-center justify-center border border-gray-400/30">
          <Medal className="w-4 h-4 text-gray-400" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-700/20 flex items-center justify-center border border-amber-700/30">
          <Award className="w-4 h-4 text-amber-700" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center border border-[var(--border-color)]">
        <span className="text-xs font-bold text-[var(--text-muted)]">{rank}</span>
      </div>
    );
  }, []);

  const getRankStyle = useCallback((rank) => {
    if (rank === 1) return "border-l-4 border-l-yellow-500 bg-yellow-500/5";
    if (rank === 2) return "border-l-4 border-l-gray-400 bg-gray-400/5";
    if (rank === 3) return "border-l-4 border-l-amber-700 bg-amber-700/5";
    return "border-l-4 border-l-transparent";
  }, []);

  const getDeadlineStatusColor = useCallback((missed, total) => {
    if (missed === 0 && total > 0) return "text-emerald-600";
    if (missed <= Math.ceil(total / 2)) return "text-amber-600";
    return "text-red-600";
  }, []);

  const getStatusBadge = useCallback((missed, total) => {
    if (missed === 0 && total > 0) {
      return { label: "Perfect", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
    }
    if (missed <= 1) {
      return { label: "Missed", color: "bg-red-500/10 text-red-600 border-red-500/20" };
    }
    if (missed <= Math.ceil(total / 2)) {
      return { label: "Needs Improvement", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
    }
    return { label: "Critical", color: "bg-red-500/10 text-red-600 border-red-500/20" };
  }, []);

  const renderPaginationButtons = useMemo(() => {
    const buttons = [];
    const totalPages = pagination.totalPages;
    const currentPage = pagination.currentPage;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        buttons.push(i);
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        buttons.push('...');
      }
    }

    return buttons;
  }, [pagination.totalPages, pagination.currentPage]);

  if (loading && employees.length === 0) {
    return <SSIPageLoader message="Loading rankings..." />;
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
            iconTheme: { primary: 'var(--success)', secondary: 'var(--text-inverse)' },
          },
          error: {
            iconTheme: { primary: 'var(--danger)', secondary: 'var(--text-inverse)' },
          },
        }}
      />

      <div className="space-y-6 p-4 md:p-6 max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden">
          <div className="relative bg-gradient-to-r from-[var(--bg-secondary)] to-transparent border-b border-[var(--border-color)] px-6 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="p-2 hover:bg-[var(--bg-hover)] rounded-xl transition text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <div className="bg-red-500/15 p-3 rounded-2xl">
                    <Clock className="w-7 h-7 text-red-500" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[var(--warning)] rounded-full border-2 border-[var(--bg-card)]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)]">Deadline Rankings</h1>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">Track deadline compliance & performance</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                  <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-xs text-[var(--text-secondary)]">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </div>
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="inline-flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-[var(--accent-primary)]/20"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Total Employees"
                value={totalEmployees}
                color="var(--accent-primary)"
                trend="up"
                trendValue={0}
              />
              <StatCard
                icon={AlertTriangle}
                label="Missed Deadlines"
                value={totalMissedDeadlines}
                color="var(--danger)"
                trend="down"
                trendValue={0}
              />
              <StatCard
                icon={CheckCircle2}
                label="On Time Rate"
                value={onTimeRate}
                color="var(--success)"
                trend="up"
                trendValue={0}
              />
              <StatCard
                icon={Timer}
                label="Total Deadlines"
                value={totalDeadlines}
                color="var(--warning)"
                trend="up"
                trendValue={0}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden">
          {/* Search & Filters */}
          <div className="p-4 md:p-6 border-b border-[var(--border-color)]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-[var(--text-muted)]" />

                <button
                  onClick={() => handleSortChange("desc")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${filters.sortOrder === "desc"
                      ? "bg-[var(--accent-primary)] text-[var(--text-inverse)]"
                      : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)]"
                    }`}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  High to Low
                </button>
                <button
                  onClick={() => handleSortChange("asc")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${filters.sortOrder === "asc"
                      ? "bg-[var(--accent-primary)] text-[var(--text-inverse)]"
                      : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)]"
                    }`}
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  Low to High
                </button>

                <div className="w-px h-6 bg-[var(--border-color)] mx-1 hidden sm:block" />

                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 text-[var(--text-primary)] rounded-lg px-3 py-1.5 text-xs outline-none transition-colors"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(filters.sortOrder !== "desc" || searchTerm) && (
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Sort:</span>
                <span className="px-2.5 py-0.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] rounded-full border border-[var(--accent-primary)]/20 font-medium">
                  {filters.sortOrder === "desc" ? "High to Low ↓" : "Low to High ↑"}
                </span>
                {searchTerm && (
                  <span className="px-2.5 py-0.5 bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[10px] rounded-full border border-[var(--border-color)] font-medium">
                    "{searchTerm}"
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Employee List */}
          <div className="p-4 md:p-6">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-4 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[var(--bg-hover)] rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-[var(--bg-hover)] rounded w-1/4"></div>
                        <div className="h-3 bg-[var(--bg-hover)] rounded w-1/3"></div>
                      </div>
                      <div className="flex gap-4">
                        <div className="h-8 w-12 bg-[var(--bg-hover)] rounded"></div>
                        <div className="h-8 w-12 bg-[var(--bg-hover)] rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : employees.length === 0 ? (
              <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-hover)] flex items-center justify-center">
                  <User className="w-8 h-8 text-[var(--text-muted)]" />
                </div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">No employees found</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-2">
                {employees.map((employee) => {
                  const status = getStatusBadge(employee.missedDeadlines, employee.tasksWithDeadline);

                  return (
                    <div
                      key={employee.userId}
                      className={`bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-4 transition-all hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)]/30 ${getRankStyle(employee.rank)}`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="flex-shrink-0">
                          {getRankIcon(employee.rank)}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-hover)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-lg shadow-[var(--accent-primary)]/20">
                              {employee.user?.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm text-[var(--text-primary)] truncate">
                                {employee.user?.name || "Unknown"}
                              </h3>
                              <p className="text-xs text-[var(--text-muted)] truncate">{employee.user?.email || ""}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-1.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 flex-shrink-0">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                              <p className={`text-sm font-bold ${getDeadlineStatusColor(employee.missedDeadlines, employee.tasksWithDeadline)}`}>
                                {employee.missedDeadlines || 0}
                              </p>
                            </div>
                            <p className="text-[8px] text-[var(--text-muted)] uppercase tracking-wider">Missed</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Calendar className="w-4 h-4 text-[var(--accent-primary)]" />
                              <p className="text-sm font-bold text-[var(--text-primary)]">
                                {employee.tasksWithDeadline || 0}
                              </p>
                            </div>
                            <p className="text-[8px] text-[var(--text-muted)] uppercase tracking-wider">Deadlines</p>
                          </div>
                          {employee.tasksWithDeadline > 0 && (
                            <div className="text-center">
                              <div className="flex items-center justify-center">
                                <div className="w-12 h-12 relative">
                                  <svg className="w-12 h-12 transform -rotate-90">
                                    <circle
                                      cx="24"
                                      cy="24"
                                      r="18"
                                      fill="none"
                                      stroke="var(--border-color)"
                                      strokeWidth="4"
                                      opacity="0.3"
                                    />
                                    <circle
                                      cx="24"
                                      cy="24"
                                      r="18"
                                      fill="none"
                                      stroke={((employee.tasksWithDeadline - employee.missedDeadlines) / employee.tasksWithDeadline) * 100 >= 80 ? "var(--success)" : "var(--warning)"}
                                      strokeWidth="4"
                                      strokeLinecap="round"
                                      strokeDasharray={`${2 * Math.PI * 18}`}
                                      strokeDashoffset={`${2 * Math.PI * 18 * (1 - (employee.tasksWithDeadline - employee.missedDeadlines) / employee.tasksWithDeadline)}`}
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-[var(--text-primary)]">
                                      {Math.round(((employee.tasksWithDeadline - employee.missedDeadlines) / employee.tasksWithDeadline) * 100)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-[8px] text-[var(--text-muted)] uppercase tracking-wider">Rate</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!loading && employees.length > 0 && (
              <div className="mt-6 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] px-4 py-3">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className={`p-2 rounded-lg transition ${pagination.hasPrevPage
                          ? "hover:bg-[var(--bg-hover)] text-[var(--text-primary)]"
                          : "text-[var(--text-muted)] cursor-not-allowed opacity-40"
                        }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {renderPaginationButtons.map((page, index) => (
                      typeof page === 'number' ? (
                        <button
                          key={index}
                          onClick={() => handlePageChange(page)}
                          className={`w-8 h-8 rounded-lg text-xs font-medium transition ${pagination.currentPage === page
                              ? "bg-[var(--accent-primary)] text-[var(--text-inverse)] shadow-lg shadow-[var(--accent-primary)]/20"
                              : "hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                            }`}
                        >
                          {page}
                        </button>
                      ) : (
                        <span key={index} className="px-1 text-[var(--text-muted)] text-xs">…</span>
                      )
                    ))}

                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className={`p-2 rounded-lg transition ${pagination.hasNextPage
                          ? "hover:bg-[var(--bg-hover)] text-[var(--text-primary)]"
                          : "text-[var(--text-muted)] cursor-not-allowed opacity-40"
                        }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] text-center">
                    {Math.min((pagination.currentPage - 1) * pagination.limit + 1, pagination.totalEmployees)} - {Math.min(pagination.currentPage * pagination.limit, pagination.totalEmployees)} of {pagination.totalEmployees} employees
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DeadlineRanking;