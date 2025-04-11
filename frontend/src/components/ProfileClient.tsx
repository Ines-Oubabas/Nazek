import React, { useEffect, useState } from 'react';
import { Card, Button, Form, Alert, Badge, Modal, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faCalendar, 
  faStar, 
  faEdit,
  faCreditCard,
  faCashRegister,
  faMapMarkerAlt,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import api from '../api';

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

interface Review {
  id: number;
  appointment: number;
  rating: number;
  feedback: string;
  created_at: string;
}

const ProfileClient: React.FC = () => {
  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    feedback: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientResponse, appointmentsResponse, reviewsResponse] = await Promise.all([
          api.get('/clients/me/'),
          api.get('/clients/me/appointments/'),
          api.get('/clients/me/reviews/'),
        ]);

        setClient(clientResponse.data);
        setAppointments(appointmentsResponse.data);
        setReviews(reviewsResponse.data);
      } catch (err) {
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    try {
      const response = await api.post(`/appointments/${selectedAppointment.id}/review/`, reviewForm);
      setReviews([...reviews, response.data]);
      setAppointments(appointments.map(apt =>
        apt.id === selectedAppointment.id
          ? { ...apt, rating: reviewForm.rating, feedback: reviewForm.feedback }
          : apt
      ));
      setShowReviewModal(false);
      setReviewForm({ rating: 5, feedback: '' });
    } catch (err) {
      setError('Erreur lors de l\'envoi de l\'évaluation');
    }
  };

  const handlePayment = async (appointmentId: number, paymentMethod: string) => {
    try {
      await api.post(`/appointments/${appointmentId}/payment/`, { payment_method: paymentMethod });
      setAppointments(appointments.map(apt =>
        apt.id === appointmentId
          ? { ...apt, payment_method: paymentMethod }
          : apt
      ));
    } catch (err) {
      setError('Erreur lors du traitement du paiement');
    }
  };

  if (loading) return <div className="text-center mt-5">Chargement...</div>;
  if (error) return <Alert variant="danger" className="mt-5">{error}</Alert>;
  if (!client) return <Alert variant="warning" className="mt-5">Client non trouvé</Alert>;

  return (
    <div className="container mt-5">
      <div className="row">
        {/* Profil */}
        <div className="col-md-4">
          <Card className="mb-4">
            <Card.Body className="text-center">
              <div className="mb-3">
                <img
                  src={client.profile_picture || 'https://via.placeholder.com/150'}
                  alt="Photo de profil"
                  className="rounded-circle"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                />
              </div>
              <h3>{client.name}</h3>
              <p className="mb-2">
                <FontAwesomeIcon icon={faUser} className="me-2" />
                {client.email}
              </p>
              <p className="mb-2">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                {client.address}
              </p>
              <Button variant="outline-primary" className="w-100">
                <FontAwesomeIcon icon={faEdit} className="me-2" />
                Modifier le profil
              </Button>
            </Card.Body>
          </Card>

          {/* Statistiques */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Statistiques</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <h6>Rendez-vous effectués</h6>
                <ProgressBar
                  now={appointments.filter(apt => apt.status === 'terminé').length}
                  max={appointments.length}
                  label={`${appointments.filter(apt => apt.status === 'terminé').length}/${appointments.length}`}
                />
              </div>
              <div className="mb-3">
                <h6>Note moyenne donnée</h6>
                <div className="d-flex align-items-center">
                  <FontAwesomeIcon icon={faStar} className="text-warning me-2" />
                  <span>
                    {(reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1) || '0.0'}
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Historique des évaluations */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Vos évaluations</h5>
            </Card.Header>
            <Card.Body>
              {reviews.map(review => (
                <div key={review.id} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <div>
                      {[...Array(5)].map((_, i) => (
                        <FontAwesomeIcon
                          key={i}
                          icon={faStar}
                          className={i < review.rating ? 'text-warning' : 'text-muted'}
                        />
                      ))}
                    </div>
                    <small className="text-muted">
                      {new Date(review.created_at).toLocaleDateString()}
                    </small>
                  </div>
                  <p className="mb-0">{review.feedback}</p>
                </div>
              ))}
            </Card.Body>
          </Card>
        </div>

        {/* Rendez-vous */}
        <div className="col-md-8">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Vos Rendez-vous</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employeur</th>
              <th>Service</th>
              <th>Date</th>
              <th>Statut</th>
                      <th>Montant</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
                    {appointments.map(appointment => (
              <tr key={appointment.id}>
                        <td>{appointment.employer.name}</td>
                        <td>{appointment.service.name}</td>
                <td>{new Date(appointment.date).toLocaleString()}</td>
                        <td>
                          <Badge bg={
                            appointment.status === 'en_attente' ? 'warning' :
                            appointment.status === 'accepté' ? 'success' :
                            appointment.status === 'refusé' ? 'danger' :
                            appointment.status === 'terminé' ? 'info' :
                            'secondary'
                          }>
                    {appointment.status}
                          </Badge>
                </td>
                        <td>{appointment.total_amount} DA</td>
                        <td>
                          {appointment.status === 'terminé' && !appointment.rating && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowReviewModal(true);
                              }}
                            >
                              Évaluer
                            </Button>
                          )}
                          {appointment.status === 'accepté' && !appointment.payment_method && (
                            <div className="btn-group">
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="me-2"
                                onClick={() => handlePayment(appointment.id, 'carte')}
                              >
                                <FontAwesomeIcon icon={faCreditCard} className="me-1" />
                                Carte
                              </Button>
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handlePayment(appointment.id, 'espèces')}
                              >
                                <FontAwesomeIcon icon={faCashRegister} className="me-1" />
                                Espèces
                              </Button>
                            </div>
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

      {/* Modal Évaluation */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Évaluer le service</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleReviewSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Note</Form.Label>
              <div className="d-flex">
                {[1, 2, 3, 4, 5].map(rating => (
                  <FontAwesomeIcon
                    key={rating}
                    icon={faStar}
                    className={`me-2 ${rating <= reviewForm.rating ? 'text-warning' : 'text-muted'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setReviewForm({ ...reviewForm, rating })}
                  />
                ))}
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Commentaire</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={reviewForm.feedback}
                onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
              />
            </Form.Group>
            <Button type="submit" variant="primary">
              Envoyer l'évaluation
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ProfileClient;
