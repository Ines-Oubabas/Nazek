import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faClock, faMapMarkerAlt, faInfoCircle, faUserTie } from '@fortawesome/free-solid-svg-icons';
import api from '../api';
import { Service, Employer, Availability } from '../types';

const CreateAppointment: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedEmployer, setSelectedEmployer] = useState<number | null>(null);
  const [employerAvailabilities, setEmployerAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    description: '',
    location: '',
    estimated_duration: 60,
    payment_method: 'especes',
  });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/services/');
        setServices(response.data);
      } catch (err) {
        setError('Erreur lors du chargement des services');
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    const fetchEmployers = async () => {
      if (selectedService) {
        try {
          const response = await api.get(`/employers/?service=${selectedService}`);
          setEmployers(response.data);
        } catch (err) {
          setError('Erreur lors du chargement des employeurs');
        }
      }
    };
    fetchEmployers();
  }, [selectedService]);

  useEffect(() => {
    const fetchAvailabilities = async () => {
      if (selectedEmployer) {
        try {
          const response = await api.get(`/employers/${selectedEmployer}/availability/`);
          setEmployerAvailabilities(response.data);
          generateTimeSlots(response.data);
        } catch (err) {
          setError('Erreur lors du chargement des disponibilités');
        }
      }
    };
    fetchAvailabilities();
  }, [selectedEmployer]);

  const generateTimeSlots = (availabilities: Availability[]) => {
    const slots: string[] = [];
    availabilities.forEach(availability => {
      const start = new Date(`1970-01-01T${availability.start_time}`);
      const end = new Date(`1970-01-01T${availability.end_time}`);
      let current = new Date(start);

      while (current < end) {
        slots.push(current.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
        current.setMinutes(current.getMinutes() + 30);
      }
    });
    setAvailableTimeSlots(slots);
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = parseInt(e.target.value);
    setSelectedService(serviceId);
    setSelectedEmployer(null);
    setFormData({ ...formData, date: '', time: '' });
  };

  const handleEmployerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const employerId = parseInt(e.target.value);
    setSelectedEmployer(employerId);
    setFormData({ ...formData, date: '', time: '' });
  };

  const validateForm = () => {
    if (!selectedService || !selectedEmployer || !formData.date || !formData.time) {
      setError('Veuillez remplir tous les champs obligatoires');
      return false;
    }

    const selectedDate = new Date(`${formData.date}T${formData.time}`);
    if (selectedDate < new Date()) {
      setError('La date et l\'heure doivent être dans le futur');
      return false;
    }

    if (!formData.location) {
      setError('Veuillez spécifier l\'adresse du rendez-vous');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      const appointmentData = {
        ...formData,
        employer: selectedEmployer,
        service: selectedService,
        date: dateTime.toISOString(),
      };

      const response = await api.post('/appointments/create/', appointmentData);
      setSuccessMessage('Rendez-vous créé avec succès ! Vous serez notifié de la réponse de l\'employeur.');
      setTimeout(() => navigate('/client/profile'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la création du rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h2 className="mb-0">
            <FontAwesomeIcon icon={faCalendar} className="me-2" />
            Créer un Rendez-vous
          </h2>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                    Service
                  </Form.Label>
                  <Form.Select
                    value={selectedService || ''}
                    onChange={handleServiceChange}
                    required
                  >
                    <option value="">Sélectionnez un service</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {selectedService && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <FontAwesomeIcon icon={faUserTie} className="me-2" />
                      Prestataire
                    </Form.Label>
                    <Form.Select
                      value={selectedEmployer || ''}
                      onChange={handleEmployerChange}
                      required
                    >
                      <option value="">Sélectionnez un prestataire</option>
                      {employers.map(employer => (
                        <option key={employer.id} value={employer.id}>
                          {employer.name} - {employer.average_rating.toFixed(1)} ⭐ ({employer.total_reviews} avis)
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
            </Row>

            {selectedEmployer && (
              <>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FontAwesomeIcon icon={faCalendar} className="me-2" />
                        Date
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FontAwesomeIcon icon={faClock} className="me-2" />
                        Heure
                      </Form.Label>
                      <Form.Select
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        required
                      >
                        <option value="">Sélectionnez une heure</option>
                        {availableTimeSlots.map(slot => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                    Adresse
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Durée estimée (minutes)</Form.Label>
                      <Form.Control
                        type="number"
                        value={formData.estimated_duration}
                        onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) })}
                        min="30"
                        step="30"
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mode de paiement</Form.Label>
                      <Form.Select
                        value={formData.payment_method}
                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      >
                        <option value="especes">Espèces</option>
                        <option value="carte">Carte Dahabiya</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                      <span className="ms-2">Création en cours...</span>
                    </>
                  ) : (
                    'Créer le rendez-vous'
                  )}
                </Button>
              </>
            )}
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CreateAppointment;
