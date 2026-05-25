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

const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refresh_token";

const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = ({ access, refresh } = {}) => {
  if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

const isLikelyHtml = (value) => {
  if (typeof value !== "string") return false;
  const s = value.trim().toLowerCase();
  return s.startsWith("<!doctype html") || s.startsWith("<html") || s.includes("<body");
};

const extractErrorMessage = (data) => {
  if (!data) return null;
  if (typeof data === "string") {
    if (isLikelyHtml(data)) return "Erreur serveur inattendue.";
    return data;
  }
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
    const status = error.response?.status;
    const data = error.response?.data;
    const message =
      extractErrorMessage(data) ||
      (status === 401
        ? "Session expirée ou accès non autorisé."
        : `Erreur serveur (${status || "??"})`);

    const err = new Error(message);
    err.status = status;
    err.data = data;
    throw err;
  }
};

/* =========================================================
 * URLS
 * =======================================================*/

export const AUTH_URLS = {
  REGISTER: `${API_VERSION}/auth/register/`,
  LOGIN: `${API_VERSION}/auth/login/`,
  LOGOUT: `${API_VERSION}/auth/logout/`,
  USER: `${API_VERSION}/auth/user/`,
  PROFILES: `${API_VERSION}/auth/profiles/`,
};

export const USER_URLS = {
  CHANGE_PASSWORD: `${API_VERSION}/users/change-password/`,
};

export const SERVICE_URLS = {
  LIST: `${API_VERSION}/services/`,
  DETAIL: (id) => `${API_VERSION}/services/${id}/`,
  CREATE: `${API_VERSION}/services/`,
  UPDATE: (id) => `${API_VERSION}/services/${id}/`,
  DELETE: (id) => `${API_VERSION}/services/${id}/`,
};

export const SEARCH_URLS = {
  EMPLOYERS: `${API_VERSION}/search/`,
};

export const CLIENT_URLS = {
  PROFILE: `${API_VERSION}/clients/profile/`,
  CREATE_PROFILE: `${API_VERSION}/clients/profile/create/`,
};

export const EMPLOYER_URLS = {
  LIST: `${API_VERSION}/employers/`,
  PROFILE: `${API_VERSION}/employers/profile/`,
  UPDATE: `${API_VERSION}/employers/update/`,
  CREATE_PROFILE: `${API_VERSION}/employers/profile/create/`,
  AVAILABILITIES: (employerId) => `${API_VERSION}/employers/${employerId}/availabilities/`,
};

export const APPOINTMENT_URLS = {
  LIST: `${API_VERSION}/appointments/`,
  CREATE: `${API_VERSION}/appointments/create/`,
  DETAIL: (id) => `${API_VERSION}/appointments/${id}/`,
  CANCEL: (id) => `${API_VERSION}/appointments/${id}/cancel/`,
  ACCEPT: (id) => `${API_VERSION}/appointments/${id}/accept/`,
  REFUSE: (id) => `${API_VERSION}/appointments/${id}/refuse/`,
  REVIEW: (id) => `${API_VERSION}/appointments/${id}/review/`,
  ADD_REVIEW: (id) => `${API_VERSION}/appointments/${id}/add-review/`,
  PAYMENT: (id) => `${API_VERSION}/appointments/${id}/payment/`,
};

export const REVIEW_URLS = {
  LIST_CREATE: `${API_VERSION}/reviews/`,
};

export const FAVORITE_URLS = {
  SERVICES: `${API_VERSION}/favorites/services/`,
  SERVICE_DETAIL: (id) => `${API_VERSION}/favorites/services/${id}/`,
  EMPLOYERS: `${API_VERSION}/favorites/employers/`,
  EMPLOYER_DETAIL: (id) => `${API_VERSION}/favorites/employers/${id}/`,
};

export const MESSAGING_URLS = {
  CONVERSATIONS: `${API_VERSION}/conversations/`,
  MESSAGES: `${API_VERSION}/messages/`,
  MARK_READ: `${API_VERSION}/messages/mark-read/`,
};

export const CONTACT_URLS = {
  CREATE: `${API_VERSION}/contact-requests/`,
  CREATE_ALIAS: `${API_VERSION}/contact/`,
};

