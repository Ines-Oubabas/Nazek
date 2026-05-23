import axios from "axios";

const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_URL = RAW_API_URL.replace(/\/$/, "");
const API_VERSION = "/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

const extractErrorMessage = (data) => {
  if (!data) return null;
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return extractErrorMessage(data[0]);

  if (typeof data === "object") {
    if (data.detail) return extractErrorMessage(data.detail);
    if (data.message) return extractErrorMessage(data.message);
    if (data.error) return extractErrorMessage(data.error);
    if (data.errors) return extractErrorMessage(data.errors);

    for (const key of Object.keys(data)) {
      const msg = extractErrorMessage(data[key]);
      if (msg) return `${key}: ${msg}`;
    }
  }

  return null;
};

export const apiRequest = async (url, options = {}) => {
  try {
    const response = await api({ url, ...options });
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
  PROCESS: (appointmentId) => `${API_VERSION}/payments/${appointmentId}/process/`,
};

export const USER_URLS = {
  PROFILE: CLIENT_URLS.PROFILE,
  UPDATE: EMPLOYER_URLS.UPDATE,
  CHANGE_PASSWORD: `${API_VERSION}/users/change-password/`,
};

export const CHANGE_PASSWORD_URL = USER_URLS.CHANGE_PASSWORD;
export const UPDATE_PROFILE_URL = USER_URLS.UPDATE;
export const USERS_URL = USER_URLS;

export const SERVICES_URL = SERVICE_URLS;
export const APPOINTMENTS_URL = APPOINTMENT_URLS;

export const authAPI = {
  login: (credentials) =>
    apiRequest(AUTH_URLS.LOGIN, { method: "POST", data: credentials }),

  register: (userData) =>
    apiRequest(AUTH_URLS.REGISTER, { method: "POST", data: userData }),

  logout: (refresh) =>
    apiRequest(AUTH_URLS.LOGOUT, { method: "POST", data: { refresh } }),

  getUser: () => apiRequest(AUTH_URLS.USER),

  deleteMe: () => apiRequest(AUTH_URLS.USER, { method: "DELETE" }),
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
  create: (data) => apiRequest(APPOINTMENT_URLS.CREATE, { method: "POST", data }),
  detail: (id) => apiRequest(APPOINTMENT_URLS.DETAIL(id)),
  update: (id, data) =>
    apiRequest(APPOINTMENT_URLS.DETAIL(id), { method: "PUT", data }),
  delete: (id) => apiRequest(APPOINTMENT_URLS.DETAIL(id), { method: "DELETE" }),
  review: (id, data) =>
    apiRequest(APPOINTMENT_URLS.REVIEW(id), { method: "POST", data }),
  pay: (id, data) =>
    apiRequest(APPOINTMENT_URLS.PAYMENT(id), { method: "POST", data }),
  addReview: (id, data) =>
    apiRequest(APPOINTMENT_URLS.ADD_REVIEW(id), { method: "PUT", data }),
};

export const userAPI = {
  getProfile: async () => {
    try {
      return await apiRequest(EMPLOYER_URLS.PROFILE);
    } catch {
      return apiRequest(CLIENT_URLS.PROFILE);
    }
  },

  updateProfile: async (data) => {
    try {
      return await apiRequest(EMPLOYER_URLS.UPDATE, { method: "PUT", data });
    } catch {
      return apiRequest(CLIENT_URLS.PROFILE, { method: "PUT", data });
    }
  },

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
  process: (appointmentId, data = {}) =>
    apiRequest(PAYMENT_URLS.PROCESS(appointmentId), { method: "POST", data }),
};

export const getServices = async () => apiRequest(SERVICE_URLS.LIST);

export const searchPlacesMapbox = async (query) => {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  if (!token || !query) return [];

  const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
  const resp = await fetch(
    `${endpoint}?access_token=${token}&autocomplete=true&language=fr&limit=5`
  );

  if (!resp.ok) return [];
  const data = await resp.json();
  return Array.isArray(data?.features) ? data.features : [];
};

export default api;