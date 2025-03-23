// frontend/src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = '/api/v1';
const AUTH_BASE = `${API_VERSION}/auth`;

// URLs d'authentification
export const REGISTER_URL = `${AUTH_BASE}/register/`;
export const LOGIN_URL = `${AUTH_BASE}/login/`;
export const USER_URL = `${AUTH_BASE}/user/`;
export const REFRESH_TOKEN_URL = `${AUTH_BASE}/token/refresh/`;
export const LOGOUT_URL = `${AUTH_BASE}/logout/`;

// URLs des rendez-vous
export const APPOINTMENTS_URL = `${API_VERSION}/appointments/`;
export const CREATE_APPOINTMENT_URL = `${API_VERSION}/appointments/create/`;
export const APPOINTMENT_DETAIL_URL = (id) => `${API_VERSION}/appointments/${id}/`;
export const APPOINTMENT_REVIEW_URL = (id) => `${API_VERSION}/appointments/${id}/review/`;
export const APPOINTMENT_PAYMENT_URL = (id) => `${API_VERSION}/appointments/${id}/payment/`;
export const ADD_REVIEW_URL = (id) => `${API_VERSION}/appointments/${id}/add-review/`;

// URLs des clients et employeurs
export const CLIENT_PROFILE_URL = `${API_VERSION}/clients/profile/`;
export const EMPLOYER_PROFILE_URL = `${API_VERSION}/employers/profile/`;
export const EMPLOYER_UPDATE_URL = `${API_VERSION}/employers/update/`;
export const EMPLOYER_AVAILABILITY_URL = (id) => `${API_VERSION}/employers/${id}/availabilities/`;

// URLs des services et notifications
export const SERVICE_DETAIL_URL = (id) => `${API_VERSION}/services/${id}/`;
export const NOTIFICATIONS_URL = `${API_VERSION}/notifications/`;
export const MARK_NOTIFICATION_READ_URL = (id) => `${API_VERSION}/notifications/${id}/read/`;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
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

// Intercepteur pour gérer les erreurs d'authentification et le rafraîchissement du token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(
          `${API_URL}${REFRESH_TOKEN_URL}`,
          { refresh: refreshToken },
          { withCredentials: true }
        );

        const { access } = response.data;
        localStorage.setItem('token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
