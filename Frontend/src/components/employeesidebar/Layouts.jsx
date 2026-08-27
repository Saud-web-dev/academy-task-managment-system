import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  LogOut,
  Menu,
  X,
  CalendarCheck,
  Briefcase,
  Sparkles,
  ChevronRight,
  UserSquare2,
  FileText,
  ClipboardList,
  ChevronDown,
  Shield,
} from "lucide-react";
import api, { syncUserFromDB } from "../../service/api.js";

const Layout = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [employeeName, setEmployeeName] = useState("Employee");
  const [employeeMarks, setEmployeeMarks] = useState(null);
  const [employeeEmail, setEmployeeEmail] = useState("");

  // ================= GET EMPLOYEE DATA — FRESH FROM DB =================
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsed = JSON.parse(userData);
          if (parsed.name) setEmployeeName(parsed.name);
          if (parsed.marks !== undefined) setEmployeeMarks(parsed.marks);
          if (parsed.email) setEmployeeEmail(parsed.email);
        }
        const fresh = await syncUserFromDB();
        if (fresh) {
          if (fresh.name) setEmployeeName(fresh.name);
          if (fresh.marks !== undefined) setEmployeeMarks(fresh.marks);
          if (fresh.email) setEmployeeEmail(fresh.email);
        }
      } catch {
        // Silent
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/user/logout");
    } catch {
      // Silent
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      sessionStorage.clear();
      navigate("/login", { replace: true });
    }
  };

  const navItems = [
    { path: "/layout/desboards", icon: LayoutDashboard, label: "Dashboard", description: "Overview" },
    { path: "/layout/attendace", icon: CalendarCheck, label: "Attendance", description: "Track presence" },
    { path: "/layout/taskmanager", icon: Briefcase, label: "Tasks", description: "Manage tasks" },
    { path: "/layout/daily-updates", icon: ClipboardList, label: "Daily Updates", description: "Submit daily progress" },
    { path: "/layout/my-documents", icon: FileText, label: "My Documents", description: "Deduction receipts" },
  ];

  // Profile dropdown items
  const profileItems = [
    { path: "/layout/profile", icon: User, label: "My Profile" },
    { type: "divider" },
    { action: "logout", icon: LogOut, label: "Sign Out", danger: true },
  ];

  const navLinkStyle = ({ isActive }) =>
    `ui-sidebar-item relative flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group ${
      isActive
        ? "active bg-[#e8e0d8] text-[#2c1810] border border-[#d4c8bc] shadow-md shadow-[#d4c8bc]/20"
        : "text-[#4a3f38] hover:text-[#2c1810] hover:bg-[#f0ebe5]"
    }`;

  return (
    <div className="flex min-h-screen bg-[#f5f0eb] text-[#2c1810] antialiased relative">

      {/* ================= MOBILE OVERLAY ================= */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className={`
        w-[280px] bg-[#faf7f3] border-r border-[#e5ddd5] flex flex-col fixed h-full z-50
        transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>

        {/* BRANDING/LOGO */}
        <div className="p-5 border-b border-[#e5ddd5] flex items-center justify-between lg:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-[#2c1810] p-2.5 rounded-xl text-white shadow-lg shadow-[#2c1810]/20">
                <UserSquare2 size={20} className="relative z-10" />
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#4CAF50] rounded-full border-2 border-[#faf7f3] animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#2c1810] leading-none">Employee</h2>
              <p className="text-[10px] text-[#8a7a6a] font-medium mt-1 tracking-widest uppercase flex items-center gap-1.5">
                <Sparkles size={10} />
                Portal
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-xl text-[#8a7a6a] hover:bg-[#f0ebe5] hover:text-[#2c1810] transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* SIDEBAR NAVIGATION */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 mb-4">
            <p className="text-[11px] font-semibold text-[#8a7a6a] uppercase tracking-[0.2em]">Main Navigation</p>
            <div className="h-px bg-[#e5ddd5] mt-2"></div>
          </div>
          
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `
                    ui-sidebar-item relative flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group
                    ${isActive 
                      ? "active bg-[#e8e0d8] text-[#2c1810] border border-[#d4c8bc] shadow-md shadow-[#d4c8bc]/20" 
                      : "text-[#4a3f38] hover:text-[#2c1810] hover:bg-[#f0ebe5]"
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className={`
                    p-1.5 rounded-xl transition-all duration-300
                    ${({ isActive }) => isActive 
                      ? "bg-[#2c1810]/10 text-[#2c1810]" 
                      : "text-[#8a7a6a] group-hover:text-[#2c1810] group-hover:bg-[#2c1810]/10"
                    }
                  `}>
                    <item.icon size={20} className="transition-transform group-hover:scale-110" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="leading-tight text-sm font-semibold">{item.label}</span>
                    <span className="text-[10px] text-[#8a7a6a] group-hover:text-[#4a3f38] transition-colors">
                      {item.description}
                    </span>
                  </div>
                  {hoveredItem === item.path && (
                    <ChevronRight size={16} className="text-[#2c1810] animate-pulse" />
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* ================= USER PROFILE AT BOTTOM ================= */}
        <div className="border-t border-[#e5ddd5] p-4 bg-[#f5f0eb]/50">
          <div className="relative">
            {/* Profile Button */}
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#f0ebe5] transition-all duration-200 group"
            >
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#2c1810] to-[#4a3f38] flex items-center justify-center text-white text-sm font-bold shadow-md">
                  {employeeName.charAt(0)?.toUpperCase() || "E"}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#4CAF50] rounded-full border-2 border-[#faf7f3] animate-pulse"></div>
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-[#2c1810] truncate">
                  {employeeName}
                </p>
                <p className="text-xs text-[#8a7a6a] flex items-center gap-1">
                  <Shield size={11} className="text-[#8a7a6a] flex-shrink-0" />
                  <span className="truncate">Employee</span>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {employeeMarks !== null && (
                  <div className="text-right pr-2 border-r border-[#e5ddd5]">
                    <p className="text-sm font-bold text-[#2c1810]">{employeeMarks}</p>
                    <p className="text-[8px] text-[#8a7a6a] uppercase">marks</p>
                  </div>
                )}
                <ChevronDown 
                  size={16} 
                  className={`text-[#8a7a6a] transition-transform duration-200 ${
                    isProfileDropdownOpen ? "rotate-180" : ""
                  }`} 
                />
              </div>
            </button>

            {/* ================= DROPDOWN MENU (Opens Upwards) ================= */}
            {isProfileDropdownOpen && (
              <div className="absolute left-0 right-0 bottom-full mb-2 bg-[#faf7f3] border border-[#e5ddd5] rounded-xl shadow-2xl shadow-black/10 py-1 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200 overflow-hidden">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-[#e5ddd5] bg-[#f5f0eb]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2c1810] to-[#4a3f38] flex items-center justify-center text-white text-sm font-bold shadow-md">
                      {employeeName.charAt(0)?.toUpperCase() || "E"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#2c1810]">
                        {employeeName}
                      </p>
                      <p className="text-xs text-[#8a7a6a] flex items-center gap-1">
                        <Shield size={12} className="text-[#8a7a6a]" />
                        Employee
                      </p>
                      <p className="text-[10px] text-[#8a7a6a] truncate max-w-[150px]">
                        {employeeEmail}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dropdown Items */}
                <div className="py-1">
                  {profileItems.map((item, index) => {
                    if (item.type === "divider") {
                      return (
                        <div key={`divider-${index}`} className="h-px bg-[#e5ddd5] my-1" />
                      );
                    }

                    if (item.action === "logout") {
                      return (
                        <button
                          key={item.label}
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#c0392b] hover:bg-[#c0392b]/10 transition-colors"
                        >
                          <LogOut size={16} />
                          <span>{item.label}</span>
                        </button>
                      );
                    }

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className={({ isActive }) => `
                          flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                          ${isActive 
                            ? "bg-[#e8e0d8] text-[#2c1810]" 
                            : "text-[#4a3f38] hover:bg-[#f0ebe5] hover:text-[#2c1810]"
                          }
                        `}
                      >
                        <item.icon size={16} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
         
        </div>
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col lg:pl-[280px] min-w-0">

        {/* TOP NAVBAR - Simplified (No Profile Dropdown) */}
        <header className="bg-[#faf7f3]/90 backdrop-blur-md border-b border-[#e5ddd5] h-[60px] px-4 sm:px-8 flex justify-between items-center sticky top-0 z-20">

          {/* LEFT - Hamburger & Welcome */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-[#8a7a6a] hover:bg-[#f0ebe5] rounded-xl lg:hidden transition-all duration-300 hover:scale-105"
            >
              <Menu size={22} />
            </button>
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2c1810] flex items-center justify-center text-white text-sm font-bold shadow-md">
                {employeeName.charAt(0)?.toUpperCase() || "E"}
              </div>
              <div>
                <h1 className="text-sm font-semibold text-[#2c1810]">
                  Welcome back, {employeeName}
                </h1>
                <p className="text-[11px] text-[#8a7a6a]">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT - Online Status */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#4CAF50]/10 border border-[#4CAF50]/20 rounded-xl">
              <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse"></div>
              <span className="text-[11px] text-[#4CAF50] font-medium">Live</span>
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main className="p-3 sm:p-4 bg-[#f5f0eb] flex-grow min-h-[calc(100vh-60px)] overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d4c8bc;
          border-radius: 8px;
          transition: background 0.2s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #b8a898;
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #d4c8bc transparent;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f5f0eb;
        }
        ::-webkit-scrollbar-thumb {
          background: #d4c8bc;
          border-radius: 10px;
          border: 2px solid #f5f0eb;
          transition: background 0.3s ease;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #b8a898;
        }
        ::-webkit-scrollbar-corner {
          background: #f5f0eb;
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: #d4c8bc #f5f0eb;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes slideInFromBottom {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-in-from-bottom-2 {
          animation: slideInFromBottom 0.2s ease-out;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default Layout;