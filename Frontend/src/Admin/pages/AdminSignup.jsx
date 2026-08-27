import React, { useState } from "react";
import api from "../../service/api.js";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';

const AdminSignup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "teamLeader"
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await api.post("/auth/register-first-admin", {
        ...formData,
        role: "teamLeader"
      });

      toast.success(res.data.message || "Admin registered successfully!");
      
      setTimeout(() => {
        navigate("/admin/login");
      }, 1500);

    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          },
          success: {
            iconTheme: { primary: 'var(--success)', secondary: 'var(--text-inverse)' },
          },
          error: {
            iconTheme: { primary: 'var(--danger)', secondary: 'var(--text-inverse)' },
          },
        }}
      />
      <div className="w-full min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-color)]">
          
          {/* Top Decorative Color Accent */}
          <div className="h-1.5 bg-[var(--accent-primary)] w-full" />

          <div className="p-6 sm:p-8 flex flex-col gap-5 sm:gap-6">
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">Create Admin Profile</h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">Register a new administrator identity</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Full Name
                </label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  placeholder="Alex Mercer"
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Admin Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  placeholder="admin@system.com"
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Security Password
                </label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  placeholder="••••••••"
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] disabled:opacity-50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] font-medium py-2.5 rounded-lg transition-colors mt-2 shadow-lg shadow-[var(--accent-primary)]/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-[var(--text-inverse)]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Registering...
                  </>
                ) : (
                  "Initialize Account"
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="text-center pt-2 border-t border-[var(--border-color)]">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                Already registered?{" "}
                <button 
                  onClick={() => navigate("/admin/login")} 
                  className="text-[var(--accent-primary)] hover:text-[var(--accent-hover)] font-semibold transition-colors"
                >
                  Sign In Here
                </button>
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AdminSignup;