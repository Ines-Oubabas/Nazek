export interface User {
  id: number;
  name: string;
  email: string;
  role: 'client' | 'employer';
  profile_picture?: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
}

export interface Employer {
  id: number;
  name: string;
  email: string;
  phone: string;
  service: Service;
  description: string;
  hourly_rate: number;
  average_rating: number;
  total_reviews: number;
  is_verified: boolean;
  profile_picture?: string;
  availabilities: Availability[];
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  profile_picture?: string;
}

export interface Availability {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface Appointment {
  id: number;
  client: Client;
  employer: Employer;
  service: Service;
  date: string;
  status: 'en_attente' | 'accepté' | 'refusé' | 'en_cours' | 'terminé' | 'annulé';
  description: string;
  payment_method: 'carte' | 'especes';
  total_amount: number;
  is_paid: boolean;
  feedback?: string;
  rating?: number;
  estimated_duration: number;
  location: string;
}

export interface Notification {
  id: number;
  recipient: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  appointment?: number;
}

export interface Review {
  id: number;
  appointment: number;
  rating: number;
  comment: string;
  created_at: string;
} 