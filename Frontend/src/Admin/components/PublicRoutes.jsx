import { Navigate, Outlet } from "react-router-dom";

const EmployeeRoutes = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // only employee allowed
  return role === "employee"
    ? <Outlet />
    : <Navigate to="/layout/desboards" replace />;
};

export default EmployeeRoutes;