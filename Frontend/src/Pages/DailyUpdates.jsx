import React, { useState, useEffect, useCallback } from "react";
import api from "../service/api.js";
import SSIPageLoader from "../components/SSIPageLoader";
import toast from "react-hot-toast";
import {
  Send, Edit3, Calendar, CheckCircle, Clock,
  Loader2, Plus, X, AlertCircle, FileText,
  ChevronLeft, ChevronRight, RefreshCw,
} from "lucide-react";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const toDateInput = (d) => {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
};

// ─── Task Row in Form ─────────────────────────────────────────────
const TaskRow = ({ task, index, onChange, onRemove }) => (
  <div className="bg-[#f0ebe5] rounded-xl p-3 space-y-2 border border-[#e5ddd5]">
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold text-[#4a3f38]">Task #{index + 1}</p>
      <button onClick={() => onRemove(index)} className="p-1 text-[#c0392b]/60 hover:text-[#c0392b] rounded-lg hover:bg-[#c0392b]/10 transition">
        <X size={14} />
      </button>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <input
        type="text" placeholder="Task name" value={task.taskName}
        onChange={(e) => onChange(index, "taskName", e.target.value)}
        className="col-span-2 bg-white border border-[#e5ddd5] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2c1810] text-[#2c1810]"
      />
      <input
        type="text" placeholder="Project name" value={task.projectName}
        onChange={(e) => onChange(index, "projectName", e.target.value)}
        className="bg-white border border-[#e5ddd5] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2c1810] text-[#2c1810]"
      />
      <input
        type="text" placeholder="Progress (e.g. 80%)" value={task.progress}
        onChange={(e) => onChange(index, "progress", e.target.value)}
        className="bg-white border border-[#e5ddd5] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2c1810] text-[#2c1810]"
      />
      <input
        type="number" placeholder="Hours spent" min="0" value={task.hoursSpent}
        onChange={(e) => onChange(index, "hoursSpent", Number(e.target.value))}
        className="bg-white border border-[#e5ddd5] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2c1810] text-[#2c1810]"
      />
    </div>
  </div>
);

const DailyUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [todaySubmitted, setTodaySubmitted] = useState(false);
  const [todayUpdate, setTodayUpdate] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    date: toDateInput(new Date()),
    updateText: "",
    hoursWorked: 0,
    tasksWorkedOn: [],
  });

  const LIMIT = 10;

  const fetchUpdates = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get("/daily-updates/my", { params: { page: p, limit: LIMIT } });
      if (res.data.success) {
        setUpdates(res.data.data || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        setTodaySubmitted(res.data.todaySubmitted || false);
        setTodayUpdate(res.data.todayUpdate);
        setPage(p);
      }
    } catch { toast.error("Failed to load updates"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUpdates(); }, []);

  const addTask = () => {
    setForm({
      ...form,
      tasksWorkedOn: [...form.tasksWorkedOn, { taskName: "", projectName: "", progress: "", hoursSpent: 0 }],
    });
  };

  const removeTask = (idx) => {
    setForm({ ...form, tasksWorkedOn: form.tasksWorkedOn.filter((_, i) => i !== idx) });
  };

  const changeTask = (idx, field, val) => {
    const updated = [...form.tasksWorkedOn];
    updated[idx][field] = val;
    setForm({ ...form, tasksWorkedOn: updated });
  };

  const openCreate = () => {
    setEditMode(false);
    setShowForm(true);
    setForm({ date: toDateInput(new Date()), updateText: "", hoursWorked: 0, tasksWorkedOn: [] });
  };

  const openEdit = () => {
    if (!todayUpdate) return;
    setEditMode(true);
    setEditId(todayUpdate._id);
    setShowForm(true);
    setForm({
      date: toDateInput(todayUpdate.date),
      updateText: todayUpdate.updateText,
      hoursWorked: todayUpdate.hoursWorked || 0,
      tasksWorkedOn: todayUpdate.tasksWorkedOn || [],
    });
  };

  const handleSubmit = async () => {
    if (!form.updateText || form.updateText.trim().length < 10) {
      toast.error("Update text must be at least 10 characters");
      return;
    }
    setSubmitting(true);
    try {
      if (editMode && editId) {
        await api.put(`/daily-updates/${editId}/edit`, form);
        toast.success("Update edited successfully!");
      } else {
        await api.post("/daily-updates/submit", form);
        toast.success("Daily update submitted!");
      }
      setShowForm(false);
      fetchUpdates(page);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && updates.length === 0) return <SSIPageLoader message="Loading updates..." />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[#faf7f3] rounded-2xl border border-[#e5ddd5] px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#2c1810]">Daily Updates</h1>
            <p className="text-sm text-[#8a7a6a] mt-0.5">Submit your daily progress report</p>
          </div>
          <div className="flex items-center gap-2">
            {todaySubmitted ? (
              <button onClick={openEdit} className="inline-flex items-center gap-2 bg-[#f0ebe5] hover:bg-[#e8e0d8] text-[#2c1810] border border-[#e5ddd5] px-4 py-2 rounded-xl text-sm font-semibold transition">
                <Edit3 size={16} /> Edit Today's Update
              </button>
            ) : (
              <button onClick={openCreate} className="inline-flex items-center gap-2 bg-[#2c1810] hover:bg-[#4a3f38] text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-lg">
                <Plus size={16} /> Submit Daily Update
              </button>
            )}
            <button onClick={() => fetchUpdates(page)} className="p-2 bg-[#f0ebe5] border border-[#e5ddd5] rounded-xl hover:bg-[#e8e0d8] text-[#4a3f38] transition">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Today status */}
        <div className={`mt-4 rounded-xl border px-4 py-3 flex items-center gap-3 ${
          todaySubmitted ? "bg-[#4CAF50]/10 border-[#4CAF50]/30" : "bg-[#f0a500]/10 border-[#f0a500]/30"
        }`}>
          {todaySubmitted
            ? <><CheckCircle size={18} className="text-[#4CAF50]" /><p className="text-sm font-medium text-[#2c1810]">Today's update has been submitted!</p></>
            : <><AlertCircle size={18} className="text-[#f0a500]" /><p className="text-sm font-medium text-[#2c1810]">You haven't submitted today's update yet. Missing updates may result in mark deductions.</p></>}
        </div>
      </div>

      {/* Update Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-[#faf7f3] rounded-2xl border border-[#e5ddd5] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#faf7f3] border-b border-[#e5ddd5] px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#2c1810] flex items-center gap-2">
                <FileText size={18} />
                {editMode ? "Edit Today's Update" : "Submit Daily Update"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-[#f0ebe5] text-[#8a7a6a]"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8a7a6a] uppercase tracking-wider mb-1.5">Date</label>
                <input
                  type="date" value={form.date} max={toDateInput(new Date())}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  disabled={editMode}
                  className="w-full bg-white border border-[#e5ddd5] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2c1810] text-[#2c1810] disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8a7a6a] uppercase tracking-wider mb-1.5">Daily Update <span className="text-[#c0392b]">*</span></label>
                <textarea
                  rows={5} value={form.updateText}
                  onChange={(e) => setForm({ ...form, updateText: e.target.value })}
                  placeholder="Describe what you worked on today, progress made, blockers faced, and plans for tomorrow..."
                  className="w-full bg-white border border-[#e5ddd5] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2c1810] text-[#2c1810] resize-none"
                />
                <p className="text-xs text-[#8a7a6a] mt-1">{form.updateText.length} characters (min 10)</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8a7a6a] uppercase tracking-wider mb-1.5">Hours Worked Today</label>
                <input type="number" min="0" max="24" step="0.5" value={form.hoursWorked} onChange={(e) => setForm({ ...form, hoursWorked: Number(e.target.value) })} className="w-full bg-white border border-[#e5ddd5] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2c1810] text-[#2c1810]" />
              </div>

              {/* Tasks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#8a7a6a] uppercase tracking-wider">Tasks Worked On</label>
                  <button onClick={addTask} className="inline-flex items-center gap-1 text-xs text-[#2c1810] hover:bg-[#f0ebe5] px-2 py-1 rounded-lg transition">
                    <Plus size={12} /> Add Task
                  </button>
                </div>
                <div className="space-y-2">
                  {form.tasksWorkedOn.map((t, i) => (
                    <TaskRow key={i} task={t} index={i} onChange={changeTask} onRemove={removeTask} />
                  ))}
                  {form.tasksWorkedOn.length === 0 && <p className="text-xs text-[#8a7a6a] italic">No tasks added yet</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-[#e5ddd5]">
                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 bg-[#f0ebe5] border border-[#e5ddd5] text-[#4a3f38] rounded-xl text-sm font-medium transition">Cancel</button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 px-4 py-2 bg-[#2c1810] hover:bg-[#4a3f38] text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {editMode ? "Save Changes" : "Submit Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Past Updates List */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-[#8a7a6a] uppercase tracking-wider px-1">Update History ({total})</p>
        {updates.length === 0 ? (
          <div className="bg-[#faf7f3] rounded-2xl border border-[#e5ddd5] p-10 text-center">
            <Calendar className="w-10 h-10 text-[#d4c8bc] mx-auto mb-3" />
            <p className="text-sm text-[#8a7a6a]">No daily updates yet</p>
          </div>
        ) : (
          updates.map((u) => (
            <div key={u._id} className={`bg-[#faf7f3] rounded-2xl border p-5 space-y-3 ${u.status === "missed" ? "border-[#c0392b]/30 bg-[#c0392b]/5" : "border-[#e5ddd5]"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#2c1810]">{fmtDate(u.date)}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border mt-1 ${
                    u.status === "submitted" ? "bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20" : "bg-[#c0392b]/10 text-[#c0392b] border-[#c0392b]/20"
                  }`}>
                    {u.status === "submitted" ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                    {u.status}
                  </span>
                </div>
                <div className="text-right text-xs text-[#8a7a6a]">
                  {u.hoursWorked > 0 && <p>{u.hoursWorked}h worked</p>}
                  {u.penaltyApplied && <p className="text-[#c0392b] font-semibold">-{u.penaltyMarks} marks penalty</p>}
                </div>
              </div>
              {u.status !== "missed" && <p className="text-sm text-[#4a3f38] leading-relaxed">{u.updateText}</p>}
              {u.tasksWorkedOn?.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#e5ddd5]">
                  {u.tasksWorkedOn.map((t, i) => (
                    <div key={i} className="bg-[#f0ebe5] rounded-lg p-2 text-xs">
                      <p className="font-semibold text-[#2c1810]">{t.taskName}</p>
                      <p className="text-[#8a7a6a]">{t.projectName}</p>
                      {t.progress && <p className="text-[#4CAF50] font-medium">{t.progress}</p>}
                    </div>
                  ))}
                </div>
              )}
              {u.adminRemarks && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                  <span className="font-semibold">Admin remarks:</span> {u.adminRemarks}
                </div>
              )}
            </div>
          ))
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button disabled={page <= 1} onClick={() => fetchUpdates(page - 1)} className="p-2 rounded-xl border border-[#e5ddd5] disabled:opacity-40 hover:bg-[#f0ebe5]"><ChevronLeft size={16} /></button>
            <span className="text-xs text-[#8a7a6a]">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => fetchUpdates(page + 1)} className="p-2 rounded-xl border border-[#e5ddd5] disabled:opacity-40 hover:bg-[#f0ebe5]"><ChevronRight size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyUpdates;
