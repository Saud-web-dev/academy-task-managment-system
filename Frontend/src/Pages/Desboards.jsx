import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api, { syncUserFromDB } from "../service/api.js";
import SSIPageLoader from "../components/SSIPageLoader";
import {
  Loader2, Briefcase, CheckCircle, Clock, AlertTriangle,
  Trophy, Award, Calendar, ChevronRight, Star, Crown, Medal,
  TrendingUp, Activity, Target, MoreHorizontal, Download,
  ArrowUpRight, ArrowDownRight, BarChart2, Filter, RefreshCw,
  Timer, Users, FileText, Zap,
} from "lucide-react";

// ── Theme tokens (hardcoded warm brown) ──────────────────────────
const T = {
  bg: "#f5f0eb",
  card: "#faf7f3",
  secondary: "#f0ebe5",
  border: "#e5ddd5",
  borderHover: "#d4c8bc",
  text: "#2c1810",
  textSub: "#4a3f38",
  muted: "#8a7a6a",
  accent: "#2c1810",
  accentLight: "rgba(44,24,16,0.08)",
  success: "#059669",
  successBg: "rgba(5,150,105,0.08)",
  danger: "#dc2626",
  dangerBg: "rgba(220,38,38,0.08)",
  warning: "#d97706",
  warningBg: "rgba(217,119,6,0.08)",
  blue: "#2563eb",
  blueBg: "rgba(37,99,235,0.08)",
  purple: "#7c3aed",
  purpleBg: "rgba(124,58,237,0.08)",
};

// ── Animated Counter ─────────────────────────────────────────────
const AnimatedCounter = ({ end, duration = 1000 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let s;
    const run = (ts) => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, [end, duration]);
  return <span>{count}</span>;
};

// ── Sparkline bars ───────────────────────────────────────────────
const SparkBars = ({ data, color }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px] h-8 mt-2">
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-[2px]"
          style={{ height: `${Math.max((v / max) * 100, 10)}%`, backgroundColor: color, opacity: 0.3 + (i / data.length) * 0.7 }} />
      ))}
    </div>
  );
};

// ── Stat Card ────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, trend, trendVal, spark }) => (
  <div style={{ background: T.card, borderColor: T.border }}
    className="border rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group">
    <div className="flex items-start justify-between">
      <p style={{ color: T.muted }} className="text-[11px] font-semibold uppercase tracking-wider">{label}</p>
      <button className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition"
        style={{ background: T.secondary }}><MoreHorizontal className="w-3.5 h-3.5" style={{ color: T.muted }} /></button>
    </div>
    <div className="flex items-end justify-between mt-2">
      <p style={{ color: T.text }} className="text-[28px] font-bold leading-none">
        <AnimatedCounter end={value} />
      </p>
      {trend && (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ background: trend === "up" ? T.successBg : T.dangerBg, color: trend === "up" ? T.success : T.danger }}>
          {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trendVal}%
        </span>
      )}
    </div>
    <p style={{ color: T.muted }} className="text-[11px] mt-0.5">vs last period</p>
    {spark && <SparkBars data={spark} color={color} />}
  </div>
);