export const NOTIFICATION_URLS = {
  LIST: `${API_VERSION}/notifications/`,
  MARK_READ: (id) => `${API_VERSION}/notifications/${id}/read/`,
};

export const PAYMENT_URLS = {
  PROCESS: (appointmentId) => `${API_VERSION}/payments/${appointmentId}/process/`,
};

/* =========================================================
 * AUTH
 * =======================================================*/

export const authAPI = {
  login: async (credentials) => {
    const response = await apiRequest(AUTH_URLS.LOGIN, {
      method: "POST",
      data: credentials,
    });

    const access = response?.access || response?.tokens?.access;
    const refresh = response?.refresh || response?.tokens?.refresh;
    setTokens({ access, refresh });

    return response;
  },

  register: async (userData) => {
    const response = await apiRequest(AUTH_URLS.REGISTER, {
      method: "POST",
      data: userData,
    });

    const access = response?.access || response?.tokens?.access;
    const refresh = response?.refresh || response?.tokens?.refresh;
    setTokens({ access, refresh });

    return response;
  },

  logout: async (refresh) => {
    const refreshToken = refresh || getRefreshToken();
    try {
      if (refreshToken) {
        await apiRequest(AUTH_URLS.LOGOUT, {
          method: "POST",
          data: { refresh: refreshToken },
        });
      }
    } finally {
      clearTokens();
    }
  },

  getUser: () => apiRequest(AUTH_URLS.USER),
  updateUser: (data) => apiRequest(AUTH_URLS.USER, { method: "PATCH", data }),
  putUser: (data) => apiRequest(AUTH_URLS.USER, { method: "PUT", data }),
  getProfiles: () => apiRequest(AUTH_URLS.PROFILES),
  deleteMe: async () => {
    const res = await apiRequest(AUTH_URLS.USER, { method: "DELETE" });
    clearTokens();
    return res;
  },
};

/* =========================================================
 * USERS / PROFILE
 * =======================================================*/

export const userAPI = {
  getProfile: async () => {
    try {
      return await apiRequest(EMPLOYER_URLS.PROFILE);
    } catch {
      return apiRequest(CLIENT_URLS.PROFILE);
    }
  },

  updateProfile: async (data, roleHint = "") => {
    if (roleHint === "employer") {
      return apiRequest(EMPLOYER_URLS.UPDATE, { method: "PATCH", data });
    }
    if (roleHint === "client") {
      return apiRequest(CLIENT_URLS.PROFILE, { method: "PATCH", data });
    }
    try {
      return await apiRequest(EMPLOYER_URLS.UPDATE, { method: "PATCH", data });
    } catch {
      return apiRequest(CLIENT_URLS.PROFILE, { method: "PATCH", data });
    }
  },

  updateUser: (data) => authAPI.updateUser(data),
  createClientProfile: (data = {}) =>
    apiRequest(CLIENT_URLS.CREATE_PROFILE, { method: "POST", data }),
  createEmployerProfile: (data = {}) =>
    apiRequest(EMPLOYER_URLS.CREATE_PROFILE, { method: "POST", data }),
  changePassword: (data) =>
    apiRequest(USER_URLS.CHANGE_PASSWORD, { method: "POST", data }),
};

/* =========================================================
 * SERVICES + SEARCH
 * =======================================================*/

export const serviceAPI = {
  list: () => apiRequest(SERVICE_URLS.LIST),
  detail: (id) => apiRequest(SERVICE_URLS.DETAIL(id)),
  create: (data) => apiRequest(SERVICE_URLS.CREATE, { method: "POST", data }),
  update: (id, data) => apiRequest(SERVICE_URLS.UPDATE(id), { method: "PUT", data }),
  patch: (id, data) => apiRequest(SERVICE_URLS.UPDATE(id), { method: "PATCH", data }),
  delete: (id) => apiRequest(SERVICE_URLS.DELETE(id), { method: "DELETE" }),
};

export const searchAPI = {
  employers: (params = {}) => apiRequest(SEARCH_URLS.EMPLOYERS, { method: "GET", params }),
};

