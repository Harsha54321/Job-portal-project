import axios from "axios";

const baseURL = "http://127.0.0.1:8000/api/";
// const baseURL = "http://54.183.89.14/api/";

const api = axios.create({
  baseURL: baseURL,
  timeout: 60000,
});

// ============================================================
// CONFIGURATION
// ============================================================
const PUBLIC_ENDPOINTS = [
  "/login/",
  "/register/",
  "/signup/",
  "/send-email-otp/",
  "/verify-email-otp/",
  "/send-login-otp/",
  "/verify-login-otp/",
  "/token/refresh/",
  "/token/",
  "/logout/",
  "/jobs/",
  "/jobs/all/",
  "/jobs/published/",
  "/companies/",
  "/blogs/",
  "/blogs/grouped/",
  "/blog-categories/",
  "/blog-stats/",
  "/contact/create/",
  "/subscribe/",
  "/auth/forgot-password/",
  "/auth/employer/forgot-password/",
  "/auth/reset-password-confirm/",
  "/auth/create-password/",
  "/auth/validate-reset-token/",
  "/google-login/",
  "/jobseeker/allowed-domains/",
  "/webhook/",
];

// ============================================================
// STATE MANAGEMENT
// ============================================================
let isRefreshing = false;
let failedQueue = [];
let isLoggingOut = false;
let refreshPromise = null;

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const isPublicEndpoint = (url) => {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some(endpoint => {
    return url === endpoint || url.startsWith(endpoint);
  });
};

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now + 30; // 30 seconds buffer
  } catch {
    return true;
  }
};

const getCSRFToken = () => {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) return value;
  }
  return null;
};

// ============================================================
// LOGOUT FUNCTION
// ============================================================
export const logout = () => {
  if (isLoggingOut) return;
  isLoggingOut = true;
  
  console.log("🚪 Logging out...");
  
  sessionStorage.removeItem("access");
  sessionStorage.removeItem("refresh");
  sessionStorage.removeItem("user_type");
  sessionStorage.removeItem("user_data");
  sessionStorage.removeItem("user_id");
  sessionStorage.removeItem("userRole");
  
  localStorage.removeItem("persist:root");
  localStorage.removeItem("user");
  
  window.dispatchEvent(new CustomEvent("auth:logout"));
  
  setTimeout(() => {
    isLoggingOut = false;
    if (window.location.pathname !== '/') {
      window.location.href = "/";
    }
  }, 500);
};

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("access");
    const requestUrl = config.url || "";
    const isPublic = isPublicEndpoint(requestUrl);

    // Set content type
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = config.data instanceof FormData
        ? "multipart/form-data"
        : "application/json";
    }

    // Add CSRF token
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    // Public endpoints - skip auth
    if (isPublic) {
      console.log(`🌐 Public: ${requestUrl}`);
      return config;
    }

    // Private endpoints - require token
    if (!token) {
      console.log(`⚠️ No token for private endpoint: ${requestUrl}`);
      logout();
      return Promise.reject({
        response: { status: 401, data: { detail: "Authentication required" } }
      });
    }

    if (isTokenExpired(token)) {
      console.log(`⏰ Token expired: ${requestUrl}`);
      logout();
      return Promise.reject({
        response: { status: 401, data: { detail: "Token expired" } }
      });
    }

    config.headers.Authorization = `Bearer ${token}`;
    console.log(`🔐 Private: ${requestUrl}`);

    // Log data (limit size)
    if (config.data && !(config.data instanceof FormData)) {
      const isSensitive = ["password", "otp"].some(k => 
        JSON.stringify(config.data).toLowerCase().includes(k)
      );
      if (!isSensitive) {
        const dataStr = JSON.stringify(config.data);
        console.log("📦 Data:", dataStr.length > 500 ? dataStr.substring(0, 500) + "..." : dataStr);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || "";
    const isPublic = isPublicEndpoint(requestUrl);
    const isRefreshRequest = requestUrl.includes("/token/refresh/");

    // Public endpoints - don't retry
    if (isPublic) {
      return Promise.reject(error);
    }

    // Handle 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Already refreshing - queue request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      const refreshToken = sessionStorage.getItem("refresh");
      if (!refreshToken || isRefreshRequest) {
        logout();
        return Promise.reject(error);
      }

      isRefreshing = true;

      try {
        const response = await axios.post(`${baseURL}token/refresh/`, {
          refresh: refreshToken,
        });

        const newToken = response.data.access;
        sessionStorage.setItem("access", newToken);
        console.log("✅ Token refreshed");

        // Process queued requests
        failedQueue.forEach(prom => prom.resolve(newToken));
        failedQueue = [];

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        console.error("❌ Refresh failed");
        failedQueue.forEach(prom => prom.reject(refreshError));
        failedQueue = [];
        logout();
        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    // Other errors
    if (error.response?.status === 403) {
      console.error("Forbidden");
    } else if (error.response?.status === 404) {
      console.error("Not found");
    } else if (error.response?.status === 500) {
      console.error("Server error");
    } else if (error.code === "ECONNABORTED") {
      console.error("Timeout");
    } else if (!error.response) {
      console.error("Network error");
    }

    return Promise.reject(error);
  }
);

// ============================================================
// SESSION MONITORING (Optimized)
// ============================================================
let sessionCheckInterval = null;

export const startSessionMonitoring = () => {
  if (sessionCheckInterval) clearInterval(sessionCheckInterval);
  
  sessionCheckInterval = setInterval(() => {
    const token = sessionStorage.getItem("access");
    if (token && isTokenExpired(token)) {
      console.log("⏰ Session expired");
      logout();
    }
  }, 120000); // Check every 2 minutes (reduced frequency)
};

export const stopSessionMonitoring = () => {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
    sessionCheckInterval = null;
  }
};

// Check on tab visibility change (more efficient)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    const token = sessionStorage.getItem("access");
    if (token && isTokenExpired(token)) {
      console.log("⏰ Tab focus - Token expired");
      logout();
    }
  }
});

// Cross-tab sync
window.addEventListener('storage', (event) => {
  if (event.key === 'access' && !event.newValue) {
    logout();
  }
});

// Auto-start
if (typeof window !== 'undefined') {
  startSessionMonitoring();
}

// ============================================================
// EXPORTS
// ============================================================
export const isAuthenticated = () => {
  const token = sessionStorage.getItem("access");
  return token && !isTokenExpired(token);
};

export const getUserType = () => {
  return sessionStorage.getItem("user_type");
};

export default api;