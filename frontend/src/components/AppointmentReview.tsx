import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStar,
  faArrowLeft,
  faUserTie,
  faCalendarAlt,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { appointmentAPI } from '@/services/api';

interface Appointment {
  id: number;
  date: string;
  employer: {
    name: string;
    service: {
      name: string;
    };
  };
}

interface ReviewForm {
  rating: number;
  comment: string;
}

const AppointmentReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<ReviewForm>({
    rating: 5,
    comment: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      comment: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.comment.trim()) {
      setError('Veuillez ajouter un commentaire');
      return;
    }

    setSubmitting(true);
    try {
      await appointmentAPI.review(Number(id), formData);
      navigate(`/appointments/${id}`);
    } catch (err) {
      setError('Erreur lors de l\'envoi de l\'avis');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
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
        <Col md={8} className="mx-auto">
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Donner votre avis</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <h6>Rendez-vous avec</h6>
                <div className="d-flex align-items-center mb-2">
                  <FontAwesomeIcon icon={faUserTie} className="fa-2x text-primary me-3" />
                  <div>
                    <h6 className="mb-1">{appointment.employer.name}</h6>
                    <p className="mb-0">{appointment.employer.service.name}</p>
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <div>
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-primary me-2" />
                    {new Date(appointment.date).toLocaleDateString()}
                  </div>
                  <div>
                    <FontAwesomeIcon icon={faClock} className="text-primary me-2" />
                    {new Date(appointment.date).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label>Note</Form.Label>
                  <div className="d-flex gap-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <Button
                        key={rating}
                        type="button"
                        variant={formData.rating >= rating ? 'warning' : 'outline-warning'}
                        className="p-2"
                        onClick={() => handleRatingChange(rating)}
                      >
                        <FontAwesomeIcon icon={faStar} />
                      </Button>
                    ))}
                  </div>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Commentaire</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={formData.comment}
                    onChange={handleCommentChange}
                    placeholder="Décrivez votre expérience..."
                    required
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Envoi en cours...
                    </>
                  ) : (
                    'Envoyer l\'avis'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AppointmentReview;
