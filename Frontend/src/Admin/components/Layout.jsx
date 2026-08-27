import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import api, { syncUserFromDB } from '../../service/api.js';
import {
  LogOut, Menu, X, LayoutDashboard, Users, FolderKanban,
  UserSquare2, CalendarCheck, User, ChevronRight, Sparkles,
  Settings, ChevronDown, Shield, Scissors, FileText,
  DollarSign, BarChart2, Receipt, TrendingUp,
} from 'lucide-react';

import NotificationBadge from '../../components/NotificationBadge.jsx'

// ── Role display helpers ──────────────────────────────────────────
const getRoleLabel = (role) => {
  if (role === 'superAdmin') return 'Admin (Super Admin)';
  if (role === 'teamLeader') return 'Team Leader';
  if (role === 'admin') return 'Team Leader'; // legacy
  return 'Employee';
};

const getRoleColor = (role) => {
  if (role === 'superAdmin') return 'text-yellow-500';
  if (role === 'teamLeader' || role === 'admin') return 'text-[var(--accent-primary)]';
  return 'text-[var(--text-muted)]';
};

const Layout = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) setAdminUser(JSON.parse(userData));
        const fresh = await syncUserFromDB();
        if (fresh) setAdminUser(fresh);
      } catch { /* silent */ }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* silent */ }
    finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.clear();
      navigate('/login', { replace: true });
    }
  };

  const isSuperAdmin = adminUser?.role === 'superAdmin';

  // Base nav items for teamLeader + superAdmin
  const baseNavItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', description: 'Overview', section: 'main' },
    { path: '/admin/users', icon: Users, label: 'Users', description: 'Manage employees', section: 'management' },
    { path: '/admin/project', icon: FolderKanban, label: 'Projects', description: 'Track progress', section: 'management' },
    { path: '/admin/attendance', icon: CalendarCheck, label: 'Attendance', description: 'Track presence', section: 'management' },
    { path: '/admin/attendance-marking', icon: Scissors, label: 'Mark Deductions', description: 'Assign mark cuts', section: 'management' },
    { path: '/admin/documents', icon: FileText, label: 'Documents', description: 'Deduction receipts', section: 'management' },
    { path: '/admin/admin-setting', icon: Settings, label: 'Settings', description: 'System settings', section: 'settings' },
  ];

  // Additional items for superAdmin only
  const superAdminNavItems = [
    { path: '/admin/expenses', icon: Receipt, label: 'Expenses', description: 'Manage expenses', section: 'financial' },
    { path: '/admin/financial-dashboard', icon: DollarSign, label: 'Financial Dashboard', description: 'Revenue & profit', section: 'financial' },
    { path: '/admin/financial-reports', icon: BarChart2, label: 'Financial Reports', description: 'Monthly reports', section: 'financial' },
  ];

  const navItems = useMemo(() =>
    isSuperAdmin ? [...baseNavItems, ...superAdminNavItems] : baseNavItems,
    [isSuperAdmin]
  );

  const sections = [
    { key: 'main', label: 'Main' },
    { key: 'management', label: 'Management' },
    ...(isSuperAdmin ? [{ key: 'financial', label: 'Financial' }] : []),
    { key: 'settings', label: 'Settings' },
  ];

  const profileItems = [
    { path: '/admin/profile', icon: User, label: 'My Profile' },
    { path: '/admin/admin-setting', icon: Settings, label: 'Settings' },
    { type: 'divider' },
    { action: 'logout', icon: LogOut, label: 'Sign Out', danger: true },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased relative">

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside className={`
        ui-sidebar flex flex-col fixed h-full z-50 transition-transform duration-300 ease-in-out
        lg:translate-x-0 w-[260px] bg-[var(--bg-card)] border-r border-[var(--border-color)]
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* Branding */}
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between lg:justify-start gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className={`p-2 rounded-lg text-[var(--text-inverse)] shadow-lg ${isSuperAdmin ? 'bg-yellow-500' : 'bg-[var(--accent-primary)]'}`}>
                <UserSquare2 size={18} />
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--success)] rounded-full border-2 border-[var(--bg-card)] animate-pulse" />
            </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)] leading-none">
                  {isSuperAdmin ? 'Admin' : 'Team Leader'}
                </h2>
                <p className="text-[8px] text-[var(--accent-primary)] font-medium mt-0.5 tracking-widest uppercase flex items-center gap-1">
                  <Sparkles size={8} />
                  {isSuperAdmin ? 'Super Admin' : 'Management'}
                </p>
              </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar space-y-4">
          {sections.map((section) => {
            const items = navItems.filter(i => i.section === section.key);
            if (!items.length) return null;
            return (
              <div key={section.key}>
                <div className="px-3 mb-1.5">
                  <p className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.15em]">
                    {section.label}
                  </p>
                  <div className="h-px bg-[var(--border-color)] mt-1" />
                </div>
                <ul className="space-y-0.5">
                  {items.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) => `
                          ui-sidebar-item relative flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-all duration-200 group rounded-lg
                          ${isActive
                            ? 'bg-[var(--accent-primary)]/10 text-[var(--text-primary)] border border-[var(--accent-primary)]/20'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                          }
                        `}
                        onClick={() => setIsMobileMenuOpen(false)}
                        onMouseEnter={() => setHoveredItem(item.path)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <item.icon size={16} className="transition-transform group-hover:scale-110 flex-shrink-0" />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="leading-tight text-xs truncate">{item.label}</span>
                          <span className="text-[8px] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors truncate">
                            {item.description}
                          </span>
                        </div>
                        {hoveredItem === item.path && (
                          <ChevronRight size={12} className="text-[var(--accent-primary)] flex-shrink-0" />
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="border-t border-[var(--border-color)] p-3 bg-[var(--bg-secondary)]/50">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-hover)] transition-all duration-200 group"
            >
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-inverse)] font-bold text-sm shadow-lg ${
                  isSuperAdmin
                    ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                    : 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-hover)]'
                }`}>
                  {adminUser?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--success)] rounded-full border-2 border-[var(--bg-card)] animate-pulse" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {adminUser?.name || 'Admin'}
                </p>
                <p className={`text-xs flex items-center gap-1 ${getRoleColor(adminUser?.role)}`}>
                  <Shield size={11} className="flex-shrink-0" />
                  <span className="truncate">{getRoleLabel(adminUser?.role)}</span>
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`text-[var(--text-muted)] transition-transform duration-200 flex-shrink-0 ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown */}
            {isProfileDropdownOpen && (
              <div className="absolute left-0 right-0 bottom-full mb-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl shadow-black/20 py-1 z-30 overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-inverse)] font-bold text-sm ${
                      isSuperAdmin ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-hover)]'
                    }`}>
                      {adminUser?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{adminUser?.name || 'Admin'}</p>
                      <p className={`text-xs flex items-center gap-1 ${getRoleColor(adminUser?.role)}`}>
                        <Shield size={12} />
                        {getRoleLabel(adminUser?.role)}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">{adminUser?.email || ''}</p>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  {profileItems.map((item, index) => {
                    if (item.type === 'divider') return <div key={`d-${index}`} className="h-px bg-[var(--border-color)] my-1" />;
                    if (item.action === 'logout') return (
                      <button key={item.label} onClick={() => { setIsProfileDropdownOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors">
                        <LogOut size={16} /><span>{item.label}</span>
                      </button>
                    );
                    return (
                      <NavLink key={item.path} to={item.path} onClick={() => setIsProfileDropdownOpen(false)}
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isActive ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                        }`}>
                        <item.icon size={16} /><span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:pl-[260px] min-w-0">
        <header className="lg:hidden bg-[var(--bg-card)] border-b border-[var(--border-color)] h-14 px-4 flex justify-between items-center sticky top-0 z-20">
          <button onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 -ml-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded-lg transition">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-3">
            {/* ✅ NOTIFICATION BADGE */}
            <NotificationBadge />
            
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-inverse)] font-bold text-sm ${
              isSuperAdmin ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-hover)]'
            }`}>
              {adminUser?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <span className="text-sm font-medium text-[var(--text-primary)] hidden xs:block">
              {adminUser?.name || 'Admin'}
            </span>
          </div>
        </header>

        <main className="p-4 sm:p-6 bg-[var(--bg-primary)] flex-grow min-h-[calc(100vh-56px)] lg:min-h-screen overflow-y-auto custom-scrollbar">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="w-10 h-10 border-4 border-[var(--border-color)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: var(--border-color) transparent; }
        ::-webkit-scrollbar { width: 7px; height: 7px; }
        ::-webkit-scrollbar-track { background: var(--bg-primary); }
        ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; border: 2px solid var(--bg-primary); }
        ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
        * { scrollbar-width: thin; scrollbar-color: var(--border-color) var(--bg-primary); }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
      `}</style>
    </div>
  );
};

export default Layout;
