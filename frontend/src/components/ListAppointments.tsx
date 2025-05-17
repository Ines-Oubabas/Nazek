import React, { useEffect, useState } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import { appointmentAPI } from '@/services/api'; // ✅ corriger selon ton organisation
import { Appointment } from '@/types'; // ✅ réutilise si défini dans types.ts

const ListAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setIsFetching(true);
    try {
      const data = await appointmentAPI.getAll(); // ✅ corriger ici avec ton service API
      setAppointments(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors de la récupération des rendez-vous.');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce rendez-vous ?')) return;

    try {
      await appointmentAPI.delete(id); // ✅ appel à ton service
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError('Erreur lors de la suppression du rendez-vous.');
    }
  };

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning';
      case 'accepted': return 'bg-success';
      case 'rejected': return 'bg-danger';
      case 'completed': return 'bg-info';
      case 'cancelled': return 'bg-secondary';
      default: return 'bg-dark';
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger text-center">{error}</div>;
  }

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Liste des rendez-vous</h1>

      {isFetching && (
        <div className="alert alert-info text-center">Mise à jour des rendez-vous...</div>
      )}

      <table className="table table-striped table-bordered">
        <thead className="thead-dark">
          <tr>
            <th>ID</th>
            <th>Client</th>
            <th>Employeur</th>
            <th>Service</th>
            <th>Date</th>
            <th>Description</th>
            <th>Montant</th>
            <th>Statut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appointment) => (
            <tr key={appointment.id}>
              <td>{appointment.id}</td>
              <td>{appointment.client.first_name} {appointment.client.last_name}</td>
              <td>{appointment.employer.first_name} {appointment.employer.last_name}</td>
              <td>{appointment.employer.service.name}</td>
              <td>{new Date(appointment.date).toLocaleString('fr-FR')}</td>
              <td>{appointment.description || 'Aucune description'}</td>
              <td>{appointment.total_amount} DA</td>
              <td>
                <span className={`badge ${getBadgeClass(appointment.status)}`}>
                  {appointment.status}
                </span>
              </td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(appointment.id)}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListAppointments;