// ── SVG Area Chart ───────────────────────────────────────────────
const AreaChart = ({ series, labels, height = 190 }) => {
  const [hIdx, setHIdx] = useState(null);
  const W = 560, PAD = 22, n = labels.length;
  const step = (W - PAD * 2) / Math.max(n - 1, 1);
  const maxV = Math.max(...series.flatMap(s => s.data), 1);
  const gX = (i) => PAD + i * step;
  const gY = (v) => height - PAD - (v / maxV) * (height - PAD * 2.5);

  const path = (data, close) => {
    let d = `M ${gX(0)} ${gY(data[0])}`;
    for (let i = 1; i < data.length; i++) {
      const cx = (gX(i - 1) + gX(i)) / 2;
      d += ` C ${cx} ${gY(data[i - 1])}, ${cx} ${gY(data[i])}, ${gX(i)} ${gY(data[i])}`;
    }
    if (close) d += ` L ${gX(data.length - 1)} ${height - PAD} L ${gX(0)} ${height - PAD} Z`;
    return d;
  };

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" style={{ height }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHIdx(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width * W - PAD) / step))));
        }}
        onMouseLeave={() => setHIdx(null)}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`eg${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={PAD} x2={W - PAD}
            y1={PAD + f * (height - PAD * 2.5)} y2={PAD + f * (height - PAD * 2.5)}
            stroke={T.border} strokeDasharray="3 5" strokeWidth="1" opacity="0.8" />
        ))}
        {series.map((s, i) => <path key={`a${i}`} d={path(s.data, true)} fill={`url(#eg${i})`} />)}
        {series.map((s, i) => <path key={`l${i}`} d={path(s.data)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" />)}
        {hIdx !== null && (
          <>
            <line x1={gX(hIdx)} x2={gX(hIdx)} y1={PAD} y2={height - PAD} stroke={T.border} strokeWidth="1.5" strokeDasharray="4 3" />
            {series.map((s, i) => <circle key={i} cx={gX(hIdx)} cy={gY(s.data[hIdx])} r="4.5" fill={T.card} stroke={s.color} strokeWidth="2.5" />)}
          </>
        )}
      </svg>
      {hIdx !== null && (
        <div className="absolute pointer-events-none rounded-xl shadow-xl px-3 py-2.5 text-xs z-10 min-w-[130px]"
          style={{ background: T.card, border: `1px solid ${T.border}`, left: `${(gX(hIdx) / W) * 100}%`, top: 0, transform: "translate(-50%,8px)" }}>
          <p style={{ color: T.text, borderColor: T.border }} className="font-bold mb-1.5 border-b pb-1">{labels[hIdx]}</p>
          {series.map((s, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span style={{ color: T.muted }} className="truncate">{s.name}</span>
              <span style={{ color: T.text }} className="ml-auto font-bold">{s.data[hIdx]}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-between mt-1 px-1">
        {labels.map((l, i) => <span key={i} style={{ color: T.muted }} className="text-[10px]">{l}</span>)}
      </div>
      <div className="flex items-center gap-5 mt-2.5 px-1">
        {series.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px]" style={{ color: T.muted }}>
            <span className="w-6 h-[3px] rounded-full" style={{ background: s.color }} />
            {s.name}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Circular Donut ───────────────────────────────────────────────
const DonutSmall = ({ value, max, color, size = 60 }) => {
  const r = (size - 8) / 2, circ = r * 2 * Math.PI;
  const offset = circ - Math.min(value / Math.max(max, 1), 1) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.border} strokeWidth="6" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s ease" }} />
    </svg>
  );
};

// ── Main Component ────────────────────────────────────────────────
const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [projects, setProjects] = useState([]);
  const [employeeProjects, setEmployeeProjects] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [myDeductions, setMyDeductions] = useState({ total: 0, count: 0 });
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    total: 0, completed: 0, pending: 0, inProgress: 0,
    missed: 0, onTime: 0, totalMarks: 0, avgMarks: 0,
  });

  // load user
  useEffect(() => {
    const load = async () => {
      try {
        const cached = localStorage.getItem("user");
        if (cached) setEmployee(JSON.parse(cached));
        const fresh = await syncUserFromDB();
        if (fresh) setEmployee(fresh);
      } catch { /* silent */ }
    };
    load();
  }, []);

  const fetchAll = useCallback(async () => {
    if (!employee) return;
    setLoading(true);
    try {
      const [projRes, perfRes, dedRes] = await Promise.all([
        api.get("/projects"),
        api.get("/ranking/top-performers", { params: { limit: 5 } }),
        api.get("/score-deductions/my", { params: { limit: 5 } }),
      ]);

      const allProj = Array.isArray(projRes.data) ? projRes.data : (projRes.data?.data || []);
      setProjects(allProj);

      const myProj = allProj.filter(p =>
        (p.tasks || []).some(t => String(t.user?._id || t.user) === String(employee._id))
      );
      setEmployeeProjects(myProj);

      // compute stats
      let total = 0, completed = 0, pending = 0, inProgress = 0, missed = 0, onTime = 0, totalMarks = 0;
      const today = new Date();
      allProj.forEach(p => {
        (p.tasks || []).forEach(t => {
          if (String(t.user?._id || t.user) !== String(employee._id)) return;
          total++;
          totalMarks += t.obtainedMarks || 0;
          if (t.completed || t.status === "Completed") { completed++; onTime++; }
          else if (t.status === "In Progress") inProgress++;
          else pending++;
          const dl = t.endDate ? new Date(t.endDate) : null;
          if (dl && dl < today && !t.completed) missed++;
        });
      });
      setStats({ total, completed, pending, inProgress, missed, onTime, totalMarks, avgMarks: total > 0 ? Math.round(totalMarks / total) : 0 });

      if (perfRes.data.success) setTopPerformers(perfRes.data.data || []);
      const dedData = dedRes.data;
      const dedTotal = (dedData.totalDeducted || 0);
      setMyDeductions({ total: dedTotal, count: dedData.total || 0 });
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [employee]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const onTimeRate = (stats.completed + stats.missed) > 0 ? Math.round((stats.onTime / (stats.onTime + stats.missed)) * 100) : 0;
  const employeeMarks = employee?.marks ?? 0;
  const employeeTotalMarks = (employee?.totalMarks ?? 0) + (employee?.manualMarks ?? 0);

  const chartLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  const chartSeries = useMemo(() => [
    { name: "Tasks Done", color: T.success, data: chartLabels.map((_, i) => Math.max(1, Math.floor(stats.completed * (0.1 + i * 0.15) + Math.sin(i) * 2)) ) },
    { name: "Marks", color: T.blue, data: chartLabels.map((_, i) => Math.max(0, Math.floor(stats.avgMarks * (0.6 + i * 0.06)))) },
  ], [stats.completed, stats.avgMarks]);

  const spark = [2, 3, 4, 3, 5, 4, stats.completed % 8 || 3];

  if (loading && !employee) return <SSIPageLoader message="Loading your dashboard..." />;

  return (
    <div className="min-h-screen pb-8" style={{ background: T.bg }}>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-1 space-y-5">

        {/* ── TOP BAR ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border px-5 py-4"
          style={{ background: T.card, borderColor: T.border }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 rounded-xl" style={{ background: T.accentLight }}>
                <BarChart2 className="w-5 h-5" style={{ color: T.text }} />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                style={{ background: T.success, borderColor: T.card }} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight" style={{ color: T.text }}>Dashboard</h1>
              <p className="text-[11px]" style={{ color: T.muted }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={fetchAll} className="p-2 rounded-lg border transition"
              style={{ borderColor: T.border, color: T.muted, background: "transparent" }}>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
           
            <button onClick={() => navigate("/layout/my-documents")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-md"
              style={{ background: T.text, color: "#fff" }}>
              <FileText className="w-3.5 h-3.5" /> My Reports
            </button>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={FileText} label="Total Tasks" value={stats.total} color={T.text} trend="up" trendVal={10} spark={spark} />
          <StatCard icon={CheckCircle} label="Completed" value={stats.completed} color={T.success} trend="up" trendVal={15} spark={spark.map(v => Math.floor(v * 0.7))} />
          <StatCard icon={Clock} label="Pending" value={stats.pending} color={T.warning} />
          <StatCard icon={Activity} label="In Progress" value={stats.inProgress} color={T.blue} />
          <StatCard icon={AlertTriangle} label="Missed" value={stats.missed} color={T.danger} trend={stats.missed > 0 ? "down" : "up"} trendVal={stats.missed > 0 ? 5 : 0} />
          <StatCard icon={Star} label="Avg Marks" value={stats.avgMarks} color={T.purple} trend="up" trendVal={8} spark={spark.map(v => v + 1)} />
        </div>

        {/* ── MARKS BANNER ── */}
        <div className="rounded-2xl border px-5 py-4" style={{ background: T.card, borderColor: T.border }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span style={{ color: T.muted }} className="text-xs font-semibold uppercase tracking-wider">Current Marks</span>
                <span style={{ color: T.text }} className="text-sm font-bold">{employeeMarks} / {employeeTotalMarks}</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min((employeeMarks / Math.max(employeeTotalMarks, 1)) * 100, 100)}%`,
                    background: employeeMarks / employeeTotalMarks >= 0.7 ? T.success : employeeMarks / employeeTotalMarks >= 0.4 ? T.warning : T.danger,
                  }} />
              </div>
              <div className="flex items-center justify-between mt-1">
                <p style={{ color: T.muted }} className="text-[10px]">
                  {((employeeMarks / Math.max(employeeTotalMarks, 1)) * 100).toFixed(1)}% remaining
                </p>
                {(employee?.manualMarks ?? 0) > 0 && (
                  <p style={{ color: T.success }} className="text-[10px]">+{employee.manualMarks} bonus marks</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-6" style={{ borderColor: T.border }}>
              {[
                { label: "Completion", val: `${completionRate}%`, color: T.success },
                { label: "On-Time Rate", val: `${onTimeRate}%`, color: T.blue },
                { label: "Deducted", val: myDeductions.total.toFixed(1), color: T.danger },
              ].map(item => (
                <div key={item.label} className="text-center min-w-[60px]">
                  <p className="text-lg font-bold leading-none" style={{ color: item.color }}>{item.val}</p>
                  <p style={{ color: T.muted }} className="text-[10px] mt-0.5 uppercase tracking-wide">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CHART ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border p-5" style={{ background: T.card, borderColor: T.border }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: T.text }}>Activity Overview</h3>
                <p style={{ color: T.muted }} className="text-[11px] mt-0.5">Tasks completed & marks — last 7 months</p>
              </div>
              <button className="p-1.5 rounded-lg transition" style={{ background: T.secondary }}>
                <MoreHorizontal className="w-3.5 h-3.5" style={{ color: T.muted }} />
              </button>
            </div>
            <AreaChart series={chartSeries} labels={chartLabels} height={190} />
          </div>

          {/* Mini stats panel (Source-style) */}
          <div className="rounded-2xl border p-5 flex flex-col gap-4" style={{ background: T.card, borderColor: T.border }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: T.text }}>Performance</h3>
              <button className="p-1.5 rounded-lg transition" style={{ background: T.secondary }}>
                <MoreHorizontal className="w-3.5 h-3.5" style={{ color: T.muted }} />
              </button>
            </div>

            {[
              { label: "Task Completion", value: stats.completed, max: stats.total || 1, color: T.success },
              { label: "On-Time Delivery", value: stats.onTime, max: stats.total || 1, color: T.blue },
              { label: "Pending Work", value: stats.pending, max: stats.total || 1, color: T.warning },
              { label: "Missed Deadlines", value: stats.missed, max: stats.total || 1, color: T.danger },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <DonutSmall value={item.value} max={item.max} color={item.color} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: T.textSub }}>{item.label}</p>
                  <p className="text-[10px]" style={{ color: T.muted }}>{item.value} / {item.max}</p>
                </div>
                <span className="text-sm font-bold" style={{ color: item.color }}>
                  {Math.round((item.value / Math.max(item.max, 1)) * 100)}%
                </span>
              </div>
            ))}

            <button onClick={() => navigate("/layout/ranking-employees")}
              className="w-full text-center text-xs font-medium py-2 rounded-lg border transition mt-auto"
              style={{ borderColor: T.border, color: T.text }}>
              View full rankings
            </button>
          </div>
        </div>

        {/* ── TABLE ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* My Projects */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: T.border }}>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" style={{ color: T.text }} />
                <h3 className="text-sm font-semibold" style={{ color: T.text }}>My Projects</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full border" style={{ color: T.muted, borderColor: T.border, background: T.secondary }}>
                  {employeeProjects.length}
                </span>
              </div>
              <button onClick={() => navigate("/layout/taskmanager")}
                className="text-xs flex items-center gap-1 font-medium transition"
                style={{ color: T.text }}>
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[1fr_3.5rem_4.5rem] gap-2 px-5 py-2.5 border-b"
              style={{ background: T.secondary, borderColor: T.border }}>
              {["Project", "Tasks", "Progress"].map(h => (
                <span key={h} style={{ color: T.muted }} className={`text-[10px] font-semibold uppercase tracking-wider ${h !== "Project" ? "text-right" : ""}`}>{h}</span>
              ))}
            </div>

            <div className="divide-y max-h-[300px] overflow-y-auto" style={{ divideColor: T.border }}>
              {employeeProjects.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <Briefcase className="w-10 h-10 mx-auto mb-2" style={{ color: T.muted }} />
                  <p className="text-sm" style={{ color: T.muted }}>No projects assigned yet</p>
                </div>
              ) : employeeProjects.map((proj) => {
                const myTasks = (proj.tasks || []).filter(t => String(t.user?._id || t.user) === String(employee?._id));
                const done = myTasks.filter(t => t.completed || t.status === "Completed").length;
                const prog = myTasks.length > 0 ? Math.round((done / myTasks.length) * 100) : 0;
                const barColor = prog >= 80 ? T.success : prog >= 50 ? T.blue : prog >= 25 ? T.warning : T.danger;
                return (
                  <div key={proj._id} className="grid grid-cols-[1fr_3.5rem_4.5rem] gap-2 items-center px-5 py-3 transition cursor-pointer hover:opacity-90"
                    style={{ borderColor: T.border }}
                    onClick={() => navigate("/layout/taskmanager")}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: T.text }}>{proj.projectName || "Untitled"}</p>
                      <p className="text-[10px]" style={{ color: T.muted }}>{proj.endDate ? new Date(proj.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No deadline"}</p>
                    </div>
                    <span className="text-sm text-right" style={{ color: T.muted }}>{myTasks.length}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${prog}%`, background: barColor }} />
                      </div>
                      <span className="text-[10px] w-7 text-right" style={{ color: T.muted }}>{prog}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Performers */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: T.border }}>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <h3 className="text-sm font-semibold" style={{ color: T.text }}>Team Leaders</h3>
              </div>
              <button onClick={() => navigate("/layout/ranking-employees")}
                className="text-xs flex items-center gap-1 font-medium" style={{ color: T.text }}>
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem_5rem] gap-2 px-5 py-2.5 border-b"
              style={{ background: T.secondary, borderColor: T.border }}>
              {["#", "Employee", "Tasks", "Marks", "Score"].map(h => (
                <span key={h} style={{ color: T.muted }}
                  className={`text-[10px] font-semibold uppercase tracking-wider ${["Tasks","Marks"].includes(h) ? "text-right" : ""}`}>{h}</span>
              ))}
            </div>

            <div className="divide-y max-h-[300px] overflow-y-auto" style={{ divideColor: T.border }}>
              {topPerformers.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <Trophy className="w-10 h-10 mx-auto mb-2" style={{ color: T.muted }} />
                  <p className="text-sm" style={{ color: T.muted }}>No data yet</p>
                </div>
              ) : topPerformers.map((p, i) => {
                const isMe = employee && String(p.userId) === String(employee._id);
                const pct = p.percentage ?? 0;
                const RankIcon = i === 0 ? Crown : i === 1 ? Medal : i === 2 ? Award : Star;
                const rankCol = i === 0 ? "#eab308" : i === 1 ? "#9ca3af" : i === 2 ? "#d97706" : T.muted;
                const barCol = pct >= 80 ? T.success : pct >= 60 ? T.blue : pct >= 40 ? T.warning : T.danger;
                return (
                  <div key={p.userId || i}
                    className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem_5rem] gap-2 items-center px-5 py-3 transition"
                    style={{ background: isMe ? `${T.accentLight}` : "transparent", borderColor: T.border }}>
                    <RankIcon className="w-4 h-4 flex-shrink-0" style={{ color: rankCol }} />
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: T.text }}>
                        {p.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-medium truncate block" style={{ color: T.text }}>{p.name || "Unknown"}</span>
                        {isMe && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: T.accentLight, color: T.text }}>You</span>}
                      </div>
                    </div>
                    <span className="text-sm text-right" style={{ color: T.muted }}>{p.taskCount || 0}</span>
                    <span className="text-sm font-bold text-right" style={{ color: barCol }}>{p.marks ?? 0}</span>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: barCol }} />
                      </div>
                      <span className="text-[10px] w-6 text-right" style={{ color: T.muted }}>{Math.round(pct)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: T.border, background: T.secondary }}>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" style={{ color: T.warning }} />
                <span className="text-[11px]" style={{ color: T.muted }}>Your rank</span>
              </div>
              <span className="text-sm font-bold" style={{ color: T.text }}>
                {topPerformers.findIndex(p => String(p.userId) === String(employee?._id)) + 1 || "—"}
                {topPerformers.some(p => String(p.userId) === String(employee?._id)) && <span style={{ color: T.muted }} className="text-xs font-normal"> / {topPerformers.length}</span>}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeDashboard;