export const employerAPI = {
  list: (params = {}) => apiRequest(EMPLOYER_URLS.LIST, { method: "GET", params }),
  detailFromList: async (id) => {
    const data = await apiRequest(EMPLOYER_URLS.LIST, { method: "GET" });
    const list = Array.isArray(data) ? data : data?.results || [];
    return list.find((e) => Number(e.id) === Number(id)) || null;
  },
  getProfile: () => apiRequest(EMPLOYER_URLS.PROFILE),
  updateProfile: (data) => apiRequest(EMPLOYER_URLS.UPDATE, { method: "PATCH", data }),
  getAvailabilities: (employerId) => apiRequest(EMPLOYER_URLS.AVAILABILITIES(employerId)),
  setAvailabilities: (employerId, data) =>
    apiRequest(EMPLOYER_URLS.AVAILABILITIES(employerId), {
      method: "POST",
      data,
    }),
};

/* =========================================================
 * APPOINTMENTS + PAYMENT + REVIEWS
 * =======================================================*/

export const appointmentAPI = {
  list: () => apiRequest(APPOINTMENT_URLS.LIST),
  create: (data) => apiRequest(APPOINTMENT_URLS.CREATE, { method: "POST", data }),
  detail: (id) => apiRequest(APPOINTMENT_URLS.DETAIL(id)),
  update: (id, data) => apiRequest(APPOINTMENT_URLS.DETAIL(id), { method: "PUT", data }),
  patch: (id, data) => apiRequest(APPOINTMENT_URLS.DETAIL(id), { method: "PATCH", data }),
  delete: (id) => apiRequest(APPOINTMENT_URLS.DETAIL(id), { method: "DELETE" }),
  cancel: (id, reason = "") =>
    apiRequest(APPOINTMENT_URLS.CANCEL(id), { method: "POST", data: { reason } }),
  accept: (id) => apiRequest(APPOINTMENT_URLS.ACCEPT(id), { method: "POST" }),
  refuse: (id, reason = "") =>
    apiRequest(APPOINTMENT_URLS.REFUSE(id), { method: "POST", data: { reason } }),
  review: (id, data) => apiRequest(APPOINTMENT_URLS.REVIEW(id), { method: "POST", data }),
  addReview: (id, data) => apiRequest(APPOINTMENT_URLS.ADD_REVIEW(id), { method: "PUT", data }),
  pay: (id, data) => apiRequest(APPOINTMENT_URLS.PAYMENT(id), { method: "POST", data }),
  processPayment: (appointmentId, data = {}) =>
    apiRequest(PAYMENT_URLS.PROCESS(appointmentId), { method: "POST", data }),
};

/**
 * Stripe readiness check (frontend only).
 * - true => token public Stripe présent côté frontend
 * - false => fallback placeholder
 */
export const isStripeConfigured = () => {
  const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  return Boolean(pk && String(pk).trim().length > 0);
};

/**
 * Tente le flux paiement carte existant.
 * Si backend Stripe n'est pas prêt ou renvoie 404/501 => retourne null pour fallback UI propre.
 */
export const tryStripePaymentOrNull = async (appointmentId, data = {}) => {
  try {
    const response = await appointmentAPI.processPayment(appointmentId, data);
    return response || null;
  } catch (err) {
    if ([404, 405, 500, 501].includes(err?.status)) {
      return null;
    }
    throw err;
  }
};

export const reviewAPI = {
  list: (params = {}) => apiRequest(REVIEW_URLS.LIST_CREATE, { method: "GET", params }),
  create: (data) => apiRequest(REVIEW_URLS.LIST_CREATE, { method: "POST", data }),
};

/* =========================================================
 * FAVORITES
 * =======================================================*/

export const favoritesAPI = {
  listServices: () => apiRequest(FAVORITE_URLS.SERVICES),
  addService: (serviceId) =>
    apiRequest(FAVORITE_URLS.SERVICES, {
      method: "POST",
      data: { service_id: serviceId },
    }),
  removeService: (favoriteId) =>
    apiRequest(FAVORITE_URLS.SERVICE_DETAIL(favoriteId), { method: "DELETE" }),

  listEmployers: () => apiRequest(FAVORITE_URLS.EMPLOYERS),
  addEmployer: (employerId) =>
    apiRequest(FAVORITE_URLS.EMPLOYERS, {
      method: "POST",
      data: { employer_id: employerId },
    }),
  removeEmployer: (favoriteId) =>
    apiRequest(FAVORITE_URLS.EMPLOYER_DETAIL(favoriteId), { method: "DELETE" }),
};

