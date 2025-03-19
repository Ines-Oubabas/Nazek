import React, { useEffect, useState } from 'react';
import api from '../api';

interface Employer {
  id: number;
  name: string;
  service: string;
  email: string;
  phone: string;
}

interface Appointment {
  id: number;
  client: string;
  service: string;
  date: string;
  status: string;
}

const ProfileEmployer: React.FC = () => {
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const employerResponse = await api.get<Employer>('/employers/me/');
        setEmployer(employerResponse.data);

        const appointmentsResponse = await api.get<Appointment[]>('/employers/me/appointments/');
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
      <h1 className="text-center mb-4">Profil Employeur</h1>

      {employer && (
        <div className="card p-3 mb-4 shadow-sm">
          <h2>{employer.name}</h2>
          <p><strong>Service :</strong> {employer.service}</p>
          <p><strong>Email :</strong> {employer.email}</p>
          <p><strong>Téléphone :</strong> {employer.phone}</p>
        </div>
      )}

      <h2 className="mt-4">Vos Rendez-vous</h2>
      {appointments.length === 0 ? (
        <p className="text-muted">Aucun rendez-vous enregistré.</p>
      ) : (
        <table className="table table-striped table-bordered mt-3">
          <thead className="thead-dark">
            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Service</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td>{appointment.id}</td>
                <td>{appointment.client}</td>
                <td>{appointment.service}</td>
                <td>{new Date(appointment.date).toLocaleString()}</td>
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

export default ProfileEmployer;
