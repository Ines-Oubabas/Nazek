import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from "react";
import { authAPI, userAPI, clearTokens } from "../services/api";

const AuthContext = createContext(null);

const deriveRoleFlags = ({ user, profiles }) => {
  const role = user?.role;

  // Règle stricte : un compte = un rôle principal
  const isClient = role === "client";
  const isEmployer = role === "employer";

  const clientProfile = isClient ? profiles?.client || null : null;
  const employerProfile = isEmployer ? profiles?.employer || null : null;

  return { isClient, isEmployer, clientProfile, employerProfile };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAuthenticated = useMemo(() => !!user, [user]);

  const { isClient, isEmployer, clientProfile, employerProfile } = useMemo(
    () => deriveRoleFlags({ user, profiles }),
    [user, profiles]
  );

  const clearAuthState = useCallback(() => {
    setUser(null);
    setProfiles(null);
    clearTokens();
  }, []);

  const loadProfiles = useCallback(async () => {
    try {
      const data = await authAPI.getProfiles();
      setProfiles(data || null);
      return data || null;
    } catch {
      setProfiles(null);
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setError("");
      const userData = await authAPI.getUser();
      setUser(userData || null);
      await loadProfiles();
      return userData || null;
    } catch {
      clearAuthState();
      return null;
    }
  }, [loadProfiles, clearAuthState]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          if (mounted) {
            setUser(null);
            setProfiles(null);
          }
          return;
        }

        const userData = await authAPI.getUser();
        if (!mounted) return;
        setUser(userData || null);

        try {
          const profilesData = await authAPI.getProfiles();
          if (!mounted) return;
          setProfiles(profilesData || null);
        } catch {
          if (!mounted) return;
          setProfiles(null);
        }
      } catch {
        if (mounted) clearAuthState();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [clearAuthState]);

  const login = useCallback(
    async (emailOrPayload, password) => {
      try {
        setError("");

        const payload =
          typeof emailOrPayload === "object"
            ? emailOrPayload
            : { email: emailOrPayload, password };

        const response = await authAPI.login(payload);

        const userData = response?.user || null;
        setUser(userData);

        const responseProfiles = response?.profiles || null;
        if (responseProfiles) {
          setProfiles(responseProfiles);
        } else {
          await loadProfiles();
        }

        return response;
      } catch (err) {
        setError(err?.message || "Erreur de connexion");
        throw err;
      }
    },
    [loadProfiles]
  );

  const register = useCallback(
    async (userData) => {
      try {
        setError("");

        const response = await authAPI.register(userData);

        const createdUser = response?.user || null;
        setUser(createdUser);

        const responseProfiles = response?.profiles || null;
        if (responseProfiles) {
          setProfiles(responseProfiles);
        } else {
          await loadProfiles();
        }

        return response;
      } catch (err) {
        setError(err?.message || "Erreur d'inscription");
        throw err;
      }
    },
    [loadProfiles]
  );

  const logout = useCallback(async () => {
    try {
      setError("");
      await authAPI.logout();
    } catch {
      // no-op
    } finally {
      clearAuthState();
    }
  }, [clearAuthState]);

  const updateUser = useCallback(
    async (data) => {
      try {
        setError("");
        const updated = await userAPI.updateUser(data);
        setUser(updated || null);
        await loadProfiles();
        return updated;
      } catch (err) {
        setError(err?.message || "Erreur de mise à jour");
        throw err;
      }
    },
    [loadProfiles]
  );

  const deleteAccount = useCallback(async () => {
    await authAPI.deleteMe();
    clearAuthState();
  }, [clearAuthState]);

  const value = {
    user,
    profiles,
    clientProfile,
    employerProfile,
    loading,
    error,

    isAuthenticated,
    isClient,
    isEmployer,

    login,
    register,
    logout,
    refreshUser,
    updateUser,
    deleteAccount,

    setUser,
    setProfiles,
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