import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../service/api.js";
import SSIPageLoader from "../../components/SSIPageLoader";
import {
  Users, UserCheck, UserX, Loader2, Briefcase, Calendar,
  CheckCircle2, AlertTriangle, ChevronRight, History,
  Activity, Timer, Trophy,
  TrendingUp, Search, ArrowUpDown, Download, Filter,
  MoreHorizontal, RefreshCw, Star, Award, Medal, Crown,
  Target, Clock, BarChart2,
} from "lucide-react";
import { autoZeroMissedTasks } from "../utility/autoZero.js";

// ─── Animated Counter ─────────────────────────────────────────────
const AnimatedCounter = ({ end, duration = 1000 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime;
    const animate = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - progress, 3)) * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  return <span>{count.toLocaleString()}</span>;
};

// ─── Mini sparkline bars ───────────────────────────────────────────
const SparkBars = ({ data, color }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px] h-9">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-[2px] transition-all"
          style={{
            height: `${Math.max((v / max) * 100, 10)}%`,
            backgroundColor: color,
            opacity: i === data.length - 1 ? 1 : 0.3 + (i / data.length) * 0.4,
          }}
        />
      ))}
    </div>
  );
};

// ─── Stat Card (Trackify style) ────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, trend, trendValue, sparkData }) => (
  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
    <div className="flex items-start justify-between mb-1">
      <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
      <button className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] transition opacity-0 group-hover:opacity-100">
        <MoreHorizontal className="w-3.5 h-3.5 text-[var(--text-muted)]" />
      </button>
    </div>
    <div className="flex items-end justify-between mt-2">
      <p className="text-[28px] font-bold text-[var(--text-primary)] leading-none tracking-tight">
        <AnimatedCounter end={value} />
      </p>
      {trend && (
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
          trend === "up" ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--danger)]/10 text-[var(--danger)]"
        }`}>
          {trendValue}%
        </span>
      )}
    </div>
    <p className="text-[11px] text-[var(--text-muted)] mt-1">vs last month</p>
    {sparkData && <SparkBars data={sparkData} color={color} />}
  </div>
);

// ─── SVG Area Chart ────────────────────────────────────────────────
const AreaChart = ({ series, labels, height = 200 }) => {
  const [hoverIdx, setHoverIdx] = useState(null);
  const W = 600; const PAD = 24; const n = labels.length;
  const stepX = (W - PAD * 2) / Math.max(n - 1, 1);
  const maxVal = Math.max(...series.flatMap(s => s.data), 1);
  const getX = (i) => PAD + i * stepX;
  const getY = (v) => height - PAD - (v / maxVal) * (height - PAD * 2.2);

  const buildPath = (data, close = false) => {
    let d = `M ${getX(0)} ${getY(data[0])}`;
    for (let i = 1; i < data.length; i++) {
      const cx = (getX(i - 1) + getX(i)) / 2;
      d += ` C ${cx} ${getY(data[i - 1])}, ${cx} ${getY(data[i])}, ${getX(i)} ${getY(data[i])}`;
    }
    if (close) d += ` L ${getX(data.length - 1)} ${height - PAD} L ${getX(0)} ${height - PAD} Z`;
    return d;
  };

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="w-full"
        style={{ height }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * W;
          setHoverIdx(Math.max(0, Math.min(n - 1, Math.round((x - PAD) / stepX))));
        }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`ag-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={PAD} x2={W - PAD}
            y1={PAD + f * (height - PAD * 2.2)} y2={PAD + f * (height - PAD * 2.2)}
            stroke="var(--border-color)" strokeDasharray="3 5" strokeWidth="1" opacity="0.6" />
        ))}
        {series.map((s, i) => (
          <path key={`a${i}`} d={buildPath(s.data, true)} fill={`url(#ag-${i})`} />
        ))}
        {series.map((s, i) => (
          <path key={`l${i}`} d={buildPath(s.data)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" />
        ))}
        {hoverIdx !== null && (
          <>
            <line x1={getX(hoverIdx)} x2={getX(hoverIdx)} y1={PAD} y2={height - PAD}
              stroke="var(--border-color)" strokeWidth="1.5" strokeDasharray="4 3" />
            {series.map((s, i) => (
              <circle key={i} cx={getX(hoverIdx)} cy={getY(s.data[hoverIdx])}
                r="4.5" fill="var(--bg-card)" stroke={s.color} strokeWidth="2.5" />
            ))}
          </>
        )}
      </svg>

      {hoverIdx !== null && (
        <div className="absolute pointer-events-none bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl px-3 py-2.5 text-xs z-10 min-w-[130px]"
          style={{ left: `${(getX(hoverIdx) / W) * 100}%`, top: 0, transform: "translate(-50%, 8px)" }}>
          <p className="font-bold text-[var(--text-primary)] mb-1.5 border-b border-[var(--border-color)] pb-1">{labels[hoverIdx]}</p>
          {series.map((s, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span className="text-[var(--text-muted)] truncate">{s.name}</span>
              <span className="ml-auto font-bold text-[var(--text-primary)]">{s.data[hoverIdx]}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between mt-1 px-1">
        {labels.map((l, i) => <span key={i} className="text-[10px] text-[var(--text-muted)]">{l}</span>)}
      </div>
      <div className="flex items-center gap-5 mt-3 px-1">
        {series.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
            <span className="w-6 h-[3px] rounded-full" style={{ background: s.color }} />
            {s.name}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Donut Chart ───────────────────────────────────────────────────
const DonutChart = ({ data, size = 130, onViewAll }) => {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  let angle = 0;
  const GAP = 4;
  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {data.map((item, i) => {
            const pct = item.value / total;
            const sweep = pct * (360 - GAP * data.length);
            const start = angle;
            angle += sweep + GAP;
            const toRad = (deg) => ((deg - 90) * Math.PI) / 180;
            const r = size / 2 - 12;
            const cx = size / 2, cy = size / 2;
            const x1 = cx + r * Math.cos(toRad(start));
            const y1 = cy + r * Math.sin(toRad(start));
            const x2 = cx + r * Math.cos(toRad(start + sweep));
            const y2 = cy + r * Math.sin(toRad(start + sweep));
            return (
              <path key={i}
                d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x2} ${y2} Z`}
                fill={item.color} stroke="var(--bg-card)" strokeWidth="3" />
            );
          })}
          <circle cx={size / 2} cy={size / 2} r={size / 2 - 30} fill="var(--bg-card)" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-[var(--text-primary)]">{total}</span>
          <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide">Total</span>
        </div>
      </div>
      <div className="flex-1 w-full space-y-2.5">
        {data.map((item, i) => {
          const pct = Math.round((item.value / total) * 100);
          return (
            <div key={i} className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-sm text-[var(--text-secondary)] flex-1 truncate">{item.label}</span>
              <span className="font-bold text-sm text-[var(--text-primary)]">{item.value}</span>
              <span className="text-[11px] text-[var(--text-muted)] w-8 text-right">{pct}%</span>
            </div>
          );
        })}
        {onViewAll && (
          <button onClick={onViewAll}
            className="w-full text-center text-xs font-medium text-[var(--accent-primary)] hover:text-[var(--accent-hover)] border border-[var(--border-color)] hover:border-[var(--accent-primary)]/40 rounded-lg py-1.5 mt-1 transition">
            View all employees
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main Dashboard ────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topPerformers, setTopPerformers] = useState([]);
  const [performerLoading, setPerformerLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [deductionSummary, setDeductionSummary] = useState([]);
  const [deadlineStats, setDeadlineStats] = useState({ topMissed: [], totalMissed: 0, totalOnTime: 0 });
  const [deadlineLoading, setDeadlineLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("marks");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const init = async () => {
      await autoZeroMissedTasks();
      await Promise.all([fetchUsers(), fetchTopPerformers(), fetchDeadlineStats(), fetchProjects(), fetchDeductionSummary()]);
      setLoading(false);
    };
    init();
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/user/all-users");
      setUsers((res.data.users || []).filter((u) => u.role === "employee"));
    } catch { /* silent */ }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get("/projects");
      const d = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setProjects(d);
    } catch { setProjects([]); }
  }, []);

  const fetchTopPerformers = useCallback(async () => {
    setPerformerLoading(true);
    try {
      const res = await api.get("/ranking/top-performers", { params: { limit: 8 } });
      if (res.data.success) setTopPerformers(res.data.data);
      else setTopPerformers([]);
    } catch { setTopPerformers([]); }
    finally { setPerformerLoading(false); }
  }, []);

  const fetchDeadlineStats = useCallback(async () => {
    setDeadlineLoading(true);
    try {
      const res = await api.get("/ranking/deadline-rankings", { params: { page: 1, limit: 100 } });
      if (res.data.success) {
        const data = res.data.data || [];
        let totalMissed = 0, totalOnTime = 0;
        data.forEach((i) => { totalMissed += i.missedDeadlines || 0; totalOnTime += i.onTimeTasks || 0; });
        setDeadlineStats({
          topMissed: data.filter(i => i.missedDeadlines > 0).sort((a, b) => b.missedDeadlines - a.missedDeadlines).slice(0, 5),
          totalMissed, totalOnTime,
        });
      }
    } catch { /* silent */ }
    finally { setDeadlineLoading(false); }
  }, []);

  const fetchDeductionSummary = useCallback(async () => {
    try {
      const res = await api.get("/score-deductions/summary");
      if (res.data.success) setDeductionSummary(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  // ─── Computed ─────────────────────────────────────────────────
  const totalEmployees = users.length;
  const activeEmployees = users.filter(u => u.isActive).length;
  const inactiveEmployees = users.filter(u => !u.isActive).length;
  const totalProjects = projects.length;
  const totalTasks = projects.reduce((a, p) => a + (p.tasks?.length || 0), 0);
  const completedTasks = projects.reduce((a, p) => a + (p.tasks || []).filter(t => t.completed).length, 0);
  const avgMarks = users.length > 0 ? Math.round(users.reduce((a, u) => a + (u.marks || 0), 0) / users.length) : 0;
  const totalDeducted = deductionSummary.reduce((a, d) => a + (d.totalDeducted || 0), 0);

  const teamDistribution = [
    { label: "Active", value: activeEmployees, color: "var(--success)" },
    { label: "Inactive", value: inactiveEmployees, color: "var(--danger)" },
    { label: "Projects", value: totalProjects, color: "var(--accent-primary)" },
  ];

  const spark7 = [3, 5, 4, 7, 6, 8, totalTasks % 10 || 5];
  const spark7b = [2, 3, 5, 4, 6, 5, activeEmployees % 10 || 3];

  const chartLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chartSeries = useMemo(() => {
    const base = Math.max(1, totalTasks);
    return [
      { name: "Tasks Completed", color: "var(--accent-primary)", data: chartLabels.map((_, i) => Math.max(1, Math.floor(base * (0.05 + (i / 12) * 0.9) + Math.sin(i) * 3))) },
      { name: "Active Employees", color: "var(--success)", data: chartLabels.map((_, i) => Math.max(1, Math.floor(activeEmployees * (0.6 + (i / 12) * 0.4) + Math.cos(i) * 2))) },
      { name: "Deductions", color: "var(--warning)", data: chartLabels.map((_, i) => Math.max(0, Math.floor((totalDeducted / 12) * (0.5 + Math.sin(i * 0.8) * 0.5))) ) },
    ];
  }, [totalTasks, activeEmployees, totalDeducted]);

  const filteredPerformers = useMemo(() => {
    let list = [...topPerformers];
    if (searchQuery.trim()) list = list.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    return list.sort((a, b) => sortBy === "marks" ? (b.marks ?? 0) - (a.marks ?? 0) : (b.taskCount || 0) - (a.taskCount || 0));
  }, [topPerformers, searchQuery, sortBy]);

  const handleExport = () => {
    if (!topPerformers.length) return;
    const rows = topPerformers.map((p, i) => `${i + 1},${(p.name || "").replace(/,/g, " ")},${p.taskCount || 0},${p.marks ?? 0},${p.percentage ?? 0}%`).join("\n");
    const blob = new Blob(["Rank,Name,Tasks,Marks,Remaining%\n" + rows], { type: "text/csv" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `performers-${Date.now()}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  if (loading) return <SSIPageLoader message="Loading dashboard..." />;

  return (
    <div className="space-y-5 pb-8">

      {/* ── TOP BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="bg-[var(--accent-primary)]/12 p-2.5 rounded-xl">
              <BarChart2 className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--success)] rounded-full border-2 border-[var(--bg-card)]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)] leading-tight">Dashboard</h1>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => { fetchUsers(); fetchTopPerformers(); fetchDeadlineStats(); }}
            className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
         
          <button onClick={handleExport} disabled={!topPerformers.length}
            className="inline-flex items-center gap-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-md shadow-[var(--accent-primary)]/20 disabled:opacity-40">
            <Download className="w-3.5 h-3.5" /> Export all
          </button>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Users} label="Total Employees" value={totalEmployees} color="var(--accent-primary)" trend="up" trendValue={12} sparkData={spark7} />
        <StatCard icon={UserCheck} label="Active" value={activeEmployees} color="var(--success)" trend="up" trendValue={8} sparkData={spark7b} />
        <StatCard icon={UserX} label="Inactive" value={inactiveEmployees} color="var(--danger)" trend="down" trendValue={3} />
        <StatCard icon={Briefcase} label="Projects" value={totalProjects} color="var(--accent-light)" trend="up" trendValue={24} sparkData={[2,3,4,3,5,4,totalProjects%8||4]} />
        <StatCard icon={CheckCircle2} label="Tasks Done" value={completedTasks} color="var(--success)" trend="up" trendValue={18} sparkData={[1,3,2,5,4,6,completedTasks%10||3]} />
        <StatCard icon={AlertTriangle} label="Missed Deadlines" value={deadlineStats.totalMissed} color="var(--warning)" trend="down" trendValue={5} />
      </div>

      {/* ── CHART ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue Forecast style chart */}
        <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Activity Forecast</h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Tasks, employees, deductions — full year view</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg px-2.5 py-1 hover:bg-[var(--bg-secondary)] transition">
                Monthly
              </button>
              <button className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition">
                <MoreHorizontal className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>
            </div>
          </div>
          <AreaChart series={chartSeries} labels={chartLabels} height={200} />
        </div>

        {/* Source/Donut Panel */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Team Overview</h3>
            <button className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition">
              <MoreHorizontal className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </button>
          </div>
          <DonutChart data={teamDistribution} onViewAll={() => navigate("/admin/employees-ranking")} />

          {/* Quick stats below donut */}
          <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-[var(--border-color)]">
            <div className="text-center">
              <p className="text-lg font-bold text-[var(--text-primary)]">{avgMarks}</p>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Avg Marks</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-[var(--text-primary)]">{totalTasks}</p>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Total Tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABLE ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Team Performance Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Team Performance</h3>
                <span className="text-[10px] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] px-2 py-0.5 rounded-full">
                  {filteredPerformers.length}
                </span>
              </div>
              <button onClick={() => navigate("/admin/employees-ranking")}
                className="text-xs text-[var(--accent-primary)] hover:text-[var(--accent-hover)] flex items-center gap-1 font-medium transition">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search employee..."
                  className="w-full text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg pl-8 pr-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]/50 transition" />
              </div>
              <button onClick={() => setSortBy(s => s === "marks" ? "tasks" : "marks")}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/40 transition whitespace-nowrap">
                <ArrowUpDown className="w-3.5 h-3.5" />
                {sortBy === "marks" ? "By Marks" : "By Tasks"}
              </button>
              <button onClick={handleExport} disabled={!topPerformers.length}
                className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition disabled:opacity-40">
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem_5rem] gap-2 px-5 py-2.5 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
            {["#","Employee","Tasks","Marks","Progress"].map(h => (
              <span key={h} className={`text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider ${h === "Tasks" || h === "Marks" ? "text-right" : ""}`}>{h}</span>
            ))}
          </div>

          {performerLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[var(--accent-primary)] animate-spin" />
            </div>
          ) : filteredPerformers.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Trophy className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-sm text-[var(--text-secondary)]">No performance data yet</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Complete tasks to appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color)] max-h-[340px] overflow-y-auto">
              {filteredPerformers.map((p, i) => {
                const pct = p.percentage ?? 0;
                const RankIcon = i === 0 ? Crown : i === 1 ? Medal : i === 2 ? Award : Star;
                const rankColor = i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-[var(--text-muted)]";
                const barColor = pct >= 80 ? "var(--success)" : pct >= 60 ? "var(--accent-primary)" : pct >= 40 ? "var(--warning)" : "var(--danger)";
                return (
                  <div key={p.userId || i}
                    className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem_5rem] gap-2 items-center px-5 py-3 hover:bg-[var(--bg-secondary)]/60 transition cursor-pointer"
                    onClick={() => navigate("/admin/employees-ranking")}>
                    <RankIcon className={`w-4 h-4 ${rankColor}`} />
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] text-xs font-bold flex-shrink-0">
                        {p.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <span className="text-sm text-[var(--text-primary)] truncate font-medium">{p.name || "Unknown"}</span>
                    </div>
                    <span className="text-sm text-[var(--text-secondary)] text-right">{p.taskCount || 0}</span>
                    <span className="text-sm font-bold text-right" style={{ color: barColor }}>{p.marks ?? 0}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--border-color)] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }} />
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] w-6 text-right">{Math.round(pct)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Deadline Watch Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-[var(--warning)]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Deadline Watch</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--success)]" />{deadlineStats.totalOnTime} on-time</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--danger)]" />{deadlineStats.totalMissed} missed</span>
              </div>
              <button onClick={() => navigate("/admin/deadline-ranking")}
                className="text-xs text-[var(--accent-primary)] hover:text-[var(--accent-hover)] flex items-center gap-1 font-medium transition">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[2rem_1fr_5rem_5rem] gap-2 px-5 py-2.5 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
            {["#","Employee","Missed","On Time"].map(h => (
              <span key={h} className={`text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider ${h === "Missed" || h === "On Time" ? "text-right" : ""}`}>{h}</span>
            ))}
          </div>

          {deadlineLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-7 h-7 text-[var(--warning)] animate-spin" />
            </div>
          ) : deadlineStats.topMissed.length === 0 ? (
            <div className="py-14 text-center px-4">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-[var(--success)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--text-secondary)]">No missed deadlines</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Great job, team!</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color)] max-h-[340px] overflow-y-auto">
              {deadlineStats.topMissed.map((item, i) => {
                const ratio = Math.min((item.missedDeadlines / (deadlineStats.topMissed[0]?.missedDeadlines || 1)) * 100, 100);
                return (
                  <div key={item.userId || i}
                    className="grid grid-cols-[2rem_1fr_5rem_5rem] gap-2 items-center px-5 py-3 hover:bg-[var(--bg-secondary)]/60 transition">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                      i === 0 ? "bg-[var(--danger)]/15 text-[var(--danger)]" :
                      i === 1 ? "bg-[var(--warning)]/15 text-[var(--warning)]" :
                      "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                    }`}>{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.user?.name || "Unknown"}</p>
                      <div className="w-full h-1 rounded-full bg-[var(--border-color)] mt-1 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[var(--warning)] to-[var(--danger)] transition-all duration-700"
                          style={{ width: `${ratio}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[var(--danger)] text-right">{item.missedDeadlines}</span>
                    <span className="text-sm font-semibold text-[var(--success)] text-right">{item.onTimeTasks || 0}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary footer */}
          <div className="px-5 py-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="text-[11px] text-[var(--text-muted)]">Overall on-time rate</span>
            </div>
            <span className="text-sm font-bold text-[var(--success)]">
              {deadlineStats.totalOnTime + deadlineStats.totalMissed > 0
                ? `${Math.round((deadlineStats.totalOnTime / (deadlineStats.totalOnTime + deadlineStats.totalMissed)) * 100)}%`
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ── DEDUCTION SUMMARY ROW ── */}
      {deductionSummary.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Deduction Summary</h3>
              <span className="text-[10px] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] px-2 py-0.5 rounded-full">{deductionSummary.length} employees</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--text-muted)]">Total deducted:</span>
              <span className="text-sm font-bold text-[var(--danger)]">{totalDeducted.toFixed(1)}</span>
              <button onClick={() => navigate("/admin/history")}
                className="text-xs text-[var(--accent-primary)] hover:text-[var(--accent-hover)] flex items-center gap-1 font-medium transition ml-1">
                History <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-color)]">
            {deductionSummary.slice(0, 8).map((d, i) => {
              const totalCuts = (d.lateArrivals || 0) + (d.absents || 0) + (d.dailyUpdateMisses || 0) + (d.deadlineMisses || 0) + (d.manualCuts || 0);
              return (
                <div key={d._id || i} className="px-4 py-3 hover:bg-[var(--bg-secondary)]/50 transition">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] text-xs font-bold flex-shrink-0 border border-[var(--accent-primary)]/20">
                      {(d.userName || "U").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)] truncate">{d.userName || "Unknown"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>{totalCuts} events</span>
                    <span className="font-bold text-[var(--danger)]">-{(d.totalDeducted || 0).toFixed(1)} marks</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {d.lateArrivals > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20">{d.lateArrivals}L</span>}
                    {d.absents > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20">{d.absents}A</span>}
                    {d.deadlineMisses > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">{d.deadlineMisses}D</span>}
                    {d.manualCuts > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--text-muted)]/10 text-[var(--text-muted)] border border-[var(--border-color)]">{d.manualCuts}M</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
