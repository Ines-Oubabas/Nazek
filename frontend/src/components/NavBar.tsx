import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faSearch,
  faUserTie,
  faUser,
  faCalendarAlt,
  faBell,
  faSignOutAlt,
  faCog,
  faMoon,
  faSun
} from '@fortawesome/free-solid-svg-icons';
import { authAPI, notificationAPI } from '@/services/api';

interface User {
  id: number;
  name: string;
  role: 'client' | 'employer';
  profile_picture?: string;
}

const NavbarComponent: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<number>(0);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await authAPI.getUser();
          setUser(response);
        }
      } catch (err) {
        console.error('Erreur d\'authentification:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const response = await notificationAPI.getNotifications();
        setNotifications(response.filter((n: any) => !n.is_read).length);
      } catch (err) {
        console.error('Erreur lors du chargement des notifications:', err);
      }
    };

    fetchNotifications();
  }, [user]);

  useEffect(() => {
    const savedMode = localStorage.getItem('theme');
    if (savedMode === 'dark') {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  if (loading) {
    return null;
  }

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link as any} to="/" className="fw-bold text-primary">
          Nazek
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link as any} to="/" className="d-flex align-items-center">
              <FontAwesomeIcon icon={faHome} className="me-2" />
              Accueil
            </Nav.Link>
            <Nav.Link as={Link as any} to="/services" className="d-flex align-items-center">
              <FontAwesomeIcon icon={faSearch} className="me-2" />
              Services
            </Nav.Link>
            {user && (
              <Nav.Link as={Link as any} to="/appointments" className="d-flex align-items-center">
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                Rendez-vous
              </Nav.Link>
            )}
          </Nav>

          <Nav className="align-items-center">
            <Button
              variant="outline-secondary"
              className="me-3"
              onClick={toggleDarkMode}
            >
              <FontAwesomeIcon icon={darkMode ? faSun : faMoon} className="me-2" />
              {darkMode ? 'Clair' : 'Sombre'}
            </Button>

            {user ? (
              <>
                <Nav.Link as={Link as any} to="/notifications" className="position-relative">
                  <FontAwesomeIcon icon={faBell} className="me-2" />
                  Notifications
                  {notifications > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {notifications}
                    </span>
                  )}
                </Nav.Link>

                <Dropdown align="end">
                  <Dropdown.Toggle variant="link" className="d-flex align-items-center">
                    {user.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt={user.name}
                        className="rounded-circle me-2"
                        style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={user.role === 'employer' ? faUserTie : faUser}
                        className="me-2"
                      />
                    )}
                    {user.name}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item as={Link as any} to={`/profile/${user.role}`}>
                      <FontAwesomeIcon icon={faUser} className="me-2" />
                      Mon profil
                    </Dropdown.Item>
                    <Dropdown.Item as={Link as any} to="/settings">
                      <FontAwesomeIcon icon={faCog} className="me-2" />
                      Paramètres
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>
                      <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                      Déconnexion
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <>
                <Button
                  variant="outline-primary"
                  as={Link as any}
                  to="/login"
                  className="me-2"
                >
                  Connexion
                </Button>
                <Button
                  variant="primary"
                  as={Link as any}
                  to="/register"
                >
                  Inscription
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
