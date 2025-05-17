import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faClock, faMapMarkerAlt, faInfoCircle, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { appointmentAPI, employerAPI, serviceAPI } from '@/services/api';
import { Service, Employer, Availability, AppointmentCreation } from '@/types';

// Type personnalisé pour gérer les éléments de formulaire de react-bootstrap
type FormControlElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const CreateAppointment: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedEmployer, setSelectedEmployer] = useState<number | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [formData, setFormData] = useState<AppointmentCreation>({
    date: '',
    time: '',
    description: '',
    location: '',
    estimated_duration: 60,
    payment_method: 'especes',
    service: 0,
    employer: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await serviceAPI.list();
        if (Array.isArray(data)) {
          setServices(data);
        } else {
          throw new Error('Invalid data format');
        }
      } catch {
        setError('Erreur lors du chargement des services.');
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (!selectedService) return;
    const fetchEmployers = async () => {
      try {
        const data = await employerAPI.list(selectedService);
        if (Array.isArray(data)) {
          setEmployers(data);
        } else {
          throw new Error('Invalid data format');
        }
      } catch {
        setError('Erreur lors du chargement des employeurs.');
      }
    };
    fetchEmployers();
  }, [selectedService]);

  useEffect(() => {
    if (!selectedEmployer) return;
    const fetchAvailability = async () => {
      try {
        const data = await employerAPI.availability(selectedEmployer);
        if (Array.isArray(data)) {
          generateTimeSlots(data);
        } else {
          throw new Error('Invalid data format');
        }
      } catch {
        setError('Erreur lors du chargement des disponibilités.');
      }
    };
    fetchAvailability();
  }, [selectedEmployer]);

  const generateTimeSlots = (availabilities: Availability[]) => {
    const slots: string[] = [];
    availabilities.forEach((availability) => {
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

  const handleChange = (e: React.ChangeEvent<FormControlElement>) => {
    const { name, value } = e.target;

    // Si le champ est numérique, convertissez la valeur en nombre
    const parsedValue = name === 'estimated_duration' ? parseInt(value, 10) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const validateForm = () => {
    if (!selectedService || !selectedEmployer || !formData.date || !formData.time || !formData.location) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return false;
    }
    const selectedDate = new Date(`${formData.date}T${formData.time}`);
    if (selectedDate < new Date()) {
      setError('La date et l\'heure doivent être dans le futur.');
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
      await appointmentAPI.create({
        ...formData,
        service: selectedService!,
        employer: selectedEmployer!,
        date: dateTime.toISOString(),
      });
      setSuccessMessage('Rendez-vous créé avec succès ! Vous serez notifié de la réponse.');
      setTimeout(() => navigate('/client/profile'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la création du rendez-vous.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h2 className="mb-0">Créer un Rendez-vous</h2>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label><FontAwesomeIcon icon={faInfoCircle} className="me-2" /> Service</Form.Label>
                  <Form.Select name="service" value={selectedService ?? ''} onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setSelectedService(value);
                    setFormData((prev) => ({ ...prev, service: value }));
                  }} required>
                    <option value="">Sélectionnez un service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {selectedService && (
                <Col md={6}>
                  <Form.Group>
                    <Form.Label><FontAwesomeIcon icon={faUserTie} className="me-2" /> Prestataire</Form.Label>
                    <Form.Select name="employer" value={selectedEmployer ?? ''} onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setSelectedEmployer(value);
                      setFormData((prev) => ({ ...prev, employer: value }));
                    }} required>
                      <option value="">Sélectionnez un prestataire</option>
                      {employers.map((employer) => (
                        <option key={employer.id} value={employer.id}>
                          {employer.first_name} {employer.last_name} - {employer.average_rating.toFixed(1)}⭐
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
            </Row>

            {selectedEmployer && (
              <>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label><FontAwesomeIcon icon={faCalendar} className="me-2" /> Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label><FontAwesomeIcon icon={faClock} className="me-2" /> Heure</Form.Label>
                      <Form.Select
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Sélectionnez une heure</option>
                        {availableTimeSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label><FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" /> Adresse</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                  {loading ? (<><Spinner as="span" animation="border" size="sm" /> Création en cours...</>) : "Créer le rendez-vous"}
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