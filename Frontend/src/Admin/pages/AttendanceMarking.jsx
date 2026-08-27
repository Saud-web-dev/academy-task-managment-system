import React, { useState, useEffect, useCallback } from "react";
import api from "../../service/api.js";
import SSIPageLoader from "../../components/SSIPageLoader";
import toast from "react-hot-toast";
import {
  Clock, Users, AlertTriangle, CheckCircle, Settings,
  Loader2, X, Save, UserX, Calendar,
  Scissors, AlertCircle, RefreshCw,
  Zap, CheckSquare, Square, PlusCircle, History,
  TrendingUp, FileInput, Star, Info, HelpCircle,
} from "lucide-react";

const TabBtn = ({ active, onClick, children, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      active
        ? "bg-[var(--accent-primary)] text-[var(--text-inverse)] shadow-lg shadow-[var(--accent-primary)]/20"
        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]"
    }`}
  >
    {Icon && <Icon size={15} />}
    {children}
  </button>
);

const Field = ({ label, children, required }) => (
  <div>
    <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
      {label} {required && <span className="text-[var(--danger)]">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none transition";

const DEDUCTION_LABELS = {
  late_arrival: { label: "Late Arrival", color: "var(--warning)" },
  absent: { label: "Absent", color: "var(--danger)" },
  daily_update_miss: { label: "Daily Update Miss", color: "#a855f7" },
  deadline_missed: { label: "Deadline Missed", color: "#ef4444" },
  manual: { label: "Manual", color: "var(--text-secondary)" },
};

// Help Modal Component
const HelpModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-[var(--accent-primary)]" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition p-1"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 text-sm text-[var(--text-secondary)] space-y-3">
          {children}
        </div>
        <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] rounded-lg text-sm font-medium transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

const AttendanceMarking = () => {
  const [activeTab, setActiveTab] = useState("settings");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState([]);

  // Help modal state
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const [settings, setSettings] = useState({
    totalHoursPerDay: 8,
    lateArrivalCutPerMinute: 0.5,
    absentMarksCut: 5,
    dailyUpdateMissCut: 2,
    halfDayCut: 3,
    workStartTime: "09:00",
    deadlineMissCut: 5,
  });

  const [lateForm, setLateForm] = useState({ userId: "", date: "", arrivalTime: "", expectedTime: "", lateByMinutes: 0, notes: "" });
  const [absentForm, setAbsentForm] = useState({ userId: "", date: "", notes: "" });
  const [updateMissForm, setUpdateMissForm] = useState({ userId: "", date: "", notes: "" });
  const [manualDeductForm, setManualDeductForm] = useState({ userId: "", date: "", marksToDeduct: 0, reason: "", notes: "" });

  // Manual Marks Add tab state
  const [manualMarksForm, setManualMarksForm] = useState({ userId: "", marksToAdd: "", reason: "", notes: "" });

  // Previous Record tab state
  const [prevRecordForm, setPrevRecordForm] = useState({ userId: "", totalMarks: "", marks: "", manualMarks: "", notes: "" });

  // Auto-Detect state
  const [detectDate, setDetectDate] = useState(new Date().toISOString().split("T")[0]);
  const [detectedList, setDetectedList] = useState([]);
  const [detecting, setDetecting] = useState(false);
  const [detectingAll, setDetectingAll] = useState(false);
  const [selectedLate, setSelectedLate] = useState(new Set());
  const [absentList, setAbsentList] = useState([]);
  const [selectedAbsent, setSelectedAbsent] = useState(new Set());
  const [missingUpdateList, setMissingUpdateList] = useState([]);
  const [selectedMissing, setSelectedMissing] = useState(new Set());
  const [bulkApplying, setBulkApplying] = useState(false);
  const [autoSubTab, setAutoSubTab] = useState("late");

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/score-deductions/settings");
      if (res.data.success) setSettings(res.data.data);
    } catch { toast.error("Failed to load settings"); }
    finally { setLoading(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/user/all-users");
      setUsers((res.data.users || []).filter((u) => u.role === "employee"));
    } catch { toast.error("Failed to load users"); }
  }, []);

  useEffect(() => { fetchSettings(); fetchUsers(); }, []);

  const calcLateMinutes = (arrival, expected) => {
    if (!arrival || !expected) return 0;
    const [ah, am] = arrival.split(":").map(Number);
    const [eh, em] = expected.split(":").map(Number);
    return Math.max(0, (ah * 60 + am) - (eh * 60 + em));
  };

  const handleLateTimeChange = (field, val) => {
    const updated = { ...lateForm, [field]: val };
    if (field === "arrivalTime" || field === "expectedTime") {
      updated.lateByMinutes = calcLateMinutes(
        field === "arrivalTime" ? val : lateForm.arrivalTime,
        field === "expectedTime" ? val : lateForm.expectedTime
      );
    }
    setLateForm(updated);
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes("")
  );

  const saveSettings = async () => {
    setSubmitting(true);
    try {
      await api.put("/score-deductions/settings", settings);
      toast.success("Settings saved successfully!");
    } catch { toast.error("Failed to save settings"); }
    finally { setSubmitting(false); }
  };

  const submitLate = async () => {
    if (!lateForm.userId || !lateForm.date || !lateForm.arrivalTime) {
      toast.error("User, date and arrival time are required"); return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/score-deductions/late-arrival", {
        ...lateForm,
        expectedTime: lateForm.expectedTime || settings.workStartTime,
      });
      toast.success(res.data.message);
      setLateForm({ userId: "", date: "", arrivalTime: "", expectedTime: "", lateByMinutes: 0, notes: "" });
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const submitAbsent = async () => {
    if (!absentForm.userId || !absentForm.date) { toast.error("User and date are required"); return; }
    setSubmitting(true);
    try {
      const res = await api.post("/score-deductions/absent", absentForm);
      toast.success(res.data.message);
      setAbsentForm({ userId: "", date: "", notes: "" });
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const submitUpdateMiss = async () => {
    if (!updateMissForm.userId || !updateMissForm.date) { toast.error("User and date are required"); return; }
    setSubmitting(true);
    try {
      const res = await api.post("/score-deductions/daily-update-miss", updateMissForm);
      toast.success(res.data.message);
      setUpdateMissForm({ userId: "", date: "", notes: "" });
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const submitManualDeduct = async () => {
    if (!manualDeductForm.userId || !manualDeductForm.date || !manualDeductForm.marksToDeduct || !manualDeductForm.reason) {
      toast.error("All fields required"); return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/score-deductions/manual", manualDeductForm);
      toast.success(res.data.message);
      setManualDeductForm({ userId: "", date: "", marksToDeduct: 0, reason: "", notes: "" });
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  // Manual Marks Add submit
  const submitManualMarks = async () => {
    if (!manualMarksForm.userId || !manualMarksForm.marksToAdd || !manualMarksForm.reason) {
      toast.error("Employee, marks to add and reason are required"); return;
    }
    if (Number(manualMarksForm.marksToAdd) <= 0) {
      toast.error("Marks to add must be greater than 0"); return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/user/manual-marks/${manualMarksForm.userId}`, {
        marksToAdd: Number(manualMarksForm.marksToAdd),
        reason: manualMarksForm.reason,
        notes: manualMarksForm.notes,
      });
      toast.success(res.data.message);
      setManualMarksForm({ userId: "", marksToAdd: "", reason: "", notes: "" });
      fetchUsers();
    } catch (e) { toast.error(e.response?.data?.message || "Failed to add marks"); }
    finally { setSubmitting(false); }
  };

  // Previous Record import submit
  const submitPreviousRecord = async () => {
    if (!prevRecordForm.userId || !prevRecordForm.totalMarks) {
      toast.error("Employee and total marks are required"); return;
    }
    setSubmitting(true);
    try {
      const payload = {
        totalMarks: Number(prevRecordForm.totalMarks),
        notes: prevRecordForm.notes,
      };
      if (prevRecordForm.marks !== "") payload.marks = Number(prevRecordForm.marks);
      if (prevRecordForm.manualMarks !== "") payload.manualMarks = Number(prevRecordForm.manualMarks);
      const res = await api.post(`/user/previous-record/${prevRecordForm.userId}`, payload);
      toast.success(res.data.message);
      setPrevRecordForm({ userId: "", totalMarks: "", marks: "", manualMarks: "", notes: "" });
      fetchUsers();
    } catch (e) { toast.error(e.response?.data?.message || "Failed to import record"); }
    finally { setSubmitting(false); }
  };

  const handleDetect = async () => {
    if (!detectDate) { toast.error("Please select a date"); return; }
    setDetecting(true);
    setDetectedList([]);
    setSelectedLate(new Set());
    try {
      const res = await api.get("/score-deductions/detect-late", { params: { date: detectDate } });
      if (res.data.success) {
        setDetectedList(res.data.data || []);
        const autoSel = new Set(
          (res.data.data || [])
            .filter((r) => r.isLate && !r.alreadyDeducted)
            .map((r) => r.userId?.toString())
        );
        setSelectedLate(autoSel);
        if (res.data.data.length === 0) toast("No attendance records found for this date");
        else toast.success(`Found ${res.data.lateCount} late, ${res.data.onTimeCount} on-time`);
      }
    } catch (e) { toast.error(e.response?.data?.message || "Detection failed"); }
    finally { setDetecting(false); }
  };

  const toggleSelect = (userId) => {
    setSelectedLate((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleBulkLate = async () => {
    const toApply = detectedList.filter(
      (r) => r.isLate && !r.alreadyDeducted && selectedLate.has(r.userId?.toString())
    );
    if (toApply.length === 0) { toast.error("No employees selected"); return; }
    setBulkApplying(true);
    try {
      const entries = toApply.map((r) => ({
        userId: r.userId,
        lateByMinutes: r.lateByMinutes,
        arrivalTime: r.arrivalTime,
        marksToDeduct: r.marksToDeduct,
      }));
      const res = await api.post("/score-deductions/bulk-late", { date: detectDate, entries });
      toast.success(res.data.message);
      await handleDetect();
    } catch (e) { toast.error(e.response?.data?.message || "Bulk apply failed"); }
    finally { setBulkApplying(false); }
  };

  const handleDetectAll = async () => {
    if (!detectDate) { toast.error("Please select a date"); return; }
    setDetectingAll(true);
    setAbsentList([]);
    setMissingUpdateList([]);
    setSelectedAbsent(new Set());
    setSelectedMissing(new Set());
    try {
      const [usersRes, attendanceRes, missingRes] = await Promise.all([
        api.get("/user/all-users"),
        api.get("/attendance/all", { params: { startDate: detectDate, endDate: detectDate, limit: 999 } }),
        api.get("/daily-updates/missing", { params: { date: detectDate } }),
      ]);
      const allEmp = (usersRes.data.users || []).filter(u => u.role === "employee");
      const markedIds = new Set((attendanceRes.data.data || []).map(r => r.employeeId?.toString()));
      const absent = allEmp.filter(e => !markedIds.has(e._id?.toString()));
      setAbsentList(absent);
      setSelectedAbsent(new Set(absent.map(e => e._id?.toString())));

      const missing = missingRes.data.missing || [];
      setMissingUpdateList(missing);
      setSelectedMissing(new Set(
        missing.filter(e => !e.penaltyAlreadyApplied).map(e => e._id?.toString())
      ));
      toast.success(`${absent.length} absent, ${missing.length} missed updates found`);
    } catch (e) { toast.error(e.response?.data?.message || "Detection failed"); }
    finally { setDetectingAll(false); }
  };

  const handleBulkAbsent = async () => {
    const toApply = absentList.filter(e => selectedAbsent.has(e._id?.toString()));
    if (!toApply.length) { toast.error("No employees selected"); return; }
    setBulkApplying(true);
    try {
      const res = await api.post("/score-deductions/bulk-absent", { date: detectDate, userIds: toApply.map(e => e._id) });
      toast.success(res.data.message);
      await handleDetectAll();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setBulkApplying(false); }
  };

  const handleBulkMissingUpdates = async () => {
    const toApply = missingUpdateList.filter(e => !e.penaltyAlreadyApplied && selectedMissing.has(e._id?.toString()));
    if (!toApply.length) { toast.error("No employees selected"); return; }
    setBulkApplying(true);
    try {
      const res = await api.post("/daily-updates/bulk-penalty", { date: detectDate, userIds: toApply.map(e => e._id) });
      toast.success(res.data.message);
      await handleDetectAll();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setBulkApplying(false); }
  };

  const UserSelect = ({ value, onChange }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      <option value="">-- Select Employee --</option>
      {users.map((u) => (
        <option key={u._id} value={u._id}>
          {u.name} — {u.marks ?? 0} marks
        </option>
      ))}
    </select>
  );

  if (loading) return <SSIPageLoader message="Loading..." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="bg-[var(--accent-primary)]/10 p-2.5 rounded-lg">
            <TrendingUp className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Attendance & Marks Management</h1>
            <p className="text-sm text-[var(--text-secondary)]">Deductions, manual marks, and previous record import</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabBtn active={activeTab === "auto"} onClick={() => setActiveTab("auto")} icon={Zap}>Auto-Detect</TabBtn>
        <TabBtn active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={Settings}>Settings</TabBtn>
        <TabBtn active={activeTab === "late"} onClick={() => setActiveTab("late")} icon={Clock}>Late Arrival</TabBtn>
        <TabBtn active={activeTab === "absent"} onClick={() => setActiveTab("absent")} icon={UserX}>Absent</TabBtn>
        <TabBtn active={activeTab === "update_miss"} onClick={() => setActiveTab("update_miss")} icon={AlertCircle}>Update Miss</TabBtn>
        <TabBtn active={activeTab === "manual_deduct"} onClick={() => setActiveTab("manual_deduct")} icon={Scissors}>Manual Deduction</TabBtn>
        <TabBtn active={activeTab === "manual_marks"} onClick={() => setActiveTab("manual_marks")} icon={PlusCircle}>Manual Marks Add</TabBtn>
        <TabBtn active={activeTab === "prev_record"} onClick={() => setActiveTab("prev_record")} icon={FileInput}>Previous Record</TabBtn>
      </div>

      {/* AUTO-DETECT TAB */}
      {activeTab === "auto" && (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[var(--accent-primary)]" />
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Auto-Detect All Deductions</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Late arrivals, absents, and daily update misses — detect in one go</p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 max-w-xs">
              <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Date</label>
              <input type="date" value={detectDate} max={new Date().toISOString().split("T")[0]}
                onChange={(e) => { setDetectDate(e.target.value); setDetectedList([]); setAbsentList([]); setMissingUpdateList([]); }}
                className={inputCls} />
            </div>
            <button onClick={handleDetect} disabled={detecting}
              className="inline-flex items-center gap-2 bg-[var(--warning)] hover:bg-[var(--warning)]/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
              {detecting ? <Loader2 size={15} className="animate-spin" /> : <Clock size={15} />}
              Detect Late
            </button>
            <button onClick={handleDetectAll} disabled={detectingAll}
              className="inline-flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-[var(--accent-primary)]/20 disabled:opacity-50">
              {detectingAll ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
              Detect Absent + Updates
            </button>
          </div>

          <div className="bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 rounded-lg px-4 py-3 text-xs text-[var(--text-secondary)] flex flex-wrap gap-3">
            <span className="flex items-center gap-1"><Clock size={12} /> <strong>Start:</strong> {settings.workStartTime}</span>
            <span className="flex items-center gap-1"><TrendingUp size={12} /> <strong>Late/min:</strong> {settings.lateArrivalCutPerMinute} marks</span>
            <span className="flex items-center gap-1"><UserX size={12} /> <strong>Absent:</strong> {settings.absentMarksCut} marks</span>
            <span className="flex items-center gap-1"><AlertCircle size={12} /> <strong>Update Miss:</strong> {settings.dailyUpdateMissCut} marks</span>
          </div>

          <div className="flex gap-0 border-b border-[var(--border-color)]">
            {[
              { key: "late", label: `Late (${detectedList.filter(r=>r.isLate).length})`, icon: Clock },
              { key: "absent", label: `Absent (${absentList.length})`, icon: UserX },
              { key: "updates", label: `Update Miss (${missingUpdateList.length})`, icon: AlertCircle },
            ].map(t => (
              <button key={t.key} onClick={() => setAutoSubTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition border-b-2 ${
                  autoSubTab === t.key
                    ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}>
                <t.icon size={14} />{t.label}
              </button>
            ))}
          </div>

          {/* Late sub-tab */}
          {autoSubTab === "late" && (
            detectedList.length === 0
              ? <p className="text-sm text-[var(--text-muted)] text-center py-6">Click "Detect Late" to scan attendance records</p>
              : <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-sm">
                      <span className="text-[var(--danger)] font-semibold">{detectedList.filter(r=>r.isLate).length} Late</span>
                      <span className="text-[var(--success)] font-semibold">{detectedList.filter(r=>!r.isLate).length} On-Time</span>
                      <span className="text-[var(--text-muted)]">{detectedList.filter(r=>r.alreadyDeducted).length} Done</span>
                    </div>
                    <button onClick={handleBulkLate} disabled={bulkApplying || !selectedLate.size}
                      className="inline-flex items-center gap-2 bg-[var(--danger)] hover:bg-[var(--danger)]/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40">
                      {bulkApplying ? <Loader2 size={14} className="animate-spin" /> : <Scissors size={14} />}
                      Apply ({selectedLate.size})
                    </button>
                  </div>
                  <div className="rounded-xl border border-[var(--border-color)] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                        <tr>
                          <th className="px-3 py-3 w-10">
                            <button onClick={() => {
                              const el = detectedList.filter(r=>r.isLate&&!r.alreadyDeducted).map(r=>r.userId?.toString());
                              setSelectedLate(selectedLate.size === el.length ? new Set() : new Set(el));
                            }} className="text-[var(--text-muted)] hover:text-[var(--accent-primary)]">
                              {selectedLate.size > 0 ? <CheckSquare size={15}/> : <Square size={15}/>}
                            </button>
                          </th>
                          {["Employee","Arrived","Expected","Late By","Cut","Status"].map(h=>(
                            <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]">
                        {detectedList.map(r => (
                          <tr key={r.userId?.toString()}
                            className={`transition-colors ${r.isLate&&!r.alreadyDeducted?"hover:bg-[var(--danger)]/5 cursor-pointer":"opacity-55"}`}
                            onClick={()=>r.isLate&&!r.alreadyDeducted&&toggleSelect(r.userId?.toString())}>
                            <td className="px-3 py-3">
                              {r.isLate&&!r.alreadyDeducted&&(selectedLate.has(r.userId?.toString())?<CheckSquare size={15} className="text-[var(--accent-primary)]"/>:<Square size={15} className="text-[var(--text-muted)]"/>)}
                            </td>
                            <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{r.userName}</td>
                            <td className="px-3 py-3"><span className={`font-mono font-bold ${r.isLate?"text-[var(--danger)]":"text-[var(--success)]"}`}>{r.arrivalTime}</span></td>
                            <td className="px-3 py-3 font-mono text-[var(--text-muted)] text-xs">{r.expectedTime}</td>
                            <td className="px-3 py-3">{r.isLate?<span className="text-[var(--warning)] font-semibold">{r.lateByMinutes} min</span>:<span className="text-[var(--success)] text-xs">On time</span>}</td>
                            <td className="px-3 py-3">{r.isLate?<span className="text-[var(--danger)] font-bold">-{r.marksToDeduct}</span>:<span className="text-[var(--text-muted)]">—</span>}</td>
                            <td className="px-3 py-3">
                              {r.alreadyDeducted
                                ?<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20"><CheckCircle size={10}/>Done</span>
                                :r.isLate
                                  ?<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20">Pending</span>
                                  :<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20">On Time</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
          )}

          {/* Absent sub-tab */}
          {autoSubTab === "absent" && (
            absentList.length === 0
              ? <p className="text-sm text-[var(--text-muted)] text-center py-6">Click "Detect Absent + Updates" to find absent employees</p>
              : <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[var(--text-secondary)]">
                      <strong className="text-[var(--danger)]">{absentList.length}</strong> absent — each loses <strong className="text-[var(--danger)]">{settings.absentMarksCut} marks</strong>
                    </p>
                    <button onClick={handleBulkAbsent} disabled={bulkApplying || !selectedAbsent.size}
                      className="inline-flex items-center gap-2 bg-[var(--danger)] hover:bg-[var(--danger)]/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40">
                      {bulkApplying ? <Loader2 size={14} className="animate-spin"/> : <UserX size={14}/>}
                      Apply Absent Cut ({selectedAbsent.size})
                    </button>
                  </div>
                  <div className="space-y-2">
                    {absentList.map(e => (
                      <div key={e._id} onClick={()=>{
                        const s=new Set(selectedAbsent);
                        s.has(e._id?.toString())?s.delete(e._id?.toString()):s.add(e._id?.toString());
                        setSelectedAbsent(s);
                      }}
                        className="flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-3 cursor-pointer hover:border-[var(--danger)]/40 transition">
                        {selectedAbsent.has(e._id?.toString())?<CheckSquare size={15} className="text-[var(--accent-primary)] flex-shrink-0"/>:<Square size={15} className="text-[var(--text-muted)] flex-shrink-0"/>}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{e.name}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate">{e.email}</p>
                        </div>
                        <span className="text-xs text-[var(--text-muted)] flex-shrink-0">Marks: {e.marks ?? 0}</span>
                        <span className="text-sm font-bold text-[var(--danger)] flex-shrink-0">-{settings.absentMarksCut}</span>
                      </div>
                    ))}
                  </div>
                </div>
          )}

          {/* Update Miss sub-tab */}
          {autoSubTab === "updates" && (
            missingUpdateList.length === 0
              ? <p className="text-sm text-[var(--text-muted)] text-center py-6">Click "Detect Absent + Updates" to find missing daily updates</p>
              : <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[var(--text-secondary)]">
                      <strong className="text-purple-500">{missingUpdateList.length}</strong> missed updates — each loses <strong className="text-purple-500">{settings.dailyUpdateMissCut} marks</strong>
                    </p>
                    <button onClick={handleBulkMissingUpdates} disabled={bulkApplying || !selectedMissing.size}
                      className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40">
                      {bulkApplying ? <Loader2 size={14} className="animate-spin"/> : <AlertCircle size={14}/>}
                      Apply Update Miss Cut ({selectedMissing.size})
                    </button>
                  </div>
                  <div className="space-y-2">
                    {missingUpdateList.map(e => (
                      <div key={e._id} onClick={()=>{
                        if(e.penaltyAlreadyApplied) return;
                        const s=new Set(selectedMissing);
                        s.has(e._id?.toString())?s.delete(e._id?.toString()):s.add(e._id?.toString());
                        setSelectedMissing(s);
                      }}
                        className={`flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-3 transition ${e.penaltyAlreadyApplied?"opacity-50":"cursor-pointer hover:border-purple-500/40"}`}>
                        {e.penaltyAlreadyApplied
                          ?<CheckCircle size={15} className="text-[var(--success)] flex-shrink-0"/>
                          :selectedMissing.has(e._id?.toString())?<CheckSquare size={15} className="text-[var(--accent-primary)] flex-shrink-0"/>:<Square size={15} className="text-[var(--text-muted)] flex-shrink-0"/>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{e.name}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate">{e.email}</p>
                        </div>
                        <span className="text-xs text-[var(--text-muted)] flex-shrink-0">Marks: {e.marks ?? 0}</span>
                        {e.penaltyAlreadyApplied
                          ?<span className="text-xs text-[var(--success)] font-semibold flex-shrink-0">Already Applied</span>
                          :<span className="text-sm font-bold text-purple-500 flex-shrink-0">-{settings.dailyUpdateMissCut}</span>
                        }
                      </div>
                    ))}
                  </div>
                </div>
          )}
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === "settings" && (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Mark Deduction Settings</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Work Start Time" required>
              <input type="time" value={settings.workStartTime} onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Total Hours Per Day" required>
              <input type="number" min="1" max="24" value={settings.totalHoursPerDay} onChange={(e) => setSettings({ ...settings, totalHoursPerDay: Number(e.target.value) })} className={inputCls} />
            </Field>
            <Field label="Late Arrival Cut (marks per minute)" required>
              <input type="number" min="0" step="0.1" value={settings.lateArrivalCutPerMinute} onChange={(e) => setSettings({ ...settings, lateArrivalCutPerMinute: Number(e.target.value) })} className={inputCls} />
            </Field>
            <Field label="Absent Marks Cut" required>
              <input type="number" min="0" value={settings.absentMarksCut} onChange={(e) => setSettings({ ...settings, absentMarksCut: Number(e.target.value) })} className={inputCls} />
            </Field>
            <Field label="Daily Update Miss Cut" required>
              <input type="number" min="0" value={settings.dailyUpdateMissCut} onChange={(e) => setSettings({ ...settings, dailyUpdateMissCut: Number(e.target.value) })} className={inputCls} />
            </Field>
            <Field label="Half Day Cut" required>
              <input type="number" min="0" value={settings.halfDayCut} onChange={(e) => setSettings({ ...settings, halfDayCut: Number(e.target.value) })} className={inputCls} />
            </Field>
            <Field label="Deadline Miss Cut" required>
              <input type="number" min="0" value={settings.deadlineMissCut ?? 5} onChange={(e) => setSettings({ ...settings, deadlineMissCut: Number(e.target.value) })} className={inputCls} />
            </Field>
          </div>
          <div className="pt-2 border-t border-[var(--border-color)]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[var(--text-muted)] mb-4">
              <div className="bg-[var(--bg-secondary)] rounded-lg p-3">
                <p className="font-medium text-[var(--warning)]">Late 10 min</p>
                <p className="text-[var(--text-primary)] font-bold text-sm">{(10 * settings.lateArrivalCutPerMinute).toFixed(1)} marks cut</p>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-lg p-3">
                <p className="font-medium text-[var(--danger)]">Absent</p>
                <p className="text-[var(--text-primary)] font-bold text-sm">{settings.absentMarksCut} marks cut</p>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-lg p-3">
                <p className="font-medium text-purple-500">Update Miss</p>
                <p className="text-[var(--text-primary)] font-bold text-sm">{settings.dailyUpdateMissCut} marks cut</p>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-lg p-3">
                <p className="font-medium text-[var(--accent-primary)]">Deadline Miss</p>
                <p className="text-[var(--text-primary)] font-bold text-sm">{settings.deadlineMissCut ?? 5} marks cut</p>
              </div>
            </div>
            <button onClick={saveSettings} disabled={submitting} className="inline-flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] px-5 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-[var(--accent-primary)]/20 disabled:opacity-50">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* LATE ARRIVAL TAB */}
      {activeTab === "late" && (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--warning)]" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Assign Late Arrival Deduction</h2>
          </div>
          {lateForm.lateByMinutes > 0 && (
            <div className="bg-[var(--warning)]/10 border border-[var(--warning)]/30 rounded-lg px-4 py-3 flex items-center gap-3">
              <AlertTriangle size={16} className="text-[var(--warning)] flex-shrink-0" />
              <p className="text-sm text-[var(--text-primary)]">
                Late by <strong>{lateForm.lateByMinutes} minutes</strong> — <strong className="text-[var(--warning)]">{(lateForm.lateByMinutes * settings.lateArrivalCutPerMinute).toFixed(2)} marks</strong> will be deducted
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Employee" required><UserSelect value={lateForm.userId} onChange={(v) => setLateForm({ ...lateForm, userId: v })} /></Field>
            <Field label="Date" required>
              <input type="date" value={lateForm.date} max={new Date().toISOString().split("T")[0]} onChange={(e) => setLateForm({ ...lateForm, date: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Expected Start Time" required>
              <input type="time" value={lateForm.expectedTime || settings.workStartTime} onChange={(e) => handleLateTimeChange("expectedTime", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Actual Arrival Time" required>
              <input type="time" value={lateForm.arrivalTime} onChange={(e) => handleLateTimeChange("arrivalTime", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Late By (minutes) — auto calculated">
              <input type="number" min="0" value={lateForm.lateByMinutes} onChange={(e) => setLateForm({ ...lateForm, lateByMinutes: Number(e.target.value) })} className={inputCls} />
            </Field>
            <Field label="Notes (optional)">
              <input type="text" value={lateForm.notes} onChange={(e) => setLateForm({ ...lateForm, notes: e.target.value })} className={inputCls} placeholder="Any additional notes..." />
            </Field>
          </div>
          <button onClick={submitLate} disabled={submitting} className="inline-flex items-center gap-2 bg-[var(--warning)] hover:bg-[var(--warning)]/80 text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-lg disabled:opacity-50">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
            Apply Late Arrival Deduction
          </button>
        </div>
      )}

      {/* ABSENT TAB */}
      {activeTab === "absent" && (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 space-y-5">
          <div className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-[var(--danger)]" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Assign Absent Deduction</h2>
          </div>
          <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-lg px-4 py-3 flex items-center gap-3">
            <AlertTriangle size={16} className="text-[var(--danger)] flex-shrink-0" />
            <p className="text-sm text-[var(--text-primary)]">
              Absent deduction: <strong className="text-[var(--danger)]">{settings.absentMarksCut} marks</strong> will be deducted
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Employee" required><UserSelect value={absentForm.userId} onChange={(v) => setAbsentForm({ ...absentForm, userId: v })} /></Field>
            <Field label="Date" required>
              <input type="date" value={absentForm.date} max={new Date().toISOString().split("T")[0]} onChange={(e) => setAbsentForm({ ...absentForm, date: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Notes (optional)">
              <input type="text" value={absentForm.notes} onChange={(e) => setAbsentForm({ ...absentForm, notes: e.target.value })} className={inputCls} placeholder="Reason for absence..." />
            </Field>
          </div>
          <button onClick={submitAbsent} disabled={submitting} className="inline-flex items-center gap-2 bg-[var(--danger)] hover:bg-[var(--danger)]/80 text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-lg disabled:opacity-50">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserX size={16} />}
            Apply Absent Deduction
          </button>
        </div>
      )}

      {/* DAILY UPDATE MISS TAB */}
      {activeTab === "update_miss" && (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 space-y-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-500" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Assign Daily Update Miss Deduction</h2>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg px-4 py-3 flex items-center gap-3">
            <AlertCircle size={16} className="text-purple-500 flex-shrink-0" />
            <p className="text-sm text-[var(--text-primary)]">
              Update miss deduction: <strong className="text-purple-500">{settings.dailyUpdateMissCut} marks</strong> will be deducted
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Employee" required><UserSelect value={updateMissForm.userId} onChange={(v) => setUpdateMissForm({ ...updateMissForm, userId: v })} /></Field>
            <Field label="Date" required>
              <input type="date" value={updateMissForm.date} max={new Date().toISOString().split("T")[0]} onChange={(e) => setUpdateMissForm({ ...updateMissForm, date: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Notes (optional)">
              <input type="text" value={updateMissForm.notes} onChange={(e) => setUpdateMissForm({ ...updateMissForm, notes: e.target.value })} className={inputCls} placeholder="Additional notes..." />
            </Field>
          </div>
          <button onClick={submitUpdateMiss} disabled={submitting} className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-lg disabled:opacity-50">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
            Apply Daily Update Miss Deduction
          </button>
        </div>
      )}

      {/* MANUAL DEDUCTION TAB */}
      {activeTab === "manual_deduct" && (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-[var(--text-secondary)]" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Manual Mark Deduction</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Employee" required><UserSelect value={manualDeductForm.userId} onChange={(v) => setManualDeductForm({ ...manualDeductForm, userId: v })} /></Field>
            <Field label="Date" required>
              <input type="date" value={manualDeductForm.date} max={new Date().toISOString().split("T")[0]} onChange={(e) => setManualDeductForm({ ...manualDeductForm, date: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Marks to Deduct" required>
              <input type="number" min="0" step="0.5" value={manualDeductForm.marksToDeduct} onChange={(e) => setManualDeductForm({ ...manualDeductForm, marksToDeduct: Number(e.target.value) })} className={inputCls} />
            </Field>
            <Field label="Reason" required>
              <input type="text" value={manualDeductForm.reason} onChange={(e) => setManualDeductForm({ ...manualDeductForm, reason: e.target.value })} className={inputCls} placeholder="Reason for deduction..." />
            </Field>
            <Field label="Notes (optional)">
              <input type="text" value={manualDeductForm.notes} onChange={(e) => setManualDeductForm({ ...manualDeductForm, notes: e.target.value })} className={inputCls} placeholder="Additional notes..." />
            </Field>
          </div>
          {manualDeductForm.marksToDeduct > 0 && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-4 py-3">
              <p className="text-sm text-[var(--text-secondary)]">
                Will deduct <strong className="text-[var(--danger)]">{manualDeductForm.marksToDeduct} marks</strong>
                {manualDeductForm.reason && <> for: <em>"{manualDeductForm.reason}"</em></>}
              </p>
            </div>
          )}
          <button onClick={submitManualDeduct} disabled={submitting} className="inline-flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] px-5 py-2 rounded-lg text-sm font-medium transition shadow-lg disabled:opacity-50">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Scissors size={16} />}
            Apply Manual Deduction
          </button>
        </div>
      )}

      {/* MANUAL MARKS ADD TAB */}
      {activeTab === "manual_marks" && (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[var(--success)]" />
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Manual Marks Add</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Award bonus marks to an employee — will be added to existing marks</p>
              </div>
            </div>
            <button
              onClick={() => setHelpModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition px-3 py-1.5 rounded-lg border border-[var(--border-color)] hover:border-[var(--accent-primary)]/30"
            >
              <HelpCircle size={16} />
              Help
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Employee" required>
              <UserSelect value={manualMarksForm.userId} onChange={(v) => setManualMarksForm({ ...manualMarksForm, userId: v })} />
            </Field>
            <Field label="Marks to Add" required>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={manualMarksForm.marksToAdd}
                onChange={(e) => setManualMarksForm({ ...manualMarksForm, marksToAdd: e.target.value })}
                className={inputCls}
                placeholder="e.g. 5"
              />
            </Field>
            <Field label="Reason" required>
              <input
                type="text"
                value={manualMarksForm.reason}
                onChange={(e) => setManualMarksForm({ ...manualMarksForm, reason: e.target.value })}
                className={inputCls}
                placeholder="e.g. Extra effort on project delivery"
              />
            </Field>
            <Field label="Notes (optional)">
              <input
                type="text"
                value={manualMarksForm.notes}
                onChange={(e) => setManualMarksForm({ ...manualMarksForm, notes: e.target.value })}
                className={inputCls}
                placeholder="Additional context..."
              />
            </Field>
          </div>

          {manualMarksForm.userId && manualMarksForm.marksToAdd > 0 && (() => {
            const selectedUser = users.find(u => u._id === manualMarksForm.userId);
            if (!selectedUser) return null;
            const current = selectedUser.marks ?? 0;
            const adding = Number(manualMarksForm.marksToAdd);
            const after = current + adding;
            return (
              <div className="bg-[var(--bg-secondary)] border border-[var(--success)]/30 rounded-lg px-4 py-3 flex items-center gap-4">
                <Star size={18} className="text-[var(--success)] flex-shrink-0" />
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  <span className="text-[var(--text-secondary)]">{selectedUser.name}</span>
                  <span className="font-bold text-[var(--text-primary)]">{current}</span>
                  <span className="text-[var(--text-muted)]">+</span>
                  <span className="font-bold text-[var(--success)]">{adding}</span>
                  <span className="text-[var(--text-muted)]">=</span>
                  <span className="font-bold text-[var(--success)] text-base">{after} marks</span>
                </div>
              </div>
            );
          })()}

          <button
            onClick={submitManualMarks}
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-[var(--success)] hover:bg-[var(--success)]/80 text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-lg disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
            Add Marks
          </button>
        </div>
      )}

      {/* PREVIOUS RECORD TAB */}
      {activeTab === "prev_record" && (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileInput className="w-5 h-5 text-[var(--accent-primary)]" />
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Previous Record Import</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Set previous scoring record when adding a new employee</p>
              </div>
            </div>
            <button
              onClick={() => setHelpModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition px-3 py-1.5 rounded-lg border border-[var(--border-color)] hover:border-[var(--accent-primary)]/30"
            >
              <HelpCircle size={16} />
              Help
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Employee" required>
              <UserSelect value={prevRecordForm.userId} onChange={(v) => setPrevRecordForm({ ...prevRecordForm, userId: v })} />
            </Field>
            <Field label="Total (Base) Marks" required>
              <input
                type="number"
                min="0"
                value={prevRecordForm.totalMarks}
                onChange={(e) => setPrevRecordForm({ ...prevRecordForm, totalMarks: e.target.value })}
                className={inputCls}
                placeholder="e.g. 100"
              />
            </Field>
            <Field label="Current Marks (optional)">
              <input
                type="number"
                min="0"
                value={prevRecordForm.marks}
                onChange={(e) => setPrevRecordForm({ ...prevRecordForm, marks: e.target.value })}
                className={inputCls}
                placeholder="Blank = same as Total Marks"
              />
            </Field>
            <Field label="Manual / Bonus Marks (optional)">
              <input
                type="number"
                min="0"
                value={prevRecordForm.manualMarks}
                onChange={(e) => setPrevRecordForm({ ...prevRecordForm, manualMarks: e.target.value })}
                className={inputCls}
                placeholder="Previously awarded bonus marks"
              />
            </Field>
            <Field label="Notes (optional)">
              <input
                type="text"
                value={prevRecordForm.notes}
                onChange={(e) => setPrevRecordForm({ ...prevRecordForm, notes: e.target.value })}
                className={inputCls}
                placeholder="e.g. Transferred from old system"
              />
            </Field>
          </div>

          {prevRecordForm.userId && prevRecordForm.totalMarks !== "" && (() => {
            const selectedUser = users.find(u => u._id === prevRecordForm.userId);
            if (!selectedUser) return null;
            const total = Number(prevRecordForm.totalMarks);
            const manual = prevRecordForm.manualMarks !== "" ? Number(prevRecordForm.manualMarks) : 0;
            const current = prevRecordForm.marks !== "" ? Number(prevRecordForm.marks) : total + manual;
            return (
              <div className="bg-[var(--bg-secondary)] border border-[var(--accent-primary)]/30 rounded-lg px-4 py-3">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Preview for {selectedUser.name}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div><span className="text-[var(--text-muted)]">Base Marks: </span><strong className="text-[var(--text-primary)]">{total}</strong></div>
                  {manual > 0 && <div><span className="text-[var(--text-muted)]">Bonus Marks: </span><strong className="text-[var(--success)]">+{manual}</strong></div>}
                  <div><span className="text-[var(--text-muted)]">Current Marks: </span><strong className="text-[var(--accent-primary)]">{current}</strong></div>
                </div>
              </div>
            );
          })()}

          <button
            onClick={submitPreviousRecord}
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] px-5 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-[var(--accent-primary)]/20 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <FileInput size={16} />}
            Import Previous Record
          </button>
        </div>
      )}

      {/* Help Modal */}
      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        title="How This Works"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-[var(--text-primary)] text-sm">When to use:</h4>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              When a new employee joins who already has a scoring record from a previous system — you can set their existing marks here.
            </p>
          </div>
          <div className="border-t border-[var(--border-color)] pt-3">
            <h4 className="font-semibold text-[var(--text-primary)] text-sm">Field Explanations:</h4>
            <ul className="mt-2 space-y-2 text-sm text-[var(--text-secondary)]">
              <li>
                <strong className="text-[var(--text-primary)]">Total (Base) Marks</strong>
                <span className="block text-xs text-[var(--text-muted)]">The base marks assigned to this employee. This field is required.</span>
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Current Marks</strong>
                <span className="block text-xs text-[var(--text-muted)]">The remaining marks the employee currently has. Leave blank to auto-set from Total Marks.</span>
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Manual / Bonus Marks</strong>
                <span className="block text-xs text-[var(--text-muted)]">Any bonus marks that were previously awarded (optional).</span>
              </li>
            </ul>
          </div>
        </div>
      </HelpModal>
    </div>
  );
};

export default AttendanceMarking;
