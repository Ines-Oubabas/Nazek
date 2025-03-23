import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faClock,
  faMapMarkerAlt,
  faUserTie,
  faUser,
  faCheckCircle,
  faTimesCircle,
  faStar,
  faMoneyBillWave,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import api from '../api';

interface Appointment {
  id: number;
  date: string;
  status: string;
  payment_method: string;
  payment_status: string;
  estimated_duration: number;
  location: string;
  description: string;
  client: {
    id: number;
    name: string;
    phone: string;
    email: string;
  };
  employer: {
    id: number;
    name: string;
    phone: string;
    email: string;
    service: {
      name: string;
    };
    hourly_rate: number;
  };
  review?: {
    rating: number;
    comment: string;
    created_at: string;
  };
}

const AppointmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await api.get(`/appointments/${id}/`);
        setAppointment(response.data);
      } catch (err) {
        setError('Erreur lors du chargement du rendez-vous');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!appointment) return;

    setProcessing(true);
    try {
      await api.patch(`/appointments/${id}/`, {
        status: newStatus
      });
      setAppointment(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      setError('Erreur lors de la mise à jour du statut');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!appointment) return;

    setProcessing(true);
    try {
      await api.post(`/appointments/${id}/process-payment/`, {
        payment_method: 'card'
      });
      setAppointment(prev => prev ? { ...prev, payment_status: 'paid' } : null);
    } catch (err) {
      setError('Erreur lors du traitement du paiement');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'warning',
      accepted: 'info',
      completed: 'success',
      cancelled: 'danger',
      rejected: 'danger'
    };
    return <Badge bg={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'Rendez-vous non trouvé'}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Button
        variant="outline-primary"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
        Retour
      </Button>

      <Row>
        <Col md={8}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Détails du rendez-vous</h5>
              <div>
                <span className="me-2">Statut :</span>
                {getStatusBadge(appointment.status)}
              </div>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <h6>Informations générales</h6>
                <div className="d-flex flex-wrap gap-3">
                  <div>
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-primary me-2" />
                    {new Date(appointment.date).toLocaleDateString()}
                  </div>
                  <div>
                    <FontAwesomeIcon icon={faClock} className="text-primary me-2" />
                    {new Date(appointment.date).toLocaleTimeString()}
                  </div>
                  <div>
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-primary me-2" />
                    {appointment.location}
                  </div>
                  <div>
                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-primary me-2" />
                    {appointment.estimated_duration * appointment.employer.hourly_rate} DA
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h6>Description</h6>
                <p>{appointment.description}</p>
              </div>

              <div className="mb-4">
                <h6>Prestataire</h6>
                <div className="d-flex align-items-center">
                  <FontAwesomeIcon icon={faUserTie} className="fa-2x text-primary me-3" />
                  <div>
                    <h6 className="mb-1">{appointment.employer.name}</h6>
                    <p className="mb-1">{appointment.employer.service.name}</p>
                    <p className="mb-0">
                      <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                      {appointment.employer.hourly_rate} DA/heure
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h6>Client</h6>
                <div className="d-flex align-items-center">
                  <FontAwesomeIcon icon={faUser} className="fa-2x text-primary me-3" />
                  <div>
                    <h6 className="mb-1">{appointment.client.name}</h6>
                    <p className="mb-1">{appointment.client.email}</p>
                    <p className="mb-0">{appointment.client.phone}</p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {appointment.review && (
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">Avis client</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex align-items-center mb-2">
                  <FontAwesomeIcon icon={faStar} className="text-warning me-2" />
                  <span>{appointment.review.rating}/5</span>
                </div>
                <p className="mb-0">{appointment.review.comment}</p>
                <small className="text-muted">
                  {new Date(appointment.review.created_at).toLocaleDateString()}
                </small>
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Actions</h5>
            </Card.Header>
            <Card.Body>
              {appointment.status === 'pending' && (
                <div className="d-grid gap-2">
                  <Button
                    variant="success"
                    onClick={() => handleStatusUpdate('accepted')}
                    disabled={processing}
                  >
                    <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                    Accepter
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={processing}
                  >
                    <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
                    Refuser
                  </Button>
                </div>
              )}

              {appointment.status === 'accepted' && appointment.payment_status === 'pending' && (
                <Button
                  variant="primary"
                  className="w-100"
                  onClick={handlePayment}
                  disabled={processing}
                >
                  <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                  Payer maintenant
                </Button>
              )}

              {appointment.status === 'accepted' && appointment.payment_status === 'paid' && (
                <Button
                  variant="success"
                  className="w-100"
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={processing}
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                  Marquer comme terminé
                </Button>
              )}

              {appointment.status === 'completed' && !appointment.review && (
                <Button
                  variant="primary"
                  className="w-100"
                  onClick={() => navigate(`/appointments/${id}/review`)}
                >
                  <FontAwesomeIcon icon={faStar} className="me-2" />
                  Laisser un avis
                </Button>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AppointmentDetail; 