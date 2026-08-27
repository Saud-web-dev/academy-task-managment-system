import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../service/api";

const AuthRouter = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "null");

      const role = user?.role || localStorage.getItem("role");
      if (token && role) {
        navigate(
          role === "employee" ? "/layout/desboards" : "/admin/dashboard",
          { replace: true }
        );
        return;
      }

      const response = await api.get("/auth/admin/status");
      
      console.log("Admin Status:", response.data);

      if (response.data.adminExists) {
        // Admin exists → Redirect to login
        navigate("/login", { replace: true });
      } else {
        // No admin → Redirect to signup (create first admin)
        navigate("/signup", { replace: true });
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      // Default to login page on error
      navigate("/login", { replace: true });
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-neutral-800 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-neutral-400">Checking system status...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthRouter;
