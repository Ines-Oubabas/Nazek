import React, { useEffect, useState } from 'react';
import api from '../api';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Appointment {
  id: number;
  service: string;
  date: string;
  description: string;
  status: string;
}

const ProfileClient: React.FC = () => {
  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const clientResponse = await api.get<Client>('/clients/me/');
        setClient(clientResponse.data);

        const appointmentsResponse = await api.get<Appointment[]>('/clients/me/appointments/');
        setAppointments(appointmentsResponse.data);
      } catch (err) {
        setError("Erreur lors de la récupération des données.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleCancelAppointment = async (id: number) => {
    try {
      await api.delete(`/appointments/${id}/`);
      setAppointments(appointments.filter(appointment => appointment.id !== id));
    } catch (err) {
      alert("Erreur lors de l'annulation du rendez-vous.");
    }
  };

  if (loading) return <p className="text-center">Chargement...</p>;
  if (error) return <p className="alert alert-danger text-center">{error}</p>;

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Profil Client</h1>

      {client && (
        <div className="card p-3 mb-4 shadow-sm">
          <h2>{client.name}</h2>
          <p><strong>Email :</strong> {client.email}</p>
          <p><strong>Téléphone :</strong> {client.phone}</p>
        </div>
      )}

      <h2 className="mt-4">Vos Rendez-vous</h2>
      {appointments.length === 0 ? (
        <p className="text-muted">Vous n'avez aucun rendez-vous.</p>
      ) : (
        <table className="table table-striped table-bordered mt-3">
          <thead className="thead-dark">
            <tr>
              <th>ID</th>
              <th>Service</th>
              <th>Date</th>
              <th>Description</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td>{appointment.id}</td>
                <td>{appointment.service}</td>
                <td>{new Date(appointment.date).toLocaleString()}</td>
                <td>{appointment.description || 'Aucune description'}</td>
                <td>
                  <span className={`badge ${appointment.status === 'confirmé' ? 'bg-success' : 'bg-warning'}`}>
                    {appointment.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleCancelAppointment(appointment.id)}>
                    Annuler
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProfileClient;
