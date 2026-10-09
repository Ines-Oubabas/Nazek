import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  StaleSessionError,
  authAPI,
  userAPI,
  clearTokens,
  getAuthSessionVersion,
  hasStoredTokens,
  isStaleSessionError,
  subscribeAuthState,
} from "../services/api";

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

  const mountedRef = useRef(false);
  const requestVersionRef = useRef(0);
  const authActionVersionRef = useRef(0);

  const isAuthenticated = useMemo(() => !!user, [user]);

  const { isClient, isEmployer, clientProfile, employerProfile } = useMemo(
    () => deriveRoleFlags({ user, profiles }),
    [user, profiles]
  );

  const invalidatePendingRequests = useCallback(() => {
    requestVersionRef.current += 1;
    return requestVersionRef.current;
  }, []);

  const beginAuthAction = useCallback(() => {
    authActionVersionRef.current += 1;
    return authActionVersionRef.current;
  }, []);

  const isAuthActionCurrent = useCallback(
    (actionVersion) =>
      mountedRef.current &&
      authActionVersionRef.current === actionVersion,
    []
  );

  const clearDisplayedAuthState = useCallback(() => {
    invalidatePendingRequests();

    if (!mountedRef.current) return;

    setUser(null);
    setProfiles(null);
  }, [invalidatePendingRequests]);

  const beginTrackedRequest = useCallback(() => {
    const requestVersion = invalidatePendingRequests();

    return {
      requestVersion,
      sessionVersion: getAuthSessionVersion(),
    };
  }, [invalidatePendingRequests]);

  const isTrackedRequestCurrent = useCallback(
    ({ requestVersion, sessionVersion }) =>
      mountedRef.current &&
      requestVersionRef.current === requestVersion &&
      getAuthSessionVersion() === sessionVersion &&
      hasStoredTokens(),
    []
  );

  const loadProfilesForRequest = useCallback(
    async (requestState) => {
      try {
        const data = await authAPI.getProfiles();

        if (!isTrackedRequestCurrent(requestState)) {
          return null;
        }

        const nextProfiles = data || null;
        setProfiles(nextProfiles);
        return nextProfiles;
      } catch (err) {
        if (isStaleSessionError(err)) {
          return null;
        }

        if (!isTrackedRequestCurrent(requestState)) {
          return null;
        }

        setProfiles(null);
        return null;
      }
    },
    [isTrackedRequestCurrent]
  );

  const refreshUser = useCallback(async () => {
    if (!hasStoredTokens()) {
      clearDisplayedAuthState();
      return null;
    }

    const requestState = beginTrackedRequest();

    try {
      setError("");

      const userData = await authAPI.getUser();

      if (!isTrackedRequestCurrent(requestState)) {
        return null;
      }

      const nextUser = userData || null;
      setUser(nextUser);

      if (!nextUser) {
        setProfiles(null);
        return null;
      }

      await loadProfilesForRequest(requestState);

      if (!isTrackedRequestCurrent(requestState)) {
        return null;
      }

      return nextUser;
    } catch (err) {
      if (isStaleSessionError(err)) {
        return null;
      }

      if (isTrackedRequestCurrent(requestState)) {
        clearTokens("user-refresh-failed");
      }

      return null;
    }
  }, [
    beginTrackedRequest,
    clearDisplayedAuthState,
    isTrackedRequestCurrent,
    loadProfilesForRequest,
  ]);

  useEffect(() => {
    mountedRef.current = true;

    const unsubscribe = subscribeAuthState(({ reason, isAuthenticated: hasSession }) => {
      const mustClearDisplayedState =
        !hasSession ||
        reason === "account-change-started" ||
        reason === "logout" ||
        reason === "session-expired" ||
        reason === "account-deleted" ||
        reason === "user-refresh-failed";

      if (!mustClearDisplayedState) return;

      invalidatePendingRequests();
      setUser(null);
      setProfiles(null);

      if (reason === "session-expired") {
        setError("Votre session a expiré. Veuillez vous reconnecter.");
      } else if (reason !== "account-change-started") {
        setError("");
      }
    });

    return () => {
      mountedRef.current = false;
      invalidatePendingRequests();
      authActionVersionRef.current += 1;
      unsubscribe();
    };
  }, [invalidatePendingRequests]);

  useEffect(() => {
    let active = true;

    const initializeSession = async () => {
      if (!hasStoredTokens()) {
        if (active && mountedRef.current) {
          setUser(null);
          setProfiles(null);
          setLoading(false);
        }
        return;
      }

      const requestState = beginTrackedRequest();

      try {
        const userData = await authAPI.getUser();

        if (!active || !isTrackedRequestCurrent(requestState)) {
          return;
        }

        const nextUser = userData || null;
        setUser(nextUser);

        if (!nextUser) {
          setProfiles(null);
          return;
        }

        await loadProfilesForRequest(requestState);
      } catch (err) {
        if (
          !isStaleSessionError(err) &&
          active &&
          isTrackedRequestCurrent(requestState)
        ) {
          clearTokens("initialization-failed");
        }
      } finally {
        if (active && mountedRef.current) {
          setLoading(false);
        }
      }
    };

    initializeSession();

    return () => {
      active = false;
    };
  }, [
    beginTrackedRequest,
    isTrackedRequestCurrent,
    loadProfilesForRequest,
  ]);

  const login = useCallback(
    async (emailOrPayload, password) => {
      const actionVersion = beginAuthAction();

      clearDisplayedAuthState();
      setError("");

      const payload =
        typeof emailOrPayload === "object"
          ? emailOrPayload
          : { email: emailOrPayload, password };

      try {
        const response = await authAPI.login(payload);

        if (!isAuthActionCurrent(actionVersion)) {
          throw new StaleSessionError();
        }

        const requestState = beginTrackedRequest();

        if (!isTrackedRequestCurrent(requestState)) {
          throw new StaleSessionError();
        }

        const userData = response?.user || null;
        const responseProfiles = response?.profiles || null;

        setUser(userData);
        setProfiles(responseProfiles);

        if (userData && !responseProfiles) {
          await loadProfilesForRequest(requestState);
        }

        if (
          !isAuthActionCurrent(actionVersion) ||
          !isTrackedRequestCurrent(requestState)
        ) {
          throw new StaleSessionError();
        }

        return response;
      } catch (err) {
        if (
          isStaleSessionError(err) ||
          !isAuthActionCurrent(actionVersion)
        ) {
          throw isStaleSessionError(err)
            ? err
            : new StaleSessionError();
        }

        setError(err?.message || "Erreur de connexion");
        throw err;
      }
    },
    [
      beginAuthAction,
      beginTrackedRequest,
      clearDisplayedAuthState,
      isAuthActionCurrent,
      isTrackedRequestCurrent,
      loadProfilesForRequest,
    ]
  );

  const register = useCallback(
    async (userData) => {
      const actionVersion = beginAuthAction();

      clearDisplayedAuthState();
      setError("");

      try {
        const response = await authAPI.register(userData);

        if (!isAuthActionCurrent(actionVersion)) {
          throw new StaleSessionError();
        }

        const requestState = beginTrackedRequest();

        if (!isTrackedRequestCurrent(requestState)) {
          throw new StaleSessionError();
        }

        const createdUser = response?.user || null;
        const responseProfiles = response?.profiles || null;

        setUser(createdUser);
        setProfiles(responseProfiles);

        if (createdUser && !responseProfiles) {
          await loadProfilesForRequest(requestState);
        }

        if (
          !isAuthActionCurrent(actionVersion) ||
          !isTrackedRequestCurrent(requestState)
        ) {
          throw new StaleSessionError();
        }

        return response;
      } catch (err) {
        if (
          isStaleSessionError(err) ||
          !isAuthActionCurrent(actionVersion)
        ) {
          throw isStaleSessionError(err)
            ? err
            : new StaleSessionError();
        }

        setError(err?.message || "Erreur d'inscription");
        throw err;
      }
    },
    [
      beginAuthAction,
      beginTrackedRequest,
      clearDisplayedAuthState,
      isAuthActionCurrent,
      isTrackedRequestCurrent,
      loadProfilesForRequest,
    ]
  );

  const logout = useCallback(async () => {
    beginAuthAction();
    clearDisplayedAuthState();
    setError("");

    try {
      await authAPI.logout();
    } catch (err) {
      if (!isStaleSessionError(err)) {
        // La session locale est déjà supprimée.
        // Un échec de blacklistage distant ne doit pas restaurer la session.
      }
    }
  }, [
    beginAuthAction,
    clearDisplayedAuthState,
  ]);

  const updateUser = useCallback(
    async (data) => {
      if (!hasStoredTokens()) {
        clearDisplayedAuthState();
        return null;
      }

      const requestState = beginTrackedRequest();

      try {
        setError("");

        const updated = await userAPI.updateUser(data);

        if (!isTrackedRequestCurrent(requestState)) {
          return null;
        }

        const nextUser = updated || null;
        setUser(nextUser);

        if (!nextUser) {
          setProfiles(null);
          return null;
        }

        await loadProfilesForRequest(requestState);

        if (!isTrackedRequestCurrent(requestState)) {
          return null;
        }

        return nextUser;
      } catch (err) {
        if (isStaleSessionError(err)) {
          return null;
        }

        if (isTrackedRequestCurrent(requestState)) {
          setError(err?.message || "Erreur de mise à jour");
        }

        throw err;
      }
    },
    [
      beginTrackedRequest,
      clearDisplayedAuthState,
      isTrackedRequestCurrent,
      loadProfilesForRequest,
    ]
  );

  const deleteAccount = useCallback(async () => {
    if (!hasStoredTokens()) {
      clearDisplayedAuthState();
      return null;
    }

    const requestState = beginTrackedRequest();

    try {
      const response = await authAPI.deleteMe();

      if (!isTrackedRequestCurrent(requestState)) {
        return response;
      }

      clearDisplayedAuthState();
      return response;
    } catch (err) {
      if (isStaleSessionError(err)) {
        return null;
      }

      throw err;
    }
  }, [
    beginTrackedRequest,
    clearDisplayedAuthState,
    isTrackedRequestCurrent,
  ]);

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