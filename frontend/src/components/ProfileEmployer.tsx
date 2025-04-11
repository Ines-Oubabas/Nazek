import React, { useEffect, useState } from 'react';
import { Card, Button, Form, Alert, Badge, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClock, 
  faCalendar, 
  faBell, 
  faUser, 
  faTools, 
  faStar,
  faEdit,
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import api from '../api';

interface Employer {
  id: number;
  name: string;
  email: string;
  phone: string;
  service: {
    id: number;
    name: string;
    description: string;
  };
  description: string;
  hourly_rate: number;
  average_rating: number;
  total_reviews: number;
  profile_picture: string;
}

interface Availability {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface Appointment {
  id: number;
  client: {
    name: string;
    phone: string;
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
}

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  appointment: number;
}

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const ProfileEmployer: React.FC = () => {
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    day_of_week: 0,
    start_time: '',
    end_time: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employerResponse, appointmentsResponse, availabilitiesResponse, notificationsResponse] = await Promise.all([
          api.get('/employers/me/'),
          api.get('/employers/me/appointments/'),
          api.get('/employers/me/availability/'),
          api.get('/notifications/'),
        ]);

        setEmployer(employerResponse.data);
        setAppointments(appointmentsResponse.data);
        setAvailabilities(availabilitiesResponse.data);
        setNotifications(notificationsResponse.data);
      } catch (err) {
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAvailabilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/employers/me/availability/', newAvailability);
      setAvailabilities([...availabilities, response.data]);
      setShowAvailabilityModal(false);
      setNewAvailability({ day_of_week: 0, start_time: '', end_time: '' });
    } catch (err) {
      setError('Erreur lors de l\'ajout de la disponibilité');
    }
  };

  const handleAppointmentStatus = async (appointmentId: number, status: string) => {
    try {
      await api.patch(`/appointments/${appointmentId}/`, { status });
      setAppointments(appointments.map(apt => 
        apt.id === appointmentId ? { ...apt, status } : apt
      ));
    } catch (err) {
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await api.post(`/notifications/${notificationId}/read/`);
      setNotifications(notifications.map(notif =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
    } catch (err) {
      setError('Erreur lors de la mise à jour de la notification');
    }
  };

  if (loading) return <div className="text-center mt-5">Chargement...</div>;
  if (error) return <Alert variant="danger" className="mt-5">{error}</Alert>;
  if (!employer) return <Alert variant="warning" className="mt-5">Employeur non trouvé</Alert>;

  return (
    <div className="container mt-5">
      <div className="row">
        {/* Profil */}
        <div className="col-md-4">
          <Card className="mb-4">
            <Card.Body className="text-center">
              <div className="mb-3">
                <img
                  src={employer.profile_picture || 'https://via.placeholder.com/150'}
                  alt="Photo de profil"
                  className="rounded-circle"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                />
              </div>
              <h3>{employer.name}</h3>
              <p className="text-muted">
                <FontAwesomeIcon icon={faTools} className="me-2" />
                {employer.service.name}
              </p>
              <div className="mb-2">
                <FontAwesomeIcon icon={faStar} className="text-warning" />
                <span className="ms-1">{employer.average_rating.toFixed(1)} ({employer.total_reviews} avis)</span>
              </div>
              <p className="mb-2">
                <FontAwesomeIcon icon={faUser} className="me-2" />
                {employer.email}
              </p>
              <p>
                <FontAwesomeIcon icon={faClock} className="me-2" />
                {employer.hourly_rate} DA/heure
              </p>
              <Button variant="outline-primary" className="w-100">
                <FontAwesomeIcon icon={faEdit} className="me-2" />
                Modifier le profil
              </Button>
            </Card.Body>
          </Card>

          {/* Disponibilités */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Disponibilités</h5>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setShowAvailabilityModal(true)}
              >
                Ajouter
              </Button>
            </Card.Header>
            <Card.Body>
              {availabilities.map(availability => (
                <div key={availability.id} className="mb-2">
                  <Badge bg="info">
                    {DAYS_OF_WEEK[availability.day_of_week]}
                  </Badge>
                  <span className="ms-2">
                    {availability.start_time} - {availability.end_time}
                  </span>
                </div>
              ))}
            </Card.Body>
          </Card>

          {/* Notifications */}
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Notifications</h5>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setShowNotificationModal(true)}
              >
                Voir tout
              </Button>
            </Card.Header>
            <Card.Body>
              {notifications.filter(n => !n.is_read).slice(0, 3).map(notification => (
                <div key={notification.id} className="mb-2">
                  <div className="d-flex justify-content-between">
                    <h6 className="mb-1">{notification.title}</h6>
                    <small className="text-muted">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </small>
                  </div>
                  <p className="mb-1">{notification.message}</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    Marquer comme lu
                  </Button>
                </div>
              ))}
            </Card.Body>
          </Card>
        </div>

        {/* Rendez-vous */}
        <div className="col-md-8">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Rendez-vous</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
              <th>Client</th>
              <th>Service</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
                    {appointments.map(appointment => (
              <tr key={appointment.id}>
                        <td>{appointment.client.name}</td>
                        <td>{appointment.service.name}</td>
                <td>{new Date(appointment.date).toLocaleString()}</td>
                <td>
                          <Badge bg={
                            appointment.status === 'en_attente' ? 'warning' :
                            appointment.status === 'accepté' ? 'success' :
                            appointment.status === 'refusé' ? 'danger' :
                            'secondary'
                          }>
                    {appointment.status}
                          </Badge>
                </td>
                <td>
                          {appointment.status === 'en_attente' && (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                className="me-2"
                                onClick={() => handleAppointmentStatus(appointment.id, 'accepté')}
                              >
                                <FontAwesomeIcon icon={faCheck} />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleAppointmentStatus(appointment.id, 'refusé')}
                              >
                                <FontAwesomeIcon icon={faTimes} />
                              </Button>
                            </>
                          )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Modal Ajout Disponibilité */}
      <Modal show={showAvailabilityModal} onHide={() => setShowAvailabilityModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une disponibilité</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAvailabilitySubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Jour</Form.Label>
              <Form.Select
                value={newAvailability.day_of_week}
                onChange={(e) => setNewAvailability({
                  ...newAvailability,
                  day_of_week: parseInt(e.target.value)
                })}
              >
                {DAYS_OF_WEEK.map((day, index) => (
                  <option key={index} value={index}>{day}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Heure de début</Form.Label>
              <Form.Control
                type="time"
                value={newAvailability.start_time}
                onChange={(e) => setNewAvailability({
                  ...newAvailability,
                  start_time: e.target.value
                })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Heure de fin</Form.Label>
              <Form.Control
                type="time"
                value={newAvailability.end_time}
                onChange={(e) => setNewAvailability({
                  ...newAvailability,
                  end_time: e.target.value
                })}
              />
            </Form.Group>
            <Button type="submit" variant="primary">
              Ajouter
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal Notifications */}
      <Modal show={showNotificationModal} onHide={() => setShowNotificationModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Toutes les notifications</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {notifications.map(notification => (
            <div key={notification.id} className="mb-3">
              <div className="d-flex justify-content-between">
                <h6 className="mb-1">{notification.title}</h6>
                <small className="text-muted">
                  {new Date(notification.created_at).toLocaleString()}
                </small>
              </div>
              <p className="mb-1">{notification.message}</p>
              {!notification.is_read && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  Marquer comme lu
                </Button>
              )}
            </div>
          ))}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ProfileEmployer;
