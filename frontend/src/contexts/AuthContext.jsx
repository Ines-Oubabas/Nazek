import React, { createContext, useState, useContext, useEffect, useMemo } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAuthenticated = useMemo(() => !!user, [user]);
  const isClient = user?.role === "client";
  const isEmployer = user?.role === "employer";

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          if (isMounted) setUser(null);
          return;
        }

        const userData = await authAPI.getUser();
        if (isMounted) setUser(userData);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshUser = async () => {
    try {
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        return null;
      }
      const userData = await authAPI.getUser();
      setUser(userData);
      return userData;
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      setUser(null);
      return null;
    }
  };

  const login = async (emailOrPayload, password) => {
    try {
      setError(null);

      const payload =
        typeof emailOrPayload === "object"
          ? emailOrPayload
          : { email: emailOrPayload, password };

      const response = await authAPI.login(payload);

      const access = response?.access || response?.tokens?.access;
      const refresh = response?.refresh || response?.tokens?.refresh;

      if (access) localStorage.setItem("token", access);
      if (refresh) localStorage.setItem("refresh_token", refresh);

      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message || "Erreur de connexion");
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);

      const response = await authAPI.register(userData);

      const access = response?.access || response?.tokens?.access;
      const refresh = response?.refresh || response?.tokens?.refresh;

      if (access) localStorage.setItem("token", access);
      if (refresh) localStorage.setItem("refresh_token", refresh);

      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message || "Erreur d'inscription");
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      const refreshToken = localStorage.getItem("refresh_token");
      await authAPI.logout(refreshToken);
    } catch {
      // no-op
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    }
  };

  const deleteAccount = async () => {
    await authAPI.deleteMe();
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    isClient,
    isEmployer,
    login,
    register,
    logout,
    deleteAccount,
    refreshUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
};

export default AuthContext;