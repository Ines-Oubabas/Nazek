// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useMemo } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // auth init loading
  const [error, setError] = useState(null);

  const isAuthenticated = useMemo(() => !!user, [user]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          if (isMounted) setUser(null);
          return;
        }

        // backend: /api/v1/auth/user/ => renvoie l'utilisateur directement
        const userData = await authAPI.getUser();
        if (isMounted) setUser(userData);
      } catch (err) {
        console.error("Erreur de vérification d'authentification:", err);
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
    } catch (err) {
      console.error("Erreur refreshUser:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      setUser(null);
      return null;
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);

      const response = await authAPI.login({ email, password });
      // response: { user, refresh, access }
      localStorage.setItem("token", response.access);
      localStorage.setItem("refresh_token", response.refresh);
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
      // response: { user, refresh, access }
      localStorage.setItem("token", response.access);
      localStorage.setItem("refresh_token", response.refresh);
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
      // ✅ important si ton backend blacklist le refresh
      await authAPI.logout(refreshToken);
    } catch (err) {
      // même si ça échoue, on nettoie côté front
      console.error("Erreur lors de la déconnexion:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    setUser, // pratique (optionnel) pour mettre à jour le user après edit profil
  };

  return (
    <AuthContext.Provider value={value}>
      {/* tu peux remplacer par un loader si tu veux */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
};

export default AuthContext;