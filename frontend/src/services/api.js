import axios from "axios";
import { getToken, removeToken, setToken, getRefreshToken } from "@/utils/auth";
import toast from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh-token`,
            {
              refreshToken,
            }
          );

          const { token: newToken } = response.data;
          setToken(newToken, refreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          removeToken();
          window.location.href = "/login";
          toast.error("Session expired. Please login again.");
          return Promise.reject(refreshError);
        }
      } else {
        removeToken();
        window.location.href = "/login";
        toast.error("Session expired. Please login again.");
      }
    }

    // Handle other error status codes
    if (error.response?.status >= 500) {
      toast.error("Server error. Please try again later.");
    } else if (error.response?.status === 403) {
      toast.error("Access denied. You don't have permission for this action.");
    } else if (error.response?.status === 404) {
      toast.error("Resource not found.");
    }

    // Handle network errors
    if (error.code === "ECONNABORTED") {
      toast.error("Request timeout. Please check your connection.");
    } else if (error.message === "Network Error") {
      toast.error("Network error. Please check your connection.");
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  registerCompany: (data) => api.post("/auth/register-company", data),
  getMe: () => api.get("/auth/me"),
  refreshToken: (refreshToken) =>
    api.post("/auth/refresh-token", { refreshToken }),
  requestPasswordReset: (email) =>
    api.post("/auth/request-password-reset", { email }),
  resetPassword: (token, password) =>
    api.post("/auth/reset-password", { token, password }),
  changePassword: (data) => api.put("/auth/change-password", data),
};

export const destinationsAPI = {
  getAll: (params = {}) => api.get("/destinations", { params }),
  getById: (id) => api.get(`/destinations/${id}`),
  create: (data) => api.post("/destinations", data),
  update: (id, data) => api.put(`/destinations/${id}`, data),
  delete: (id) => api.delete(`/destinations/${id}`),
  uploadImage: (destinationId, file) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post(`/destinations/${destinationId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getCountries: () => api.get("/destinations/countries"),
  getRegions: () => api.get("/destinations/regions"),
  search: (query) =>
    api.get(`/destinations/search?q=${encodeURIComponent(query)}`),
  addContent: (destinationId, contentType, content) =>
    api.post(`/destinations/${destinationId}/content`, {
      contentType,
      title: "",
      content,
    }),
};

export const quizzesAPI = {
  getAll: (params = {}) => api.get("/quizzes", { params }),
  getById: (id) => api.get(`/quizzes/${id}`),
  create: (data) => api.post("/quizzes", data),
  update: (id, data) => api.put(`/quizzes/${id}`, data),
  delete: (id) => api.delete(`/quizzes/${id}`),
  startAttempt: (quizId) => api.post(`/quizzes/${quizId}/start`),
  submitAnswers: (quizId, data) => api.post(`/quizzes/${quizId}/submit`, data),
  getResults: (userId) => api.get(`/quiz-results/user/${userId}`),
  getAttempt: (attemptId) => api.get(`/quiz-attempts/${attemptId}`),
  getQuestions: (quizId) => api.get(`/quizzes/${quizId}/questions`),
  addQuestion: (quizId, data) => api.post(`/quizzes/${quizId}/questions`, data),
  updateQuestion: (quizId, questionId, data) =>
    api.put(`/quizzes/${quizId}/questions/${questionId}`, data),
  deleteQuestion: (quizId, questionId) =>
    api.delete(`/quizzes/${quizId}/questions/${questionId}`),
};

export const gamificationAPI = {
  getLeaderboard: (companyId, timeframe = "all") =>
    api.get(`/gamification/leaderboard/${companyId}?timeframe=${timeframe}`),
  getUserStats: (userId) => api.get(`/gamification/user-stats/${userId}`),
  getBadges: () => api.get("/gamification/badges"),
  getUserBadges: (userId) => api.get(`/gamification/user-badges/${userId}`),
  getPointsHistory: (userId, timeframe = "month") =>
    api.get(`/gamification/points-history/${userId}?timeframe=${timeframe}`),
  getStreakData: (userId) => api.get(`/gamification/streak/${userId}`),
  updateStreak: (userId) => api.post(`/gamification/streak/${userId}/update`),
};

export const submissionsAPI = {
  create: (data) => api.post("/submissions", data),
  getAll: (params = {}) => api.get("/submissions", { params }),
  getById: (id) => api.get(`/submissions/${id}`),
  approve: (id, notes = "") => api.put(`/submissions/${id}/approve`, { notes }),
  reject: (id, notes = "") => api.put(`/submissions/${id}/reject`, { notes }),
  getUserSubmissions: (userId) => api.get(`/submissions/user/${userId}`),
  getCompanySubmissions: (companyId) =>
    api.get(`/submissions/company/${companyId}`),
};

export const usersAPI = {
  getAll: (params = {}) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  getCompanyUsers: (companyId) => api.get(`/users/company/${companyId}`),
  invite: (data) => api.post("/users/invite", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updateProfile: (data) => api.put("/users/profile", data),
  changePassword: (data) => api.put("/users/change-password", data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.post("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  bulkInvite: (data) => api.post("/users/bulk-invite", data),
  exportUsers: (companyId) =>
    api.get(`/users/export/${companyId}`, { responseType: "blob" }),
};

export const analyticsAPI = {
  getCompanyStats: (companyId, timeframe = "month") =>
    api.get(`/analytics/company/${companyId}?timeframe=${timeframe}`),
  getUserProgress: (userId) => api.get(`/analytics/user-progress/${userId}`),
  getQuizAnalytics: (quizId) => api.get(`/analytics/quiz/${quizId}`),
  getEngagementMetrics: (companyId, timeframe = "month") =>
    api.get(`/analytics/engagement/${companyId}?timeframe=${timeframe}`),
  getLearningTrends: (companyId) => api.get(`/analytics/trends/${companyId}`),
  getPerformanceMetrics: (companyId) =>
    api.get(`/analytics/performance/${companyId}`),
  exportReport: (type, params = {}) =>
    api.get(`/analytics/export/${type}`, { params, responseType: "blob" }),
};

export const contentAPI = {
  getAll: (params = {}) => api.get("/content", { params }),
  getById: (id) => api.get(`/content/${id}`),
  create: (data) => api.post("/content", data),
  update: (id, data) => api.put(`/content/${id}`, data),
  delete: (id) => api.delete(`/content/${id}`),
  uploadFile: (file, folder = "general") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    return api.post("/content/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  search: (query) => api.get(`/content/search?q=${encodeURIComponent(query)}`),
};

export const notificationsAPI = {
  getAll: (params = {}) => api.get("/notifications", { params }),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/mark-all-read"),
  delete: (id) => api.delete(`/notifications/${id}`),
  getSettings: () => api.get("/notifications/settings"),
  updateSettings: (data) => api.put("/notifications/settings", data),
};

export const settingsAPI = {
  getCompanySettings: (companyId) => api.get(`/settings/company/${companyId}`),
  updateCompanySettings: (companyId, data) =>
    api.put(`/settings/company/${companyId}`, data),
  getUserSettings: () => api.get("/settings/user"),
  updateUserSettings: (data) => api.put("/settings/user", data),
  getSystemSettings: () => api.get("/settings/system"),
  updateSystemSettings: (data) => api.put("/settings/system", data),
};

// Export the main api instance for custom requests
export default api;
