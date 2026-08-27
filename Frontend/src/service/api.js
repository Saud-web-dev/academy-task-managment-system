import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ─────────────────────────────────────────
// 1. Sync updated user marks to localStorage
// 2. Handle 401 "USER_DELETED" responses → auto-logout
api.interceptors.response.use(
  (response) => {
    const user = response.data?.user;
    if (user && user._id) {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          // Only update if it's the same user
          if (parsed._id === user._id || parsed.id === user._id) {
            const updated = {
              ...parsed,
              marks: user.marks ?? parsed.marks,
              totalMarks: user.totalMarks ?? parsed.totalMarks,
              name: user.name ?? parsed.name,
              email: user.email ?? parsed.email,
              workStartTime: user.workStartTime ?? parsed.workStartTime,
              role: user.role ?? parsed.role,
              isActive: user.isActive ?? parsed.isActive,
            };
            localStorage.setItem("user", JSON.stringify(updated));
            if (updated.role) localStorage.setItem("role", updated.role);
          }
        }
      } catch (_) {
        // Silent — don't break the app if localStorage fails
      }
    }
    return response;
  },
  (error) => {
    // Handle 401 responses with USER_DELETED code
    if (error.response?.status === 401) {
      const code = error.response?.data?.code;
      if (code === 'USER_DELETED') {
        // User was deleted — force logout
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        
        // Dispatch custom event so all components can react
        window.dispatchEvent(new CustomEvent('user-deleted', { detail: { message: error.response?.data?.message } }));
        
        // Redirect to login after a short delay
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?deleted=true';
          }
        }, 500);
      }
    }
    return Promise.reject(error);
  }
);

// ─── Helper: Fetch fresh user from DB and sync localStorage ──────
export const syncUserFromDB = async () => {
  try {
    const res = await api.get("/user/me");
    if (res.data.success && res.data.user) {
      const fresh = res.data.user;
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = { ...parsed, ...fresh, _id: fresh._id };
        localStorage.setItem("user", JSON.stringify(updated));
      }
      return fresh;
    }
  } catch (_) {
    // Silently ignore — offline or token expired
  }
  return null;
};

export default api;
