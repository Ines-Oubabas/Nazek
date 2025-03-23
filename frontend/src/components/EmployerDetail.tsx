import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Badge, Button, Alert, Spinner, ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStar, 
  faClock, 
  faMapMarkerAlt, 
  faPhone, 
  faEnvelope, 
  faCheckCircle,
  faTimesCircle,
  faCalendarAlt,
  faUserTie,
  faInfoCircle,
  faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';
import api from '../api';
import { Employer, Availability, Review } from '../types';

const EmployerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployerData = async () => {
      try {
        const [employerResponse, availabilitiesResponse, reviewsResponse] = await Promise.all([
          api.get(`/employers/${id}/`),
          api.get(`/employers/${id}/availability/`),
          api.get(`/employers/${id}/reviews/`)
        ]);

        setEmployer(employerResponse.data);
        setAvailabilities(availabilitiesResponse.data);
        setReviews(reviewsResponse.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployerData();
  }, [id]);

  const getDayName = (day: number): string => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[day];
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

  if (error || !employer) {
    return (
      <Alert variant="danger">
        {error || 'Prestataire non trouvé'}
      </Alert>
    );
  }

  return (
    <div className="container mt-4">
      <Row>
        <Col md={8}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center mb-4">
                <img
                  src={employer.profile_picture || '/default-avatar.png'}
                  alt={employer.name}
                  className="rounded-circle me-3"
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                />
                <div>
                  <h2 className="mb-1">
                    {employer.name}
                    {employer.is_verified && (
                      <FontAwesomeIcon icon={faCheckCircle} className="text-primary ms-2" />
                    )}
                  </h2>
                  <div className="d-flex align-items-center mb-2">
                    <FontAwesomeIcon icon={faStar} className="text-warning me-1" />
                    <span className="me-2">{employer.average_rating.toFixed(1)}</span>
                    <span className="text-muted">({employer.total_reviews} avis)</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-success me-2" />
                    <span>{employer.hourly_rate} DH/heure</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="mb-3">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  À propos
                </h4>
                <p>{employer.description}</p>
              </div>

              <div className="mb-4">
                <h4 className="mb-3">
                  <FontAwesomeIcon icon={faUserTie} className="me-2" />
                  Services proposés
                </h4>
                <div className="d-flex flex-wrap gap-2">
                  {employer.services.map(service => (
                    <Badge key={service.id} bg="primary" className="p-2">
                      {service.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="mb-3">
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Disponibilités
                </h4>
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
              </div>

              <div>
                <h4 className="mb-3">
                  <FontAwesomeIcon icon={faStar} className="me-2" />
                  Avis clients
                </h4>
                {reviews.length > 0 ? (
                  reviews.map(review => (
                    <Card key={review.id} className="mb-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            {[...Array(5)].map((_, i) => (
                              <FontAwesomeIcon
                                key={i}
                                icon={i < review.rating ? faStar : faStar}
                                className={i < review.rating ? 'text-warning' : 'text-muted'}
                              />
                            ))}
                          </div>
                          <small className="text-muted">
                            {new Date(review.created_at).toLocaleDateString('fr-FR')}
                          </small>
                        </div>
                        <p className="mb-0">{review.comment}</p>
                      </Card.Body>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted">Aucun avis pour le moment</p>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <h4 className="mb-4">Informations de contact</h4>
              
              <div className="mb-3">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-primary" />
                <span>{employer.address}</span>
              </div>

              <div className="mb-3">
                <FontAwesomeIcon icon={faPhone} className="me-2 text-primary" />
                <span>{employer.phone}</span>
              </div>

              <div className="mb-3">
                <FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" />
                <span>{employer.email}</span>
              </div>

              <Button
                variant="primary"
                className="w-100 mt-3"
                onClick={() => navigate(`/appointments/create/${employer.id}`)}
              >
                Prendre rendez-vous
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EmployerDetail; 