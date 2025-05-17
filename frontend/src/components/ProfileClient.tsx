import React, { useEffect, useState } from 'react';
import { Card, Button, Form, Alert, Badge, Modal, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faStar, 
  faEdit,
  faCreditCard,
  faCashRegister,
  faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import { appointmentAPI } from '@/services/api';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  profile_picture: string;
}

interface Appointment {
  id: number;
  employer: {
    id: number;
    name: string;
    service: {
      name: string;
    };
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
  feedback?: string;
  rating?: number;
}

const ProfileClient: React.FC = () => {
  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Remplacer par des appels API réels
        const res = await appointmentAPI.getAll();
        setAppointments(res);
        // Dummy user for display
        setClient({
          id: 1,
          name: 'Client Test',
          email: 'client@example.com',
          phone: '0123456789',
          address: '123 rue d\'exemple',
          profile_picture: ''
        });
      } catch (err) {
        setError("Erreur de chargement des rendez-vous");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center mt-5">Chargement...</div>;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!client) return <Alert variant="warning">Client introuvable</Alert>;

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-4">
          <Card className="mb-4">
            <Card.Body className="text-center">
              <img
                src={client.profile_picture || 'https://via.placeholder.com/150'}
                alt="profil"
                className="rounded-circle mb-3"
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              />
              <h3>{client.name}</h3>
              <p><FontAwesomeIcon icon={faUser} className="me-2" />{client.email}</p>
              <p><FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />{client.address}</p>
              <Button variant="outline-primary" className="w-100">
                <FontAwesomeIcon icon={faEdit} className="me-2" />Modifier le profil
              </Button>
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-8">
          <Card>
            <Card.Header><h5>Historique de rendez-vous</h5></Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employeur</th>
                      <th>Service</th>
                      <th>Date</th>
                      <th>Statut</th>
                      <th>Paiement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(app => (
                      <tr key={app.id}>
                        <td>{app.employer.name}</td>
                        <td>{app.service.name}</td>
                        <td>{new Date(app.date).toLocaleString()}</td>
                        <td>
                          <Badge bg={
                            app.status === 'terminé' ? 'info' :
                            app.status === 'accepté' ? 'success' :
                            app.status === 'en_attente' ? 'warning' :
                            'secondary'}>
                            {app.status}
                          </Badge>
                        </td>
                        <td>{app.payment_method || 'Non payé'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileClient;
