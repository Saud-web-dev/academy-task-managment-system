import React, { useState, useEffect, useCallback } from "react";
import api from "../../service/api.js";
import SSIPageLoader from "../../components/SSIPageLoader";
import toast, { Toaster } from "react-hot-toast";
import {
  Plus, Search, Filter, Loader2, X, Save, Trash2, Edit2,
  Receipt, Calendar, DollarSign, Tag, Building2, FileText,
  ChevronDown, MoreHorizontal, CheckCircle, Clock, XCircle,
  Download, RefreshCw,
} from "lucide-react";

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Card", "JazzCash", "EasyPaisa", "Other"];
const STATUSES = ["Paid", "Pending", "Cancelled"];

const fmtCurrency = (v) => `PKR ${Number(v || 0).toLocaleString("en-PK")}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" }) : "—";

const StatusBadge = ({ status }) => {
  const cfg = {
    Paid: { icon: CheckCircle, cls: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20" },
    Pending: { icon: Clock, cls: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20" },
    Cancelled: { icon: XCircle, cls: "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20" },
  };
  const { icon: Icon, cls } = cfg[status] || cfg.Pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
      <Icon className="w-3 h-3" />{status}
    </span>
  );
};

const inputCls = "w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none transition placeholder:text-[var(--text-muted)]";
const labelCls = "block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1";

const emptyForm = {
  title: "", description: "", amount: "", category: "",
  expenseDate: new Date().toISOString().split("T")[0],
  paymentMethod: "Cash", vendor: "", invoiceNumber: "",
  project: "", status: "Paid", notes: "",
};

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({ search: "", category: "", project: "", status: "", paymentMethod: "", startDate: "", endDate: "" });
  const [sortBy, setSortBy] = useState("expenseDate");
  const [order, setOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [receiptFile, setReceiptFile] = useState(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, sortBy, order, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const res = await api.get("/expenses", { params });
      if (res.data.success) {
        setExpenses(res.data.data || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        setTotalAmount(res.data.totalAmount || 0);
      }
    } catch { toast.error("Failed to load expenses"); }
    finally { setLoading(false); }
  }, [page, sortBy, order, filters]);

  const fetchMeta = useCallback(async () => {
    try {
      const [catRes, projRes] = await Promise.all([
        api.get("/expenses/categories"),
        api.get("/projects"),
      ]);
      if (catRes.data.success) setCategories(catRes.data.data || []);
      setProjects(Array.isArray(projRes.data) ? projRes.data : (projRes.data?.data || []));
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { fetchMeta(); }, [fetchMeta]);

  const handleFilterChange = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPage(1);
  };

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setReceiptFile(null); setModalOpen(true); };
  const openEdit = (exp) => {
    setForm({
      title: exp.title || "", description: exp.description || "",
      amount: exp.amount?.toString() || "", category: exp.category || "",
      expenseDate: exp.expenseDate ? exp.expenseDate.split("T")[0] : "",
      paymentMethod: exp.paymentMethod || "Cash", vendor: exp.vendor || "",
      invoiceNumber: exp.invoiceNumber || "", project: exp.project?._id || exp.project || "",
      status: exp.status || "Paid", notes: exp.notes || "",
    });
    setEditingId(exp._id);
    setReceiptFile(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.amount || !form.category || !form.expenseDate) {
      toast.error("Title, amount, category and date are required"); return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== "") fd.append(k, v); });
      if (receiptFile) fd.append("receipt", receiptFile);

      const res = editingId
        ? await api.put(`/expenses/${editingId}`, fd, { headers: { "Content-Type": "multipart/form-data" } })
        : await api.post("/expenses", fd, { headers: { "Content-Type": "multipart/form-data" } });

      toast.success(res.data.message);
      setModalOpen(false);
      fetchExpenses();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/expenses/${deleteConfirm._id}`);
      toast.success(res.data.message);
      setDeleteConfirm(null);
      fetchExpenses();
    } catch (e) { toast.error(e.response?.data?.message || "Failed to delete"); }
    finally { setSubmitting(false); }
  };

  if (loading) return <SSIPageLoader message="Loading expenses..." />;

  return (
    <div className="space-y-5">
      <Toaster position="top-right" toastOptions={{ style: { background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-color)" } }} />

      {/* Header */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-[var(--accent-primary)]/10 p-2.5 rounded-xl">
            <Receipt className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">Expense Management</h1>
            <p className="text-[11px] text-[var(--text-muted)]">Track all business expenses • PKR</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchExpenses} className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowFilters(f => !f)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition ${showFilters ? "bg-[var(--accent-primary)] text-[var(--text-inverse)] border-[var(--accent-primary)]" : "border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"}`}>
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
          <button onClick={openCreate}
            className="inline-flex items-center gap-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-[var(--accent-primary)]/20">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Expenses", value: fmtCurrency(totalAmount), icon: DollarSign, color: "text-[var(--danger)]" },
          { label: "Records", value: total.toString(), icon: Receipt, color: "text-[var(--accent-primary)]" },
          { label: "Paid", value: expenses.filter(e => e.status === "Paid").length.toString(), icon: CheckCircle, color: "text-[var(--success)]" },
          { label: "Pending", value: expenses.filter(e => e.status === "Pending").length.toString(), icon: Clock, color: "text-[var(--warning)]" },
        ].map(c => (
          <div key={c.label} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{c.label}</p>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={filters.search} onChange={e => handleFilterChange("search", e.target.value)}
              placeholder="Search by title, vendor, invoice..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] text-[var(--text-primary)] rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition placeholder:text-[var(--text-muted)]" />
          </div>
          <select value={`${sortBy}:${order}`} onChange={e => { const [s, o] = e.target.value.split(":"); setSortBy(s); setOrder(o); }}
            className="text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-lg px-2 py-2 outline-none">
            <option value="expenseDate:desc">Newest</option>
            <option value="expenseDate:asc">Oldest</option>
            <option value="amount:desc">Highest</option>
            <option value="amount:asc">Lowest</option>
          </select>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-[var(--border-color)]">
            <select value={filters.category} onChange={e => handleFilterChange("category", e.target.value)}
              className="text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-lg px-2 py-1.5 outline-none col-span-1">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filters.status} onChange={e => handleFilterChange("status", e.target.value)}
              className="text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-lg px-2 py-1.5 outline-none">
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.paymentMethod} onChange={e => handleFilterChange("paymentMethod", e.target.value)}
              className="text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-lg px-2 py-1.5 outline-none">
              <option value="">All Methods</option>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={filters.project} onChange={e => handleFilterChange("project", e.target.value)}
              className="text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-lg px-2 py-1.5 outline-none">
              <option value="">All Projects</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
            </select>
            <input type="date" value={filters.startDate} onChange={e => handleFilterChange("startDate", e.target.value)}
              className="text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-lg px-2 py-1.5 outline-none" placeholder="From" />
            <input type="date" value={filters.endDate} onChange={e => handleFilterChange("endDate", e.target.value)}
              className="text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-lg px-2 py-1.5 outline-none" placeholder="To" />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_6rem_6rem_6rem_5rem_5rem] gap-2 px-5 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
          {["Expense", "Category", "Project", "Amount", "Status", "Actions"].map(h => (
            <span key={h} className={`text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider ${h === "Amount" ? "text-right" : ""}`}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-[var(--accent-primary)] animate-spin" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-secondary)]">No expenses found</p>
            <button onClick={openCreate} className="mt-3 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-hover)] font-medium">Add first expense</button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {expenses.map(exp => (
              <div key={exp._id} className="grid grid-cols-[1fr_6rem_6rem_6rem_5rem_5rem] gap-2 items-center px-5 py-3 hover:bg-[var(--bg-secondary)]/50 transition">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{exp.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-0.5">
                    <span>{fmtDate(exp.expenseDate)}</span>
                    {exp.vendor && <><span>•</span><span className="truncate max-w-[100px]">{exp.vendor}</span></>}
                  </div>
                </div>
                <span className="text-xs text-[var(--text-secondary)] truncate">{exp.category}</span>
                <span className="text-xs text-[var(--text-muted)] truncate">{exp.project?.projectName || "—"}</span>
                <span className="text-sm font-bold text-[var(--text-primary)] text-right">{fmtCurrency(exp.amount)}</span>
                <div><StatusBadge status={exp.status} /></div>
                <div className="flex items-center gap-1 justify-end">
                  <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteConfirm(exp)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]">
            <span className="text-xs text-[var(--text-muted)]">Page {page} of {totalPages} • {total} records</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-xs rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--bg-hover)] transition">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 text-xs rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--bg-hover)] transition">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setModalOpen(false)} />
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-card)] z-10">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[var(--accent-primary)]" />
                <h2 className="text-base font-semibold text-[var(--text-primary)]">{editingId ? "Edit Expense" : "Add Expense"}</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Expense Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="e.g. AWS Hosting Invoice" />
              </div>
              <div>
                <label className={labelCls}>Amount (PKR) *</label>
                <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputCls} placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls}>Category *</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls}>
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Expense Date *</label>
                <input type="date" value={form.expenseDate} onChange={e => setForm({ ...form, expenseDate: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Payment Method</label>
                <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className={inputCls}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Vendor</label>
                <input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} className={inputCls} placeholder="Vendor name" />
              </div>
              <div>
                <label className={labelCls}>Invoice Number</label>
                <input value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} className={inputCls} placeholder="INV-001" />
              </div>
              <div>
                <label className={labelCls}>Project (optional)</label>
                <select value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} className={inputCls}>
                  <option value="">No project</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className={inputCls + " resize-none"} placeholder="Optional description..." />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className={inputCls + " resize-none"} placeholder="Additional notes..." />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Receipt / Invoice (PDF, Image)</label>
                <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={e => setReceiptFile(e.target.files[0])}
                  className="w-full text-xs text-[var(--text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[var(--accent-primary)] file:text-[var(--text-inverse)] hover:file:bg-[var(--accent-hover)] transition" />
                {receiptFile && <p className="text-[10px] text-[var(--success)] mt-1">{receiptFile.name} selected</p>}
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-[var(--border-color)] sticky bottom-0 bg-[var(--bg-card)]">
              <button onClick={() => setModalOpen(false)} disabled={submitting}
                className="flex-1 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] text-sm transition">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent-primary)]/20">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? "Save Changes" : "Add Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setDeleteConfirm(null)} />
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-sm relative z-10 shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--danger)]/10 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6 text-[var(--danger)]" />
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Delete Expense?</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} disabled={submitting}
                className="flex-1 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] text-sm transition">Cancel</button>
              <button onClick={handleDelete} disabled={submitting}
                className="flex-1 py-2 rounded-lg bg-[var(--danger)] hover:bg-[var(--danger)]/80 text-white text-sm font-semibold transition flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
