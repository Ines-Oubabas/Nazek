import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Carousel } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faCalendarAlt,
  faStar,
  faUserTie,
  faHandshake,
  faClock,
  faMapMarkerAlt,
  faPhone,
  faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import api from '../api';

interface Service {
  id: number;
  name: string;
  description: string;
  icon: string;
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
}

const Home: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [topEmployers, setTopEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesResponse, employersResponse] = await Promise.all([
          api.get('/services/'),
          api.get('/employers/')
        ]);
        setServices(servicesResponse.data);
        setTopEmployers(employersResponse.data.slice(0, 3));
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h1 className="display-4 fw-bold mb-4">
                Trouvez le service dont vous avez besoin
              </h1>
              <p className="lead mb-4">
                Connectez-vous avec des professionnels qualifiés pour tous vos besoins
              </p>
              <Link to="/services">
                <Button variant="light" size="lg" className="me-3">
                  <FontAwesomeIcon icon={faSearch} className="me-2" />
                  Explorer les services
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline-light" size="lg">
                  <FontAwesomeIcon icon={faUserTie} className="me-2" />
                  Devenir prestataire
                </Button>
              </Link>
            </Col>
            <Col md={6}>
              <img
                src="/images/hero-image.jpg"
                alt="Services professionnels"
                className="img-fluid rounded shadow"
              />
            </Col>
          </Row>
        </Container>
      </div>

      {/* Services Section */}
      <Container className="py-5">
        <h2 className="text-center mb-5">Nos Services</h2>
        <Row>
          {services.map(service => (
            <Col key={service.id} md={4} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <FontAwesomeIcon
                    icon={service.icon as any}
                    className="fa-3x text-primary mb-3"
                  />
                  <Card.Title>{service.name}</Card.Title>
                  <Card.Text>{service.description}</Card.Text>
                  <Link to={`/services/${service.id}`}>
                    <Button variant="outline-primary">
                      Voir les prestataires
                    </Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Top Employers Section */}
      <div className="bg-light py-5">
        <Container>
          <h2 className="text-center mb-5">Meilleurs Prestataires</h2>
          <Row>
            {topEmployers.map(employer => (
              <Col key={employer.id} md={4} className="mb-4">
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
                      <FontAwesomeIcon icon={faHandshake} className="text-success me-2" />
                      {employer.service.name}
                    </Card.Text>
                    <Link to={`/employers/${employer.id}`}>
                      <Button variant="outline-primary" className="w-100">
                        Voir le profil
                      </Button>
                    </Link>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </div>

      {/* How It Works Section */}
      <Container className="py-5">
        <h2 className="text-center mb-5">Comment ça marche</h2>
        <Row>
          <Col md={4} className="text-center mb-4">
            <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
              <FontAwesomeIcon icon={faSearch} className="fa-2x" />
            </div>
            <h4>1. Recherchez</h4>
            <p>Trouvez le service dont vous avez besoin</p>
          </Col>
          <Col md={4} className="text-center mb-4">
            <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
              <FontAwesomeIcon icon={faCalendarAlt} className="fa-2x" />
            </div>
            <h4>2. Réservez</h4>
            <p>Choisissez une date et une heure</p>
          </Col>
          <Col md={4} className="text-center mb-4">
            <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
              <FontAwesomeIcon icon={faHandshake} className="fa-2x" />
            </div>
            <h4>3. Profitez</h4>
            <p>Recevez le service à domicile</p>
          </Col>
        </Row>
      </Container>

      {/* Contact Section */}
      <div className="bg-light py-5">
        <Container>
          <h2 className="text-center mb-5">Contactez-nous</h2>
          <Row>
            <Col md={4} className="text-center mb-4">
              <FontAwesomeIcon icon={faPhone} className="fa-2x text-primary mb-3" />
              <h4>Téléphone</h4>
              <p>+213 123 456 789</p>
            </Col>
            <Col md={4} className="text-center mb-4">
              <FontAwesomeIcon icon={faEnvelope} className="fa-2x text-primary mb-3" />
              <h4>Email</h4>
              <p>contact@nazek.com</p>
            </Col>
            <Col md={4} className="text-center mb-4">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="fa-2x text-primary mb-3" />
              <h4>Adresse</h4>
              <p>Alger, Algérie</p>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default Home;
