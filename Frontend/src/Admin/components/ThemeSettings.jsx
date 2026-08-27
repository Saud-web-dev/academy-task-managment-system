import React, { useState, useEffect } from 'react';
import { useTheme } from '../../Context/ThemeContext';
import {
  Check, Palette, Loader2, ArrowLeft,
  Eye, RefreshCw, Sparkles, MonitorSmartphone, Moon, Code2,
  Terminal, Ghost, Snowflake, CircleDot, Sunset, Sunrise
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// ============================================
// ERROR BOUNDARY
// ============================================
class ThemeSettingsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md text-center">
            <h3 className="text-red-400 font-semibold mb-2">Something went wrong</h3>
            <p className="text-sm text-neutral-400 mb-4">Failed to load theme settings</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================
// LOCAL FALLBACK — 10 Professional Developer Themes
// ============================================
const LOCAL_THEMES = [
  { id: 'win-light', name: 'Windows Light', icon: MonitorSmartphone, description: 'Windows 11 Fluent — clean & bright', colors: ['#0078D4', '#106EBE', '#C7E0F4', '#E5E5E5', '#FAFAFA', '#FFFFFF'] },
  { id: 'win-dark', name: 'Windows Dark', icon: Moon, description: 'Windows 11 Fluent — dark mode', colors: ['#202020', '#2C2C2C', '#3B3B3B', '#60CDFF', '#99DFFF', '#FFFFFF'] },
  { id: 'vscode-dark', name: 'VS Code Dark+', icon: Code2, description: 'The editor default every dev knows', colors: ['#1E1E1E', '#252526', '#3C3C3C', '#007ACC', '#4EC9B0', '#D4D4D4'] },
  { id: 'github-dark', name: 'GitHub Dark', icon: Terminal, description: 'Crisp contrast, GitHub-native feel', colors: ['#0D1117', '#161B22', '#21262D', '#30363D', '#58A6FF', '#E6EDF3'] },
  { id: 'dracula', name: 'Dracula', icon: Ghost, description: 'High-contrast purple & pink classic', colors: ['#282A36', '#44475A', '#6272A4', '#BD93F9', '#FF79C6', '#F8F8F2'] },
  { id: 'nord', name: 'Nord', icon: Snowflake, description: 'Arctic, muted blues — easy on the eyes', colors: ['#2E3440', '#3B4252', '#434C5E', '#4C566A', '#88C0D0', '#ECEFF4'] },
  { id: 'one-dark', name: 'One Dark Pro', icon: CircleDot, description: "Atom's iconic dark palette", colors: ['#21252B', '#282C34', '#3E4451', '#61AFEF', '#98C379', '#ABB2BF'] },
  { id: 'monokai', name: 'Monokai Pro', icon: Sparkles, description: 'Punchy, vibrant syntax-inspired look', colors: ['#221F22', '#2D2A2E', '#403E41', '#A9DC76', '#FF6188', '#FCFCFA'] },
  { id: 'solarized-dark', name: 'Solarized Dark', icon: Sunset, description: 'Low-contrast, scientifically tuned dark', colors: ['#002B36', '#073642', '#586E75', '#268BD2', '#2AA198', '#EEE8D5'] },
  { id: 'solarized-light', name: 'Solarized Light', icon: Sunrise, description: 'Low-contrast, scientifically tuned light', colors: ['#FDF6E3', '#EEE8D5', '#93A1A1', '#586E75', '#268BD2', '#073642'] },
];

// ============================================
// LAYERED PILL-STACK PREVIEW
// ============================================
const ThemeColorStack = ({ colors = [], size = 'md' }) => {
  const swatches = colors.slice(0, 6);
  const count = swatches.length || 1;
  const isSmall = size === 'sm';
  const step = isSmall ? 12 : 16;
  const barHeight = isSmall ? 22 : 30;
  const stackHeight = step * (count - 1) + barHeight;

  return (
    <div className="relative w-full" style={{ height: stackHeight }}>
      {swatches.map((color, i) => {
        const widthPct = 58 + (i / Math.max(count - 1, 1)) * 42;
        return (
          <div
            key={i}
            className="absolute left-1/2 flex items-center rounded-full px-3 shadow-md"
            style={{
              top: i * step,
              width: `${widthPct}%`,
              height: barHeight,
              backgroundColor: color,
              transform: 'translateX(-50%)',
              zIndex: i,
              boxShadow: i === count - 1 ? `0 6px 18px ${color}55` : '0 2px 6px rgba(0,0,0,0.25)',
            }}
          >
            {!isSmall && (
              <span className="text-[10px] font-mono font-bold opacity-80 mix-blend-difference text-white truncate">
                {color}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// THEME SETTINGS COMPONENT
// ============================================
const ThemeSettings = () => {
  const navigate = useNavigate();

  let themeContext;
  try {
    themeContext = useTheme();
  } catch {
    themeContext = null;
  }

  const currentTheme = themeContext?.currentTheme || 'vscode-dark';
  const updateTheme = themeContext?.updateTheme;
  const loading = themeContext?.loading || false;
  const themeChanged = themeContext?.themeChanged || false;
  const applyTheme = themeContext?.applyTheme;

  let availableThemes = LOCAL_THEMES;
  try {
    if (themeContext && typeof themeContext === 'object') {
      const contextThemes = themeContext.availableThemes;
      if (Array.isArray(contextThemes) && contextThemes.length > 0) {
        availableThemes = contextThemes.map(theme => ({
          id: theme.id || 'unknown',
          name: theme.name || 'Unknown',
          icon: theme.icon || Palette,
          description: theme.description || '',
          colors: theme.previewColors || theme.colors || ['#1E1E1E', '#D4D4D4']
        }));
      }
    }
  } catch {
    availableThemes = LOCAL_THEMES;
  }

  if (!Array.isArray(availableThemes) || availableThemes.length === 0) {
    availableThemes = LOCAL_THEMES;
  }

  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setSelectedTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
    try {
      if (applyTheme && typeof applyTheme === 'function') {
        applyTheme(themeId);
        const themeName = availableThemes.find(t => t.id === themeId)?.name || themeId;
        toast.success(`Previewing ${themeName}`);
      } else {
        document.documentElement.setAttribute('data-theme', themeId);
        document.body.setAttribute('data-theme', themeId);
        localStorage.setItem('user-theme', themeId);
        const themeName = availableThemes.find(t => t.id === themeId)?.name || themeId;
        toast.success(`Previewing ${themeName}`);
      }
    } catch {
      toast.error('Failed to preview');
    }
  };

  const handleApplyTheme = async () => {
    if (selectedTheme === currentTheme) {
      toast.success('Already applied');
      return;
    }
    if (!updateTheme) {
      toast.error('Update not available');
      return;
    }
    setIsUpdating(true);
    try {
      const result = await updateTheme(selectedTheme);
      if (result?.success) {
        const themeName = availableThemes.find(t => t.id === selectedTheme)?.name || selectedTheme;
        toast.success(`Theme changed to ${themeName}`);
      } else {
        toast.error('Failed to update');
      }
    } catch {
      toast.error('Failed to update');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetPreview = () => {
    try {
      document.documentElement.setAttribute('data-theme', currentTheme);
      document.body.setAttribute('data-theme', currentTheme);
      localStorage.setItem('user-theme', currentTheme);
      setSelectedTheme(currentTheme);
      toast.success('Reset to current');
    } catch {
      toast.error('Failed to reset');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
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
                <Palette className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">Theme Settings</h2>
                <p className="text-xs text-[var(--text-secondary)]">{availableThemes.length} professional developer themes</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={handleResetPreview}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--bg-hover)] border border-[var(--border-color)] hover:border-[var(--border-hover)] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button 
                onClick={handleApplyTheme}
                disabled={isUpdating || selectedTheme === currentTheme}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-[var(--accent-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Apply Theme
              </button>
            </div>
          </div>
        </div>

        {/* Current Theme Info */}
        <div className="p-4 md:p-6 bg-[var(--bg-hover)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Current Theme</p>
              <div className="flex items-center gap-2 mt-1">
                {(() => {
                  const current = availableThemes.find(t => t.id === currentTheme);
                  const Icon = current?.icon || Palette;
                  return (
                    <>
                      <Icon className="w-5 h-5 text-[var(--accent-primary)]" />
                      <p className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">{current?.name || 'Unknown'}</p>
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-36 sm:w-44">
                <ThemeColorStack colors={availableThemes.find(t => t.id === currentTheme)?.colors} size="sm" />
              </div>
              {themeChanged && (
                <span className="text-xs text-[var(--success)] bg-[var(--success)]/10 px-3 py-1 rounded-full border border-[var(--success)]/20 flex-shrink-0">
                  <Sparkles className="w-3 h-3 inline mr-1" /> Updated
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview Notice */}
        <div className="p-3 md:p-4 bg-[var(--accent-primary)]/5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Eye className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" />
            <span className="text-xs sm:text-sm">Click any theme card to see live preview. Colors change instantly!</span>
          </div>
        </div>

        {/* Theme Grid */}
        <div className="p-3 sm:p-4 md:p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 sm:mb-5">
            Choose Your Theme <span className="text-[var(--text-muted)] font-normal">({availableThemes.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
            {availableThemes.map((theme) => {
              const isSelected = selectedTheme === theme.id;
              const isCurrent = currentTheme === theme.id;
              const IconComponent = theme.icon || Palette;

              return (
                <div 
                  key={theme.id} 
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`relative cursor-pointer rounded-3xl border-2 overflow-hidden transition-all duration-500 group
                    ${isSelected
                      ? 'border-[var(--accent-primary)] shadow-2xl shadow-[var(--accent-primary)]/30 scale-[1.03] -translate-y-1'
                      : 'border-transparent hover:shadow-xl hover:scale-[1.02]'
                    }
                    bg-[var(--bg-card)]
                  `}
                >
                  {/* Badges */}
                  {isCurrent && (
                    <div className="absolute top-2 right-2 z-30 bg-[var(--success)] text-white text-[10px] font-bold px-2 sm:px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <Check className="w-3 h-3" /> ACTIVE
                    </div>
                  )}
                  {isSelected && !isCurrent && (
                    <div className="absolute top-2 right-2 z-30 bg-[var(--accent-primary)] text-[var(--text-inverse)] text-[10px] font-bold px-2 sm:px-3 py-1 rounded-full shadow-lg">
                      PREVIEW
                    </div>
                  )}

                  {/* Color Stack */}
                  <div
                    className="relative w-full pt-6 sm:pt-8 pb-3 sm:pb-4 px-3 sm:px-4 flex items-end justify-center"
                    style={{
                      background: `linear-gradient(180deg, ${theme.colors?.[theme.colors.length - 1] || '#fff'}22 0%, ${theme.colors?.[0] || '#000'}33 100%)`
                    }}
                  >
                    <ThemeColorStack colors={theme.colors} />
                  </div>

                  {/* Card Content */}
                  <div className="p-3 sm:p-4 pt-2 sm:pt-3 flex flex-col items-center text-center gap-1 sm:gap-2">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-300
                      ${isSelected
                        ? 'bg-[var(--accent-primary)]/20 scale-110'
                        : 'bg-[var(--bg-hover)]'
                      }`}
                    >
                      <IconComponent className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`} />
                    </div>

                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">{theme.name}</h4>
                      <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] mt-0.5 leading-tight">{theme.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Section */}
        <div className="p-4 md:p-6 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-[var(--bg-hover)] rounded-xl p-3 sm:p-4">
              <h4 className="text-sm font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <Palette className="w-4 h-4 text-[var(--accent-primary)]" /> Professional Themes
              </h4>
              <ul className="text-xs text-[var(--text-secondary)] space-y-1.5">
                <li>• 10 palettes trusted by developers</li>
                <li>• Windows Fluent light & dark included</li>
                <li>• VS Code, GitHub, Dracula, Nord & more</li>
              </ul>
            </div>
            <div className="bg-[var(--bg-hover)] rounded-xl p-3 sm:p-4">
              <h4 className="text-sm font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4 text-[var(--accent-primary)]" /> Live Preview
              </h4>
              <ul className="text-xs text-[var(--text-secondary)] space-y-1.5">
                <li>• Click card to preview instantly</li>
                <li>• Whole app changes in real-time</li>
                <li>• Apply to save permanently</li>
              </ul>
            </div>
            <div className="bg-[var(--bg-hover)] rounded-xl p-3 sm:p-4">
              <h4 className="text-sm font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" /> Features
              </h4>
              <ul className="text-xs text-[var(--text-secondary)] space-y-1.5">
                <li>• Light & dark modes included</li>
                <li>• Persists across sessions</li>
                <li>• Accurate, professional hex codes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ThemeSettingsWithErrorBoundary() {
  return (
    <ThemeSettingsErrorBoundary>
      <ThemeSettings />
    </ThemeSettingsErrorBoundary>
  );
}