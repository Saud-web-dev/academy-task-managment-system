import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../service/api.js';
import SSIPageLoader from '../components/SSIPageLoader';
import toast from 'react-hot-toast';
import {
  FileText,
  Loader2,
  Clock,
  UserX,
  AlertCircle,
  AlertTriangle,
  Scissors,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Trash2,
  Download,
  FileImage,
  Printer,
} from 'lucide-react';

// ─── html2canvas and jspdf for PDF/Image export ───
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ─── Deduction type config ────────────────────────────────────────
const DTYPE = {
  late_arrival: {
    label: 'Late Arrival',
    icon: Clock,
    cls: 'bg-[#f0a500]/10 text-[#f0a500] border-[#f0a500]/20',
  },
  absent: {
    label: 'Absent',
    icon: UserX,
    cls: 'bg-[#c0392b]/10 text-[#c0392b] border-[#c0392b]/20',
  },
  daily_update_miss: {
    label: 'Update Miss',
    icon: AlertCircle,
    cls: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  },
  deadline_missed: {
    label: 'Deadline Missed',
    icon: AlertTriangle,
    cls: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
  manual: {
    label: 'Manual Cut',
    icon: Scissors,
    cls: 'bg-[#8a7a6a]/10 text-[#8a7a6a] border-[#e5ddd5]',
  },
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';
const fmtTime = (d) =>
  d
    ? new Date(d).toLocaleTimeString('en-PK', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

// Normalize to "YYYY-MM-DD" using LOCAL date parts
const dateKey = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const Badge = ({ type }) => {
  const cfg = DTYPE[type] || DTYPE.manual;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${cfg.cls}`}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
};

// ─── Group deductions by date ─────────────────────────────────────
const groupByDate = (list) => {
  const map = {};
  const sorted = [...list].sort(
    (a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date)
  );
  for (const d of sorted) {
    const key = dateKey(d.date);
    if (!map[key]) {
      map[key] = {
        key,
        date: d.date,
        dateDisplay: fmtDate(d.date),
        items: [],
        totalCut: 0,
        marksBefore: d.marksBefore,
        marksAfter: d.marksAfter,
      };
    }
    map[key].items.push(d);
    map[key].totalCut = parseFloat(
      (map[key].totalCut + d.marksDeducted).toFixed(2)
    );
    map[key].marksAfter = d.marksAfter;
  }
  return Object.values(map).sort((a, b) => new Date(b.date) - new Date(a.date));
};

// ─── Daily Receipt Card (employee side) ──────────────────────────
const DailyReceiptCard = ({ group, onClick }) => (
  <div
    onClick={() => onClick(group)}
    className="bg-[#faf7f3] rounded-2xl border border-[#e5ddd5] p-4 cursor-pointer hover:border-[#2c1810]/30 hover:shadow transition space-y-3"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <p className="text-sm font-bold text-[#2c1810] flex items-center gap-1.5">
          <Calendar size={13} className="text-[#8a7a6a]" />
          {group.dateDisplay}
        </p>
        <p className="text-[10px] text-[#8a7a6a]">
          {group.items.length} deduction{group.items.length > 1 ? 's' : ''}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xl font-bold text-[#c0392b]">-{group.totalCut}</p>
        <p className="text-[9px] text-[#8a7a6a] uppercase">marks cut</p>
      </div>
    </div>

    <div className="flex flex-wrap gap-1">
      {group.items.map((item, i) => (
        <Badge key={i} type={item.deductionType} />
      ))}
    </div>

    <div className="flex gap-4 text-xs text-[#8a7a6a] border-t border-[#e5ddd5] pt-2">
      <span>
        Before: <strong className="text-[#2c1810]">{group.marksBefore}</strong>
      </span>
      <span>
        After: <strong className="text-[#2c1810]">{group.marksAfter}</strong>
      </span>
    </div>
  </div>
);

// ─── Receipt Content for Export ──────────────────────────────────
const ReceiptContent = ({ group }) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        color: '#2c1810',
        fontFamily: 'Arial, sans-serif',
        padding: '24px',
        borderRadius: '12px',
        maxWidth: '500px',
        margin: '0 auto',
        border: '1px solid #e5ddd5',
      }}
    >
      {/* Title */}
      <div
        style={{
          textAlign: 'center',
          padding: '16px',
          borderBottom: '2px solid #e5ddd5',
        }}
      >
        <h1
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            margin: 0,
            color: '#2c1810',
          }}
        >
          MARK DEDUCTION RECEIPT
        </h1>
        <p style={{ fontSize: '12px', color: '#8a7a6a', margin: '4px 0' }}>
          Academy Management System
        </p>
        <p style={{ fontSize: '11px', color: '#8a7a6a', margin: '4px 0' }}>
          {group.dateDisplay}
        </p>
      </div>

      {/* Deductions */}
      <div style={{ padding: '16px' }}>
        <p
          style={{
            fontSize: '10px',
            color: '#8a7a6a',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: 'bold',
          }}
        >
          Deductions
        </p>
        {group.items.map((item, i) => {
          const cfg = DTYPE[item.deductionType] || DTYPE.manual;
          return (
            <div
              key={i}
              style={{
                marginTop: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #f0ebe5',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#c0392b',
                    backgroundColor: 'rgba(192,57,43,0.1)',
                    padding: '2px 10px',
                    borderRadius: '4px',
                  }}
                >
                  {cfg.label}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#c0392b',
                  }}
                >
                  -{item.marksDeducted}
                </span>
              </div>
              <p
                style={{
                  fontSize: '11px',
                  color: '#4a3f38',
                  margin: '6px 0 0 0',
                }}
              >
                {item.reason}
              </p>
              {item.attendanceDetails?.arrivalTime && (
                <p
                  style={{
                    fontSize: '9px',
                    color: '#8a7a6a',
                    margin: '4px 0 0 0',
                  }}
                >
                  Arrived: {item.attendanceDetails.arrivalTime} · Expected:{' '}
                  {item.attendanceDetails.expectedTime} · Late:{' '}
                  {item.attendanceDetails.lateByMinutes} min
                </p>
              )}
              {item.notes && (
                <p
                  style={{
                    fontSize: '9px',
                    color: '#8a7a6a',
                    fontStyle: 'italic',
                    margin: '2px 0 0 0',
                  }}
                >
                  Note: {item.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div style={{ padding: '16px', borderTop: '2px solid #e5ddd5' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
          }}
        >
          <span style={{ color: '#8a7a6a' }}>Marks Before:</span>
          <span style={{ fontWeight: 'bold', color: '#2c1810' }}>
            {group.marksBefore}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            marginTop: '4px',
          }}
        >
          <span style={{ color: '#8a7a6a' }}>Total Deducted:</span>
          <span style={{ fontWeight: 'bold', color: '#c0392b' }}>
            -{group.totalCut}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '13px',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #e5ddd5',
          }}
        >
          <span style={{ color: '#8a7a6a' }}>Marks After:</span>
          <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>
            {group.marksAfter}
          </span>
        </div>
      </div>

      <div
        style={{
          textAlign: 'center',
          padding: '12px',
          fontSize: '9px',
          color: '#8a7a6a',
          borderTop: '1px solid #e5ddd5',
        }}
      >
        {group.items.length} deduction(s) · Generated: {fmtDate(new Date())}
      </div>
    </div>
  );
};

// ─── Daily Receipt Modal with Download Options ──────────────────
const DailyReceiptModal = ({ group, onClose }) => {
  const receiptRef = useRef(null);

  if (!group) return null;

  // ─── Export as PDF ──────────────────────────────────────────────
  const exportAsPDF = async () => {
    try {
      const element = receiptRef.current;
      if (!element) return;

      toast.loading('Generating PDF...', { id: 'export' });

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        onclone: (document) => {
          const allElements = document.querySelectorAll('*');
          allElements.forEach((el) => {
            const styles = window.getComputedStyle(el);
            const color = styles.color;
            if (color && color.includes('oklch')) {
              el.style.color = '#2c1810';
            }
            const bgColor = styles.backgroundColor;
            if (bgColor && bgColor.includes('oklch')) {
              el.style.backgroundColor = '#ffffff';
            }
            const borderColor = styles.borderColor;
            if (borderColor && borderColor.includes('oklch')) {
              el.style.borderColor = '#e5ddd5';
            }
          });
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(
        `deduction-receipt-${group.dateDisplay.replace(/\s/g, '-')}.pdf`
      );

      toast.success('PDF downloaded successfully!', { id: 'export' });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Failed to export PDF', { id: 'export' });
    }
  };

  // ─── Export as PNG ──────────────────────────────────────────────
  const exportAsPNG = async () => {
    try {
      const element = receiptRef.current;
      if (!element) return;

      toast.loading('Generating PNG...', { id: 'export' });

      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        onclone: (document) => {
          const allElements = document.querySelectorAll('*');
          allElements.forEach((el) => {
            const styles = window.getComputedStyle(el);
            const color = styles.color;
            if (color && color.includes('oklch')) {
              el.style.color = '#2c1810';
            }
            const bgColor = styles.backgroundColor;
            if (bgColor && bgColor.includes('oklch')) {
              el.style.backgroundColor = '#ffffff';
            }
            const borderColor = styles.borderColor;
            if (borderColor && borderColor.includes('oklch')) {
              el.style.borderColor = '#e5ddd5';
            }
          });
        },
      });

      const link = document.createElement('a');
      link.download = `deduction-receipt-${group.dateDisplay.replace(/\s/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('PNG downloaded successfully!', { id: 'export' });
    } catch (error) {
      console.error('PNG Export Error:', error);
      toast.error('Failed to export PNG', { id: 'export' });
    }
  };

  // ─── Export as JPEG ─────────────────────────────────────────────
  const exportAsJPEG = async () => {
    try {
      const element = receiptRef.current;
      if (!element) return;

      toast.loading('Generating JPEG...', { id: 'export' });

      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        onclone: (document) => {
          const allElements = document.querySelectorAll('*');
          allElements.forEach((el) => {
            const styles = window.getComputedStyle(el);
            const color = styles.color;
            if (color && color.includes('oklch')) {
              el.style.color = '#2c1810';
            }
            const bgColor = styles.backgroundColor;
            if (bgColor && bgColor.includes('oklch')) {
              el.style.backgroundColor = '#ffffff';
            }
            const borderColor = styles.borderColor;
            if (borderColor && borderColor.includes('oklch')) {
              el.style.borderColor = '#e5ddd5';
            }
          });
        },
      });

      const link = document.createElement('a');
      link.download = `deduction-receipt-${group.dateDisplay.replace(/\s/g, '-')}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();

      toast.success('JPEG downloaded successfully!', { id: 'export' });
    } catch (error) {
      console.error('JPEG Export Error:', error);
      toast.error('Failed to export JPEG', { id: 'export' });
    }
  };

  // ─── Print Receipt ──────────────────────────────────────────────
  const printReceipt = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
      toast.error('Please allow popups for printing');
      return;
    }

    const contentHTML = printContent.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Deduction Receipt - ${group.dateDisplay}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              padding: 40px; 
              background: #ffffff; 
              color: #2c1810;
            }
            .receipt-print {
              max-width: 500px; 
              margin: 0 auto;
              background: #ffffff;
              border-radius: 12px;
              border: 1px solid #e5ddd5;
              overflow: hidden;
            }
            .receipt-header { 
              text-align: center; 
              padding: 20px; 
              border-bottom: 2px solid #e5ddd5;
            }
            .receipt-header h1 { 
              font-size: 18px; 
              font-weight: bold; 
              color: #2c1810;
              margin: 0;
            }
            .receipt-header p { 
              font-size: 12px; 
              color: #8a7a6a; 
              margin: 4px 0;
            }
            .deduction-item {
              padding: 12px 16px;
              border-bottom: 1px solid #f0ebe5;
            }
            .deduction-item .badge {
              display: inline-block;
              font-size: 10px;
              font-weight: bold;
              color: #c0392b;
              background: rgba(192,57,43,0.1);
              padding: 2px 10px;
              border-radius: 4px;
            }
            .deduction-item .amount {
              font-size: 12px;
              font-weight: bold;
              color: #c0392b;
            }
            .deduction-item .reason {
              font-size: 11px;
              color: #4a3f38;
              margin-top: 6px;
            }
            .deduction-item .details {
              font-size: 9px;
              color: #8a7a6a;
              margin-top: 4px;
            }
            .totals-section {
              padding: 16px;
              border-top: 2px solid #e5ddd5;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              padding: 4px 0;
            }
            .totals-row .label { color: #8a7a6a; }
            .totals-row .value { font-weight: bold; color: #2c1810; }
            .totals-row.total { 
              border-top: 1px solid #e5ddd5; 
              padding-top: 8px;
              margin-top: 4px;
              font-size: 13px;
            }
            .totals-row.total .value { color: #4CAF50; }
            .receipt-footer {
              text-align: center;
              padding: 12px;
              font-size: 9px;
              color: #8a7a6a;
              border-top: 1px solid #e5ddd5;
            }
            .text-danger { color: #c0392b; }
            .text-success { color: #4CAF50; }
          </style>
        </head>
        <body>
          <div class="receipt-print">
            ${contentHTML}
          </div>
          <script>
            window.onload = function() { 
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          <\/script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#faf7f3] rounded-2xl border border-[#e5ddd5] w-full max-w-md shadow-2xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#f0ebe5] rounded-t-2xl px-6 py-4 border-b border-[#e5ddd5] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#2c1810]" />
              <div>
                <p className="text-sm font-bold text-[#2c1810]">
                  Daily Deduction Receipt
                </p>
                <p className="text-xs text-[#8a7a6a]">{group.dateDisplay}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#e8e0d8] text-[#8a7a6a]"
            >
              <X size={16} />
            </button>
          </div>

          {/* ─── DOWNLOAD BUTTONS ─── */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#e5ddd5]">
            <button
              onClick={exportAsPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#c0392b]/10 hover:bg-[#c0392b]/20 text-[#c0392b] border border-[#c0392b]/20 rounded-lg text-xs font-medium transition"
            >
              <FileText size={14} />
              PDF
            </button>
            <button
              onClick={exportAsPNG}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2c1810]/10 hover:bg-[#2c1810]/20 text-[#2c1810] border border-[#2c1810]/20 rounded-lg text-xs font-medium transition"
            >
              <FileImage size={14} />
              PNG
            </button>
            <button
              onClick={exportAsJPEG}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4CAF50]/10 hover:bg-[#4CAF50]/20 text-[#4CAF50] border border-[#4CAF50]/20 rounded-lg text-xs font-medium transition"
            >
              <FileImage size={14} />
              JPG
            </button>
            <button
              onClick={printReceipt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8a7a6a]/10 hover:bg-[#8a7a6a]/20 text-[#8a7a6a] border border-[#8a7a6a]/20 rounded-lg text-xs font-medium transition"
            >
              <Printer size={14} />
              Print
            </button>
          </div>
        </div>

        {/* Receipt body - wrapped for export */}
        <div className="overflow-y-auto flex-1 p-6" ref={receiptRef}>
          <ReceiptContent group={group} />
        </div>

        <div className="px-6 pb-5 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-[#2c1810] hover:bg-[#4a3f38] text-white rounded-xl text-sm font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────
const MyDocuments = () => {
  const [deductions, setDeductions] = useState([]);
  const [grouped, setGrouped] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [totalDeducted, setTotalDeducted] = useState(0);
  const [user, setUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const LIMIT = 100;

  const fetchDeductions = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const params = { page: p, limit: LIMIT };
        if (filterType !== 'all') params.deductionType = filterType;
        const res = await api.get('/score-deductions/my', { params });
        if (res.data.success) {
          const raw = res.data.data || [];
          const grp = groupByDate(raw);
          setDeductions(raw);
          setGrouped(grp);
          setTotal(res.data.total || 0);
          setTotalPages(res.data.totalPages || 1);
          setTotalDeducted(res.data.totalDeducted || 0);
          setUser(res.data.user);
          setPage(p);
        }
      } catch {
        toast.error('Failed to load documents');
      } finally {
        setLoading(false);
      }
    },
    [filterType]
  );

  useEffect(() => {
    fetchDeductions(1);
  }, [filterType]);

  // Per-type summary counts
  const typeCounts = Object.keys(DTYPE).reduce(
    (acc, k) => ({
      ...acc,
      [k]: deductions.filter((d) => d.deductionType === k).length,
    }),
    {}
  );

  if (loading && deductions.length === 0)
    return <SSIPageLoader message="Loading documents..." />;

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="bg-[#faf7f3] rounded-2xl border border-[#e5ddd5] px-6 py-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-[#2c1810] flex items-center gap-2">
                <FileText className="w-6 h-6" /> My Documents
              </h1>
              <p className="text-sm text-[#8a7a6a] mt-0.5">
                {grouped.length} daily receipt{grouped.length !== 1 ? 's' : ''}{' '}
                · tap to view details
              </p>
            </div>
            {user && (
              <div className="text-right">
                <p className="text-3xl font-bold text-[#2c1810]">
                  {user.marks ?? 0}
                </p>
                <p className="text-xs text-[#8a7a6a] uppercase">
                  current marks
                </p>
                <p className="text-sm font-semibold text-[#c0392b] mt-1">
                  -{Number(totalDeducted).toFixed(1)} total deducted
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Filter type chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              filterType === 'all'
                ? 'bg-[#2c1810] text-white border-[#2c1810]'
                : 'bg-[#faf7f3] text-[#4a3f38] border-[#e5ddd5] hover:bg-[#f0ebe5]'
            }`}
          >
            All ({total})
          </button>
          {Object.entries(DTYPE).map(([k, v]) => {
            const Icon = v.icon;
            return (
              <button
                key={k}
                onClick={() => setFilterType(k)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  filterType === k
                    ? `${v.cls} !border-current`
                    : 'bg-[#faf7f3] text-[#4a3f38] border-[#e5ddd5] hover:bg-[#f0ebe5]'
                }`}
              >
                <Icon size={12} /> {v.label} ({typeCounts[k] || 0})
              </button>
            );
          })}
        </div>

        {/* Type summary bar */}
        {deductions.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(DTYPE).map(([k, v]) => {
              const cnt = typeCounts[k] || 0;
              const sum = deductions
                .filter((d) => d.deductionType === k)
                .reduce((s, d) => s + d.marksDeducted, 0);
              const Icon = v.icon;
              return (
                <div
                  key={k}
                  className="bg-[#faf7f3] rounded-xl border border-[#e5ddd5] p-3 text-center"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1 ${v.cls}`}
                  >
                    <Icon size={16} />
                  </div>
                  <p className="text-lg font-bold text-[#2c1810]">{cnt}</p>
                  <p className="text-[9px] text-[#8a7a6a] uppercase">
                    {v.label}
                  </p>
                  {sum > 0 && (
                    <p className="text-xs text-[#c0392b] font-semibold mt-0.5">
                      -{sum.toFixed(1)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Daily Receipt Cards */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <Loader2 className="w-6 h-6 text-[#2c1810] animate-spin" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="bg-[#faf7f3] rounded-2xl border border-[#e5ddd5] p-12 text-center">
            <FileText className="w-12 h-12 text-[#d4c8bc] mx-auto mb-3" />
            <p className="text-sm text-[#8a7a6a]">No deduction records found</p>
            <p className="text-xs text-[#d4c8bc] mt-1">
              Great! You have no mark deductions.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped.map((group) => (
                <DailyReceiptCard
                  key={group.key}
                  group={group}
                  onClick={setSelectedGroup}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => fetchDeductions(page - 1)}
                  className="p-2 rounded-xl border border-[#e5ddd5] disabled:opacity-40 hover:bg-[#f0ebe5]"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-[#8a7a6a]">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => fetchDeductions(page + 1)}
                  className="p-2 rounded-xl border border-[#e5ddd5] disabled:opacity-40 hover:bg-[#f0ebe5]"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedGroup && (
        <DailyReceiptModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </>
  );
};

export default MyDocuments;
