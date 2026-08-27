import React, { useState, useEffect } from 'react';
import { useUIStyle } from '../../Context/Uistylecontext';
import {
  Check, Loader2, ArrowLeft, RefreshCw, LayoutGrid
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const UIStylePreview = ({ styleId }) => (
  <div
    data-ui-style={styleId}
    className="flex gap-2 w-full h-24 rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-primary)] p-2"
  >
    <div
      className="ui-sidebar shrink-0"
      style={{ width: 28, borderRadius: 'var(--ui-sidebar-radius)' }}
    >
      <div className="ui-sidebar-item bg-[var(--accent-primary)]/20 mt-1 mx-1 h-3" />
      <div className="mx-1 mt-1 h-2 rounded-full bg-[var(--bg-hover)]" />
      <div className="mx-1 mt-1 h-2 rounded-full bg-[var(--bg-hover)]" />
    </div>
    <div className="flex-1 flex flex-col gap-2 justify-center">
      <div className="ui-card !p-2 flex-1 flex items-center justify-center">
        <div className="w-8 h-2 rounded-full bg-[var(--bg-hover)]" />
      </div>
      <div className="ui-btn ui-btn-primary !py-1 !px-3 text-[9px] text-center w-fit">
        Button
      </div>
    </div>
  </div>
);

const UIStyleSettings = () => {
  const navigate = useNavigate();

  let ctx;
  try {
    ctx = useUIStyle();
  } catch {
    ctx = null;
  }

  const currentUIStyle = ctx?.currentUIStyle || 'material';
  const updateUIStyle = ctx?.updateUIStyle;
  const loading = ctx?.loading || false;
  const applyUIStyle = ctx?.applyUIStyle;
  const availableUIStyles = ctx?.availableUIStyles || [];

  const [selected, setSelected] = useState(currentUIStyle);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setSelected(currentUIStyle);
  }, [currentUIStyle]);

  const handleSelect = (styleId) => {
    setSelected(styleId);
    try {
      applyUIStyle?.(styleId);
      const name = availableUIStyles.find(s => s.id === styleId)?.name || styleId;
      toast.success(`Previewing ${name}`);
    } catch {
      toast.error('Failed to preview');
    }
  };

  const handleApply = async () => {
    if (selected === currentUIStyle) {
      toast.success('Already applied');
      return;
    }
    if (!updateUIStyle) {
      toast.error('Update not available');
      return;
    }
    setIsUpdating(true);
    try {
      const result = await updateUIStyle(selected);
      if (result?.success) {
        const name = availableUIStyles.find(s => s.id === selected)?.name || selected;
        toast.success(`UI style changed to ${name}`);
      } else {
        toast.error(result?.error || "Failed to update");
      }
    } catch {
      toast.error('Failed to update');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = () => {
    applyUIStyle?.(currentUIStyle);
    setSelected(currentUIStyle);
    toast.success('Reset to current');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6">
      {/* ✅ Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          },
          success: {
            iconTheme: { primary: 'var(--success)', secondary: 'var(--text-inverse)' },
          },
          error: {
            iconTheme: { primary: 'var(--danger)', secondary: 'var(--text-inverse)' },
          },
        }}
      />

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-lg">

        {/* Header */}
        <div className="p-4 md:p-6 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/admin/admin-setting')}
                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20 flex-shrink-0">
                <LayoutGrid className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">UI Design System</h2>
                <p className="text-xs text-[var(--text-secondary)]">Layout, shape & spacing — independent of color theme</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={handleReset}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--bg-hover)] border border-[var(--border-color)] hover:border-[var(--border-hover)] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button 
                onClick={handleApply}
                disabled={isUpdating || selected === currentUIStyle}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="p-3 sm:p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {availableUIStyles.map((style) => {
            const isSelected = selected === style.id;
            const isCurrent = currentUIStyle === style.id;
            const Icon = style.icon || LayoutGrid;

            return (
              <div 
                key={style.id} 
                onClick={() => handleSelect(style.id)}
                className={`relative cursor-pointer rounded-2xl border-2 p-3 sm:p-4 transition-all duration-300
                  ${isSelected
                    ? 'border-[var(--accent-primary)] shadow-lg scale-[1.02]'
                    : 'border-transparent hover:border-[var(--border-hover)]'
                  } bg-[var(--bg-hover)]`}
              >
                {isCurrent && (
                  <span className="absolute top-2 right-2 bg-[var(--success)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ACTIVE
                  </span>
                )}
                <UIStylePreview styleId={style.id} />
                <div className="flex items-center gap-2 mt-3">
                  <Icon className="w-4 h-4 text-[var(--accent-primary)]" />
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">{style.name}</h4>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">{style.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UIStyleSettings;