import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../service/api";

/**
 * EmployeeProtectedRoute — protects all /layout/* employee pages.
 * Allows: employee
 * Redirects teamLeader/superAdmin → /admin/dashboard
 * Redirects unauthenticated → /login
 * Auto-logouts deleted users
 */
const EmployeeProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    let cachedUser;
    try {
      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!userStr || !token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      cachedUser = JSON.parse(userStr);
      const savedRole = cachedUser?.role || localStorage.getItem("role");
      if (!savedRole) throw new Error("Invalid saved session");

      setIsAuthenticated(true);
      setUserRole(savedRole);
      setLoading(false);

      const res = await api.get("/auth/me");
      if (res.data.success && res.data.user) {
        setIsAuthenticated(true);
        setUserRole(res.data.user.role);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("role", res.data.user.role);
      }
    } catch (error) {
      // Check if user was deleted
      if (error.response?.status === 401 && error.response?.data?.code === 'USER_DELETED') {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      if (!cachedUser) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-neutral-800 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (userRole === "employee") return <Outlet />;

  // teamLeader and superAdmin should use the admin panel
  if (userRole === "teamLeader" || userRole === "superAdmin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default EmployeeProtectedRoute;