/* =========================================================
 * MESSAGING
 * =======================================================*/

export const messagingAPI = {
  listConversations: () => apiRequest(MESSAGING_URLS.CONVERSATIONS),
  createConversation: (employerId) =>
    apiRequest(MESSAGING_URLS.CONVERSATIONS, {
      method: "POST",
      data: { employer_id: employerId },
    }),

  listMessages: (conversationId) =>
    apiRequest(MESSAGING_URLS.MESSAGES, {
      method: "GET",
      params: { conversation_id: conversationId },
    }),

  sendMessage: (conversationId, content) =>
    apiRequest(MESSAGING_URLS.MESSAGES, {
      method: "POST",
      data: { conversation_id: conversationId, content },
    }),

  markConversationRead: (conversationId) =>
    apiRequest(MESSAGING_URLS.MARK_READ, {
      method: "POST",
      data: { conversation_id: conversationId },
    }),
};

/* =========================================================
 * CONTACT / SUPPORT
 * =======================================================*/

export const contactAPI = {
  create: (data) => apiRequest(CONTACT_URLS.CREATE, { method: "POST", data }),
  createViaAlias: (data) => apiRequest(CONTACT_URLS.CREATE_ALIAS, { method: "POST", data }),
};

/* =========================================================
 * NOTIFICATIONS
 * =======================================================*/

export const notificationAPI = {
  list: () => apiRequest(NOTIFICATION_URLS.LIST),
  markRead: (id) => apiRequest(NOTIFICATION_URLS.MARK_READ(id), { method: "POST" }),
};

/* =========================================================
 * Legacy exports (compat)
 * =======================================================*/

export const CHANGE_PASSWORD_URL = USER_URLS.CHANGE_PASSWORD;
export const UPDATE_PROFILE_URL = AUTH_URLS.USER;
export const USERS_URL = USER_URLS;

export const SERVICES_URL = SERVICE_URLS;
export const APPOINTMENTS_URL = APPOINTMENT_URLS;

export const getServices = async () => apiRequest(SERVICE_URLS.LIST);

/* =========================================================
 * MAPBOX HELPERS
 * =======================================================*/

const MAPBOX_GEOCODE_ENDPOINT = "https://api.mapbox.com/geocoding/v5/mapbox.places";

const pickContextText = (feature, prefix) => {
  const entry = feature?.context?.find((c) => c.id?.startsWith(prefix));
  return entry?.text || "";
};

const normalizePlaceFeature = (feature) => {
  const center = Array.isArray(feature?.center) ? feature.center : [];
  const lng = typeof center[0] === "number" ? center[0] : null;
  const lat = typeof center[1] === "number" ? center[1] : null;

  const city =
    pickContextText(feature, "place.") ||
    feature?.text ||
    pickContextText(feature, "district.") ||
    "";

  const country = pickContextText(feature, "country.");
  const postcode = pickContextText(feature, "postcode.");

  return {
    id: feature?.id || `place_${Math.random().toString(36).slice(2)}`,
    label: feature?.place_name || feature?.text || "",
    address: feature?.place_name || "",
    city,
    country,
    postcode,
    latitude: lat,
    longitude: lng,
    raw: feature,
  };
};

export const isMapboxConfigured = () => {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  return Boolean(token && String(token).trim().length > 0);
};

export const searchPlacesMapbox = async (query, opts = {}) => {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const q = String(query || "").trim();
  if (!token || !q) return [];

  const limit = Number(opts.limit || 6);
  const language = opts.language || "fr";
  const country = opts.country || "";

  const endpoint = `${MAPBOX_GEOCODE_ENDPOINT}/${encodeURIComponent(q)}.json`;
  const params = new URLSearchParams({
    access_token: token,
    autocomplete: "true",
    language,
    limit: String(limit),
    types: "address,place,locality,postcode",
  });

  if (country) params.set("country", country);

  const resp = await fetch(`${endpoint}?${params.toString()}`);
  if (!resp.ok) return [];

  const data = await resp.json();
  const features = Array.isArray(data?.features) ? data.features : [];
  return features.map(normalizePlaceFeature).filter((p) => p.label);
};

export default api;