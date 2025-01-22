import React, { useState, useEffect } from 'react';
import api from '../api';

interface Appointment {
  id: number;
  client: {
    id: number;
    name: string;
  };
  employer: {
    id: number;
    name: string;
    service: string;
  };
  date: string;
  total_amount: number;
  status: string;
}

interface Employer {
  id: number;
  name: string;
  service: string;
}

const ProfileEmployer: React.FC = () => {
  const [profile, setProfile] = useState<Employer | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Récupérer les données de l'employeur
        const response = await api.get<Employer>('/employers/me/');
        setProfile(response.data);

        // Récupérer les rendez-vous filtrés par cet employeur
        const appointmentsResponse = await api.get<Appointment[]>('/appointments/list/');
        const filteredAppointments = appointmentsResponse.data.filter(
          (appointment) => appointment.employer.name === response.data.name
        );
        setAppointments(filteredAppointments);
      } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
      }
    };

    fetchProfile();
  }, []);

  if (!profile) {
    return <p>Chargement du profil...</p>;
  }

  return (
    <div>
      <h1>Profil Employeur</h1>
      <p>Nom : {profile.name}</p>
      <p>Service : {profile.service}</p>
      <h2>Rendez-vous associés</h2>
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Date</th>
            <th>Montant</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appointment) => (
            <tr key={appointment.id}>
              <td>{appointment.client.name}</td>
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

export default ProfileEmployer;
