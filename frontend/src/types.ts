// frontend/src/types.ts

export interface Service {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  profile_picture?: string;
}

export interface Employer extends User {
  service: Service;
  hourly_rate: number;
  average_rating: number;
  total_reviews: number;
  is_verified: boolean;
  description: string;
}

export interface Client extends User {}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
}

export type AppointmentStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid';

export interface Appointment {
  id: number;
  date: string;
  status: AppointmentStatus;
  payment_method: string;
  payment_status: PaymentStatus;
  estimated_duration: number;
  location: string;
  description: string;
  total_amount: number;
  client: Client;
  employer: Employer;
  review?: Review;
}

// Pour création de rendez-vous
export interface AppointmentCreation {
  date: string;   // ✅ date complète au format ISO
  time: string;   // ✅ heure
  description: string;
  location: string;
  estimated_duration: number;
  payment_method: string;
  service: number;
  employer: number;
}

export interface Availability {
  id: number;
  start_time: string;
  end_time: string;
  day?: string;
  day_of_week: number;
}
