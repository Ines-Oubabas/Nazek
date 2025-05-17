import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '@/services/api';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger l'utilisateur au montage si un token existe
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const data = await authAPI.getUser();
      setUser(data);
    } catch (err) {
      console.error('Erreur lors de la récupération du profil.');
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });
      localStorage.setItem('access', response.access);
      localStorage.setItem('refresh', response.refresh);
      await fetchUser(); // Recharge le profil utilisateur après connexion
    } catch (err) {
      setError(err.message || 'Erreur lors de la connexion');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      await authAPI.register(userData);
    } catch (err) {
      setError(err.message || "Erreur lors de l'inscription");
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
  };

  const updateUser = async (userData) => {
    try {
      const updatedUser = await authAPI.updateUser(userData);
      setUser(updatedUser);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l’intérieur d’un AuthProvider');
  }
  return context;
};

export default AuthContext;