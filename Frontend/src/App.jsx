import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import './index.css';

// ============================================
// ✅ REGULAR IMPORTS - Context Providers (Must be synchronous)
// ============================================
import { ThemeProvider } from "./Context/ThemeContext.jsx";
import { UIStyleProvider } from "./Context/Uistylecontext.jsx";
import EmployeeAttanddanceHistory from "./Pages/EmployeeAttanddanceHistory.jsx";
import { initPushNotifications } from "./service/pushNotificationService.js";

import RankingEmployee from './Pages/RankingEmployee'

// ============================================
// ✅ LAZY LOADING - Only for route components
// ============================================

// Public Pages
const Signup = lazy(() => import("./Pages/Signup"));
const Login = lazy(() => import("./Pages/Login"));
const AuthRouter = lazy(() => import("./components/AuthRouter"));
const TestRedirect = lazy(() => import("./Pages/TestRedirect"));

// Employee Pages
const Layouts = lazy(() => import("./components/employeesidebar/Layouts"));
const Desboards = lazy(() => import("./Pages/Desboards"));
const TaskManager = lazy(() => import("./Pages/TaskManager"));
const ProjectManagment = lazy(() => import("./Pages/ProjectManagment"));
const Attendace = lazy(() => import("./Pages/Attenddance"));
const EmployeeProfile = lazy(() => import("./Pages/EmployeeProfile"));
const DailyUpdates = lazy(() => import("./Pages/DailyUpdates"));
const MyDocuments = lazy(() => import("./Pages/MyDocuments"));

// Admin Components
const Layout = lazy(() => import("./Admin/components/Layout"));
const Desboard = lazy(() => import("./Admin/pages/Desboard"));
const Users = lazy(() => import("./Admin/pages/Users"));
const Profile = lazy(() => import("./Admin/pages/Profile"));
const Project = lazy(() => import("./Admin/pages/Project"));
const AdminAttendance = lazy(() => import("./Admin/pages/AdminAttenddance"));
const EmployeesRanking = lazy(() => import("./Admin/pages/EmployeesRanking"));
const ProjectDetail = lazy(() => import("./Admin/pages/ProjectDetails.jsx"));
const UserDetail = lazy(() => import("./Admin/pages/UserDetails.jsx"));
const DeadlineRanking = lazy(() => import("./Admin/pages/DeadlineRanking.jsx"));
const History = lazy(() => import("./Admin/pages/History.jsx"));
const AttenddanceHistory = lazy(() => import("./Admin/pages/AttenddanceHistory.jsx"));
const AttendanceMarking = lazy(() => import("./Admin/pages/AttendanceMarking.jsx"));
const AdminDocuments = lazy(() => import("./Admin/pages/AdminDocuments.jsx"));

// Settings
const UIStyleSettings = lazy(() => import("./Admin/components/Uistylesettings.jsx"));
const AdminSettings = lazy(() => import("./Admin/components/AdminSettings.jsx"));
const ThemeSettings = lazy(() => import("./Admin/components/ThemeSettings.jsx"));

// Financial pages (superAdmin only)
const Expenses = lazy(() => import("./Admin/pages/Expenses.jsx"));
const FinancialDashboard = lazy(() => import("./Admin/pages/FinancialDashboard.jsx"));
const FinancialReports = lazy(() => import("./Admin/pages/FinancialReports.jsx"));

// Route Guards
const PrivateRoutes = lazy(() => import("./Admin/components/PrivateRoutes"));
const EmployeeRoutes = lazy(() => import("./Admin/components/EmployeeRoutes"));
const EmployeeProtectedRoute = lazy(() => import("./components/EmployeeProtectedRoute"));
const SuperAdminRoute = lazy(() => import("./Admin/components/SuperAdminRoute"));

// ============================================
// ✅ PAGE LOADER COMPONENT (SSI - Stylish & Next Gen)
// ============================================
const PageLoader = lazy(() => import('./components/SSIPageLoader'));

