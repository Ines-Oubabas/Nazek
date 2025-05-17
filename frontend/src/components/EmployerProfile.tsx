import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Alert, Spinner, ListGroup, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faEnvelope, faPhone, faMapMarkerAlt, faCalendarAlt, faClock,
  faUserTie, faStar, faEdit, faHistory, faCog, faSignOutAlt,
  faMoneyBillWave, faCheckCircle, faTimesCircle, faTools
} from '@fortawesome/free-solid-svg-icons';

import { appointmentAPI, userAPI, getServices, employerAPI } from '@/services/api';
import { User, Appointment, Service, Availability, Client } from '@/types';

const EmployerProfile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployerData = async () => {
      try {
        const [userResponse, appointmentsResponse, servicesResponse, availabilitiesResponse] = await Promise.all([
          userAPI.getProfile(),
          appointmentAPI.getAll(),
          getServices(),
          employerAPI.getAvailability(1) // Remplace 1 par l'ID du user si dispo
        ]);
        setUser(userResponse);
        setAppointments(appointmentsResponse);
        setServices(servicesResponse);
        setAvailabilities(availabilitiesResponse);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployerData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleStatusUpdate = async (appointmentId: number, status: Appointment['status']) => {
    try {
      await appointmentAPI.update(appointmentId, { status });
      setAppointments(appointments.map(apt =>
        apt.id === appointmentId ? { ...apt, status } : apt
      ));
      setSuccessMessage('Statut du rendez-vous mis à jour avec succès');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour du statut');
    }
  };

  const getStatusBadge = (status: Appointment['status']) => {
    const variants = {
      pending: 'warning',
      accepted: 'success',
      rejected: 'danger',
      completed: 'info',
      cancelled: 'secondary'
    };
    return <Badge bg={variants[status]}>{status}</Badge>;
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[dayOfWeek];
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
    return <Alert variant="danger">{error || 'Erreur lors du chargement du profil'}</Alert>;
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

          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h4 className="mb-4"><FontAwesomeIcon icon={faUser} className="me-2" /> Informations personnelles</h4>
              <div className="mb-3"><FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" />{user.email}</div>
              <div className="mb-3"><FontAwesomeIcon icon={faPhone} className="me-2 text-primary" />{user.phone || 'Non renseigné'}</div>
              <div className="mb-3"><FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-primary" />{user.address || 'Non renseignée'}</div>
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Body>
              <h4 className="mb-4"><FontAwesomeIcon icon={faTools} className="me-2" /> Services proposés</h4>
              <div className="d-flex flex-wrap gap-2">
                {services.map(service => (
                  <Badge key={service.id} bg="primary" className="p-2">
                    {service.name}
                  </Badge>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0"><FontAwesomeIcon icon={faHistory} className="me-2" /> Rendez-vous</h4>
                <Button variant="primary" onClick={() => navigate('/availability/edit')}>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Gérer les disponibilités
                </Button>
              </div>

              {successMessage && (
                <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
                  {successMessage}
                </Alert>
              )}

              {appointments.length > 0 ? (
                <ListGroup>
                  {appointments.map(appointment => (
                    <ListGroup.Item key={appointment.id} className="mb-2">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <h5 className="mb-1">
                            <FontAwesomeIcon icon={faUser} className="me-2" />
                            {appointment.client.first_name} {appointment.client.last_name}
                          </h5>
                          <div className="text-muted">
                            <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                            {new Date(appointment.date).toLocaleDateString('fr-FR')} {' - '}
                            <FontAwesomeIcon icon={faClock} className="me-2" />
                            {new Date(appointment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div>{getStatusBadge(appointment.status)}</div>
                      </div>
                      <p className="mb-2">{appointment.description}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <div><FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />{appointment.location}</div>
                        <div>
                          {appointment.status === 'pending' && (
                            <div className="d-flex gap-2">
                              <Button size="sm" variant="success" onClick={() => handleStatusUpdate(appointment.id, 'accepted')}>
                                <FontAwesomeIcon icon={faCheckCircle} className="me-1" /> Accepter
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => handleStatusUpdate(appointment.id, 'rejected')}>
                                <FontAwesomeIcon icon={faTimesCircle} className="me-1" /> Refuser
                              </Button>
                            </div>
                          )}
                          {appointment.status === 'accepted' && (
                            <Button size="sm" variant="info" onClick={() => handleStatusUpdate(appointment.id, 'completed')}>
                              Marquer comme terminé
                            </Button>
                          )}
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-4"><p className="text-muted mb-3">Aucun rendez-vous pour le moment</p></div>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Body>
              <h4 className="mb-4"><FontAwesomeIcon icon={faCalendarAlt} className="me-2" /> Disponibilités</h4>
              <ListGroup>
                {availabilities.map(availability => (
                  <ListGroup.Item key={availability.id}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span>{getDayName(availability.day_of_week)}</span>
                      <span>
                        {new Date(`1970-01-01T${availability.start_time}`).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(`1970-01-01T${availability.end_time}`).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EmployerProfile;
