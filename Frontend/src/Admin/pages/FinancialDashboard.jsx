import React, { useState, useEffect, useCallback } from "react";
import api from "../../service/api.js";
import SSIPageLoader from "../../components/SSIPageLoader";
import toast from "react-hot-toast";
import {
  DollarSign, TrendingUp, TrendingDown, Receipt, Loader2,
  ArrowUpRight, RefreshCw, BarChart2, Wallet, Clock,
  CheckCircle, Tag, ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const fmtCurrency = (v) => `PKR ${Number(v || 0).toLocaleString("en-PK")}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-PK", { month: "short", day: "numeric" }) : "—";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_year", label: "This Year" },
  { value: "custom", label: "Custom" },
];

const StatCard = ({ icon: Icon, label, value, sub, color, trend }) => (
  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
    <div className="flex items-start justify-between mb-2">
      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
      <div className="p-1.5 rounded-lg" style={{ background: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
    </div>
    <p className="text-2xl font-bold text-[var(--text-primary)] leading-none">{value}</p>
    {sub && <p className="text-[11px] text-[var(--text-muted)] mt-1">{sub}</p>}
    {trend !== undefined && (
      <div className={`inline-flex items-center gap-1 text-[11px] font-semibold mt-2 px-1.5 py-0.5 rounded-full ${trend >= 0 ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--danger)]/10 text-[var(--danger)]"}`}>
        {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {trend >= 0 ? "+" : ""}{fmtCurrency(Math.abs(trend))}
      </div>
    )}
  </div>
);

const FinancialDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = { period };
      if (period === "custom") { params.startDate = customFrom; params.endDate = customTo; }
      const res = await api.get("/expenses/finance/dashboard", { params });
      if (res.data.success) setData(res.data.data);
      else toast.error("Failed to load financial data");
    } catch (e) { toast.error(e.response?.data?.message || "Failed to load financial dashboard"); }
    finally { setLoading(false); }
  }, [period, customFrom, customTo]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) return <SSIPageLoader message="Loading dashboard..." />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500/10 p-2.5 rounded-xl">
            <DollarSign className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">Financial Dashboard</h1>
            <p className="text-[11px] text-[var(--text-muted)]">Real-time financial overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period selector */}
          <div className="flex gap-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-1">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${period === p.value ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={fetchDashboard} className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Custom date range */}
      {period === "custom" && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-5 py-4 flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">From</label>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent-primary)] transition" />
          </div>
          <div>
            <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">To</label>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent-primary)] transition" />
          </div>
          <button onClick={fetchDashboard} className="mt-5 px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] rounded-lg text-sm font-medium transition shadow-lg shadow-[var(--accent-primary)]/20">Apply</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* Main stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={Wallet} label="Project Value" value={fmtCurrency(data.totalProjectValue)} sub={`${data.projectCount} projects`} color="var(--accent-primary)" />
            <StatCard icon={ArrowUpRight} label="Received" value={fmtCurrency(data.totalReceived)} color="var(--success)" trend={data.totalReceived - data.totalExpenses} />
            <StatCard icon={Receipt} label="Expenses" value={fmtCurrency(data.totalExpenses)} sub={`${data.expenseCount} records`} color="var(--danger)" />
            <StatCard icon={Clock} label="Pending" value={fmtCurrency(data.pendingReceivables)} sub="Unreceived" color="var(--warning)" />
            <StatCard icon={TrendingUp} label="Cash Profit" value={fmtCurrency(data.cashProfit)} sub="Received − Expenses" color={data.cashProfit >= 0 ? "var(--success)" : "var(--danger)"} />
            <StatCard icon={BarChart2} label="Est. Profit" value={fmtCurrency(data.estimatedProfit)} sub="Value − Expenses" color="var(--accent-light)" />
          </div>

          {/* Category + Recent Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Category breakdown */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[var(--accent-primary)]" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Expenses by Category</h3>
                </div>
                <button onClick={() => navigate("/admin/expenses")} className="text-xs text-[var(--accent-primary)] font-medium flex items-center gap-1 hover:text-[var(--accent-hover)] transition">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {data.categoryBreakdown?.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-8">No expense data for this period</p>
              ) : (
                <div className="space-y-3">
                  {data.categoryBreakdown?.slice(0, 8).map((cat, i) => {
                    const maxVal = data.categoryBreakdown[0]?.total || 1;
                    const pct = Math.round((cat.total / maxVal) * 100);
                    const colors = ["var(--accent-primary)", "var(--success)", "var(--warning)", "var(--danger)", "#a855f7", "#06b6d4", "#f97316", "#84cc16"];
                    return (
                      <div key={cat._id || i}>
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="text-[var(--text-secondary)] font-medium truncate mr-2">{cat._id}</span>
                          <span className="text-[var(--text-primary)] font-bold flex-shrink-0">{fmtCurrency(cat.total)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--border-color)] overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent expenses */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[var(--text-muted)]" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent Expenses</h3>
                </div>
                <button onClick={() => navigate("/admin/expenses")} className="text-xs text-[var(--accent-primary)] font-medium flex items-center gap-1 hover:text-[var(--accent-hover)] transition">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {!data.recentExpenses?.length ? (
                <div className="py-12 text-center"><p className="text-sm text-[var(--text-muted)]">No recent expenses</p></div>
              ) : (
                <div className="divide-y divide-[var(--border-color)]">
                  {data.recentExpenses.map((exp, i) => (
                    <div key={exp._id || i} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--bg-secondary)]/50 transition">
                      <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center flex-shrink-0">
                        <Receipt className="w-4 h-4 text-[var(--accent-primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{exp.title}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{exp.category} • {fmtDate(exp.expenseDate)}</p>
                      </div>
                      <span className="text-sm font-bold text-[var(--danger)] flex-shrink-0">{fmtCurrency(exp.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <DollarSign className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">No financial data available</p>
        </div>
      )}
    </div>
  );
};

export default FinancialDashboard;
