import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../service/api.js";
import SSIPageLoader from "../components/SSIPageLoader";
import {
  ArrowLeft,
  Trophy,
  Medal,
  ChevronUp,
  ChevronDown,
  Filter,
  ArrowUpDown,
  Crown,
  Star,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  Loader2,
  Award,
  Target,
  BarChart3,
  CheckCircle2,
  Hash,
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

const RankingEmployee = () => {
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
    filterBy: "marks",
    sortOrder: "desc",
  });
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const searchTimeoutRef = useRef(null);

  // ✅ Debounce search term
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // ✅ Fetch rankings only when debounced search term changes
  useEffect(() => {
    fetchRankings();
  }, [pagination.currentPage, filters, limit, debouncedSearchTerm]);

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/ranking/rankings", {
        params: {
          page: pagination.currentPage,
          limit: limit,
          filterBy: filters.filterBy,
          sortOrder: filters.sortOrder,
          search: debouncedSearchTerm,
        },
      });

      if (response.data.success) {
        setEmployees(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch {
      toast.error("Failed to fetch rankings");
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, filters, limit, debouncedSearchTerm]);

  const handleFilterChange = useCallback((newFilterBy) => {
    setFilters((prev) => ({
      ...prev,
      filterBy: newFilterBy,
      sortOrder: "desc",
    }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

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
        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
          <Crown className="w-4 h-4 text-amber-500" />
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
      <div className="w-8 h-8 rounded-full bg-[#f5f0eb] flex items-center justify-center border border-[#e5ddd5]">
        <span className="text-xs font-bold text-[#8a7a6a]">{rank}</span>
      </div>
    );
  }, []);

  const getRankStyle = useCallback((rank) => {
    if (rank === 1) return "border-l-4 border-l-amber-500 bg-amber-50/50";
    if (rank === 2) return "border-l-4 border-l-gray-400 bg-gray-50/50";
    if (rank === 3) return "border-l-4 border-l-amber-700 bg-amber-50/30";
    return "border-l-4 border-l-transparent";
  }, []);

  const getMarksColor = useCallback((marks) => {
    if (marks >= 80) return "text-emerald-600";
    if (marks >= 60) return "text-blue-600";
    if (marks >= 40) return "text-amber-600";
    return "text-red-600";
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
            background: '#faf7f3',
            color: '#2c1810',
            border: '1px solid #e5ddd5',
          },
          success: {
            iconTheme: { primary: '#059669', secondary: '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
          },
        }}
      />
      <div className="min-h-screen bg-[#f5f0eb] p-3 sm:p-4">
        <div className="max-w-6xl mx-auto space-y-4">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e5ddd5]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/layout/desboards")}
                className="p-2 hover:bg-[#f5f0eb] rounded-lg transition text-[#8a7a6a] hover:text-[#2c1810] border border-transparent hover:border-[#e5ddd5]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-[#2c1810]">Employee Rankings</h1>
                <p className="text-sm text-[#8a7a6a]">{pagination.totalEmployees} employees ranked</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="text-xs text-[#8a7a6a] bg-[#faf7f3] px-3 py-1.5 rounded-full border border-[#e5ddd5]">
                Top Performers
              </span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-[#faf7f3] border border-[#e5ddd5] rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-[#8a7a6a] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                  }}
                  className="w-full bg-[#f5f0eb] border border-[#e5ddd5] focus:border-[#2c1810] focus:ring-1 focus:ring-[#2c1810] text-[#2c1810] placeholder-[#8a7a6a] rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-colors"
                />
                {searchTerm !== debouncedSearchTerm && loading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-[#2c1810] animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="w-4 h-4 text-[#8a7a6a]" />
                <button
                  onClick={() => handleFilterChange("marks")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    filters.filterBy === "marks"
                      ? "bg-[#2c1810] text-white"
                      : "bg-[#f5f0eb] text-[#8a7a6a] hover:text-[#2c1810] border border-[#e5ddd5]"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Marks
                  </span>
                </button>
                <button
                  onClick={() => handleFilterChange("percentage")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    filters.filterBy === "percentage"
                      ? "bg-[#2c1810] text-white"
                      : "bg-[#f5f0eb] text-[#8a7a6a] hover:text-[#2c1810] border border-[#e5ddd5]"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    % Left
                  </span>
                </button>

                <div className="w-px h-5 bg-[#e5ddd5] mx-1 hidden sm:block"></div>

                <button
                  onClick={() => handleSortChange("desc")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                    filters.sortOrder === "desc"
                      ? "bg-[#2c1810] text-white"
                      : "bg-[#f5f0eb] text-[#8a7a6a] hover:text-[#2c1810] border border-[#e5ddd5]"
                  }`}
                >
                  <ChevronDown className="w-3 h-3" />
                  High
                </button>
                <button
                  onClick={() => handleSortChange("asc")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                    filters.sortOrder === "asc"
                      ? "bg-[#2c1810] text-white"
                      : "bg-[#f5f0eb] text-[#8a7a6a] hover:text-[#2c1810] border border-[#e5ddd5]"
                  }`}
                >
                  <ChevronUp className="w-3 h-3" />
                  Low
                </button>

                <div className="w-px h-5 bg-[#e5ddd5] mx-1 hidden sm:block"></div>

                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                  className="bg-[#f5f0eb] border border-[#e5ddd5] focus:border-[#2c1810] focus:ring-1 focus:ring-[#2c1810] text-[#2c1810] rounded-lg px-3 py-1.5 text-xs outline-none transition-colors"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(filters.filterBy !== "marks" || filters.sortOrder !== "desc" || searchTerm) && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#e5ddd5]">
                <span className="text-[10px] text-[#8a7a6a] font-medium uppercase tracking-wider">Filters:</span>
                <span className="px-2.5 py-0.5 bg-[#f5f0eb] text-[#2c1810] text-[10px] rounded-full border border-[#e5ddd5]">
                  {filters.filterBy === "marks" ? "Marks" : "Avg %"} · {filters.sortOrder === "desc" ? "↓ High" : "↑ Low"}
                </span>
                {searchTerm && (
                  <span className="px-2.5 py-0.5 bg-[#f5f0eb] text-[#8a7a6a] text-[10px] rounded-full border border-[#e5ddd5]">
                    "{searchTerm}"
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setDebouncedSearchTerm("");
                    setFilters({ filterBy: "marks", sortOrder: "desc" });
                  }}
                  className="text-[10px] text-[#8a7a6a] hover:text-[#2c1810] transition ml-auto"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Employees List */}
          {loading && employees.length === 0 ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#faf7f3] rounded-xl border border-[#e5ddd5] p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#e5ddd5] rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-[#e5ddd5] rounded w-1/4"></div>
                      <div className="h-2.5 bg-[#e5ddd5] rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="bg-[#faf7f3] rounded-xl border border-[#e5ddd5] p-12 text-center">
              <User className="w-12 h-12 text-[#8a7a6a] mx-auto mb-3" />
              <p className="text-sm text-[#8a7a6a]">No employees found</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setDebouncedSearchTerm("");
                  setFilters({ filterBy: "marks", sortOrder: "desc" });
                }}
                className="mt-3 text-xs text-[#2c1810] hover:text-[#2c1810]/70 transition"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map((employee) => (
                <div
                  key={employee.userId}
                  className={`bg-[#faf7f3] rounded-xl border ${getRankStyle(employee.rank)} hover:border-[#d4c8bc] transition ${
                    employee.rank === 1 ? "border-amber-300" :
                    employee.rank === 2 ? "border-gray-300" :
                    employee.rank === 3 ? "border-amber-500/50" :
                    "border-[#e5ddd5]"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className="flex-shrink-0">
                        {getRankIcon(employee.rank)}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-[#2c1810] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {employee.user?.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <h3 className="font-medium text-sm text-[#2c1810] truncate">
                              {employee.user?.name || "Unknown"}
                            </h3>
                            <p className="text-xs text-[#8a7a6a] truncate">{employee.user?.email || ""}</p>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-center">
                          <p className="text-sm font-bold text-[#2c1810]">{employee.marks ?? 0}</p>
                          <p className="text-[8px] text-[#8a7a6a] uppercase tracking-wider">Marks</p>
                        </div>
                        <div className="w-px h-8 bg-[#e5ddd5]"></div>
                        <div className="text-center">
                          <p className={`text-sm font-bold ${getMarksColor(employee.percentage)}`}>
                            {employee.percentage}%
                          </p>
                          <p className="text-[8px] text-[#8a7a6a] uppercase tracking-wider">Remaining</p>
                        </div>
                        <div className="w-px h-8 bg-[#e5ddd5]"></div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-emerald-600">{employee.completedTasks}</p>
                          <p className="text-[8px] text-[#8a7a6a] uppercase tracking-wider">Done</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && employees.length > 0 && (
            <div className="bg-[#faf7f3] border border-[#e5ddd5] rounded-xl p-3">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className={`p-1.5 rounded-lg transition ${
                      pagination.hasPrevPage
                        ? "hover:bg-[#f5f0eb] text-[#2c1810]"
                        : "text-[#e5ddd5] cursor-not-allowed"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {renderPaginationButtons.map((page, index) => (
                    typeof page === 'number' ? (
                      <button
                        key={index}
                        onClick={() => handlePageChange(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                          pagination.currentPage === page
                            ? "bg-[#2c1810] text-white"
                            : "hover:bg-[#f5f0eb] text-[#8a7a6a] hover:text-[#2c1810]"
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={index} className="px-1 text-[#8a7a6a] text-xs">…</span>
                    )
                  ))}

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className={`p-1.5 rounded-lg transition ${
                      pagination.hasNextPage
                        ? "hover:bg-[#f5f0eb] text-[#2c1810]"
                        : "text-[#e5ddd5] cursor-not-allowed"
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-[#8a7a6a]">
                  {Math.min((pagination.currentPage - 1) * pagination.limit + 1, pagination.totalEmployees)} - {Math.min(pagination.currentPage * pagination.limit, pagination.totalEmployees)} of {pagination.totalEmployees}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RankingEmployee;