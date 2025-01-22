import React, { useEffect, useState } from 'react';
import api from '../api';

interface Appointment {
  id: number;
  client: {
    name: string;
    email: string;
  };
  employer: {
    name: string;
    service: string;
  };
  service?: {
    name: string;
  }; // Ajout de l'interface pour service
  date: string;
  description: string;
  payment_method: string;
  total_amount: number;
  status: string;
}

const ListAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await api.get<Appointment[]>('/appointments/list/');
        setAppointments(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des rendez-vous :', error);
      }
    };

    fetchAppointments();
  }, []);

  return (
    <div>
      <h1>Liste des rendez-vous</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Client</th>
            <th>Service</th>
            <th>Date</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appointment) => (
            <tr key={appointment.id}>
              <td>{appointment.id}</td>
              <td>{appointment.client.name}</td>
              <td>{appointment.service?.name || 'N/A'}</td> {/* Utilisation de l'objet service */}
              <td>{new Date(appointment.date).toLocaleString()}</td>
              <td>{appointment.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListAppointments;
