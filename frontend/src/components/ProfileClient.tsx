import React, { useEffect, useState } from 'react';
import api from '../api';

interface Profile {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Appointment {
  id: number;
  employer: {
    name: string;
    service: string;
  };
  date: string;
  total_amount: number;
  status: string;
  client: {
    id: number;
  };
}

const ProfileClient: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const fetchAppointments = async (clientId: number) => {
    try {
      const response = await api.get<Appointment[]>('/appointments/list/');
      const filteredAppointments = response.data.filter(
        (appointment) => appointment.client.id === clientId
      );
      setAppointments(filteredAppointments);
    } catch (error) {
      console.error('Erreur lors de la récupération des rendez-vous :', error);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get<Profile>('/clients/me/');
        setProfile(response.data);
        fetchAppointments(response.data.id);
      } catch (error) {
        console.error('Erreur lors de la récupération du profil client :', error);
      }
    };

    fetchProfile();
  }, []);

  if (!profile) {
    return <p>Chargement du profil client...</p>;
  }

  return (
    <div>
      <h1>Profil Client</h1>
      <p>Nom : {profile.name}</p>
      <p>Email : {profile.email}</p>
      <p>Téléphone : {profile.phone}</p>
      <h2>Mes Rendez-vous</h2>
      <table>
        <thead>
          <tr>
            <th>Employeur</th>
            <th>Service</th>
            <th>Date</th>
            <th>Montant</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appointment) => (
            <tr key={appointment.id}>
              <td>{appointment.employer.name}</td>
              <td>{appointment.employer.service}</td>
              <td>{new Date(appointment.date).toLocaleString()}</td>
              <td>{appointment.total_amount.toFixed(2)} DA</td>
              <td>{appointment.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProfileClient;
