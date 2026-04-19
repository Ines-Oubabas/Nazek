// frontend/src/services/api.js
import axios from "axios";

const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_URL = RAW_API_URL.replace(/\/$/, ""); // enlève le / final si présent
const API_VERSION = "/api/v1";

// ✅ Instance Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Intercepteur : ajoute le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Extraction robuste des erreurs DRF
const extractErrorMessage = (data) => {
  if (!data) return null;

  // string directe
  if (typeof data === "string") return data;

  // array -> prendre le premier
  if (Array.isArray(data)) {
    return extractErrorMessage(data[0]);
  }

  // objet
  if (typeof data === "object") {
    if (data.detail) return extractErrorMessage(data.detail);
    if (data.message) return extractErrorMessage(data.message);
    if (data.error) return extractErrorMessage(data.error);
    if (data.errors) return extractErrorMessage(data.errors);

    // format DRF classique: { field: ["msg"] }
    const keys = Object.keys(data);
    for (const key of keys) {
      const msg = extractErrorMessage(data[key]);
      if (msg) return `${key}: ${msg}`;
    }
  }

  return null;
};

// ✅ Fonction utilitaire
export const apiRequest = async (url, options = {}) => {
  try {
    const response = await api({
      url,
      ...options,
    });
    return response.data;
  } catch (error) {
    const data = error.response?.data;

    const message =
      extractErrorMessage(data) ||
      `Erreur serveur (${error.response?.status || "??"})`;

    const err = new Error(message);
    err.status = error.response?.status;
    err.data = data;
    throw err;
  }
};

// ✅ URLs EXACTES backend (selon tes urls.py)
export const AUTH_URLS = {
  REGISTER: `${API_VERSION}/auth/register/`,
  LOGIN: `${API_VERSION}/auth/login/`,
  LOGOUT: `${API_VERSION}/auth/logout/`,
  USER: `${API_VERSION}/auth/user/`,
};

export const SERVICE_URLS = {
  LIST: `${API_VERSION}/services/`,
  DETAIL: (id) => `${API_VERSION}/services/${id}/`,
  CREATE: `${API_VERSION}/services/`,
  UPDATE: (id) => `${API_VERSION}/services/${id}/`,
  DELETE: (id) => `${API_VERSION}/services/${id}/`,
};

export const APPOINTMENT_URLS = {
  LIST: `${API_VERSION}/appointments/`,
  CREATE: `${API_VERSION}/appointments/create/`,
  DETAIL: (id) => `${API_VERSION}/appointments/${id}/`,
  REVIEW: (id) => `${API_VERSION}/appointments/${id}/review/`,
  PAYMENT: (id) => `${API_VERSION}/appointments/${id}/payment/`,
  ADD_REVIEW: (id) => `${API_VERSION}/appointments/${id}/add-review/`,
};

export const CLIENT_URLS = {
  PROFILE: `${API_VERSION}/clients/profile/`,
};

export const EMPLOYER_URLS = {
  LIST: `${API_VERSION}/employers/`,
  PROFILE: `${API_VERSION}/employers/profile/`,
  UPDATE: `${API_VERSION}/employers/update/`,
  AVAILABILITIES: (employerId) =>
    `${API_VERSION}/employers/${employerId}/availabilities/`,
};

export const NOTIFICATION_URLS = {
  LIST: `${API_VERSION}/notifications/`,
  MARK_READ: (id) => `${API_VERSION}/notifications/${id}/read/`,
};

export const PAYMENT_URLS = {
  PROCESS: `${API_VERSION}/payments/process/`,
};

/* ------------------------------------------------------------------ */
/* ✅ EXPORTS "COMPAT" POUR ÉVITER LES CRASH (Profile.jsx, etc.)        */
/* ------------------------------------------------------------------ */

export const USER_URLS = {
  PROFILE: CLIENT_URLS.PROFILE,
  UPDATE: EMPLOYER_URLS.UPDATE,
  CHANGE_PASSWORD: `${API_VERSION}/users/change-password/`, // (peut être 404 si route non créée)
};

