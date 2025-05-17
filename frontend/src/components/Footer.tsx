import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <div className="container text-center">
        <p className="mb-3">&copy; {new Date().getFullYear()} Nazek - Tous droits réservés.</p>

        <div className="d-flex justify-content-center mb-3">
          <Link to="/" className="mx-3 text-light text-decoration-none">Accueil</Link>
          <Link to="/contact" className="mx-3 text-light text-decoration-none">Contact</Link>
          <Link to="/mentions-legales" className="mx-3 text-light text-decoration-none">Mentions légales</Link>
        </div>

        <div className="d-flex justify-content-center">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2 text-light"
            aria-label="Facebook"
          >
            <FontAwesomeIcon icon={faFacebook} size="2x" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2 text-light"
            aria-label="Instagram"
          >
            <FontAwesomeIcon icon={faInstagram} size="2x" />
          </a>
          <a
            href="https://wa.me/1234567890" // Remplace ce numéro par ton numéro WhatsApp
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2 text-light"
            aria-label="WhatsApp"
          >
            <FontAwesomeIcon icon={faWhatsapp} size="2x" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
