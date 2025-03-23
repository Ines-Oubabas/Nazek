import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faStar,
  faClock,
  faMapMarkerAlt,
  faUserTie,
  faHandshake
} from '@fortawesome/free-solid-svg-icons';
import api from '../api';

interface Service {
  id: number;
  name: string;
  description: string;
  icon: string;
  employers_count: number;
}

interface Employer {
  id: number;
  name: string;
  service: {
    name: string;
  };
  average_rating: number;
  total_reviews: number;
  hourly_rate: number;
  address: string;
  description: string;
}

const ServiceList: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/services/');
        setServices(response.data);
      } catch (err) {
        setError('Erreur lors du chargement des services');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    const fetchEmployers = async () => {
      if (!selectedService) return;

      try {
        setLoading(true);
        const response = await api.get(`/employers/?service=${selectedService}`);
        setEmployers(response.data);
      } catch (err) {
        setError('Erreur lors du chargement des prestataires');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployers();
  }, [selectedService]);

  const filteredEmployers = employers.filter(employer =>
    employer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employer.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container className="py-5">
      <h1 className="text-center mb-5">Nos Services</h1>

      {/* Services Grid */}
      <Row className="mb-5">
        {services.map(service => (
          <Col key={service.id} md={4} className="mb-4">
            <Card
              className={`h-100 shadow-sm cursor-pointer ${
                selectedService === service.id ? 'border-primary' : ''
              }`}
              onClick={() => setSelectedService(service.id)}
            >
              <Card.Body className="text-center">
                <FontAwesomeIcon
                  icon={service.icon as any}
                  className="fa-3x text-primary mb-3"
                />
                <Card.Title>{service.name}</Card.Title>
                <Card.Text>{service.description}</Card.Text>
                <div className="text-muted">
                  <FontAwesomeIcon icon={faUserTie} className="me-2" />
                  {service.employers_count} prestataires
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Employers List */}
      {selectedService && (
        <div className="mt-5">
          <h2 className="mb-4">Prestataires disponibles</h2>

          <Form.Group className="mb-4">
            <Form.Control
              type="text"
              placeholder="Rechercher un prestataire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow-sm"
            />
          </Form.Group>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Chargement...</span>
              </Spinner>
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : filteredEmployers.length === 0 ? (
            <Alert variant="info">
              Aucun prestataire trouvé pour ce service.
            </Alert>
          ) : (
            <Row>
              {filteredEmployers.map(employer => (
                <Col key={employer.id} md={6} className="mb-4">
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <Card.Title>{employer.name}</Card.Title>
                      <Card.Text>
                        <FontAwesomeIcon icon={faStar} className="text-warning me-1" />
                        {employer.average_rating.toFixed(1)} ({employer.total_reviews} avis)
                      </Card.Text>
                      <Card.Text>
                        <FontAwesomeIcon icon={faClock} className="text-primary me-2" />
                        {employer.hourly_rate} DA/heure
                      </Card.Text>
                      <Card.Text>
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-danger me-2" />
                        {employer.address}
                      </Card.Text>
                      <Card.Text className="text-muted">
                        {employer.description}
                      </Card.Text>
                      <Link to={`/employers/${employer.id}`}>
                        <Button variant="primary" className="w-100">
                          <FontAwesomeIcon icon={faHandshake} className="me-2" />
                          Voir le profil
                        </Button>
                      </Link>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      )}
    </Container>
  );
};

export default ServiceList; 