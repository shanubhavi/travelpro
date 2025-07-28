import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "@/services/api";
import { getToken, setToken, removeToken } from "@/utils/auth";
import toast from "react-hot-toast";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data.user);
        } catch (error) {
          console.error("Auth initialization error:", error);
          removeToken();
        }
      }
      setLoading(false);
      setInitialized(true);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      const { token, refreshToken, user: userData } = response.data;

      setToken(token, refreshToken);
      setUser(userData);
      toast.success(`Welcome back, ${userData.name}!`);

      return { success: true, user: userData };
    } catch (error) {
      console.error("Login error:", error);
      const message =
        error.response?.data?.error || "Login failed. Please try again.";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    try {
      setLoading(true);
      const response = await authAPI.registerCompany(data);
      toast.success("Registration successful! Please wait for approval.");
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Registration error:", error);
      const message =
        error.response?.data?.error || "Registration failed. Please try again.";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    toast.success("Logged out successfully");
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  const refreshUserData = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      throw error;
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      await authAPI.requestPasswordReset(email);
      toast.success("Password reset instructions sent to your email");
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.error || "Failed to send reset email";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      await authAPI.resetPassword(token, password);
      toast.success("Password reset successfully");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || "Failed to reset password";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    initialized,
    login,
    register,
    logout,
    updateUser,
    refreshUserData,
    requestPasswordReset,
    resetPassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === "company_admin" || user?.role === "super_admin",
    isSuperAdmin: user?.role === "super_admin",
    isEmployee: user?.role === "employee",
    companyId: user?.companyId,
    userId: user?.id,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