// ============================================
// MAIN APP COMPONENT
// ============================================
const App = () => {
  // Initialize push notifications on app load
  React.useEffect(() => {
    initPushNotifications();
  }, []);

  return (
    // ✅ Context Providers - No Suspense needed around them
    <ThemeProvider>
      <UIStyleProvider>
        <BrowserRouter>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                padding: '16px 20px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                style: {
                  background: 'var(--bg-card)',
                  borderLeft: '4px solid var(--success)',
                },
                iconTheme: {
                  primary: 'var(--success)',
                  secondary: 'var(--text-inverse)',
                },
              },
              error: {
                style: {
                  background: 'var(--bg-card)',
                  borderLeft: '4px solid var(--danger)',
                },
                iconTheme: {
                  primary: 'var(--danger)',
                  secondary: 'var(--text-inverse)',
                },
              },
              loading: {
                style: {
                  background: 'var(--bg-card)',
                  borderLeft: '4px solid var(--accent-primary)',
                },
                iconTheme: {
                  primary: 'var(--accent-primary)',
                  secondary: 'var(--text-inverse)',
                },
              },
            }}
          />

          {/* ✅ Only route components are lazy loaded */}
          <Suspense fallback={<PageLoader />}>
            <Routes>          

              {/* ===== PUBLIC ROUTES ===== */}
              <Route path="/" element={<AuthRouter />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/test-redirect" element={<TestRedirect />} />

              {/* ===== EMPLOYEE ROUTES ===== */}
              <Route element={<EmployeeProtectedRoute />}>
                <Route path="/layout" element={<Layouts />}>
                  <Route path="desboards" element={<Desboards />} />
                  <Route path="taskmanager" element={<TaskManager />} />
                  <Route path="projectmanagment" element={<ProjectManagment />} />
                  <Route path="attendace" element={<Attendace />} />
                  <Route path="profile" element={<EmployeeProfile />} />
                  <Route path="ranking-employees" element={<RankingEmployee />} />
                  <Route path="employeesAttanddance-history" element={<EmployeeAttanddanceHistory />} />
                  <Route path="daily-updates" element={<DailyUpdates />} />
                  <Route path="my-documents" element={<MyDocuments />} />
                </Route>
              </Route>

              {/* ===== ADMIN ROUTES (teamLeader + superAdmin) ===== */}
              <Route element={<PrivateRoutes />}>
                <Route path="/admin" element={<Layout />}>
                  <Route path="dashboard" element={<Desboard />} />
                  <Route path="users" element={<Users />} />
                  <Route path="users/:userId" element={<UserDetail />} />
                  <Route path="project" element={<Project />} />
                  <Route path="project/:projectId" element={<ProjectDetail />} />
                  <Route path="attendance" element={<AdminAttendance />} />
                  <Route path="attendance-history" element={<AttenddanceHistory />} />
                  <Route path="attendance-marking" element={<AttendanceMarking />} />
                  <Route path="employees-ranking" element={<EmployeesRanking />} />
                  <Route path="deadline-ranking" element={<DeadlineRanking />} />
                  <Route path="history" element={<History />} />
                  <Route path="documents" element={<AdminDocuments />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="theme-settings" element={<ThemeSettings />} />
                  <Route path="ui-settings" element={<UIStyleSettings />} />
                  <Route path="admin-setting" element={<AdminSettings />} />

                  {/* ===== SUPER ADMIN ONLY financial routes (nested inside Layout) ===== */}
                  <Route element={<SuperAdminRoute />}>
                    <Route path="expenses" element={<Expenses />} />
                    <Route path="financial-dashboard" element={<FinancialDashboard />} />
                    <Route path="financial-reports" element={<FinancialReports />} />
                  </Route>
                </Route>
              </Route>

              <Route path="/theme-settings" element={<ThemeSettings />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </UIStyleProvider>
    </ThemeProvider>
  );
};

export default App;
