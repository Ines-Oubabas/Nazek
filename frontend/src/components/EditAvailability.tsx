import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faClock } from '@fortawesome/free-solid-svg-icons';
import { appointmentAPI, employerAPI } from '@/services/api';
import { Availability } from '@/types';

const EditAvailability: React.FC = () => {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const response = await employerAPI.getAvailability(1);  // Assurez-vous de remplacer 1 par l'ID de l'employeur
        setAvailability(response);
      } catch (err) {
        setError('Erreur lors de la récupération des disponibilités');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  const handleAvailabilityChange = (index: number, field: string, value: string) => {
    const updatedAvailability = [...availability];
    updatedAvailability[index] = { ...updatedAvailability[index], [field]: value };
    setAvailability(updatedAvailability);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Appel API pour mettre à jour les disponibilités
      await employerAPI.updateAvailability(1, availability); // Remplacez 1 par l'ID de l'employeur
      setSuccessMessage('Disponibilités mises à jour avec succès');
    } catch (err) {
      setError('Erreur lors de la mise à jour des disponibilités');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="container mt-5">
      <h1 className="text-center">Modifier vos disponibilités</h1>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row>
          {availability.map((slot, index) => (
            <Row key={index} className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    <FontAwesomeIcon icon={faCalendar} className="me-2" />
                    Jour
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={slot.day || ''}
                    onChange={(e) => handleAvailabilityChange(index, 'day', e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>
                    <FontAwesomeIcon icon={faClock} className="me-2" />
                    Heure de début
                  </Form.Label>
                  <Form.Control
                    type="time"
                    value={slot.start_time || ''}
                    onChange={(e) => handleAvailabilityChange(index, 'start_time', e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>
                    <FontAwesomeIcon icon={faClock} className="me-2" />
                    Heure de fin
                  </Form.Label>
                  <Form.Control
                    type="time"
                    value={slot.end_time || ''}
                    onChange={(e) => handleAvailabilityChange(index, 'end_time', e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          ))}
        </Row>

        <Button type="submit" variant="primary" className="w-100" disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : 'Mettre à jour les disponibilités'}
        </Button>
      </Form>
    </div>
  );
};

export default EditAvailability;
