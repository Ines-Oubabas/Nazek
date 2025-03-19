import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/', // Base API correcte
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Ajouter le token aux requêtes si présent
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour afficher les erreurs en console
api.interceptors.response.use(
  response => response,
  error => {
    console.error("Erreur API:", error.response ? error.response.data : error.message);
    return Promise.reject(error);
  }
);

export default api;
