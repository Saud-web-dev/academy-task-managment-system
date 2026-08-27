import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../service/api.js';
import SSIPageLoader from '../../components/SSIPageLoader';
import toast from 'react-hot-toast';
import {
  FileText,
  Loader2,
  Search,
  Filter,
  Calendar,
  TrendingDown,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Clock,
  UserX,
  AlertCircle,
  Scissors,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  FileImage,
  File,
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
    cls: 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20',
  },
  absent: {
    label: 'Absent',
    icon: UserX,
    cls: 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20',
  },
  daily_update_miss: {
    label: 'Update Miss',
    icon: AlertCircle,
    cls: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  },
  deadline_missed: {
    label: 'Deadline Missed',
    icon: AlertTriangle,
    cls: 'bg-red-500/10 text-red-500 border-red-500/20',
  },
  manual: {
    label: 'Manual',
    icon: Scissors,
    cls: 'bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--border-color)]',
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

// ─── Group deductions by date+employee ──────────────────────────
const groupByDateEmployee = (list) => {
  const map = {};
  const sorted = [...list].sort(
    (a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date)
  );
  for (const d of sorted) {
    const key = `${dateKey(d.date)}__${d.userName}`;
    if (!map[key]) {
      map[key] = {
        key,
        date: d.date,
        dateDisplay: fmtDate(d.date),
        userName: d.userName,
        userId: d.userId,
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

// ─── Daily Receipt Card ──────────────────────────────────────────
const DailyReceiptCard = ({ group, onClick }) => (
  <div
    onClick={() => onClick(group)}
    className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] cursor-pointer hover:border-[var(--accent-primary)]/40 hover:shadow-lg transition-all p-4 space-y-3"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-bold text-[var(--text-primary)]">
          {group.userName}
        </p>
        <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
          <Calendar size={11} />
          {group.dateDisplay}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-bold text-[var(--danger)]">
          -{group.totalCut}
        </p>
        <p className="text-[9px] text-[var(--text-muted)] uppercase">
          total cut
        </p>
      </div>
    </div>

    <div className="flex flex-wrap gap-1">
      {group.items.map((item, i) => (
        <Badge key={i} type={item.deductionType} />
      ))}
    </div>

    <div className="flex gap-4 text-xs text-[var(--text-muted)] border-t border-[var(--border-color)] pt-2">
      <span>
        Before:{' '}
        <strong className="text-[var(--text-primary)]">
          {group.marksBefore}
        </strong>
      </span>
      <span>
        After:{' '}
        <strong className="text-[var(--success)]">{group.marksAfter}</strong>
      </span>
      <span className="ml-auto">
        {group.items.length} deduction{group.items.length > 1 ? 's' : ''}
      </span>
    </div>
  </div>
);

// ─── Receipt Component for Export (with theme colors converted to hex) ───
const ReceiptContent = ({ group }) => {
  // Get computed styles for theme colors
  const getComputedColor = (cssVar) => {
    const color = getComputedStyle(document.documentElement)
      .getPropertyValue(cssVar)
      .trim();
    return color || '#000000';
  };

  // Theme colors as hex
  const colors = {
    primary: '#1a1a2e',
    secondary: '#2d2d44',
    accent: '#6c63ff',
    danger: '#dc3545',
    success: '#28a745',
    warning: '#ffc107',
    muted: '#6c757d',
    border: '#e9ecef',
    card: '#ffffff',
    text: '#1a1a2e',
    textMuted: '#6c757d',
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        color: '#1a1a2e',
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      {/* Receipt title */}
      <div
        style={{
          textAlign: 'center',
          padding: '16px',
          borderBottom: '2px solid #e9ecef',
        }}
      >
        <h1
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            margin: 0,
            color: '#1a1a2e',
          }}
        >
          MARK DEDUCTION RECEIPT
        </h1>
        <p style={{ fontSize: '12px', color: '#6c757d', margin: '4px 0' }}>
          Academy Management System
        </p>
        <p style={{ fontSize: '11px', color: '#6c757d', margin: '4px 0' }}>
          {group.dateDisplay}
        </p>
      </div>

      {/* Employee info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #e9ecef',
        }}
      >
        <span style={{ fontSize: '11px', color: '#6c757d' }}>Employee:</span>
        <span
          style={{ fontSize: '11px', fontWeight: 'bold', color: '#1a1a2e' }}
        >
          {group.userName}
        </span>
      </div>

      {/* Deductions */}
      <div style={{ padding: '12px 16px' }}>
        <p
          style={{
            fontSize: '10px',
            color: '#6c757d',
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
                marginTop: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid #f0f0f0',
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
                    color: '#dc3545',
                    backgroundColor: 'rgba(220,53,69,0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {cfg.label}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#dc3545',
                  }}
                >
                  -{item.marksDeducted}
                </span>
              </div>
              <p
                style={{
                  fontSize: '10px',
                  color: '#495057',
                  margin: '4px 0 0 0',
                }}
              >
                {item.reason}
              </p>
              {item.attendanceDetails?.arrivalTime && (
                <p
                  style={{
                    fontSize: '9px',
                    color: '#6c757d',
                    margin: '2px 0 0 0',
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
                    color: '#6c757d',
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
      <div style={{ padding: '12px 16px', borderTop: '2px solid #e9ecef' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
          }}
        >
          <span style={{ color: '#6c757d' }}>Marks Before (day start):</span>
          <span style={{ fontWeight: 'bold', color: '#1a1a2e' }}>
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
          <span style={{ color: '#6c757d' }}>Total Deducted:</span>
          <span style={{ fontWeight: 'bold', color: '#dc3545' }}>
            -{group.totalCut}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #e9ecef',
          }}
        >
          <span style={{ color: '#6c757d' }}>Marks After:</span>
          <span style={{ fontWeight: 'bold', color: '#28a745' }}>
            {group.marksAfter}
          </span>
        </div>
      </div>

      <div
        style={{
          textAlign: 'center',
          padding: '12px 16px',
          fontSize: '9px',
          color: '#6c757d',
          borderTop: '1px solid #e9ecef',
        }}
      >
        {group.items.length} deduction(s) · Generated: {fmtDate(new Date())}
      </div>
    </div>
  );
};

// ─── Daily Receipt Modal with Export Options ────────────────────
const DailyReceiptModal = ({ group, onClose, onDeleteItem }) => {
  const receiptRef = useRef(null);

  if (!group) return null;

  // ─── Export as PDF ──────────────────────────────────────────────
  const exportAsPDF = async () => {
    try {
      const element = receiptRef.current;
      if (!element) return;

      // Temporarily add a class for clean export
      element.classList.add('exporting');

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        // Fix for oklch color issue
        onclone: (document) => {
          // Convert all oklch colors to hex
          const allElements = document.querySelectorAll('*');
          allElements.forEach((el) => {
            const styles = window.getComputedStyle(el);
            const color = styles.color;
            if (color && color.includes('oklch')) {
              el.style.color = '#1a1a2e';
            }
            const bgColor = styles.backgroundColor;
            if (bgColor && bgColor.includes('oklch')) {
              el.style.backgroundColor = '#ffffff';
            }
            const borderColor = styles.borderColor;
            if (borderColor && borderColor.includes('oklch')) {
              el.style.borderColor = '#e9ecef';
            }
          });
        },
      });

      element.classList.remove('exporting');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(
        `deduction-receipt-${group.userName}-${group.dateDisplay.replace(/\s/g, '-')}.pdf`
      );

      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Failed to export PDF. Please try again.');
    }
  };

  // ─── Export as PNG ──────────────────────────────────────────────
  const exportAsPNG = async () => {
    try {
      const element = receiptRef.current;
      if (!element) return;

      element.classList.add('exporting');

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
              el.style.color = '#1a1a2e';
            }
            const bgColor = styles.backgroundColor;
            if (bgColor && bgColor.includes('oklch')) {
              el.style.backgroundColor = '#ffffff';
            }
            const borderColor = styles.borderColor;
            if (borderColor && borderColor.includes('oklch')) {
              el.style.borderColor = '#e9ecef';
            }
          });
        },
      });

      element.classList.remove('exporting');

      const link = document.createElement('a');
      link.download = `deduction-receipt-${group.userName}-${group.dateDisplay.replace(/\s/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('PNG downloaded successfully!');
    } catch (error) {
      console.error('PNG Export Error:', error);
      toast.error('Failed to export PNG');
    }
  };

  // ─── Export as JPEG ─────────────────────────────────────────────
  const exportAsJPEG = async () => {
    try {
      const element = receiptRef.current;
      if (!element) return;

      element.classList.add('exporting');

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
              el.style.color = '#1a1a2e';
            }
            const bgColor = styles.backgroundColor;
            if (bgColor && bgColor.includes('oklch')) {
              el.style.backgroundColor = '#ffffff';
            }
            const borderColor = styles.borderColor;
            if (borderColor && borderColor.includes('oklch')) {
              el.style.borderColor = '#e9ecef';
            }
          });
        },
      });

      element.classList.remove('exporting');

      const link = document.createElement('a');
      link.download = `deduction-receipt-${group.userName}-${group.dateDisplay.replace(/\s/g, '-')}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();

      toast.success('JPEG downloaded successfully!');
    } catch (error) {
      console.error('JPEG Export Error:', error);
      toast.error('Failed to export JPEG');
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

    // Get the HTML content with inline styles
    const contentHTML = printContent.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Deduction Receipt - ${group.userName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              padding: 40px; 
              background: #ffffff; 
              color: #1a1a2e;
            }
            .receipt-print {
              max-width: 600px; 
              margin: 0 auto;
              background: #ffffff;
              border-radius: 8px;
              border: 1px solid #e9ecef;
              overflow: hidden;
            }
            .receipt-header { 
              text-align: center; 
              padding: 20px; 
              border-bottom: 2px solid #e9ecef;
              background: #f8f9fa;
            }
            .receipt-header h1 { 
              font-size: 18px; 
              font-weight: bold; 
              color: #1a1a2e;
              margin: 0;
            }
            .receipt-header p { 
              font-size: 12px; 
              color: #6c757d; 
              margin: 4px 0;
            }
            .receipt-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 10px 16px; 
              border-bottom: 1px solid #e9ecef;
              font-size: 11px;
            }
            .receipt-row .label { color: #6c757d; }
            .receipt-row .value { font-weight: bold; color: #1a1a2e; }
            .deduction-item {
              padding: 10px 16px;
              border-bottom: 1px solid #f0f0f0;
            }
            .deduction-item .badge {
              display: inline-block;
              font-size: 10px;
              font-weight: bold;
              color: #dc3545;
              background: rgba(220,53,69,0.1);
              padding: 2px 8px;
              border-radius: 4px;
            }
            .deduction-item .amount {
              font-size: 11px;
              font-weight: bold;
              color: #dc3545;
            }
            .deduction-item .reason {
              font-size: 10px;
              color: #495057;
              margin-top: 4px;
            }
            .deduction-item .details {
              font-size: 9px;
              color: #6c757d;
              margin-top: 2px;
            }
            .totals-section {
              padding: 12px 16px;
              border-top: 2px solid #e9ecef;
              background: #f8f9fa;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              padding: 4px 0;
            }
            .totals-row .label { color: #6c757d; }
            .totals-row .value { font-weight: bold; }
            .totals-row.total { 
              border-top: 1px solid #e9ecef; 
              padding-top: 8px;
              margin-top: 4px;
              font-size: 12px;
            }
            .receipt-footer {
              text-align: center;
              padding: 12px 16px;
              font-size: 9px;
              color: #6c757d;
              border-top: 1px solid #e9ecef;
            }
            .text-danger { color: #dc3545; }
            .text-success { color: #28a745; }
          </style>
        </head>
        <body>
          <div class="receipt-print">
            <!-- Receipt Header -->
            <div class="receipt-header">
              <h1>MARK DEDUCTION RECEIPT</h1>
              <p>Academy Management System</p>
              <p>${group.dateDisplay}</p>
            </div>

            <!-- Employee -->
            <div class="receipt-row">
              <span class="label">Employee:</span>
              <span class="value">${group.userName}</span>
            </div>

            <!-- Deductions -->
            <div style="padding: 8px 16px;">
              <p style="font-size: 10px; color: #6c757d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Deductions</p>
              ${group.items
                .map(
                  (item) => `
                <div class="deduction-item">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge">${DTYPE[item.deductionType]?.label || 'Manual'}</span>
                    <span class="amount">-${item.marksDeducted}</span>
                  </div>
                  <div class="reason">${item.reason}</div>
                  ${
                    item.attendanceDetails?.arrivalTime
                      ? `
                    <div class="details">Arrived: ${item.attendanceDetails.arrivalTime} · Expected: ${item.attendanceDetails.expectedTime} · Late: ${item.attendanceDetails.lateByMinutes} min</div>
                  `
                      : ''
                  }
                  ${item.notes ? `<div class="details">Note: ${item.notes}</div>` : ''}
                </div>
              `
                )
                .join('')}
            </div>

            <!-- Totals -->
            <div class="totals-section">
              <div class="totals-row">
                <span class="label">Marks Before (day start):</span>
                <span class="value">${group.marksBefore}</span>
              </div>
              <div class="totals-row">
                <span class="label">Total Deducted:</span>
                <span class="value text-danger">-${group.totalCut}</span>
              </div>
              <div class="totals-row total">
                <span class="label">Marks After:</span>
                <span class="value text-success">${group.marksAfter}</span>
              </div>
            </div>

            <!-- Footer -->
            <div class="receipt-footer">
              ${group.items.length} deduction(s) · Generated: ${fmtDate(new Date())}
            </div>
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg shadow-2xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header with export buttons */}
        <div className="bg-[var(--bg-secondary)] rounded-t-2xl px-6 py-4 border-b border-[var(--border-color)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--accent-primary)]" />
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  Daily Deduction Receipt
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {group.dateDisplay} · {group.userName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
            >
              <X size={16} />
            </button>
          </div>

          {/* ─── EXPORT BUTTONS ─── */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--border-color)]">
            <button
              onClick={exportAsPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20 text-[var(--danger)] border border-[var(--danger)]/20 rounded-lg text-xs font-medium transition"
            >
              <FileText size={14} />
              PDF
            </button>
            <button
              onClick={exportAsPNG}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 rounded-lg text-xs font-medium transition"
            >
              <FileImage size={14} />
              PNG
            </button>
            <button
              onClick={exportAsJPEG}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--success)]/10 hover:bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/20 rounded-lg text-xs font-medium transition"
            >
              <FileImage size={14} />
              JPG
            </button>
            <button
              onClick={printReceipt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--text-muted)]/10 hover:bg-[var(--text-muted)]/20 text-[var(--text-muted)] border border-[var(--text-muted)]/20 rounded-lg text-xs font-medium transition"
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

        <div className="px-6 pb-5 flex-shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-lg text-sm font-medium transition hover:bg-[var(--bg-hover)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────
const AdminDocuments = () => {
  const [deductions, setDeductions] = useState([]);
  const [grouped, setGrouped] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDeducted, setTotalDeducted] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    deductionType: 'all',
    startDate: '',
    endDate: '',
  });

  const LIMIT = 50;

  const fetchDeductions = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const params = { page: p, limit: LIMIT };
        if (filters.search) params.search = filters.search;
        if (filters.deductionType !== 'all')
          params.deductionType = filters.deductionType;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        const res = await api.get('/score-deductions/all', { params });
        if (res.data.success) {
          const raw = res.data.data || [];
          const grp = groupByDateEmployee(raw);
          setDeductions(raw);
          setGrouped(grp);
          setTotal(res.data.total || 0);
          setTotalPages(res.data.totalPages || 1);
          setTotalDeducted(res.data.totalDeducted || 0);
          setPage(p);
        }
      } catch {
        toast.error('Failed to load deductions');
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchDeductions(1);
  }, []);

  if (loading) return <SSIPageLoader message="Loading documents..." />;

  const handleDeleteItem = async (itemId, group) => {
    try {
      await api.delete(`/score-deductions/${itemId}`);
      toast.success('Entry deleted and marks restored!');
      await fetchDeductions(page);
      setSelectedGroup(null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const downloadReceipts = async () => {
    try {
      const res = await api.get('/score-deductions/all', {
        params: { page: 1, limit: 9999, ...filters },
      });
      const groupedAll = groupByDateEmployee(res.data.data || []);
      const blob = new Blob(
        [JSON.stringify({ grouped: groupedAll, raw: res.data.data }, null, 2)],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deductions-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Receipts exported!');
    } catch {
      toast.error('Export failed');
    }
  };

  // Type summary counts
  const typeCounts = Object.keys(DTYPE).reduce(
    (acc, k) => ({
      ...acc,
      [k]: deductions.filter((d) => d.deductionType === k).length,
    }),
    {}
  );

  return (
    <>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--accent-primary)]/10 p-2.5 rounded-lg">
                <FileText className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                  Deduction Documents
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  {grouped.length} daily receipt
                  {grouped.length !== 1 ? 's' : ''} · {total} total deduction
                  entries
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchDeductions(page)}
                className="inline-flex items-center gap-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                <RefreshCw size={16} /> Refresh
              </button>
              <button
                onClick={downloadReceipts}
                className="inline-flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-[var(--accent-primary)]/20"
              >
                <Download size={16} /> Export JSON
              </button>
            </div>
          </div>
        </div>

        {/* Type summary chips */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(DTYPE).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const active = filters.deductionType === key;
            return (
              <button
                key={key}
                onClick={() =>
                  setFilters({
                    ...filters,
                    deductionType: active ? 'all' : key,
                  })
                }
                className={`bg-[var(--bg-card)] rounded-xl border p-3 flex items-center gap-3 transition hover:shadow ${active ? 'border-[var(--accent-primary)]' : 'border-[var(--border-color)]'}`}
              >
                <div className={`p-2 rounded-lg flex-shrink-0 ${cfg.cls}`}>
                  <Icon size={15} />
                </div>
                <div className="text-left">
                  <p className="text-base font-bold text-[var(--text-primary)]">
                    {typeCounts[key] || 0}
                  </p>
                  <p className="text-[9px] text-[var(--text-muted)] uppercase leading-tight">
                    {cfg.label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] px-6 py-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-3 py-2">
            <Search
              size={14}
              className="text-[var(--text-muted)] flex-shrink-0"
            />
            <input
              type="text"
              placeholder="Search by employee name..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>
          <select
            value={filters.deductionType}
            onChange={(e) =>
              setFilters({ ...filters, deductionType: e.target.value })
            }
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="all">All Types</option>
            {Object.entries(DTYPE).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value })
            }
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={() => fetchDeductions(1)}
            className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--text-inverse)] rounded-lg text-sm font-medium flex items-center gap-2 transition"
          >
            <Filter size={14} /> Apply
          </button>
          <span className="text-xs text-[var(--text-muted)] ml-auto">
            Total deducted:{' '}
            <strong className="text-[var(--danger)]">
              {totalDeducted} marks
            </strong>
          </span>
        </div>

        {/* Receipts Grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-12 text-center">
            <FileText className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-secondary)]">
              No deduction records found
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-4 py-3">
                <p className="text-xs text-[var(--text-muted)]">
                  Page {page} of {totalPages} · {total} records
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => fetchDeductions(page - 1)}
                    className="p-1.5 rounded-lg border border-[var(--border-color)] disabled:opacity-40 hover:bg-[var(--bg-hover)]"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => fetchDeductions(page + 1)}
                    className="p-1.5 rounded-lg border border-[var(--border-color)] disabled:opacity-40 hover:bg-[var(--bg-hover)]"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedGroup && (
        <DailyReceiptModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onDeleteItem={handleDeleteItem}
        />
      )}
    </>
  );
};

export default AdminDocuments;
