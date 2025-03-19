import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faLinkedin } from '@fortawesome/free-brands-svg-icons';

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <div className="container text-center">
        <p>&copy; {new Date().getFullYear()} Nazek - Tous droits réservés.</p>

        {/* Liens de navigation */}
        <div className="d-flex justify-content-center mb-3">
          <Link to="/" className="mx-3 text-light text-decoration-none">Accueil</Link>
          <Link to="/contact" className="mx-3 text-light text-decoration-none">Contact</Link>
          <Link to="/mentions-legales" className="mx-3 text-light text-decoration-none">Mentions légales</Link>
        </div>

        {/* Icônes des réseaux sociaux */}
        <div className="d-flex justify-content-center">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="mx-2 text-light social-icon">
            <FontAwesomeIcon icon={faFacebook} size="2x" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="mx-2 text-light social-icon">
            <FontAwesomeIcon icon={faTwitter} size="2x" />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="mx-2 text-light social-icon">
            <FontAwesomeIcon icon={faLinkedin} size="2x" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
