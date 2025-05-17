import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Alert, Spinner, ListGroup, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faCalendarAlt,
  faClock,
  faUserTie,
  faStar,
  faEdit,
  faHistory,
  faCog,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import { userAPI, appointmentAPI } from '@/services/api';
import { User, Appointment } from '@/types';

const ClientProfile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [userData, appointmentData] = await Promise.all([
          userAPI.getProfile(),
          appointmentAPI.getAll()
        ]);

        setUser(userData);
        setAppointments(appointmentData as Appointment[]);
      } catch (err: any) {
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'warning',
      accepted: 'success',
      rejected: 'danger',
      completed: 'info',
      cancelled: 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </div>
    );
  }

  if (error || !user) {
    return (
      <Alert variant="danger">
        {error || 'Erreur lors du chargement du profil'}
      </Alert>
    );
  }

  return (
    <div className="container mt-4">
      <Row>
        <Col md={4}>
          <Card className="shadow-sm mb-4">
            <Card.Body className="text-center">
              <img
                src={user.profile_picture || '/default-avatar.png'}
                alt={user.username}
                className="rounded-circle mb-3"
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              />
              <h3 className="mb-3">{user.first_name} {user.last_name}</h3>
              <p className="text-muted mb-4">@{user.username}</p>

              <div className="d-grid gap-2">
                <Button variant="outline-primary" onClick={() => navigate('/profile/edit')}>
                  <FontAwesomeIcon icon={faEdit} className="me-2" />
                  Modifier le profil
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate('/settings')}>
                  <FontAwesomeIcon icon={faCog} className="me-2" />
                  Paramètres
                </Button>
                <Button variant="outline-danger" onClick={handleLogout}>
                  <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                  Déconnexion
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Body>
              <h4 className="mb-4">
                <FontAwesomeIcon icon={faUser} className="me-2" />
                Informations personnelles
              </h4>

              <div className="mb-3">
                <FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" />
                <span>{user.email}</span>
              </div>

              <div className="mb-3">
                <FontAwesomeIcon icon={faPhone} className="me-2 text-primary" />
                <span>{user.phone || 'Non renseigné'}</span>
              </div>

              <div className="mb-3">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-primary" />
                <span>{user.address || 'Non renseignée'}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">
                  <FontAwesomeIcon icon={faHistory} className="me-2" />
                  Historique des rendez-vous
                </h4>
                <Button variant="primary" onClick={() => navigate('/appointments/create')}>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Nouveau rendez-vous
                </Button>
              </div>

              {appointments.length > 0 ? (
                <ListGroup>
                  {appointments.map(appointment => (
                    <ListGroup.Item key={appointment.id} className="mb-2">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <h5 className="mb-1">
                            <FontAwesomeIcon icon={faUserTie} className="me-2" />
                            {appointment.employer.first_name} {appointment.employer.last_name}
                          </h5>
                          <div className="text-muted">
                            <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                            {new Date(appointment.date).toLocaleDateString('fr-FR')} -
                            <FontAwesomeIcon icon={faClock} className="me-2" />
                            {new Date(appointment.date).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div>
                          {getStatusBadge(appointment.status)}
                        </div>
                      </div>
                      <p className="mb-2">{appointment.description}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                          {appointment.location}
                        </div>
                        <div>
                          {appointment.review ? (
                            <div className="d-flex align-items-center">
                              <FontAwesomeIcon icon={faStar} className="text-warning me-1" />
                              {appointment.review.rating}
                            </div>
                          ) : (
                            appointment.status === 'completed' && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate(`/appointments/${appointment.id}/review`)}
                              >
                                Laisser un avis
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-3">Aucun rendez-vous pour le moment</p>
                  <Button variant="primary" onClick={() => navigate('/appointments/create')}>
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                    Prendre un rendez-vous
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ClientProfile;
