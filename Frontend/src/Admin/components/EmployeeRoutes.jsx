import { Navigate, Outlet } from "react-router-dom";

const EmployeeRoutes = () => {
  const userStr = localStorage.getItem("user");
  
  if (!userStr) {
    // No user logged in - allow access to public pages (signup/login)
    return <Outlet />;
  }

  try {
    const user = JSON.parse(userStr);
    
    // User is logged in - redirect based on role
    if (user.role === "teamLeader" || user.role === "superAdmin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (user.role === "employee") {
      return <Navigate to="/layout/desboards" replace />;
    }
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    // Clear invalid data
    localStorage.removeItem("user");
  }

  // Default: allow access
  return <Outlet />;
};

export default EmployeeRoutes;