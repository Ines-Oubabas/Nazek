import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/services/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User>) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Charger l'utilisateur au montage si un token existe
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const data = await authAPI.getUser();
      setUser(data);
    } catch (err) {
      console.error('Erreur lors de la récupération du profil utilisateur.');
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await authAPI.login({ email, password });
      localStorage.setItem('access', res.access);
      localStorage.setItem('refresh', res.refresh);
      await fetchUser(); // Recharge le profil utilisateur après connexion
    } catch (err) {
      throw new Error('Échec de la connexion. Vérifiez vos identifiants.');
    }
  };

  const register = async (userData: Partial<User>) => {
    try {
      await authAPI.register(userData);
    } catch (err) {
      throw new Error('Échec de l\'inscription. Veuillez réessayer.');
    }
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = await authAPI.updateUser(userData);
      setUser(updatedUser);
    } catch (err) {
      throw new Error('Erreur lors de la mise à jour du profil.');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};