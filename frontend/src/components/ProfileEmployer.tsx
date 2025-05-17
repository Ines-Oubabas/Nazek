import React, { useEffect, useState } from 'react';
import { Card, Button, Form, Alert, Badge, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClock, 
  faCalendar, 
  faBell, 
  faUser, 
  faTools, 
  faStar,
  faEdit,
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { appointmentAPI } from '@/services/api';

interface Employer {
  id: number;
  name: string;
  email: string;
  phone: string;
  service: {
    id: number;
    name: string;
    description: string;
  };
  description: string;
  hourly_rate: number;
  average_rating: number;
  total_reviews: number;
  profile_picture: string;
}

interface Availability {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface Appointment {
  id: number;
  client: {
    name: string;
    phone: string;
  };
  service: {
    name: string;
  };
  date: string;
  status: string;
  description: string;
  location: string;
  estimated_duration: number;
  payment_method: string;
  total_amount: number;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  appointment: number;
}

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const ProfileEmployer: React.FC = () => {
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    day_of_week: 0,
    start_time: '',
    end_time: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const appointmentsData = await appointmentAPI.getAll();
        setAppointments(appointmentsData);
        // TODO: Ajouter les fetchs pour employer et notifications si besoin
      } catch (err) {
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAppointmentStatus = async (appointmentId: number, status: string) => {
    try {
      await appointmentAPI.update(appointmentId, { status });
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? { ...apt, status } : apt))
      );
    } catch (err) {
      setError("Erreur lors de la mise à jour du statut");
    }
  };

  if (loading) return <div className="text-center mt-5">Chargement...</div>;
  if (error) return <Alert variant="danger" className="mt-5">{error}</Alert>;
  if (!employer) return <Alert variant="warning" className="mt-5">Employeur non trouvé</Alert>;

  return (
    <div className="container mt-5">
      {/* Contenu de l'interface (profil, rdv, etc.) */}
    </div>
  );
};

export default ProfileEmployer;
