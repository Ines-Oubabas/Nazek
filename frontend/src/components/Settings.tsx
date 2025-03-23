import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserLock,
  faBell,
  faLanguage,
  faPalette,
  faSave,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import api from '../api';
import { User } from '../types';

interface Settings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  language: string;
  theme: string;
  privacy: {
    showProfile: boolean;
    showEmail: boolean;
    showPhone: boolean;
  };
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    language: 'fr',
    theme: 'light',
    privacy: {
      showProfile: true,
      showEmail: true,
      showPhone: false
    }
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.post('/users/change-password/', {
        current_password: currentPassword,
        new_password: newPassword
      });

      setSuccessMessage('Mot de passe modifié avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.patch('/users/settings/', settings);
      setSuccessMessage('Paramètres mis à jour avec succès');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour des paramètres');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">
              <FontAwesomeIcon icon={faUserLock} className="me-2" />
              Paramètres
            </h2>
            <Button
              variant="outline-light"
              onClick={() => navigate('/profile')}
            >
              <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
              Retour
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}

          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h4 className="mb-0">
                    <FontAwesomeIcon icon={faUserLock} className="me-2" />
                    Changer le mot de passe
                  </h4>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handlePasswordChange}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mot de passe actuel</Form.Label>
                      <Form.Control
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Nouveau mot de passe</Form.Label>
                      <Form.Control
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Confirmer le nouveau mot de passe</Form.Label>
                      <Form.Control
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
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
                          <span className="ms-2">Modification...</span>
                        </>
                      ) : (
                        'Modifier le mot de passe'
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h4 className="mb-0">
                    <FontAwesomeIcon icon={faBell} className="me-2" />
                    Notifications
                  </h4>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleSettingsUpdate}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        label="Notifications par email"
                        checked={settings.notifications.email}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            email: e.target.checked
                          }
                        })}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        label="Notifications push"
                        checked={settings.notifications.push}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            push: e.target.checked
                          }
                        })}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        label="Notifications SMS"
                        checked={settings.notifications.sms}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            sms: e.target.checked
                          }
                        })}
                      />
                    </Form.Group>
                  </Form>
                </Card.Body>
              </Card>

              <Card className="mb-4">
                <Card.Header>
                  <h4 className="mb-0">
                    <FontAwesomeIcon icon={faLanguage} className="me-2" />
                    Langue et Thème
                  </h4>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleSettingsUpdate}>
                    <Form.Group className="mb-3">
                      <Form.Label>Langue</Form.Label>
                      <Form.Select
                        value={settings.language}
                        onChange={(e) => setSettings({
                          ...settings,
                          language: e.target.value
                        })}
                      >
                        <option value="fr">Français</option>
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Thème</Form.Label>
                      <Form.Select
                        value={settings.theme}
                        onChange={(e) => setSettings({
                          ...settings,
                          theme: e.target.value
                        })}
                      >
                        <option value="light">Clair</option>
                        <option value="dark">Sombre</option>
                        <option value="system">Système</option>
                      </Form.Select>
                    </Form.Group>
                  </Form>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <h4 className="mb-0">
                    <FontAwesomeIcon icon={faPalette} className="me-2" />
                    Confidentialité
                  </h4>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleSettingsUpdate}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        label="Afficher le profil"
                        checked={settings.privacy.showProfile}
                        onChange={(e) => setSettings({
                          ...settings,
                          privacy: {
                            ...settings.privacy,
                            showProfile: e.target.checked
                          }
                        })}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        label="Afficher l'email"
                        checked={settings.privacy.showEmail}
                        onChange={(e) => setSettings({
                          ...settings,
                          privacy: {
                            ...settings.privacy,
                            showEmail: e.target.checked
                          }
                        })}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        label="Afficher le téléphone"
                        checked={settings.privacy.showPhone}
                        onChange={(e) => setSettings({
                          ...settings,
                          privacy: {
                            ...settings.privacy,
                            showPhone: e.target.checked
                          }
                        })}
                      />
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
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
                          <span className="ms-2">Enregistrement...</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faSave} className="me-2" />
                          Enregistrer les paramètres
                        </>
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Settings; 