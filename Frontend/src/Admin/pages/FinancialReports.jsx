import React, { useState, useEffect, useCallback } from "react";
import api from "../../service/api.js";
import SSIPageLoader from "../../components/SSIPageLoader";
import toast from "react-hot-toast";
import {
  BarChart2, Loader2, TrendingUp, TrendingDown, DollarSign,
  Receipt, Tag, Building2, RefreshCw, ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const fmtCurrency = (v) => `PKR ${Number(v || 0).toLocaleString("en-PK")}`;

const CHART_COLORS = [
  "var(--accent-primary)", "var(--success)", "var(--warning)", "var(--danger)",
  "#a855f7", "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#14b8a6",
];

// Mini bar chart for monthly expenses
const MonthlyBarChart = ({ months }) => {
  const maxVal = Math.max(...months.map(m => m.totalExpenses), 1);
  return (
    <div className="flex items-end gap-1 h-28 mt-3">
      {months.map((m, i) => {
        const pct = (m.totalExpenses / maxVal) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="w-full rounded-t transition-all duration-700 hover:opacity-80"
              style={{ height: `${Math.max(pct, 3)}%`, backgroundColor: "var(--accent-primary)", opacity: 0.7 + (pct / 100) * 0.3 }} />
            <span className="text-[8px] text-[var(--text-muted)]">{m.monthName.slice(0, 3)}</span>
            <div className="absolute bottom-full mb-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-[10px] text-[var(--text-primary)] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 shadow-lg">
              {m.monthName}: {fmtCurrency(m.totalExpenses)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const FinancialReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/expenses/finance/reports", { params: { year } });
      if (res.data.success) setData(res.data.data);
      else toast.error("Failed to load reports");
    } catch (e) { toast.error(e.response?.data?.message || "Failed to load financial reports"); }
    finally { setLoading(false); }
  }, [year]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-[var(--accent-primary)]/10 p-2.5 rounded-xl">
            <BarChart2 className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">Financial Reports</h1>
            <p className="text-[11px] text-[var(--text-muted)]">Annual breakdown & project profitability</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent-primary)] transition">
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={fetchReports} className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <SSIPageLoader message="Loading reports..." />
      ) : data ? (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Year Expenses", value: fmtCurrency(data.summary?.totalYearExpenses), icon: Receipt, color: "var(--danger)" },
              { label: "Project Value", value: fmtCurrency(data.summary?.totalProjectValue), icon: DollarSign, color: "var(--accent-primary)" },
              { label: "Total Received", value: fmtCurrency(data.summary?.totalReceived), icon: TrendingUp, color: "var(--success)" },
              { label: "Net Profit", value: fmtCurrency(data.summary?.netProfit), icon: BarChart2, color: data.summary?.netProfit >= 0 ? "var(--success)" : "var(--danger)" },
            ].map(c => (
              <div key={c.label} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{c.label}</p>
                  <c.icon className="w-4 h-4" style={{ color: c.color }} />
                </div>
                <p className="text-xl font-bold" style={{ color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Monthly + Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Monthly expenses chart */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[var(--accent-primary)]" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Monthly Expenses {year}</h3>
                </div>
              </div>
              <MonthlyBarChart months={data.monthlyExpenses || []} />
              <div className="mt-3 border-t border-[var(--border-color)] pt-3">
                <div className="grid grid-cols-3 gap-2">
                  {data.monthlyExpenses?.slice(0, 6).map((m, i) => (
                    <div key={i} className="text-center">
                      <p className="text-[10px] text-[var(--text-muted)]">{m.monthName.slice(0, 3)}</p>
                      <p className="text-xs font-bold text-[var(--text-primary)]">{fmtCurrency(m.totalExpenses)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-[var(--accent-primary)]" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Expenses by Category</h3>
              </div>
              {!data.categoryBreakdown?.length ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-8">No data for {year}</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {data.categoryBreakdown.map((cat, i) => {
                    const total = data.summary?.totalYearExpenses || 1;
                    const pct = Math.round((cat.total / total) * 100);
                    return (
                      <div key={cat._id || i} className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className="text-[var(--text-secondary)] truncate font-medium">{cat._id}</span>
                            <span className="text-[var(--text-primary)] font-bold ml-2">{fmtCurrency(cat.total)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--border-color)] overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          </div>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] w-7 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Project Profitability Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[var(--accent-primary)]" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Project Profitability</h3>
              </div>
              <button onClick={() => navigate("/admin/expenses")}
                className="text-xs text-[var(--accent-primary)] font-medium flex items-center gap-1 hover:text-[var(--accent-hover)] transition">
                Manage Expenses <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-[1fr_5rem_5rem_5rem_5rem_5rem_5rem] gap-2 px-5 py-2.5 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
              {["Project", "Price", "Received", "Expenses", "Pending", "Est. Profit", "Status"].map(h => (
                <span key={h} className={`text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider ${h !== "Project" && h !== "Status" ? "text-right" : ""}`}>{h}</span>
              ))}
            </div>

            {!data.projectProfitability?.length ? (
              <div className="py-12 text-center">
                <Building2 className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2" />
                <p className="text-sm text-[var(--text-secondary)]">No projects found</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-color)] max-h-[400px] overflow-y-auto">
                {data.projectProfitability.map((proj, i) => {
                  const pending = Math.max(0, (proj.totalPrice || 0) - (proj.amountReceived || 0));
                  const isProfit = (proj.estimatedProfit || 0) >= 0;
                  return (
                    <div key={proj._id || i} className="grid grid-cols-[1fr_5rem_5rem_5rem_5rem_5rem_5rem] gap-2 items-center px-5 py-3 hover:bg-[var(--bg-secondary)]/50 transition">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{proj.projectName}</p>
                        {proj.client && <p className="text-[10px] text-[var(--text-muted)] truncate">{proj.client}</p>}
                      </div>
                      <span className="text-xs text-right text-[var(--text-secondary)]">{fmtCurrency(proj.totalPrice)}</span>
                      <span className="text-xs text-right text-[var(--success)] font-semibold">{fmtCurrency(proj.amountReceived)}</span>
                      <span className="text-xs text-right text-[var(--danger)]">{fmtCurrency(proj.projectExpenses)}</span>
                      <span className="text-xs text-right text-[var(--warning)]">{fmtCurrency(pending)}</span>
                      <span className={`text-xs text-right font-bold ${isProfit ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                        {isProfit ? "+" : ""}{fmtCurrency(proj.estimatedProfit)}
                      </span>
                      <div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                          proj.paymentStatus === "Paid" ? "bg-[var(--success)]/10 text-[var(--success)]" :
                          proj.paymentStatus === "Partially Paid" ? "bg-[var(--warning)]/10 text-[var(--warning)]" :
                          "bg-[var(--danger)]/10 text-[var(--danger)]"
                        }`}>{proj.paymentStatus || "Pending"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="px-5 py-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-muted)]">{data.projectProfitability?.length || 0} projects</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-[var(--text-muted)]">Est. Total Profit:</span>
                <span className={`font-bold ${(data.summary?.estimatedProfit || 0) >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                  {fmtCurrency(data.summary?.estimatedProfit)}
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <BarChart2 className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">No report data available</p>
        </div>
      )}
    </div>
  );
};

export default FinancialReports;
