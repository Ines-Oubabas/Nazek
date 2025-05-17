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
import { appointmentAPI } from '@/services/api';

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
        const data = await appointmentAPI.detail(Number(id));
        setAppointment(data);
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
      await appointmentAPI.update(appointment.id, { status: newStatus });
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
      await appointmentAPI.update(appointment.id, { payment_method: 'card', payment_status: 'paid' });
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
          {/* ... même contenu, inchangé ... */}
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
