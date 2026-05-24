import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from "react";
import { authAPI, userAPI, clearTokens } from "../services/api";

const AuthContext = createContext(null);

const deriveRoleFlags = ({ user, profiles }) => {
  const role = user?.role;
  const clientProfile = profiles?.client || null;
  const employerProfile = profiles?.employer || null;

  // Compat legacy user.role + nouvelle logique profils
  const isClient = !!clientProfile || role === "client";
  const isEmployer = !!employerProfile || role === "employer";

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
      // Pas bloquant pour l'app : on garde l'utilisateur même si profils indisponibles
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
    } catch (err) {
      clearAuthState();
      return null;
    }
  }, [loadProfiles, clearAuthState]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Si pas de token, ne pas appeler l'API inutilement
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

        // Tente d'utiliser les profils déjà renvoyés, sinon les recharge
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
      await authAPI.logout(); // clearTokens fait déjà le ménage côté service
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

        // Sync profils après update user (email/nom/etc peuvent impacter affichage)
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
    // state
    user,
    profiles,
    clientProfile,
    employerProfile,
    loading,
    error,

    // flags
    isAuthenticated,
    isClient,
    isEmployer,

    // actions
    login,
    register,
    logout,
    refreshUser,
    updateUser,
    deleteAccount,

    // compat legacy (certaines pages utilisent setUser directement)
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