export const CHANGE_PASSWORD_URL = USER_URLS.CHANGE_PASSWORD;
export const UPDATE_PROFILE_URL = USER_URLS.UPDATE;
export const USERS_URL = USER_URLS;

export const SERVICES_URL = SERVICE_URLS;
export const APPOINTMENTS_URL = APPOINTMENT_URLS;

/* ------------------------------------------------------------------ */
/* ✅ APIs                                                             */
/* ------------------------------------------------------------------ */

export const authAPI = {
  login: (credentials) =>
    apiRequest(AUTH_URLS.LOGIN, { method: "POST", data: credentials }),

  register: (userData) =>
    apiRequest(AUTH_URLS.REGISTER, { method: "POST", data: userData }),

  logout: (refresh) =>
    apiRequest(AUTH_URLS.LOGOUT, { method: "POST", data: { refresh } }),

  getUser: () => apiRequest(AUTH_URLS.USER),
};

export const serviceAPI = {
  list: () => apiRequest(SERVICE_URLS.LIST),
  detail: (id) => apiRequest(SERVICE_URLS.DETAIL(id)),
  create: (data) => apiRequest(SERVICE_URLS.CREATE, { method: "POST", data }),
  update: (id, data) =>
    apiRequest(SERVICE_URLS.UPDATE(id), { method: "PUT", data }),
  delete: (id) => apiRequest(SERVICE_URLS.DELETE(id), { method: "DELETE" }),
};

export const appointmentAPI = {
  list: () => apiRequest(APPOINTMENT_URLS.LIST),

  create: (data) =>
    apiRequest(APPOINTMENT_URLS.CREATE, { method: "POST", data }),

  detail: (id) => apiRequest(APPOINTMENT_URLS.DETAIL(id)),

  update: (id, data) =>
    apiRequest(APPOINTMENT_URLS.DETAIL(id), { method: "PUT", data }),

  delete: (id) =>
    apiRequest(APPOINTMENT_URLS.DETAIL(id), { method: "DELETE" }),

  // ⚠️ si ton backend attend POST pour review/payment, adapte ici plus tard
  review: (id, data) =>
    apiRequest(APPOINTMENT_URLS.REVIEW(id), { method: "POST", data }),

  pay: (id, data) =>
    apiRequest(APPOINTMENT_URLS.PAYMENT(id), { method: "POST", data }),

  addReview: (id, data) =>
    apiRequest(APPOINTMENT_URLS.ADD_REVIEW(id), { method: "POST", data }),
};

export const userAPI = {
  getProfile: async () => {
    try {
      return await apiRequest(EMPLOYER_URLS.PROFILE);
    } catch (e) {
      return apiRequest(CLIENT_URLS.PROFILE);
    }
  },

  updateProfile: async (data) => {
    try {
      return await apiRequest(EMPLOYER_URLS.UPDATE, { method: "PUT", data });
    } catch (e) {
      return apiRequest(CLIENT_URLS.PROFILE, { method: "PUT", data });
    }
  },

  // ⚠️ Si tu l’appelles maintenant -> 404 côté backend (normal si route pas créée)
  changePassword: (data) =>
    apiRequest(CHANGE_PASSWORD_URL, { method: "POST", data }),
};

export const employerAPI = {
  list: () => apiRequest(EMPLOYER_URLS.LIST),
  getAvailabilities: (employerId) =>
    apiRequest(EMPLOYER_URLS.AVAILABILITIES(employerId)),
  setAvailabilities: (employerId, data) =>
    apiRequest(EMPLOYER_URLS.AVAILABILITIES(employerId), {
      method: "POST",
      data,
    }),
};

export const notificationAPI = {
  list: () => apiRequest(NOTIFICATION_URLS.LIST),
  markRead: (id) =>
    apiRequest(NOTIFICATION_URLS.MARK_READ(id), { method: "POST" }),
};

export const paymentAPI = {
  process: (data) =>
    apiRequest(PAYMENT_URLS.PROCESS, { method: "POST", data }),
};

// ✅ utilisé par Search.jsx
export const getServices = async () => apiRequest(SERVICE_URLS.LIST);

export default api;