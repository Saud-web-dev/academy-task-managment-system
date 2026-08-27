import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../service/api";

/**
 * SuperAdminRoute — protects financial pages.
 * Allows: superAdmin only
 * Redirects teamLeader → /admin/dashboard
 * Redirects employee → /layout/desboards
 * Redirects unauthenticated → /login
 */
const SuperAdminRoute = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      const res = await api.get("/auth/me");
      if (res.data.success && res.data.user) {
        setIsAuthenticated(true);
        setUserRole(res.data.user.role);
      } else {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      }
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--border-color)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-secondary)]">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (userRole === "superAdmin") return <Outlet />;

  // teamLeader gets redirected to admin dashboard (not unauthorized)
  if (userRole === "teamLeader") return <Navigate to="/admin/dashboard" replace />;

  // employees
  return <Navigate to="/layout/desboards" replace />;
};

export default SuperAdminRoute;
