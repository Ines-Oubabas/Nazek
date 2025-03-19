import React, { useEffect, useState } from 'react';
import Spinner from 'react-bootstrap/Spinner';
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
  };
  date: string;
  description: string;
  payment_method: string;
  total_amount: number;
  status: string;
}

const ListAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Récupérer la liste des rendez-vous
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setIsFetching(true);
    try {
      const response = await api.get<Appointment[]>('/appointments/list/');
      setAppointments(response.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors de la récupération des rendez-vous.');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  // Supprimer un rendez-vous
  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce rendez-vous ?')) {
      return;
    }
    
    try {
      await api.delete(`/appointments/${id}/`);
      setAppointments((prevAppointments) => prevAppointments.filter((appointment) => appointment.id !== id));
    } catch (err) {
      setError('Erreur lors de la suppression du rendez-vous.');
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
              <td>{appointment.client.name}</td>
              <td>{appointment.employer.name}</td>
              <td>{appointment.service?.name || 'N/A'}</td>
              <td>{new Date(appointment.date).toLocaleString()}</td>
              <td>{appointment.description || 'Aucune description'}</td>
              <td>{appointment.total_amount} DA</td>
              <td>
                <span className={`badge ${appointment.status === 'en attente' ? 'bg-warning' : 'bg-success'}`}>
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
