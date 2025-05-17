// frontend/src/services/api.ts

import api from '@/config/api';
import { AxiosError } from 'axios';
import { User, Service, Appointment, Availability, Review, AppointmentCreation, Employer } from '@/types';

// URL principales
export const APPOINTMENTS_URL = '/api/v1/appointments';
export const SERVICES_URL = '/api/v1/services';
export const EMPLOYERS_URL = '/api/v1/employers';
export const CLIENT_PROFILE_URL = '/api/v1/clients/profile';
export const EMPLOYER_PROFILE_URL = '/api/v1/employers/update';
export const NOTIFICATIONS_URL = '/api/v1/notifications';

// Auth
export const authAPI = {
  // ... Ton authAPI existant
};

// Services
export const serviceAPI = {
  list: async () => {
    const response = await api.get<Service[]>(`${SERVICES_URL}/`);
    return response.data;
  },
  detail: async (id: number) => {
    const response = await api.get<Service>(`${SERVICES_URL}/${id}/`);
    return response.data;
  },
};

// ✅ Manquait ça : Appointments
export const appointmentAPI = {
  list: async () => {
    const response = await api.get<Appointment[]>(`${APPOINTMENTS_URL}/`);
    return response.data;
  },
  detail: async (id: number) => {
    const response = await api.get<Appointment>(`${APPOINTMENTS_URL}/${id}/`);
    return response.data;
  },
  create: async (data: AppointmentCreation) => {
    const response = await api.post<Appointment>(`${APPOINTMENTS_URL}/`, data);
    return response.data;
  },
  update: async (id: number, data: Partial<Appointment>) => {
    const response = await api.put<Appointment>(`${APPOINTMENTS_URL}/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`${APPOINTMENTS_URL}/${id}/`);
    return response.data;
  },
  cancel: async (id: number) => {
    const response = await api.post(`${APPOINTMENTS_URL}/${id}/cancel/`);
    return response.data;
  },
  review: async (id: number, review: { rating: number; comment: string }) => {
    const response = await api.post<Review>(`${APPOINTMENTS_URL}/${id}/review/`, review);
    return response.data;
  },
};

// ✅ Manquait ça : Employeurs
export const employerAPI = {
  list: async (serviceId: number) => {
    const response = await api.get<Employer[]>(`${EMPLOYERS_URL}/?service=${serviceId}`);
    return response.data;
  },
  availability: async (employerId: number) => {
    const response = await api.get<Availability[]>(`${EMPLOYERS_URL}/${employerId}/availabilities/`);
    return response.data;
  },
  updateAvailability: async (employerId: number, data: Partial<Availability>) => {
    const response = await api.put(`${EMPLOYERS_URL}/${employerId}/availabilities/`, data);
    return response.data;
  },
};

// ✅ Ton userAPI et notificationsAPI si tu veux les laisser aussi
export const userAPI = {
  profile: async () => {
    const response = await api.get<User>(`${CLIENT_PROFILE_URL}/`);
    return response.data;
  },
  updateProfile: async (data: Partial<User>) => {
    const response = await api.put(`${EMPLOYER_PROFILE_URL}/`, data);
    return response.data;
  },
};

export const notificationAPI = {
  list: async () => {
    const response = await api.get(`${NOTIFICATIONS_URL}/`);
    return response.data;
  },
};
