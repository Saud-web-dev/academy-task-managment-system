import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../service/api";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [adminExists, setAdminExists] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [status, setStatus] = useState({
    type: "",
    message: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  // Check if admin exists on component mount
  useEffect(() => {
    checkAdminStatus();
    redirectAuthenticatedUser();
  }, []);

  const redirectAuthenticatedUser = () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const role = user?.role || localStorage.getItem("role");
      if (token && role) {
        navigate(role === "employee" ? "/layout/desboards" : "/admin/dashboard", {
          replace: true,
        });
      }
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  };

  const checkAdminStatus = async () => {
    try {
      const response = await api.get("/auth/admin/status");
      setAdminExists(response.data.adminExists);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setAdminExists(true);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setIsLoading(true);

    try {
      const res = await api.post("/auth/login", formData);

      if (!res.data.success) throw new Error(res.data.message || "Login failed");
      if (!res.data.user) throw new Error("User data not received from server");

      const user = res.data.user;

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", user.role);

      setStatus({ type: "success", message: "Login successful! Redirecting..." });

      // Small delay to show success message, then redirect
      setTimeout(() => {
        if (user.role === "superAdmin" || user.role === "teamLeader") {
          navigate("/admin/dashboard", { replace: true });
        } else if (user.role === "employee") {
          navigate("/layout/desboards", { replace: true });
        } else {
          setStatus({ type: "error", message: "Invalid user role. Please contact admin." });
          setIsLoading(false);
        }
      }, 500);
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || error.message || "Invalid email or password",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-sans antialiased text-white">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">
            {adminExists ? "Welcome Back" : "Get Started"}
          </h1>
          <p className="text-neutral-400 text-sm">
            {adminExists
              ? "Login to continue to your account"
              : "Create an admin account or login"}
          </p>
        </div>

        {/* Status Alert */}
        {status.message && (
          <div
            className={`p-3 mb-6 text-xs rounded-lg border ${
              status.type === "error"
                ? "bg-red-950/30 text-red-400 border-red-900/50"
                : "bg-emerald-950/30 text-emerald-400 border-emerald-900/50"
            }`}
          >
            {status.message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-[#121212] border border-neutral-800 text-white placeholder-neutral-600 px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-[#121212] border border-neutral-800 text-white placeholder-neutral-600 px-3.5 py-2.5 pr-14 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors duration-150 mt-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>

          {/* Conditional Signup Link - Only show if no admin exists */}
          {!adminExists && (
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-400">
                Don't have an account?{" "}
                <span
                  onClick={() => navigate("/signup")}
                  className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer transition-colors underline underline-offset-2"
                >
                  Create your account
                </span>
              </p>
            </div>
          )}
        </form>

        {/* Footer Terms */}
        <div className="mt-8 pt-4 border-t border-neutral-900 text-center">
          <p className="text-[11px] text-neutral-600 leading-normal">
            By continuing, you agree to our{" "}
            <a
              href="#terms"
              className="hover:text-neutral-400 transition-colors underline underline-offset-2"
            >
              Terms of Service
            </a>{" "}
            &{" "}
            <a
              href="#privacy"
              className="hover:text-neutral-400 transition-colors underline underline-offset-2"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
