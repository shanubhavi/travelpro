import Cookies from "js-cookie";

const TOKEN_KEY = "travelpro_token";
const REFRESH_TOKEN_KEY = "travelpro_refresh_token";
const USER_KEY = "travelpro_user";

// Cookie options
const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  secure: import.meta.env.PROD, // Only use secure cookies in production
  sameSite: "strict",
  path: "/",
};

const REFRESH_COOKIE_OPTIONS = {
  expires: 30, // 30 days
  secure: import.meta.env.PROD,
  sameSite: "strict",
  path: "/",
  httpOnly: false, // Note: In a real app, refresh tokens should be httpOnly
};

/**
 * Get the current access token
 */
export const getToken = () => {
  try {
    return Cookies.get(TOKEN_KEY);
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

/**
 * Get the refresh token
 */
export const getRefreshToken = () => {
  try {
    return Cookies.get(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Error getting refresh token:", error);
    return null;
  }
};

/**
 * Set authentication tokens
 */
export const setToken = (token, refreshToken = null) => {
  try {
    if (token) {
      Cookies.set(TOKEN_KEY, token, COOKIE_OPTIONS);
    }

    if (refreshToken) {
      Cookies.set(REFRESH_TOKEN_KEY, refreshToken, REFRESH_COOKIE_OPTIONS);
    }
  } catch (error) {
    console.error("Error setting tokens:", error);
  }
};

/**
 * Remove all authentication data
 */
export const removeToken = () => {
  try {
    Cookies.remove(TOKEN_KEY, { path: "/" });
    Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
    Cookies.remove(USER_KEY, { path: "/" });

    // Also try removing without path (legacy cleanup)
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
    Cookies.remove(USER_KEY);

    // Clear localStorage as backup
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error("Error removing tokens:", error);
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = getToken();
  return !!token && !isTokenExpired(token);
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;

    return payload.exp < currentTime;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true;
  }
};

/**
 * Get token payload
 */
export const getTokenPayload = (token = null) => {
  const tokenToUse = token || getToken();

  if (!tokenToUse) return null;

  try {
    return JSON.parse(atob(tokenToUse.split(".")[1]));
  } catch (error) {
    console.error("Error parsing token payload:", error);
    return null;
  }
};

/**
 * Get user ID from token
 */
export const getUserIdFromToken = () => {
  const payload = getTokenPayload();
  return payload?.userId || null;
};

/**
 * Get user role from token
 */
export const getUserRoleFromToken = () => {
  const payload = getTokenPayload();
  return payload?.role || null;
};

/**
 * Get company ID from token
 */
export const getCompanyIdFromToken = () => {
  const payload = getTokenPayload();
  return payload?.companyId || null;
};

/**
 * Check if user has admin role
 */
export const isAdmin = () => {
  const role = getUserRoleFromToken();
  return role === "company_admin" || role === "super_admin";
};

/**
 * Check if user has super admin role
 */
export const isSuperAdmin = () => {
  const role = getUserRoleFromToken();
  return role === "super_admin";
};

/**
 * Get time until token expires (in seconds)
 */
export const getTokenTimeLeft = () => {
  const payload = getTokenPayload();
  if (!payload?.exp) return 0;

  const currentTime = Date.now() / 1000;
  const timeLeft = payload.exp - currentTime;

  return Math.max(0, timeLeft);
};

/**
 * Format time until expiration
 */
export const formatTimeLeft = (seconds) => {
  if (seconds <= 0) return "Expired";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${Math.floor(seconds)}s`;
  }
};

/**
 * Schedule token refresh before expiration
 */
export const scheduleTokenRefresh = (refreshCallback) => {
  const timeLeft = getTokenTimeLeft();

  // Refresh 5 minutes before expiration
  const refreshTime = Math.max(0, (timeLeft - 300) * 1000);

  if (refreshTime > 0) {
    setTimeout(() => {
      if (isAuthenticated()) {
        refreshCallback();
      }
    }, refreshTime);
  }
};

/**
 * Store user data (for offline access)
 */
export const setUserData = (userData) => {
  try {
    Cookies.set(USER_KEY, JSON.stringify(userData), COOKIE_OPTIONS);
  } catch (error) {
    console.error("Error storing user data:", error);
  }
};

/**
 * Get stored user data
 */
export const getUserData = () => {
  try {
    const userData = Cookies.get(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

/**
 * Clear all stored user data
 */
export const clearUserData = () => {
  try {
    Cookies.remove(USER_KEY, { path: "/" });
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error("Error clearing user data:", error);
  }
};

/**
 * Generate a secure random string for CSRF protection
 */
export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const score = [minLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(
    Boolean
  ).length;

  return {
    isValid: score >= 3 && minLength,
    score,
    feedback: {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    },
    strength: score < 2 ? "weak" : score < 4 ? "medium" : "strong",
  };
};

/**
 * Generate a secure password
 */
export const generateSecurePassword = (length = 12) => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  const allChars = lowercase + uppercase + numbers + symbols;
  let password = "";

  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

/**
 * Check if current session is about to expire
 */
export const isSessionExpiringSoon = (warningMinutes = 5) => {
  const timeLeft = getTokenTimeLeft();
  return timeLeft > 0 && timeLeft <= warningMinutes * 60;
};

/**
 * Get authentication headers for API requests
 */
export const getAuthHeaders = () => {
  const token = getToken();
  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
    "X-Requested-With": "XMLHttpRequest",
  };
};

export default {
  getToken,
  getRefreshToken,
  setToken,
  removeToken,
  isAuthenticated,
  isTokenExpired,
  getTokenPayload,
  getUserIdFromToken,
  getUserRoleFromToken,
  getCompanyIdFromToken,
  isAdmin,
  isSuperAdmin,
  getTokenTimeLeft,
  formatTimeLeft,
  scheduleTokenRefresh,
  setUserData,
  getUserData,
  clearUserData,
  generateCSRFToken,
  isValidEmail,
  validatePassword,
  generateSecurePassword,
  isSessionExpiringSoon,
  getAuthHeaders,
};
