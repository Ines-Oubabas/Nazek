// frontend/src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = '/api/v1';
const AUTH_BASE = `${API_VERSION}/auth`;

// Configuration de base d'axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré, essayer de le rafraîchir
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await api.post('/auth/refresh/', { refresh: refreshToken });
          localStorage.setItem('token', response.data.access);
          // Réessayer la requête originale
          return api(error.config);
        }
      } catch (refreshError) {
        // Si le rafraîchissement échoue, déconnecter l'utilisateur
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Fonction utilitaire pour les requêtes API
export const apiRequest = async (url, options = {}) => {
  try {
    const response = await api({
      url,
      ...options,
    });
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw new Error(error.response.data.detail || 'Une erreur est survenue');
    }
    throw new Error('Erreur de connexion au serveur');
  }
};

// URLs de l'API
export const AUTH_URLS = {
  LOGIN: '/auth/login/',
  REGISTER: '/api/v1/auth/register/',
  REFRESH: '/auth/refresh/',
  LOGOUT: '/auth/logout/',
  USER: '/auth/user/',
};

export const SERVICE_URLS = {
  LIST: '/services/',
  DETAIL: (id) => `/services/${id}/`,
  CREATE: '/services/',
  UPDATE: (id) => `/services/${id}/`,
  DELETE: (id) => `/services/${id}/`,
};

export const APPOINTMENT_URLS = {
  LIST: '/appointments/',
  DETAIL: (id) => `/appointments/${id}/`,
  CREATE: '/appointments/',
  UPDATE: (id) => `/appointments/${id}/`,
  DELETE: (id) => `/appointments/${id}/`,
};

export const USER_URLS = {
  PROFILE: '/users/profile/',
  UPDATE: '/users/update/',
  CHANGE_PASSWORD: '/users/change-password/',
};

export const CHANGE_PASSWORD_URL = USER_URLS.CHANGE_PASSWORD;

// Add the missing export for UPDATE_PROFILE_URL
export const UPDATE_PROFILE_URL = USER_URLS.UPDATE;

// Add the missing export for USERS_URL
export const USERS_URL = USER_URLS;

// Add the missing export for APPOINTMENTS_URL
export const APPOINTMENTS_URL = APPOINTMENT_URLS;

// Add the missing export for SERVICES_URL
export const SERVICES_URL = SERVICE_URLS;

// Fonctions d'API
export const authAPI = {
  login: (credentials) => apiRequest(AUTH_URLS.LOGIN, {
    method: 'POST',
    data: credentials,
  }),
  register: (userData) => apiRequest(AUTH_URLS.REGISTER, {
    method: 'POST',
    data: userData,
  }),
  refresh: (refreshToken) => apiRequest(AUTH_URLS.REFRESH, {
    method: 'POST',
    data: { refresh: refreshToken },
  }),
  logout: () => apiRequest(AUTH_URLS.LOGOUT, {
    method: 'POST',
  }),
  getUser: () => apiRequest(AUTH_URLS.USER),
};

export const serviceAPI = {
  list: () => apiRequest(SERVICE_URLS.LIST),
  detail: (id) => apiRequest(SERVICE_URLS.DETAIL(id)),
  create: (data) => apiRequest(SERVICE_URLS.CREATE, {
    method: 'POST',
    data,
  }),
  update: (id, data) => apiRequest(SERVICE_URLS.UPDATE(id), {
    method: 'PUT',
    data,
  }),
  delete: (id) => apiRequest(SERVICE_URLS.DELETE(id), {
    method: 'DELETE',
  }),
};

export const appointmentAPI = {
  list: () => apiRequest(APPOINTMENT_URLS.LIST),
  detail: (id) => apiRequest(APPOINTMENT_URLS.DETAIL(id)),
  create: (data) => apiRequest(APPOINTMENT_URLS.CREATE, {
    method: 'POST',
    data,
  }),
  update: (id, data) => apiRequest(APPOINTMENT_URLS.UPDATE(id), {
    method: 'PUT',
    data,
  }),
  delete: (id) => apiRequest(APPOINTMENT_URLS.DELETE(id), {
    method: 'DELETE',
  }),
};

export const userAPI = {
  getProfile: () => apiRequest(USER_URLS.PROFILE),
  updateProfile: (data) => apiRequest(USER_URLS.UPDATE, {
    method: 'PUT',
    data,
  }),
  changePassword: (data) => apiRequest(USER_URLS.CHANGE_PASSWORD, {
    method: 'POST',
    data,
  }),
};

export const getServices = async () => {
  return apiRequest(SERVICE_URLS.LIST);
};

export default api;
