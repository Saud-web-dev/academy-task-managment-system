import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../service/api';
import {
  MonitorSmartphone, Moon, Code2, Terminal, Ghost,
  Snowflake, CircleDot, Sparkles, Sunset, Sunrise
} from 'lucide-react';

// ============================================
// 10 PROFESSIONAL DEVELOPER THEMES
// (Windows Fluent + the editor themes devs actually use)
// ============================================
const THEMES_CONFIG = [
  {
    id: 'win-light',
    name: 'Windows Light',
    icon: MonitorSmartphone,
    description: 'Windows 11 Fluent — clean & bright',
    previewColors: ['#0078D4', '#106EBE', '#C7E0F4', '#E5E5E5', '#FAFAFA', '#FFFFFF']
  },
  {
    id: 'win-dark',
    name: 'Windows Dark',
    icon: Moon,
    description: 'Windows 11 Fluent — dark mode',
    previewColors: ['#202020', '#2C2C2C', '#3B3B3B', '#60CDFF', '#99DFFF', '#FFFFFF']
  },
  {
    id: 'vscode-dark',
    name: 'VS Code Dark+',
    icon: Code2,
    description: 'The editor default every dev knows',
    previewColors: ['#1E1E1E', '#252526', '#3C3C3C', '#007ACC', '#4EC9B0', '#D4D4D4']
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    icon: Terminal,
    description: 'Crisp contrast, GitHub-native feel',
    previewColors: ['#0D1117', '#161B22', '#21262D', '#30363D', '#58A6FF', '#E6EDF3']
  },
  {
    id: 'dracula',
    name: 'Dracula',
    icon: Ghost,
    description: 'High-contrast purple & pink classic',
    previewColors: ['#282A36', '#44475A', '#6272A4', '#BD93F9', '#FF79C6', '#F8F8F2']
  },
  {
    id: 'nord',
    name: 'Nord',
    icon: Snowflake,
    description: 'Arctic, muted blues — easy on the eyes',
    previewColors: ['#2E3440', '#3B4252', '#434C5E', '#4C566A', '#88C0D0', '#ECEFF4']
  },
  {
    id: 'one-dark',
    name: 'One Dark Pro',
    icon: CircleDot,
    description: "Atom's iconic dark palette",
    previewColors: ['#21252B', '#282C34', '#3E4451', '#61AFEF', '#98C379', '#ABB2BF']
  },
  {
    id: 'monokai',
    name: 'Monokai Pro',
    icon: Sparkles,
    description: 'Punchy, vibrant syntax-inspired look',
    previewColors: ['#221F22', '#2D2A2E', '#403E41', '#A9DC76', '#FF6188', '#FCFCFA']
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    icon: Sunset,
    description: 'Low-contrast, scientifically tuned dark',
    previewColors: ['#002B36', '#073642', '#586E75', '#268BD2', '#2AA198', '#EEE8D5']
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    icon: Sunrise,
    description: 'Low-contrast, scientifically tuned light',
    previewColors: ['#FDF6E3', '#EEE8D5', '#93A1A1', '#586E75', '#268BD2', '#073642']
  }
];

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      currentTheme: 'vscode-dark',
      availableThemes: THEMES_CONFIG,
      updateTheme: async () => ({ success: false }),
      loading: false,
      themeChanged: false,
      setThemeChanged: () => {},
      applyTheme: (themeId) => {
        if (themeId) {
          document.documentElement.setAttribute('data-theme', themeId);
          document.body.setAttribute('data-theme', themeId);
          localStorage.setItem('user-theme', themeId);
        }
      },
    };
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('vscode-dark');
  const [loading, setLoading] = useState(true);
  const [themeChanged, setThemeChanged] = useState(false);

  const applyTheme = (themeId) => {
    if (!themeId) return;
    document.documentElement.setAttribute('data-theme', themeId);
    document.body.setAttribute('data-theme', themeId);
    localStorage.setItem('user-theme', themeId);
  };

  const fetchTheme = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/theme');
      const theme = res.data?.value || 'vscode-dark';
      setCurrentTheme(theme);
      applyTheme(theme);
    } catch (error) {
      const savedTheme = localStorage.getItem('user-theme') || 'vscode-dark';
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    } finally {
      setLoading(false);
    }
  };

  const updateTheme = async (themeId) => {
    try {
      setLoading(true);
      const themeExists = THEMES_CONFIG.some(t => t.id === themeId);
      if (!themeExists) throw new Error('Invalid theme');

      const response = await api.put('/settings/theme', { theme: themeId });

      if (response.data.success) {
        setCurrentTheme(themeId);
        applyTheme(themeId);
        setThemeChanged(true);
        return { success: true };
      }
      throw new Error(response.data.message);
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheme();
  }, []);

  const value = {
    currentTheme,
    updateTheme,
    applyTheme,
    loading,
    themeChanged,
    setThemeChanged,
    availableThemes: THEMES_CONFIG,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;